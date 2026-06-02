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
      return NextResponse.json({ summary: [] });
    }

    // Get enrolled courses
    const enrollRes = await supabaseServer
      .from('course_enrollments')
      .select('course_id')
      .eq('student_id', user.sub);

    if (enrollRes.error) throw enrollRes.error;

    const courseIds = (enrollRes.data || []).map((e: any) => e.course_id);

    if (courseIds.length === 0) {
      return NextResponse.json({ summary: [] });
    }

    // Get sessions for these courses
    const { data: sessions, error: sessionsErr } = await supabaseServer
      .from('sessions')
      .select('id, course_id')
      .in('course_id', courseIds as string[]);

    if (sessionsErr) throw sessionsErr;

    // Group session ids by course
    const sessionsByCourse: Record<string, string[]> = {};
    (sessions || []).forEach((s: any) => {
      sessionsByCourse[s.course_id] = sessionsByCourse[s.course_id] || [];
      sessionsByCourse[s.course_id].push(s.id);
    });

    const summary: Array<{ course_id: string; total: number }> = [];

    for (const courseId of courseIds) {
      const sIds = sessionsByCourse[courseId] || [];
      if (sIds.length === 0) {
        summary.push({ course_id: courseId, total: 0 });
        continue;
      }

      const { count, error: attErr } = await supabaseServer
        .from('attendance')
        .select('id', { count: 'exact', head: true })
        .eq('student_id', user.sub)
        .in('session_id', sIds);

      if (attErr) throw attErr;

      summary.push({ course_id: courseId, total: (count as number) || 0 });
    }

    return NextResponse.json({ summary });
  } catch (error) {
    console.error('[v0] Get attendance summary error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
