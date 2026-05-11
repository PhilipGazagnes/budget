'use client';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Transaction, TagCategory } from '@/lib/types';

interface Props {
  transactions: Transaction[];
  categories: TagCategory[];
}

export default function SpendingCharts({ transactions, categories }: Props) {
  // Only expenses (negative amounts)
  const expenses = transactions.filter((t) => t.amount < 0);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      {categories.map((cat) => {
        const tagTotals: Record<string, number> = {};
        for (const tx of expenses) {
          const tt = tx.transaction_tags.find((t) => t.tags.category_id === cat.id);
          const label = tt ? tt.tags.name : 'Untagged';
          tagTotals[label] = (tagTotals[label] ?? 0) + Math.abs(tx.amount);
        }

        const chartData = Object.entries(tagTotals).map(([name, value]) => ({ name, value }));
        const tagColorMap = Object.fromEntries(cat.tags.map((t) => [t.name, t.color]));

        if (chartData.length === 0) return null;

        return (
          <div key={cat.id} className="border border-gray-200 rounded-lg p-4">
            <p className="text-sm font-medium mb-3 capitalize">{cat.name}</p>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                >
                  {chartData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={tagColorMap[entry.name] ?? '#9ca3af'}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => (typeof v === 'number' ? v.toFixed(2) : v)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        );
      })}
    </div>
  );
}
