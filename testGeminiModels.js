// Quick test script to check which Gemini models are available
import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.log('❌ No Gemini API key found');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Test different models to see which ones work (ordered by cost-effectiveness)
const modelsToTest = [
  'gemini-2.5-flash',       // Enhanced reasoning (hybrid model)
  'gemini-2.0-flash-exp',   // Most cost-effective (experimental)
  'gemini-2.0-flash',       // Very cost-effective (stable)
  'gemini-pro',             // Standard pricing
  'gemini-1.5-flash',       // Legacy
  'gemini-1.5-pro',         // More expensive
  'models/gemini-pro'       // Alternative format
];

async function testModel(modelName) {
  try {
    console.log(`🧪 Testing model: ${modelName}`);
    const model = genAI.getGenerativeModel({ model: modelName });
    const prompt = "Say hello in one word.";
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    console.log(`✅ ${modelName}: ${text.trim()}`);
    return true;
  } catch (error) {
    console.log(`❌ ${modelName}: ${error.message}`);
    return false;
  }
}

async function findWorkingModel() {
  console.log('🔍 Testing Gemini models...\n');
  
  for (const model of modelsToTest) {
    const works = await testModel(model);
    if (works) {
      console.log(`\n🎯 Working model found: ${model}`);
      return model;
    }
  }
  
  console.log('\n❌ No working models found');
}

// Run the test
findWorkingModel().catch(console.error);
