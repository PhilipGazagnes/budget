export interface BankTransaction {
  externalId: string;
  date: string; // ISO date string YYYY-MM-DD
  amount: number; // negative = debit, positive = credit
  currency: string;
  description: string;
}

export interface BankConnector {
  fetchTransactions(fromDate: string, toDate: string): Promise<BankTransaction[]>;
}
