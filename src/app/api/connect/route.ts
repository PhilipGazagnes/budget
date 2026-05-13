import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const BASE_URL = `https://${process.env.POWENS_DOMAIN}/2.0`;

async function getOrCreateUserToken(): Promise<string> {
  // Prefer env var (set after first connect)
  if (process.env.POWENS_USER_TOKEN) return process.env.POWENS_USER_TOKEN;

  // Fallback: check app_state (stored during the connect flow)
  const { data } = await supabase
    .from('app_state')
    .select('value')
    .eq('key', 'powens_user_token')
    .single();
  if (data?.value) return data.value;

  // First time: create a permanent user
  const res = await fetch(`${BASE_URL}/auth/init`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.POWENS_CLIENT_ID,
      client_secret: process.env.POWENS_CLIENT_SECRET,
    }),
  });
  if (!res.ok) throw new Error(`Powens user creation failed: ${res.status}`);
  const { auth_token } = await res.json();

  await supabase
    .from('app_state')
    .upsert({ key: 'powens_user_token', value: auth_token });

  return auth_token as string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  if (searchParams.get('action') === 'status') {
    if (!process.env.POWENS_USER_TOKEN) return NextResponse.json({ connected: false });
    const res = await fetch(`${BASE_URL}/users/me/connections`, {
      headers: { Authorization: `Bearer ${process.env.POWENS_USER_TOKEN}` },
    });
    if (!res.ok) return NextResponse.json({ connected: false });
    const { connections } = await res.json();
    const active = (connections as { active: boolean }[]).filter((c) => c.active);
    return NextResponse.json({ connected: active.length > 0 });
  }

  const token = await getOrCreateUserToken();

  // Generate a short-lived code for the webview
  const codeRes = await fetch(`${BASE_URL}/auth/token/code`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!codeRes.ok) throw new Error(`Powens temp code failed: ${codeRes.status}`);
  const { code } = await codeRes.json();

  const origin = new URL(request.url).origin;
  const redirectUri = process.env.POWENS_REDIRECT_URI ?? `${origin}/connect`;

  const webviewUrl =
    `https://webview.powens.com/fr/connect` +
    `?domain=${process.env.POWENS_DOMAIN}` +
    `&client_id=${process.env.POWENS_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&code=${code}`;

  return NextResponse.json({ webviewUrl, userToken: token });
}
