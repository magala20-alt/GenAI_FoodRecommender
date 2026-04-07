import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { Colors, Spacing, BorderRadius, Typography, moderateScale, scale, verticalScale } from '../../constants/theme'
import { useAuth, useMealPlan } from '../../hooks'
import { Button } from '../../components/atoms'
import { MealCard } from '../../components/molecules'
import { formatDate } from '../../utils'
import { mealLoggerService, MealLogItem, VitalLogItem } from '../../services/mealLoggerService'
import { interventionService, InterventionMessage } from '../../services/interventionService'
import { onboardingService } from '../../services/onboardingService'
import { appointmentService, PatientAppointment } from '../../services/appointmentService'
import { Meal } from '../../types'

const defaultRegeneratePreferences = {
  cuisines: ['Mediterranean', 'American'],
  budget: 'medium' as const,
  allergies: [] as string[],
  restrictions: [] as string[],
  diabetesFriendly: true,
}

export function DashboardScreen() {
  const { user } = useAuth()
  const { todaysPlan, isLoading, error, fetchTodaysPlan, regeneratePlan } = useMealPlan()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [loggedMeals, setLoggedMeals] = useState<MealLogItem[]>([])
  const [vitalsHistory, setVitalsHistory] = useState<VitalLogItem[]>([])
  const [latestIntervention, setLatestIntervention] = useState<InterventionMessage | null>(null)
  const [onboardingCompletedAt, setOnboardingCompletedAt] = useState<string | null>(null)
  const [nextAppointment, setNextAppointment] = useState<PatientAppointment | null>(null)
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false)
  const [rescheduleReason, setRescheduleReason] = useState('')
  const [isSubmittingReschedule, setIsSubmittingReschedule] = useState(false)
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null)
  const [isMealModalOpen, setIsMealModalOpen] = useState(false)
  const [isLoggingMeal, setIsLoggingMeal] = useState(false)
  const insets = useSafeAreaInsets()

  useEffect(() => {
    void (async () => {
      await fetchTodaysPlan()
      await loadPatientLogs()
      await loadNextAppointment()
    })()
  }, [])

  const loadPatientLogs = async () => {
    if (user?.userType !== 'patient' || user?.role === 'admin') {
      setLoggedMeals([])
      setVitalsHistory([])
      return
    }

    try {
      const [meals, vitals] = await Promise.all([
        mealLoggerService.getHistory(),
        mealLoggerService.getVitalsHistory(),
      ])
      setLoggedMeals(meals)
      setVitalsHistory(vitals)
    } catch {
      setLoggedMeals([])
      setVitalsHistory([])
    }
  }

  const loadLatestIntervention = async () => {
    if (!user?.id || user.userType !== 'patient') {
      setLatestIntervention(null)
      return
    }

    try {
      const message = await interventionService.getLatestForPatient(user.id)
      setLatestIntervention(message)
    } catch {
      setLatestIntervention(null)
    }
  }

  const loadOnboardingStatus = async () => {
    if (!user?.id || user.userType !== 'patient') {
      setOnboardingCompletedAt(null)
      return
    }

    try {
      const status = await onboardingService.getStatus()
      setOnboardingCompletedAt(status.completedAt)
    } catch {
      setOnboardingCompletedAt(null)
    }
  }

  const loadNextAppointment = async () => {
    if (!user?.id || user.userType !== 'patient') {
      setNextAppointment(null)
      return
    }

    try {
      const appointment = await appointmentService.getNextAppointment()
      setNextAppointment(appointment)
    } catch {
      setNextAppointment(null)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await Promise.all([fetchTodaysPlan(), loadPatientLogs(), loadLatestIntervention(), loadOnboardingStatus(), loadNextAppointment()])
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleRegenerate = async () => {
    setIsRegenerating(true)
    try {
      await regeneratePlan(defaultRegeneratePreferences)
      await loadPatientLogs()
    } finally {
      setIsRegenerating(false)
    }
  }

  const todayDateKey = new Date().toISOString().slice(0, 10)
  const todaysLoggedMeals = loggedMeals.filter(item => {
    const consumedAt = item.consumedAt || ''
    return consumedAt.slice(0, 10) === todayDateKey
  })

  const todaysCalories = todaysLoggedMeals.reduce((sum, meal) => sum + (meal.calories || 0), 0)
  const mealsCount = todaysLoggedMeals.length
  const plannedCalories = todaysPlan?.meals.reduce((sum, meal) => sum + (meal.calories || 0), 0) || 0

  const latestVitals = vitalsHistory.length > 0
    ? [...vitalsHistory].sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0]
    : null
  const systolicBp = Math.round(latestVitals?.systolicBp || 0)
  const diastolicBp = Math.round(latestVitals?.diastolicBp || 0)

  const streakDays = (() => {
    if (!loggedMeals.length) return 0
    const dateSet = new Set(loggedMeals.map(item => (item.consumedAt || '').slice(0, 10)).filter(Boolean))
    let streak = 0
    const current = new Date()
    while (true) {
      const key = current.toISOString().slice(0, 10)
      if (!dateSet.has(key)) break
      streak += 1
      current.setDate(current.getDate() - 1)
    }
    return streak
  })()

  const onboardingAgeDays = (() => {
    if (!onboardingCompletedAt) return null
    const completedAt = new Date(onboardingCompletedAt)
    const diffMs = Date.now() - completedAt.getTime()
    if (Number.isNaN(completedAt.getTime())) return null
    return Math.max(0, Math.floor(diffMs / 86400000))
  })()

  const isLongAfterOnboarding = onboardingAgeDays !== null && onboardingAgeDays >= 7

  const formatMessageAge = (isoDate: string): string => {
    const createdAt = new Date(isoDate)
    const diffMs = Date.now() - createdAt.getTime()
    const diffMin = Math.max(0, Math.floor(diffMs / 60000))

    if (diffMin < 1) return 'Just now'
    if (diffMin < 60) return `${diffMin}m ago`

    const diffHours = Math.floor(diffMin / 60)
    if (diffHours < 24) return `${diffHours}h ago`

    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}d ago`
  }

  const isAdminAccount = user?.role === 'admin'
  const doctorTitle = latestIntervention
    ? `${latestIntervention.clinicianName || 'Your doctor'} · ${formatMessageAge(latestIntervention.createdAt)}`
    : 'Doctor note'
  const doctorMessage = isAdminAccount
    ? 'no doctor assigned.'
    : (latestIntervention?.message || 'no message yet from your doctor.')

  const encouragementText = (() => {
    if (streakDays >= 5) {
      return 'You’re on a solid run. Keep the streak alive and log the rest of today when you can.'
    }

    if (isLongAfterOnboarding) {
      return 'You’ve had time to settle in, so let’s wake that streak up. One meal logged today and you’re back in motion.'
    }

    return 'No stress yet. Start with one logged meal and let the streak grow from there.'
  })()

  const appointmentDateText = nextAppointment
    ? new Date(nextAppointment.scheduledAt).toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
    : 'No appointment scheduled'

  const appointmentTimeText = nextAppointment
    ? `${new Date(nextAppointment.scheduledAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })} · ${nextAppointment.title}`
    : 'Your clinician has not set a visit yet.'

  const appointmentStatusText = (() => {
    if (!nextAppointment?.rescheduleStatus) return null
    if (nextAppointment.rescheduleStatus === 'pending') return 'Waiting for approval'
    if (nextAppointment.rescheduleStatus === 'approved') return 'Reschedule approved'
    if (nextAppointment.rescheduleStatus === 'rejected') return 'Reschedule declined'
    return null
  })()

  const handleSubmitReschedule = async () => {
    if (!rescheduleReason.trim()) return

    try {
      setIsSubmittingReschedule(true)
      const updatedAppointment = await appointmentService.requestReschedule(rescheduleReason.trim())
      setNextAppointment(updatedAppointment)
      setIsRescheduleModalOpen(false)
      setRescheduleReason('')
    } finally {
      setIsSubmittingReschedule(false)
    }
  }

  const handleLogMeal = async () => {
    if (!selectedMeal) return

    try {
      setIsLoggingMeal(true)
      await mealLoggerService.saveMealLog({
        mealName: selectedMeal.name,
        calories: selectedMeal.calories,
        mealType: selectedMeal.type as 'breakfast' | 'lunch' | 'dinner' | 'snack',
        source: 'plan',
        confidence: (selectedMeal.nutritionScore || 80) / 100,
        consumedAt: new Date().toISOString(),
      })
      setIsMealModalOpen(false)
      setSelectedMeal(null)
      await Promise.all([fetchTodaysPlan(), loadPatientLogs()])
    } catch (error) {
      console.error('Failed to log meal:', error)
    } finally {
      setIsLoggingMeal(false)
    }
  }

  const dailyStats = [
    { label: 'kcal', value: `${todaysCalories}`, color: Colors.primary },
    { label: 'meals', value: `${mealsCount}`, color: Colors.text.primary },
    { label: 'steps', value: '0', color: Colors.text.primary },
    { label: 'BP', value: `${systolicBp}/${diastolicBp}`, color: Colors.success },
  ]

  const plannedMealCount = todaysPlan?.meals.length || 0

  const mealsByType = todaysPlan?.meals.reduce(
    (acc, meal) => {
      const type = meal.type || 'breakfast'
      if (!acc[type]) acc[type] = []
      acc[type].push(meal)
      return acc
    },
    {} as Record<string, any[]>,
  ) || {}

  useEffect(() => {
    void loadLatestIntervention()
    void loadOnboardingStatus()
    void loadNextAppointment()
  }, [user?.id, user?.userType])

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
      >
        <View style={[styles.topCard, { paddingTop: Math.max(insets.top * 0.15, Spacing.sm) }]}>
          <View style={styles.headerTopRow}>
            <Text style={styles.greeting}>Good morning 👋</Text>
            <Text style={styles.fireIcon}>🔥</Text>
          </View>

          <View style={styles.headerMainRow}>
            <View>
              <Text style={styles.name}>{user?.firstName ?? 'Sarah'}</Text>
              <Text style={styles.date}>{formatDate(new Date())} · {todaysCalories.toLocaleString()} / {plannedCalories.toLocaleString()} kcal</Text>
            </View>
            <View style={styles.streakWrap}>
              <Text style={styles.streakText}>{streakDays}-day streak</Text>
            </View>
          </View>

          <View style={styles.statsContainer}>
            {dailyStats.map((stat, idx) => (
              <View key={idx} style={styles.statCard}>
                <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>

          <View style={styles.topDivider} />

          <View style={styles.doctorNoteBanner}>
            <Text style={styles.doctorIcon}>🧑‍⚕️</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.doctorTitle}>{doctorTitle}</Text>
              <Text style={styles.doctorMessage}>{doctorMessage}</Text>
            </View>
          </View>
        </View>

      {/* Error Banner */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={handleRefresh}>
            <Text style={styles.retryLink}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Today's Meal Plan */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's Meal Plan</Text>
          <TouchableOpacity onPress={handleRegenerate} disabled={isRegenerating}>
            <Text style={styles.regenerateButton}>
              {isRegenerating ? '⟳ Generating...' : '⟳ Regenerate'}
            </Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.skeleton}>
            <View style={styles.skeletonBar} />
            <View style={styles.skeletonBar} />
          </View>
        ) : plannedMealCount === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🍽️</Text>
            <Text style={styles.emptyText}>No meals planned yet</Text>
            <Button
              label="Generate Meal Plan"
              onPress={handleRegenerate}
              size="small"
            />
          </View>
        ) : (
          ['breakfast', 'lunch', 'dinner', 'snack'].map(mealType => {
            const meals = mealsByType[mealType] || []
            if (meals.length === 0) return null

            return (
              <View key={mealType}>
                <Text style={styles.mealTypeHeader}>{mealType.charAt(0).toUpperCase() + mealType.slice(1)}</Text>
                {meals.map((meal, idx) => (
                  <MealCard
                    key={idx}
                    meal={meal}
                    onPress={() => {
                      setSelectedMeal(meal)
                      setIsMealModalOpen(true)
                    }}
                  />
                ))}
              </View>
            )
          })
        )}
      </View>

      {/* Encouragement Message */}
      <View style={styles.encouragementCard}>
        <Text style={styles.encouragementIcon}>🌱</Text>
        <Text style={styles.encouragementText}>
          {encouragementText}
        </Text>
      </View>

      {/* Upcoming Appointment (if any) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Upcoming Appointment</Text>
        <View style={styles.appointmentCard}>
          <Text style={styles.appointmentDate}>📅 {appointmentDateText}</Text>
          <Text style={styles.appointmentTime}>🕐 {appointmentTimeText}</Text>
          {appointmentStatusText && (
            <View style={styles.appointmentStatusPill}>
              <Text style={styles.appointmentStatusText}>{appointmentStatusText}</Text>
            </View>
          )}
          {nextAppointment ? (
            <Button
              label={nextAppointment.rescheduleStatus === 'pending' ? 'Waiting for approval' : 'Reschedule'}
              onPress={() => setIsRescheduleModalOpen(true)}
              size="small"
              variant="outline"
              disabled={nextAppointment.rescheduleStatus === 'pending'}
              style={{ marginTop: Spacing.md }}
            />
          ) : null}
        </View>
      </View>

      <Modal
        visible={isRescheduleModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsRescheduleModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Why do you need to reschedule?</Text>
            <Text style={styles.modalSubtitle}>
              Send a quick note to your doctor. It will show up as an alert for approval.
            </Text>
            <TextInput
              value={rescheduleReason}
              onChangeText={setRescheduleReason}
              placeholder="Type your reason here"
              multiline
              style={styles.modalInput}
            />
            <View style={styles.modalActions}>
              <Button
                label="Cancel"
                onPress={() => setIsRescheduleModalOpen(false)}
                size="small"
                variant="outline"
                style={{ flex: 1 }}
              />
              <Button
                label={isSubmittingReschedule ? 'Sending...' : 'Send request'}
                onPress={handleSubmitReschedule}
                size="small"
                disabled={isSubmittingReschedule || !rescheduleReason.trim()}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Meal Detail Modal */}
      <Modal
        visible={isMealModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setIsMealModalOpen(false)
          setSelectedMeal(null)
        }}
      >
        <View style={styles.mealDetailBackdrop}>
          <View style={styles.mealDetailSheet}>
            <View style={styles.mealDetailHeader}>
              <Text style={styles.mealDetailHeaderTitle}>Meal details</Text>
              <TouchableOpacity
                onPress={() => {
                  setIsMealModalOpen(false)
                  setSelectedMeal(null)
                }}
              >
                <Text style={styles.mealDetailCloseButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={styles.mealDetailContent}
              showsVerticalScrollIndicator={false}
            >
              {selectedMeal && (
                <>
                  {/* Meal Header */}
                  <View style={styles.mealDetailCard}>
                    <View style={styles.mealDetailHeader2}>
                      <View style={{ flex: 1, paddingRight: Spacing.md }}>
                        <Text style={styles.mealDetailName}>{selectedMeal.name}</Text>
                        <Text style={styles.mealDetailMeta}>
                          {selectedMeal.cuisine} • {selectedMeal.type}
                        </Text>
                      </View>
                      <Text style={styles.mealDetailCalories}>{selectedMeal.calories}</Text>
                    </View>

                    {/* Nutrition Grid */}
                    <View style={styles.nutritionGrid}>
                      <View style={[styles.nutritionCell, styles.nutritionCellFirst]}>
                        <Text style={styles.nutritionValue}>
                          {selectedMeal.carbs || 'N/A'}
                        </Text>
                        <Text style={styles.nutritionLabel}>Carbs (g)</Text>
                      </View>
                      <View style={styles.nutritionCell}>
                        <Text style={styles.nutritionValue}>
                          {selectedMeal.protein || 'N/A'}
                        </Text>
                        <Text style={styles.nutritionLabel}>Protein (g)</Text>
                      </View>
                      <View style={styles.nutritionCell}>
                        <Text style={styles.nutritionValue}>
                          {selectedMeal.fat || 'N/A'}
                        </Text>
                        <Text style={styles.nutritionLabel}>Fat (g)</Text>
                      </View>
                    </View>
                  </View>

                  {/* Recipe Instructions */}
                  {selectedMeal.instructions && selectedMeal.instructions.length > 0 && (
                    <View style={styles.mealDetailCard}>
                      <Text style={styles.mealDetailSectionTitle}>Recipe</Text>
                      {Array.isArray(selectedMeal.instructions) ? (
                        selectedMeal.instructions.map((instruction, idx) => (
                          <Text
                            key={idx}
                            style={[
                              styles.mealDetailInstructions,
                              idx > 0 && { marginTop: Spacing.sm },
                            ]}
                          >
                            {idx + 1}. {instruction}
                          </Text>
                        ))
                      ) : (
                        <Text style={styles.mealDetailInstructions}>
                          {selectedMeal.instructions}
                        </Text>
                      )}
                    </View>
                  )}

                  {/* Preference-Based Explanation */}
                  <View style={styles.mealDetailCard}>
                    <Text style={styles.mealDetailSectionTitle}>Why This Meal?</Text>
                    <View style={styles.preferenceBox}>
                      <Text style={styles.preferenceText}>
                        ✓ Fits your{' '}
                        <Text style={styles.preferenceBold}>
                          {selectedMeal.budget || 'medium'}
                        </Text>{' '}
                        calorie budget
                      </Text>
                      {selectedMeal.cuisine && (
                        <Text style={styles.preferenceText}>
                          ✓ Matches your{' '}
                          <Text style={styles.preferenceBold}>{selectedMeal.cuisine}</Text>{' '}
                          cuisine preference
                        </Text>
                      )}
                      {selectedMeal.nutritionScore && (
                        <Text style={styles.preferenceText}>
                          ✓ Nutrition score: <Text style={styles.preferenceBold}>
                            {selectedMeal.nutritionScore.toFixed(0)}/100
                          </Text>
                        </Text>
                      )}
                    </View>
                  </View>
                </>
              )}
            </ScrollView>

            {/* Log Meal Button */}
            <View style={styles.mealDetailFooter}>
              <Button
                label={isLoggingMeal ? 'Logging...' : 'Log Meal'}
                onPress={handleLogMeal}
                disabled={isLoggingMeal}
                style={{ flex: 1 }}
                size="small"
              />
            </View>
          </View>
        </View>
      </Modal>

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.warmWhite,
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: Colors.warmWhite,
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
  },

  topCard: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderBottomLeftRadius: BorderRadius.xxl,
    borderBottomRightRadius: BorderRadius.xxl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  headerMainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  greeting: {
    fontSize: Typography.sizes.body,
    fontWeight: '500',
    color: Colors.text.secondary,
  },
  fireIcon: {
    fontSize: Typography.sizes.h3,
  },
  name: {
    fontSize: Typography.sizes.h2,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  date: {
    fontSize: Typography.sizes.body,
    color: Colors.text.secondary,
  },
  streakWrap: {
    alignItems: 'flex-end',
    paddingTop: Spacing.sm,
  },
  streakText: {
    fontSize: Typography.sizes.body,
    fontWeight: '700',
    color: Colors.secondary,
  },

  statsContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#E6E9EE',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D7E2',
  },
  statValue: {
    fontSize: Typography.sizes.h3,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  statLabel: {
    fontSize: Typography.sizes.caption,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  topDivider: {
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    marginVertical: Spacing.lg,
  },

  doctorNoteBanner: {
    backgroundColor: Colors.primary,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  doctorIcon: {
    fontSize: Typography.sizes.h3,
    marginRight: Spacing.md,
  },
  doctorTitle: {
    fontSize: Typography.sizes.bodySmall,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: Spacing.xs,
  },
  doctorMessage: {
    fontSize: Typography.sizes.body,
    color: 'rgba(255, 255, 255, 0.95)',
    lineHeight: verticalScale(22),
  },
  errorBanner: {
    backgroundColor: Colors.dangerTint,
    marginHorizontal: Spacing.lg,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderLeftWidth: 4,
    borderLeftColor: Colors.danger,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: {
    fontSize: Typography.sizes.body,
    color: Colors.danger,
    flex: 1,
  },
  retryLink: {
    fontSize: Typography.sizes.bodySmall,
    color: Colors.danger,
    fontWeight: 'bold',
  },

  section: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.sizes.h4,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  regenerateButton: {
    fontSize: Typography.sizes.bodySmall,
    color: Colors.primary,
    fontWeight: '600',
  },

  mealTypeHeader: {
    fontSize: Typography.sizes.bodySmall,
    fontWeight: '600',
    color: Colors.text.secondary,
    textTransform: 'capitalize',
    marginBottom: Spacing.md,
  },

  skeleton: {
    gap: Spacing.md,
  },
  skeletonBar: {
    height: verticalScale(100),
    backgroundColor: Colors.light,
    borderRadius: BorderRadius.lg,
  },

  emptyState: {
    backgroundColor: Colors.light,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: moderateScale(48, 0.45),
    marginBottom: Spacing.md,
  },
  emptyText: {
    fontSize: Typography.sizes.body,
    color: Colors.text.secondary,
    marginBottom: Spacing.lg,
  },

  encouragementCard: {
    backgroundColor: Colors.primaryTint,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  encouragementIcon: {
    fontSize: Typography.sizes.h3,
    marginRight: Spacing.md,
  },
  encouragementText: {
    fontSize: Typography.sizes.body,
    color: Colors.text.primary,
    flex: 1,
    lineHeight: verticalScale(22),
  },

  appointmentCard: {
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  appointmentDate: {
    fontSize: Typography.sizes.body,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  appointmentTime: {
    fontSize: Typography.sizes.body,
    color: Colors.text.secondary,
    marginBottom: Spacing.md,
  },
  appointmentStatusPill: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primaryTint,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.circular,
    marginBottom: Spacing.sm,
  },
  appointmentStatusText: {
    fontSize: Typography.sizes.caption,
    color: Colors.primary,
    fontWeight: '700',
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  modalCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
  },
  modalTitle: {
    fontSize: Typography.sizes.h4,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  modalSubtitle: {
    fontSize: Typography.sizes.body,
    color: Colors.text.secondary,
    marginBottom: Spacing.md,
    lineHeight: verticalScale(22),
  },
  modalInput: {
    minHeight: verticalScale(110),
    borderWidth: 1,
    borderColor: Colors.divider,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: Typography.sizes.body,
    color: Colors.text.primary,
    textAlignVertical: 'top',
    marginBottom: Spacing.md,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },

  mealDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  mealDetailHeaderTitle: {
    fontSize: Typography.sizes.bodySmall,
    fontWeight: '700',
    color: Colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  mealDetailCloseButton: {
    fontSize: Typography.sizes.h3,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  mealDetailBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
  },
  mealDetailSheet: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    maxHeight: '88%',
    overflow: 'hidden',
  },
  mealDetailContent: {
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  mealDetailCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  mealDetailHeader2: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  mealDetailName: {
    fontSize: Typography.sizes.h3,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  mealDetailMeta: {
    fontSize: Typography.sizes.body,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
  },
  mealDetailCalories: {
    fontSize: Typography.sizes.h3,
    fontWeight: '700',
    color: Colors.primary,
  },
  nutritionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: -Spacing.xs,
  },
  nutritionCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderLeftWidth: 1,
    borderLeftColor: Colors.divider,
  },
  nutritionCellFirst: {
    borderLeftWidth: 0,
  },
  nutritionValue: {
    fontSize: Typography.sizes.h4,
    fontWeight: '700',
    color: Colors.primary,
  },
  nutritionLabel: {
    fontSize: Typography.sizes.caption,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
  },
  mealDetailSectionTitle: {
    fontSize: Typography.sizes.h4,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  mealDetailInstructions: {
    fontSize: Typography.sizes.body,
    color: Colors.text.primary,
    lineHeight: verticalScale(22),
  },
  preferenceBox: {
    backgroundColor: Colors.primaryTint,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  preferenceText: {
    fontSize: Typography.sizes.body,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
    lineHeight: verticalScale(20),
  },
  preferenceBold: {
    fontWeight: '700',
    color: Colors.primary,
  },
  mealDetailFooter: {
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
})

