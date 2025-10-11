import { Timestamp } from 'firebase/firestore';

/**
 * Utility functions for safe timestamp handling across the application
 */

/**
 * Safely convert any timestamp-like object to a JavaScript Date
 * Handles Firestore Timestamps, Date objects, strings, and numbers
 */
export function safeTimestampToDate(timestamp: any): Date | null {
  if (!timestamp) {
    return null;
  }

  try {
    // Handle Firestore Timestamp
    if (timestamp && typeof timestamp.toDate === 'function') {
      return timestamp.toDate();
    }

    // Handle Date object
    if (timestamp instanceof Date) {
      return timestamp;
    }

    // Handle timestamp string (ISO format)
    if (typeof timestamp === 'string') {
      const date = new Date(timestamp);
      return isNaN(date.getTime()) ? null : date;
    }

    // Handle timestamp number (milliseconds)
    if (typeof timestamp === 'number') {
      const date = new Date(timestamp);
      return isNaN(date.getTime()) ? null : date;
    }

    // Handle object with seconds and nanoseconds (Firestore Timestamp-like)
    if (timestamp && typeof timestamp === 'object' && 'seconds' in timestamp) {
      const date = new Date(timestamp.seconds * 1000 + (timestamp.nanoseconds || 0) / 1000000);
      return isNaN(date.getTime()) ? null : date;
    }

    return null;
  } catch (error) {
    console.warn('Error converting timestamp to Date:', error, timestamp);
    return null;
  }
}

/**
 * Safely format any timestamp-like object to a localized string
 */
export function safeFormatTimestamp(
  timestamp: any,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  },
  locale: string = 'en-US'
): string {
  const date = safeTimestampToDate(timestamp);
  if (!date) {
    return 'Unknown';
  }

  try {
    return date.toLocaleString(locale, options);
  } catch (error) {
    console.warn('Error formatting timestamp:', error);
    return date.toLocaleString(); // Fallback to default formatting
  }
}

/**
 * Create a proper Firestore Timestamp from various input types
 */
export function createSafeTimestamp(input: any): Timestamp {
  if (!input) {
    return Timestamp.now();
  }

  try {
    // If it's already a Timestamp, return it
    if (input && typeof input.toDate === 'function') {
      return input as Timestamp;
    }

    // If it's a Date, convert to Timestamp
    if (input instanceof Date) {
      return Timestamp.fromDate(input);
    }

    // If it's a string, try to parse as Date
    if (typeof input === 'string') {
      const date = new Date(input);
      if (!isNaN(date.getTime())) {
        return Timestamp.fromDate(date);
      }
    }

    // If it's a number (milliseconds), convert to Date then Timestamp
    if (typeof input === 'number') {
      const date = new Date(input);
      if (!isNaN(date.getTime())) {
        return Timestamp.fromDate(date);
      }
    }

    // Fallback to current time
    return Timestamp.now();
  } catch (error) {
    console.warn('Error creating timestamp from input:', error, input);
    return Timestamp.now();
  }
}

/**
 * Check if a timestamp is recent (within the last X minutes/hours/days)
 */
export function isTimestampRecent(
  timestamp: any,
  threshold: { minutes?: number; hours?: number; days?: number }
): boolean {
  const date = safeTimestampToDate(timestamp);
  if (!date) {
    return false;
  }

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  if (threshold.days) {
    return diffMs < threshold.days * 24 * 60 * 60 * 1000;
  }
  if (threshold.hours) {
    return diffMs < threshold.hours * 60 * 60 * 1000;
  }
  if (threshold.minutes) {
    return diffMs < threshold.minutes * 60 * 1000;
  }

  return false;
}

/**
 * Get a human-readable relative time string (e.g., "2 hours ago")
 */
export function getRelativeTimeString(timestamp: any, locale: string = 'en-US'): string {
  const date = safeTimestampToDate(timestamp);
  if (!date) {
    return 'Unknown time';
  }

  try {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 7) {
      return date.toLocaleDateString(locale);
    }
    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    }
    if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    }
    if (diffMinutes > 0) {
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    }
    return 'Just now';
  } catch (error) {
    console.warn('Error creating relative time string:', error);
    return date.toLocaleString(locale);
  }
}