import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/db';
import { hashPassword, createSessionToken, setSessionCookie } from '@/lib/auth';
import { registerStudentSchema } from '@/lib/validation';
import { checkRateLimit, loginLimiter } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const role = body.role as string;

    // Rate limiting
    const identifier = body.email || 'unknown';
    const rateLimit = await checkRateLimit(loginLimiter, identifier);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Too many registration attempts. Please try again later.' },
        { status: 429 }
      );
    }

    if (role !== 'student') {
      return NextResponse.json(
        { error: 'Lecturer accounts are restricted. Please contact an administrator.' },
        { status: 403 }
      );
    }

    const result = registerStudentSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid student registration data', details: result.error.errors },
        { status: 400 }
      );
    }

    const validated = result.data;

    // Check if email already exists
    const { data: existingUser } = await supabaseServer
      .from('users')
      .select('id')
      .eq('email', validated.email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(validated.password);

    // Create user
    const { data: newUser, error: createError } = await supabaseServer
      .from('users')
      .insert({
        email: validated.email,
        password_hash: passwordHash,
        full_name: validated.full_name,
        role,
        student_id: validated.student_id,
        level: validated.level,
        department: validated.department,
      })
      .select()
      .single();

    if (createError) {
      console.error('[v0] User creation error:', createError);
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }

    // If student, auto-enroll in courses for their level and department
    if (role === 'student') {
      const { data: classesForStudent, error: classesErr } = await supabaseServer
        .from('classes')
        .select('id')
        .eq('level', validated.level)
        .eq('department', validated.department);

      if (classesErr) throw classesErr;

      const classIds = (classesForStudent || []).map((c: any) => c.id);

      if (classIds.length > 0) {
        const { data: courseClasses } = await supabaseServer
          .from('course_classes')
          .select('course_id')
          .in('class_id', classIds);

        const coursesForStudent = (courseClasses || []).map((cc: any) => cc.course_id);

        if (coursesForStudent.length > 0) {
          await supabaseServer.from('course_enrollments').insert(
            coursesForStudent.map((courseId: string) => ({
              course_id: courseId,
              student_id: newUser.id,
            }))
          );
        }
      }
    }

    // Create session token
    const token = await createSessionToken(newUser.id, newUser.email, role as any);
    await setSessionCookie(token);

    return NextResponse.json(
      {
        user: {
          id: newUser.id,
          email: newUser.email,
          full_name: newUser.full_name,
          role: newUser.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[v0] Registration error:', error);
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    );
  }
}
