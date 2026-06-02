import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { createCourseSchema, updateCourseSchema } from '@/lib/validation';

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
    const result = createCourseSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid course data', details: result.error.errors },
        { status: 400 }
      );
    }

    if (!result.data.department.trim()) {
      return NextResponse.json(
        { error: 'Department is required' },
        { status: 400 }
      );
    }

    let courseDepartment = result.data.department;

    if (result.data.class_id) {
      const { data: classRow, error: classError } = await supabaseServer
        .from('classes')
        .select('department')
        .eq('id', result.data.class_id)
        .single();

      if (classError) throw classError;
      courseDepartment = classRow?.department ?? courseDepartment;
    }

    const firstSchedule = result.data.schedule[0];
    const coursePayload: Record<string, unknown> = {
      name: result.data.name,
      code: result.data.code,
      department: courseDepartment,
      day_of_week: firstSchedule.day_of_week,
      start_time: firstSchedule.start_time,
      end_time: firstSchedule.end_time,
    };

    if (Array.isArray(result.data.schedule)) {
      coursePayload.schedule = result.data.schedule;
    }

    let insertResponse = await supabaseServer
      .from('courses')
      .insert(coursePayload)
      .select()
      .single();

    let course = insertResponse.data;
    let error = insertResponse.error;

    if (error && typeof error.message === 'string' && error.message.includes('column') && error.message.includes('schedule')) {
      delete coursePayload.schedule;
      insertResponse = await supabaseServer
        .from('courses')
        .insert(coursePayload)
        .select()
        .single();
      course = insertResponse.data;
      error = insertResponse.error;
    }

    if (error) {
      if (error.message.includes('unique')) {
        return NextResponse.json(
          { error: 'Course code already exists' },
          { status: 409 }
        );
      }
      throw error;
    }

    if (error) {
      if (error.message.includes('unique')) {
        return NextResponse.json(
          { error: 'Course code already exists' },
          { status: 409 }
        );
      }
      throw error;
    }

    if (result.data.class_id) {
      const { error: classLinkError } = await supabaseServer
        .from('course_classes')
        .insert({
          course_id: course.id,
          class_id: result.data.class_id,
        });

      if (classLinkError) {
        console.error('[v0] Link course to class error:', classLinkError);
      }
    }

    return NextResponse.json(course, { status: 201 });
  } catch (error) {
    console.error('[v0] Create course error:', error);
    return NextResponse.json(
      { error: 'Failed to create course' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const result = updateCourseSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid course update data', details: result.error.errors },
        { status: 400 }
      );
    }

    const { id, schedule, ...updateFields } = result.data as any;
    const updateData: Record<string, unknown> = { ...updateFields };

    if (Array.isArray(schedule) && schedule.length > 0) {
      const firstSchedule = schedule[0];
      updateData.day_of_week = firstSchedule.day_of_week;
      updateData.start_time = firstSchedule.start_time;
      updateData.end_time = firstSchedule.end_time;
      updateData.schedule = schedule;
    }

    const { data: course, error } = await supabaseServer
      .from('courses')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.message.includes('unique')) {
        return NextResponse.json(
          { error: 'Course code already exists' },
          { status: 409 }
        );
      }
      throw error;
    }

    return NextResponse.json(course);
  } catch (error) {
    console.error('[v0] Update course error:', error);
    return NextResponse.json(
      { error: 'Failed to update course' },
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
        { error: 'Course ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabaseServer
      .from('courses')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[v0] Delete course error:', error);
    return NextResponse.json(
      { error: 'Failed to delete course' },
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

    const { data: courses, error } = await supabaseServer
      .from('courses')
      .select('*')
      .order('day_of_week');

    if (error) throw error;

    return NextResponse.json({ courses });
  } catch (error) {
    console.error('[v0] Get courses error:', error);
    return NextResponse.json(
      { error: 'Failed to get courses' },
      { status: 500 }
    );
  }
}
