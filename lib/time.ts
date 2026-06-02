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
 * Get current time in HH:MM format
 */
export function getCurrentTimeString(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

/**
 * Get day of week (0 = Sunday, 6 = Saturday)
 */
export function getDayOfWeek(): number {
  return new Date().getDay();
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
 */
export function isCourseActive(courseDayOfWeek: string, startTime: string, endTime: string): boolean {
  const today = getDayName(getDayOfWeek());
  if (today !== courseDayOfWeek) return false;

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
