// Quick console testing commands
// Paste these in your app's console for quick testing

import subscriptionTestingService from './services/subscriptionTestingService';
import { useAppContext } from './contexts/AppContext';

// Get current user (replace with your actual user ID)
const userId = 'your-user-id-here';

// Test commands:

// 1. Check current status
await subscriptionTestingService.checkSubscriptionStatus(userId);

// 2. Simulate premium for 30 days
await subscriptionTestingService.simulatePremiumSubscription(userId, 'pro', 30);

// 3. Test feature access
await subscriptionTestingService.testFeatureAccess(userId, 'ai_scans');

// 4. Simulate daily usage (5 AI scans)
await subscriptionTestingService.simulateDailyUsage(userId, 'ai_scans', 5);

// 5. Test after hitting limit
await subscriptionTestingService.testFeatureAccess(userId, 'ai_scans');

// 6. Reset to free tier
await subscriptionTestingService.resetToFreeTier(userId);

// 7. Run full test suite
await subscriptionTestingService.runTestSuite(userId);
