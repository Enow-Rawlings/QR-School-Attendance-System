import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'lecturer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { session_id } = body;

    if (!session_id) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    // Close session
    const { data: session, error } = await supabaseServer
      .from('sessions')
      .update({
        status: 'closed',
        closed_at: new Date().toISOString(),
      })
      .eq('id', session_id)
      .eq('lecturer_id', user.sub)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ session });
  } catch (error) {
    console.error('[v0] Close session error:', error);
    return NextResponse.json(
      { error: 'Failed to close session' },
      { status: 500 }
    );
  }
}
