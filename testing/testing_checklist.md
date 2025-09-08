# RevenueCat Integration Testing Checklist

## Database Setup
- [ ] Run `subscription_tables.sql` in Supabase SQL Editor
- [ ] Run `migrate_existing_users.sql` to handle existing users
- [ ] Verify all tables created successfully
- [ ] Test RLS policies are working

## RevenueCat Setup
- [ ] iOS API key added to .env file (starts with `appl_`)
- [ ] Android API key added to .env file (starts with `goog_`)
- [ ] Products created in RevenueCat dashboard:
  - [ ] `core_plus_pro_monthly`
  - [ ] `core_plus_pro_yearly`
  - [ ] `core_plus_elite_monthly`
  - [ ] `core_plus_elite_yearly`
- [ ] iOS app linked to RevenueCat (Bundle ID: `com.coreplus.app`)

## App Store Connect Setup
- [ ] App created with Bundle ID: `com.coreplus.app`
- [ ] In-App Purchase products created with exact same IDs
- [ ] Subscription groups configured properly
- [ ] Sandbox test accounts created

## Integration Testing

### Free User Testing
- [ ] New user starts with free tier
- [ ] AI scans limited to 5 per day
- [ ] Paywall shows after limit exceeded
- [ ] Premium features are locked

### Premium User Testing
- [ ] Premium subscription removes all limits
- [ ] All premium features accessible
- [ ] Subscription status syncs to Supabase

### Subscription Lifecycle
- [ ] Purchase flow works end-to-end
- [ ] Subscription status updates immediately
- [ ] Expiration reverts user to free tier
- [ ] Restoration works for existing subscribers

### Edge Cases
- [ ] Network errors handled gracefully
- [ ] RevenueCat service failures don't crash app
- [ ] User can still use free features if RevenueCat is down
- [ ] Multiple device login works correctly

## Performance Testing
- [ ] App startup time not affected by RevenueCat init
- [ ] Feature checks are fast (cached)
- [ ] Database queries are optimized
- [ ] No memory leaks in subscription service

## Production Readiness
- [ ] Remove all test functions from production build
- [ ] Set RevenueCat log level to ERROR in production
- [ ] Verify environment variables are properly set
- [ ] Test with actual App Store sandbox purchases
- [ ] Monitor subscription webhook events

## Monitoring & Analytics
- [ ] Track subscription conversion rates
- [ ] Monitor daily usage patterns
- [ ] Set up alerts for failed purchases
- [ ] Track user lifecycle events

## User Experience
- [ ] Paywall is beautiful and compelling
- [ ] Upgrade flow is smooth
- [ ] Feature limitations are clear
- [ ] Users understand subscription benefits

## Security
- [ ] API keys are not exposed in client code
- [ ] RLS policies protect user data
- [ ] Subscription validation is server-side
- [ ] User IDs are properly validated

## Documentation
- [ ] Update README with RevenueCat setup instructions
- [ ] Document subscription tiers and features
- [ ] Create troubleshooting guide
- [ ] Document testing procedures
