import React, { useState } from 'react'
import { View, ScrollView, Text, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useNavigation } from '@react-navigation/native'
import { Button } from '../../components/atoms'
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme'
import { authService } from '../../services/authService'

export const ForgotPasswordScreen: React.FC = () => {
  const navigation = useNavigation<any>()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    setError(null)
    setMessage(null)

    if (!email.trim()) {
      setError('Email is required')
      return
    }

    try {
      setLoading(true)
      const response = await authService.requestPasswordReset(email.trim())
      setMessage(response.detail)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to request password reset')
    } finally {
      setLoading(false)
    }
  }

  return (
    <LinearGradient colors={['#0F172A', '#115E59']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1 }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: Spacing.lg }}>
          <View style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: BorderRadius.xl, padding: Spacing.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' }}>
            <Text style={{ color: Colors.text.inverse, fontSize: Typography.sizes.h3, fontWeight: '700', marginBottom: Spacing.sm }}>Forgot password?</Text>
            <Text style={{ color: 'rgba(255,255,255,0.8)', marginBottom: Spacing.lg }}>
              Enter your email and we’ll send a reset link with a 15-minute token.
            </Text>

            {error && <Text style={{ color: '#FCA5A5', marginBottom: Spacing.md }}>{error}</Text>}
            {message && <Text style={{ color: '#6EE7B7', marginBottom: Spacing.md }}>{message}</Text>}

            <View style={{ backgroundColor: 'rgba(0,0,0,0.16)', borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.md, marginBottom: Spacing.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' }}>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Email address"
                placeholderTextColor="rgba(255,255,255,0.55)"
                keyboardType="email-address"
                autoCapitalize="none"
                style={{ color: Colors.text.inverse, paddingVertical: Spacing.md }}
                editable={!loading}
              />
            </View>

            <Button label={loading ? 'Sending...' : 'Send reset link'} onPress={handleSubmit} loading={loading} disabled={loading} size="large" />

            <TouchableOpacity onPress={() => navigation.navigate('ResetPassword')} style={{ marginTop: Spacing.lg, alignItems: 'center' }}>
              <Text style={{ color: Colors.primaryLight, fontWeight: '700' }}>I already have a token</Text>
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
