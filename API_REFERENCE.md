# API Reference - QR Attendance System

Complete API endpoint documentation for the attendance system.

## Authentication Endpoints

### POST /api/auth/register

Register a new user account (student or lecturer).

**Request:**
```json
{
  "email": "student@lmu.edu.cm",
  "password": "SecurePass123",
  "full_name": "John Doe",
  "role": "student",
  "level": "Level 200",
  "student_id": "STU123456"
}
```

**Response (200):**
```json
{
  "user": {
    "id": "uuid",
    "email": "student@lmu.edu.cm",
    "full_name": "John Doe",
    "role": "student"
  }
}
```

**Status Codes:**
- `200` - Account created successfully
- `400` - Invalid input or email already exists
- `429` - Too many requests (rate limited)

---

### POST /api/auth/login

Authenticate and receive JWT session token.

**Request:**
```json
{
  "email": "student@lmu.edu.cm",
  "password": "SecurePass123"
}
```

**Response (200):**
```json
{
  "user": {
    "id": "uuid",
    "email": "student@lmu.edu.cm",
    "role": "student"
  }
}
```

**Headers Set:**
- `Set-Cookie: token=<JWT>; HttpOnly; SameSite=Strict`

**Status Codes:**
- `200` - Login successful
- `401` - Invalid credentials
- `429` - Too many login attempts

---

### GET /api/auth/me

Get current authenticated user information.

**Headers:**
```
Cookie: token=<JWT>
```

**Response (200):**
```json
{
  "user": {
    "id": "uuid",
    "email": "student@lmu.edu.cm",
    "full_name": "John Doe",
    "role": "student",
    "level": "Level 200"
  }
}
```

**Status Codes:**
- `200` - User authenticated
- `401` - Not authenticated or token expired
- `403` - Invalid token signature

---

### POST /api/auth/logout

Clear session cookie and logout.

**Response (200):**
```json
{ "message": "Logged out successfully" }
```

---

## Admin Endpoints

### POST /api/admin/courses

Create a new course with schedule.

**Headers:**
```
Cookie: token=<ADMIN_JWT>
Content-Type: application/json
```

**Request:**
```json
{
  "name": "Web Development Fundamentals",
  "code": "CS201",
  "department": "Software Engineering",
  "day_of_week": "Monday",
  "start_time": "09:00",
  "end_time": "11:00"
}
```

**Response (201):**
```json
{
  "course": {
    "id": "uuid",
    "name": "Web Development Fundamentals",
    "code": "CS201",
    "day_of_week": "Monday",
    "start_time": "09:00",
    "end_time": "11:00"
  }
}
```

**Status Codes:**
- `201` - Course created
- `400` - Invalid data
- `401` - Not authenticated
- `403` - Not admin

---

### GET /api/admin/courses

List all courses.

**Query Parameters:**
- `department` (optional) - Filter by department

**Response (200):**
```json
{
  "courses": [
    {
      "id": "uuid",
      "name": "Web Development",
      "code": "CS201",
      "day_of_week": "Monday",
      "start_time": "09:00",
      "end_time": "11:00"
    }
  ]
}
```

---

### POST /api/admin/classes

Create a new class/level.

**Request:**
```json
{
  "name": "Level 200 A",
  "level": "Level 200",
  "department": "Software Engineering"
}
```

**Response (201):**
```json
{
  "class": {
    "id": "uuid",
    "name": "Level 200 A",
    "level": "Level 200"
  }
}
```

---

### POST /api/admin/assignments/lecturers

Assign a lecturer to a course.

**Request:**
```json
{
  "course_id": "uuid",
  "lecturer_id": "uuid"
}
```

**Validation:**
- Checks for schedule conflicts with lecturer's other courses
- Prevents overlapping course times

**Response (201):**
```json
{
  "message": "Lecturer assigned to course",
  "assignment": {
    "course_id": "uuid",
    "lecturer_id": "uuid",
    "assigned_at": "2026-05-26T10:00:00Z"
  }
}
```

---

### POST /api/admin/assignments/classes

Assign a course to a class.

**Request:**
```json
{
  "course_id": "uuid",
  "class_id": "uuid"
}
```

**Response (201):**
```json
{
  "message": "Course assigned to class"
}
```

---

## Lecturer Endpoints

### GET /api/courses/my-courses

Get all courses assigned to logged-in lecturer.

**Response (200):**
```json
{
  "courses": [
    {
      "id": "uuid",
      "name": "Web Development",
      "code": "CS201",
      "day_of_week": "Monday",
      "start_time": "09:00",
      "end_time": "11:00"
    }
  ]
}
```

---

### POST /api/sessions/start

Start an attendance session for a course.

**Request:**
```json
{
  "course_id": "uuid"
}
```

**Validation:**
- Lecturer must be assigned to the course
- Current time must be within course schedule (day and time)

