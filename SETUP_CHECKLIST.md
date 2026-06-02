# Setup Checklist - QR Attendance System

Complete step-by-step guide to get the system running in production.

## Phase 1: Local Development (5-10 minutes)

- [ ] Clone repository: `git clone <repo>`
- [ ] Install dependencies: `pnpm install`
- [ ] Create `.env.local` file
- [ ] Copy sample environment variables from `.env.example`
- [ ] Run development server: `pnpm run dev`
- [ ] Test login page: Visit http://localhost:3000/login

## Phase 2: Supabase Setup (10-15 minutes)

### Create Supabase Project
- [ ] Create account at https://supabase.com
- [ ] Create new project named `lmu-attendance-system`
- [ ] Choose region closest to Cameroon
- [ ] Save database password securely
- [ ] Wait for project creation (2-3 minutes)

### Get Credentials
- [ ] Copy `SUPABASE_URL` from Project Settings → API
- [ ] Copy `SUPABASE_ANON_KEY`
- [ ] Copy `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Go to Project Settings → Database → Connectors
- [ ] Copy `SUPABASE_JWT_SECRET`
- [ ] Get `POSTGRES_URL` from Connection Pooler section

### Create Database Schema
- [ ] Open SQL Editor in Supabase
- [ ] Copy contents of `/supabase/migrations/001_initial_schema.sql`
- [ ] Paste into SQL Editor and run
- [ ] Verify all tables created:
  - [ ] `users`
  - [ ] `classes`
  - [ ] `courses`
  - [ ] `course_lecturers`
  - [ ] `course_classes`
  - [ ] `course_enrollments`
  - [ ] `sessions`
  - [ ] `attendance`
  - [ ] `used_tokens`

### Add Environment Variables
- [ ] Add `NEXT_PUBLIC_SUPABASE_URL` to `.env.local`
- [ ] Add `NEXT_PUBLIC_SUPABASE_ANON_KEY` to `.env.local`
- [ ] Add `SUPABASE_SERVICE_ROLE_KEY` to `.env.local`
- [ ] Add `SUPABASE_JWT_SECRET` to `.env.local`
- [ ] Add `POSTGRES_URL` to `.env.local`

## Phase 3: Vercel Blob Setup (5 minutes)

- [ ] Create/login to Vercel account: https://vercel.com
- [ ] Connect your GitHub repository to Vercel
- [ ] Go to Project Settings → Storage
- [ ] Create new Blob storage
- [ ] Copy `BLOB_READ_WRITE_TOKEN`
- [ ] Add `BLOB_READ_WRITE_TOKEN` to `.env.local`

## Phase 4: Upstash Redis Setup (5 minutes)

- [ ] Create account at https://upstash.com
- [ ] Create new Redis database
- [ ] Name: `lmu-attendance-redis`
- [ ] Choose region closest to users
- [ ] Copy `UPSTASH_REDIS_REST_URL`
- [ ] Copy `UPSTASH_REDIS_REST_TOKEN`
- [ ] Add both to `.env.local`:
  ```
  UPSTASH_REDIS_REST_URL=your-url
  UPSTASH_REDIS_REST_TOKEN=your-token
  ```

## Phase 5: Local Testing (10 minutes)

### Test Authentication
- [ ] Start dev server: `pnpm run dev`
- [ ] Visit http://localhost:3000
- [ ] Should redirect to `/login`
- [ ] Go to `/register`
- [ ] Create test student account:
  - Email: `student@test.lmu.edu.cm`
  - Password: `TestPass123`
  - Name: `Test Student`
  - Level: `Level 200`
- [ ] Submit registration
- [ ] Login with new credentials
- [ ] Verify redirect to `/dashboard`
- [ ] Check "Sign in to your account" works

### Test Admin Functions (requires admin account)
- [ ] Create admin user in database (see README.md)
- [ ] Login as admin
- [ ] Visit `/admin/dashboard`
- [ ] Create test class:
  - Name: `Level 200 A`
  - Level: `Level 200`
  - Department: `Software Engineering`
- [ ] Create test course:
  - Name: `Web Development`
  - Code: `CS201`
  - Day: `Monday`
  - Start: `09:00`
  - End: `11:00`
- [ ] Verify data appears in lists

### Test Lecturer Functions
- [ ] Create lecturer account via `/register`
- [ ] Login as lecturer
- [ ] Visit `/lecturer/dashboard`
- [ ] Should show no courses initially
- [ ] As admin, assign lecturer to course
- [ ] Logout/login as lecturer again
- [ ] Verify course now appears

### Test Student Functions
- [ ] Login as test student
- [ ] Visit `/dashboard`
- [ ] Should see active courses for Level 200
- [ ] Verify student auto-enrolled

## Phase 6: Deployment to Vercel (10 minutes)

### Setup Git & Push
- [ ] Initialize git: `git init`
- [ ] Add remote: `git remote add origin <github-url>`
- [ ] Commit code: `git add . && git commit -m "Initial commit"`
- [ ] Push to main: `git push -u origin main`

### Connect to Vercel
- [ ] Visit https://vercel.com/new
- [ ] Import GitHub repository
- [ ] Framework: Next.js (auto-detected)
- [ ] Build command: `pnpm run build`
- [ ] Output directory: `.next`

### Add Environment Variables
- [ ] Click "Environment Variables"
- [ ] Add all variables from `.env.local`:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `SUPABASE_JWT_SECRET`
  - `POSTGRES_URL`
  - `BLOB_READ_WRITE_TOKEN`
  - `UPSTASH_REDIS_REST_URL`
  - `UPSTASH_REDIS_REST_TOKEN`
  - `NEXT_PUBLIC_APP_URL` (set to your Vercel URL)
- [ ] Select environments: Production, Preview, Development
- [ ] Click "Deploy"

### Wait for Deployment
- [ ] Vercel will build and deploy automatically
- [ ] Watch build logs for errors
- [ ] Deployment complete when "Production" shows checkmark
- [ ] Click "Visit" to test live deployment

## Phase 7: Production Verification (5 minutes)

- [ ] Visit production URL
- [ ] Test login/register
- [ ] Verify database connectivity
- [ ] Test file upload (take attendance photo)
- [ ] Verify photos appear in Vercel Blob
- [ ] Check rate limiting works (test multiple login attempts)

## Phase 8: Security Hardening (Optional, 15 minutes)

### Enable Row Level Security in Supabase
- [ ] Open SQL Editor in Supabase
- [ ] Run RLS setup script (see SECURITY.md)
- [ ] Test that users can only access their own data

### Configure CORS
- [ ] Add Vercel deployment URL to allowed origins
- [ ] Test requests from deployed domain

### Setup Email Notifications (Optional)
- [ ] Configure SendGrid or similar for password resets
- [ ] Test email delivery

## Phase 9: Initial Data Setup (10 minutes)

### Create Classes
- [ ] Login as admin
- [ ] Go to `/admin/classes`
- [ ] Create all class levels:
  - [ ] Level 200
  - [ ] Level 300
  - [ ] Level 400
  - [ ] Masters Year 1
  - [ ] Masters Year 2

### Create Departments
- [ ] Create courses for each department
- [ ] Assign courses to appropriate classes
- [ ] Verify schedule conflicts are caught

### Create Initial Lecturers
- [ ] Create lecturer accounts via `/register`
- [ ] Assign each lecturer to their courses
- [ ] Verify lecturers see correct courses on login

## Phase 10: Train Users & Go Live

### Administrator Training
- [ ] [ ] How to create courses and classes
- [ ] [ ] How to assign lecturers
- [ ] [ ] How to view attendance records
- [ ] [ ] How to troubleshoot issues

### Lecturer Training
- [ ] [ ] How to start a session
- [ ] [ ] How to view live QR code
- [ ] [ ] How to refresh QR/PIN
- [ ] [ ] How to monitor attendance
- [ ] [ ] How to close sessions

### Student Communication
- [ ] [ ] Send registration instructions
- [ ] [ ] Explain how to mark attendance
- [ ] [ ] Share QR scanning tips
- [ ] [ ] Provide EULA link

## Phase 11: Post-Launch Monitoring (Ongoing)

### Daily
- [ ] Monitor error logs in Vercel
- [ ] Check database performance
- [ ] Verify sessions are created successfully

### Weekly
- [ ] Review attendance statistics
- [ ] Check for unusual patterns
- [ ] Backup database (Supabase auto-backups)

### Monthly
- [ ] Clean up old photos from Blob storage
- [ ] Review and optimize queries
- [ ] Check security logs
- [ ] Get user feedback

## Troubleshooting Checklist

If something breaks:

- [ ] Check environment variables are set correctly
- [ ] Verify Supabase project is still active
- [ ] Test database connection manually
- [ ] Check Vercel build logs
- [ ] Monitor server console for errors
- [ ] Review API error responses
- [ ] Test rate limiting isn't blocking requests
- [ ] Verify Blob storage quota
- [ ] Check Redis connection status

## Rollback Plan

If deployment fails:

- [ ] Revert to previous version: `git revert <commit>`
- [ ] Push to GitHub
- [ ] Vercel auto-redeploys from new commit
- [ ] Or use "Deployments" tab in Vercel to revert
- [ ] Restore database from backup if needed

---

## Success Criteria

Your system is ready when:

- ✓ Users can register and login
- ✓ Admin can create courses and assign lecturers
- ✓ Lecturers can start sessions and see QR codes
- ✓ Students can scan QR and mark attendance
- ✓ Photos upload successfully to Blob storage
- ✓ Rate limiting prevents brute force attacks
- ✓ All environment variables are set
- ✓ System is deployed to production URL
- ✓ No errors in Vercel logs

---

## Need Help?

See the main README.md for:
- Complete setup instructions
- Troubleshooting guide
- Security considerations
- API reference

Contact: support@lmu.edu.cm
