import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native'
import { Colors, Spacing, BorderRadius, Typography } from '../../constants/theme'

interface ProgressData {
  weight: number
  bmi: number
  avgBP: string
  avgGlucose: number
}

export function ProgressScreen() {
  const [dateRange, setDateRange] = useState<'7d' | '14d' | '30d'>('14d')

  const progressData: ProgressData = {
    weight: 78.2,
    bmi: 28.4,
    avgBP: '128/82',
    avgGlucose: 7.8,
  }

  const deltas = {
    weight: -1.2,
    glucose: -0.6,
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
        <View style={styles.summaryRow}>
          <SummaryCard
            icon="⚖️"
            label="Weight"
            value={`${progressData.weight}`}
            unit="kg"
            delta={`${deltas.weight} kg`}
            deltaType="positive"
          />
          <SummaryCard
            icon="📊"
            label="BMI"
            value={`${progressData.bmi}`}
            unit=""
            delta="Overweight"
            deltaType="neutral"
          />
        </View>
        <View style={styles.summaryRow}>
          <SummaryCard
            icon="💓"
            label="Avg BP"
            value={progressData.avgBP}
            unit=""
            delta="Good"
            deltaType="positive"
          />
          <SummaryCard
            icon="🩺"
            label="Avg Glucose"
            value={`${progressData.avgGlucose}`}
            unit="mmol/L"
            delta={`${deltas.glucose} mmol/L`}
            deltaType="positive"
          />
        </View>
      </View>

      {/* Weight Chart Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Weight Trend</Text>
        <View style={styles.chartPlaceholder}>
          <Text style={styles.chartPlaceholderText}>
            📈 Chart showing weight over {dateRange} with trend line and projection
          </Text>
        </View>
        <Text style={styles.chartCaption}>Last {dateRange === '7d' ? '7' : dateRange === '14d' ? '14' : '30'} days + 14-day projection (dotted line)</Text>
      </View>

      {/* Blood Pressure Chart */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Blood Pressure</Text>
        <View style={styles.chartPlaceholder}>
          <Text style={styles.chartPlaceholderText}>
            📉 Systolic vs Diastolic pressure chart
          </Text>
        </View>
      </View>

      {/* Glucose Chart */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Glucose Readings</Text>
        <View style={styles.chartPlaceholder}>
          <Text style={styles.chartPlaceholderText}>
            📊 Daily glucose readings over time
          </Text>
        </View>
      </View>

      {/* Calorie Adherence */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Calorie Adherence</Text>
        <View style={styles.adherenceItem}>
          <View>
            <Text style={styles.adherenceDate}>Mar 3</Text>
            <View style={styles.adherenceBar}>
              <View style={[styles.adherenceFill, { width: '85%' }]} />
            </View>
          </View>
          <Text style={styles.adherenceValue}>1,405 / 1,650 kcal</Text>
        </View>
        <View style={styles.adherenceItem}>
          <View>
            <Text style={styles.adherenceDate}>Mar 4</Text>
            <View style={styles.adherenceBar}>
              <View style={[styles.adherenceFill, { width: '100%' }]} />
            </View>
          </View>
          <Text style={styles.adherenceValue}>1,650 / 1,650 kcal</Text>
        </View>
        <View style={styles.adherenceItem}>
          <View>
            <Text style={styles.adherenceDate}>Mar 5</Text>
            <View style={styles.adherenceBar}>
              <View style={[styles.adherenceFill, { width: '72%' }]} />
            </View>
          </View>
          <Text style={styles.adherenceValue}>1,188 / 1,650 kcal</Text>
        </View>
      </View>

      {/* Insights */}
      <View style={styles.insightCard}>
        <Text style={styles.insightIcon}>💡</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.insightTitle}>Great consistency!</Text>
          <Text style={styles.insightText}>
            You've logged meals for 14 consecutive days. Your average adherence is 92% - excellent!
          </Text>
        </View>
      </View>

      <View style={{ height: Spacing.xl }} />
    </ScrollView>
  )
}

function SummaryCard({ icon, label, value, unit, delta, deltaType }: any) {
  const deltaColor = deltaType === 'positive' ? Colors.success : Colors.text.secondary

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
        {deltaType === 'positive' ? '↓' : '→'} {delta}
      </Text>
    </View>
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
    fontSize: 28,
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

  chartPlaceholder: {
    backgroundColor: Colors.primaryTint,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 180,
    marginBottom: Spacing.md,
  },
  chartPlaceholderText: {
    fontSize: Typography.sizes.body,
    color: Colors.text.secondary,
    textAlign: 'center',
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
    height: 6,
    backgroundColor: Colors.light,
    borderRadius: 3,
    width: 100,
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
    fontSize: 28,
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
    lineHeight: 20,
  },
})
