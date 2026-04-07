import React, { useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { Colors, Spacing, BorderRadius, Typography, moderateScale, scale } from '../../constants/theme'
import { mealLoggerService, MealInputMode } from '../../services/mealLoggerService'

interface LoggedMeal {
  id: string
  name: string
  calories: number
  mealType?: string
  time: string
}

interface Vital {
  label: string
  value: string | number
  icon: string
  unit: string
}

export function DiaryScreen() {
  const [inputMode, setInputMode] = useState<MealInputMode>('photo')
  const [mealType, setMealType] = useState<'Breakfast' | 'Lunch' | 'Dinner' | 'Snack'>('Dinner')
  const [imageDataUrl, setImageDataUrl] = useState<string | undefined>(undefined)
  const [voiceTranscript, setVoiceTranscript] = useState('')
  const [manualDescription, setManualDescription] = useState('')
  const [detectedMealName, setDetectedMealName] = useState('')
  const [detectedCalories, setDetectedCalories] = useState<number>(0)
  const [detectedConfidence, setDetectedConfidence] = useState<number>(0)
  const [detectedTags, setDetectedTags] = useState<string[]>([])
  const [loadingSnapshot, setLoadingSnapshot] = useState(false)
  const [savingLog, setSavingLog] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [loggedMeals, setLoggedMeals] = useState<LoggedMeal[]>([])

  const totalCalories = useMemo(() => loggedMeals.reduce((sum, meal) => sum + meal.calories, 0), [loggedMeals])

  useEffect(() => {
    const loadHistory = async () => {
      setHistoryLoading(true)
      try {
        const items = await mealLoggerService.getHistory()
        setLoggedMeals(
          items.map(item => ({
            id: item.id,
            name: item.mealName,
            calories: item.calories,
            mealType: item.mealType,
            time: new Date(item.consumedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          })),
        )
      } catch (error) {
        console.error('Failed to load meal history', error)
      } finally {
        setHistoryLoading(false)
      }
    }

    loadHistory()
  }, [])

  const triggerSnapshotExtraction = async () => {
    if (inputMode === 'photo' && !imageDataUrl) {
      Alert.alert('Photo required', 'Take a photo or choose one from gallery first.')
      return
    }

    if (inputMode === 'voice' && !voiceTranscript.trim()) {
      Alert.alert('Voice transcript required', 'Add your voice transcript to estimate calories.')
      return
    }

    if (inputMode === 'manual' && !manualDescription.trim()) {
      Alert.alert('Meal description required', 'Describe the meal to estimate calories.')
      return
    }

    setLoadingSnapshot(true)
    try {
      const result = await mealLoggerService.extractSnapshot({
        inputMode,
        imageDataUrl,
        transcript: voiceTranscript.trim() || undefined,
        mealDescription: manualDescription.trim() || undefined,
        mealType,
      })

      setDetectedMealName(result.mealName)
      setDetectedCalories(result.estimatedCalories)
      setDetectedConfidence(result.confidence)
      setDetectedTags(result.tags || [])

      if (result.suggestedMealType) {
        const normalized = result.suggestedMealType as 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack'
        if (['Breakfast', 'Lunch', 'Dinner', 'Snack'].includes(normalized)) {
          setMealType(normalized)
        }
      }
    } catch (error) {
      console.error('Snapshot extraction failed', error)
      Alert.alert('Analysis failed', 'Could not analyze this meal. Try manual input or a clearer image.')
    } finally {
      setLoadingSnapshot(false)
    }
  }

  const openCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync()
    if (!permission.granted) {
      Alert.alert('Camera permission needed', 'Enable camera access to take meal snapshots.')
      return
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.65,
      base64: true,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    })

    if (!result.canceled && result.assets[0]?.base64) {
      setImageDataUrl(`data:image/jpeg;base64,${result.assets[0].base64}`)
    }
  }

  const openGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) {
      Alert.alert('Gallery permission needed', 'Enable gallery access to import meal photos.')
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      quality: 0.65,
      base64: true,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    })

    if (!result.canceled && result.assets[0]?.base64) {
      setImageDataUrl(`data:image/jpeg;base64,${result.assets[0].base64}`)
    }
  }

  const saveMealLog = async () => {
    if (!detectedMealName.trim()) {
      Alert.alert('No detected meal', 'Analyze the meal first to detect calories and meal name.')
      return
    }

    setSavingLog(true)
    try {
      const saved = await mealLoggerService.saveMealLog({
        mealName: detectedMealName,
        calories: detectedCalories,
        mealType,
        source: inputMode,
        confidence: Number(detectedConfidence.toFixed(2)),
        notes: inputMode === 'manual' ? manualDescription : voiceTranscript,
      })

      setLoggedMeals(prev => [
        {
          id: saved.id,
          name: saved.mealName,
          calories: saved.calories,
          mealType: saved.mealType,
          time: new Date(saved.consumedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
        ...prev,
      ])

      setDetectedMealName('')
      setDetectedCalories(0)
      setDetectedConfidence(0)
      setDetectedTags([])
      setImageDataUrl(undefined)
      setVoiceTranscript('')
      setManualDescription('')
      Alert.alert('Saved', 'Meal log saved to your history.')
    } catch (error) {
      console.error('Meal save failed', error)
      Alert.alert('Save failed', 'Could not save meal history. Please try again.')
    } finally {
      setSavingLog(false)
    }
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.cancelText}>Cancel</Text>
        <Text style={styles.headerTitle}>Log a Meal</Text>
        <Text style={styles.saveText}>Save</Text>
      </View>

      <View style={styles.tabsRow}>
        <TouchableOpacity style={[styles.tabItem, inputMode === 'photo' && styles.tabActive]} onPress={() => setInputMode('photo')}>
          <Text style={styles.tabLabel}>📸 Photo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabItem, inputMode === 'voice' && styles.tabActive]} onPress={() => setInputMode('voice')}>
          <Text style={styles.tabLabel}>🎙️ Voice</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabItem, inputMode === 'manual' && styles.tabActive]} onPress={() => setInputMode('manual')}>
          <Text style={styles.tabLabel}>✏️ Manual</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.captureCard}>
        <Text style={styles.captureEmoji}>📷</Text>
        <Text style={styles.captureTitle}>Take a photo of your meal</Text>
        <Text style={styles.captureSubtitle}>AI will identify food and calories</Text>

        {inputMode === 'photo' ? (
          <View style={styles.captureButtonsRow}>
            <TouchableOpacity style={styles.primaryPillButton} onPress={openCamera}>
              <Text style={styles.primaryPillText}>Open Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryPillButton} onPress={openGallery}>
              <Text style={styles.secondaryPillText}>Gallery</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {inputMode === 'voice' ? (
          <TextInput
            style={styles.inputBox}
            value={voiceTranscript}
            onChangeText={setVoiceTranscript}
            placeholder="Paste or type voice transcript..."
            multiline
          />
        ) : null}

        {inputMode === 'manual' ? (
          <TextInput
            style={styles.inputBox}
            value={manualDescription}
            onChangeText={setManualDescription}
            placeholder="Describe meal (e.g. Jollof rice + grilled chicken)"
            multiline
          />
        ) : null}

        <TouchableOpacity style={styles.analyzeButton} onPress={triggerSnapshotExtraction} disabled={loadingSnapshot}>
          {loadingSnapshot ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.analyzeButtonText}>Analyze Meal</Text>}
        </TouchableOpacity>
      </View>

      <View style={styles.detectedCard}>
        <Text style={styles.detectedLabel}>🧠 AI DETECTED</Text>
        <Text style={styles.detectedMealName}>{detectedMealName || 'No meal analyzed yet'}</Text>
        <Text style={styles.detectedMeta}>{detectedCalories || 0} kcal • Confidence {(detectedConfidence * 100).toFixed(0)}%</Text>

        {detectedTags.length > 0 ? (
          <View style={styles.tagsRow}>
            {detectedTags.slice(0, 4).map(tag => (
              <View key={tag} style={styles.tagChip}>
                <Text style={styles.tagChipText}>{tag}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <Text style={styles.mealTypeTitle}>Meal Type</Text>
        <View style={styles.mealTypeRow}>
          {(['Breakfast', 'Lunch', 'Dinner', 'Snack'] as const).map(type => (
            <TouchableOpacity
              key={type}
              style={[styles.mealTypeChip, mealType === type && styles.mealTypeChipActive]}
              onPress={() => setMealType(type)}
            >
              <Text style={[styles.mealTypeChipText, mealType === type && styles.mealTypeChipTextActive]}>{type}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.saveMealButton} onPress={saveMealLog} disabled={savingLog || loadingSnapshot}>
          {savingLog ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.saveMealButtonText}>Save Meal Log</Text>}
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Recent Meal History</Text>

        {historyLoading ? (
          <ActivityIndicator color={Colors.primary} />
        ) : loggedMeals.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No meals logged yet.</Text>
          </View>
        ) : (
          loggedMeals.map(meal => (
            <View key={meal.id} style={styles.mealListItem}>
              <View style={{ flex: 1 }}>
                <Text style={styles.mealName}>{meal.name}</Text>
                <Text style={styles.mealType}>{meal.mealType || 'Meal'} • {meal.time}</Text>
              </View>
              <Text style={styles.mealCalories}>{meal.calories} kcal</Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.calorieSummary}>
        <Text style={styles.calorieSummaryTitle}>Calories Logged Today</Text>
        <Text style={styles.calorieSummaryValue}>{totalCalories} kcal</Text>
      </View>

      <View style={{ height: Spacing.xxl }} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.warmWhite,
  },

  header: {
    backgroundColor: Colors.warmWhite,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cancelText: {
    color: Colors.primary,
    fontSize: Typography.sizes.bodySmall,
  },
  headerTitle: {
    fontSize: Typography.sizes.h4,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  saveText: {
    color: Colors.primary,
    fontSize: Typography.sizes.bodySmall,
  },

  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
    backgroundColor: Colors.white,
  },
  tabItem: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomColor: Colors.primary,
    borderBottomWidth: 3,
  },
  tabLabel: {
    fontSize: Typography.sizes.bodySmall,
    color: Colors.text.secondary,
    fontWeight: '600',
  },

  section: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  captureCard: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    backgroundColor: '#F6F8FB',
    borderRadius: BorderRadius.xl,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#C9D4E5',
    padding: Spacing.lg,
    alignItems: 'center',
  },
  captureEmoji: {
    fontSize: Typography.sizes.h1,
  },
  captureTitle: {
    marginTop: Spacing.sm,
    fontSize: Typography.sizes.body,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  captureSubtitle: {
    marginTop: Spacing.xs,
    color: Colors.text.secondary,
    fontSize: Typography.sizes.bodySmall,
  },
  captureButtonsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  primaryPillButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.circular,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  primaryPillText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: Typography.sizes.bodySmall,
  },
  secondaryPillButton: {
    borderRadius: BorderRadius.circular,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.white,
  },
  secondaryPillText: {
    color: Colors.text.primary,
    fontWeight: '600',
    fontSize: Typography.sizes.bodySmall,
  },
  analyzeButton: {
    marginTop: Spacing.md,
    backgroundColor: Colors.primaryDark,
    borderRadius: BorderRadius.lg,
    width: '100%',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  analyzeButtonText: {
    color: Colors.white,
    fontWeight: '700',
  },
  inputBox: {
    marginTop: Spacing.md,
    width: '100%',
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.white,
    padding: Spacing.md,
    minHeight: scale(90),
    textAlignVertical: 'top',
  },
  detectedCard: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.primaryTint,
    padding: Spacing.lg,
  },
  detectedLabel: {
    color: '#E11D9A',
    fontSize: Typography.sizes.caption,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  detectedMealName: {
    marginTop: Spacing.sm,
    fontSize: Typography.sizes.h4,
    color: Colors.text.primary,
    fontWeight: '700',
  },
  detectedMeta: {
    marginTop: Spacing.xs,
    color: Colors.text.secondary,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    flexWrap: 'wrap',
  },
  tagChip: {
    backgroundColor: '#D1FAE5',
    borderRadius: BorderRadius.circular,
    paddingHorizontal: Spacing.sm,
    paddingVertical: scale(4),
  },
  tagChipText: {
    color: '#065F46',
    fontSize: Typography.sizes.caption,
    fontWeight: '700',
  },
  mealTypeTitle: {
    marginTop: Spacing.md,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  mealTypeRow: {
    marginTop: Spacing.sm,
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  mealTypeChip: {
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.white,
  },
  mealTypeChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  mealTypeChipText: {
    color: Colors.text.secondary,
    fontSize: Typography.sizes.bodySmall,
  },
  mealTypeChipTextActive: {
    color: Colors.white,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: Typography.sizes.h4,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  saveMealButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    marginBottom: Spacing.lg,
  },
  saveMealButtonText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: Typography.sizes.body,
  },

  mealListItem: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  mealName: {
    fontSize: Typography.sizes.body,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  mealType: {
    fontSize: Typography.sizes.bodySmall,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
  },
  mealCalories: {
    fontSize: Typography.sizes.body,
    fontWeight: 'bold',
    color: Colors.primary,
  },

  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  emptyText: {
    fontSize: Typography.sizes.body,
    color: Colors.text.secondary,
  },

  calorieSummary: {
    marginTop: Spacing.sm,
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.white,
    padding: Spacing.lg,
  },
  calorieSummaryTitle: {
    color: Colors.text.secondary,
    fontSize: Typography.sizes.bodySmall,
  },
  calorieSummaryValue: {
    marginTop: Spacing.xs,
    color: Colors.primary,
    fontWeight: '700',
    fontSize: Typography.sizes.h3,
  },
})
