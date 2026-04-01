import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView } from 'react-native'
import React, { useState } from 'react'
import { scale, moderateScale, verticalScale } from './constants/theme'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [userType, setUserType] = useState(null)

  const handleSignIn = () => {
    console.log('Sign in:', { email, password, userType })
    // Add sign in logic here
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>CS</Text>
        </View>
        <Text style={styles.appName}>CARESYNC</Text>
        <Text style={styles.tagline}>Your personalised chef</Text>
      </View>

      {/* Title Section */}
      <View style={styles.titleSection}>
        <Text style={styles.mainTitle}>Collaborative Health Management for Chronic Conditions</Text>
        <Text style={styles.subtitle}>AI-powered insights connecting patients and healthcare providers for better chronic disease management.</Text>
      </View>

      {/* Login Form */}
      <View style={styles.formContainer}>
        <Text style={styles.welcomeText}>Welcome back</Text>
        <Text style={styles.formSubtitle}>Sign in to access your health dashboard</Text>

        {/* Email Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            editable={true}
          />
        </View>

        {/* Password Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your password"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={true}
          />
        </View>

        {/* User Type Selection */}
        <View style={styles.userTypeSection}>
          <Text style={styles.userTypeLabel}>I'm a...</Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.userTypeButton, userType === 'patient' && styles.userTypeButtonActive]}
              onPress={() => setUserType('patient')}
            >
              <Text style={[styles.userTypeButtonText, userType === 'patient' && styles.userTypeButtonTextActive]}>
                Patient
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.userTypeButton, userType === 'doctor' && styles.userTypeButtonActive]}
              onPress={() => setUserType('doctor')}
            >
              <Text style={[styles.userTypeButtonText, userType === 'doctor' && styles.userTypeButtonTextActive]}>
                Doctor
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sign In Button */}
        <TouchableOpacity style={styles.signInButton} onPress={handleSignIn}>
          <Text style={styles.signInButtonText}>Sign in</Text>
        </TouchableOpacity>

        {/* Sign Up Link */}
        <View style={styles.signUpContainer}>
          <Text style={styles.signUpText}>Don't have an account? </Text>
          <TouchableOpacity>
            <Text style={styles.signUpLink}>Contact your Doctor</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  )
}

export default Login

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#f5f5f5',
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(30),
  },
  header: {
    alignItems: 'center',
    marginBottom: verticalScale(30),
  },
  logo: {
    width: scale(50),
    height: scale(50),
    backgroundColor: '#00a699',
    borderRadius: scale(8),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: verticalScale(10),
  },
  logoText: {
    color: '#fff',
    fontSize: moderateScale(20, 0.45),
    fontWeight: 'bold',
  },
  appName: {
    fontSize: moderateScale(24, 0.45),
    fontWeight: '700',
    color: '#223',
    letterSpacing: scale(1),
  },
  tagline: {
    fontSize: moderateScale(14, 0.4),
    color: '#666',
    marginTop: verticalScale(4),
  },
  titleSection: {
    marginBottom: verticalScale(30),
  },
  mainTitle: {
    fontSize: moderateScale(28, 0.45),
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: verticalScale(12),
    lineHeight: verticalScale(36),
  },
  subtitle: {
    fontSize: moderateScale(14, 0.4),
    color: '#666',
    lineHeight: verticalScale(20),
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: scale(20),
    padding: scale(24),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: verticalScale(4) },
    shadowOpacity: 0.1,
    shadowRadius: scale(8),
    elevation: scale(5),
  },
  welcomeText: {
    fontSize: moderateScale(22, 0.45),
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: verticalScale(8),
    textAlign: 'center',
  },
  formSubtitle: {
    fontSize: moderateScale(14, 0.4),
    color: '#666',
    marginBottom: verticalScale(24),
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: verticalScale(18),
  },
  label: {
    fontSize: moderateScale(14, 0.4),
    fontWeight: '600',
    color: '#333',
    marginBottom: verticalScale(8),
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: scale(8),
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(12),
    fontSize: moderateScale(14, 0.4),
    color: '#333',
  },
  userTypeSection: {
    marginBottom: verticalScale(24),
  },
  userTypeLabel: {
    fontSize: moderateScale(14, 0.4),
    fontWeight: '600',
    color: '#333',
    marginBottom: verticalScale(12),
  },
  buttonRow: {
    flexDirection: 'row',
    gap: scale(12),
  },
  userTypeButton: {
    flex: 1,
    paddingVertical: verticalScale(12),
    borderWidth: 1,
    borderColor: '#999',
    borderRadius: scale(8),
    alignItems: 'center',
  },
  userTypeButtonActive: {
    backgroundColor: '#00a699',
    borderColor: '#00a699',
  },
  userTypeButtonText: {
    fontSize: moderateScale(14, 0.4),
    fontWeight: '600',
    color: '#333',
  },
  userTypeButtonTextActive: {
    color: '#fff',
  },
  signInButton: {
    backgroundColor: '#00796b',
    paddingVertical: verticalScale(14),
    borderRadius: scale(8),
    alignItems: 'center',
    marginBottom: verticalScale(16),
  },
  signInButtonText: {
    fontSize: moderateScale(16, 0.4),
    fontWeight: '700',
    color: '#fff',
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signUpText: {
    fontSize: moderateScale(13, 0.35),
    color: '#666',
  },
  signUpLink: {
    fontSize: moderateScale(13, 0.35),
    fontWeight: '600',
    color: '#00a699',
  },
})