**Response (201):**
```json
{
  "session": {
    "id": "uuid",
    "course_id": "uuid",
    "qr_token": "eyJhbGc...",
    "pin_code": "5847",
    "status": "active",
    "closes_at": "2026-05-26T11:00:00Z"
  }
}
```

---

### POST /api/sessions/refresh

Generate new QR token and PIN for active session.

**Request:**
```json
{
  "session_id": "uuid"
}
```

**Response (200):**
```json
{
  "qr_token": "eyJhbGc...",
  "pin_code": "2934",
  "expires_in": 20
}
```

**Note:** Tokens expire in 20 seconds and can only be used once.

---

### POST /api/sessions/close

Close an active attendance session.

**Request:**
```json
{
  "session_id": "uuid"
}
```

**Response (200):**
```json
{
  "message": "Session closed",
  "attendance_count": 45
}
```

---

### GET /api/sessions?id=<session_id>

Get session details.

**Response (200):**
```json
{
  "session": {
    "id": "uuid",
    "status": "active",
    "started_at": "2026-05-26T10:00:00Z",
    "closes_at": "2026-05-26T11:00:00Z"
  }
}
```

---

### GET /api/attendance?session_id=<session_id>

Get attendance records for a session.

**Response (200):**
```json
{
  "attendance": [
    {
      "id": "uuid",
      "student_id": "uuid",
      "student_name": "John Doe",
      "student_id_number": "STU123456",
      "photo_url": "https://blob.vercelusercontent.com/...",
      "marked_at": "2026-05-26T10:15:00Z"
    }
  ],
  "total": 45
}
```

---

## Student Endpoints

### GET /api/sessions/student

Get active sessions for enrolled courses.

**Response (200):**
```json
{
  "sessions": [
    {
      "id": "uuid",
      "course_id": "uuid",
      "course_name": "Web Development",
      "course_code": "CS201",
      "lecturer_name": "Dr. Jane Smith",
      "started_at": "2026-05-26T10:00:00Z",
      "closes_at": "2026-05-26T11:00:00Z"
    }
  ]
}
```

---

### POST /api/attendance/mark

Mark attendance with QR token, PIN, and photo.

**Request:**
```json
{
  "qr_token": "eyJhbGc...",
  "pin_code": "5847",
  "photo_url": "https://blob.vercelusercontent.com/photo-xyz"
}
```

**Validation Chain:**
1. Verify QR token signature and expiry (20 seconds)
2. Check token hasn't been used before
3. Verify session is still active
4. Validate PIN code matches
5. Check student is enrolled in course
6. Prevent duplicate attendance

**Response (201):**
```json
{
  "message": "Attendance recorded successfully",
  "attendance": {
    "id": "uuid",
    "session_id": "uuid",
    "student_id": "uuid",
    "photo_url": "...",
    "marked_at": "2026-05-26T10:15:00Z"
  }
}
```

**Status Codes:**
- `201` - Attendance recorded
- `400` - Invalid token or PIN
- `401` - Token expired or already used
- `403` - Student not enrolled in course
- `409` - Duplicate attendance (already marked)
- `429` - Rate limited (too many attempts)

---

## Error Responses

All error responses follow this format:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

### Common Error Codes

| Code | Status | Meaning |
|------|--------|---------|
| `INVALID_CREDENTIALS` | 401 | Email or password incorrect |
| `TOKEN_EXPIRED` | 401 | JWT session expired |
| `INVALID_TOKEN` | 403 | Token signature invalid |
| `UNAUTHORIZED` | 403 | Missing required role |
| `NOT_FOUND` | 404 | Resource doesn't exist |
| `CONFLICT` | 409 | Duplicate entry (e.g., already marked) |
| `RATE_LIMITED` | 429 | Too many requests |
| `SCHEDULE_CONFLICT` | 400 | Course times overlap |
| `INVALID_INPUT` | 400 | Bad request data |

---

## Rate Limiting

Endpoints are rate-limited using Upstash Redis:

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/api/auth/login` | 5 attempts | 15 minutes |
| `/api/auth/register` | 3 new emails | 1 hour |
| `/api/attendance/mark` | 10 attempts | 10 minutes |
| `/api/sessions/start` | Unlimited | - |

Response includes rate limit headers:

```
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 3
X-RateLimit-Reset: 1234567890
```

---

## Pagination

List endpoints support pagination:

**Query Parameters:**
- `page` (default: 1) - Page number
- `limit` (default: 20, max: 100) - Items per page

**Response:**
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

---

## Timestamps

All timestamps are in ISO 8601 format with timezone:
```
2026-05-26T10:15:00Z
```

---

## Notes

- All requests require `Content-Type: application/json` header for POST/PATCH
- Authentication uses JWT in httpOnly cookies (automatic with Fetch)
- QR tokens are one-time use and expire in 20 seconds
- PIN codes are 4 random digits
- Student photos are stored in Vercel Blob, only URLs are stored in DB
