'use client';
import { useState } from 'react';

interface Props {
  onCreated: () => void;
}

export default function ManualEntryForm({ onCreated }: Props) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ date: '', amount: '', description: '' });
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: form.date,
        amount: parseFloat(form.amount),
        description: form.description,
      }),
    });
    setSaving(false);
    setOpen(false);
    setForm({ date: '', amount: '', description: '' });
    onCreated();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="px-3 py-1.5 bg-gray-800 text-white text-sm rounded hover:bg-gray-700"
      >
        + Manual entry
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="border border-gray-200 rounded-lg p-4 space-y-3 bg-white">
      <p className="text-sm font-medium">New manual entry</p>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-gray-500">Date</label>
          <input
            type="date"
            required
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className="block w-full mt-0.5 border border-gray-300 rounded px-2 py-1 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500">Amount (negative = expense)</label>
          <input
            type="number"
            step="0.01"
            required
            placeholder="-12.50"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            className="block w-full mt-0.5 border border-gray-300 rounded px-2 py-1 text-sm"
          />
        </div>
      </div>
      <div>
        <label className="text-xs text-gray-500">Description</label>
        <input
          type="text"
          required
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="block w-full mt-0.5 border border-gray-300 rounded px-2 py-1 text-sm"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="px-3 py-1.5 bg-gray-800 text-white text-sm rounded hover:bg-gray-700 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
