import React, { useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import * as ImagePicker from 'expo-image-picker'
import { Audio } from 'expo-av'

import { BorderRadius, Colors, Spacing, Typography, scale } from '../../constants/theme'
import { useAuth } from '../../hooks'
import { MealInputMode, VitalLogItem, mealLoggerService } from '../../services/mealLoggerService'

interface LoggedMeal {
  id: string
  name: string
  calories: number
  mealType?: string
  time: string
}

interface Vital {
  id: string
  label: string
  value: string | number
  icon: string
  unit: string
  timestamp: string
}

export function DiaryScreen() {
  const { user } = useAuth()
  const [inputMode, setInputMode] = useState<MealInputMode>('photo')
  const [mealType, setMealType] = useState<'Breakfast' | 'Lunch' | 'Dinner' | 'Snack'>('Dinner')
  const [imageDataUrl, setImageDataUrl] = useState<string | undefined>(undefined)
  const [voiceTranscript, setVoiceTranscript] = useState('')
  const [voiceRecording, setVoiceRecording] = useState<Audio.Recording | null>(null)
  const [isRecordingVoice, setIsRecordingVoice] = useState(false)
  const [voiceRecordingUri, setVoiceRecordingUri] = useState<string | null>(null)
  const [voiceDurationMs, setVoiceDurationMs] = useState(0)
  const [manualDescription, setManualDescription] = useState('')
  const [detectedMealName, setDetectedMealName] = useState('')
  const [detectedCalories, setDetectedCalories] = useState<number>(0)
  const [detectedConfidence, setDetectedConfidence] = useState<number>(0)
  const [detectedTags, setDetectedTags] = useState<string[]>([])
  const [loadingSnapshot, setLoadingSnapshot] = useState(false)
  const [savingLog, setSavingLog] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [loggedMeals, setLoggedMeals] = useState<LoggedMeal[]>([])

  const [vitalsLoading, setVitalsLoading] = useState(false)
  const [savingVitals, setSavingVitals] = useState(false)
  const [vitalsHistory, setVitalsHistory] = useState<Vital[]>([])
  const [rawVitalsHistory, setRawVitalsHistory] = useState<VitalLogItem[]>([])
  const [isVitalsEditMode, setIsVitalsEditMode] = useState(false)
  const [weightInput, setWeightInput] = useState('0')
  const [stepsCount, setStepsCount] = useState('0')
  const [syncHintVisible, setSyncHintVisible] = useState(false)
  const [syncHintMetric, setSyncHintMetric] = useState<'BP' | 'Steps'>('BP')
  const [glucoseInput, setGlucoseInput] = useState('')
  const [bmiInput, setBmiInput] = useState('')
  const [systolicInput, setSystolicInput] = useState('')
  const [diastolicInput, setDiastolicInput] = useState('')
  const [heartRateInput, setHeartRateInput] = useState('')

  const { width, height } = useWindowDimensions()
  const insets = useSafeAreaInsets()
  const totalCalories = useMemo(() => loggedMeals.reduce((sum, meal) => sum + meal.calories, 0), [loggedMeals])
  const isCompactHeight = height <= 844
  const horizontalPadding = width < 390 ? Spacing.md : Spacing.lg

  useEffect(() => {
    const loadHistory = async () => {
      if (user?.userType !== 'patient' || user?.role === 'admin') {
        setLoggedMeals([])
        return
      }

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

    //vitals from database
    const loadVitals = async () => {
      if (user?.userType !== 'patient' || user?.role === 'admin') {
        setRawVitalsHistory([])
        setVitalsHistory([])
        return
      }

      setVitalsLoading(true)
      try {
        const items = await mealLoggerService.getVitalsHistory()
        setRawVitalsHistory(items)
        setVitalsHistory(
          items.map(item => ({
            id: item.id,
            label: item.systolicBp && item.diastolicBp ? 'Blood Pressure' : item.glucose != null ? 'Glucose' : item.heartRate != null ? 'Heart Rate' : 'BMI',
            value: item.systolicBp && item.diastolicBp
              ? `${Math.round(item.systolicBp)}/${Math.round(item.diastolicBp)}`
              : item.glucose != null
                ? Math.round(item.glucose)
                : item.heartRate != null
                  ? Math.round(item.heartRate)
                  : item.bmi != null
                    ? Number(item.bmi.toFixed(1))
                    : '-',
            icon: item.systolicBp && item.diastolicBp ? '🩸' : item.glucose != null ? '🧪' : item.heartRate != null ? '❤️' : '📊',
            unit: item.systolicBp && item.diastolicBp ? 'mmHg' : item.glucose != null ? 'mg/dL' : item.heartRate != null ? 'bpm' : '',
            timestamp: new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          })),
        )

        const latestGlucose = items.find(item => item.glucose != null)?.glucose
        const latestBmi = items.find(item => item.bmi != null)?.bmi
        if (latestGlucose != null) setGlucoseInput(String(Math.round(latestGlucose)))
        if (latestBmi != null) setWeightInput(latestBmi.toFixed(1))
      } catch (error) {
        console.error('Failed to load vitals history', error)
      } finally {
        setVitalsLoading(false)
      }
    }

    void loadHistory()
    void loadVitals()
  }, [user?.userType, user?.role])

  useEffect(() => {
    return () => {
      if (voiceRecording) {
        void voiceRecording.stopAndUnloadAsync()
      }
    }
  }, [voiceRecording])

  const latestGlucoseValue = useMemo(() => {
    const found = rawVitalsHistory.find(item => item.glucose != null)?.glucose
    return found != null ? String(Math.round(found)) : '0'
  }, [rawVitalsHistory])

  const latestBpValue = useMemo(() => {
    const found = rawVitalsHistory.find(item => item.systolicBp != null && item.diastolicBp != null)
    if (!found) return '0/0'
    return `${Math.round(found.systolicBp || 0)}/${Math.round(found.diastolicBp || 0)}`
  }, [rawVitalsHistory])

  const displayedWeight = weightInput.trim() || '0'
  const displayedGlucose = isVitalsEditMode ? (glucoseInput.trim() || '0') : latestGlucoseValue

  const openSyncHint = (metric: 'BP' | 'Steps') => {
    setSyncHintMetric(metric)
    setSyncHintVisible(true)
  }

  const toggleVitalsLogging = async () => {
    if (!isVitalsEditMode) {
      setIsVitalsEditMode(true)
      return
    }

    const parsedGlucose = glucoseInput.trim() ? Number(glucoseInput) : undefined
    const glucoseIsValid = parsedGlucose != null && Number.isFinite(parsedGlucose)

    if (!glucoseIsValid) {
      setIsVitalsEditMode(false)
      Alert.alert('Updated', 'Weight was updated. Add glucose to save to your vitals history.')
      return
    }

    setSavingVitals(true)
    try {
      const saved = await mealLoggerService.saveVitalsLog({
        glucose: parsedGlucose,
        timestamp: new Date().toISOString(),
      })

      setRawVitalsHistory(prev => [saved, ...prev])
      setVitalsHistory(prev => [
        {
          id: saved.id,
          label: 'Glucose',
          value: Math.round(saved.glucose || 0),
          icon: '🧪',
          unit: 'mg/dL',
          timestamp: new Date(saved.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
        ...prev,
      ])

      setIsVitalsEditMode(false)
      Alert.alert('Saved', 'Vitals updated successfully.')
    } catch (error) {
      console.error('Vitals save failed', error)
      Alert.alert('Save failed', 'Could not save vitals. Please try again.')
    } finally {
      setSavingVitals(false)
    }
  }

  const triggerSnapshotExtraction = async () => {
    if (inputMode === 'photo' && !imageDataUrl) {
      Alert.alert('Photo required', 'Take a photo or choose one from gallery first.')
      return
    }

    if (inputMode === 'voice' && !voiceTranscript.trim()) {
      Alert.alert('Voice input required', 'Record your voice meal description first.')
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

  const formatRecordingDuration = (durationMs: number) => {
    const totalSeconds = Math.max(0, Math.floor(durationMs / 1000))
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }

  const startVoiceRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync()
      if (!permission.granted) {
        Alert.alert('Microphone permission needed', 'Enable microphone access to record voice meal notes.')
        return
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      })

      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY)
      setVoiceRecording(recording)
      setVoiceDurationMs(0)
      setVoiceRecordingUri(null)
      setVoiceTranscript('')
      setIsRecordingVoice(true)
    } catch (error) {
      console.error('Voice recording start failed', error)
      Alert.alert('Microphone error', 'Could not start recording. Please try again.')
    }
  }

  const stopVoiceRecording = async () => {
    if (!voiceRecording) {
      return
    }

    try {
      await voiceRecording.stopAndUnloadAsync()
      const status = await voiceRecording.getStatusAsync()
      const uri = voiceRecording.getURI() || null
      const duration = status.durationMillis ?? 0

      setVoiceDurationMs(duration)
      setVoiceRecordingUri(uri)
      setIsRecordingVoice(false)
      setVoiceRecording(null)
    } catch (error) {
      console.error('Voice recording stop failed', error)
      Alert.alert('Recording error', 'Could not stop recording cleanly. Please try again.')
      setIsRecordingVoice(false)
      setVoiceRecording(null)
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
      setVoiceRecordingUri(null)
      setVoiceDurationMs(0)
      setManualDescription('')
      Alert.alert('Saved', 'Meal log saved to your history.')
    } catch (error) {
      console.error('Meal save failed', error)
      Alert.alert('Save failed', 'Could not save meal history. Please try again.')
    } finally {
      setSavingLog(false)
    }
  }

  const saveVitalsLog = async () => {
    const glucose = glucoseInput.trim() ? Number(glucoseInput) : undefined
    const bmi = bmiInput.trim() ? Number(bmiInput) : undefined
    const systolicBp = systolicInput.trim() ? Number(systolicInput) : undefined
    const diastolicBp = diastolicInput.trim() ? Number(diastolicInput) : undefined
    const heartRate = heartRateInput.trim() ? Number(heartRateInput) : undefined

    if (glucose == null && bmi == null && systolicBp == null && diastolicBp == null && heartRate == null) {
      Alert.alert('Vitals required', 'Enter at least one vital value to log.')
      return
    }

    setSavingVitals(true)
    try {
      const saved = await mealLoggerService.saveVitalsLog({
        glucose,
        bmi,
        systolicBp,
        diastolicBp,
        heartRate,
        timestamp: new Date().toISOString(),
      })

      const label = saved.systolicBp && saved.diastolicBp
        ? 'Blood Pressure'
        : saved.glucose != null
          ? 'Glucose'
          : saved.heartRate != null
            ? 'Heart Rate'
            : 'BMI'
      const value = saved.systolicBp && saved.diastolicBp
        ? `${Math.round(saved.systolicBp)}/${Math.round(saved.diastolicBp)}`
        : saved.glucose != null
          ? Math.round(saved.glucose)
          : saved.heartRate != null
            ? Math.round(saved.heartRate)
            : saved.bmi != null
              ? Number(saved.bmi.toFixed(1))
              : '-'
      const unit = saved.systolicBp && saved.diastolicBp
        ? 'mmHg'
        : saved.glucose != null
          ? 'mg/dL'
          : saved.heartRate != null
            ? 'bpm'
            : ''
      const icon = saved.systolicBp && saved.diastolicBp
        ? '🩸'
        : saved.glucose != null
          ? '🧪'
          : saved.heartRate != null
            ? '❤️'
            : '📊'

      setVitalsHistory(prev => [
        {
          id: saved.id,
          label,
          value,
          icon,
          unit,
          timestamp: new Date(saved.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
        ...prev,
      ])

      setGlucoseInput('')
      setBmiInput('')
      setSystolicInput('')
      setDiastolicInput('')
      setHeartRateInput('')
      Alert.alert('Saved', 'Vitals logged successfully.')
    } catch (error) {
      console.error('Vitals save failed', error)
      Alert.alert('Save failed', 'Could not save vitals log. Please try again.')
    } finally {
      setSavingVitals(false)
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={{ paddingBottom: insets.bottom + (isCompactHeight ? Spacing.xl : Spacing.xxl) }}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.header, { paddingHorizontal: horizontalPadding, paddingVertical: isCompactHeight ? Spacing.md : Spacing.lg }]}>
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

          <View style={[styles.captureCard, { marginHorizontal: horizontalPadding, marginTop: isCompactHeight ? Spacing.md : Spacing.lg }]}>
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
              <View style={styles.voiceCaptureContainer}>
                <TouchableOpacity
                  style={[styles.voiceRecordButton, isRecordingVoice && styles.voiceRecordButtonActive]}
                  onPress={isRecordingVoice ? stopVoiceRecording : startVoiceRecording}
                >
                  <Text style={styles.voiceRecordButtonText}>
                    {isRecordingVoice ? 'Stop Recording' : 'Start Recording'}
                  </Text>
                </TouchableOpacity>

                <Text style={styles.voiceStatusText}>
                  {isRecordingVoice
                    ? 'Recording... Speak your meal details clearly.'
                    : voiceRecordingUri
                      ? `Voice captured (${formatRecordingDuration(voiceDurationMs)}). Add a short transcript below.`
                      : 'Tap Start Recording to capture your voice note.'}
                </Text>

                <TextInput
                  style={styles.inputBox}
                  value={voiceTranscript}
                  onChangeText={setVoiceTranscript}
                  placeholder="Type what you said (e.g. Waakye with fish and stew, one plate)"
                  multiline
                />
              </View>
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

          <View style={[styles.detectedCard, { marginHorizontal: horizontalPadding }]}>
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

          <View style={[styles.section, { paddingHorizontal: horizontalPadding }]}>
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

          <View style={[styles.section, { paddingHorizontal: horizontalPadding, paddingTop: 0 }]}> 
            <View style={styles.vitalsHeaderRow}>
              <Text style={styles.sectionTitle}>Vitals</Text>
              <TouchableOpacity style={styles.logVitalsLink} onPress={toggleVitalsLogging} disabled={savingVitals}>
                <Text style={styles.logVitalsLinkText}>{savingVitals ? 'Saving...' : (isVitalsEditMode ? 'Save Vitals' : '+ Log Vitals')}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.vitalsCardsRow}>
              <View style={styles.vitalsCard}>
                {isVitalsEditMode ? (
                  <TextInput
                    style={styles.vitalsEditableValue}
                    value={weightInput}
                    onChangeText={setWeightInput}
                    keyboardType="decimal-pad"
                    placeholder="0"
                  />
                ) : (
                  <Text style={styles.vitalsValue}>{displayedWeight}kg</Text>
                )}
                <Text style={styles.vitalsLabel}>Weight</Text>
              </View>

              <TouchableOpacity style={styles.vitalsCard} onPress={() => openSyncHint('BP')}>
                <Text style={[styles.vitalsValue, styles.vitalsBpValue]}>{latestBpValue}</Text>
                <Text style={styles.vitalsLabel}>BP</Text>
              </TouchableOpacity>

              <View style={styles.vitalsCard}>
                {isVitalsEditMode ? (
                  <TextInput
                    style={[styles.vitalsEditableValue, styles.vitalsGlucoseValue]}
                    value={glucoseInput}
                    onChangeText={setGlucoseInput}
                    keyboardType="decimal-pad"
                    placeholder="0"
                  />
                ) : (
                  <Text style={[styles.vitalsValue, styles.vitalsGlucoseValue]}>{displayedGlucose}</Text>
                )}
                <Text style={styles.vitalsLabel}>Glucose</Text>
              </View>

              <TouchableOpacity style={styles.vitalsCard} onPress={() => openSyncHint('Steps')}>
                <Text style={styles.vitalsValue}>{stepsCount}</Text>
                <Text style={styles.vitalsLabel}>Steps</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>Recent Vitals</Text>
            {vitalsLoading ? (
              <ActivityIndicator color={Colors.primary} />
            ) : vitalsHistory.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No vitals logged yet.</Text>
              </View>
            ) : (
              vitalsHistory.slice(0, 6).map(item => (
                <View key={item.id} style={styles.vitalItem}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                    <Text style={{ fontSize: Typography.sizes.body }}>{item.icon}</Text>
                    <View>
                      <Text style={styles.mealName}>{item.label}</Text>
                      <Text style={styles.mealType}>{item.timestamp}</Text>
                    </View>
                  </View>
                  <Text style={styles.mealCalories}>{item.value} {item.unit}</Text>
                </View>
              ))
            )}
          </View>

          <Modal
            visible={syncHintVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setSyncHintVisible(false)}
          >
            <View style={styles.syncModalBackdrop}>
              <View style={styles.syncModalCard}>
                <Text style={styles.syncModalTitle}>Sync {syncHintMetric}</Text>
                <Text style={styles.syncModalText}>
                  Direct {syncHintMetric} sync from phone health data is not configured yet.
                </Text>
                <Text style={styles.syncModalText}>
                  Connect a smartwatch, phone health app, or EHR device integration to auto-sync this metric.
                </Text>
                <TouchableOpacity style={styles.syncModalButton} onPress={() => setSyncHintVisible(false)}>
                  <Text style={styles.syncModalButtonText}>Got it</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          <View style={[styles.calorieSummary, { marginHorizontal: horizontalPadding }]}> 
            <Text style={styles.calorieSummaryTitle}>Calories Logged Today</Text>
            <Text style={styles.calorieSummaryValue}>{totalCalories} kcal</Text>
          </View>

          <View style={{ height: Spacing.md }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.warmWhite,
  },
  header: {
    backgroundColor: Colors.warmWhite,
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
    fontWeight: '700',
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
    paddingVertical: Spacing.lg,
  },
  captureCard: {
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
    flexWrap: 'wrap',
    justifyContent: 'center',
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
    color: Colors.text.primary,
  },
  voiceCaptureContainer: {
    marginTop: Spacing.md,
    width: '100%',
  },
  voiceRecordButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  voiceRecordButtonActive: {
    backgroundColor: Colors.error,
  },
  voiceRecordButtonText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: Typography.sizes.bodySmall,
  },
  voiceStatusText: {
    marginTop: Spacing.sm,
    color: Colors.text.secondary,
    fontSize: Typography.sizes.bodySmall,
    textAlign: 'center',
  },
  detectedCard: {
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
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  vitalsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  logVitalsLink: {
    paddingVertical: Spacing.xs,
  },
  logVitalsLinkText: {
    fontSize: Typography.sizes.bodySmall,
    color: Colors.primary,
    fontWeight: '700',
  },
  vitalsCardsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  vitalsCard: {
    flex: 1,
    backgroundColor: '#ECEFF3',
    borderWidth: 1,
    borderColor: '#D4DAE3',
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    minHeight: scale(72),
  },
  vitalsValue: {
    fontSize: Typography.sizes.body,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: scale(2),
  },
  vitalsEditableValue: {
    minWidth: scale(46),
    textAlign: 'center',
    fontSize: Typography.sizes.body,
    fontWeight: '700',
    color: Colors.text.primary,
    paddingVertical: 0,
    marginBottom: scale(2),
  },
  vitalsBpValue: {
    color: Colors.success,
  },
  vitalsGlucoseValue: {
    color: Colors.secondary,
  },
  vitalsLabel: {
    fontSize: Typography.sizes.caption,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  vitalsInputGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  vitalInput: {
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minWidth: '48%',
    flexGrow: 1,
    color: Colors.text.primary,
  },
  saveMealButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    marginBottom: Spacing.lg,
  },
  saveVitalsButton: {
    backgroundColor: Colors.primaryDark,
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
  vitalItem: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
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
    fontWeight: '700',
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
  syncModalBackdrop: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  syncModalCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
  },
  syncModalTitle: {
    fontSize: Typography.sizes.h4,
    color: Colors.text.primary,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  syncModalText: {
    fontSize: Typography.sizes.bodySmall,
    color: Colors.text.secondary,
    lineHeight: scale(20),
    marginBottom: Spacing.sm,
  },
  syncModalButton: {
    marginTop: Spacing.sm,
    alignSelf: 'flex-end',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  syncModalButtonText: {
    color: Colors.white,
    fontSize: Typography.sizes.bodySmall,
    fontWeight: '700',
  },
})
