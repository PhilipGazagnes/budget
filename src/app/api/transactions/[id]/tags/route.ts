import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// PUT: replace the tag for a given category on a transaction
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: transactionId } = await params;
  const { tagId, categoryId } = await request.json();

  // Remove existing tag for this category
  const { data: existing } = await supabase
    .from('transaction_tags')
    .select('tag_id, tags!inner(category_id)')
    .eq('transaction_id', transactionId);

  type ExistingRow = { tag_id: string; tags: { category_id: string } | { category_id: string }[] };
  const toDelete = ((existing ?? []) as ExistingRow[])
    .filter((row) => {
      const cat = Array.isArray(row.tags) ? row.tags[0] : row.tags;
      return cat?.category_id === categoryId;
    })
    .map((row) => row.tag_id);

  if (toDelete.length > 0) {
    await supabase
      .from('transaction_tags')
      .delete()
      .eq('transaction_id', transactionId)
      .in('tag_id', toDelete);
  }

  if (tagId) {
    const { error } = await supabase
      .from('transaction_tags')
      .insert({ transaction_id: transactionId, tag_id: tagId });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
