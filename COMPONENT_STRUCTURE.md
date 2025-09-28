# 📁 CorePlus - Component Organization Structure

## 🎯 **New Organized Structure**

```
components/
├── 🖥️  screens/           # Main application screens
│   ├── main/              # Core app screens
│   │   ├── WorkingMinimalDashboard.js    ✅ Active
│   │   ├── WorkingMinimalNutrition.js    ✅ Active  
│   │   ├── WorkingMinimalAccount.js      ✅ Active
│   │   ├── MinimalNavigation.js          ✅ Active
│   │   ├── LoadingScreen.js              ✅ Active
│   │   ├── ErrorBoundary.js              ✅ Active
│   │   └── LandingScreen.js              ✅ Active
│   ├── auth/              # Authentication screens
│   │   ├── AuthScreen.js                 ✅ Active
│   │   ├── LoginScreen.js               
│   │   ├── SignUpScreen.js              
│   │   └── PhoneVerificationScreen.js   
│   ├── onboarding/        # User onboarding
│   │   └── OnboardingScreen.js          ✅ Active
│   └── subscription/      # Premium features
│       ├── SubscriptionScreen.js        ✅ Active
│       ├── SubscriptionPlansScreen.js   
│       ├── PaywallModal.js              ✅ Active
│       ├── UpgradeModal.js              ✅ Active
│       └── UpgradePromptCard.js         
│
├── 🍎 nutrition/          # Nutrition tracking components
│   ├── TodaysMealsComponent.js          ✅ Active
│   ├── DailyIntakeCard.js               
│   ├── MealHistoryCard.js               
│   ├── MealPlanCreationScreen.js        
│   └── ... (meal-related components)
│
├── 🔍 food/              # Food scanning & search
│   ├── FoodCameraScreen.js              ✅ Active
│   ├── FoodSearchModal.js               ✅ Active
│   ├── FoodPredictionCard.js            ✅ Active
│   ├── BarcodeScanner.js                
│   ├── RecipeBrowserScreen.js           
│   └── ... (food-related components)
│
├── 💪 workout/           # Fitness & workout features
│   ├── WorkoutsScreen.js                
│   ├── FitnessScreen.js                 
│   ├── HealthDashboard.js               
│   └── ... (workout components)
│
├── 🎨 ui/                # UI components & utilities
│   ├── UILibReplacement.js              ✅ Active
│   ├── FeatureGate.js                   ✅ Active
│   ├── BottomNavigation.js              
│   └── AnimatedLoader.js                ✅ Active
│
├── 🔧 shared/            # Shared utility components
│   ├── SwipeToDeleteWrapper.js          ✅ Active
│   ├── SimpleSwipeToDelete.js           ✅ Active
│   └── SocialLoginButtons.js            
│
├── 📱 modals/            # Modal dialogs
│   ├── MinimalisticDeleteModal.js       
│   ├── NumberPadModal.js                
│   └── ... (picker modals)
│
├── 🎨 design/            # Design system components
│   ├── Theme.js                         ✅ Active
│   ├── MinimalComponentsFixed.js        ✅ Active
│   └── Components.js                    
│
├── 🏗️  common/           # Common utilities (existing)
├── 🔍 debug/             # Debug components (existing)  
├── 🏥 health/            # Health integrations (existing)
├── 📋 onboarding-steps/  # Step components (existing)
└── 📦 legacy/            # Unused/legacy components
    └── BeautifulAccount.js              ❌ Unused
```

## ✅ **Key Benefits**

1. **🔍 Easy Navigation:** Components grouped by functionality
2. **🎯 Clear Separation:** Main screens vs supporting components
3. **📱 Logical Imports:** Clear path structure
4. **🧹 Clean Codebase:** Legacy components isolated
5. **👥 Team Friendly:** New developers can find components easily

## 🚀 **Import Path Examples**

```javascript
// Main screens
import WorkingMinimalNutrition from './components/screens/main/WorkingMinimalNutrition';

// Feature components  
import FoodSearchModal from './components/food/FoodSearchModal';
import TodaysMealsComponent from './components/nutrition/TodaysMealsComponent';

// Shared utilities
import SwipeToDeleteWrapper from './components/shared/SwipeToDeleteWrapper';

// Design system
import { configureDesignSystem } from './components/design/Theme';
```

## 📊 **Component Status**
- ✅ **Active:** Currently used in the app
- 📋 **Feature:** Used for specific features  
- ❌ **Unused:** Legacy/unused components
