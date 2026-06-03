import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();

    const updates: Record<string, any> = {};
    if (body.full_name) updates.full_name = body.full_name;
    if (body.student_id) updates.student_id = body.student_id;
    if (body.department) updates.department = body.department;
    if (body.level) updates.level = body.level;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
    }

    if (!supabaseServer) {
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
    }

    const { data, error } = await supabaseServer
      .from('users')
      .update(updates)
      .eq('id', user.sub)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ user: data });
  } catch (error) {
    console.error('[v0] Update user error:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}
