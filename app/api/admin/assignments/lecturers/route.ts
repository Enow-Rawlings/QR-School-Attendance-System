import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { assignLecturerSchema } from '@/lib/validation';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const result = assignLecturerSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid assignment data', details: result.error.errors },
        { status: 400 }
      );
    }

    const { course_id, lecturer_id } = result.data;

    // Get course details
    const { data: course, error: courseError } = await supabaseServer
      .from('courses')
      .select('*')
      .eq('id', course_id)
      .single();

    if (courseError || !course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    // Check for time conflicts
    const { data: conflictingAssignments } = await supabaseServer
      .from('course_lecturers')
      .select('course_lecturers!inner (*, courses!inner (*))')
      .eq('lecturer_id', lecturer_id);

    if (conflictingAssignments) {
      for (const assignment of conflictingAssignments) {
        const existingCourse = (assignment as any).course_lecturers?.courses?.[0];
        if (
          existingCourse &&
          existingCourse.day_of_week === course.day_of_week &&
          !(
            (existingCourse.end_time <= course.start_time) ||
            (existingCourse.start_time >= course.end_time)
          )
        ) {
          return NextResponse.json(
            { error: 'Lecturer has a schedule conflict with another course at this time' },
            { status: 409 }
          );
        }
      }
    }

    // Assign lecturer to course
    const { data: assignment, error } = await supabaseServer
      .from('course_lecturers')
      .insert({ course_id, lecturer_id })
      .select()
      .single();

    if (error) {
      if (error.message.includes('unique')) {
        return NextResponse.json(
          { error: 'Lecturer is already assigned to this course' },
          { status: 409 }
        );
      }
      throw error;
    }

    return NextResponse.json(assignment, { status: 201 });
  } catch (error) {
    console.error('[v0] Assign lecturer error:', error);
    return NextResponse.json(
      { error: 'Failed to assign lecturer' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const id = body.id as string;

    if (!id) {
      return NextResponse.json(
        { error: 'Assignment ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabaseServer
      .from('course_lecturers')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[v0] Delete lecturer assignment error:', error);
    return NextResponse.json(
      { error: 'Failed to delete assignment' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { data: assignments, error } = await supabaseServer
      .from('course_lecturers')
      .select('*, users!lecturer_id(*), courses(*)');

    if (error) throw error;

    return NextResponse.json({ assignments });
  } catch (error) {
    console.error('[v0] Get lecturer assignments error:', error);
    return NextResponse.json(
      { error: 'Failed to get assignments' },
      { status: 500 }
    );
  }
}
