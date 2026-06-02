import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Server-side Supabase client (with service role key for admin operations)
export const supabaseServer = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null as any; // Safe for build time when env vars aren't available

// Client-side Supabase client (for browser operations)
export const supabaseClient = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null as any; // Safe for build time when env vars aren't available

// Type definitions for database schema
export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'lecturer' | 'student';
  student_id?: string;
  department?: string;
  level?: string;
  profile_photo_url?: string;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface Class {
  id: string;
  name: string;
  level: string;
  department?: string;
  created_at: string;
  updated_at: string;
}

export interface CourseScheduleEntry {
  day_of_week: string;
  start_time: string;
  end_time: string;
}

export interface Course {
  id: string;
  name: string;
  code: string;
  department?: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  schedule?: CourseScheduleEntry[];
  created_at: string;
  updated_at: string;
}

export interface CourseWithDetails extends Course {
  lecturers?: User[];
  classes?: Class[];
}

export interface Session {
  id: string;
  course_id: string;
  lecturer_id: string;
  qr_token: string;
  pin_code: string;
  status: 'active' | 'closed';
  started_at: string;
  closes_at: string;
  closed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Attendance {
  id: string;
  session_id: string;
  student_id: string;
  photo_url?: string;
  marked_at: string;
  created_at: string;
}

export interface UsedToken {
  id: string;
  token_hash: string;
  session_id: string;
  used_at: string;
  created_at: string;
}

export interface CourseEnrollment {
  id: string;
  course_id: string;
  student_id: string;
  created_at: string;
}

export interface CourseLecturer {
  id: string;
  course_id: string;
  lecturer_id: string;
  assigned_at: string;
}

export interface CourseClass {
  id: string;
  course_id: string;
  class_id: string;
  assigned_at: string;
}
