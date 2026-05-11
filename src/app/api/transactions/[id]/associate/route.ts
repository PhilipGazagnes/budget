import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// POST: copy tags from a manual entry to a bank transaction, then delete the manual entry
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: bankTxId } = await params;
  const { manualTxId } = await request.json();

  // Fetch tags from the manual transaction
  const { data: manualTags } = await supabase
    .from('transaction_tags')
    .select('tag_id')
    .eq('transaction_id', manualTxId);

  if (manualTags && manualTags.length > 0) {
    await supabase.from('transaction_tags').insert(
      manualTags.map((row) => ({
        transaction_id: bankTxId,
        tag_id: row.tag_id,
      }))
    );
  }

  await supabase.from('transactions').delete().eq('id', manualTxId);

  return NextResponse.json({ ok: true });
}
