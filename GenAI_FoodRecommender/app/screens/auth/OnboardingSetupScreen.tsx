import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native'
import { Colors, Spacing, BorderRadius, Typography } from '../../constants/theme'
import { Button, TextInput } from '../../components/atoms'
import { useAuth } from '../../hooks'
import { OnboardingSetupData } from '../../types'

interface OnboardingSetupScreenProps {
  onComplete?: () => void
}

export function OnboardingSetupScreen({ onComplete }: OnboardingSetupScreenProps) {
  const { completeOnboarding } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [data, setData] = useState<Partial<OnboardingSetupData>>({
    budgetPreference: 'medium',
    country: 'Ghana',
    primaryGoal: 'allOfAbove',
    cuisinePreferences: [],
  })

  const cuisineOptions = ['African', 'Asian', 'Mediterranean', 'Western', 'Caribbean', 'Indian']

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1)
      setErrors({})
    }
  }

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      setErrors({})
    }
  }

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {}

    if (step === 1) {
      if (!data.newPassword) newErrors.newPassword = 'Password is required'
      if (data.newPassword && data.newPassword.length < 8) newErrors.newPassword = 'Min 8 characters'
      if (!data.confirmPassword) newErrors.confirmPassword = 'Confirm password'
      if (data.newPassword !== data.confirmPassword) newErrors.confirmPassword = 'Passwords don\'t match'
    } else if (step === 2) {
      if (!data.weight) newErrors.weight = 'Weight required'
      if (!data.height) newErrors.height = 'Height required'
      if (!data.bpSystolic) newErrors.bpSystolic = 'Systolic required'
      if (!data.bpDiastolic) newErrors.bpDiastolic = 'Diastolic required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleComplete = async () => {
    if (validateStep(4)) {
      setIsLoading(true)
      try {
        await completeOnboarding(data as OnboardingSetupData)
        onComplete?.()
      } catch (error) {
        setErrors({ submit: error instanceof Error ? error.message : 'Failed to complete setup' })
      } finally {
        setIsLoading(false)
      }
    }
  }

  const updateData = (key: keyof OnboardingSetupData, value: any) => {
    setData(prev => ({ ...prev, [key]: value }))
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: '' }))
    }
  }

  const toggleCuisine = (cuisine: string) => {
    const current = data.cuisinePreferences || []
    if (current.includes(cuisine)) {
      updateData('cuisinePreferences', current.filter(c => c !== cuisine))
    } else {
      updateData('cuisinePreferences', [...current, cuisine])
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>STEP {currentStep} OF 4 • YOUR DETAILS</Text>
          
          {/* Step Indicator */}
          <View style={styles.stepsContainer}>
            {[1, 2, 3, 4].map(step => (
              <View key={step} style={styles.stepWrapper}>
                <View
                  style={[
                    styles.stepDot,
                    step <= currentStep && styles.stepDotActive,
                    step === currentStep && styles.stepDotCurrent,
                  ]}
                >
                  {step < currentStep ? (
                    <Text style={styles.stepCheckmark}>✓</Text>
                  ) : (
                    <Text style={styles.stepNumber}>{step}</Text>
                  )}
                </View>
                {step < 4 && (
                  <View
                    style={[
                      styles.stepLine,
                      step < currentStep && styles.stepLineActive,
                    ]}
                  />
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {currentStep === 1 && (
            <Step1Content
              data={data}
              errors={errors}
              onUpdate={updateData}
            />
          )}
          {currentStep === 2 && (
            <Step2Content
              data={data}
              errors={errors}
              onUpdate={updateData}
            />
          )}
          {currentStep === 3 && (
            <Step3Content
              data={data}
              errors={errors}
              onUpdate={updateData}
            />
          )}
          {currentStep === 4 && (
            <Step4Content
              data={data}
              errors={errors}
              cuisineOptions={cuisineOptions}
              onToggleCuisine={toggleCuisine}
            />
          )}
        </View>

        {/* Error Message */}
        {errors.submit && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{errors.submit}</Text>
          </View>
        )}

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          {currentStep > 1 && (
            <TouchableOpacity style={styles.secondaryButton} onPress={handlePrev} disabled={isLoading}>
              <Text style={styles.secondaryButtonText}>← Back</Text>
            </TouchableOpacity>
          )}
          
          {currentStep < 4 ? (
            <Button
              label="Continue →"
              onPress={handleNext}
              disabled={isLoading}
              style={{ flex: currentStep === 1 ? 1 : 0.6 }}
            />
          ) : (
            <Button
              label={isLoading ? 'Setting up...' : 'Complete Setup ✓'}
              onPress={handleComplete}
              loading={isLoading}
              disabled={isLoading}
              style={{ flex: 1 }}
            />
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

// Step 1: Change Password
function Step1Content({ data, errors, onUpdate }: any) {
  const password = data.newPassword || ''
  const strength = getPasswordStrength(password)

  return (
    <>
      <Text style={styles.stepTitle}>Change Password</Text>
      <Text style={styles.stepDescription}>Create a strong password to secure your account</Text>

      <TextInput
        label="New Password"
        placeholder="At least 8 characters"
        value={password}
        onChangeText={(text) => onUpdate('newPassword', text)}
        error={errors.newPassword}
        secureTextEntry
        style={{ marginBottom: Spacing.lg }}
      />

      {password && (
        <View style={styles.strengthIndicator}>
          <View
            style={[
              styles.strengthBar,
              {
                width: strength === 'strong' ? '100%' : strength === 'medium' ? '66%' : '33%',
                backgroundColor: strength === 'strong' ? Colors.success : strength === 'medium' ? Colors.secondary : Colors.danger,
              },
            ]}
          />
          <Text style={styles.strengthText}>{strength.toUpperCase()}</Text>
        </View>
      )}

      <TextInput
        label="Confirm Password"
        placeholder="Re-enter password"
        value={data.confirmPassword || ''}
        onChangeText={(text) => onUpdate('confirmPassword', text)}
        error={errors.confirmPassword}
        secureTextEntry
      />
    </>
  )
}

// Step 2: Personal Details
function Step2Content({ data, errors, onUpdate }: any) {
  return (
    <>
      <Text style={styles.stepTitle}>Personal Details</Text>
      <Text style={styles.stepDescription}>Help us personalise your meal plan</Text>

      <Text style={styles.label}>Budget Preference</Text>
      <View style={styles.budgetButtons}>
        {(['low', 'medium', 'high'] as const).map(option => (
          <TouchableOpacity
            key={option}
            style={[
              styles.budgetButton,
              data.budgetPreference === option && styles.budgetButtonActive,
            ]}
            onPress={() => onUpdate('budgetPreference', option)}
          >
            <Text style={styles.budgetIcon}>
              {option === 'low' ? '🍃' : option === 'medium' ? '🧆' : '🍱'}
            </Text>
            <Text
              style={[
                styles.budgetText,
                data.budgetPreference === option && styles.budgetTextActive,
              ]}
            >
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput
        label="Country"
        placeholder="e.g., Ghana"
        value={data.country || ''}
        onChangeText={(text) => onUpdate('country', text)}
      />

      <View style={styles.twoColumnRow}>
        <TextInput
          label="Weight (kg)"
          placeholder="e.g., 78"
          value={data.weight || ''}
          onChangeText={(text) => onUpdate('weight', text)}
          keyboardType="decimal-pad"
          error={errors.weight}
          style={{ flex: 1, marginRight: Spacing.md }}
        />
        <TextInput
          label="Height (cm)"
          placeholder="e.g., 164"
          value={data.height || ''}
          onChangeText={(text) => onUpdate('height', text)}
          keyboardType="decimal-pad"
          error={errors.height}
          style={{ flex: 1 }}
        />
      </View>

      <View style={styles.twoColumnRow}>
        <TextInput
          label="BP Systolic"
          placeholder="e.g., 128"
          value={data.bpSystolic || ''}
          onChangeText={(text) => onUpdate('bpSystolic', text)}
          keyboardType="number-pad"
          error={errors.bpSystolic}
          style={{ flex: 1, marginRight: Spacing.md }}
        />
        <TextInput
          label="BP Diastolic"
          placeholder="e.g., 82"
          value={data.bpDiastolic || ''}
          onChangeText={(text) => onUpdate('bpDiastolic', text)}
          keyboardType="number-pad"
          error={errors.bpDiastolic}
          style={{ flex: 1 }}
        />
      </View>

      {data.weight && data.height && (
        <View style={styles.bmrCard}>
          <Text style={styles.bmrNumber}>
            {Math.round(calculateBMR(parseFloat(data.weight), parseFloat(data.height)))}
          </Text>
          <Text style={styles.bmrLabel}>kcal/day</Text>
          <Text style={styles.bmrSubtext}>Auto-calculated ✓</Text>
        </View>
      )}
    </>
  )
}

// Step 3: Goals
function Step3Content({ data, errors, onUpdate }: any) {
  return (
    <>
      <Text style={styles.stepTitle}>Your Health Goals</Text>
      <Text style={styles.stepDescription}>What's your primary health goal?</Text>

      <Text style={styles.label}>Primary Goal</Text>
      {([
        { id: 'loseWeight', label: 'Lose Weight', icon: '⚖️' },
        { id: 'manageGlucose', label: 'Manage Glucose', icon: '📈' },
        { id: 'improveDiet', label: 'Improve Diet', icon: '🥗' },
        { id: 'allOfAbove', label: 'All of the Above', icon: '⭐' },
      ] as const).map(goal => (
        <TouchableOpacity
          key={goal.id}
          style={[
            styles.goalButton,
            data.primaryGoal === goal.id && styles.goalButtonActive,
          ]}
          onPress={() => onUpdate('primaryGoal', goal.id)}
        >
          <Text style={styles.goalIcon}>{goal.icon}</Text>
          <Text
            style={[
              styles.goalText,
              data.primaryGoal === goal.id && styles.goalTextActive,
            ]}
          >
            {goal.label}
          </Text>
        </TouchableOpacity>
      ))}

      {data.primaryGoal === 'loseWeight' && (
        <TextInput
          label="Target Weight (kg)"
          placeholder="e.g., 70"
          value={data.targetWeight || ''}
          onChangeText={(text) => onUpdate('targetWeight', text)}
          keyboardType="decimal-pad"
        />
      )}
    </>
  )
}

// Step 4: Cuisine Preferences
function Step4Content({ data, errors, cuisineOptions, onToggleCuisine }: any) {
  return (
    <>
      <Text style={styles.stepTitle}>Cuisine Preferences</Text>
      <Text style={styles.stepDescription}>Which cuisines do you prefer?</Text>

      <View style={styles.cuisineChips}>
        {cuisineOptions.map((cuisine: string) => (
          <TouchableOpacity
            key={cuisine}
            style={[
              styles.cuisineChip,
              (data.cuisinePreferences || []).includes(cuisine) && styles.cuisineChipActive,
            ]}
            onPress={() => onToggleCuisine(cuisine)}
          >
            <Text
              style={[
                styles.cuisineChipText,
                (data.cuisinePreferences || []).includes(cuisine) && styles.cuisineChipTextActive,
              ]}
            >
              {cuisine}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </>
  )
}

// Helper Functions
function getPasswordStrength(password: string): 'weak' | 'medium' | 'strong' {
  if (password.length < 8) return 'weak'
  if (/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) return 'strong'
  return 'medium'
}

function calculateBMR(weight: number, height: number): number {
  // Simplified Mifflin-St Jeor (assuming average adult)
  return 10 * weight + 6.25 * height - 100
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.warmWhite,
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
  },

  header: {
    backgroundColor: Colors.white,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  headerTitle: {
    fontSize: Typography.sizes.caption,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: Spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  stepsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.lightGray,
  },
  stepDotActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  stepDotCurrent: {
    borderColor: Colors.primary,
    borderWidth: 3,
  },
  stepNumber: {
    fontSize: Typography.sizes.body,
    fontWeight: 'bold',
    color: Colors.gray,
  },
  stepCheckmark: {
    fontSize: Typography.sizes.h4,
    color: Colors.white,
    fontWeight: 'bold',
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.lightGray,
    marginHorizontal: Spacing.sm,
  },
  stepLineActive: {
    backgroundColor: Colors.primary,
  },

  content: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },

  stepTitle: {
    fontSize: Typography.sizes.h3,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  stepDescription: {
    fontSize: Typography.sizes.bodySmall,
    color: Colors.text.secondary,
    marginBottom: Spacing.lg,
  },

  label: {
    fontSize: Typography.sizes.bodySmall,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },

  budgetButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  budgetButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.lightGray,
    alignItems: 'center',
  },
  budgetButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  budgetIcon: {
    fontSize: 24,
    marginBottom: Spacing.xs,
  },
  budgetText: {
    fontSize: Typography.sizes.caption,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  budgetTextActive: {
    color: Colors.white,
  },

  twoColumnRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },

  bmrCard: {
    backgroundColor: Colors.primaryTint,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  bmrNumber: {
    fontSize: Typography.sizes.h2,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  bmrLabel: {
    fontSize: Typography.sizes.bodySmall,
    color: Colors.text.secondary,
  },
  bmrSubtext: {
    fontSize: Typography.sizes.caption,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
  },

  goalButton: {
    flexDirection: 'row',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.lightGray,
    marginBottom: Spacing.md,
    alignItems: 'center',
  },
  goalButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  goalIcon: {
    fontSize: 24,
    marginRight: Spacing.md,
  },
  goalText: {
    fontSize: Typography.sizes.body,
    fontWeight: '500',
    color: Colors.text.primary,
  },
  goalTextActive: {
    color: Colors.white,
    fontWeight: 'bold',
  },

  cuisineChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  cuisineChip: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.circular,
    borderWidth: 2,
    borderColor: Colors.lightGray,
    backgroundColor: Colors.white,
  },
  cuisineChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  cuisineChipText: {
    fontSize: Typography.sizes.bodySmall,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  cuisineChipTextActive: {
    color: Colors.white,
  },

  strengthIndicator: {
    marginVertical: Spacing.md,
  },
  strengthBar: {
    height: 4,
    backgroundColor: Colors.lightGray,
    borderRadius: 2,
    marginBottom: Spacing.sm,
  },
  strengthText: {
    fontSize: Typography.sizes.caption,
    fontWeight: 'bold',
    color: Colors.text.secondary,
  },

  errorBanner: {
    backgroundColor: Colors.dangerTint,
    borderLeftWidth: 4,
    borderLeftColor: Colors.danger,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  errorText: {
    fontSize: Typography.sizes.bodySmall,
    color: Colors.danger,
    fontWeight: '500',
  },

  buttonContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  secondaryButton: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: Typography.sizes.body,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
})
