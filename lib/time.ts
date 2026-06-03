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
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Get current time in HH:MM format (with optional timezone offset support)
 * @param timezoneOffsetMinutes - Minutes offset from UTC (e.g., -300 for EST, 330 for IST)
 */
export function getCurrentTimeString(timezoneOffsetMinutes?: number): string {
  const now = new Date();
  
  let date = now;
  if (timezoneOffsetMinutes !== undefined) {
    // Convert UTC time to timezone-adjusted time
    const utcTime = now.getTime();
    const timezoneDiff = timezoneOffsetMinutes * 60 * 1000;
    const adjustedTime = new Date(utcTime + timezoneDiff);
    date = adjustedTime;
  }
  
  return `${String(date.getUTCHours()).padStart(2, '0')}:${String(date.getUTCMinutes()).padStart(2, '0')}`;
}

/**
 * Get day of week (0 = Sunday, 6 = Saturday) with optional timezone offset support
 * @param timezoneOffsetMinutes - Minutes offset from UTC
 */
export function getDayOfWeek(timezoneOffsetMinutes?: number): number {
  const now = new Date();
  
  let date = now;
  if (timezoneOffsetMinutes !== undefined) {
    // Convert UTC time to timezone-adjusted time
    const utcTime = now.getTime();
    const timezoneDiff = timezoneOffsetMinutes * 60 * 1000;
    const adjustedTime = new Date(utcTime + timezoneDiff);
    date = adjustedTime;
  }
  
  return date.getUTCDay();
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
 * @param courseDayOfWeek - The day of week the course is scheduled (e.g., "Monday")
 * @param startTime - Course start time in HH:MM format
 * @param endTime - Course end time in HH:MM format
 * @param timezoneOffsetMinutes - Minutes offset from UTC (from client's timezone)
 */
export function isCourseActive(
  courseDayOfWeek: string,
  startTime: string,
  endTime: string,
  timezoneOffsetMinutes?: number
): boolean {
  const today = getDayName(getDayOfWeek(timezoneOffsetMinutes));
  if (today !== courseDayOfWeek) return false;

  const currentMinutes = timeToMinutes(getCurrentTimeString(timezoneOffsetMinutes));
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
