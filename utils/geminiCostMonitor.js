// Gemini API Cost Monitoring Utility
// This helps track and estimate costs for Gemini API usage

class GeminiCostMonitor {
  constructor() {
    // Approximate pricing for Gemini models (as of 2025)
    this.pricing = {
      'gemini-2.5-flash': {
        inputTokens: 0.30 / 1000000,     // $0.30 per million input tokens (enhanced reasoning)
        outputTokens: 2.50 / 1000000,    // $2.50 per million output tokens (with thinking tokens)
      },
      'gemini-2.0-flash-exp': {
        inputTokens: 0.10 / 1000000,     // $0.10 per million input tokens (experimental pricing)
        outputTokens: 0.40 / 1000000,    // $0.40 per million output tokens (experimental pricing)
      },
      'gemini-2.0-flash': {
        inputTokens: 0.10 / 1000000,     // $0.10 per million input tokens (very cost-effective)
        outputTokens: 0.40 / 1000000,    // $0.40 per million output tokens (very cost-effective)
      },
      'gemini-pro': {
        inputTokens: 0.125 / 1000000,    // $0.125 per million input tokens
        outputTokens: 0.375 / 1000000,   // $0.375 per million output tokens
      },
      'gemini-1.5-pro': {
        inputTokens: 1.25 / 1000000,     // $1.25 per million input tokens
        outputTokens: 5.00 / 1000000,    // $5.00 per million output tokens
      }
    };
    
    this.usage = {
      totalCalls: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalCostUSD: 0,
      byModel: {}
    };
  }

  // Log API usage for cost tracking
  logApiCall(modelName, inputTokens = 0, outputTokens = 0, service = 'unknown') {
    const pricing = this.pricing[modelName] || this.pricing['gemini-2.5-flash'];
    const callCost = (inputTokens * pricing.inputTokens) + (outputTokens * pricing.outputTokens);
    
    this.usage.totalCalls++;
    this.usage.totalInputTokens += inputTokens;
    this.usage.totalOutputTokens += outputTokens;
    this.usage.totalCostUSD += callCost;
    
    if (!this.usage.byModel[modelName]) {
      this.usage.byModel[modelName] = {
        calls: 0,
        inputTokens: 0,
        outputTokens: 0,
        costUSD: 0
      };
    }
    
    this.usage.byModel[modelName].calls++;
    this.usage.byModel[modelName].inputTokens += inputTokens;
    this.usage.byModel[modelName].outputTokens += outputTokens;
    this.usage.byModel[modelName].costUSD += callCost;
    
    console.log(`💰 Gemini API Call - Model: ${modelName}, Service: ${service}, Cost: $${callCost.toFixed(4)}`);
    console.log(`📊 Session Total: ${this.usage.totalCalls} calls, $${this.usage.totalCostUSD.toFixed(4)}`);
  }

  // Get usage summary
  getUsageSummary() {
    return {
      ...this.usage,
      averageCostPerCall: this.usage.totalCalls > 0 ? this.usage.totalCostUSD / this.usage.totalCalls : 0
    };
  }

  // Estimate token count (rough approximation: 1 token ≈ 4 characters)
  estimateTokens(text) {
    return Math.ceil(text.length / 4);
  }

  // Cost comparison between models
  compareCosts() {
    const models = Object.keys(this.pricing);
    console.log('\n💰 Cost Comparison (per 1000 tokens):');
    models.forEach(model => {
      const inputCost = this.pricing[model].inputTokens * 1000;
      const outputCost = this.pricing[model].outputTokens * 1000;
      console.log(`${model}:`);
      console.log(`  Input: $${inputCost.toFixed(4)}`);
      console.log(`  Output: $${outputCost.toFixed(4)}`);
    });
    
    console.log('\n✅ Current optimization: All services use gemini-2.5-flash (enhanced reasoning model)');
  }

  // Reset usage tracking
  reset() {
    this.usage = {
      totalCalls: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalCostUSD: 0,
      byModel: {}
    };
  }
}

// Export singleton instance
export const costMonitor = new GeminiCostMonitor();

// Helper function to wrap API calls with cost monitoring
export const withCostMonitoring = async (modelName, service, apiCall, inputText = '') => {
  const startTime = Date.now();
  const estimatedInputTokens = costMonitor.estimateTokens(inputText);
  
  try {
    const result = await apiCall();
    const endTime = Date.now();
    
    // Estimate output tokens (this is approximate)
    let estimatedOutputTokens = 0;
    if (result && typeof result === 'string') {
      estimatedOutputTokens = costMonitor.estimateTokens(result);
    } else if (result && result.text) {
      estimatedOutputTokens = costMonitor.estimateTokens(result.text);
    }
    
    costMonitor.logApiCall(modelName, estimatedInputTokens, estimatedOutputTokens, service);
    console.log(`⏱️ API call completed in ${endTime - startTime}ms`);
    
    return result;
  } catch (error) {
    console.error(`❌ API call failed for ${service}:`, error.message);
    throw error;
  }
};
