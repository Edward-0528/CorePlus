/**
 * Date utility functions for handling local timezone dates
 */

/**
 * Get the current date in the user's local timezone in YYYY-MM-DD format
 * @returns {string} Local date string in YYYY-MM-DD format
 */
export const getLocalDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Get the current time in the user's local timezone in HH:mm:ss format
 * @returns {string} Local time string in HH:mm:ss format
 */
export const getLocalTimeString = () => {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
};

/**
 * Get a specific date in local timezone in YYYY-MM-DD format
 * @param {Date} date - The date object
 * @returns {string} Local date string in YYYY-MM-DD format
 */
export const getLocalDateStringFromDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Check if a date string matches today's local date
 * @param {string} dateString - Date string in YYYY-MM-DD format
 * @returns {boolean} True if the date matches today's local date
 */
export const isToday = (dateString) => {
  return dateString === getLocalDateString();
};

/**
 * Check if a date string matches yesterday's local date
 * @param {string} dateString - Date string in YYYY-MM-DD format
 * @returns {boolean} True if the date matches yesterday's local date
 */
export const isYesterday = (dateString) => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return dateString === getLocalDateStringFromDate(yesterday);
};

/**
 * Get date string for X days ago in local timezone
 * @param {number} daysAgo - Number of days ago
 * @returns {string} Local date string in YYYY-MM-DD format
 */
export const getDateDaysAgo = (daysAgo) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return getLocalDateStringFromDate(date);
};
