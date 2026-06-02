import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get session_id from query params
    const sessionId = request.nextUrl.searchParams.get('session_id');
    if (!sessionId) {
      return NextResponse.json(
        { error: 'session_id query parameter required' },
        { status: 400 }
      );
    }

    // Verify user has access to this session
    let hasAccess = false;

    if (user.role === 'lecturer') {
      // Lecturer can see attendance for their sessions
      const { data: session } = await supabaseServer
        .from('sessions')
        .select('*')
        .eq('id', sessionId)
        .eq('lecturer_id', user.sub)
        .single();
      hasAccess = !!session;
    } else if (user.role === 'student') {
      // Student can only see their own attendance
      const { data: attendance } = await supabaseServer
        .from('attendance')
        .select('*')
        .eq('session_id', sessionId)
        .eq('student_id', user.sub)
        .single();
      hasAccess = !!attendance;
    }

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied to this session' },
        { status: 403 }
      );
    }

    // Get all attendance records for session
    const { data: records, error } = await supabaseServer
      .from('attendance')
      .select('*, users!student_id(id, full_name, student_id, email)')
      .eq('session_id', sessionId)
      .order('marked_at');

    if (error) throw error;

    return NextResponse.json({ attendance: records || [] });
  } catch (error) {
    console.error('[v0] Get attendance error:', error);
    return NextResponse.json(
      { error: 'Failed to get attendance' },
      { status: 500 }
    );
  }
}
