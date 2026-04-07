import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useAuth } from '../hooks'
import {
  BloodWorkEntryPayload,
  BloodWorkSnapshotResponse,
  CarePlanUpdatePayload,
  ClinicianPatientProfile,
  PatientAlert,
  PatientMealsResponse,
  PatientHealthReading,
  PatientAISummary,
  patientService,
} from '../services/patientService'

type ProfileTab = 'overview' | 'charts' | 'care-plan' | 'meals' | 'blood-works' | 'ai-summary'

const navMain = ['Dashboard', 'Patients', 'AI Summaries', 'Alerts']
const navTools = ['Schedule']

const navIcons: Record<string, string> = {
  Dashboard: '⊞',
  Patients: '👥',
  'AI Summaries': '🧠',
  Alerts: '🔔',
  Schedule: '📅',
}

const TAB_ITEMS: Array<{ id: ProfileTab; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'charts', label: 'Charts' },
  { id: 'care-plan', label: 'Care Plan' },
  { id: 'meals', label: 'Meals History'},
  { id: 'blood-works', label: 'Blood Works' },
  { id: 'ai-summary', label: 'AI Summary' },
]

function clsx(...tokens: Array<string | false | undefined>) {
  return tokens.filter(Boolean).join(' ')
}

function normalizeTab(value: string | null): ProfileTab {
  if (value === 'overview' || value === 'charts' || value === 'care-plan' || value === 'meals'|| value === 'blood-works' || value === 'ai-summary') {
    return value
  }
  return 'overview'
}

function displayNull(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === '') return 'Null'
  return String(value)
}

function displayNotUpdated(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === '') return 'not updated'
  return String(value)
}

