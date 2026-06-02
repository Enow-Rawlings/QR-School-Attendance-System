# Quick Start - 5 Minutes to Understand the System

Start here if you want a quick overview before diving into full documentation.

## What Is This System?

A **professional QR code-based attendance tracking system** for universities. Students scan a QR code to mark attendance, lecturers manage sessions, admins manage courses and data.

**Key Features**:
- 🎓 Role-based system (admin, lecturer, student)
- 📱 QR code scanning for attendance
- 📸 Photo verification to prevent fraud
- 🔐 Secure JWT authentication
- ⚡ Real-time attendance monitoring
- 📊 Comprehensive reports and analytics

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 + React 19 + TypeScript |
| Backend | Next.js API Routes |
| Database | Supabase (PostgreSQL) |
| File Storage | Vercel Blob |
| Rate Limiting | Upstash Redis |
| Auth | JWT + httpOnly Cookies |
| UI | shadcn/ui + Tailwind CSS |

---

## System Architecture (Simple)

```
Student/Lecturer/Admin
        │
        ▼
   Next.js App
   (UI + API)
        │
        ├─→ Supabase (Database)
        ├─→ Vercel Blob (Photos)
        └─→ Upstash (Rate Limiting)
```

---

## User Workflows (5 minutes)

### 👨‍💼 Admin Workflow
1. Login → Dashboard
2. Create courses with schedules
3. Create classes by level
4. Assign lecturers to courses
5. View attendance reports

### 👨‍🏫 Lecturer Workflow
1. Login → Dashboard
2. See assigned courses
3. Click "Start Session" for a course
4. QR code appears on screen
5. Students scan and submit
6. Watch attendance update in real-time

### 👨‍🎓 Student Workflow
1. Register (choose their level)
2. Login → Dashboard
3. See active sessions for their courses
4. Click "Mark Attendance"
5. Scan QR code → Enter PIN → Take photo
6. ✅ Attendance recorded

---

## 3-Step Setup

### Step 1: Get Credentials (20 minutes)

You'll need credentials from 3 services:

**Supabase** (Database)
- Go to https://supabase.com
- Create project
- Copy: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`

**Vercel Blob** (Photo Storage)
- Go to https://vercel.com
- Enable Blob in project settings
- Copy: `BLOB_READ_WRITE_TOKEN`

**Upstash** (Rate Limiting)
- Go to https://upstash.com  
- Create Redis database
- Copy: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`

### Step 2: Setup Database (5 minutes)

1. In Supabase, open SQL Editor
2. Copy entire contents of `/supabase/migrations/001_initial_schema.sql`
3. Paste and run
4. ✅ All tables created

### Step 3: Add Environment Variables (5 minutes)

Create `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
SUPABASE_SERVICE_ROLE_KEY=your-key
SUPABASE_JWT_SECRET=your-secret
BLOB_READ_WRITE_TOKEN=your-token
UPSTASH_REDIS_REST_URL=your-url
UPSTASH_REDIS_REST_TOKEN=your-token
```

---

## Run Locally

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm run dev

# Visit http://localhost:3000
```

**Test it**:
1. Register as student (Level 200)
2. As admin, create a course
3. As lecturer, start a session
4. As student, mark attendance

---

## Deploy to Vercel

```bash
# Push to GitHub
git push

# In Vercel dashboard:
# 1. Import repository
# 2. Add environment variables
# 3. Deploy
```

**That's it!** Your system is live.

---

## Directory Tour

```
Project/
├── 📄 README.md ← Full documentation
├── 📋 SETUP_CHECKLIST.md ← Step-by-step guide
├── 📘 DEPLOYMENT_AND_TESTING.md ← How to deploy
├── 🔌 API_REFERENCE.md ← All API endpoints
│
├── 📁 supabase/ ← Database
│   └── migrations/001_initial_schema.sql
│
├── 📁 lib/ ← Utilities
│   ├── auth.ts (authentication)
│   ├── db.ts (database)
│   └── rate-limit.ts (rate limiting)
│
├── 📁 app/ ← Pages & API
│   ├── (auth)/ (login, register)
│   ├── api/ (all endpoints)
│   └── admin/, lecturer/ (role-specific)
│
└── 📁 components/ ← UI components
    ├── auth/ (login/register UI)
    └── qr/ (QR code scanner)
