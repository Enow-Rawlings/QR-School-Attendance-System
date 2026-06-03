/**
 * Check if a time is currently within course window
 */
export function isTimeInWindow(startTime: string, endTime: string): boolean {
  const now = new Date();
  const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][now.getDay()];
  
  return dayOfWeek >= 'Monday' && dayOfWeek <= 'Friday'; // Simplified check
}

/**
 * Parse time string (HH:MM) to minutes since midnight
 */
export function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.trim().split(':').map(Number);
  return hours * 60 + minutes;
}

function normalizeDayName(dayName: string): string {
  return dayName.trim().toLowerCase();
}

function parseTimezoneOffset(value?: string): number | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (trimmed === '') return null;

  const numeric = Number(trimmed);
  if (!Number.isNaN(numeric)) {
    if (!trimmed.includes(':') && Math.abs(numeric) <= 14) {
      return numeric * 60;
    }
    return numeric;
  }

  const match = trimmed.match(/^UTC([+-]?\d{1,2})(?::(\d{2}))?$/i);
  if (match) {
    const hours = Number(match[1]);
    const minutes = Number(match[2] || '0');
    return hours * 60 + Math.sign(hours) * minutes;
  }

  return null;
}

export function getSchoolTimezoneOffset(): number {
  const rawOffset = process.env.NEXT_PUBLIC_SCHOOL_TIMEZONE_OFFSET ?? process.env.SCHOOL_TIMEZONE_OFFSET;
  const parsed = parseTimezoneOffset(rawOffset ?? undefined);
  if (parsed !== null) return parsed;

  return -new Date().getTimezoneOffset();
}

function getSchoolNow(): Date {
  const utcTime = Date.now();
  const schoolOffset = getSchoolTimezoneOffset();
  return new Date(utcTime + schoolOffset * 60 * 1000);
}

/**
 * Get current time in HH:MM format using school timezone
 * All course time validation uses school timezone consistently
 */
export function getCurrentTimeString(): string {
  const adjustedTime = getSchoolNow();
  return `${String(adjustedTime.getUTCHours()).padStart(2, '0')}:${String(adjustedTime.getUTCMinutes()).padStart(2, '0')}`;
}

/**
 * Get day of week (0 = Sunday, 6 = Saturday) using school timezone
 */
export function getDayOfWeek(): number {
  return getSchoolNow().getUTCDay();
}

/**
 * Get day name from day number
 */
export function getDayName(dayNum: number): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayNum];
}

/**
 * Check if a course is currently active (today and within time window)
 * Uses SCHOOL TIMEZONE for all validation - ensures consistent results across all lecturers
 * @param courseDayOfWeek - The day of week the course is scheduled (e.g., "Monday")
 * @param startTime - Course start time in HH:MM format (in school timezone)
 * @param endTime - Course end time in HH:MM format (in school timezone)
 */
export function isCourseActive(
  courseDayOfWeek: string,
  startTime: string,
  endTime: string,
  timezoneOffsetMinutes?: number
): boolean {
  const today = normalizeDayName(getDayName(getDayOfWeek()));
  const scheduledDay = normalizeDayName(courseDayOfWeek);
  if (today !== scheduledDay) return false;

  const currentMinutes = timeToMinutes(getCurrentTimeString());
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);

  return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
}

/**
 * Get time remaining in a time window (in seconds)
 */
export function getTimeRemaining(endTime: string): number {
  const [endHours, endMinutes] = endTime.split(':').map(Number);
  const now = new Date();
  const endDate = new Date(now);
  endDate.setHours(endHours, endMinutes, 0);

  const remaining = (endDate.getTime() - now.getTime()) / 1000;
  return Math.max(0, remaining);
}

/**
 * Format seconds to MM:SS
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Get next session time for a course (today or next occurrence)
 */
export function getNextSessionTime(courseDayOfWeek: string, startTime: string): Date {
  const today = new Date();
  const dayMap: Record<string, number> = {
    'Sunday': 0,
    'Monday': 1,
    'Tuesday': 2,
    'Wednesday': 3,
    'Thursday': 4,
    'Friday': 5,
    'Saturday': 6,
  };

  const courseDayNum = dayMap[courseDayOfWeek];
  const todayDayNum = today.getDay();

  let daysToAdd = 0;
  if (courseDayNum > todayDayNum) {
    daysToAdd = courseDayNum - todayDayNum;
  } else if (courseDayNum < todayDayNum) {
    daysToAdd = 7 - todayDayNum + courseDayNum;
  } else {
    // Same day - check if time has passed
    const [hours, minutes] = startTime.split(':').map(Number);
    const sessionTime = new Date(today);
    sessionTime.setHours(hours, minutes, 0);
    if (sessionTime <= today) {
      daysToAdd = 7;
    }
  }

  const nextSession = new Date(today);
  nextSession.setDate(nextSession.getDate() + daysToAdd);
  const [hours, minutes] = startTime.split(':').map(Number);
  nextSession.setHours(hours, minutes, 0);

  return nextSession;
}
