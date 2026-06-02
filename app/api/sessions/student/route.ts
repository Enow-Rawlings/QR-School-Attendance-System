import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (!supabaseServer) {
      console.error('[v0] Supabase client is not configured');
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
    }

    // Get courses the student is enrolled in
    const enrollRes = await supabaseServer
      .from('course_enrollments')
      .select('course_id')
      .eq('student_id', user.sub);

    if (enrollRes.error) throw enrollRes.error;

    const enrolledCourseIds = enrollRes.data?.map((e: any) => e.course_id) || [];

    // If student isn't enrolled in any courses return empty list
    if (enrolledCourseIds.length === 0) {
      return NextResponse.json({ sessions: [] });
    }

    // Get active sessions for courses student is enrolled in
    const { data: sessions, error } = await supabaseServer
      .from('sessions')
      .select('*, courses(*)')
      .eq('status', 'active')
      .in('course_id', enrolledCourseIds);

    if (error) throw error;

    return NextResponse.json({ sessions: sessions || [] });
  } catch (error) {
    console.error('[v0] Get student sessions error:', error);
    return NextResponse.json(
      { error: 'Failed to get sessions' },
      { status: 500 }
    );
  }
}
