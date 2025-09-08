/**
 * Production Console Override
 * This prevents console statements from causing crashes in production
 */

if (__DEV__ === false) {
  // Override console methods in production to prevent crashes
  const emptyFunction = () => {};
  
  console.log = emptyFunction;
  console.warn = emptyFunction;
  console.error = emptyFunction;
  console.info = emptyFunction;
  console.debug = emptyFunction;
}

export default {};
