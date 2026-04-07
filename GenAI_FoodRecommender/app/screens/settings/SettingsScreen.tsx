import React, { useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native'
import { Colors, Spacing, BorderRadius, Typography, moderateScale, scale } from '../../constants/theme'
import { useAuth } from '../../hooks'
import { authService } from '../../services/authService'
import { onboardingService, OnboardingDetails, OnboardingDetailsUpdatePayload } from '../../services/onboardingService'

type InfoView = 'about' | 'terms' | 'privacy' | null

export function SettingsScreen() {
  const { user, logout } = useAuth()
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [onboarding, setOnboarding] = useState<OnboardingDetails | null>(null)
  const [editDraft, setEditDraft] = useState({
    cuisinePreferences: '',
    budgetPreference: 'medium',
    country: '',
    calorieTarget: '',
    dailyStepGoal: '',
    targetWeightKg: '',
    weightKg: '',
    heightCm: '',
    bpSystolic: '',
    bpDiastolic: '',
    primaryGoal: 'allOfAbove',
  })

  const [showEditModal, setShowEditModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passwordDraft, setPasswordDraft] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [changingPassword, setChangingPassword] = useState(false)
  const [activeInfoView, setActiveInfoView] = useState<InfoView>(null)

  useEffect(() => {
    let isActive = true
    const load = async () => {
      try {
        setIsLoading(true)
        const details = await onboardingService.getDetails()
        if (!isActive) return
        setOnboarding(details)
      } catch {
        if (!isActive) return
        setOnboarding(null)
      } finally {
        if (isActive) setIsLoading(false)
      }
    }

    void load()
    return () => {
      isActive = false
    }
  }, [])

  const syncDraftFromDetails = (details: OnboardingDetails) => {
    setEditDraft({
      cuisinePreferences: (details.cuisinePreferences || []).join(', '),
      budgetPreference: details.budgetPreference || 'medium',
      country: details.country || '',
      calorieTarget: details.calorieTarget != null ? String(details.calorieTarget) : '',
      dailyStepGoal: '',
      targetWeightKg: details.targetWeightKg != null ? String(details.targetWeightKg) : '',
      weightKg: details.weightKg != null ? String(details.weightKg) : '',
      heightCm: details.heightCm != null ? String(details.heightCm) : '',
      bpSystolic: details.bpSystolic != null ? String(details.bpSystolic) : '',
      bpDiastolic: details.bpDiastolic != null ? String(details.bpDiastolic) : '',
      primaryGoal: details.primaryGoal || 'allOfAbove',
    })
  }

  const openEditOnboarding = () => {
    if (!onboarding) {
      Alert.alert('Not available', 'Onboarding data is not available yet.')
      return
    }
    syncDraftFromDetails(onboarding)
    setShowEditModal(true)
  }

  const saveOnboardingChanges = async () => {
    const parseNumber = (value: string): number | undefined => {
      const trimmed = value.trim()
      if (!trimmed) return undefined
      const num = Number(trimmed)
      return Number.isFinite(num) ? num : undefined
    }

    const payload: OnboardingDetailsUpdatePayload = {
      cuisinePreferences: editDraft.cuisinePreferences
        .split(',')
        .map(item => item.trim())
        .filter(Boolean),
      budgetPreference: editDraft.budgetPreference,
      country: editDraft.country.trim() || undefined,
      calorieTarget: parseNumber(editDraft.calorieTarget),
      dailyStepGoal: parseNumber(editDraft.dailyStepGoal),
      targetWeightKg: parseNumber(editDraft.targetWeightKg),
      weightKg: parseNumber(editDraft.weightKg),
      heightCm: parseNumber(editDraft.heightCm),
      bpSystolic: parseNumber(editDraft.bpSystolic),
      bpDiastolic: parseNumber(editDraft.bpDiastolic),
      primaryGoal: editDraft.primaryGoal,
    }

    try {
      setIsSaving(true)
      const updated = await onboardingService.updateDetails(payload)
      setOnboarding(updated)
      setShowEditModal(false)
      Alert.alert('Saved', 'Onboarding data updated successfully.')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update onboarding data.'
      Alert.alert('Save failed', message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (!passwordDraft.currentPassword || !passwordDraft.newPassword || !passwordDraft.confirmPassword) {
      Alert.alert('Missing fields', 'Please fill in all password fields.')
      return
    }
    if (passwordDraft.newPassword !== passwordDraft.confirmPassword) {
      Alert.alert('Mismatch', 'New password and confirmation do not match.')
      return
    }

    try {
      setChangingPassword(true)
      await authService.changePassword(passwordDraft.currentPassword, passwordDraft.newPassword)
      setShowPasswordModal(false)
      setPasswordDraft({ currentPassword: '', newPassword: '', confirmPassword: '' })
      Alert.alert('Updated', 'Password changed successfully.')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to change password.'
      Alert.alert('Change failed', message)
    } finally {
      setChangingPassword(false)
    }
  }

  const infoContent = useMemo(() => {
    if (activeInfoView === 'about') {
      return {
        title: 'About CareSync',
        body: 'CareSync helps patients and clinicians stay connected through meal logging, vitals tracking, progress monitoring, and AI-assisted guidance. The app is built to support long-term chronic care management with clear daily actions and shared visibility.',
      }
    }
    if (activeInfoView === 'terms') {
      return {
        title: 'Terms of Service',
        body: 'By using CareSync, you agree to use the app for lawful health-tracking and communication purposes. CareSync provides educational and workflow support and does not replace emergency or direct clinical care. Keep your account secure and report unauthorized access immediately.',
      }
    }
    return {
      title: 'Privacy Policy',
      body: 'CareSync stores account, onboarding, meal, and health data to provide personalized recommendations and clinician workflows. Data is used only for care features in this platform and is protected using authenticated access controls. Contact your administrator for data export or deletion requests.',
    }
  }, [activeInfoView])

  const handleLogout = () => {
    logout()
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={Colors.primary} />
        <Text style={styles.loadingText}>Loading settings...</Text>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      {/* Profile Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Profile</Text>
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatar}>👤</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.profileName}>{user?.firstName} {user?.lastName}</Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
          </View>
          <TouchableOpacity style={styles.editButton} onPress={openEditOnboarding}>
            <Text style={styles.editIcon}>✏️</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.listItem}>
          <Text style={styles.listIcon}>🖼️</Text>
          <Text style={styles.listLabel}>Change Profile Photo</Text>
          <Text style={styles.listArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Preferences Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>

        <TouchableOpacity style={styles.listItem}>
          <Text style={styles.listIcon}>🍽️</Text>
          <Text style={styles.listLabel}>Cuisine Preferences</Text>
          <Text style={styles.listValue}>{(onboarding?.cuisinePreferences || []).slice(0, 2).join(', ') || 'Not set'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.listItem} onPress={openEditOnboarding}>
          <Text style={styles.listIcon}>💰</Text>
          <Text style={styles.listLabel}>Budget Preference</Text>
          <Text style={styles.listValue}>{onboarding?.budgetPreference || 'Not set'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.listItem} onPress={openEditOnboarding}>
          <Text style={styles.listIcon}>🌍</Text>
          <Text style={styles.listLabel}>Country</Text>
          <Text style={styles.listValue}>{onboarding?.country || 'Not set'}</Text>
        </TouchableOpacity>
      </View>

      {/* Health Targets Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Health Targets</Text>

        <View style={styles.listItem}>
          <Text style={styles.listIcon}>🔥</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.listLabel}>Daily Calorie Goal</Text>
            <Text style={styles.listSubtext}>{onboarding?.calorieTarget ?? 0} kcal</Text>
          </View>
          <TouchableOpacity onPress={openEditOnboarding}>
            <Text style={styles.editSmallButton}>Edit</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.listItem}>
          <Text style={styles.listIcon}>👟</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.listLabel}>Daily Step Goal</Text>
            <Text style={styles.listSubtext}>Edit in onboarding form</Text>
          </View>
          <TouchableOpacity onPress={openEditOnboarding}>
            <Text style={styles.editSmallButton}>Edit</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.listItem}>
          <Text style={styles.listIcon}>⚖️</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.listLabel}>Target Weight</Text>
            <Text style={styles.listSubtext}>{onboarding?.targetWeightKg ?? 0} kg</Text>
          </View>
          <TouchableOpacity onPress={openEditOnboarding}>
            <Text style={styles.editSmallButton}>Edit</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Notifications Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>

        <View style={styles.listItem}>
          <Text style={styles.listIcon}>🔔</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.listLabel}>Meal Reminders</Text>
            <Text style={styles.listSubtext}>Get reminded to log meals</Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: Colors.lightGray, true: Colors.primaryTint }}
            thumbColor={notificationsEnabled ? Colors.primary : Colors.gray}
          />
        </View>

        <TouchableOpacity style={styles.listItem}>
          <Text style={styles.listIcon}>⏰</Text>
          <Text style={styles.listLabel}>Reminder Times</Text>
          <Text style={styles.listValue}>08:00, 13:00, 19:00</Text>
        </TouchableOpacity>
      </View>

      {/* Security Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Security</Text>

        <TouchableOpacity style={styles.listItem} onPress={() => setShowPasswordModal(true)}>
          <Text style={styles.listIcon}>🔐</Text>
          <Text style={styles.listLabel}>Change Password</Text>
          <Text style={styles.listArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.listItem}>
          <Text style={styles.listIcon}>🔒</Text>
          <Text style={styles.listLabel}>Biometric Login</Text>
          <Text style={styles.listValue}>Not set up</Text>
        </TouchableOpacity>
      </View>

      {/* About Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>

        <TouchableOpacity style={styles.listItem} onPress={() => setActiveInfoView('about')}>
          <Text style={styles.listIcon}>ℹ️</Text>
          <Text style={styles.listLabel}>About CareSync</Text>
          <Text style={styles.listArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.listItem} onPress={() => setActiveInfoView('terms')}>
          <Text style={styles.listIcon}>📋</Text>
          <Text style={styles.listLabel}>Terms of Service</Text>
          <Text style={styles.listArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.listItem} onPress={() => setActiveInfoView('privacy')}>
          <Text style={styles.listIcon}>🔒</Text>
          <Text style={styles.listLabel}>Privacy Policy</Text>
          <Text style={styles.listArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Logout Button */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutIcon}>👋</Text>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* App Version */}
      <View style={styles.versionSection}>
        <Text style={styles.versionText}>CareSync v1.0.0</Text>
      </View>

      <Modal visible={showEditModal} transparent animationType="slide" onRequestClose={() => setShowEditModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit Onboarding Data</Text>
            <ScrollView style={styles.modalForm}>
              <TextInput style={styles.input} placeholder="Cuisine preferences (comma separated)" value={editDraft.cuisinePreferences} onChangeText={text => setEditDraft(prev => ({ ...prev, cuisinePreferences: text }))} />
              <TextInput style={styles.input} placeholder="Budget preference (low, medium, high)" value={editDraft.budgetPreference} onChangeText={text => setEditDraft(prev => ({ ...prev, budgetPreference: text }))} />
              <TextInput style={styles.input} placeholder="Country" value={editDraft.country} onChangeText={text => setEditDraft(prev => ({ ...prev, country: text }))} />
              <TextInput style={styles.input} placeholder="Calorie target" keyboardType="number-pad" value={editDraft.calorieTarget} onChangeText={text => setEditDraft(prev => ({ ...prev, calorieTarget: text }))} />
              <TextInput style={styles.input} placeholder="Daily step goal" keyboardType="number-pad" value={editDraft.dailyStepGoal} onChangeText={text => setEditDraft(prev => ({ ...prev, dailyStepGoal: text }))} />
              <TextInput style={styles.input} placeholder="Target weight (kg)" keyboardType="decimal-pad" value={editDraft.targetWeightKg} onChangeText={text => setEditDraft(prev => ({ ...prev, targetWeightKg: text }))} />
              <TextInput style={styles.input} placeholder="Current weight (kg)" keyboardType="decimal-pad" value={editDraft.weightKg} onChangeText={text => setEditDraft(prev => ({ ...prev, weightKg: text }))} />
              <TextInput style={styles.input} placeholder="Height (cm)" keyboardType="decimal-pad" value={editDraft.heightCm} onChangeText={text => setEditDraft(prev => ({ ...prev, heightCm: text }))} />
              <TextInput style={styles.input} placeholder="Systolic BP" keyboardType="number-pad" value={editDraft.bpSystolic} onChangeText={text => setEditDraft(prev => ({ ...prev, bpSystolic: text }))} />
              <TextInput style={styles.input} placeholder="Diastolic BP" keyboardType="number-pad" value={editDraft.bpDiastolic} onChangeText={text => setEditDraft(prev => ({ ...prev, bpDiastolic: text }))} />
              <TextInput style={styles.input} placeholder="Primary goal" value={editDraft.primaryGoal} onChangeText={text => setEditDraft(prev => ({ ...prev, primaryGoal: text }))} />
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowEditModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={saveOnboardingChanges} disabled={isSaving}>
                {isSaving ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.modalSaveText}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showPasswordModal} transparent animationType="fade" onRequestClose={() => setShowPasswordModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Change Password</Text>
            <TextInput secureTextEntry style={styles.input} placeholder="Current password" value={passwordDraft.currentPassword} onChangeText={text => setPasswordDraft(prev => ({ ...prev, currentPassword: text }))} />
            <TextInput secureTextEntry style={styles.input} placeholder="New password" value={passwordDraft.newPassword} onChangeText={text => setPasswordDraft(prev => ({ ...prev, newPassword: text }))} />
            <TextInput secureTextEntry style={styles.input} placeholder="Confirm new password" value={passwordDraft.confirmPassword} onChangeText={text => setPasswordDraft(prev => ({ ...prev, confirmPassword: text }))} />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowPasswordModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={handleChangePassword} disabled={changingPassword}>
                {changingPassword ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.modalSaveText}>Update</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={activeInfoView !== null} transparent animationType="slide" onRequestClose={() => setActiveInfoView(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{infoContent.title}</Text>
            <ScrollView style={styles.infoBodyWrap}>
              <Text style={styles.infoBodyText}>{infoContent.body}</Text>
            </ScrollView>
            <TouchableOpacity style={styles.modalSaveBtn} onPress={() => setActiveInfoView(null)}>
              <Text style={styles.modalSaveText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={{ height: Spacing.xl }} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.warmWhite,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.warmWhite,
    gap: Spacing.sm,
  },
  loadingText: {
    color: Colors.text.secondary,
    fontSize: Typography.sizes.bodySmall,
  },

  header: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  headerTitle: {
    fontSize: Typography.sizes.h3,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },

  section: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.sizes.bodySmall,
    fontWeight: 'bold',
    color: Colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: scale(0.5),
    marginBottom: Spacing.md,
  },

  profileCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  avatarContainer: {
    width: scale(60),
    height: scale(60),
    borderRadius: scale(30),
    backgroundColor: Colors.primaryTint,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    fontSize: Typography.sizes.h1,
  },
  profileName: {
    fontSize: Typography.sizes.body,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  profileEmail: {
    fontSize: Typography.sizes.bodySmall,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
  },
  editButton: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: Colors.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editIcon: {
    fontSize: Typography.sizes.body,
  },

  listItem: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    marginBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  listIcon: {
    fontSize: Typography.sizes.h3,
  },
  listLabel: {
    fontSize: Typography.sizes.body,
    fontWeight: '500',
    color: Colors.text.primary,
    flex: 1,
  },
  listSubtext: {
    fontSize: Typography.sizes.caption,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
  },
  listValue: {
    fontSize: Typography.sizes.bodySmall,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  listArrow: {
    fontSize: Typography.sizes.h4,
    color: Colors.gray,
  },
  editSmallButton: {
    fontSize: Typography.sizes.bodySmall,
    color: Colors.primary,
    fontWeight: '600',
  },

  logoutButton: {
    backgroundColor: Colors.dangerTint,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: Spacing.md,
  },
  logoutIcon: {
    fontSize: Typography.sizes.h3,
  },
  logoutText: {
    fontSize: Typography.sizes.body,
    fontWeight: 'bold',
    color: Colors.danger,
  },

  versionSection: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  versionText: {
    fontSize: Typography.sizes.caption,
    color: Colors.text.tertiary,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  modalCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    maxHeight: '85%',
  },
  modalTitle: {
    fontSize: Typography.sizes.h4,
    color: Colors.text.primary,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  modalForm: {
    maxHeight: scale(380),
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.sm,
    color: Colors.text.primary,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  modalCancelBtn: {
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  modalCancelText: {
    color: Colors.text.secondary,
    fontWeight: '600',
  },
  modalSaveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSaveText: {
    color: Colors.white,
    fontWeight: '700',
  },
  infoBodyWrap: {
    maxHeight: scale(320),
    marginBottom: Spacing.md,
  },
  infoBodyText: {
    fontSize: Typography.sizes.bodySmall,
    color: Colors.text.secondary,
    lineHeight: moderateScale(22, 0.4),
  },
})
