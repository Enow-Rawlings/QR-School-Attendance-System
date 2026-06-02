import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    if (!supabaseServer) {
      return NextResponse.json(
        { error: 'Server misconfigured' },
        { status: 500 }
      );
    }

    const { data, error } = await supabaseServer
      .from('users')
      .select('id,email,full_name,role,student_id,department,level')
      .eq('id', user.sub)
      .single();

    if (error || !data) {
      console.error('[v0] Get current user error:', error);
      return NextResponse.json(
        { error: 'Failed to get user' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { user: data },
      { status: 200 }
    );
  } catch (error) {
    console.error('[v0] Get current user error:', error);
    return NextResponse.json(
      { error: 'Failed to get user' },
      { status: 500 }
    );
  }
}
