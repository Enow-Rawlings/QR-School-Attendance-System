# QR Attendance System - Landmark Metropolitan University of Buea

A professional, enterprise-grade QR code-based attendance tracking system designed for academic institutions. Built with Next.js 16, Supabase, and modern web technologies.

## System Overview

This attendance system enables seamless marking of student presence using QR codes, with role-based access for students, lecturers, and administrators.

### Key Features

- **QR-Based Attendance**: Secure, one-time QR tokens with 20-second expiry
- **Photo Verification**: Webcam capture to prevent proxy attendance
- **Role-Based Access**: Separate interfaces for admin, lecturers, and students
- **Schedule Management**: Course scheduling with automatic conflict detection
- **Real-Time Monitoring**: Live attendance updates via Server-Sent Events (SSE)
- **Data Privacy**: GDPR-compliant EULA and secure data handling
- **Beautiful UI**: Professional gradients, smooth animations, and responsive design

## Architecture

### Tech Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Frontend | Next.js 16 (App Router) | React framework with TypeScript |
| Backend | Next.js API Routes | Server-side logic and endpoints |
| Database | Supabase PostgreSQL | Primary data storage |
| File Storage | Vercel Blob | Attendance photos and assets |
| Caching/Rate Limiting | Upstash Redis | Rate limiting and session management |
| Authentication | JWT (httpOnly cookies) | Secure session management |
| UI Framework | shadcn/ui + Tailwind CSS | Component library and styling |

### System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                      Student/Lecturer/Admin                      │
│                    (Web Browser or Mobile)                       │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
        ┌────────────────────────────────┐
        │    Next.js 16 Application       │
        │  ┌──────────────────────────┐   │
        │  │   API Routes & Middleware   │   │
        │  │  • Auth (JWT, Sessions)     │   │
        │  │  • Courses & Classes        │   │
        │  │  • Sessions Management      │   │
        │  │  • Attendance Marking       │   │
        │  │  • Real-time SSE           │   │
        │  └──────────────────────────┘   │
        │  ┌──────────────────────────┐   │
        │  │   React Components          │   │
        │  │  • Authentication Pages     │   │
        │  │  • Dashboards              │   │
        │  │  • QR Scanner & Display    │   │
        │  │  • Animations              │   │
        │  └──────────────────────────┘   │
        └──────┬───────────────┬──────────┘
               │               │
        ┌──────▼──┐      ┌────▼────────┐
        │ Supabase │      │ Vercel Blob  │
        │PostgreSQL│      │   Storage    │
        │ Database │      │ (Photos)     │
        └──────┬──┘      └──────────────┘
               │
        ┌──────▼──────────┐
        │ Upstash Redis   │
        │ (Rate Limiting) │
        └─────────────────┘
```

## Integration Guide

### Prerequisites

- Node.js 18+ and pnpm
- A GitHub account (for deployment)
- Vercel account (for deployment and integrations)

### Step 1: Database Setup (Supabase)

#### 1.1 Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in project details:
   - Project name: `lmu-attendance-system`
   - Database password: Create a strong password
   - Region: Choose closest to Cameroon (Africa regions recommended)
5. Wait for project to be created (2-3 minutes)

#### 1.2 Get Your Database Credentials

1. Go to Project Settings → API
2. Copy these credentials:
   - `SUPABASE_URL` (Project URL)
   - `SUPABASE_ANON_KEY` (Anon Key)
   - `SUPABASE_SERVICE_ROLE_KEY` (Service Role Key)
   - `SUPABASE_JWT_SECRET` (JWT Secret - under Connectors)

Store these in a secure location.

#### 1.3 Create Tables

1. In Supabase, go to SQL Editor
2. Open new query
3. Copy the entire contents of `/supabase/migrations/001_initial_schema.sql`
4. Paste into the SQL Editor
5. Click "Run" to execute

The script will create:
- `users` (admin, lecturer, student accounts)
- `classes` (academic levels and departments)
- `courses` (course information and schedules)
- `course_lecturers` (lecturer assignments)
- `course_classes` (course-to-class assignments)
- `course_enrollments` (student enrollments)
- `sessions` (attendance sessions)
- `attendance` (attendance records)
- `used_tokens` (QR token blacklist)

#### 1.4 Enable Row Level Security (RLS)

For production, enable RLS policies:

```sql
-- Run in Supabase SQL Editor for each table

-- Students can only see their own data
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see their own profile"
  ON users FOR SELECT
  USING (auth.uid()::text = id::text OR role = 'admin');

