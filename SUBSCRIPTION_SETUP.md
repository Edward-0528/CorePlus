# RevenueCat Subscription Management Setup

## Overview
This implementation provides comprehensive subscription management for Core+ using RevenueCat, ensuring full compliance with Apple App Store and Google Play Store guidelines.

## Setup Instructions

### 1. Install RevenueCat SDK
```bash
npm install react-native-purchases
```

### 2. Environment Variables
Add these to your `.env` file:

```bash
# RevenueCat API Keys
EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=your_ios_api_key_here
EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=your_android_api_key_here
```

### 3. RevenueCat Dashboard Configuration

#### A. Create Products
In your RevenueCat dashboard, create these products:

**Monthly Plans:**
- `core_plus_pro_monthly` - $8.99/month
- `core_plus_elite_monthly` - $14.99/month

**Annual Plans:**
- `core_plus_pro_yearly` - $69.99/year  
- `core_plus_elite_yearly` - $149.99/year

#### B. Create Entitlements
Create these entitlements:
- `pro` - Maps to Pro tier features
- `elite` - Maps to Elite tier features

#### C. Configure Offerings
Create an offering called "default" with:
- Monthly package: Pro Monthly
- Annual package: Pro Yearly
- Elite packages as additional options

### 4. Database Setup
Run the SQL script to create subscription tables:

```bash
psql -h your-db-host -U your-username -d your-database -f database/subscription_tables.sql
```

### 5. App Store Connect / Google Play Configuration

#### iOS App Store Connect:
1. Create In-App Purchase products with the same IDs as RevenueCat
2. Set up auto-renewable subscriptions
3. Configure subscription groups
4. Add localized descriptions and pricing

#### Android Google Play Console:
1. Create subscription products in Play Console
2. Configure subscription details and pricing
3. Set up base plans and offers

## Feature Implementation

### 1. Subscription Tiers

**Free Tier:**
- 5 AI food scans per day
- Basic nutrition tracking
- 7-day meal history
- 1 workout plan

**Pro Tier ($8.99/month, $69.99/year):**
- Unlimited AI food scans
- Advanced meal planning
- Recipe browser
- Detailed micro-nutrient tracking
- 90-day meal history
- 5 workout plans
- Data export

**Elite Tier ($14.99/month, $149.99/year):**
- All Pro features
- Nutritionist consultations
- Advanced analytics
- Unlimited workout plans
- 365-day meal history
- Bulk meal prep planning
- Premium support

### 2. Feature Gating Components

Use these components to control access:

```javascript
import { PremiumGate, DailyUsageButton, UsageLimitDisplay } from './components/FeatureGate';

// Gate entire features
<PremiumGate featureName="canAccessMealPlanning">
  <MealPlanningCard />
</PremiumGate>

// Gate features with daily limits
<DailyUsageButton 
  featureName="aiScansPerDay"
  onPress={handleCameraOpen}
>
  <Text>Take Photo</Text>
</DailyUsageButton>

// Show usage limits
<UsageLimitDisplay 
  featureName="aiScansPerDay" 
  displayName="AI Food Scans"
/>
```

### 3. Usage Tracking

The system automatically tracks:
- Daily AI scan usage
- Feature access attempts
- Subscription events
- User tier changes

### 4. Subscription Management

Users can:
- View current subscription status
- Upgrade/downgrade plans
- Restore purchases
- Cancel subscriptions (through app store)

## Implementation Details

### Subscription Service (`services/subscriptionService.js`)
- Initializes RevenueCat
- Manages subscription state
- Handles purchase flows
- Tracks feature usage
- Enforces limits

### Subscription Context (`contexts/SubscriptionContext.js`)
- Provides subscription state to all components
- Handles upgrade prompts
- Manages feature access checks
- Provides convenient hooks

### Feature Gate Components (`components/FeatureGate.js`)
- `PremiumGate`: Hides/shows features based on subscription
- `DailyUsageButton`: Enforces daily usage limits
- `UsageLimitDisplay`: Shows usage progress
- `SubscriptionBadge`: Displays user tier

### Database Schema
- `user_subscriptions`: Current subscription status
- `daily_feature_usage`: Tracks daily usage limits
- `subscription_events`: Audit log of subscription changes
- `feature_access_logs`: Access attempt monitoring

## Testing

### Test Purchases
Configure sandbox testing:

1. **iOS**: Use sandbox Apple IDs
2. **Android**: Use test accounts in Google Play Console

### Test Scenarios
- Purchase new subscription
- Restore previous purchases
- Feature access with/without subscription
- Daily limit enforcement
- Subscription expiration
- Upgrade/downgrade flows

## Compliance Notes

### Apple App Store Guidelines
✅ Uses official RevenueCat SDK
✅ Handles purchases through App Store
✅ Supports purchase restoration
✅ No alternative payment methods
✅ Clear subscription terms

### Google Play Policy
✅ Uses official RevenueCat SDK
✅ Handles purchases through Play Billing
✅ Supports subscription management
✅ Clear pricing and terms
✅ Proper subscription cancellation

## Monitoring & Analytics

Track these metrics:
- Subscription conversion rates
- Feature usage by tier
- Churn rates
- Revenue per user
- Daily active users by tier

## Troubleshooting

### Common Issues
1. **API Keys**: Ensure correct platform-specific keys
2. **Product IDs**: Must match between RevenueCat, App Store, and Google Play
3. **Entitlements**: Verify entitlement mapping in RevenueCat
4. **Testing**: Use sandbox/test environments for development

### Debug Logging
Enable debug logging in development:
```javascript
await Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
```

## Security Considerations

- API keys are client-safe (not secret)
- Server-side validation through RevenueCat webhooks
- Secure storage of subscription status
- Proper error handling for edge cases

This implementation provides a robust, scalable subscription system that grows with your user base while maintaining full app store compliance.
