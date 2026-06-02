import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/db';
import { getCurrentUser, hashPassword } from '@/lib/auth';
import { registerLecturerSchema } from '@/lib/validation';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { data: lecturers, error } = await supabaseServer
      .from('users')
      .select('id, email, full_name, department')
      .eq('role', 'lecturer')
      .order('full_name');

    if (error) throw error;

    return NextResponse.json({ lecturers });
  } catch (error) {
    console.error('[v0] Get lecturers error:', error);
    return NextResponse.json(
      { error: 'Failed to get lecturers' },
      { status: 500 }
    );
  }
}

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
    const result = registerLecturerSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid lecturer creation data', details: result.error.errors },
        { status: 400 }
      );
    }

    const validated = result.data;

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

    const passwordHash = await hashPassword(validated.password);

    const { data: newUser, error: createError } = await supabaseServer
      .from('users')
      .insert({
        email: validated.email,
        password_hash: passwordHash,
        full_name: validated.full_name,
        role: 'lecturer',
        department: validated.department,
      })
      .select('id, email, full_name, role, department')
      .single();

    if (createError) {
      console.error('[v0] Create lecturer error:', createError);
      return NextResponse.json(
        { error: 'Failed to create lecturer' },
        { status: 500 }
      );
    }

    return NextResponse.json({ lecturer: newUser }, { status: 201 });
  } catch (error) {
    console.error('[v0] Create lecturer error:', error);
    return NextResponse.json(
      { error: 'Failed to create lecturer' },
      { status: 500 }
    );
  }
}
