# Deployment & Testing Guide

Complete instructions for deploying and testing the QR Attendance System.

## Pre-Deployment Checklist

Before deploying to production, ensure:

- [ ] All environment variables are set in Vercel dashboard
- [ ] Supabase database schema is created and tested
- [ ] Blob storage is enabled and tokens are valid
- [ ] Redis connection is working
- [ ] Local testing is complete and successful
- [ ] Git repository is clean (no uncommitted changes)
- [ ] `package.json` dependencies are up to date

## Deployment Steps

### 1. GitHub Repository Setup

```bash
# Initialize git if not already done
git init

# Add your GitHub repository
git remote add origin https://github.com/YOUR_USERNAME/lmu-attendance.git

# Create initial commit
git add .
git commit -m "Initial commit: QR attendance system for LMU Buea"

# Push to main branch
git branch -M main
git push -u origin main
```

### 2. Connect to Vercel

1. Go to https://vercel.com/new
2. Click "Import Git Repository"
3. Select your GitHub repository
4. Configure project:
   - **Framework**: Next.js (auto-detected)
   - **Build Command**: `pnpm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `pnpm install`

### 3. Add Environment Variables in Vercel

In Project Settings → Environment Variables, add:

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret

# Upstash Redis
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token

# Vercel Blob
BLOB_READ_WRITE_TOKEN=your-blob-token

# App Config
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
NODE_ENV=production
```

**Important**: 
- Check "All Environments" for each variable (Production, Preview, Development)
- Never use local `.env.local` values in production
- Rotate secrets every 90 days

### 4. Deploy

1. Click "Deploy" button
2. Watch the build process:
   - Vercel installs dependencies
   - Runs `pnpm run build`
   - Optimizes for production
   - Deployment completes

### 5. Post-Deployment Verification

After deployment completes:

1. **Visit Production URL**
   - Note the URL from Vercel dashboard
   - Example: `https://lmu-attendance.vercel.app`

2. **Test Login Page**
   - URL should be `/login`
   - Check all UI elements render correctly
   - Verify animations work smoothly

3. **Test Registration**
   - Create test student account
   - Verify form validation works
   - Check success message

4. **Test Authentication**
   - Login with new credentials
   - Verify redirect to dashboard
   - Check user info displays correctly

## Testing Procedures

### Unit Testing

Run automated tests:

```bash
pnpm run test
```

### Integration Testing

Test full workflows:

#### Test 1: Student Registration & Login
```bash
# 1. Register student
curl -X POST https://your-domain.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teststu@lmu.edu.cm",
    "password": "TestPass123",
    "full_name": "Test Student",
    "role": "student",
    "level": "Level 200"
  }'

# 2. Login
curl -X POST https://your-domain.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teststu@lmu.edu.cm",
    "password": "TestPass123"
  }'

# 3. Verify current user
curl https://your-domain.vercel.app/api/auth/me \
  -H "Cookie: token=<JWT_FROM_LOGIN>"
```

#### Test 2: Admin Course Creation
```bash
# Create a class
curl -X POST https://your-domain.vercel.app/api/admin/classes \
  -H "Content-Type: application/json" \
  -H "Cookie: token=<ADMIN_JWT>" \
  -d '{
    "name": "Level 200 A",
    "level": "Level 200",
    "department": "Software Engineering"
  }'

# Create a course
curl -X POST https://your-domain.vercel.app/api/admin/courses \
  -H "Content-Type: application/json" \
  -H "Cookie: token=<ADMIN_JWT>" \
  -d '{
    "name": "Introduction to Web Dev",
    "code": "CS201",
    "department": "Software Engineering",
    "day_of_week": "Monday",
    "start_time": "09:00",
    "end_time": "11:00"
  }'
```

#### Test 3: Lecturer Session & Attendance
```bash
# Lecturer starts session
curl -X POST https://your-domain.vercel.app/api/sessions/start \
  -H "Content-Type: application/json" \
  -H "Cookie: token=<LECTURER_JWT>" \
  -d '{"course_id": "COURSE_UUID"}'

# Get QR token and PIN from response
# Student marks attendance
curl -X POST https://your-domain.vercel.app/api/attendance/mark \
  -H "Content-Type: application/json" \
  -d '{
    "qr_token": "JWT_TOKEN_FROM_QR",
    "pin_code": "1234",
    "photo_url": "https://blob.vercelusercontent.com/photo"
  }'
```

### Performance Testing

Check system performance:

```bash
# Lighthouse audit
pnpm run lighthouse

# Load testing (optional - requires k6 or similar)
# Test with 100 concurrent users marking attendance
```

### Security Testing

Verify security measures:

1. **SQL Injection Test**
   ```bash
   # Try to inject SQL in email field
   curl -X POST /api/auth/register \
     -d '{"email": "test@test.com\" OR 1=1 --", ...}'
   # Should fail validation
   ```

