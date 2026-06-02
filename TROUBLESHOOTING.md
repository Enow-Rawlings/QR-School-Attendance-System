# Troubleshooting Guide

Solutions for common issues encountered during setup and operation.

## Table of Contents

1. [Setup Issues](#setup-issues)
2. [Database Issues](#database-issues)
3. [Authentication Issues](#authentication-issues)
4. [Attendance Marking Issues](#attendance-marking-issues)
5. [Deployment Issues](#deployment-issues)
6. [Performance Issues](#performance-issues)

---

## Setup Issues

### Issue: "Supabase URL is required"

**Symptom**: Build fails with "supabaseUrl is required" error

**Cause**: Environment variables not set during build

**Solution**:
1. Add `NEXT_PUBLIC_SUPABASE_URL` to Vercel environment variables
2. Make sure it's set for all environments (Production, Preview, Development)
3. Rebuild: `git push origin main` (auto-redeploys)

**Quick Fix Locally**:
```bash
# Verify .env.local has the variable
cat .env.local | grep SUPABASE_URL

# Clear next cache and rebuild
rm -rf .next
pnpm run build
```

---

### Issue: "Cannot find module 'zod'" or other dependency errors

**Symptom**: "Module not found" error during build or dev

**Cause**: Dependencies not installed

**Solution**:
```bash
# Clean install
pnpm install --force

# Verify specific package
pnpm list zod

# Rebuild
pnpm run dev
```

---

### Issue: Port 3000 already in use

**Symptom**: "Error: listen EADDRINUSE: address already in use :::3000"

**Solution**:
```bash
# Option 1: Kill process on port 3000
lsof -ti :3000 | xargs kill -9

# Option 2: Use different port
pnpm run dev -- -p 3001
```

---

## Database Issues

### Issue: "Failed to connect to Supabase"

**Symptom**: "Error connecting to database" or "POSTGRES_URL not found"

**Cause**: Database credentials incorrect or Supabase project not active

**Solution**:

1. **Verify credentials**:
   ```bash
   # Check .env.local has correct variables
   cat .env.local | grep POSTGRES
   ```

2. **Test Supabase connection**:
   ```bash
   # In Supabase dashboard, go to SQL Editor
   # Run simple query: SELECT 1
   # If it works, your DB is working
   ```

3. **Verify POSTGRES_URL format**:
   ```
   # Correct format:
   postgresql://postgres:PASSWORD@HOST:5432/postgres
   
   # Or use connection pooling:
   postgresql://postgres:PASSWORD@HOST:6543/postgres
   ```

4. **Check Supabase project is active**:
   - Supabase Dashboard → Project Settings
   - Ensure "Pause Project" is not checked

---

### Issue: "Tables not found" or "Relation 'users' does not exist"

**Symptom**: SQL errors about missing tables

**Cause**: Database schema not created

**Solution**:

1. **Run migration manually**:
   - Open Supabase SQL Editor
   - Copy from `/supabase/migrations/001_initial_schema.sql`
   - Paste and run

2. **Verify tables exist**:
   - Supabase Dashboard → Table Editor
   - You should see all 9 tables:
     - users, classes, courses, course_lecturers
     - course_classes, course_enrollments
     - sessions, attendance, used_tokens

3. **If tables missing**, check for SQL errors:
   - Run migration again
   - Check for constraint errors
   - Verify UUID extension exists

---

### Issue: Slow queries or timeout errors

**Symptom**: API requests timing out or very slow

**Cause**: Missing database indexes or large datasets

**Solution**:

1. **Add indexes**:
   ```sql
   CREATE INDEX idx_attendance_session ON attendance(session_id);
   CREATE INDEX idx_attendance_student ON attendance(student_id);
   CREATE INDEX idx_sessions_course ON sessions(course_id);
   CREATE INDEX idx_course_enrollments_student ON course_enrollments(student_id);
   ```

2. **Check query performance**:
   - Supabase Dashboard → Logs → Database
   - Look for slow queries
   - Optimize WHERE clauses

3. **Increase connection pool**:
   - Supabase → Project Settings → Database → Pooling
   - Increase max connections if needed

---

## Authentication Issues

### Issue: Login page shows "Invalid credentials"

**Symptom**: Cannot login even with correct email/password

**Causes & Solutions**:

1. **User account doesn't exist**:
   ```sql
   -- Check if user exists
   SELECT * FROM users WHERE email = 'your-email@test.com';
   ```

2. **Account not verified**:
   ```sql
   -- Manually verify for testing
   UPDATE users SET is_verified = TRUE 
   WHERE email = 'your-email@test.com';
   ```

3. **Password incorrect**:
   - Passwords are hashed, cannot view
   - Use password reset (if implemented) or recreate account

4. **Supabase JWT_SECRET mismatch**:
   - Ensure `SUPABASE_JWT_SECRET` matches exactly
   - Copy from: Supabase → Settings → Database → Connectors → "Connectors" section

---

### Issue: "Invalid token" or "Token expired"

**Symptom**: After login, redirects back to login page

**Causes & Solutions**:

1. **JWT_SECRET incorrect**:
   - Verify `SUPABASE_JWT_SECRET` in environment
   - Must match Supabase project exactly

2. **Session expired**:
   - Sessions last 24 hours
   - Login again

3. **Clock skew between servers**:
   - Server time misaligned
   - Fix by syncing server time:
     ```bash
     ntpdate -s time.nist.gov  # Linux
     ```

---

### Issue: "Unauthorized" or "Forbidden" errors

**Symptom**: Getting 403 errors on protected endpoints

**Causes & Solutions**:

1. **Not logged in**:
   - Check: are you sending auth cookie?
   - Curl example:
     ```bash
     curl -b "token=YOUR_JWT" /api/admin/courses
     ```

2. **Wrong role for endpoint**:
   - Admin endpoints need `role: 'admin'`
   - Verify user role in database:
     ```sql
     SELECT email, role FROM users WHERE email = 'admin@test.com';
     ```

3. **Expired session cookie**:
   - Delete cookies and login again
   - Browser Dev Tools → Application → Cookies

---

## Attendance Marking Issues

### Issue: "QR code won't scan" or "Invalid token"

**Symptom**: Student sees error when scanning QR

**Causes & Solutions**:

1. **Token already expired**:
   - QR tokens expire in 20 seconds
   - Solution: Refresh QR on lecturer screen

2. **Token already used**:
   - Check `used_tokens` table:
     ```sql
     SELECT * FROM used_tokens WHERE token_hash = 'hash';
     ```
   - Refresh QR code to generate new token

3. **PIN incorrect**:
   - PIN is case-sensitive, 4 digits only
   - Verify PIN shown in attendance session

4. **Session closed**:
   - Check session status:
     ```sql
     SELECT status, closes_at FROM sessions WHERE id = 'session-uuid';
     ```
   - If closed, lecturer needs to start new session

---

### Issue: "Photo upload failed" or "BLOB_READ_WRITE_TOKEN invalid"

**Symptom**: Photo upload fails with 403 or token error

**Causes & Solutions**:

1. **Token incorrect**:
   - Verify `BLOB_READ_WRITE_TOKEN` in environment
   - Copy from: Vercel → Settings → Storage → Blob

2. **Blob not enabled**:
   - Vercel Dashboard → Settings → Storage
   - Create new Blob storage if not present

3. **Storage quota exceeded**:
   - Check usage: Vercel → Settings → Storage → Blob
   - Upgrade plan if needed
   - Or delete old photos

4. **Webcam permission denied**:
   - Check browser permissions for camera
   - Allow camera access in browser settings

---

### Issue: "Student not enrolled" or "Cannot mark attendance"

**Symptom**: Error says student not enrolled in course

**Causes & Solutions**:

1. **Student not in correct class level**:
   - Student auto-enrolls based on `level`
   - Verify user level:
     ```sql
     SELECT level FROM users WHERE id = 'student-uuid';
     ```
   - Course must be assigned to that level's class

2. **Course not assigned to class**:
   - Check assignment:
     ```sql
     SELECT * FROM course_classes 
     WHERE course_id = 'course-uuid';
     ```
   - Admin must assign course to the class

3. **Enrollment failed silently**:
   - Check enrollments:
     ```sql
     SELECT * FROM course_enrollments 
     WHERE student_id = 'student-uuid';
     ```
   - Manually create enrollment if missing

---

### Issue: Attendance marked but not showing in lecturer view

**Symptom**: Student marked attendance, but lecturer doesn't see it

**Causes & Solutions**:

1. **Page not refreshed**:
   - Lecturer needs to manually refresh page
   - (Real-time updates require WebSocket upgrade)

2. **Attendance in wrong table**:
   - Check database:
     ```sql
     SELECT * FROM attendance 
     WHERE session_id = 'session-uuid'
     ORDER BY marked_at DESC;
     ```

3. **Lecturer viewing wrong session**:
   - Verify session ID matches student's attendance

---

## Deployment Issues

### Issue: Build fails on Vercel with "Build failed"

**Symptom**: Vercel build shows error, deploy doesn't complete

**Solution**:

1. **Check build logs**:
   - Vercel Dashboard → Deployments
   - Click failed deployment → View logs

2. **Common build errors**:
   - **TypeScript errors**: Fix and push to git
   - **Missing env vars**: Add to Vercel environment variables
   - **Build timeout**: Increase build timeout in settings

3. **Debug locally first**:
   ```bash
   # Build locally before deploying
   pnpm run build
   
   # Check for errors
   # Fix errors locally
   
   # Push to git
   git push origin main
   ```

---

### Issue: "Cannot find module" errors on deployed site

**Symptom**: Works locally but fails on Vercel

**Cause**: Dependencies not installed on Vercel

**Solution**:

1. **Force clean install on Vercel**:
   - Vercel Dashboard → Settings → Build & Development Settings
   - Toggle "Automatically install dependencies" OFF/ON

2. **Or manually clean and redeploy**:
   ```bash
   git commit --allow-empty -m "Trigger rebuild"
   git push origin main
   ```

3. **Check package.json**:
   - All packages must be in `dependencies` (not `devDependencies`)
   - Re-check: `pnpm list <package>`

---

### Issue: Environment variables not working on deployed site

**Symptom**: Deployed site shows env var errors

**Solution**:

1. **Verify variables added to Vercel**:
   - Vercel Dashboard → Settings → Environment Variables
   - Check they're set for "Production" environment

2. **Redeploy after adding variables**:
   ```bash
   # Make small change
   echo "" >> README.md
   git add .
   git commit -m "Trigger redeploy"
   git push origin main
   ```

3. **Check variable format**:
   - No quotes around values
   - No `export` prefix
   - No extra spaces

---

### Issue: CORS errors on deployed site

**Symptom**: Cross-origin requests failing

**Solution**:

1. **Add deployment URL**:
   - Your API calls are blocked
   - Check API route CORS headers
   - Add `NEXT_PUBLIC_APP_URL` to `.env`

2. **Verify Supabase CORS**:
   - Supabase → Settings → API → CORS
   - Add your Vercel deployment URL

---

## Performance Issues

### Issue: Attendance marking is slow

**Symptom**: Takes >2 seconds to mark attendance

**Causes & Solutions**:

1. **Database queries too slow**:
   - Add indexes (see Database Issues section)
   - Use `EXPLAIN ANALYZE` to check query plans

2. **Image upload taking too long**:
   - Check photo size being uploaded
   - Compress before upload if >5MB

3. **Rate limiting kicking in**:
   - Check Upstash Redis logs
   - May need to increase rate limit

---

### Issue: High memory usage or crashes

**Symptom**: Server uses lots of memory or becomes unresponsive

**Solution**:

1. **Check Vercel logs**:
   - Vercel Dashboard → Functions
   - Look for memory exceeded warnings

2. **Optimize database queries**:
   - Avoid large SELECT * queries
   - Use indexes
   - Add pagination

3. **Monitor resource usage**:
   - Vercel Analytics → Web Vitals
   - Check CPU and memory metrics

---

### Issue: QR scanning slow or laggy

**Symptom**: QR camera preview stutters

**Solution**:

1. **Lower camera resolution**:
   - Edit `/components/qr/QRScanner.tsx`
   - Set video constraints to lower resolution

2. **Reduce UI updates**:
   - Add debouncing to scan detection
   - Reduce re-renders

---

## Getting Help

### Before Posting Issue

1. **Check these docs first**:
   - README.md (Troubleshooting section)
   - This file (TROUBLESHOOTING.md)
   - API_REFERENCE.md (for API errors)

2. **Gather information**:
   - Error message (exact text)
   - Steps to reproduce
   - Browser/device info
   - Environment (local/production)

3. **Check logs**:
   - Browser console (F12 → Console)
   - Vercel logs (for deployed issues)
   - Database logs (Supabase SQL Logs)

### Contacting Support

**For technical issues**:
- Email: support@lmu.edu.cm
- Include: Error message, steps to reproduce, environment

**For Supabase issues**:
- Supabase Dashboard → Support
- Directly contact Supabase support

**For Vercel issues**:
- Vercel Dashboard → Support
- Visit vercel.com/help

---

## Diagnostic Commands

### Check Environment Variables

```bash
# Local development
cat .env.local | grep -E "SUPABASE|BLOB|UPSTASH"

# Vercel (check in dashboard)
# Settings → Environment Variables → View
```

### Check Database Connection

```bash
# Using psql (if installed)
psql "postgresql://postgres:PASSWORD@HOST:5432/postgres"

# Run test query
SELECT count(*) FROM users;
```

### Check Redis Connection

```bash
# Using curl (test Upstash)
curl -H "Authorization: Bearer TOKEN" "https://YOUR_REDIS.upstash.io/get/test"
```

### Check Blob Storage

```bash
# Test upload (requires BLOB_READ_WRITE_TOKEN)
curl -X PUT \
  -H "Authorization: Bearer TOKEN" \
  -d "test data" \
  https://blob.vercelusercontent.com/test
```

---

## Common Error Messages

| Error | Meaning | Solution |
|-------|---------|----------|
| "Invalid credentials" | Email or password wrong | Check password, recreate account |
| "Token expired" | JWT too old | Login again |
| "Unauthorized" | Not logged in | Login first |
| "Forbidden" | Wrong role | Use correct role account |
| "Not found" | Resource doesn't exist | Check IDs in database |
| "Conflict" | Duplicate entry | E.g., already marked attendance |
| "Rate limited" | Too many requests | Wait 15 min or reduce attempts |
| "Database error" | Query failed | Check Supabase logs |

---

## Debug Mode

To enable more detailed logging:

1. **Create debug wrapper**:
   ```typescript
   const log = (message: string, data?: any) => {
     if (process.env.DEBUG === 'true') {
       console.log(`[DEBUG] ${message}`, data);
     }
   };
   ```

2. **Set in .env.local**:
   ```
   DEBUG=true
   ```

3. **Use in code**:
   ```typescript
   log('Database query', { table: 'users' });
   ```

---

**Last Updated**: May 26, 2026  
**Version**: 1.0.0