function initialsFromName(firstName: string, lastName: string) {
  return `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase() || 'NA'
}

function formatDate(dateValue: string | null) {
  if (!dateValue) return 'Null'
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return 'Null'
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function formatDateTime(dateValue: string | null) {
  if (!dateValue) return 'Null'
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return 'Null'
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function PatientProfilePage() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { patientId } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()

  const [patient, setPatient] = useState<ClinicianPatientProfile | null>(null)
  const [healthReadings, setHealthReadings] = useState<PatientHealthReading[]>([])
  const [mealsData, setMealsData] = useState<PatientMealsResponse | null>(null)
  const [patientAlerts, setPatientAlerts] = useState<PatientAlert[]>([])
  const [aiSummary, setAiSummary] = useState<PatientAISummary | null>(null)
  const [isAlertsLoading, setIsAlertsLoading] = useState(true)
  const [alertsError, setAlertsError] = useState<string | null>(null)
  const [isAiSummaryLoading, setIsAiSummaryLoading] = useState(false)
  const [aiSummaryError, setAiSummaryError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const clinicianName = user ? `${user.firstName} ${user.lastName}` : 'Unknown User'
  const clinicianInitials = user ? `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase() : 'NA'
  const clinicianRole = user?.role === 'admin' ? 'Administrator' : 'Clinician'

  const activeTab = normalizeTab(searchParams.get('tab'))

  useEffect(() => {
    const loadPatient = async () => {
      if (!patientId) {
        setError('Missing patient id')
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError(null)
      try {
        const [profile, readings, meals, alerts] = await Promise.all([
          patientService.getPatientProfileForClinician(patientId),
          patientService.getPatientHealthReadings(patientId, 60),
          patientService.getPatientMeals(patientId),
          patientService.getPatientAlerts(patientId),
        ])
        setPatient(profile)
        setHealthReadings(readings)
        setMealsData(meals)
        setPatientAlerts(alerts)
        setIsAlertsLoading(false)
        setAlertsError(null)
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load patient profile')
        setAlertsError(loadError instanceof Error ? loadError.message : 'Failed to load alerts')
        setIsAlertsLoading(false)
      } finally {
        setIsLoading(false)
      }
    }

    loadPatient()
  }, [patientId])

  useEffect(() => {
    const loadAiSummary = async () => {
      if (!patientId || activeTab !== 'ai-summary') return

      setIsAiSummaryLoading(true)
      setAiSummaryError(null)
      try {
        const summary = await patientService.getPatientAISummary(patientId)
        setAiSummary(summary)
      } catch (err) {
        setAiSummaryError(err instanceof Error ? err.message : 'Failed to load AI summary')
      } finally {
        setIsAiSummaryLoading(false)
      }
    }

    loadAiSummary()
  }, [patientId, activeTab])

  const pageTitle = useMemo(() => {
    const patientName = patient ? `${patient.firstName} ${patient.lastName}` : 'Patient'
    if (activeTab === 'overview') return patientName
    if (activeTab === 'charts') return `${patientName} Charts`
    if (activeTab === 'care-plan') return `${patientName} Care Plan`
    if (activeTab === 'meals') return `${patientName} Meals`
    if (activeTab === 'blood-works') return `${patientName} Blood Works`
    return `${patientName} AI Summary`
  }, [activeTab, patient])

  const setTab = (tab: ProfileTab) => {
    setSearchParams({ tab })
  }

  const handleDismissPatientAlert = async (alertId: number | string) => {
    if (!patientId) return
    try {
      await patientService.dismissAlert(alertId)
      const [updatedAlerts, updatedProfile] = await Promise.all([
        patientService.getPatientAlerts(patientId),
        patientService.getPatientProfileForClinician(patientId),
      ])
      setPatientAlerts(updatedAlerts)
      setPatient(updatedProfile)
    } catch (dismissError) {
      setAlertsError(dismissError instanceof Error ? dismissError.message : 'Failed to dismiss alert')
    }
  }

  const handleNavClick = (item: string) => {
    if (item === 'Dashboard') navigate('/dashboard')
    if (item === 'Patients') navigate('/patients')
    if (item === 'AI Summaries') navigate('/ai-summaries')
    if (item === 'Schedule') navigate('/schedule')
    if (item === 'Alerts') navigate('/alerts')
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <aside className="w-56 bg-slate-900 flex flex-col py-6 px-4 shrink-0">
        <div className="flex items-center gap-2 px-1 mb-8">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-xs">🩺</div>
          <span className="text-white font-bold tracking-widest text-sm">CARESYNC</span>
        </div>

        <p className="text-slate-500 text-xs font-semibold px-1 mb-2 tracking-wider">Main</p>
        <nav className="flex flex-col gap-1 mb-6">
          {navMain.map(item => (
            <button
              key={item}
              onClick={() => handleNavClick(item)}
              className={clsx(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-all',
                item === 'Patients' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-white hover:bg-slate-800',
              )}
            >
              <span>{navIcons[item]}</span>
              <span>{item}</span>
            </button>
          ))}
        </nav>

        <p className="text-slate-500 text-xs font-semibold px-1 mb-2 tracking-wider">Tools</p>
        <nav className="flex flex-col gap-1">
          {navTools.map(item => (
            <button
              key={item}
              onClick={() => handleNavClick(item)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-all text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <span>{navIcons[item]}</span>
              <span>{item}</span>
            </button>
          ))}
        </nav>

        <div className="mt-auto px-1 pt-4 border-t border-slate-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center text-white text-xs font-bold">{clinicianInitials}</div>
            <div>
              <p className="text-white text-xs font-semibold">{clinicianName}</p>
              <p className="text-slate-400 text-xs">{clinicianRole}</p>
            </div>
          </div>
          <button onClick={logout} className="mt-3 w-full text-xs border border-slate-600 text-slate-200 rounded-md py-1.5 hover:bg-slate-800">Logout</button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-sm">
            <button onClick={() => navigate('/patients')} className="text-slate-500 hover:text-slate-700">← Patients</button>
            <span className="text-slate-300">/</span>
            <h1 className="text-lg font-bold text-slate-900">{pageTitle}</h1>
            {patient?.riskLevel && <span className="text-xs font-semibold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">{patient.riskLevel} Risk</span>}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setTab('care-plan')}
              className="text-sm bg-teal-500 hover:bg-teal-600 text-white px-3 py-1.5 rounded-lg"
            >
              🏥 See Care Plan
            </button>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto p-4 md:p-5">
          {isLoading && <div className="text-sm text-slate-500">Loading patient profile...</div>}
          {error && <div className="text-sm font-medium text-red-600">{error}</div>}

          {!isLoading && !error && patient && (
            <>
              {(activeTab === 'overview' || activeTab === 'blood-works') && <PatientHeader patient={patient} />}

              <div className="flex gap-1.5 flex-wrap mb-3">
                {TAB_ITEMS.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setTab(tab.id)}
                    className={clsx(
                      'text-sm px-3 py-1.5 rounded-lg border transition',
                      tab.id === activeTab ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50',
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {activeTab === 'overview' && (
                <OverviewTab
                  patient={patient}
                  alerts={patientAlerts}
                  isAlertsLoading={isAlertsLoading}
                  alertsError={alertsError}
                  onDismissAlert={handleDismissPatientAlert}
                  onViewAllAlerts={() => navigate(`/alerts?patientId=${encodeURIComponent(patient.id)}`)}
                />
              )}
              {activeTab === 'blood-works' && patientId && (
                <BloodWorksTab
                  patient={patient}
                  patientId={patientId}
                  initialReadings={healthReadings}
                  onReadingsUpdated={setHealthReadings}
                />
              )}
              {activeTab === 'charts' && <ChartsTab readings={healthReadings} />}
              {activeTab === 'care-plan' && patientId && (
                <CarePlanTab
                  patient={patient}
                  patientId={patientId}
                  onPatientUpdated={updated => setPatient(updated)}
                />
              )}
              {activeTab === 'meals' && <MealsTab mealsData={mealsData} />}
              {activeTab === 'ai-summary' && (
                <AISummaryTab
                  summary={aiSummary}
                  isLoading={isAiSummaryLoading}
                  error={aiSummaryError}
                  onRegenerate={async () => {
                    if (!patientId) return
                    try {
                      setIsAiSummaryLoading(true)
                      const updated = await patientService.regeneratePatientAISummary(patientId)
                      setAiSummary(updated)
                    } catch (err) {
                      setAiSummaryError(err instanceof Error ? err.message : 'Failed to regenerate summary')
                    } finally {
                      setIsAiSummaryLoading(false)
                    }
                  }}
                />
              )}
            </>
          )}
        </section>
      </main>
    </div>
  )
}

function PatientHeader({ patient }: { patient: ClinicianPatientProfile }) {
  const fullName = `${patient.firstName} ${patient.lastName}`
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 mb-3 flex flex-wrap md:flex-nowrap gap-4 items-center">
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-600 to-sky-500 text-white font-bold flex items-center justify-center">
        {initialsFromName(patient.firstName, patient.lastName)}
      </div>
      <div className="flex-1">
        <p className="text-xl font-bold text-slate-900">{fullName}</p>
        <p className="text-sm text-slate-500">
          {displayNull(patient.age)} yrs - {displayNull(patient.gender)} - {patient.email} - Onboarded {formatDate(patient.onboardedDate)}
        </p>
      </div>
      <div className="text-right">
        <p className="text-xs text-slate-500">Calorie target</p>
        <p className="text-3xl font-bold text-slate-900">{displayNull(patient.calorieTarget)}</p>
        <p className="text-xs text-slate-500">kcal/day</p>
      </div>
    </div>
  )
}

function OverviewTab({
  patient,
  alerts,
  isAlertsLoading,
  alertsError,
  onDismissAlert,
  onViewAllAlerts,
}: {
  patient: ClinicianPatientProfile
  alerts: PatientAlert[]
  isAlertsLoading: boolean
  alertsError: string | null
  onDismissAlert: (alertId: number | string) => void
  onViewAllAlerts: () => void
}) {
  const openAlerts = alerts.filter(alert => alert.status === 'Open')

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
      <div className="bg-white border border-slate-200 rounded-xl p-4 xl:col-span-2">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Risk & Engagement</h3>
            <p className="text-xs text-slate-500 mt-1">Backend-driven summary for the current patient</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">Risk score</p>
            <p className="text-3xl font-bold text-slate-900">{patient.riskScore != null ? patient.riskScore.toFixed(2) : 'not updated'}</p>
            <p className={clsx('text-xs font-semibold px-2 py-0.5 rounded-full inline-flex mt-1', patient.riskLevel === 'High' ? 'bg-red-100 text-red-600' : patient.riskLevel === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700')}>
              {patient.riskLevel ?? 'not updated'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-2 mt-4 text-sm">
          <MetricPill label="Meals logged" value={displayNotUpdated(patient.mealsLogged)} />
          <MetricPill label="Streak" value={patient.streak != null ? `${patient.streak} days` : 'not updated'} />
          <MetricPill label="Sessions (7d)" value={displayNotUpdated(patient.sessions7d)} />
          <MetricPill label="Missed appointments" value={displayNotUpdated(patient.missedAppointments)} />
          <MetricPill label="Adherence" value={patient.adherence != null ? `${patient.adherence}%` : 'not updated'} />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <h3 className="text-sm font-bold text-slate-900 mb-3">Patient Meta Data</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          <KeyVal label="Primary goal" value={displayNull(patient.primaryGoal)} />
          <KeyVal label="Budget preference" value={displayNull(patient.budgetPreference)} />
          <KeyVal label="Country" value={displayNull(patient.country)} />
          <KeyVal label="Weight (kg)" value={displayNull(patient.weightKg)} />
          <KeyVal label="Height (cm)" value={displayNull(patient.heightCm)} />
          <KeyVal label="BP Systolic" value={displayNull(patient.bpSystolic)} />
          <KeyVal label="BP Diastolic" value={displayNull(patient.bpDiastolic)} />
          <KeyVal label="Adherence" value={displayNull(patient.adherence)} />
          <KeyVal label="Alerts" value={displayNull(patient.alerts)} />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <h3 className="text-sm font-bold text-slate-900 mb-3">Preferences and Medications</h3>
        <ListVal label="Cuisine preferences" values={patient.cuisinePreferences} />
        <ListVal label="Dietary restrictions" values={patient.dietaryRestrictions} />
        <ListVal label="Prescribed medications" values={patient.prescribedMedications} />
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 xl:col-span-2">
        <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
          <h3 className="text-sm font-bold text-slate-900">Active Alerts</h3>
          <button
            onClick={onViewAllAlerts}
            className="text-xs border border-slate-200 px-2.5 py-1 rounded-md hover:bg-slate-50"
          >
            View all alerts
          </button>
        </div>

        {isAlertsLoading && <p className="text-sm text-slate-500">Loading alerts...</p>}
        {alertsError && <p className="text-sm text-red-600">{alertsError}</p>}

        {!isAlertsLoading && !alertsError && openAlerts.length === 0 && (
          <p className="text-sm text-slate-500">No active alerts for this patient.</p>
        )}

        {!isAlertsLoading && !alertsError && openAlerts.length > 0 && (
          <div className="space-y-2">
            {openAlerts.slice(0, 5).map(alert => (
              <div key={alert.id} className="border border-slate-200 rounded-lg p-3 flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{alert.alertType}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{alert.llmReason ?? alert.message}</p>
                  <p className="text-xs text-slate-400 mt-1">{formatDateTime(alert.createdAt)}</p>
                </div>
                <button
                  onClick={() => onDismissAlert(alert.id)}
                  className="text-xs border border-slate-200 px-2.5 py-1 rounded-md hover:bg-slate-50"
                >
                  Dismiss
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-lg font-bold text-slate-900">{value}</p>
    </div>
  )
}

function BloodWorksTab({
  patient,
  patientId,
  initialReadings,
  onReadingsUpdated,
}: {
  patient: ClinicianPatientProfile
  patientId: string
  initialReadings: PatientHealthReading[]
  onReadingsUpdated: (rows: PatientHealthReading[]) => void
}) {
  const [rows, setRows] = useState<PatientHealthReading[]>([...initialReadings].reverse())
  const [form, setForm] = useState<BloodWorkEntryPayload>({
    cholesterolTotal: patient.cholesterolTotal,
    hdlCholesterol: patient.hdlCholesterol,
    ldlCholesterol: patient.ldlCholesterol,
    triglycerides: patient.triglycerides,
    glucose: patient.glucose,
  })
  const [snapshotText, setSnapshotText] = useState('')
  const [snapshotName, setSnapshotName] = useState<string | null>(null)
  const [snapshotImageDataUrl, setSnapshotImageDataUrl] = useState<string | null>(null)
  const [snapshotNotes, setSnapshotNotes] = useState<string | null>(null)
  const [isExtracting, setIsExtracting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [status, setStatus] = useState<string | null>(null)

  useEffect(() => {
    setRows([...initialReadings].reverse())
  }, [initialReadings])

  const updateFormNumber = (key: keyof BloodWorkEntryPayload, value: string) => {
    setForm(prev => ({
      ...prev,
      [key]: value.trim() === '' ? null : Number(value),
    }))
  }

  const handleSnapshotFile = async (file: File) => {
    setSnapshotName(file.name)
    if (file.type.startsWith('image/')) {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result ?? ''))
        reader.onerror = () => reject(new Error('Failed to read image file'))
        reader.readAsDataURL(file)
      })
      setSnapshotImageDataUrl(dataUrl)
    } else {
      const textContent = await file.text()
      setSnapshotText(textContent)
      setSnapshotImageDataUrl(null)
    }
  }

  const applySnapshotToForm = (snapshot: BloodWorkSnapshotResponse) => {
    setForm(prev => ({
      ...prev,
      cholesterolTotal: snapshot.cholesterolTotal,
      hdlCholesterol: snapshot.hdlCholesterol,
      ldlCholesterol: snapshot.ldlCholesterol,
      triglycerides: snapshot.triglycerides,
      glucose: snapshot.glucose,
    }))
    setSnapshotNotes(snapshot.notes)
  }

  const extractSnapshot = async () => {
    if (!snapshotText.trim() && !snapshotImageDataUrl) {
      setStatus('Add imported text or image snapshot first.')
      return
    }

    setIsExtracting(true)
    setStatus(null)
    try {
      const extracted = await patientService.extractBloodworkSnapshot(patientId, {
        extractedText: snapshotText.trim() || undefined,
        imageDataUrl: snapshotImageDataUrl ?? undefined,
        fileName: snapshotName ?? undefined,
      })
      applySnapshotToForm(extracted)
      setStatus('Snapshot extracted and form auto-filled.')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Failed to extract snapshot readings')
    } finally {
      setIsExtracting(false)
    }
  }

  const saveEntry = async () => {
    setIsSaving(true)
    setStatus(null)
    try {
      const created = await patientService.addPatientHealthReading(patientId, {
        ...form,
        timestamp: new Date().toISOString(),
      })
      const nextRows = [created, ...rows]
      setRows(nextRows)
      onReadingsUpdated([...nextRows].reverse())
      setStatus('Bloodwork entry saved.')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Failed to save bloodwork entry')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <h3 className="text-sm font-bold text-slate-900 mb-3">Entry History</h3>
        <div className="overflow-auto">
          <table className="w-full min-w-[980px]">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {['Logged At', 'Total Chol', 'HDL', 'LDL', 'Triglycerides'].map(header => (
                  <th key={header} className="text-left text-xs font-semibold text-slate-500 px-3 py-2">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td className="px-3 py-4 text-sm text-slate-500" colSpan={5}>Null</td>
                </tr>
              ) : (
                rows.map((row, index) => (
                  <tr key={`${row.timestamp}-${index}`} className="border-b border-slate-100 last:border-b-0">
                    <td className="px-3 py-2 text-sm text-slate-700">{formatDateTime(row.timestamp)}</td>
                    <td className="px-3 py-2 text-sm text-slate-700">{displayNull(row.cholesterolTotal)}</td>
                    <td className="px-3 py-2 text-sm text-slate-700">{displayNull(row.hdlCholesterol)}</td>
                    <td className="px-3 py-2 text-sm text-slate-700">{displayNull(row.ldlCholesterol)}</td>
                    <td className="px-3 py-2 text-sm text-slate-700">{displayNull(row.triglycerides)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <h3 className="text-sm font-bold text-slate-900 mb-3">Snapshot Import (Imported Text or Picture)</h3>
        <textarea
          rows={4}
          value={snapshotText}
          onChange={event => setSnapshotText(event.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          placeholder="Paste imported bloodwork text here"
        />
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <input
            type="file"
            accept="image/*,.txt,.csv,.json"
            onChange={event => {
              const file = event.target.files?.[0]
              if (file) {
                void handleSnapshotFile(file)
              }
            }}
            className="text-sm"
          />
          <button
            onClick={extractSnapshot}
            disabled={isExtracting}
            className="text-xs bg-teal-500 text-white px-3 py-1.5 rounded-md hover:bg-teal-600 disabled:opacity-60"
          >
            {isExtracting ? 'Extracting...' : 'Extract with AI'}
          </button>
        </div>
        {snapshotName && <p className="text-xs text-slate-500 mt-2">Selected file: {snapshotName}</p>}
        {snapshotNotes && <p className="text-xs text-slate-600 mt-2">AI notes: {snapshotNotes}</p>}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <h3 className="text-sm font-bold text-slate-900 mb-3">New Bloodwork Entry</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
          <LabeledInput label="Total Cholesterol" value={form.cholesterolTotal != null ? String(form.cholesterolTotal) : ''} onChange={value => updateFormNumber('cholesterolTotal', value)} />
          <LabeledInput label="HDL Cholesterol" value={form.hdlCholesterol != null ? String(form.hdlCholesterol) : ''} onChange={value => updateFormNumber('hdlCholesterol', value)} />
          <LabeledInput label="LDL Cholesterol" value={form.ldlCholesterol != null ? String(form.ldlCholesterol) : ''} onChange={value => updateFormNumber('ldlCholesterol', value)} />
          <LabeledInput label="Triglycerides" value={form.triglycerides != null ? String(form.triglycerides) : ''} onChange={value => updateFormNumber('triglycerides', value)} />
        </div>
        <button
          onClick={saveEntry}
          disabled={isSaving}
          className="mt-3 text-sm bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg disabled:opacity-60"
        >
          {isSaving ? 'Saving...' : 'Save Bloodwork Entry'}
        </button>
      </div>

      {status && <p className="text-sm text-slate-600">{status}</p>}
    </div>
  )
}

function ChartsTab({ readings }: { readings: PatientHealthReading[] }) {
  const [windowDays, setWindowDays] = useState<7 | 14 | 30 | 60>(60)

  const sortedReadings = useMemo(() => {
    return [...readings].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  }, [readings])

  const scopedReadings = useMemo(() => {
    return sortedReadings.slice(-windowDays)
  }, [sortedReadings, windowDays])

  const formatMonthYear = (timestamp: string) => {
    const date = new Date(timestamp)
    if (Number.isNaN(date.getTime())) return 'Unknown'
    return date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
  }

  const firstLabel = scopedReadings[0]?.timestamp ? formatMonthYear(scopedReadings[0].timestamp) : 'Unknown'
  const lastLabel = scopedReadings[scopedReadings.length - 1]?.timestamp
    ? formatMonthYear(scopedReadings[scopedReadings.length - 1].timestamp)
    : 'Unknown'

  const glucoseSeries = scopedReadings.map(r => ({ label: formatMonthYear(r.timestamp), value: r.glucose }))
  const systolicSeries = scopedReadings.map(r => ({ label: formatMonthYear(r.timestamp), value: r.systolicBp }))
  const bmiSeries = scopedReadings.map(r => ({ label: formatMonthYear(r.timestamp), value: r.bmi }))

  return (
    <div className="space-y-3">
      <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-wrap items-center gap-2">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Trend window</p>
        {[7, 14, 30, 60].map(days => (
          <button
            key={days}
            onClick={() => setWindowDays(days as 7 | 14 | 30 | 60)}
            className={clsx(
              'text-xs px-3 py-1.5 rounded-md border transition',
              windowDays === days ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50',
            )}
          >
            {days} days
          </button>
        ))}
        <span className="ml-auto text-xs text-slate-500">{firstLabel} - {lastLabel}</span>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
      <LineMetricCard title={`Glucose (${windowDays} days)`} unit="mg/dL" series={glucoseSeries} />
      <LineMetricCard title={`Systolic BP (${windowDays} days)`} unit="mmHg" series={systolicSeries} />
      <div className="xl:col-span-2">
        <LineMetricCard title={`BMI (${windowDays} days)`} unit="kg/m²" series={bmiSeries} />
      </div>
      </div>
    </div>
  )
}

function CarePlanTab({
  patient,
  patientId,
  onPatientUpdated,
}: {
  patient: ClinicianPatientProfile
  patientId: string
  onPatientUpdated: (patient: ClinicianPatientProfile) => void
}) {
  const [editingPrescriptions, setEditingPrescriptions] = useState(false)
  const [editingTargets, setEditingTargets] = useState(false)
  const [editingConstraints, setEditingConstraints] = useState(false)

  const [prescriptionsInput, setPrescriptionsInput] = useState(patient.prescribedMedications.join(', '))
  const [caloriesInput, setCaloriesInput] = useState(patient.calorieTarget != null ? String(patient.calorieTarget) : '')
  const [stepsInput, setStepsInput] = useState(patient.dailySteps != null ? String(patient.dailySteps) : '')
  const [targetWeightInput, setTargetWeightInput] = useState(patient.targetWeightKg != null ? String(patient.targetWeightKg) : '')
  const [targetHba1cInput, setTargetHba1cInput] = useState(patient.targetHba1c != null ? String(patient.targetHba1c) : '')
  const [dietaryInput, setDietaryInput] = useState(patient.dietaryRestrictions.join(', '))
  const [cuisineInput, setCuisineInput] = useState(patient.cuisinePreferences.join(', '))
  const [interventionMessage, setInterventionMessage] = useState(
    `Hi ${patient.firstName}, please follow your updated care plan this week and message me if you need support.`
  )

  const [savingBlock, setSavingBlock] = useState<'prescriptions' | 'targets' | 'constraints' | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [interventionStatus, setInterventionStatus] = useState<string | null>(null)
  const [sendingIntervention, setSendingIntervention] = useState(false)

  const splitCsv = (value: string) => value.split(',').map(item => item.trim()).filter(Boolean)

  const saveCarePlanBlock = async (
    block: 'prescriptions' | 'targets' | 'constraints',
    payload: CarePlanUpdatePayload,
  ) => {
    setSavingBlock(block)
    setSaveError(null)
    try {
      const updated = await patientService.updatePatientCarePlan(patientId, payload)
      onPatientUpdated(updated)

      // Sync local editors with persisted values.
      setPrescriptionsInput((updated.prescribedMedications ?? []).join(', '))
      setCaloriesInput(updated.calorieTarget != null ? String(updated.calorieTarget) : '')
      setStepsInput(updated.dailySteps != null ? String(updated.dailySteps) : '')
      setTargetWeightInput(updated.targetWeightKg != null ? String(updated.targetWeightKg) : '')
      setTargetHba1cInput(updated.targetHba1c != null ? String(updated.targetHba1c) : '')
      setDietaryInput((updated.dietaryRestrictions ?? []).join(', '))
      setCuisineInput((updated.cuisinePreferences ?? []).join(', '))

      if (block === 'prescriptions') setEditingPrescriptions(false)
      if (block === 'targets') setEditingTargets(false)
      if (block === 'constraints') setEditingConstraints(false)
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Failed to save care plan changes')
    } finally {
      setSavingBlock(null)
    }
  }

  const sendIntervention = async () => {
    const message = interventionMessage.trim()
    if (!message) {
      setInterventionStatus('Please enter a message before sending.')
      return
    }

    setSendingIntervention(true)
    setInterventionStatus(null)
    try {
      const response = await patientService.sendInterventionMessage(patientId, message)
      setInterventionStatus(response.detail)
    } catch (error) {
      setInterventionStatus(error instanceof Error ? error.message : 'Failed to send intervention message')
    } finally {
      setSendingIntervention(false)
    }
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-900">Prescriptions</h3>
          <button
            onClick={() => setEditingPrescriptions(prev => !prev)}
            className="text-xs border border-slate-200 px-2.5 py-1 rounded-md hover:bg-slate-50"
          >
            ✎ Edit
          </button>
        </div>

        {editingPrescriptions ? (
          <>
            <textarea
              rows={4}
              value={prescriptionsInput}
              onChange={event => setPrescriptionsInput(event.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="e.g. Metformin 500mg, Lisinopril 10mg"
            />
            <div className="mt-2 flex items-center gap-2">
              <button
                onClick={() => saveCarePlanBlock('prescriptions', { prescribedMedications: splitCsv(prescriptionsInput) })}
                disabled={savingBlock === 'prescriptions'}
                className="text-xs bg-teal-500 text-white px-3 py-1.5 rounded-md hover:bg-teal-600 disabled:opacity-60"
              >
                {savingBlock === 'prescriptions' ? 'Saving...' : 'Save'}
              </button>
            </div>
          </>
        ) : (
          <div className="space-y-2">
            {patient.prescribedMedications.length ? (
              patient.prescribedMedications.map(item => (
                <div key={item} className="flex items-center justify-between border border-slate-200 rounded-lg px-3 py-2">
                  <span className="text-sm text-slate-800">{item}</span>
                  <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Active</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No prescriptions set.</p>
            )}
          </div>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-900">Dietary Constraints</h3>
          <button
            onClick={() => setEditingConstraints(prev => !prev)}
            className="text-xs border border-slate-200 px-2.5 py-1 rounded-md hover:bg-slate-50"
          >
            ✎ Edit
          </button>
        </div>

        {editingConstraints ? (
          <>
            <label className="text-xs text-slate-500">Dietary restrictions (comma-separated)</label>
            <input
              value={dietaryInput}
              onChange={event => setDietaryInput(event.target.value)}
              className="w-full mt-1 mb-2 rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
            <label className="text-xs text-slate-500">Cuisine preferences (comma-separated)</label>
            <input
              value={cuisineInput}
              onChange={event => setCuisineInput(event.target.value)}
              className="w-full mt-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
            <div className="mt-2 flex items-center gap-2">
              <button
                onClick={() =>
                  saveCarePlanBlock('constraints', {
                    dietaryRestrictions: splitCsv(dietaryInput),
                    cuisinePreferences: splitCsv(cuisineInput),
                  })
                }
                disabled={savingBlock === 'constraints'}
                className="text-xs bg-teal-500 text-white px-3 py-1.5 rounded-md hover:bg-teal-600 disabled:opacity-60"
              >
                {savingBlock === 'constraints' ? 'Saving...' : 'Save'}
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-xs text-slate-500 mb-1">Dietary restrictions</p>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {(patient.dietaryRestrictions.length ? patient.dietaryRestrictions : ['None']).map(value => (
                <span key={value} className="text-xs bg-teal-100 text-teal-700 px-2.5 py-1 rounded-full">{value}</span>
              ))}
            </div>
            <p className="text-xs text-slate-500 mb-1">Cuisine preferences</p>
            <div className="flex flex-wrap gap-1.5">
              {(patient.cuisinePreferences.length ? patient.cuisinePreferences : ['None']).map(value => (
                <span key={value} className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full">{value}</span>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-900">Health Targets</h3>
          <button
            onClick={() => setEditingTargets(prev => !prev)}
            className="text-xs border border-slate-200 px-2.5 py-1 rounded-md hover:bg-slate-50"
          >
            ✎ Edit
          </button>
        </div>

        {editingTargets ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <LabeledInput label="Daily calories" value={caloriesInput} onChange={setCaloriesInput} />
            <LabeledInput label="Daily steps" value={stepsInput} onChange={setStepsInput} />
            <LabeledInput label="Target weight (kg)" value={targetWeightInput} onChange={setTargetWeightInput} />
            <LabeledInput label="Target HbA1c" value={targetHba1cInput} onChange={setTargetHba1cInput} />
            <div className="sm:col-span-2 mt-1">
              <button
                onClick={() =>
                  saveCarePlanBlock('targets', {
                    calorieTarget: caloriesInput === '' ? null : Number(caloriesInput),
                    dailySteps: stepsInput === '' ? null : Number(stepsInput),
                    targetWeightKg: targetWeightInput === '' ? null : Number(targetWeightInput),
                    targetHba1c: targetHba1cInput === '' ? null : Number(targetHba1cInput),
                  })
                }
                disabled={savingBlock === 'targets'}
                className="text-xs bg-teal-500 text-white px-3 py-1.5 rounded-md hover:bg-teal-600 disabled:opacity-60"
              >
                {savingBlock === 'targets' ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <TargetRow label="Daily Calories" value={patient.calorieTarget != null ? `${patient.calorieTarget} kcal` : 'Null'} />
            <TargetRow label="Daily Steps" value={patient.dailySteps != null ? patient.dailySteps.toLocaleString() : 'Null'} />
            <TargetRow label="Target Weight" value={patient.targetWeightKg != null ? `${patient.targetWeightKg} kg` : 'Null'} />
            <TargetRow label="Target HbA1c" value={patient.targetHba1c != null ? `< ${patient.targetHba1c}%` : 'Null'} />
          </div>
        )}
      </div>

      <div className="bg-white border border-teal-100 rounded-xl p-4">
        <h3 className="text-sm font-bold text-slate-900 mb-3">Send Intervention **Consider mentioning what you changed from the plan**</h3>
        <textarea
          rows={4}
          value={interventionMessage}
          onChange={event => setInterventionMessage(event.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          placeholder="Write a patient-facing intervention note"
        />
        <button
          onClick={sendIntervention}
          disabled={sendingIntervention}
          className="mt-3 w-full bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold px-4 py-2 rounded-lg disabled:opacity-60"
        >
          {sendingIntervention ? 'Sending...' : 'Send to Patient App'}
        </button>
        {interventionStatus && <p className="mt-2 text-xs text-slate-600">{interventionStatus}</p>}
      </div>

      {saveError && <p className="xl:col-span-2 text-sm text-red-600">{saveError}</p>}
    </div>
  )
}

function MealsTab({ mealsData }: { mealsData: PatientMealsResponse | null }) {
  const [searchDate, setSearchDate] = useState('')

  const logs = mealsData?.logs ?? []
  const filteredLogs = useMemo(() => {
    if (!searchDate.trim()) return logs
    const needle = searchDate.trim().toLowerCase()
    return logs.filter(item => formatDateTime(item.loggedAt).toLowerCase().includes(needle))
  }, [logs, searchDate])

  const summary = mealsData?.summary

  return (
    <div className="space-y-3">
      <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-end gap-2">
        <div className="w-[220px] bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-500 flex items-center gap-2">
          <span>🔎</span>
          <input
            value={searchDate}
            onChange={event => setSearchDate(event.target.value)}
            placeholder="Search date..."
            className="bg-transparent outline-none w-full"
          />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <StatCard label="Consumed" value={summary?.consumedKcalToday != null ? `${summary.consumedKcalToday.toLocaleString()} kcal` : 'Null'} />
          <StatCard label="Target" value={summary?.calorieTarget != null ? `${summary.calorieTarget.toLocaleString()} kcal` : 'Null'} />
          <StatCard label="Remaining" value={summary?.remainingKcalToday != null ? `${summary.remainingKcalToday.toLocaleString()} kcal` : 'Null'} />
          <StatCard label="Meals logged" value={summary ? String(summary.mealsLogged) : 'Null'} />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-auto">
          <table className="w-full min-w-[860px]">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {['Meal', 'Type', 'Cuisine', 'Calories', 'Budget', 'Logged At', 'Method'].map(column => (
                  <th key={column} className="text-left text-xs font-semibold text-slate-500 px-4 py-3">{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-sm text-slate-500" colSpan={7}>Null</td>
                </tr>
              ) : (
                filteredLogs.map(item => (
                  <tr key={item.id} className="border-b border-slate-100 last:border-b-0">
                    <td className="px-4 py-3 text-sm text-slate-800">{item.mealName ?? 'Null'}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{item.mealType ?? 'Null'}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{item.cuisine ?? 'Null'}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-slate-800">{item.calories != null ? `${item.calories} kcal` : 'Null'}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{item.budget ?? 'Null'}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{formatDateTime(item.loggedAt)}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{item.method ?? 'Null'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-xl font-bold text-slate-900">{value}</p>
    </div>
  )
}

function LabeledInput({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className="block">
      <span className="text-xs text-slate-500">{label}</span>
      <input
        value={value}
        onChange={event => onChange(event.target.value)}
        className="w-full mt-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
      />
    </label>
  )
}

function TargetRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 flex items-center justify-between gap-2">
      <p className="text-sm text-slate-700">{label}</p>
      <p className="text-lg font-bold text-teal-700">{value}</p>
    </div>
  )
}

function LineMetricCard({
  title,
  unit,
  series,
}: {
  title: string
  unit: string
  series: Array<{ label: string; value: number | null }>
}) {
  const values = series.map(s => s.value).filter((v): v is number => v !== null)

  if (values.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h3 className="text-sm font-bold text-slate-900 mb-2">{title}</h3>
        <p className="text-sm text-slate-500">No readings available.</p>
      </div>
    )
  }

  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const points = series
    .map((item, index) => {
      if (item.value === null) return null
      const x = (index / Math.max(series.length - 1, 1)) * 100
      const y = 100 - ((item.value - min) / range) * 100
      return `${x},${y}`
    })
    .filter((p): p is string => Boolean(p))
    .join(' ')

  const latestPoint = (() => {
    for (let index = series.length - 1; index >= 0; index -= 1) {
      const value = series[index]?.value
      if (value !== null) {
        const x = (index / Math.max(series.length - 1, 1)) * 100
        const y = 100 - ((value - min) / range) * 100
        return { x, y }
      }
    }
    return null
  })()

  const latest = values[values.length - 1]
  const avg = values.reduce((acc, v) => acc + v, 0) / values.length
  const firstDateLabel = series[0]?.label ?? 'Unknown'
  const midDateLabel = series[Math.floor(series.length / 2)]?.label ?? firstDateLabel
  const lastDateLabel = series[series.length - 1]?.label ?? firstDateLabel

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <div className="flex items-end justify-between mb-3">
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
        <div className="text-right">
          <p className="text-xs text-slate-500">Latest</p>
          <p className="text-sm font-semibold text-slate-900">{latest.toFixed(1)} {unit}</p>
        </div>
      </div>

      <p className="text-[11px] text-slate-500 mb-2">Trend view · daily readings</p>

      <div className="h-40 rounded-lg bg-slate-50 border border-slate-100 p-2">
        <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
          {[0, 25, 50, 75, 100].map(y => (
            <line
              key={y}
              x1="0"
              y1={y}
              x2="100"
              y2={y}
              stroke="#dbe3ea"
              strokeWidth="0.35"
            />
          ))}

          <polyline
            fill="none"
            stroke="#0f766e"
            strokeWidth="0.72"
            strokeOpacity="0.95"
            strokeLinejoin="round"
            strokeLinecap="round"
            points={points}
          />

          {latestPoint && (
            <circle cx={latestPoint.x} cy={latestPoint.y} r="0.9" fill="#0f766e" />
          )}
        </svg>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-slate-600">
        <span>Avg: {avg.toFixed(1)} {unit}</span>
        <span>Min/Max: {min.toFixed(1)} / {max.toFixed(1)}</span>
      </div>

      <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
        <span>{firstDateLabel}</span>
        <span>{midDateLabel}</span>
        <span>{lastDateLabel}</span>
      </div>
    </div>
  )
}

function NullDataCard({ title }: { title: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6">
      <h3 className="text-sm font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-sm text-slate-500">Null</p>
      <p className="text-xs text-slate-400 mt-1">This section will be populated once editable clinician data is captured.</p>
    </div>
  )
}

function AISummaryTab({
  summary,
  isLoading,
  error,
  onRegenerate,
}: {
  summary: PatientAISummary | null
  isLoading: boolean
  error: string | null
  onRegenerate: () => void
}) {
  if (isLoading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <p className="text-sm text-slate-500 text-center">Loading AI summary...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white border border-red-200 rounded-xl p-6">
        <p className="text-sm text-red-600 font-semibold">Error loading summary</p>
        <p className="text-xs text-red-500 mt-1">{error}</p>
      </div>
    )
  }

  if (!summary) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <p className="text-sm text-slate-500">No summary available</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">AI Summary</h3>
            <p className="text-xs text-slate-500 mt-1">
              Generated on {new Date(summary.generatedAt).toLocaleDateString()} at{' '}
              {new Date(summary.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <button
            onClick={onRegenerate}
            className="px-4 py-2 rounded-lg bg-teal-50 text-teal-700 font-semibold text-sm hover:bg-teal-100 transition-colors"
          >
            Regenerate
          </button>
        </div>

        <div className="flex gap-3 mb-6">
          <div className="flex-1">
            <p className="text-xs text-slate-500 font-semibold">Risk Level</p>
            <div
              className={`mt-2 inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                summary.riskLevel === 'High'
                  ? 'bg-red-50 text-red-700'
                  : summary.riskLevel === 'Medium'
                    ? 'bg-amber-50 text-amber-700'
                    : 'bg-emerald-50 text-emerald-700'
              }`}
            >
              {summary.riskLevel}
            </div>
          </div>
          {summary.riskScore !== null && (
            <div className="flex-1">
              <p className="text-xs text-slate-500 font-semibold">Risk Score</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{(summary.riskScore * 100).toFixed(0)}%</p>
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 pt-4">
          <h4 className="text-sm font-bold text-slate-900 mb-3">Summary</h4>
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{summary.summaryText}</p>
        </div>
      </div>

      {summary.suggestedActions && summary.suggestedActions.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h4 className="text-sm font-bold text-slate-900 mb-4">Recommended Actions</h4>
          <ul className="space-y-2">
            {summary.suggestedActions.map((action, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-teal-50 text-teal-700 text-xs font-semibold mt-0.5 shrink-0">
                  {idx + 1}
                </span>
                <span className="text-sm text-slate-700">{action}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function KeyVal({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="font-semibold text-slate-900">{value}</p>
    </div>
  )
}

function ListVal({ label, values }: { label: string; values: string[] }) {
  return (
    <div className="mb-3">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {values.length === 0 ? (
          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">Null</span>
        ) : (
          values.map(v => (
            <span key={v} className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">{v}</span>
          ))
        )}
      </div>
    </div>
  )
}
