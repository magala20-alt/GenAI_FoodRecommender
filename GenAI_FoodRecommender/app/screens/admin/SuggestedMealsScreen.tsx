import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { Colors, Spacing, BorderRadius, Typography, moderateScale, scale, verticalScale } from '../../constants/theme'
import { useAuth } from '../../hooks'
import { Button } from '../../components/atoms'
import { mealLoggerService } from '../../services/mealLoggerService'

interface SuggestedMeal {
  id: string
  name: string
  description: string | null
  cuisine: string | null
  calories: number | null
  proteinG: number | null
  carbsG: number | null
  fatG: number | null
  ingredients: string | null
  instructions: string | null
  sourceQuery: string
  modelName: string
  llmConfidence: number
  status: string
  approvalReason: string | null
  createdAt: string
  approvedAt: string | null
}

interface GovernanceStats {
  total: number
  pending: number
  approved: number
  rejected: number
  promoted: number
}

export function SuggestedMealsScreen() {
  const { user, token } = useAuth()
  const [suggestions, setSuggestions] = useState<SuggestedMeal[]>([])
  const [stats, setStats] = useState<GovernanceStats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    promoted: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedMeal, setSelectedMeal] = useState<SuggestedMeal | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [approvalReason, setApprovalReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const insets = useSafeAreaInsets()

  const loadSuggestedMeals = async (showLoading = true) => {
    try {
      if (showLoading) setIsLoading(true)
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/patient-rag/admin/suggested-meals`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) throw new Error('Failed to load suggested meals')
      const data = await response.json()
      setSuggestions(data.suggestions || [])
      setStats({
        total: data.total,
        pending: data.pending,
        approved: data.approved,
        rejected: data.rejected,
        promoted: data.promoted,
      })
    } catch (err) {
      console.error('Error loading suggested meals:', err)
      Alert.alert('Error', 'Failed to load suggested meals')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    loadSuggestedMeals()
  }, [])

  const handleApprove = async () => {
    if (!selectedMeal) return
    setIsSubmitting(true)
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/patient-rag/admin/suggested-meals/${selectedMeal.id}/approve`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: 'approved',
            reason: approvalReason,
          }),
        }
      )

      if (!response.ok) throw new Error('Failed to approve meal')
      Alert.alert('Success', `Approved "${selectedMeal.name}"`)
      setIsDetailModalOpen(false)
      setApprovalReason('')
      setSelectedMeal(null)
      loadSuggestedMeals(false)
    } catch (err) {
      console.error('Error approving meal:', err)
      Alert.alert('Error', 'Failed to approve meal')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReject = async () => {
    if (!selectedMeal) return
    setIsSubmitting(true)
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/patient-rag/admin/suggested-meals/${selectedMeal.id}/reject`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: 'rejected',
            reason: approvalReason,
          }),
        }
      )

      if (!response.ok) throw new Error('Failed to reject meal')
      Alert.alert('Success', `Rejected "${selectedMeal.name}"`)
      setIsDetailModalOpen(false)
      setApprovalReason('')
      setSelectedMeal(null)
      loadSuggestedMeals(false)
    } catch (err) {
      console.error('Error rejecting meal:', err)
      Alert.alert('Error', 'Failed to reject meal')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePromote = async () => {
    if (!selectedMeal) return
    setIsSubmitting(true)
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/patient-rag/admin/suggested-meals/${selectedMeal.id}/promote`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prepTimeMinutes: 15,
            cookTimeMinutes: 30,
          }),
        }
      )

      if (!response.ok) throw new Error('Failed to promote meal')
      Alert.alert('Success', `Promoted "${selectedMeal.name}" to canonical meals`)
      setIsDetailModalOpen(false)
      setApprovalReason('')
      setSelectedMeal(null)
      loadSuggestedMeals(false)
    } catch (err) {
      console.error('Error promoting meal:', err)
      Alert.alert('Error', 'Failed to promote meal')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderMealCard = (meal: SuggestedMeal) => (
    <TouchableOpacity
      key={meal.id}
      style={[styles.mealCard, { borderLeftColor: getStatusColor(meal.status) }]}
      onPress={() => {
        setSelectedMeal(meal)
        setIsDetailModalOpen(true)
      }}
    >
      <View style={styles.mealHeader}>
        <Text style={styles.mealName}>{meal.name}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(meal.status) }]}>
          <Text style={styles.statusText}>{meal.status}</Text>
        </View>
      </View>
      {meal.description && <Text style={styles.mealDescription}>{meal.description}</Text>}
      <View style={styles.mealMeta}>
        <Text style={styles.mealCuisine}>{meal.cuisine || 'Unknown cuisine'}</Text>
        {meal.calories && <Text style={styles.mealCalories}>{meal.calories} cal</Text>}
        <Text style={styles.mealConfidence}>Confidence: {(meal.llmConfidence * 100).toFixed(0)}%</Text>
      </View>
      <Text style={styles.sourceQuery}>Query: {meal.sourceQuery.substring(0, 60)}...</Text>
    </TouchableOpacity>
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return Colors.warning
      case 'approved':
        return Colors.success
      case 'rejected':
        return '#ef4444'
      case 'promoted':
        return Colors.primary
      default:
        return Colors.border
    }
  }

  if (!user || user.role !== 'admin') {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Admin access required</Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => {
          setIsRefreshing(true)
          loadSuggestedMeals(false)
        }} />}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Meal Governance</Text>
          <Text style={styles.subtitle}>Review & approve LLM-suggested meals</Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Pending</Text>
            <Text style={styles.statValue}>{stats.pending}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Approved</Text>
            <Text style={styles.statValue}>{stats.approved}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Rejected</Text>
            <Text style={styles.statValue}>{stats.rejected}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Promoted</Text>
            <Text style={styles.statValue}>{stats.promoted}</Text>
          </View>
        </View>

        {/* Pending Meals */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pending Review ({stats.pending})</Text>
          {isLoading ? (
            <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
          ) : suggestions.length === 0 ? (
            <Text style={styles.emptyText}>No pending suggestions</Text>
          ) : (
            suggestions.filter(m => m.status === 'pending').map(renderMealCard)
          )}
        </View>

        {/* Approved Not Yet Promoted */}
        {suggestions.filter(m => m.status === 'approved').length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Approved (Ready to Promote)</Text>
            {suggestions.filter(m => m.status === 'approved').map(renderMealCard)}
          </View>
        )}
      </ScrollView>

      {/* Detail Modal */}
      <Modal visible={isDetailModalOpen} animationType="slide">
        <SafeAreaView style={styles.modal}>
          <ScrollView style={styles.modalContent}>
            {selectedMeal && (
              <>
                <TouchableOpacity onPress={() => setIsDetailModalOpen(false)}>
                  <Text style={styles.closeButton}>← Back</Text>
                </TouchableOpacity>

                <Text style={styles.modalTitle}>{selectedMeal.name}</Text>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Description</Text>
                  <Text style={styles.detailValue}>{selectedMeal.description || 'N/A'}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Cuisine</Text>
                  <Text style={styles.detailValue}>{selectedMeal.cuisine || 'N/A'}</Text>
                </View>

                <View style={styles.detailRow}>
                  <View style={styles.detailHalf}>
                    <Text style={styles.detailLabel}>Calories</Text>
                    <Text style={styles.detailValue}>{selectedMeal.calories || 'N/A'}</Text>
                  </View>
                  <View style={styles.detailHalf}>
                    <Text style={styles.detailLabel}>Protein</Text>
                    <Text style={styles.detailValue}>{selectedMeal.proteinG?.toFixed(1) || 'N/A'}g</Text>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <View style={styles.detailHalf}>
                    <Text style={styles.detailLabel}>Carbs</Text>
                    <Text style={styles.detailValue}>{selectedMeal.carbsG?.toFixed(1) || 'N/A'}g</Text>
                  </View>
                  <View style={styles.detailHalf}>
                    <Text style={styles.detailLabel}>Fat</Text>
                    <Text style={styles.detailValue}>{selectedMeal.fatG?.toFixed(1) || 'N/A'}g</Text>
                  </View>
                </View>

                {selectedMeal.ingredients && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Ingredients</Text>
                    <Text style={styles.detailValue}>{selectedMeal.ingredients}</Text>
                  </View>
                )}

                {selectedMeal.instructions && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Instructions</Text>
                    <Text style={styles.detailValue}>{selectedMeal.instructions}</Text>
                  </View>
                )}

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Source Query</Text>
                  <Text style={styles.detailValue}>{selectedMeal.sourceQuery}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Model Confidence</Text>
                  <Text style={styles.detailValue}>{(selectedMeal.llmConfidence * 100).toFixed(0)}%</Text>
                </View>

                {selectedMeal.status === 'pending' && (
                  <>
                    <View style={styles.detailSection}>
                      <Text style={styles.detailLabel}>Approval/Rejection Reason (optional)</Text>
                      <TextInput
                        style={styles.reasonInput}
                        placeholder="Enter reason for approval/rejection..."
                        value={approvalReason}
                        onChangeText={setApprovalReason}
                        multiline
                        numberOfLines={3}
                      />
                    </View>

                    <View style={styles.buttonGroup}>
                      <Button
                        label="Approve"
                        onPress={handleApprove}
                        disabled={isSubmitting}
                        variant="primary"
                        style={isSubmitting ? styles.buttonDisabled : undefined}
                      />
                      <Button
                        label="Reject"
                        onPress={handleReject}
                        disabled={isSubmitting}
                        variant="primary"
                        style={isSubmitting ? styles.buttonDisabled : undefined}
                      />
                    </View>
                  </>
                )}

                {selectedMeal.status === 'approved' && (
                  <View style={styles.buttonGroup}>
                    <Button
                      label="Promote to Canonical Meals"
                      onPress={handlePromote}
                      disabled={isSubmitting}
                      variant="primary"
                      style={isSubmitting ? styles.buttonDisabled : undefined}
                    />
                  </View>
                )}
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  title: {
    fontSize: scale(24),
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: scale(14),
    color: Colors.text.secondary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
  },
  statCard: {
    width: '48%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginRight: '4%',
    marginBottom: Spacing.md,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: scale(12),
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  statValue: {
    fontSize: scale(28),
    fontWeight: '700',
    color: Colors.primary,
  },
  section: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: scale(16),
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  loader: {
    marginVertical: Spacing.lg,
  },
  emptyText: {
    fontSize: scale(14),
    color: Colors.text.secondary,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
  },
  mealCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderLeftWidth: 4,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  mealName: {
    fontSize: scale(16),
    fontWeight: '600',
    color: Colors.text.primary,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: moderateScale(2),
    borderRadius: BorderRadius.sm,
    marginLeft: Spacing.sm,
  },
  statusText: {
    fontSize: scale(11),
    fontWeight: '600',
    color: '#fff',
  },
  mealDescription: {
    fontSize: scale(13),
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
  },
  mealMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  mealCuisine: {
    fontSize: scale(12),
    color: Colors.text.secondary,
    marginRight: Spacing.md,
  },
  mealCalories: {
    fontSize: scale(12),
    color: Colors.text.secondary,
    marginRight: Spacing.md,
  },
  mealConfidence: {
    fontSize: scale(12),
    color: Colors.primary,
    fontWeight: '600',
  },
  sourceQuery: {
    fontSize: scale(11),
    color: Colors.text.secondary,
    fontStyle: 'italic',
  },
  modal: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalContent: {
    padding: Spacing.lg,
  },
  closeButton: {
    fontSize: scale(16),
    color: Colors.primary,
    fontWeight: '600',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: scale(22),
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: Spacing.lg,
  },
  detailSection: {
    marginBottom: Spacing.lg,
  },
  detailLabel: {
    fontSize: scale(12),
    color: Colors.text.secondary,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  detailValue: {
    fontSize: scale(14),
    color: Colors.text.primary,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: Spacing.lg,
  },
  detailHalf: {
    flex: 1,
    marginRight: Spacing.md,
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: scale(14),
    color: Colors.text.primary,
    backgroundColor: Colors.surface,
    minHeight: moderateScale(80),
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  approveButton: {
    flex: 1,
    backgroundColor: Colors.success,
  },
  rejectButton: {
    flex: 1,
    backgroundColor: '#ef4444',
  },
  promoteButton: {
    backgroundColor: Colors.primary,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  errorText: {
    fontSize: scale(16),
    color: '#ef4444',
    textAlign: 'center',
    padding: Spacing.lg,
  },
})
