import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

const AppContext = createContext();

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

// Static data for onboarding
const MAIN_GOALS = [
  { id: 'lose_weight', title: 'Lose Weight', description: 'Burn calories and reduce body fat', emoji: '🔥' },
  { id: 'build_muscle', title: 'Build Muscle', description: 'Gain strength and muscle mass', emoji: '💪' },
  { id: 'keep_fit', title: 'Keep Fit', description: 'Maintain current fitness level', emoji: '⚡' }
];

const ACTIVITY_OPTIONS = [
  { id: 'fitness_home', title: 'Fitness at Home', emoji: '🏠' },
  { id: 'calisthenics', title: 'Calisthenics', emoji: '🤸' },
  { id: 'walking', title: 'Walking', emoji: '🚶' },
  { id: 'running', title: 'Running', emoji: '🏃' },
  { id: 'hiit', title: 'HIIT', emoji: '⚡' },
  { id: 'yoga', title: 'Yoga', emoji: '🧘' },
  { id: 'dancing', title: 'Dancing', emoji: '💃' },
  { id: 'gym', title: 'Gym', emoji: '🏋️' },
  { id: 'fighting', title: 'Fighting', emoji: '🥊' }
];

export const AppProvider = ({ children }) => {
  // All state management
  const [showLanding, setShowLanding] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const [showGenderModal, setShowGenderModal] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showHeightPicker, setShowHeightPicker] = useState(false);
  const [showWeightPicker, setShowWeightPicker] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [count, setCount] = useState(0);
  const [activeTab, setActiveTab] = useState('home');
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    gender: ''
  });

  const [onboardingData, setOnboardingData] = useState({
    mainGoal: '',
    activities: [],
    dateOfBirth: '',
    heightFeet: '',
    heightInches: '',
    weight: '',
    goalWeight: '',
    affiliateCode: ''
  });

  // Memoized actions to prevent re-renders
  const actions = {
    // Navigation actions
    handleGetStarted: useCallback(() => {
      setShowLanding(false);
      setShowSignUp(false);
      setShowLogin(true);
    }, []),

    handleSwitchToLogin: useCallback(() => {
      setShowSignUp(false);
      setShowLogin(true);
    }, []),

    handleSwitchToSignUp: useCallback(() => {
      setShowLogin(false);
      setShowSignUp(true);
    }, []),

    handleBackToLanding: useCallback(() => {
      setShowLanding(true);
      setShowLogin(false);
      setShowSignUp(false);
    }, []),

    // Form actions
    updateFormData: useCallback((updates) => {
      if (typeof updates === 'object') {
        setFormData(prev => ({ ...prev, ...updates }));
      } else {
        // Legacy support for field, value parameters
        const field = updates;
        const value = arguments[1];
        setFormData(prev => ({ ...prev, [field]: value }));
      }
    }, []),

    updateOnboardingData: useCallback((field, value) => {
      setOnboardingData(prev => ({ ...prev, [field]: value }));
    }, []),

    // Modal actions
    setShowGenderModal: useCallback((show) => setShowGenderModal(show), []),
    setShowDatePicker: useCallback((show) => setShowDatePicker(show), []),
    setShowHeightPicker: useCallback((show) => setShowHeightPicker(show), []),
    setShowWeightPicker: useCallback((show) => setShowWeightPicker(show), []),

    // Onboarding actions
    nextOnboardingStep: useCallback(() => {
      setOnboardingStep(prev => Math.min(prev + 1, 4));
    }, []),

    prevOnboardingStep: useCallback(() => {
      setOnboardingStep(prev => Math.max(prev - 1, 1));
    }, []),

    selectGoal: useCallback((goalId) => {
      // Use functional update to ensure batching
      setOnboardingData(prev => {
        if (prev.mainGoal === goalId) return prev; // Prevent unnecessary updates
        return { ...prev, mainGoal: goalId };
      });
    }, []),

    toggleActivity: useCallback((activityId) => {
      // Optimized with early returns and batching
      setOnboardingData(prev => {
        const currentActivities = prev.activities;
        let newActivities;
        
        if (currentActivities.includes(activityId)) {
          newActivities = currentActivities.filter(id => id !== activityId);
        } else if (currentActivities.length < 3) {
          newActivities = [...currentActivities, activityId];
        } else {
          return prev; // Don't allow more than 3 activities
        }
        
        // Only update if actually changed
        if (JSON.stringify(newActivities) === JSON.stringify(currentActivities)) {
          return prev;
        }
        
        return { ...prev, activities: newActivities };
      });
    }, []),

    selectDate: useCallback((year, month, day) => {
      // Create date in ISO format (YYYY-MM-DD) for reliable parsing
      const dateString = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      setOnboardingData(prev => ({ ...prev, dateOfBirth: dateString }));
      setShowDatePicker(false);
    }, []),

    selectHeight: useCallback((feet, inches) => {
      setOnboardingData(prev => ({ 
        ...prev, 
        heightFeet: feet.toString(), 
        heightInches: inches.toString() 
      }));
      setShowHeightPicker(false);
    }, []),

    selectWeight: useCallback((weight) => {
      setOnboardingData(prev => ({ ...prev, weight: weight.toString() }));
      setShowWeightPicker(false);
    }, []),

    // Auth actions
    setUser: useCallback((user) => setUser(user), []),
    setIsAuthenticated: useCallback((auth) => setIsAuthenticated(auth), []),
    setAuthLoading: useCallback((loading) => setAuthLoading(loading), []),
    setLoading: useCallback((loading) => setLoading(loading), []),
    setShowOnboarding: useCallback((show) => setShowOnboarding(show), []),
    setShowLanding: useCallback((show) => setShowLanding(show), []),
    setShowLogin: useCallback((show) => setShowLogin(show), []),
    setShowSignUp: useCallback((show) => setShowSignUp(show), []),
    setFormData: useCallback((data) => setFormData(data), []),
    setOnboardingData: useCallback((data) => setOnboardingData(data), []),
    setCount: useCallback((count) => setCount(count), []),
    
    // Navigation actions
    setActiveTab: useCallback((tab) => setActiveTab(tab), []),
  };

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    // State
    showLanding,
    showLogin,
    showSignUp,
    showGenderModal,
    showOnboarding,
    onboardingStep,
    showDatePicker,
    showHeightPicker,
    showWeightPicker,
    isAuthenticated,
    user,
    loading,
    authLoading,
    count,
    activeTab,
    formData,
    onboardingData,
    
    // Static data
    mainGoals: MAIN_GOALS,
    activityOptions: ACTIVITY_OPTIONS,
    
    // Actions
    ...actions
  }), [
    showLanding,
    showLogin,
    showSignUp,
    showGenderModal,
    showOnboarding,
    onboardingStep,
    showDatePicker,
    showHeightPicker,
    showWeightPicker,
    isAuthenticated,
    user,
    loading,
    authLoading,
    count,
    activeTab,
    formData,
    onboardingData,
    actions
  ]);

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};
