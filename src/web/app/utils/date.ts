import { format, parseISO, isValid } from "date-fns"; // date-fns v2.30.0

/**
 * Date format constants used throughout the application
 */
export const DATE_FORMATS = {
  /** Format for display in experience timeline (e.g., "Jan 2023") */
  DISPLAY: "MMM yyyy",
  /** Full date format for detailed views (e.g., "January 01, 2023") */
  FULL: "MMMM dd, yyyy",
  /** Format for API requests (e.g., "2023-01-01") */
  API: "yyyy-MM-dd",
  /** ISO format for database storage */
  ISO: "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"
} as const;

/**
 * Formats a date string or Date object into a display-friendly format
 * @param date - Date to format (string or Date object)
 * @param formatStr - Format string to use (from DATE_FORMATS)
 * @returns Formatted date string or empty string if invalid
 */
export const formatDate = (date: string | Date, formatStr: string): string => {
  try {
    const dateObj = typeof date === "string" ? parseISO(date) : date;
    if (!isValid(dateObj)) {
      return "";
    }
    return format(dateObj, formatStr);
  } catch {
    return "";
  }
};

/**
 * Formats a date specifically for experience timeline display
 * @param date - Date to format (string or Date object)
 * @returns Date formatted for experience display (e.g., "Jan 2023")
 */
export const formatExperienceDate = (date: string | Date): string => {
  return formatDate(date, DATE_FORMATS.DISPLAY);
};

/**
 * Formats a date for API requests
 * @param date - Date to format (string or Date object)
 * @returns Date formatted for API (YYYY-MM-DD)
 */
export const formatApiDate = (date: string | Date): string => {
  return formatDate(date, DATE_FORMATS.API);
};

/**
 * Checks if a date string or Date object is valid
 * @param date - Date to validate (string or Date object)
 * @returns True if date is valid
 */
export const isValidDate = (date: string | Date): boolean => {
  try {
    const dateObj = typeof date === "string" ? parseISO(date) : date;
    return isValid(dateObj);
  } catch {
    return false;
  }
};

/**
 * Creates a formatted date range string for experience display
 * @param startDate - Start date of the range
 * @param endDate - End date of the range (null for current positions)
 * @returns Formatted date range (e.g., "Jan 2022 - Present")
 */
export const getDateRange = (
  startDate: string | Date,
  endDate: string | Date | null
): string => {
  const formattedStartDate = formatExperienceDate(startDate);
  
  if (!endDate) {
    return `${formattedStartDate} - Present`;
  }
  
  const formattedEndDate = formatExperienceDate(endDate);
  return `${formattedStartDate} - ${formattedEndDate}`;
};