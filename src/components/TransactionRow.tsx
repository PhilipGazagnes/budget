'use client';
import { useState } from 'react';
import type { Transaction, TagCategory } from '@/lib/types';
import TagPicker from './TagPicker';

interface Props {
  transaction: Transaction;
  categories: TagCategory[];
  manualMatches: Transaction[];
  onTagChange: (txId: string, categoryId: string, tagId: string | null) => Promise<void>;
  onAssociate: (bankTxId: string, manualTxId: string) => Promise<void>;
}

export default function TransactionRow({
  transaction: tx,
  categories,
  manualMatches,
  onTagChange,
  onAssociate,
}: Props) {
  const [associating, setAssociating] = useState(false);

  const selectedTagByCategoryId = Object.fromEntries(
    tx.transaction_tags.map((tt) => [tt.tags.category_id, tt.tag_id])
  );

  const amountColor = tx.amount < 0 ? 'text-red-600' : 'text-green-600';
  const amountStr = `${tx.amount < 0 ? '−' : '+'}${Math.abs(tx.amount).toFixed(2)} ${tx.currency}`;

  return (
    <div className="border border-gray-200 rounded-lg p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{tx.description || '—'}</p>
          <p className="text-xs text-gray-500">{tx.date}</p>
          {tx.source === 'manual' && (
            <span className="text-xs bg-yellow-100 text-yellow-700 rounded px-1">manual</span>
          )}
        </div>
        <span className={`text-sm font-semibold whitespace-nowrap ${amountColor}`}>
          {amountStr}
        </span>
      </div>

      <div className="space-y-1">
        {categories.map((cat) => (
          <TagPicker
            key={cat.id}
            category={cat}
            selectedTagId={selectedTagByCategoryId[cat.id]}
            onChange={(catId, tagId) => onTagChange(tx.id, catId, tagId)}
          />
        ))}
      </div>

      {manualMatches.length > 0 && (
        <div className="bg-blue-50 rounded p-2 space-y-1">
          <p className="text-xs font-medium text-blue-700">Possible manual match:</p>
          {manualMatches.map((m) => (
            <div key={m.id} className="flex items-center justify-between text-xs">
              <span className="text-blue-600">
                {m.description} — {m.date}
              </span>
              <button
                disabled={associating}
                onClick={async () => {
                  setAssociating(true);
                  await onAssociate(tx.id, m.id);
                  setAssociating(false);
                }}
                className="ml-2 px-2 py-0.5 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                Associate & delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
