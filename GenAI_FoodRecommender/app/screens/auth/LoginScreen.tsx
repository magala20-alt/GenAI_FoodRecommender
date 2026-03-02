import React, { useState } from 'react'
import {
  StyleSheet,
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native'
import { useAuth } from '../../hooks'
import { Button, TextInput } from '../../components/atoms'
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme'
import { validateEmail, validatePassword, getGreeting } from '../../utils'

interface LoginScreenProps {
  onLoginSuccess?: () => void
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const { login, isLoading } = useAuth()

  const [email, setEmail] = useState('patient@example.com')
  const [password, setPassword] = useState('password')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [apiError, setApiError] = useState<string | null>(null)
  const [userType, setUserType] = useState<'patient' | 'doctor'>('patient')

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email'
    }

    if (!password) {
      newErrors.password = 'Password is required'
    } else if (!validatePassword(password)) {
      newErrors.password = 'Password must be at least 8 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleLogin = async () => {
    setApiError(null)
    
    if (!validateForm()) {
      return
    }

    try {
      await login({ email, password, userType })
      onLoginSuccess?.()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed'
      setApiError(message)
    }
  }

  const handleForgotPassword = () => {
    // Navigate to forgot password screen
    console.log('Navigate to forgot password')
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>CS</Text>
          </View>
          <Text style={styles.appName}>CARESYNC</Text>
          <Text style={styles.tagline}>Your personalised nutrition companion</Text>
        </View>

        {/* Greeting */}
        <View style={styles.greetingSection}>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.greetingSubtitle}>
            Sign in to manage your nutrition journey
          </Text>
        </View>

        {/* API Error */}
        {apiError && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{apiError}</Text>
          </View>
        )}

        {/* Form */}
        <View style={styles.form}>
          {/* Email Input */}
          <TextInput
            label="Email"
            placeholder="Enter your email"
            value={email}
            onChangeText={(text) => {
              setEmail(text)
              if (errors.email) {
                setErrors({ ...errors, email: '' })
              }
            }}
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!isLoading}
          />

          {/* Password Input */}
          <TextInput
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={(text) => {
              setPassword(text)
              if (errors.password) {
                setErrors({ ...errors, password: '' })
              }
            }}
            error={errors.password}
            secureTextEntry={!showPassword}
            editable={!isLoading}
          />

          {/* Show Password Toggle */}
          <TouchableOpacity
            style={styles.showPasswordToggle}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Text style={styles.showPasswordText}>
              {showPassword ? 'Hide' : 'Show'} password
            </Text>
          </TouchableOpacity>

          {/* User Type Selection */}
          <View style={styles.userTypeSection}>
            <Text style={styles.userTypeLabel}>I'm a...</Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[
                  styles.userTypeButton,
                  userType === 'patient' && styles.userTypeButtonActive,
                ]}
                onPress={() => setUserType('patient')}
                disabled={isLoading}
              >
                <Text
                  style={[
                    styles.userTypeButtonText,
                    userType === 'patient' && styles.userTypeButtonTextActive,
                  ]}
                >
                  Patient
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.userTypeButton,
                  userType === 'doctor' && styles.userTypeButtonActive,
                ]}
                onPress={() => setUserType('doctor')}
                disabled={isLoading}
              >
                <Text
                  style={[
                    styles.userTypeButtonText,
                    userType === 'doctor' && styles.userTypeButtonTextActive,
                  ]}
                >
                  Doctor
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Login Button */}
          <Button
            label={isLoading ? 'Signing in...' : 'Sign in'}
            onPress={handleLogin}
            loading={isLoading}
            disabled={isLoading}
            size="large"
            style={styles.loginButton}
          />
        </View>

        {/* Help Links */}
        <View style={styles.helpSection}>
          <TouchableOpacity
            onPress={handleForgotPassword}
            disabled={isLoading}
          >
            <Text style={styles.helpLink}>Forgot your password?</Text>
          </TouchableOpacity>

          <Text style={styles.divider}>|</Text>

          <TouchableOpacity disabled={isLoading}>
            <Text style={styles.helpLink}>Contact your Doctor</Text>
          </TouchableOpacity>
        </View>

        {/* Demo Note */}
        <View style={styles.demoSection}>
          <Text style={styles.demoText}>
            Demo credentials: patient@example.com / password
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
    marginTop: Spacing.lg,
  },
  logo: {
    width: 60,
    height: 60,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  logoText: {
    color: Colors.text.inverse,
    fontSize: 24,
    fontWeight: Typography.weights.bold as any,
  },
  appName: {
    fontSize: Typography.sizes.h2,
    fontWeight: Typography.weights.bold as any,
    color: Colors.text.primary,
    letterSpacing: 1,
  },
  tagline: {
    fontSize: Typography.sizes.bodySmall,
    color: Colors.text.secondary,
    marginTop: Spacing.sm,
  },
  greetingSection: {
    marginBottom: Spacing.xl,
  },
  greeting: {
    fontSize: Typography.sizes.h4,
    fontWeight: Typography.weights.bold as any,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  greetingSubtitle: {
    fontSize: Typography.sizes.body,
    color: Colors.text.secondary,
  },
  errorBanner: {
    backgroundColor: Colors.error,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  errorBannerText: {
    color: Colors.text.inverse,
    fontSize: Typography.sizes.body,
  },
  form: {
    marginBottom: Spacing.xl,
  },
  showPasswordToggle: {
    alignSelf: 'flex-end',
    marginBottom: Spacing.lg,
    marginTop: -Spacing.md,
  },
  showPasswordText: {
    color: Colors.primary,
    fontSize: Typography.sizes.bodySmall,
    fontWeight: Typography.weights.semibold as any,
  },
  userTypeSection: {
    marginBottom: Spacing.lg,
  },
  userTypeLabel: {
    fontSize: Typography.sizes.bodySmall,
    fontWeight: Typography.weights.semibold as any,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  userTypeButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  userTypeButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  userTypeButtonText: {
    fontSize: Typography.sizes.body,
    fontWeight: Typography.weights.semibold as any,
    color: Colors.text.primary,
  },
  userTypeButtonTextActive: {
    color: Colors.text.inverse,
  },
  loginButton: {
    marginTop: Spacing.lg,
  },
  helpSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  helpLink: {
    color: Colors.primary,
    fontSize: Typography.sizes.bodySmall,
    fontWeight: Typography.weights.semibold as any,
  },
  divider: {
    color: Colors.border,
    fontSize: Typography.sizes.body,
  },
  demoSection: {
    backgroundColor: Colors.surfaceLight,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primaryLight,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  demoText: {
    fontSize: Typography.sizes.caption,
    color: Colors.text.secondary,
    fontStyle: 'italic',
  },
})
