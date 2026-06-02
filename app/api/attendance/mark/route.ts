import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { supabaseServer } from '@/lib/db';
import { getCurrentUser, verifyQRToken, hashToken } from '@/lib/auth';
import { markAttendanceSchema } from '@/lib/validation';
import { checkRateLimit, attendanceLimiter } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Rate limiting
    const rateLimit = await checkRateLimit(attendanceLimiter, user.sub);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Too many attempts. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const result = markAttendanceSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid attendance data', details: result.error.errors },
        { status: 400 }
      );
    }

    const { session_id, qr_token, pin_code } = result.data;

    // Get session
    const { data: session, error: sessionError } = await supabaseServer
      .from('sessions')
      .select('*')
      .eq('id', session_id)
      .eq('status', 'active')
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found or closed' },
        { status: 404 }
      );
    }

    // Verify time window not closed
    if (new Date() > new Date(session.closes_at)) {
      return NextResponse.json(
        { error: 'Attendance window closed' },
        { status: 400 }
      );
    }

    // Verify QR token
    const qrPayload = await verifyQRToken(qr_token);
    if (!qrPayload || qrPayload.sub !== session_id) {
      return NextResponse.json(
        { error: 'Invalid QR token' },
        { status: 401 }
      );
    }

    // Verify PIN
    if (session.pin_code !== pin_code) {
      return NextResponse.json(
        { error: 'Invalid PIN' },
        { status: 401 }
      );
    }

    // Check if token already used
    const tokenHash = await hashToken(qr_token);
    const { data: usedToken } = await supabaseServer
      .from('used_tokens')
      .select('*')
      .eq('token_hash', tokenHash)
      .single();

    if (usedToken) {
      return NextResponse.json(
        { error: 'This QR code has already been used' },
        { status: 409 }
      );
    }

    // Check for duplicate attendance
    const { data: existingAttendance } = await supabaseServer
      .from('attendance')
      .select('*')
      .eq('session_id', session_id)
      .eq('student_id', user.sub)
      .single();

    if (existingAttendance) {
      return NextResponse.json(
        { error: 'You have already marked attendance for this session' },
        { status: 409 }
      );
    }

    // Verify student enrolled in course
    const { data: enrollment } = await supabaseServer
      .from('course_enrollments')
      .select('*')
      .eq('course_id', session.course_id)
      .eq('student_id', user.sub)
      .single();

    if (!enrollment) {
      return NextResponse.json(
        { error: 'You are not enrolled in this course' },
        { status: 403 }
      );
    }

    // Handle photo upload (if provided)
    let photoUrl = null;
    if (body.photo_base64) {
      try {
        const buffer = Buffer.from(body.photo_base64, 'base64');
        const filename = `attendance/${session_id}/${user.sub}-${Date.now()}.jpg`;
        const blob = await put(filename, buffer, {
          access: 'private',
          contentType: 'image/jpeg',
        });
        photoUrl = blob.url;
      } catch (uploadError) {
        console.error('[v0] Photo upload error:', uploadError);
        // Continue without photo
      }
    }

    // Create attendance record
    const { data: attendance, error: createError } = await supabaseServer
      .from('attendance')
      .insert({
        session_id,
        student_id: user.sub,
        photo_url: photoUrl,
      })
      .select()
      .single();

    if (createError) throw createError;

    // Blacklist token
    await supabaseServer.from('used_tokens').insert({
      token_hash: tokenHash,
      session_id,
    });

    return NextResponse.json(
      {
        attendance: {
          id: attendance.id,
          marked_at: attendance.marked_at,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[v0] Mark attendance error:', error);
    return NextResponse.json(
      { error: 'Failed to mark attendance' },
      { status: 500 }
    );
  }
}
