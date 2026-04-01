import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native'
import { Colors, Spacing, BorderRadius, Typography, moderateScale, scale } from '../../constants/theme'
import { useAuth } from '../../hooks'

export function SettingsScreen() {
  const { user, logout } = useAuth()
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)

  const handleLogout = () => {
    logout()
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
          <TouchableOpacity style={styles.editButton}>
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
          <Text style={styles.listArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.listItem}>
          <Text style={styles.listIcon}>💰</Text>
          <Text style={styles.listLabel}>Budget Preference</Text>
          <Text style={styles.listValue}>Medium</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.listItem}>
          <Text style={styles.listIcon}>🌍</Text>
          <Text style={styles.listLabel}>Country</Text>
          <Text style={styles.listValue}>Ghana</Text>
        </TouchableOpacity>
      </View>

      {/* Health Targets Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Health Targets</Text>

        <View style={styles.listItem}>
          <Text style={styles.listIcon}>🔥</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.listLabel}>Daily Calorie Goal</Text>
            <Text style={styles.listSubtext}>1,650 kcal</Text>
          </View>
          <TouchableOpacity>
            <Text style={styles.editSmallButton}>Edit</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.listItem}>
          <Text style={styles.listIcon}>👟</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.listLabel}>Daily Step Goal</Text>
            <Text style={styles.listSubtext}>10,000 steps</Text>
          </View>
          <TouchableOpacity>
            <Text style={styles.editSmallButton}>Edit</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.listItem}>
          <Text style={styles.listIcon}>⚖️</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.listLabel}>Target Weight</Text>
            <Text style={styles.listSubtext}>70 kg</Text>
          </View>
          <TouchableOpacity>
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

        <TouchableOpacity style={styles.listItem}>
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

        <TouchableOpacity style={styles.listItem}>
          <Text style={styles.listIcon}>ℹ️</Text>
          <Text style={styles.listLabel}>About DiabetesCare</Text>
          <Text style={styles.listArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.listItem}>
          <Text style={styles.listIcon}>📋</Text>
          <Text style={styles.listLabel}>Terms of Service</Text>
          <Text style={styles.listArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.listItem}>
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
        <Text style={styles.versionText}>DiabetesCare v1.0.0</Text>
      </View>

      <View style={{ height: Spacing.xl }} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.warmWhite,
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
})
