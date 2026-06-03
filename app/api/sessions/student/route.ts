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

    // Get courses the student is directly enrolled in (from enrollments table)
    const enrollRes = await supabaseServer
      .from('course_enrollments')
      .select('course_id')
      .eq('student_id', user.sub);

    if (enrollRes.error) throw enrollRes.error;

    const enrolledCourseIds = enrollRes.data?.map((e: any) => e.course_id) || [];

    // ALSO get courses assigned to student's class (even if not directly enrolled)
    // This handles courses assigned to the class after student registration
    const classCourseIds: string[] = [];
    
    if (user.level && user.department) {
      // Get all classes matching student's level and department
      const classRes = await supabaseServer
        .from('classes')
        .select('id')
        .eq('level', user.level)
        .eq('department', user.department);

      if (classRes.error) throw classRes.error;

      const classIds = (classRes.data || []).map((c: any) => c.id);

      if (classIds.length > 0) {
        // Get all courses assigned to those classes
        const courseClassRes = await supabaseServer
          .from('course_classes')
          .select('course_id')
          .in('class_id', classIds);

        if (courseClassRes.error) throw courseClassRes.error;
        
        classCourseIds.push(...(courseClassRes.data || []).map((cc: any) => cc.course_id));
      }
    }

    // Combine both sources and deduplicate
    const allCourseIds = [...new Set([...enrolledCourseIds, ...classCourseIds])];

    // If student isn't enrolled in any courses return empty list
    if (allCourseIds.length === 0) {
      return NextResponse.json({ sessions: [] });
    }

    // Get active sessions for all accessible courses
    const { data: sessions, error } = await supabaseServer
      .from('sessions')
      .select('*, courses(*)')
      .eq('status', 'active')
      .in('course_id', allCourseIds);

    if (error) throw error;

    // Filter out sessions with null courses (deleted courses)
    const validSessions = (sessions || []).filter((session: any) => session.courses !== null);

    return NextResponse.json({ sessions: validSessions });
  } catch (error) {
    console.error('[v0] Get student sessions error:', error);
    return NextResponse.json(
      { error: 'Failed to get sessions' },
      { status: 500 }
    );
  }
}