-- Similar policies for other tables (see SECURITY.md for full setup)
```

### Step 2: File Storage Setup (Vercel Blob)

#### 2.1 Enable Blob in Vercel

1. Connect your Vercel project
2. Go to Settings → Storage → Create Database
3. Select "Blob"
4. Copy the `BLOB_READ_WRITE_TOKEN`

This token allows secure photo uploads during attendance marking.

### Step 3: Rate Limiting Setup (Upstash Redis)

#### 3.1 Create Upstash Database

1. Go to [upstash.com](https://upstash.com)
2. Create an account and log in
3. Click "Create Database"
4. Configuration:
   - Name: `lmu-attendance-redis`
   - Region: Choose closest to users
   - Type: "Standard"
5. Copy these credentials:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

These protect against brute-force attacks on attendance/login endpoints.

### Step 4: Environment Variables

#### 4.1 Local Development Setup

Create `.env.local` in project root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret
POSTGRES_URL=postgresql://postgres:password@db.supabase.co:5432/postgres

# Vercel Blob
BLOB_READ_WRITE_TOKEN=your-blob-token

# Upstash Redis
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token

# App Settings
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

#### 4.2 Production (Vercel)

1. Push your repository to GitHub
2. Connect to Vercel at [vercel.com](https://vercel.com)
3. Go to Project Settings → Environment Variables
4. Add all variables from `.env.local`
5. Make sure to add them to all environments (Preview, Production, Development)

### Step 5: Install Dependencies

```bash
# Install dependencies
pnpm install

# Verify build
pnpm run build

# Start development server
pnpm run dev
```

Visit http://localhost:3000 to test locally.

## Creating Initial Admin Account

Since the system doesn't have a default admin creation route:

### Method 1: Direct Database Insert (Recommended for first setup)

1. Go to Supabase → SQL Editor
2. Run this query (replace with your info):

```sql
INSERT INTO users (
  email, 
  password_hash, 
  full_name, 
  role, 
  is_verified
) VALUES (
  'admin@lmu.edu.cm',
  '$2b$10$... (bcrypt hash)', -- Use bcryptjs to hash first
  'System Administrator',
  'admin',
  TRUE
);
```

To generate a bcrypt hash:
```bash
# In Node.js REPL or create a quick script
node
const bcrypt = require('bcryptjs');
const hash = bcrypt.hashSync('YourPassword123', 10);
console.log(hash);
```

### Method 2: Registration + Database Update

1. Register via `/register` page (choose admin role if available)
2. Login with created credentials
3. System automatically assigns admin privileges based on role

## Core Workflows

### Admin Workflow

1. **Login** → `/login`
2. **Dashboard** → `/admin/dashboard` (see statistics)
3. **Create Classes** → `/admin/classes` (Level 200-Masters 2)
4. **Create Courses** → `/admin/courses` (with schedules: day, time)
5. **Create Lecturers** → `/admin/assignments` → Create lecturer accounts
6. **Assign Lecturers** → Link lecturers to courses (no schedule conflicts)
7. **Assign Courses** → Link courses to classes
8. **View Reports** → `/admin/dashboard` → Attendance records by class/dept

### Lecturer Workflow

1. **Login** → `/login`
2. **Dashboard** → `/lecturer/dashboard` (see assigned courses)
3. **Start Session** → Click "Start Session" on any course during active hours
4. **Monitor Attendance** → `/lecturer/session/[id]` (live QR refresh, student list)
5. **Close Session** → End attendance marking

### Student Workflow

1. **Register** → `/register` → Choose level
2. **Auto-Enrollment** → Automatically enrolled in courses for their level
3. **View Sessions** → `/dashboard` (see active sessions)
4. **Mark Attendance** → `/attend/[id]` → Scan QR → Enter PIN → Take photo
5. **Confirmation** → Success message when attendance recorded

## Testing the Core Functionality

### 1. Test Authentication

```bash
# Test registration
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@test.com",
    "password": "TestPass123",
    "full_name": "Test Student",
    "role": "student",
    "level": "Level 200"
  }'

# Test login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@test.com",
    "password": "TestPass123"
  }'
```

### 2. Test Course/Class Creation (Admin)

```bash
# Create a class
curl -X POST http://localhost:3000/api/admin/classes \
  -H "Content-Type: application/json" \
  -H "Cookie: token=YOUR_JWT_TOKEN" \
  -d '{
    "name": "Level 200 A",
    "level": "Level 200",
    "department": "Software Engineering"
  }'

# Create a course
curl -X POST http://localhost:3000/api/admin/courses \
  -H "Content-Type: application/json" \
  -H "Cookie: token=YOUR_JWT_TOKEN" \
  -d '{
    "name": "Web Development",
    "code": "CS201",
    "department": "Software Engineering",
    "day_of_week": "Monday",
    "start_time": "09:00",
    "end_time": "11:00"
  }'
```

### 3. Test Session and Attendance

```bash
# Lecturer starts session
curl -X POST http://localhost:3000/api/sessions/start \
  -H "Content-Type: application/json" \
  -H "Cookie: token=LECTURER_JWT" \
  -d '{"course_id": "UUID"}'

# Student marks attendance
curl -X POST http://localhost:3000/api/attendance/mark \
  -H "Content-Type: application/json" \
  -d '{
    "qr_token": "JWT_FROM_QR",
    "pin_code": "1234",
    "photo_url": "blob_url"
  }'
```

## Deployment to Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit: QR attendance system"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/lmu-attendance.git
git push -u origin main
```

### 2. Deploy to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Framework: Next.js (auto-detected)
4. Build Settings:
   - Build Command: `pnpm run build`
   - Output Directory: `.next`
