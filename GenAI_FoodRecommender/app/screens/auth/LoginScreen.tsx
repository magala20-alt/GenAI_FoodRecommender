import React, { useState } from 'react'
import {
  StyleSheet,
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useAuth } from '../../hooks'
import { Button, TextInput } from '../../components/atoms'
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme'
import { validateEmail, validatePassword } from '../../utils'

interface LoginScreenProps {
  onLoginSuccess?: () => void
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const { login, isLoading } = useAuth()

  const [email, setEmail] = useState('patient@example.com')
  const [password, setPassword] = useState('password')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [apiError, setApiError] = useState<string | null>(null)

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
      await login({ email, password })
      onLoginSuccess?.()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed'
      setApiError(message)
    }
  }

  const handleForgotPassword = () => {
    console.log('Navigate to forgot password')
  }

  return (
       <LinearGradient
        colors={['#0F172A', '#14b8a6']}
         start={{ x: 0, y: 0 }}
         end={{ x: 1, y: 1 }}
         style={styles.container}
      >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoiding}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Logo Section */}
          <View style={styles.logoSection}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>🧬</Text>
            </View>
            <Text style={styles.appName}>CARESYNC</Text>
            <Text style={styles.tagline}>Your personal health companion</Text>
          </View>

          {/* Login Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Welcome back</Text>
            <Text style={styles.cardSubtitle}>
              Your doctor will send your login details
            </Text>

            {/* API Error */}
            {apiError && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{apiError}</Text>
              </View>
            )}

            {/* Email Input */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>✉️</Text>
              <TextInput
                placeholder="Email address"
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
                style={styles.input}
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>🔒</Text>
              <TextInput
                placeholder="Password"
                value={password}
                onChangeText={(text) => {
                  setPassword(text)
                  if (errors.password) {
                    setErrors({ ...errors, password: '' })
                  }
                }}
                error={errors.password}
                secureTextEntry={true}
                editable={!isLoading}
                style={styles.input}
              />
            </View>

            {/* Login Button */}
            <Button
              label={isLoading ? 'Signing in...' : 'Sign In'}
              onPress={handleLogin}
              loading={isLoading}
              disabled={isLoading}
              size="large"
              style={styles.loginButton}
            />

            {/* Forgot Password Link */}
            <TouchableOpacity
              onPress={handleForgotPassword}
              disabled={isLoading}
              style={styles.forgotPasswordContainer}
            >
              <Text style={styles.forgotPasswordText}>Forgot your password?</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoiding: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  iconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  icon: {
    fontSize: 40,
  },
  appName: {
    fontSize: Typography.sizes.h2,
    fontWeight: Typography.weights.bold as any,
    color: '#ffffff',
    marginBottom: Spacing.sm,
    letterSpacing: 2,
  },
  tagline: {
    fontSize: Typography.sizes.bodySmall,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  card: {
    backgroundColor: 'rgba(20, 184, 166, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: BorderRadius.xxl,
    padding: Spacing.lg,
    paddingVertical: Spacing.xl,
  },
  cardTitle: {
    fontSize: Typography.sizes.h4,
    fontWeight: Typography.weights.bold as any,
    color: '#ffffff',
    marginBottom: Spacing.sm,
  },
  cardSubtitle: {
    fontSize: Typography.sizes.bodySmall,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: Spacing.lg,
  },
  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  errorBannerText: {
    color: '#fecaca',
    fontSize: Typography.sizes.body,
    fontWeight: '500',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  inputIcon: {
    fontSize: 18,
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    paddingVertical: Spacing.md,
    color: '#ffffff',
    fontSize: Typography.sizes.body,
  },
  loginButton: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.lg,
    backgroundColor: '#124E47',
  },
  forgotPasswordContainer: {
    alignItems: 'center',
  },
  forgotPasswordText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: Typography.sizes.bodySmall,
    fontWeight: Typography.weights.semibold as any,
  },
})
