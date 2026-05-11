import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { PowensConnector } from '@/lib/bank/powens';
import webpush from 'web-push';

export async function POST(request: Request) {
  webpush.setVapidDetails(
    `mailto:${process.env.VAPID_CONTACT_EMAIL ?? 'admin@example.com'}`,
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );
  // Verify the Bearer token matches our stored Powens user token
  const auth = request.headers.get('Authorization') ?? '';
  const expectedToken = process.env.POWENS_USER_TOKEN;
  if (!expectedToken || auth !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get last sync date to avoid re-importing old transactions
  const { data: stateRow } = await supabase
    .from('app_state')
    .select('value')
    .eq('key', 'last_synced_at')
    .single();

  const lastSynced = stateRow?.value;
  const fromDate =
    lastSynced && new Date(lastSynced).getTime() > 0
      ? lastSynced.slice(0, 10)
      : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const toDate = new Date().toISOString().slice(0, 10);

  const connector = new PowensConnector();
  const transactions = await connector.fetchTransactions(fromDate, toDate);

  let newCount = 0;
  for (const t of transactions) {
    const { error, data } = await supabase
      .from('transactions')
      .upsert(
        {
          external_id: t.externalId,
          date: t.date,
          amount: t.amount,
          currency: t.currency,
          description: t.description,
          source: 'bank',
        },
        { onConflict: 'external_id', ignoreDuplicates: true }
      )
      .select('id');
    if (!error && data && data.length > 0) newCount++;
  }

  await supabase
    .from('app_state')
    .update({ value: new Date().toISOString() })
    .eq('key', 'last_synced_at');

  if (newCount > 0) {
    const { data: subs } = await supabase.from('push_subscriptions').select('subscription');
    if (subs && subs.length > 0) {
      const payload = JSON.stringify({
        title: 'Budget',
        body: `${newCount} new transaction${newCount > 1 ? 's' : ''} to tag`,
      });
      await Promise.allSettled(
        subs.map((row) => webpush.sendNotification(row.subscription, payload))
      );
    }
  }

  return NextResponse.json({ synced: transactions.length, new: newCount });
}
