-- Enable pgcrypto for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table (admin, lecturer, student)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'lecturer', 'student')),
  student_id VARCHAR(255) UNIQUE,
  department VARCHAR(255),
  level VARCHAR(50) CHECK (level IN ('Level 200', 'Level 300', 'Level 400', 'Masters Year 1', 'Masters Year 2')),
  profile_photo_url VARCHAR(512),
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Classes table (Level 200, 300, 400, Masters 1 & 2)
CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) UNIQUE NOT NULL,
  level VARCHAR(50) NOT NULL CHECK (level IN ('Level 200', 'Level 300', 'Level 400', 'Masters Year 1', 'Masters Year 2')),
  department VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Courses table (with schedule: day, start_time, end_time)
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  department VARCHAR(255),
  day_of_week VARCHAR(20) NOT NULL CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  schedule JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Course-Lecturer junction table (many-to-many)
CREATE TABLE course_lecturers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  lecturer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(course_id, lecturer_id)
);

-- Course-Classes junction table (many-to-many)
CREATE TABLE course_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(course_id, class_id)
);

-- Course enrollments (students enrolled in courses)
CREATE TABLE course_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(course_id, student_id)
);

-- Sessions table (attendance sessions started by lecturers)
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  lecturer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  qr_token VARCHAR(512) NOT NULL,
  pin_code VARCHAR(4) NOT NULL,
  status VARCHAR(50) NOT NULL CHECK (status IN ('active', 'closed')) DEFAULT 'active',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  closes_at TIMESTAMP WITH TIME ZONE NOT NULL,
  closed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Attendance table (student attendance records)
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  photo_url VARCHAR(512),
  marked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id, student_id)
);

-- Used tokens table (blacklist for one-time QR tokens)
CREATE TABLE used_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash VARCHAR(255) UNIQUE NOT NULL,
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_level ON users(level);
CREATE INDEX idx_courses_code ON courses(code);
CREATE INDEX idx_course_lecturers_lecturer_id ON course_lecturers(lecturer_id);
CREATE INDEX idx_course_lecturers_course_id ON course_lecturers(course_id);
CREATE INDEX idx_course_classes_course_id ON course_classes(course_id);
CREATE INDEX idx_course_classes_class_id ON course_classes(class_id);
CREATE INDEX idx_course_enrollments_student_id ON course_enrollments(student_id);
CREATE INDEX idx_course_enrollments_course_id ON course_enrollments(course_id);
CREATE INDEX idx_sessions_lecturer_id ON sessions(lecturer_id);
CREATE INDEX idx_sessions_course_id ON sessions(course_id);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_attendance_session_id ON attendance(session_id);
CREATE INDEX idx_attendance_student_id ON attendance(student_id);
CREATE INDEX idx_used_tokens_session_id ON used_tokens(session_id);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_lecturers ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE used_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
-- Users can see their own data
CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  USING (auth.uid()::text = id::text);

-- Admins can see all users
CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  USING ((SELECT role FROM users WHERE id = auth.uid()::uuid) = 'admin');

-- RLS Policies for courses (public read for dashboard purposes)
CREATE POLICY "Everyone can view courses"
  ON courses FOR SELECT
  USING (true);

-- RLS Policies for sessions (lecturers can see their own, students can see active ones they're enrolled in)
CREATE POLICY "Lecturers can see their own sessions"
  ON sessions FOR SELECT
  USING (lecturer_id = auth.uid()::uuid);

CREATE POLICY "Students can see active sessions for enrolled courses"
  ON sessions FOR SELECT
  USING (
    status = 'active' AND
    EXISTS (
      SELECT 1 FROM course_enrollments
      WHERE course_enrollments.course_id = sessions.course_id
      AND course_enrollments.student_id = auth.uid()::uuid
    )
  );

-- RLS Policies for attendance
CREATE POLICY "Lecturers can view attendance for their sessions"
  ON attendance FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = attendance.session_id
      AND sessions.lecturer_id = auth.uid()::uuid
    )
  );

CREATE POLICY "Students can view their own attendance"
  ON attendance FOR SELECT
  USING (student_id = auth.uid()::uuid);

CREATE POLICY "Students can insert their own attendance"
  ON attendance FOR INSERT
  WITH CHECK (student_id = auth.uid()::uuid);
