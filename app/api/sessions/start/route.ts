import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/db';
import { getCurrentUser, createQRToken, generatePIN } from '@/lib/auth';
import { startSessionSchema } from '@/lib/validation';
import { isCourseActive } from '@/lib/time';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== 'lecturer') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const result = startSessionSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: result.error.errors },
        { status: 400 }
      );
    }

    const { course_id } = result.data;

    // Verify lecturer teaches this course
    const { data: assignment } = await supabaseServer
      .from('course_lecturers')
      .select('*, courses(*)')
      .eq('course_id', course_id)
      .eq('lecturer_id', user.sub)
      .single();

    if (!assignment) {
      return NextResponse.json(
        { error: 'You are not assigned to this course' },
        { status: 403 }
      );
    }

    const course = (assignment as any).courses;

    const courseSchedule = Array.isArray(course.schedule)
      ? course.schedule
      : typeof course.schedule === 'string'
      ? (() => {
          try {
            return JSON.parse(course.schedule);
          } catch {
            return [];
          }
        })()
      : [];

    let courseIsActive = false;

    if (Array.isArray(courseSchedule) && courseSchedule.length > 0) {
      courseIsActive = courseSchedule.some((scheduleEntry: any) =>
        scheduleEntry?.day_of_week && scheduleEntry?.start_time && scheduleEntry?.end_time &&
        isCourseActive(scheduleEntry.day_of_week, scheduleEntry.start_time, scheduleEntry.end_time),
      );
    }

    if (!courseIsActive) {
      courseIsActive = isCourseActive(course.day_of_week, course.start_time, course.end_time);
    }

    if (!courseIsActive) {
      return NextResponse.json(
        { error: 'Course is not currently scheduled (check day, time, and timezone configuration)' },
        { status: 400 }
      );
    }

    // Auto-close any expired active sessions for this course before starting a new one
    const nowIso = new Date().toISOString();
    await supabaseServer
      .from('sessions')
      .update({ status: 'closed', closed_at: nowIso })
      .eq('course_id', course_id)
      .eq('status', 'active')
      .lt('closes_at', nowIso);

    // Check for active sessions still within the attendance window
    const { data: activeSessions } = await supabaseServer
      .from('sessions')
      .select('*')
      .eq('course_id', course_id)
      .eq('status', 'active')
      .gt('closes_at', nowIso)
      .limit(1);

    if (activeSessions && activeSessions.length > 0) {
      return NextResponse.json(
        { error: 'An active session already exists for this course' },
        { status: 409 }
      );
    }

    // Generate QR token and PIN
    const qrToken = await createQRToken(course_id, user.sub, course_id);
    const pinCode = generatePIN();

    // Create session using school timezone so stored closes_at matches validation
    const [hours, minutes] = course.end_time.split(':').map(Number);
    const schoolOffsetMinutes = (await import('@/lib/time')).getSchoolTimezoneOffset();
    const utcNow = Date.now();
    // Build a Date representing current time in school timezone
    const schoolNow = new Date(utcNow + schoolOffsetMinutes * 60 * 1000);
    // Set UTC hours on this date so that toISOString() represents the correct absolute time
    schoolNow.setUTCHours(hours, minutes, 0, 0);

    const { data: session, error } = await supabaseServer
      .from('sessions')
      .insert({
        course_id,
        lecturer_id: user.sub,
        qr_token: qrToken,
        pin_code: pinCode,
        status: 'active',
        closes_at: schoolNow.toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(
      {
        session: {
          id: session.id,
          qr_token: session.qr_token,
          pin_code: session.pin_code,
          closes_at: session.closes_at,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[v0] Start session error:', error);
    return NextResponse.json(
      { error: 'Failed to start session' },
      { status: 500 }
    );
  }
}
