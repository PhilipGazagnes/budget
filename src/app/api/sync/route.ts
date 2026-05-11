import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { PowensConnector } from '@/lib/bank/powens';
import webpush from 'web-push';

webpush.setVapidDetails(
  `mailto:${process.env.VAPID_CONTACT_EMAIL ?? 'admin@example.com'}`,
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function POST() {
  const connector = new PowensConnector();

  // Fetch last 90 days to catch delayed transactions
  const toDate = new Date().toISOString().slice(0, 10);
  const from = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const fromDate = from.toISOString().slice(0, 10);

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

  // Update last_synced_at
  await supabase
    .from('app_state')
    .update({ value: new Date().toISOString() })
    .eq('key', 'last_synced_at');

  // Push notification if new untagged transactions found
  if (newCount > 0) {
    const { data: subs } = await supabase.from('push_subscriptions').select('subscription');
    if (subs && subs.length > 0) {
      const payload = JSON.stringify({
        title: 'Budget',
        body: `${newCount} new transaction${newCount > 1 ? 's' : ''} to tag`,
      });
      await Promise.allSettled(
        subs.map((row) =>
          webpush.sendNotification(row.subscription, payload)
        )
      );
    }
  }

  return NextResponse.json({ synced: transactions.length, new: newCount });
}