2. **Rate Limiting Test**
   ```bash
   # Try 6 logins in 15 minutes (limit is 5)
   for i in {1..6}; do
     curl -X POST /api/auth/login \
       -d '{"email": "test@test.com", "password": "wrong"}'
   done
   # 6th should return 429 (Too Many Requests)
   ```

3. **Token Expiry Test**
   - Wait 20 seconds after starting a session
   - Try to use old QR token
   - Should fail with "Token Expired"

4. **One-Time Token Test**
   - Use QR token to mark attendance
   - Try to use same token again
   - Should fail with "Token Already Used"

## Continuous Integration / Continuous Deployment (CI/CD)

### GitHub Actions Setup

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'pnpm'
      
      - run: pnpm install
      - run: pnpm run build
      - run: pnpm run lint
      
      - name: Deploy to Vercel
        if: github.ref == 'refs/heads/main'
        uses: vercel/action@master
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

### Setup GitHub Secrets

1. Get Vercel API token:
   - Vercel Dashboard → Settings → Tokens
   - Create new token
   - Copy and save securely

2. Get Vercel IDs:
   - Vercel Dashboard → Project → Settings
   - Copy Project ID and Organization ID

3. Add to GitHub:
   - Repository → Settings → Secrets → New repository secret
   - Add `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`

## Monitoring & Maintenance

### Daily Checks

```bash
# Check Vercel logs
# Vercel Dashboard → Deployments → View logs

# Check error rates
# Vercel Dashboard → Analytics → Errors

# Check performance metrics
# Vercel Dashboard → Analytics → Web Vitals
```

### Weekly Tasks

1. **Review Attendance Statistics**
   ```sql
   -- In Supabase SQL Editor
   SELECT 
     c.name,
     COUNT(a.id) as total_attendance
   FROM courses c
   LEFT JOIN sessions s ON c.id = s.course_id
   LEFT JOIN attendance a ON s.id = a.session_id
   GROUP BY c.id
   ORDER BY total_attendance DESC;
   ```

2. **Check Failed Transactions**
   ```bash
   # Monitor failed API requests
   # Check /api/attendance/mark errors
   # Check /api/auth/login rate limits
   ```

3. **Verify File Storage Usage**
   - Vercel Dashboard → Storage → Blob
   - Check total files and storage used
   - Plan cleanup if needed

### Monthly Maintenance

1. **Database Optimization**
   ```sql
   -- Analyze query performance
   ANALYZE;
   
   -- Vacuum to reclaim space
   VACUUM;
   ```

2. **Archive Old Data**
   ```sql
   -- Archive attendance records older than 1 year
   INSERT INTO attendance_archive
   SELECT * FROM attendance 
   WHERE marked_at < NOW() - INTERVAL '1 year';
   
   DELETE FROM attendance 
   WHERE marked_at < NOW() - INTERVAL '1 year';
   ```

3. **Security Review**
   - Rotate API keys and tokens
   - Review access logs
   - Check for suspicious activity
   - Update dependencies for security patches

## Rollback Procedures

### If Deployment Fails

1. **Check Build Logs**
   - Vercel Dashboard → Deployments
   - Click failed deployment
   - Review build output for errors

2. **Revert to Previous Version**
   ```bash
   # Find previous commit
   git log --oneline -5
   
   # Revert to previous version
   git revert <COMMIT_ID>
   git push origin main
   
   # Vercel auto-redeploys from new commit
   ```

3. **Manual Rollback via Vercel**
   - Vercel Dashboard → Deployments
   - Find previous working deployment
   - Click "..." menu → "Promote to Production"

### If Database is Corrupted

1. **Restore from Backup**
   - Supabase Dashboard → Backups
   - Select backup point
   - Click "Restore"
   - Wait for restoration (5-30 minutes)

2. **Contact Supabase Support**
   - Supabase Dashboard → Support
   - File a support ticket
   - Request manual recovery if needed

## Scaling for Production

### When to Scale

- **10K+ Students**: Add database read replicas
- **1000+ Concurrent**: Increase Redis capacity
- **High Upload Rate**: Increase Blob quota

### Scaling Steps

1. **Database Replication**
   ```bash
   # In Supabase
   Settings → Database → Create Read Replica
   ```

2. **Redis Upgrade**
   ```bash
   # In Upstash
   Database → Plan → Upgrade to Premium
   ```

3. **Blob Quota**
   ```bash
   # In Vercel
   Settings → Storage → Blob → Upgrade
   ```

## Success Indicators

Your production deployment is successful when:

✓ Zero deployment errors  
✓ All environment variables loaded correctly  
✓ Database connections stable  
✓ File uploads work consistently  
✓ Rate limiting active without false positives  
✓ User authentication works seamlessly  
✓ Attendance marking completes in <2 seconds  
✓ QR codes scan without errors  
✓ Admin can manage courses and users  
✓ Lecturers can start sessions and monitor attendance  
✓ Students auto-enroll in correct courses  

---

## Need Help?

- Check README.md for general setup
- See API_REFERENCE.md for endpoint details
- Review SETUP_CHECKLIST.md for step-by-step walkthrough
- Contact: support@lmu.edu.cm
