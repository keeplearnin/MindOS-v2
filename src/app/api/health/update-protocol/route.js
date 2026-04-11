import { NextResponse } from 'next/server';
import { getAuthUser } from '../_lib/auth';

export async function POST(request) {
  const { user, supabase, error } = await getAuthUser();
  if (error) return error;

  let body;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }); }

  const { id, updates } = body;
  if (!id || !updates) {
    return NextResponse.json({ error: 'id and updates are required' }, { status: 400 });
  }

  try {
    const { data, error: updateErr } = await supabase
      .from('health_protocols')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();
    if (updateErr) throw updateErr;

    return NextResponse.json({ protocol: data });
  } catch (err) {
    console.error('update-protocol error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to update protocol' },
      { status: 500 }
    );
  }
}
