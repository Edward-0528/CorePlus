/**
 * Time formatting utilities for the CorePlus app
 */

/**
 * Formats a time string or Date object to 12-hour format
 * @param {string|Date} time - Time string (HH:mm:ss format) or Date object
 * @returns {string} Time in 12-hour format (e.g., "2:30 PM")
 */
export const formatTo12Hour = (time) => {
  try {
    let date;
    
    if (!time) {
      // If no time provided, use current time
      date = new Date();
    } else if (typeof time === 'string') {
      // Handle time string format (HH:mm:ss)
      if (time.includes(':')) {
        const today = new Date().toISOString().split('T')[0];
        date = new Date(`${today}T${time}`);
      } else {
        // Fallback for other string formats
        date = new Date(time);
      }
    } else if (time instanceof Date) {
      date = time;
    } else {
      // Fallback for other types
      date = new Date(time);
    }
    
    // Validate the date
    if (isNaN(date.getTime())) {
      console.warn('Invalid time provided to formatTo12Hour:', time);
      return new Date().toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    }
    
    // Format to 12-hour time
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  } catch (error) {
    console.error('Error formatting time to 12-hour:', error);
    // Return current time as fallback
    return new Date().toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  }
};

/**
 * Formats a time string or Date object to 24-hour format
 * @param {string|Date} time - Time string or Date object
 * @returns {string} Time in 24-hour format (e.g., "14:30")
 */
export const formatTo24Hour = (time) => {
  try {
    let date;
    
    if (!time) {
      date = new Date();
    } else if (typeof time === 'string') {
      if (time.includes(':')) {
        const today = new Date().toISOString().split('T')[0];
        date = new Date(`${today}T${time}`);
      } else {
        date = new Date(time);
      }
    } else if (time instanceof Date) {
      date = time;
    } else {
      date = new Date(time);
    }
    
    if (isNaN(date.getTime())) {
      console.warn('Invalid time provided to formatTo24Hour:', time);
      return new Date().toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    }
    
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  } catch (error) {
    console.error('Error formatting time to 24-hour:', error);
    return new Date().toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  }
};

/**
 * Gets the current time in 12-hour format
 * @returns {string} Current time in 12-hour format
 */
export const getCurrentTime12Hour = () => {
  return formatTo12Hour(new Date());
};

/**
 * Gets the current time in 24-hour format
 * @returns {string} Current time in 24-hour format
 */
export const getCurrentTime24Hour = () => {
  return formatTo24Hour(new Date());
};

/**
 * Converts 24-hour time string to 12-hour format
 * @param {string} time24 - Time in 24-hour format (e.g., "14:30")
 * @returns {string} Time in 12-hour format (e.g., "2:30 PM")
 */
export const convert24To12Hour = (time24) => {
  if (!time24 || typeof time24 !== 'string') {
    return formatTo12Hour(new Date());
  }
  
  const today = new Date().toISOString().split('T')[0];
  return formatTo12Hour(`${today}T${time24}`);
};

/**
 * Converts 12-hour time string to 24-hour format
 * @param {string} time12 - Time in 12-hour format (e.g., "2:30 PM")
 * @returns {string} Time in 24-hour format (e.g., "14:30")
 */
export const convert12To24Hour = (time12) => {
  if (!time12 || typeof time12 !== 'string') {
    return formatTo24Hour(new Date());
  }
  
  try {
    const today = new Date().toISOString().split('T')[0];
    const date = new Date(`${today} ${time12}`);
    return formatTo24Hour(date);
  } catch (error) {
    console.error('Error converting 12-hour to 24-hour time:', error);
    return formatTo24Hour(new Date());
  }
};

// Default export object
const timeUtils = {
  formatTo12Hour,
  formatTo24Hour,
  getCurrentTime12Hour,
  getCurrentTime24Hour,
  convert24To12Hour,
  convert12To24Hour
};

export default timeUtils;
