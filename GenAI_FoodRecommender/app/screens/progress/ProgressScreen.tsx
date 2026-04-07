import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { Colors, Spacing, BorderRadius, Typography, moderateScale, scale, verticalScale } from '../../constants/theme'
import { useAuth } from '../../hooks'
import { mealLoggerService, MealLogItem, VitalLogItem } from '../../services/mealLoggerService'
import { onboardingService, OnboardingDetails } from '../../services/onboardingService'

interface ProgressData {
  weight: number
  bmi: number
  avgBP: string
  avgGlucose: number
}

interface DailyAdherence {
  date: string
  consumed: number
  target: number
  pct: number
}

interface ChartPoint {
  label: string
  value: number
}

interface DualChartPoint {
  label: string
  primaryValue: number
  secondaryValue: number
}

type DeltaTone = 'positive' | 'negative' | 'neutral'

export function ProgressScreen() {
  const { user } = useAuth()
  const [dateRange, setDateRange] = useState<'7d' | '14d' | '30d'>('14d')
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [mealLogs, setMealLogs] = useState<MealLogItem[]>([])
  const [vitalsLogs, setVitalsLogs] = useState<VitalLogItem[]>([])
  const [onboardingDetails, setOnboardingDetails] = useState<OnboardingDetails | null>(null)

  const loadProgressData = useCallback(async () => {
    try {
      setIsLoading(true)
      setLoadError(null)

      if (user?.userType !== 'patient' || user?.role === 'admin') {
        setMealLogs([])
        setVitalsLogs([])
        setOnboardingDetails(null)
        return
      }

      const [meals, vitals, details] = await Promise.all([
        mealLoggerService.getHistory(),
        mealLoggerService.getVitalsHistory(),
        onboardingService.getDetails().catch(() => null),
      ])

      setMealLogs(meals)
      setVitalsLogs(vitals)
      setOnboardingDetails(details)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load progress data'
      setLoadError(message)
    } finally {
      setIsLoading(false)
    }
  }, [user?.role, user?.userType])

  useEffect(() => {
    void loadProgressData()
  }, [loadProgressData])

  useFocusEffect(
    useCallback(() => {
      void loadProgressData()
      return undefined
    }, [loadProgressData]),
  )

  const rangeDays = dateRange === '7d' ? 7 : dateRange === '14d' ? 14 : 30

  const cutoff = useMemo(() => {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    date.setDate(date.getDate() - (rangeDays - 1))
    return date
  }, [rangeDays])

  const filteredMeals = useMemo(
    () => mealLogs.filter(item => new Date(item.consumedAt) >= cutoff),
    [mealLogs, cutoff],
  )

  const filteredVitals = useMemo(
    () => vitalsLogs.filter(item => new Date(item.timestamp) >= cutoff),
    [vitalsLogs, cutoff],
  )

  const sortedFilteredVitals = useMemo(
    () => [...filteredVitals].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()),
    [filteredVitals],
  )

  const latestVital = useMemo(() => {
    if (!vitalsLogs.length) return null
    return [...vitalsLogs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]
  }, [vitalsLogs])

  const progressData: ProgressData = useMemo(() => {
    const weight = onboardingDetails?.weightKg ?? 0

    const bmiFromVitals = latestVital?.bmi ?? null
    const bmiFromOnboarding = (() => {
      if (!onboardingDetails?.weightKg || !onboardingDetails?.heightCm) return null
      const meters = onboardingDetails.heightCm / 100
      if (!meters) return null
      return onboardingDetails.weightKg / (meters * meters)
    })()

    const bpRows = filteredVitals.filter(v => v.systolicBp != null && v.diastolicBp != null)
    const avgSys = bpRows.length > 0
      ? Math.round(bpRows.reduce((sum, row) => sum + (row.systolicBp || 0), 0) / bpRows.length)
      : 0
    const avgDia = bpRows.length > 0
      ? Math.round(bpRows.reduce((sum, row) => sum + (row.diastolicBp || 0), 0) / bpRows.length)
      : 0

    const glucoseRows = filteredVitals.filter(v => v.glucose != null)
    const avgGlucose = glucoseRows.length > 0
      ? Number((glucoseRows.reduce((sum, row) => sum + (row.glucose || 0), 0) / glucoseRows.length).toFixed(1))
      : 0

    return {
      weight: Number(weight.toFixed(1)),
      bmi: Number(((bmiFromVitals ?? bmiFromOnboarding ?? 0)).toFixed(1)),
      avgBP: `${avgSys}/${avgDia}`,
      avgGlucose,
    }
  }, [filteredVitals, latestVital, onboardingDetails])

  const deltas = useMemo(() => {
    const glucoseRows = filteredVitals.filter(v => v.glucose != null)
    const firstGlucose = glucoseRows[glucoseRows.length - 1]?.glucose
    const lastGlucose = glucoseRows[0]?.glucose
    const glucoseDelta = firstGlucose != null && lastGlucose != null ? Number((lastGlucose - firstGlucose).toFixed(1)) : 0

    return {
      weight: 0,
      glucose: glucoseDelta,
    }
  }, [filteredVitals])

  const calorieTarget = onboardingDetails?.calorieTarget ?? 1650

  const dailyAdherence = useMemo(() => {
    const totals = new Map<string, number>()
    filteredMeals.forEach(item => {
      const key = item.consumedAt.slice(0, 10)
      totals.set(key, (totals.get(key) || 0) + (item.calories || 0))
    })

    return Array.from(totals.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, 3)
      .map(([date, consumed]): DailyAdherence => ({
        date,
        consumed,
        target: calorieTarget,
        pct: Math.max(0, Math.min(100, Math.round((consumed / calorieTarget) * 100))),
      }))
  }, [filteredMeals, calorieTarget])

  const streakDays = useMemo(() => {
    if (!mealLogs.length) return 0
    const dateSet = new Set(mealLogs.map(item => item.consumedAt.slice(0, 10)))
    const current = new Date()
    let streak = 0
    while (true) {
      const key = current.toISOString().slice(0, 10)
      if (!dateSet.has(key)) break
      streak += 1
      current.setDate(current.getDate() - 1)
    }
    return streak
  }, [mealLogs])

  const adherenceAvg = useMemo(() => {
    if (!dailyAdherence.length) return 0
    return Math.round(dailyAdherence.reduce((sum, row) => sum + row.pct, 0) / dailyAdherence.length)
  }, [dailyAdherence])

  const formatShortDate = (iso: string) => {
    const date = new Date(iso)
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  }

  const weightSeries = useMemo<ChartPoint[]>(() => {
    const heightM = onboardingDetails?.heightCm ? onboardingDetails.heightCm / 100 : null
    const heightForCalc = heightM ?? 0
    const points = sortedFilteredVitals
      .filter(v => v.bmi != null && heightM != null && heightM > 0)
      .map(v => ({
        label: formatShortDate(v.timestamp),
        value: Number(((v.bmi || 0) * heightForCalc * heightForCalc).toFixed(1)),
      }))

    if (points.length > 0) {
      return points.slice(-7)
    }

    if (onboardingDetails?.weightKg) {
      return [{ label: 'Today', value: Number(onboardingDetails.weightKg.toFixed(1)) }]
    }

    return []
  }, [onboardingDetails?.heightCm, onboardingDetails?.weightKg, sortedFilteredVitals])

  const bloodPressureSeries = useMemo<DualChartPoint[]>(() => {
    return sortedFilteredVitals
      .filter(v => v.systolicBp != null && v.diastolicBp != null)
      .map(v => ({
        label: formatShortDate(v.timestamp),
        primaryValue: Math.round(v.systolicBp || 0),
        secondaryValue: Math.round(v.diastolicBp || 0),
      }))
      .slice(-7)
  }, [sortedFilteredVitals])

  const glucoseSeries = useMemo<ChartPoint[]>(() => {
    return sortedFilteredVitals
      .filter(v => v.glucose != null)
      .map(v => ({
        label: formatShortDate(v.timestamp),
        value: Number((v.glucose || 0).toFixed(1)),
      }))
      .slice(-7)
  }, [sortedFilteredVitals])

  if (isLoading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator color={Colors.primary} />
        <Text style={styles.loadingText}>Loading progress...</Text>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Progress</Text>
      </View>

      {/* Date Range Toggle */}
      <View style={styles.dateRangeContainer}>
        {(['7d', '14d', '30d'] as const).map(range => (
          <TouchableOpacity
            key={range}
            style={[
              styles.dateRangeButton,
              dateRange === range && styles.dateRangeButtonActive,
            ]}
            onPress={() => setDateRange(range)}
          >
            <Text
              style={[
                styles.dateRangeText,
                dateRange === range && styles.dateRangeTextActive,
              ]}
            >
              {range === '7d' ? '7d' : range === '14d' ? '14d' : '30d'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Summary Cards */}
      <View style={styles.summarySection}>
        {loadError ? <Text style={styles.errorText}>{loadError}</Text> : null}
        <View style={styles.summaryRow}>
          <SummaryCard
            icon="⚖️"
            label="Weight"
            value={`${progressData.weight}`}
            unit="kg"
            delta={deltas.weight === 0 ? 'No change' : `${deltas.weight.toFixed(1)} kg`}
            deltaType={deltas.weight <= 0 ? 'positive' : 'negative'}
          />
          <SummaryCard
            icon="📊"
            label="BMI"
            value={`${progressData.bmi}`}
            unit=""
            delta={progressData.bmi === 0 ? 'No data' : progressData.bmi < 25 ? 'Healthy range' : 'Above target'}
            deltaType="neutral"
          />
        </View>
        <View style={styles.summaryRow}>
          <SummaryCard
            icon="💓"
            label="Avg BP"
            value={progressData.avgBP}
            unit=""
            delta={progressData.avgBP === '0/0' ? 'No data' : 'Tracked'}
            deltaType="positive"
          />
          <SummaryCard
            icon="🩺"
            label="Avg Glucose"
            value={`${progressData.avgGlucose}`}
            unit="mg/dL"
            delta={deltas.glucose === 0 ? 'No change' : `${deltas.glucose.toFixed(1)} mg/dL`}
            deltaType={deltas.glucose <= 0 ? 'positive' : 'negative'}
          />
        </View>
      </View>

      {/* Weight Chart Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Weight Trend</Text>
        <SimpleBarChart
          points={weightSeries}
          unit="kg"
          emptyMessage="No weight trend data available for this range."
          barColor={Colors.primary}
        />
        <Text style={styles.chartCaption}>Showing recent weight entries from your recorded vitals.</Text>
      </View>

      {/* Blood Pressure Chart */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Blood Pressure</Text>
        <DualBarChart
          points={bloodPressureSeries}
          primaryUnit="mmHg"
          primaryLabel="Systolic"
          secondaryLabel="Diastolic"
          emptyMessage="No blood pressure logs available for this range."
        />
      </View>

      {/* Glucose Chart */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Glucose Readings</Text>
        <SimpleBarChart
          points={glucoseSeries}
          unit="mg/dL"
          emptyMessage="No glucose logs available for this range."
          barColor={Colors.secondary}
        />
      </View>

      {/* Calorie Adherence */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Calorie Adherence</Text>
        {dailyAdherence.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No meal logs yet for this range.</Text>
          </View>
        ) : (
          dailyAdherence.map(item => (
            <View key={item.date} style={styles.adherenceItem}>
              <View>
                <Text style={styles.adherenceDate}>{formatShortDate(item.date)}</Text>
                <View style={styles.adherenceBar}>
                  <View style={[styles.adherenceFill, { width: `${item.pct}%` }]} />
                </View>
              </View>
              <Text style={styles.adherenceValue}>{item.consumed.toLocaleString()} / {item.target.toLocaleString()} kcal</Text>
            </View>
          ))
        )}
      </View>

      {/* Insights */}
      <View style={styles.insightCard}>
        <Text style={styles.insightIcon}>💡</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.insightTitle}>{streakDays >= 5 ? 'Great consistency!' : 'Keep it going!'}</Text>
          <Text style={styles.insightText}>
            You've logged meals for {streakDays} consecutive day{streakDays === 1 ? '' : 's'}. Your recent calorie adherence is {adherenceAvg}%.
          </Text>
        </View>
      </View>

      <View style={{ height: Spacing.xl }} />
    </ScrollView>
  )
}

function SummaryCard({
  icon,
  label,
  value,
  unit,
  delta,
  deltaType,
}: {
  icon: string
  label: string
  value: string
  unit: string
  delta: string
  deltaType: DeltaTone
}) {
  const deltaColor = deltaType === 'positive' ? Colors.success : deltaType === 'negative' ? Colors.danger : Colors.text.secondary
  const deltaIcon = deltaType === 'positive' ? '↓' : deltaType === 'negative' ? '↑' : '→'

  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryIcon}>{icon}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
      <View style={styles.summaryValueRow}>
        <Text style={styles.summaryValue}>
          {value}
          {unit && <Text style={styles.summaryUnit}>{unit}</Text>}
        </Text>
      </View>
      <Text style={[styles.summaryDelta, { color: deltaColor }]}>
        {deltaIcon} {delta}
      </Text>
    </View>
  )
}

function SimpleBarChart({
  points,
  unit,
  emptyMessage,
  barColor,
}: {
  points: ChartPoint[]
  unit: string
  emptyMessage: string
  barColor: string
}) {
  if (!points.length) {
    return (
      <View style={styles.chartEmptyState}>
        <Text style={styles.chartEmptyText}>{emptyMessage}</Text>
      </View>
    )
  }

  const maxValue = Math.max(...points.map(point => point.value), 1)

  return (
    <View style={styles.chartCard}>
      <View style={styles.chartRow}>
        {points.map(point => {
          const ratio = Math.max(point.value, 0) / maxValue
          const height = Math.max(scale(8), Math.round(ratio * verticalScale(96)))

          return (
            <View key={`${point.label}-${point.value}`} style={styles.chartBarGroup}>
              <Text style={styles.chartValueText}>{point.value.toFixed(1)}</Text>
              <View style={styles.chartBarTrack}>
                <View style={[styles.chartBarFill, { height, backgroundColor: barColor }]} />
              </View>
              <Text style={styles.chartXAxisText}>{point.label}</Text>
            </View>
          )
        })}
      </View>
      <Text style={styles.chartLegendText}>Unit: {unit}</Text>
    </View>
  )
}

function DualBarChart({
  points,
  primaryUnit,
  primaryLabel,
  secondaryLabel,
  emptyMessage,
}: {
  points: DualChartPoint[]
  primaryUnit: string
  primaryLabel: string
  secondaryLabel: string
  emptyMessage: string
}) {
  if (!points.length) {
    return (
      <View style={styles.chartEmptyState}>
        <Text style={styles.chartEmptyText}>{emptyMessage}</Text>
      </View>
    )
  }

  const maxValue = Math.max(
    ...points.map(point => Math.max(point.primaryValue, point.secondaryValue)),
    1,
  )

  return (
    <View style={styles.chartCard}>
      <View style={styles.chartRow}>
        {points.map(point => {
          const primaryHeight = Math.max(scale(8), Math.round((Math.max(point.primaryValue, 0) / maxValue) * verticalScale(96)))
          const secondaryHeight = Math.max(scale(8), Math.round((Math.max(point.secondaryValue, 0) / maxValue) * verticalScale(96)))

          return (
            <View key={`${point.label}-${point.primaryValue}-${point.secondaryValue}`} style={styles.chartBarGroup}>
              <Text style={styles.chartValueText}>{point.primaryValue}/{point.secondaryValue}</Text>
              <View style={styles.dualTrackRow}>
                <View style={styles.chartBarTrack}>
                  <View style={[styles.chartBarFill, { height: primaryHeight, backgroundColor: Colors.danger }]} />
                </View>
                <View style={styles.chartBarTrack}>
                  <View style={[styles.chartBarFill, { height: secondaryHeight, backgroundColor: Colors.primary }]} />
                </View>
              </View>
              <Text style={styles.chartXAxisText}>{point.label}</Text>
            </View>
          )
        })}
      </View>
      <View style={styles.dualLegendRow}>
        <Text style={styles.chartLegendText}>■ {primaryLabel}</Text>
        <Text style={styles.chartLegendText}>■ {secondaryLabel}</Text>
        <Text style={styles.chartLegendText}>Unit: {primaryUnit}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.warmWhite,
  },
  loadingWrap: {
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
  errorText: {
    color: Colors.danger,
    fontSize: Typography.sizes.bodySmall,
    marginBottom: Spacing.sm,
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

  dateRangeContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.white,
  },
  dateRangeButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    alignItems: 'center',
  },
  dateRangeButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  dateRangeText: {
    fontSize: Typography.sizes.body,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  dateRangeTextActive: {
    color: Colors.white,
  },

  summarySection: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    gap: Spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  summaryIcon: {
    fontSize: Typography.sizes.h2,
    marginBottom: Spacing.sm,
  },
  summaryLabel: {
    fontSize: Typography.sizes.caption,
    color: Colors.text.secondary,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  summaryValueRow: {
    marginBottom: Spacing.sm,
  },
  summaryValue: {
    fontSize: Typography.sizes.h3,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  summaryUnit: {
    fontSize: Typography.sizes.body,
    fontWeight: '500',
    marginLeft: Spacing.xs,
  },
  summaryDelta: {
    fontSize: Typography.sizes.bodySmall,
    fontWeight: '600',
  },

  section: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.sizes.h4,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },

  chartCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    marginBottom: Spacing.md,
  },
  chartEmptyState: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    minHeight: verticalScale(140),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  chartEmptyText: {
    fontSize: Typography.sizes.bodySmall,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: Spacing.xs,
    minHeight: verticalScale(132),
  },
  chartBarGroup: {
    flex: 1,
    alignItems: 'center',
  },
  chartBarTrack: {
    width: scale(12),
    height: verticalScale(100),
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primaryTint,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  chartBarFill: {
    width: '100%',
    borderRadius: BorderRadius.md,
  },
  chartValueText: {
    fontSize: Typography.sizes.caption,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  chartXAxisText: {
    fontSize: Typography.sizes.caption,
    color: Colors.text.tertiary,
    marginTop: Spacing.sm,
  },
  chartLegendText: {
    fontSize: Typography.sizes.caption,
    color: Colors.text.secondary,
  },
  dualTrackRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.xs,
  },
  dualLegendRow: {
    marginTop: Spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chartCaption: {
    fontSize: Typography.sizes.caption,
    color: Colors.text.secondary,
    fontStyle: 'italic',
  },

  adherenceItem: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  adherenceDate: {
    fontSize: Typography.sizes.caption,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  adherenceBar: {
    height: scale(6),
    backgroundColor: Colors.light,
    borderRadius: scale(3),
    width: scale(100),
  },
  adherenceFill: {
    height: '100%',
    backgroundColor: Colors.success,
    borderRadius: 3,
  },
  adherenceValue: {
    fontSize: Typography.sizes.bodySmall,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  emptyState: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  emptyStateText: {
    color: Colors.text.secondary,
    fontSize: Typography.sizes.bodySmall,
  },

  insightCard: {
    backgroundColor: Colors.secondaryTint,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  insightIcon: {
    fontSize: Typography.sizes.h2,
  },
  insightTitle: {
    fontSize: Typography.sizes.body,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  insightText: {
    fontSize: Typography.sizes.bodySmall,
    color: Colors.text.secondary,
    lineHeight: verticalScale(20),
  },
})
