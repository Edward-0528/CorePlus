/**
 * Production Console Override
 * This prevents console statements from causing crashes in production
 * while preserving error logging for debugging critical issues
 */

if (__DEV__ === false) {
  // Override console methods in production to prevent crashes
  const emptyFunction = () => {};
  
  // Keep original error function for critical debugging
  const originalError = console.error;
  const originalWarn = console.warn;
  
  console.log = emptyFunction;
  console.info = emptyFunction;
  console.debug = emptyFunction;
  
  // Allow warnings and errors but make them safe
  console.warn = (...args) => {
    try {
      originalWarn.apply(console, args);
    } catch (e) {
      // Silently fail if console.warn causes issues
    }
  };
  
  console.error = (...args) => {
    try {
      originalError.apply(console, args);
    } catch (e) {
      // Silently fail if console.error causes issues
    }
  };
}

export default {};
