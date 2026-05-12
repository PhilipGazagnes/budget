import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { encrypt } from '@/lib/session';

export async function POST(req: NextRequest) {
  const { password } = await req.json();

  const expected = process.env.APP_PASSWORD ?? '';
  const match =
    password.length === expected.length &&
    timingSafeEqual(Buffer.from(password), Buffer.from(expected));

  if (!match) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  }

  const token = await encrypt();
  const res = NextResponse.json({ ok: true });
  res.cookies.set('budget_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
  });
  return res;
}
