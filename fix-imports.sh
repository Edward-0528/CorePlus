#!/bin/bash
# Script to fix import paths after reorganization

echo "🔧 Fixing import paths after component reorganization..."

# Fix imports in WorkingMinimalDashboard
echo "Fixing WorkingMinimalDashboard imports..."
sed -i '' 's|from '\''\.\/TodaysMealsComponent'\''|from '\''../../nutrition/TodaysMealsComponent'\''|g' components/screens/main/WorkingMinimalDashboard.js
sed -i '' 's|from '\''\.\.\/contexts\/|from '\''../../../contexts/|g' components/screens/main/WorkingMinimalDashboard.js
sed -i '' 's|from '\''\.\.\/utils\/|from '\''../../../utils/|g' components/screens/main/WorkingMinimalDashboard.js

# Fix imports in WorkingMinimalAccount
echo "Fixing WorkingMinimalAccount imports..."
sed -i '' 's|from '\''\.\/UpgradeModal'\''|from '\''../subscription/UpgradeModal'\''|g' components/screens/main/WorkingMinimalAccount.js
sed -i '' 's|from '\''\.\.\/constants\/|from '\''../../../constants/|g' components/screens/main/WorkingMinimalAccount.js
sed -i '' 's|from '\''\.\.\/hooks\/|from '\''../../../hooks/|g' components/screens/main/WorkingMinimalAccount.js

# Fix AuthScreen imports
echo "Fixing AuthScreen imports..."
sed -i '' 's|from '\''\.\.\/biometricService'\''|from '\''../../../biometricService'\''|g' components/screens/auth/AuthScreen.js
sed -i '' 's|from '\''\.\.\/contexts\/|from '\''../../../contexts/|g' components/screens/auth/AuthScreen.js

# Fix OnboardingScreen imports  
echo "Fixing OnboardingScreen imports..."
sed -i '' 's|from '\''\.\/modals\/|from '\''../../modals/|g' components/screens/onboarding/OnboardingScreen.js
sed -i '' 's|from '\''\.\/onboarding-steps\/|from '\''../../onboarding-steps/|g' components/screens/onboarding/OnboardingScreen.js
sed -i '' 's|from '\''\.\/common\/|from '\''../../common/|g' components/screens/onboarding/OnboardingScreen.js
sed -i '' 's|from '\''\.\.\/contexts\/|from '\''../../../contexts/|g' components/screens/onboarding/OnboardingScreen.js

# Fix LoadingScreen imports
echo "Fixing LoadingScreen imports..."
sed -i '' 's|from '\''\.\/AnimatedLoader'\''|from '\''../../ui/AnimatedLoader'\''|g' components/screens/main/LoadingScreen.js

echo "✅ Import paths fixed! Please test the app."