```

---

## Key Endpoints (API)

**User Account**:
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Current user info

**Admin**:
- `POST /api/admin/courses` - Create course
- `POST /api/admin/classes` - Create class

**Lecturer**:
- `POST /api/sessions/start` - Start attendance session
- `GET /api/attendance` - View attendance records

**Student**:
- `GET /api/sessions/student` - Available sessions
- `POST /api/attendance/mark` - Mark attendance

**Full details**: See API_REFERENCE.md

---

## Database Tables

| Table | Purpose |
|-------|---------|
| `users` | Admin, lecturers, students |
| `classes` | Academic levels (200, 300, 400, Masters) |
| `courses` | Course info + schedules |
| `course_lecturers` | Links lecturers to courses |
| `course_classes` | Links courses to classes |
| `course_enrollments` | Student enrollment |
| `sessions` | Attendance sessions |
| `attendance` | Attendance records |
| `used_tokens` | Prevents token reuse |

---

## Security Highlights

✅ Passwords hashed (bcryptjs)  
✅ JWTs signed securely  
✅ Rate limiting on login/attendance  
✅ One-time QR tokens (20 second expiry)  
✅ httpOnly cookies (no JS access)  
✅ Input validation (Zod schemas)  
✅ SQL injection prevention  
✅ Schedule conflict detection  

---

## Common Questions

**Q: Do I need to set up email?**  
A: Not required. For testing, manually verify users. For production, add SendGrid later.

**Q: How do QR codes work?**  
A: Lecturer clicks "Start Session" → QR code appears → 20-second token → Refreshes automatically

**Q: What if token expires?**  
A: QR tokens expire in 20 seconds (by design). Just refresh the QR code on lecturer's screen.

**Q: Can students mark attendance twice?**  
A: No. System prevents duplicate attendance per session.

**Q: How do photos work?**  
A: Student takes photo during attendance → Uploaded to Vercel Blob → URL stored in database

**Q: What if internet cuts out?**  
A: Attendance won't be recorded. Students must retake before session closes.

---

## Next Steps

1. **Quick Setup** (30 min):
   - Get credentials from Supabase, Blob, Upstash
   - Create `.env.local`
   - Run `pnpm install && pnpm run dev`

2. **Test Locally** (15 min):
   - Register, login, create courses
   - Test attendance marking

3. **Deploy** (15 min):
   - Push to GitHub
   - Deploy via Vercel

4. **Go Live**:
   - Create initial admin
   - Create courses
   - Students register and mark attendance

---

## Documentation Map

**Different docs for different needs**:

- 📘 **README.md** - Complete system guide (start here)
- ⚡ **QUICK_START.md** - This file (5 min read)
- ✅ **SETUP_CHECKLIST.md** - Implementation checklist
- 🚀 **DEPLOYMENT_AND_TESTING.md** - Deployment guide
- 🔌 **API_REFERENCE.md** - All API endpoints
- 📍 **DOCUMENTATION.md** - Index of all documentation
- 📊 **PROGRESS.md** - What's been built
- 🎨 **DESIGN_ENHANCEMENTS.md** - UI/UX details
- 📦 **INTEGRATION_SUMMARY.md** - What you need to do

---

## Support

**Stuck?** Check these in order:

1. **Quick questions**: See this file (QUICK_START.md)
2. **How to setup**: See SETUP_CHECKLIST.md
3. **How to deploy**: See DEPLOYMENT_AND_TESTING.md
4. **API issues**: See API_REFERENCE.md
5. **Troubleshooting**: See README.md section

**Contact**: support@lmu.edu.cm

---

## Success Check

Your system works when:

- ✅ Can register and login
- ✅ Can create courses and classes
- ✅ Can start attendance sessions
- ✅ Can mark attendance with QR
- ✅ Photos upload successfully
- ✅ Deployed to Vercel

---

**Ready to start?** 👉 Go to **README.md** for full setup instructions

---

*Version 1.0 | May 2026 | Landmark Metropolitan University of Buea*
