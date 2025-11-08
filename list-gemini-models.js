// Script to list available Gemini models and their details
require('dotenv').config();

const getGeminiApiKey = () => process.env.EXPO_PUBLIC_GEMINI_API_KEY;

async function listGeminiModels() {
  const apiKey = getGeminiApiKey();
  
  if (!apiKey) {
    console.error('❌ No Gemini API key found. Please check your .env file.');
    return;
  }

  console.log('🔍 Fetching available Gemini models...\n');

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ API Error:', response.status, errorData);
      return;
    }

    const data = await response.json();
    
    console.log('📋 Available Gemini Models:\n');
    
    if (data.models && data.models.length > 0) {
      data.models.forEach((model, index) => {
        console.log(`${index + 1}. Model: ${model.name}`);
        console.log(`   Display Name: ${model.displayName || 'N/A'}`);
        console.log(`   Description: ${model.description || 'N/A'}`);
        console.log(`   Version: ${model.version || 'N/A'}`);
        
        if (model.supportedGenerationMethods) {
          console.log(`   Supported Methods: ${model.supportedGenerationMethods.join(', ')}`);
        }
        
        if (model.inputTokenLimit) {
          console.log(`   Input Token Limit: ${model.inputTokenLimit.toLocaleString()}`);
        }
        
        if (model.outputTokenLimit) {
          console.log(`   Output Token Limit: ${model.outputTokenLimit.toLocaleString()}`);
        }
        
        console.log('   ─────────────────────────────────────────\n');
      });
      
      // Filter models that support generateContent
      const contentGenerationModels = data.models.filter(model => 
        model.supportedGenerationMethods && 
        model.supportedGenerationMethods.includes('generateContent')
      );
      
      console.log('\n🎯 Models that support generateContent (usable for our app):\n');
      contentGenerationModels.forEach((model, index) => {
        console.log(`${index + 1}. ${model.name}`);
        console.log(`   ${model.displayName || 'N/A'}`);
        if (model.inputTokenLimit) {
          console.log(`   Input: ${model.inputTokenLimit.toLocaleString()} tokens`);
        }
        if (model.outputTokenLimit) {
          console.log(`   Output: ${model.outputTokenLimit.toLocaleString()} tokens`);
        }
        console.log('');
      });
      
    } else {
      console.log('No models found.');
    }
    
  } catch (error) {
    console.error('❌ Error fetching models:', error.message);
  }
}

// Pricing information (as of late 2024)
function showPricingInfo() {
  console.log('\n💰 Gemini API Pricing (approximate, check official docs for latest):\n');
  
  const pricing = [
    {
      model: 'Gemini 1.5 Flash',
      inputCost: '$0.075 per 1M tokens',
      outputCost: '$0.30 per 1M tokens',
      features: 'Fast, efficient, good for text and simple vision tasks'
    },
    {
      model: 'Gemini 1.5 Pro',
      inputCost: '$1.25 per 1M tokens',
      outputCost: '$5.00 per 1M tokens',
      features: 'More capable, better reasoning, multimodal'
    },
    {
      model: 'Gemini 2.0 Flash',
      inputCost: '$0.075 per 1M tokens',
      outputCost: '$0.30 per 1M tokens',
      features: 'Latest fast model with improved capabilities'
    }
  ];
  
  pricing.forEach((p, index) => {
    console.log(`${index + 1}. ${p.model}`);
    console.log(`   Input: ${p.inputCost}`);
    console.log(`   Output: ${p.outputCost}`);
    console.log(`   Features: ${p.features}`);
    console.log('   ─────────────────────────────────────────\n');
  });
  
  console.log('📝 Notes:');
  console.log('• Prices may vary by region and are subject to change');
  console.log('• Check https://cloud.google.com/vertex-ai/generative-ai/pricing for latest pricing');
  console.log('• Free tier may be available for limited usage');
}

// Run the script
listGeminiModels().then(() => {
  showPricingInfo();
});
