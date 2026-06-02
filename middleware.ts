import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.SUPABASE_JWT_SECRET || 'your-secret-key');

// Protected routes by role
const protectedRoutes = {
  admin: ['/admin'],
  lecturer: ['/lecturer'],
  student: ['/dashboard', '/attend'],
};

const publicRoutes = ['/login', '/register', '/'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow API routes through (avoid redirecting API requests to HTML pages)
  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // Skip middleware for public routes
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check for auth token
  const token = request.cookies.get('auth_token')?.value;

  if (!token) {
    // No token, redirect to login
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    // Verify JWT
    const verified = await jwtVerify(token, JWT_SECRET);
    const role = verified.payload.role as string;

    // Check if user has access to route
    if (pathname.startsWith('/admin') && role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    if (pathname.startsWith('/lecturer') && role !== 'lecturer') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    if ((pathname.startsWith('/dashboard') || pathname.startsWith('/attend')) && role !== 'student') {
      if (role === 'admin') {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      }
      if (role === 'lecturer') {
        return NextResponse.redirect(new URL('/lecturer/dashboard', request.url));
      }
    }

    return NextResponse.next();
  } catch (error) {
    // Invalid token, redirect to login
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icon.*|apple-icon.*).*)',
  ],
};
