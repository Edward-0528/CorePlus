/**
 * Enhanced debug logging for production builds
 * This will help us track exactly what's happening with the API calls
 */

// Override console methods to ensure they show in adb logcat
const originalLog = console.log;
const originalError = console.error;
const originalWarn = console.warn;

console.log = (...args) => {
  originalLog('[CORE+DEBUG]', ...args);
};

console.error = (...args) => {
  originalError('[CORE+ERROR]', ...args);
};

console.warn = (...args) => {
  originalWarn('[CORE+WARN]', ...args);
};

// Test API key availability immediately
const testApiKey = () => {
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  console.log('[CORE+DEBUG] 🔑 API Key Test:', {
    hasKey: !!apiKey,
    keyLength: apiKey ? apiKey.length : 0,
    keyStart: apiKey ? apiKey.substring(0, 8) + '***' : 'NONE',
    platform: require('react-native').Platform.OS,
    isDev: __DEV__,
    nodeEnv: process.env.NODE_ENV
  });
  
  // Test network connectivity
  fetch('https://www.google.com', { method: 'HEAD' })
    .then(() => console.log('[CORE+DEBUG] ✅ Network connectivity OK'))
    .catch((err) => console.error('[CORE+ERROR] ❌ Network test failed:', err.message));
};

// Test Gemini API directly
const testGeminiApi = async () => {
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    console.error('[CORE+ERROR] ❌ No API key for Gemini test');
    return;
  }
  
  const testUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  
  try {
    console.log('[CORE+DEBUG] 🧪 Testing Gemini API directly...');
    const response = await fetch(testUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Hello' }] }]
      })
    });
    
    console.log('[CORE+DEBUG] 📊 Gemini API Response:', {
      status: response.status,
      ok: response.ok,
      statusText: response.statusText
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[CORE+ERROR] ❌ Gemini API Error:', errorText);
    } else {
      console.log('[CORE+DEBUG] ✅ Gemini API test successful');
    }
  } catch (error) {
    console.error('[CORE+ERROR] ❌ Gemini API test failed:', error.message);
  }
};

// Run tests
console.log('[CORE+DEBUG] 🚀 Starting production debug tests...');
testApiKey();
setTimeout(testGeminiApi, 2000);

export { testApiKey, testGeminiApi };
