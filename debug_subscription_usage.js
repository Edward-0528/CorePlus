// Add this import to your main App.js or any component where you want to test
import { debugSubscriptionInProduction } from './debug_subscription_production';

// To debug subscription issues in production:
// 1. Import this file in your App.js
// 2. Add a button or call this function manually in console:
// 3. Check the console logs for detailed subscription information

// Example usage in a component:
/*
import { debugSubscriptionInProduction } from './debug_subscription_production';

// In your component:
const handleDebugSubscription = async () => {
  await debugSubscriptionInProduction();
};

// Add to your render:
<Button title="Debug Subscription" onPress={handleDebugSubscription} />
*/

export { debugSubscriptionInProduction };
