'use client';
import { useEffect, useState, useCallback } from 'react';
import type { Transaction, TagCategory } from '@/lib/types';
import TransactionRow from '@/components/TransactionRow';
import ManualEntryForm from '@/components/ManualEntryForm';
import SpendingCharts from '@/components/SpendingCharts';

function defaultDateRange() {
  const to = new Date();
  const from = new Date(to.getFullYear(), to.getMonth(), 1);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

export default function Home() {
  const [range, setRange] = useState(defaultDateRange);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<TagCategory[]>([]);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [tab, setTab] = useState<'transactions' | 'charts'>('transactions');

  const load = useCallback(async () => {
    const [txRes, catRes, stateRes] = await Promise.all([
      fetch(`/api/transactions?from=${range.from}&to=${range.to}`),
      fetch('/api/tag-categories'),
      fetch('/api/app-state'),
    ]);
    setTransactions(await txRes.json());
    setCategories(await catRes.json());
    const state = await stateRes.json();
    setLastSynced(state.last_synced_at ?? null);
  }, [range.from, range.to]);

  useEffect(() => { load(); }, [load]);

  async function syncNow() {
    setSyncing(true);
    await fetch('/api/sync', { method: 'POST' });
    await load();
    setSyncing(false);
  }

  async function handleTagChange(txId: string, categoryId: string, tagId: string | null) {
    await fetch(`/api/transactions/${txId}/tags`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tagId, categoryId }),
    });
    await load();
  }

  async function handleAssociate(bankTxId: string, manualTxId: string) {
    await fetch(`/api/transactions/${bankTxId}/associate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ manualTxId }),
    });
    await load();
  }

  const manualEntries = transactions.filter((t) => t.source === 'manual');
  function getManualMatches(tx: Transaction): Transaction[] {
    if (tx.source !== 'bank') return [];
    return manualEntries.filter((m) => Math.abs(m.amount - tx.amount) < 0.01);
  }

  const lastSyncedLabel = lastSynced
    ? new Date(lastSynced).getTime() === 0
      ? 'Never'
      : new Date(lastSynced).toLocaleString()
    : '…';

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Budget</h1>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">Synced: {lastSyncedLabel}</span>
          <button
            onClick={syncNow}
            disabled={syncing}
            className="px-3 py-1.5 bg-gray-800 text-white text-sm rounded hover:bg-gray-700 disabled:opacity-50"
          >
            {syncing ? 'Syncing…' : 'Sync now'}
          </button>
          <button
            onClick={async () => {
              await fetch('/api/auth/logout', { method: 'POST' });
              window.location.href = '/login';
            }}
            className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
          >
            Log out
          </button>
        </div>
      </div>

      {/* Date range */}
      <div className="flex items-center gap-3">
        <label className="text-sm text-gray-600">From</label>
        <input
          type="date"
          value={range.from}
          onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))}
          className="border border-gray-300 rounded px-2 py-1 text-sm"
        />
        <label className="text-sm text-gray-600">To</label>
        <input
          type="date"
          value={range.to}
          onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))}
          className="border border-gray-300 rounded px-2 py-1 text-sm"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {(['transactions', 'charts'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm capitalize border-b-2 -mb-px transition-colors ${
              tab === t
                ? 'border-gray-800 text-gray-800 font-medium'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'transactions' && (
        <div className="space-y-4">
          <ManualEntryForm onCreated={load} />
          <div className="space-y-2">
            {transactions.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-8">
                No transactions in this range.
              </p>
            )}
            {transactions.map((tx) => (
              <TransactionRow
                key={tx.id}
                transaction={tx}
                categories={categories}
                manualMatches={getManualMatches(tx)}
                onTagChange={handleTagChange}
                onAssociate={handleAssociate}
              />
            ))}
          </div>
        </div>
      )}

      {tab === 'charts' && (
        <SpendingCharts transactions={transactions} categories={categories} />
      )}
    </div>
  );
}
