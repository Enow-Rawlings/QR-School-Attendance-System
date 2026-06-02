import { jwtVerify, SignJWT } from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET = new TextEncoder().encode(process.env.SUPABASE_JWT_SECRET || 'your-secret-key');
const JWT_EXPIRY = 60 * 60 * 24; // 24 hours for session, but QR tokens are 20s

export interface JWTPayload {
  sub: string; // user id
  email: string;
  role: 'admin' | 'lecturer' | 'student';
  iat: number;
  exp: number;
}

export interface QRTokenPayload {
  sub: string; // session id
  lecturer_id: string;
  course_id: string;
  iat: number;
  exp: number;
  type: 'qr';
}

/**
 * Create a JWT token for session management (24 hours)
 */
export async function createSessionToken(
  userId: string,
  email: string,
  role: 'admin' | 'lecturer' | 'student'
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const token = await new SignJWT({ email, role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt(now)
    .setExpirationTime(now + JWT_EXPIRY)
    .sign(JWT_SECRET);

  return token;
}

/**
 * Create a JWT-signed QR token (20 seconds expiry)
 */
export async function createQRToken(
  sessionId: string,
  lecturerId: string,
  courseId: string
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const token = await new SignJWT({ lecturer_id: lecturerId, course_id: courseId, type: 'qr' })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(sessionId)
    .setIssuedAt(now)
    .setExpirationTime(now + 20) // 20 seconds
    .sign(JWT_SECRET);

  return token;
}

/**
 * Verify a JWT token and return the payload
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const verified = await jwtVerify(token, JWT_SECRET);
    return verified.payload as unknown as JWTPayload;
  } catch (error) {
    return null;
  }
}

/**
 * Verify a QR token
 */
export async function verifyQRToken(token: string): Promise<QRTokenPayload | null> {
  try {
    const verified = await jwtVerify(token, JWT_SECRET);
    return verified.payload as unknown as QRTokenPayload;
  } catch (error) {
    return null;
  }
}

/**
 * Set JWT token in httpOnly cookie
 */
export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: JWT_EXPIRY,
    path: '/',
  });
}

/**
 * Get JWT token from cookie
 */
export async function getSessionCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get('auth_token')?.value || null;
}

/**
 * Clear session cookie
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('auth_token');
}

/**
 * Hash a password using bcrypt (requires installation)
 * NOTE: You'll need to install 'bcryptjs' for this
 */
export async function hashPassword(password: string): Promise<string> {
  const bcrypt = await import('bcryptjs');
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Compare password with hash
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  const bcrypt = await import('bcryptjs');
  return bcrypt.compare(password, hash);
}

/**
 * Generate a 4-digit PIN
 */
export function generatePIN(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

/**
 * Hash a token for blacklist storage (using crypto)
 */
export async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Get current user from session cookie
 */
export async function getCurrentUser(): Promise<JWTPayload | null> {
  const token = await getSessionCookie();
  if (!token) return null;
  return verifyToken(token);
}
