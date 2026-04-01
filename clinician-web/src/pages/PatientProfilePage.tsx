import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useAuth } from '../hooks'
import { ClinicianPatientProfile, patientService } from '../services/patientService'

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
  { id: 'meals', label: 'Meals' },
  { id: 'blood-works', label: 'Blood Works' },
  { id: 'ai-summary', label: 'AI Summary' },
]

function clsx(...tokens: Array<string | false | undefined>) {
  return tokens.filter(Boolean).join(' ')
}

function normalizeTab(value: string | null): ProfileTab {
  if (value === 'overview' || value === 'charts' || value === 'care-plan' || value === 'meals' || value === 'blood-works' || value === 'ai-summary') {
    return value
  }
  return 'overview'
}

function displayNull(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === '') return 'Null'
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

export function PatientProfilePage() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { patientId } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()

  const [patient, setPatient] = useState<ClinicianPatientProfile | null>(null)
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
        const profile = await patientService.getPatientProfileForClinician(patientId)
        setPatient(profile)
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load patient profile')
      } finally {
        setIsLoading(false)
      }
    }

    loadPatient()
  }, [patientId])

  const pageTitle = useMemo(() => {
    const patientName = patient ? `${patient.firstName} ${patient.lastName}` : 'Patient'
    if (activeTab === 'overview') return patientName
    if (activeTab === 'charts') return `${patientName} � Charts`
    if (activeTab === 'care-plan') return `${patientName} � Care Plan`
    if (activeTab === 'meals') return `${patientName} � Meals`
    if (activeTab === 'blood-works') return `${patientName} � Blood Works`
    return `${patientName} � AI Summary`
  }, [activeTab, patient])

  const setTab = (tab: ProfileTab) => {
    setSearchParams({ tab })
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
              🏥 Intervene
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

              {activeTab === 'overview' && <OverviewTab patient={patient} />}
              {activeTab === 'blood-works' && <BloodWorksTab patient={patient} />}
              {(activeTab === 'charts' || activeTab === 'care-plan' || activeTab === 'meals' || activeTab === 'ai-summary') && (
                <NullDataCard title={TAB_ITEMS.find(t => t.id === activeTab)?.label || 'Section'} />
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
          {displayNull(patient.age)} yrs � {displayNull(patient.gender)} � {patient.email} � Onboarded {formatDate(patient.onboardedDate)}
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

function OverviewTab({ patient }: { patient: ClinicianPatientProfile }) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <h3 className="text-sm font-bold text-slate-900 mb-3">Onboarding Fields (Available Now)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          <KeyVal label="Primary goal" value={displayNull(patient.primaryGoal)} />
          <KeyVal label="Budget preference" value={displayNull(patient.budgetPreference)} />
          <KeyVal label="Country" value={displayNull(patient.country)} />
          <KeyVal label="Weight (kg)" value={displayNull(patient.weightKg)} />
          <KeyVal label="Height (cm)" value={displayNull(patient.heightCm)} />
          <KeyVal label="BP Systolic" value={displayNull(patient.bpSystolic)} />
          <KeyVal label="BP Diastolic" value={displayNull(patient.bpDiastolic)} />
          <KeyVal label="Risk" value={displayNull(patient.riskLevel)} />
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
    </div>
  )
}

function BloodWorksTab({ patient }: { patient: ClinicianPatientProfile }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <h3 className="text-sm font-bold text-slate-900 mb-3">Blood Works (Onboarding Snapshot)</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2 text-sm">
        <KeyVal label="Heart Rate" value={displayNull(patient.heartRate)} />
        <KeyVal label="Total Cholesterol" value={displayNull(patient.cholesterolTotal)} />
        <KeyVal label="HDL Cholesterol" value={displayNull(patient.hdlCholesterol)} />
        <KeyVal label="LDL Cholesterol" value={displayNull(patient.ldlCholesterol)} />
        <KeyVal label="Triglycerides" value={displayNull(patient.triglycerides)} />
        <KeyVal label="Emergency Contact" value={displayNull(patient.emergencyContactFullName)} />
        <KeyVal label="Emergency Relationship" value={displayNull(patient.emergencyContactRelationship)} />
        <KeyVal label="Emergency Phone" value={displayNull(patient.emergencyContactPhone)} />
        <KeyVal label="Phone Number" value={displayNull(patient.phoneNumber)} />
      </div>
      <p className="text-xs text-slate-500 mt-3">Fields with Null need clinician review/editing in future forms.</p>
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
