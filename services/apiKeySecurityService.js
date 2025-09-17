// API Key Security Service
// Provides additional security layers for API keys

class ApiKeySecurityService {
  constructor() {
    this.usage = {
      gemini: {
        callCount: 0,
        lastReset: Date.now(),
        dailyLimit: 1000, // Adjust based on your needs
      }
    };
  }

  // Rate limiting to prevent abuse
  checkRateLimit(service = 'gemini') {
    const now = Date.now();
    const usage = this.usage[service];
    
    // Reset daily counter
    if (now - usage.lastReset > 24 * 60 * 60 * 1000) {
      usage.callCount = 0;
      usage.lastReset = now;
    }
    
    if (usage.callCount >= usage.dailyLimit) {
      throw new Error(`Daily API limit exceeded for ${service}. Possible unauthorized usage detected.`);
    }
    
    usage.callCount++;
    console.log(`🔒 API Call ${usage.callCount}/${usage.dailyLimit} for ${service}`);
  }

  // Validate API key format (Gemini keys start with 'AI...')
  validateGeminiKey(apiKey) {
    if (!apiKey || apiKey === 'demo_key') {
      throw new Error('Invalid or missing Gemini API key');
    }
    
    if (!apiKey.startsWith('AI')) {
      console.warn('⚠️ Gemini API key format looks suspicious');
    }
    
    if (apiKey.length < 32) {
      console.warn('⚠️ API key seems too short');
    }
    
    return true;
  }

  // Log suspicious activity
  logSuspiciousActivity(activity, details = {}) {
    const timestamp = new Date().toISOString();
    console.error(`🚨 SECURITY ALERT [${timestamp}]: ${activity}`, details);
    
    // In production, you might want to send this to a monitoring service
    // Example: send to your logging service, email alerts, etc.
  }

  // Monitor model usage to detect unauthorized expensive models
  monitorModelUsage(modelName, service) {
    const expensiveModels = ['gemini-1.5-pro', 'gemini-2.0-pro', 'gemini-pro'];
    
    if (expensiveModels.includes(modelName)) {
      this.logSuspiciousActivity('Expensive model usage detected', {
        model: modelName,
        service: service,
        expectedModels: ['gemini-1.5-flash-8b', 'gemini-1.5-flash']
      });
      
      // You could throw an error to block expensive model usage
      // throw new Error(`Unauthorized expensive model usage: ${modelName}`);
    }
  }
}

export const securityService = new ApiKeySecurityService();
