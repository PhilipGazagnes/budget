import type { BankConnector, BankTransaction } from './connector';

const BASE_URL = 'https://bankaccountdata.gocardless.com/api/v2';

async function getAccessToken(): Promise<string> {
  const res = await fetch(`${BASE_URL}/token/new/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      secret_id: process.env.GOCARDLESS_SECRET_ID,
      secret_key: process.env.GOCARDLESS_SECRET_KEY,
    }),
  });
  if (!res.ok) throw new Error(`GoCardless auth failed: ${res.status}`);
  const data = await res.json();
  return data.access as string;
}

export class GoCardlessConnector implements BankConnector {
  async fetchTransactions(fromDate: string, toDate: string): Promise<BankTransaction[]> {
    const token = await getAccessToken();
    const accountId = process.env.GOCARDLESS_ACCOUNT_ID;

    const url = new URL(`${BASE_URL}/accounts/${accountId}/transactions/`);
    url.searchParams.set('date_from', fromDate);
    url.searchParams.set('date_to', toDate);

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`GoCardless transactions failed: ${res.status}`);

    const data = await res.json();
    const booked: Record<string, unknown>[] = data.transactions?.booked ?? [];

    return booked.map((t) => ({
      externalId: t.transactionId as string,
      date: (t.bookingDate ?? t.valueDate) as string,
      amount: parseFloat((t.transactionAmount as Record<string, string>)?.amount),
      currency: (t.transactionAmount as Record<string, string>)?.currency,
      description:
        (t.remittanceInformationUnstructured as string) ??
        (t.creditorName as string) ??
        '',
    }));
  }
}
