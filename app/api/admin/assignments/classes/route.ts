import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { assignClassSchema } from '@/lib/validation';

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
    const result = assignClassSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid assignment data', details: result.error.errors },
        { status: 400 }
      );
    }

    const { course_id, class_id } = result.data;

    // Get course and class details
    const { data: course } = await supabaseServer
      .from('courses')
      .select('*')
      .eq('id', course_id)
      .single();

    const { data: classData } = await supabaseServer
      .from('classes')
      .select('*')
      .eq('id', class_id)
      .single();

    if (!course || !classData) {
      return NextResponse.json(
        { error: 'Course or class not found' },
        { status: 404 }
      );
    }

    // Check for schedule conflicts with other courses assigned to this class
    const { data: conflictingAssignments } = await supabaseServer
      .from('course_classes')
      .select('*, courses(*)')
      .eq('class_id', class_id);

    if (conflictingAssignments) {
      for (const assignment of conflictingAssignments) {
        const existingCourse = (assignment as any).courses;
        if (
          existingCourse &&
          existingCourse.day_of_week === course.day_of_week &&
          !(
            (existingCourse.end_time <= course.start_time) ||
            (existingCourse.start_time >= course.end_time)
          )
        ) {
          return NextResponse.json(
            { error: 'This class has a schedule conflict with another course at this time' },
            { status: 409 }
          );
        }
      }
    }

    // Assign course to class
    const { data: assignment, error } = await supabaseServer
      .from('course_classes')
      .insert({ course_id, class_id })
      .select()
      .single();

    if (error) {
      if (error.message.includes('unique')) {
        return NextResponse.json(
          { error: 'Course is already assigned to this class' },
          { status: 409 }
        );
      }
      throw error;
    }

    return NextResponse.json(assignment, { status: 201 });
  } catch (error) {
    console.error('[v0] Assign class error:', error);
    return NextResponse.json(
      { error: 'Failed to assign course to class' },
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
      .from('course_classes')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[v0] Delete class assignment error:', error);
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
      .from('course_classes')
      .select('*, classes(*), courses(*)');

    if (error) throw error;

    return NextResponse.json({ assignments });
  } catch (error) {
    console.error('[v0] Get class assignments error:', error);
    return NextResponse.json(
      { error: 'Failed to get assignments' },
      { status: 500 }
    );
  }
}
