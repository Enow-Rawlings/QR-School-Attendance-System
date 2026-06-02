import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/db';
import { comparePassword, createSessionToken, setSessionCookie } from '@/lib/auth';
import { loginSchema } from '@/lib/validation';
import { checkRateLimit, loginLimiter } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const result = loginSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid email or password format' },
        { status: 400 }
      );
    }

    const { email, password } = result.data;

    // Rate limiting per email
    const rateLimit = await checkRateLimit(loginLimiter, email);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        { status: 429 }
      );
    }

    // Find user by email
    const { data: user, error } = await supabaseServer
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.password_hash);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Create session token
    const token = await createSessionToken(user.id, user.email, user.role);
    await setSessionCookie(token);

    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[v0] Login error:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}
