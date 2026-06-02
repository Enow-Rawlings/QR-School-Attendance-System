import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== 'lecturer') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Ensure Supabase server client is configured
    if (!supabaseServer) {
      console.error('[v0] Supabase server client not configured');
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    // Get all courses assigned to this lecturer
    const { data: assignments, error } = await supabaseServer
      .from('course_lecturers')
      .select('*, courses(*)')
      .eq('lecturer_id', user.sub);

    if (error) {
      console.error('[v0] Supabase query error:', error);
      return NextResponse.json({ error: error.message || String(error) }, { status: 500 });
    }

    const courses = assignments?.map((a: any) => a.courses) || [];

    // Sort courses by day_of_week then start_time for stable ordering
    const dayOrder: Record<string, number> = {
      Sunday: 0,
      Monday: 1,
      Tuesday: 2,
      Wednesday: 3,
      Thursday: 4,
      Friday: 5,
      Saturday: 6,
    };

    courses.sort((a: any, b: any) => {
      const aDay = dayOrder[a.day_of_week] ?? 99;
      const bDay = dayOrder[b.day_of_week] ?? 99;
      if (aDay !== bDay) return aDay - bDay;
      return (a.start_time || '').localeCompare(b.start_time || '');
    });

    return NextResponse.json({ courses });
  } catch (error) {
    console.error('[v0] Get my courses error:', error);
    return NextResponse.json(
      { error: 'Failed to get courses' },
      { status: 500 }
    );
  }
}
