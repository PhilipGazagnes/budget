import type { BankConnector, BankTransaction } from './connector';

const BASE_URL = `https://${process.env.POWENS_DOMAIN}/2.0`;

export class PowensConnector implements BankConnector {
  async fetchTransactions(fromDate: string, toDate: string): Promise<BankTransaction[]> {
    const token = process.env.POWENS_USER_TOKEN;
    if (!token) throw new Error('POWENS_USER_TOKEN not set — run the /connect flow first');

    const url = new URL(`${BASE_URL}/users/me/transactions`);
    url.searchParams.set('min_date', fromDate);
    url.searchParams.set('max_date', toDate);
    url.searchParams.set('coming', 'false'); // exclude pending transactions

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`Powens transactions failed: ${res.status}`);

    const data = await res.json();
    const txs: Record<string, unknown>[] = data.transactions ?? [];

    return txs.map((t) => ({
      externalId: String(t.id),
      date: t.date as string,
      amount: t.value as number,
      currency: 'EUR',
      description: ((t.simplified_wording ?? t.wording ?? t.original_wording) as string) ?? '',
    }));
  }
}
