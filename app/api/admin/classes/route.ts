import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { createClassSchema, updateClassSchema } from '@/lib/validation';

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
    const result = createClassSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid class data', details: result.error.errors },
        { status: 400 }
      );
    }

    if (!result.data.department.trim()) {
      return NextResponse.json(
        { error: 'Department is required' },
        { status: 400 }
      );
    }

    const classDepartment = result.data.department.trim();
    const inputLevel = result.data.level;

    const levelGroups = inputLevel.startsWith('Masters')
      ? ['Masters Year 1', 'Masters Year 2']
      : ['Level 200', 'Level 300', 'Level 400'];

    const targetLevels = levelGroups.includes(inputLevel)
      ? levelGroups
      : [inputLevel];

    const classEntries = targetLevels.map((level) => ({
      level,
      department: classDepartment,
      name: `${level} ${classDepartment}`,
    }));

    const classNames = classEntries.map((entry) => entry.name);
    const { data: existingClasses, error: fetchError } = await supabaseServer
      .from('classes')
      .select('name')
      .in('name', classNames);

    if (fetchError) throw fetchError;

    const existingNames = new Set((existingClasses || []).map((cls: any) => cls.name));
    const classesToInsert = classEntries.filter((entry) => !existingNames.has(entry.name));

    let insertedClasses = [];

    if (classesToInsert.length > 0) {
      const insertResult = await supabaseServer
        .from('classes')
        .insert(classesToInsert)
        .select();

      if (insertResult.error) {
        if (insertResult.error.message.includes('unique')) {
          return NextResponse.json(
            { error: 'Class already exists for this level and department' },
            { status: 409 }
          );
        }
        throw insertResult.error;
      }

      insertedClasses = insertResult.data || [];
    }

    return NextResponse.json(insertedClasses, { status: 201 });
  } catch (error) {
    console.error('[v0] Create class error:', error);
    return NextResponse.json(
      { error: 'Failed to create class' },
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
    const result = updateClassSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid class update data', details: result.error.errors },
        { status: 400 }
      );
    }

    const { id, ...updateData } = result.data;
    const classUpdate: any = { ...updateData };

    if (classUpdate.level || classUpdate.department) {
      const existingClass = await supabaseServer
        .from('classes')
        .select('level, department')
        .eq('id', id)
        .single();

      if (existingClass.error) throw existingClass.error;

      const level = classUpdate.level ?? existingClass.data.level;
      const department = classUpdate.department ?? existingClass.data.department;
      classUpdate.name = `${level} ${department}`;
    }

    const { data, error } = await supabaseServer
      .from('classes')
      .update(classUpdate)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update class' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('[v0] Update class error:', error);
    return NextResponse.json(
      { error: 'Failed to update class' },
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
        { error: 'Class ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabaseServer
      .from('classes')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[v0] Delete class error:', error);
    return NextResponse.json(
      { error: 'Failed to delete class' },
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

    const { data: classes, error } = await supabaseServer
      .from('classes')
      .select('*')
      .order('level');

    if (error) throw error;

    return NextResponse.json({ classes });
  } catch (error) {
    console.error('[v0] Get classes error:', error);
    return NextResponse.json(
      { error: 'Failed to get classes' },
      { status: 500 }
    );
  }
}
