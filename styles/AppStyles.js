import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  // Loading styles
  loadingContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 16,
    marginTop: 20,
  },

  // Landing styles
  landingContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  backgroundImageStyle: {
    opacity: 1.0,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  landingContent: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingVertical: 50,
  },
  headerSection: {
    alignItems: 'center',
    marginTop: 40,
  },
  logoText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  tagline: {
    fontSize: 18,
    color: '#e0e0e0',
    marginTop: 8,
    textAlign: 'center',
    letterSpacing: 1,
  },
  mainContent: {
    alignItems: 'flex-start',
    flex: 1,
    justifyContent: 'center',
    paddingLeft: 8,
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  heroSubtitle: {
    fontSize: 18,
    color: '#d0d0d0',
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: 20,
  },
  // New design styles
  newHeroTitle: {
    fontSize: 48,
    fontWeight: '300',
    color: '#ffffff',
    textAlign: 'left',
    lineHeight: 52,
    marginBottom: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  newHeroSubtitle: {
    fontSize: 16,
    color: '#e8e8e8',
    textAlign: 'left',
    lineHeight: 24,
    opacity: 0.9,
    marginBottom: 30,
  },
  heroContentBottom: {
    alignItems: 'flex-start',
    marginBottom: 40,
    paddingHorizontal: 8,
  },
  bottomSection: {
    width: '100%',
    alignItems: 'center',
    paddingBottom: 20,
  },
  pageIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#5DADE2',
    width: 24,
    borderRadius: 4,
  },
  newGetStartedButton: {
    backgroundColor: '#5DADE2',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '90%',
    maxWidth: 400,
    alignSelf: 'center',
    marginBottom: 20,
    // Clean glow effect
    shadowColor: '#5DADE2',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonDisabled: {
    backgroundColor: '#666666',
    shadowOpacity: 0.1,
  },
  newGetStartedText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    flex: 1,
    textAlign: 'center',
  },
  buttonArrows: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    position: 'absolute',
    right: 24,
  },
  termsContainer: {
    width: '100%',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#5DADE2',
    backgroundColor: 'transparent',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#5DADE2',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  termsText: {
    color: '#e8e8e8',
    fontSize: 14,
    opacity: 0.9,
  },
  buttonSection: {
    width: '100%',
    alignItems: 'center',
  },
  getStartedButton: {
    backgroundColor: '#ff6b6b',
    paddingVertical: 18,
    paddingHorizontal: 60,
    borderRadius: 30,
    shadowColor: '#ff6b6b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  getStartedText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },

  // Modern Auth styles
  modernAuthContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  modernAuthScrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  modernAuthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 10,
    position: 'relative',
  },
  modernBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modernBackText: {
    fontSize: 20,
    color: '#4a5568',
    fontWeight: 'bold',
  },
  modernAuthTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2d3748',
    marginRight: 40,
  },
  cuteMessageContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  cuteMessageText: {
    fontSize: 28,
    fontWeight: '600',
    color: '#4a5568',
    textAlign: 'center',
  },
  modernFormContainer: {
    marginTop: 10,
  },
  modernInputGroup: {
    marginBottom: 20,
  },
  modernLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4a5568',
    marginBottom: 8,
  },
  modernInput: {
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 16,
    backgroundColor: '#ffffff',
    color: '#2d3748',
  },
  modernDropdown: {
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modernDropdownText: {
    fontSize: 16,
    color: '#2d3748',
  },
  modernDropdownPlaceholder: {
    color: '#a0aec0',
  },
  modernDropdownArrow: {
    fontSize: 12,
    color: '#a0aec0',
  },
  modernButtonContainer: {
    marginTop: 15,
  },
  modernContinueButton: {
    backgroundColor: '#4299e1',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  modernContinueButtonDisabled: {
    backgroundColor: '#a0aec0',
  },
  modernContinueText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modernSwitchContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  modernSwitchText: {
    fontSize: 14,
    color: '#718096',
  },
  modernSwitchLink: {
    color: '#4299e1',
    fontWeight: 'bold',
  },

  // Social Login styles
  socialContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  orText: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 15,
  },
  socialButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  socialButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  appleButton: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  socialButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4a5568',
  },
  appleButtonText: {
    color: '#ffffff',
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 0,
    width: '90%',
    maxHeight: '80%',
  },
  pickerModalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 0,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3748',
  },
  modalCloseButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 18,
    color: '#4a5568',
    fontWeight: 'bold',
  },
  modalScrollView: {
    maxHeight: 400,
  },
  pickerScrollView: {
    maxHeight: 400,
  },
  modalOption: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f7fafc',
  },
  modalOptionSelected: {
    backgroundColor: '#ebf8ff',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#2d3748',
  },
  modalOptionTextSelected: {
    color: '#4299e1',
    fontWeight: 'bold',
  },

  // Date picker styles
  yearSection: {
    marginBottom: 20,
  },
  yearHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3748',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#f7fafc',
  },
  monthSection: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  monthHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4a5568',
    marginBottom: 10,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayButton: {
    width: 35,
    height: 35,
    borderRadius: 8,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayText: {
    fontSize: 14,
    color: '#2d3748',
  },

  // Height picker styles
  heightPickerContainer: {
    paddingHorizontal: 20,
  },
  feetSection: {
    marginBottom: 20,
  },
  feetHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4a5568',
    marginBottom: 10,
  },
  inchesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  heightButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#e2e8f0',
    marginBottom: 8,
  },
  heightText: {
    fontSize: 14,
    color: '#2d3748',
  },

  // Weight picker styles
  weightPickerContainer: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  weightButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#e2e8f0',
    marginBottom: 8,
  },
  weightText: {
    fontSize: 14,
    color: '#2d3748',
  },

  // Onboarding styles
  onboardingHeader: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  onboardingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2d3748',
    textAlign: 'center',
    marginBottom: 8,
  },
  onboardingSubtitle: {
    fontSize: 16,
    color: '#718096',
    textAlign: 'center',
    marginBottom: 20,
  },
  progressContainer: {
    alignItems: 'center',
    width: '100%',
  },
  progressText: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 8,
  },
  progressBar: {
    width: '80%',
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4299e1',
    borderRadius: 2,
  },
  stepContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2d3748',
    textAlign: 'center',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 16,
    color: '#718096',
    textAlign: 'center',
    marginBottom: 30,
  },

  // Goal styles
  goalContainer: {
    gap: 15,
    marginBottom: 30,
  },
  goalCard: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  goalCardSelected: {
    borderColor: '#4299e1',
    backgroundColor: '#ebf8ff',
  },
  goalEmoji: {
    fontSize: 32,
    marginBottom: 10,
  },
  goalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 5,
  },
  goalTitleSelected: {
    color: '#4299e1',
  },
  goalDescription: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
  },
  goalDescriptionSelected: {
    color: '#4299e1',
  },

  // Activity styles
  activitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 30,
  },
  activityCard: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    width: '47%',
  },
  activityCardSelected: {
    borderColor: '#4299e1',
    backgroundColor: '#ebf8ff',
  },
  activityCardDisabled: {
    opacity: 0.5,
  },
  activityEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d3748',
    textAlign: 'center',
  },
  activityTitleSelected: {
    color: '#4299e1',
  },

  // Navigation styles
  onboardingNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
  },
  onboardingBackButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#e2e8f0',
  },
  onboardingBackText: {
    fontSize: 16,
    color: '#4a5568',
    fontWeight: '600',
  },
  onboardingButton: {
    backgroundColor: '#4299e1',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 12,
  },
  onboardingButtonFullWidth: {
    width: '100%',
    alignItems: 'center',
  },
  onboardingButtonDisabled: {
    backgroundColor: '#a0aec0',
  },
  onboardingButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  onboardingButtonContainer: {
    paddingVertical: 20,
  },

  // Summary styles
  summaryContainer: {
    backgroundColor: '#f7fafc',
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 15,
  },
  summaryItem: {
    fontSize: 16,
    color: '#4a5568',
    marginBottom: 8,
  },

  // Dashboard styles
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  userInfoContainer: {
    alignItems: 'center',
    marginBottom: 30,
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: '100%',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 8,
  },
  userEmail: {
    fontSize: 16,
    color: '#718096',
    marginBottom: 4,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4299e1',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#718096',
    marginBottom: 30,
  },
  counterContainer: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 30,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: '100%',
  },
  counterText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#4299e1',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 12,
    marginBottom: 15,
    width: '100%',
    alignItems: 'center',
  },
  resetButton: {
    backgroundColor: '#ed8936',
  },
  logoutButton: {
    backgroundColor: '#e53e3e',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
