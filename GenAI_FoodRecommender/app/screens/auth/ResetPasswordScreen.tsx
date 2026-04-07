import React, { useEffect, useState } from 'react'
import { View, ScrollView, Text, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useNavigation } from '@react-navigation/native'
import { Button } from '../../components/atoms'
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme'
import { authService } from '../../services/authService'

export const ResetPasswordScreen: React.FC = () => {
  const navigation = useNavigation<any>()
  const [token, setToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [checking, setChecking] = useState(false)
  const [loading, setLoading] = useState(false)
  const [tokenValid, setTokenValid] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    const verify = async () => {
      if (!token.trim()) {
        setTokenValid(false)
        return
      }

      try {
        setChecking(true)
        await authService.verifyPasswordResetToken(token.trim())
        setTokenValid(true)
        setError(null)
      } catch (err) {
        setTokenValid(false)
        setError(err instanceof Error ? err.message : 'Invalid or expired token')
      } finally {
        setChecking(false)
      }
    }

    void verify()
  }, [token])

  const handleSubmit = async () => {
    setError(null)
    setMessage(null)

    if (!token.trim()) {
      setError('Enter your reset token')
      return
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    try {
      setLoading(true)
      const response = await authService.resetPassword(token.trim(), newPassword)
      setMessage(response.detail)
      setTimeout(() => navigation.navigate('Login'), 1200)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reset password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <LinearGradient colors={['#0F172A', '#0F766E']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1 }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: Spacing.lg }}>
          <View style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: BorderRadius.xl, padding: Spacing.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' }}>
            <Text style={{ color: Colors.text.inverse, fontSize: Typography.sizes.h3, fontWeight: '700', marginBottom: Spacing.sm }}>Reset password</Text>
            <Text style={{ color: 'rgba(255,255,255,0.8)', marginBottom: Spacing.lg }}>
              Use the token from your email link. It expires after 15 minutes and works once.
            </Text>

            {error && <Text style={{ color: '#FCA5A5', marginBottom: Spacing.md }}>{error}</Text>}
            {message && <Text style={{ color: '#6EE7B7', marginBottom: Spacing.md }}>{message}</Text>}

            <View style={{ backgroundColor: 'rgba(0,0,0,0.16)', borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.md, marginBottom: Spacing.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' }}>
              <TextInput
                value={token}
                onChangeText={setToken}
                placeholder="Paste reset token"
                placeholderTextColor="rgba(255,255,255,0.55)"
                autoCapitalize="none"
                style={{ color: Colors.text.inverse, paddingVertical: Spacing.md }}
                editable={!loading}
              />
            </View>

            <View style={{ backgroundColor: 'rgba(0,0,0,0.16)', borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.md, marginBottom: Spacing.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' }}>
              <TextInput
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="New password"
                placeholderTextColor="rgba(255,255,255,0.55)"
                secureTextEntry
                style={{ color: Colors.text.inverse, paddingVertical: Spacing.md }}
                editable={!loading}
              />
            </View>

            <View style={{ backgroundColor: 'rgba(0,0,0,0.16)', borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.md, marginBottom: Spacing.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' }}>
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm new password"
                placeholderTextColor="rgba(255,255,255,0.55)"
                secureTextEntry
                style={{ color: Colors.text.inverse, paddingVertical: Spacing.md }}
                editable={!loading}
              />
            </View>

            <Button label={loading ? 'Updating...' : checking ? 'Checking token...' : 'Update password'} onPress={handleSubmit} loading={loading} disabled={loading || checking || !tokenValid || !token.trim()} size="large" />

            <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')} style={{ marginTop: Spacing.lg, alignItems: 'center' }}>
              <Text style={{ color: Colors.primaryLight, fontWeight: '700' }}>Request a new token</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('Login')} style={{ marginTop: Spacing.md, alignItems: 'center' }}>
              <Text style={{ color: 'rgba(255,255,255,0.8)' }}>Back to login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  )
}