5. Environment Variables: Add all from `.env.local`
6. Click "Deploy"

Vercel will automatically:
- Install dependencies
- Build the application
- Deploy to production URL
- Provide CI/CD pipeline

### Automatic Deploys & CI

1. This repository includes a GitHub Actions workflow at `.github/workflows/ci.yml` which runs on pushes and pull requests to `main`. It performs dependency installation, TypeScript type-checking, a build, and linting.
2. Connect your GitHub repo to Vercel (Import Project). Vercel will deploy every push to the connected branch automatically.
3. For safer deploys, enable GitHub Branch Protection on `main` and require the `CI` checks to pass before merging.

### Vercel Environment Variables

Set the following variables in your Vercel Project Settings (Preview + Production):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_JWT_SECRET`
- `BLOB_READ_WRITE_TOKEN`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `NEXT_PUBLIC_APP_URL`

After setting those, trigger a new push or click "Redeploy" in Vercel to build with the real secrets.

### 3. Post-Deployment

1. Visit your deployment URL
2. Test authentication at `/login` and `/register`
3. Create initial admin account (see section above)
4. Set up courses and classes
5. Share educator login credentials securely
6. Students can self-register at `/register`

## Troubleshooting

### Database Connection Issues

**Problem**: "Failed to connect to Supabase"

**Solution**:
1. Verify `SUPABASE_URL` and keys are correct
2. Check Supabase project is active
3. Test connection: `psql postgresql://...` using POSTGRES_URL
4. Check firewall/network restrictions

### QR Code Not Scanning

**Problem**: "QR code won't scan or invalid token"

**Solutions**:
1. Ensure QR token has not expired (20 seconds)
2. Token can only be used once - refresh for new QR
3. Check `used_tokens` table to see if token already used
4. Verify lecturer started session during course active hours

### Attendance Not Recording

**Problem**: "Photo uploads fail or attendance not saved"

**Solution**:
1. Check `BLOB_READ_WRITE_TOKEN` is valid
2. Verify Blob storage is enabled in Vercel
3. Check student is enrolled in the course's class level
4. Ensure session hasn't closed (check `closes_at` in sessions table)
5. Verify PIN is correct (4 digits)

### Rate Limiting Issues

**Problem**: "Too many requests" error during testing

**Solution**:
1. Wait 1-2 minutes for rate limit to reset
2. Use different email for multiple test registrations
3. Check Upstash Redis quota hasn't been exceeded
4. Review `/lib/rate-limit.ts` for current limits:
   - Login: 5 attempts per 15 minutes per IP
   - Attendance: 10 attempts per 10 minutes per IP

### Email Validation

**Problem**: Emails are not validated

**Workaround** (for testing):
```sql
-- Manually verify user email
UPDATE users SET is_verified = TRUE 
WHERE email = 'student@test.com';
```

## Security Considerations

### Data Protection

- All passwords hashed with bcryptjs (10 rounds)
- JWT tokens signed with `SUPABASE_JWT_SECRET`
- QR tokens expire in 20 seconds
- One-time use enforcement via `used_tokens` table
- Photo URLs stored, not photo data itself

### Network Security

- HTTPS enforced in production
- httpOnly cookies (no JavaScript access)
- CORS configured per environment
- Rate limiting on sensitive endpoints

### Access Control

- Row Level Security (RLS) on database tables
- Role-based route protection
- Lecturers can only access their assigned courses
- Students can only see/mark attendance for enrolled courses

## Scaling Considerations

### For 10K+ Students

1. **Database**: Add read replicas
   ```bash
   # In Supabase dashboard
   Settings → Database → Read Replicas → Create
   ```

2. **Caching**: Increase Redis capacity
   - Review `/lib/rate-limit.ts`
   - Consider adding caching layer for course/class queries

3. **File Storage**: Monitor Blob usage
   - Archive old photos to cold storage
   - Implement photo retention policies

4. **Real-Time Updates**: Optimize SSE
   - Consider WebSocket upgrade for heavy load
   - Implement connection pooling

### Database Optimization

```sql
-- Add indexes for faster queries
CREATE INDEX idx_attendance_session_id ON attendance(session_id);
CREATE INDEX idx_attendance_student_id ON attendance(student_id);
CREATE INDEX idx_course_lecturers_lecturer ON course_lecturers(lecturer_id);
CREATE INDEX idx_sessions_course_id ON sessions(course_id);
CREATE INDEX idx_course_enrollments_student ON course_enrollments(student_id);
```

## Support & Documentation

- **Issue Tracking**: Create issues on GitHub
- **Documentation**: See `/docs` folder
- **API Reference**: See `/docs/API.md`
- **Database Schema**: See `/supabase/migrations/`

## License & Privacy

This system is designed for Landmark Metropolitan University of Buea. Student data is protected under the EULA and privacy agreement (see `/app/(auth)/eula/page.tsx`).

## Contact

For support or inquiries:
- Email: support@lmu.edu.cm
- System Administrator: [To be configured]

---

**Version**: 1.0.0
**Last Updated**: May 2026
**Designed for**: Landmark Metropolitan University of Buea
