import type { BankConnector, BankTransaction } from './connector';

const BASE_URL = `https://${process.env.POWENS_DOMAIN}/2.0`;

export class PowensConnector implements BankConnector {
  async fetchTransactions(fromDate: string, toDate: string): Promise<BankTransaction[]> {
    const token = process.env.POWENS_USER_TOKEN;
    if (!token) throw new Error('POWENS_USER_TOKEN not set — run the /connect flow first');

    const allTxs: Record<string, unknown>[] = [];
    let offset = 0;
    const limit = 500;

    while (true) {
      const url = new URL(`${BASE_URL}/users/me/transactions`);
      url.searchParams.set('min_date', fromDate);
      url.searchParams.set('max_date', toDate);
      url.searchParams.set('coming', '0');
      url.searchParams.set('limit', String(limit));
      url.searchParams.set('offset', String(offset));

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`Powens transactions failed: ${res.status} — ${body}`);
      }

      const data = await res.json();
      const page: Record<string, unknown>[] = data.transactions ?? [];
      allTxs.push(...page);
      if (page.length < limit) break;
      offset += limit;
    }

    const txs = allTxs;
    return txs.map((t) => ({
      externalId: String(t.id),
      date: t.date as string,
      amount: t.value as number,
      currency: 'EUR',
      description: ((t.simplified_wording ?? t.wording ?? t.original_wording) as string) ?? '',
    }));
  }
}
