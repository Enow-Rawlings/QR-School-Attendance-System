import { z } from 'zod';

// Authentication schemas
export const registerStudentSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  full_name: z.string().min(2, 'Full name is required'),
  student_id: z.string().min(1, 'Student ID is required'),
  level: z.enum(['Level 200', 'Level 300', 'Level 400', 'Masters Year 1', 'Masters Year 2']),
  department: z.string().min(1, 'Department is required'),
});

export const registerLecturerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  full_name: z.string().min(2, 'Full name is required'),
  department: z.string().min(1, 'Department is required'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Course management schemas
export const baseCourseSchema = z.object({
  name: z.string().min(1, 'Course name is required'),
  code: z.string().min(1, 'Course code is required').regex(/^[A-Z]{2,4}\d{3}$/, 'Invalid course code format'),
  department: z.string().min(1, 'Department is required'),
});

const scheduleEntrySchema = z.object({
  day_of_week: z.enum(['Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']),
  start_time: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:MM)'),
  end_time: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:MM)'),
}).refine((entry) => {
  const [startHour, startMin] = entry.start_time.split(':').map(Number);
  const [endHour, endMin] = entry.end_time.split(':').map(Number);
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  return endMinutes > startMinutes;
}, {
  message: 'End time must be after start time',
  path: ['end_time'],
});

const scheduleSchema = z.array(scheduleEntrySchema).min(1, 'At least one schedule entry is required');

export const createCourseSchema = baseCourseSchema.extend({
  class_id: z.string().uuid().optional(),
  schedule: scheduleSchema,
});

export const updateCourseSchema = createCourseSchema.partial().merge(z.object({
  id: z.string().uuid(),
}));

export const deleteCourseSchema = z.object({
  id: z.string().uuid(),
});

// Class management schemas
export const createClassSchema = z.object({
  level: z.enum(['Level 200', 'Level 300', 'Level 400', 'Masters Year 1', 'Masters Year 2']),
  department: z.string().min(1, 'Department is required'),
});

export const updateClassSchema = createClassSchema.partial().merge(z.object({
  id: z.string().uuid(),
}));

// Assignment schemas
export const assignLecturerSchema = z.object({
  course_id: z.string().uuid('Invalid course ID'),
  lecturer_id: z.string().uuid('Invalid lecturer ID'),
});

export const assignClassSchema = z.object({
  course_id: z.string().uuid('Invalid course ID'),
  class_id: z.string().uuid('Invalid class ID'),
});

// Session schemas
export const startSessionSchema = z.object({
  course_id: z.string().uuid('Invalid course ID'),
  timezoneOffset: z.number().int().min(-840).max(840).optional().describe('Minutes offset from UTC (e.g., -300 for EST, 330 for IST)'),
});

export const markAttendanceSchema = z.object({
  session_id: z.string().uuid('Invalid session ID'),
  qr_token: z.string().min(1, 'QR token is required'),
  pin_code: z.string().length(4, 'PIN must be 4 digits'),
});

export const closeSessionSchema = z.object({
  session_id: z.string().uuid('Invalid session ID'),
});

// Type exports
export type RegisterStudentInput = z.infer<typeof registerStudentSchema>;
export type RegisterLecturerInput = z.infer<typeof registerLecturerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateCourseInput = z.infer<typeof createCourseSchema>;
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;
export type CreateClassInput = z.infer<typeof createClassSchema>;
export type StartSessionInput = z.infer<typeof startSessionSchema>;
export type MarkAttendanceInput = z.infer<typeof markAttendanceSchema>;
