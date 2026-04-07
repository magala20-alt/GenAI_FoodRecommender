import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '../hooks'
import { PatientAISummary, patientService } from '../services/patientService'

type RiskTier = 'High' | 'Medium' | 'Low'

const navMainBase = ['Dashboard', 'Patients', 'AI Summaries', 'Alerts']
const navTools = ['Schedule']

const navIcons: Record<string, string> = {
  Dashboard: '⊞',
  Patients: '👥',
  'Doctor Accounts': '🩺',
  'AI Summaries': '🧠',
  Alerts: '🔔',
  Schedule: '📅',
}

function clsx(...tokens: Array<string | false | undefined>) {
  return tokens.filter(Boolean).join(' ')
}

function riskTone(tier: RiskTier) {
  if (tier === 'High') return 'border-red-400 bg-red-50 text-red-600'
  if (tier === 'Medium') return 'border-amber-400 bg-amber-50 text-amber-700'
  return 'border-emerald-400 bg-emerald-50 text-emerald-700'
}

function toLocalDateKey(value: string) {
  const d = new Date(value)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatGeneratedLabel(timestamp: string) {
  const d = new Date(timestamp)
  return `Generated ${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
}

function initials(name: string) {
  const bits = name.split(' ').filter(Boolean)
  if (bits.length === 0) return 'NA'
  if (bits.length === 1) return bits[0].slice(0, 2).toUpperCase()
  return `${bits[0][0] ?? ''}${bits[1][0] ?? ''}`.toUpperCase()
}

function avatarGradientForRisk(tier: RiskTier) {
  if (tier === 'High') return 'from-red-600 to-orange-500'
  if (tier === 'Medium') return 'from-amber-600 to-orange-400'
  return 'from-emerald-600 to-teal-500'
}

export function AISummariesPage() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [activeNav, setActiveNav] = useState('AI Summaries')
  const [summaries, setSummaries] = useState<PatientAISummary[]>([])
  const [loading, setLoading] = useState(true)
  const [regeneratingAll, setRegeneratingAll] = useState(false)
  const [refreshingPatientId, setRefreshingPatientId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [searchText, setSearchText] = useState('')
  const [riskFilter, setRiskFilter] = useState<'ALL' | RiskTier>('ALL')

  const clinicianName = user ? `${user.firstName} ${user.lastName}` : 'Unknown User'
  const clinicianInitials = user ? `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase() : 'NA'
  const clinicianRole = user?.role === 'admin' ? 'Administrator' : 'Clinician'

  const navMain = useMemo(() => {
    if (user?.role === 'admin') {
      return ['Dashboard', 'Doctor Accounts', ...navMainBase.slice(1)]
    }
    return navMainBase
  }, [user?.role])

  const loadSummaries = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await patientService.getAISummaries()
      setSummaries(data)
    } catch (err) {
      console.error('Failed to load AI summaries:', err)
      setError('Unable to load AI summaries right now.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadSummaries()
  }, [])

  const filteredSummaries = useMemo(() => {
    const query = searchText.trim().toLowerCase()
    return summaries.filter(item => {
      const byRisk = riskFilter === 'ALL' || item.riskLevel === riskFilter
      const bySearch = query.length === 0 || item.patientName.toLowerCase().includes(query)
      return byRisk && bySearch
    })
  }, [riskFilter, searchText, summaries])

  const highCount = summaries.filter(item => item.riskLevel === 'High').length
  const mediumCount = summaries.filter(item => item.riskLevel === 'Medium').length
  const lowCount = summaries.filter(item => item.riskLevel === 'Low').length
  const todayKey = toLocalDateKey(new Date().toISOString())
  const generatedToday = summaries.filter(item => toLocalDateKey(item.generatedAt) === todayKey).length

  const handleNavClick = (item: string) => {
    setActiveNav(item)
    if (item === 'Dashboard') navigate('/dashboard')
    if (item === 'Patients') navigate('/patients')
    if (item === 'Doctor Accounts') navigate('/admin/doctors/onboard')
    if (item === 'AI Summaries') navigate('/ai-summaries')
    if (item === 'Alerts') navigate('/alerts')
    if (item === 'Schedule') navigate('/schedule')
  }

  const handleRegenerateAll = async () => {
    try {
      setRegeneratingAll(true)
      setError(null)
      await patientService.regenerateAISummaries()
      await loadSummaries()
    } catch (err) {
      console.error('Failed to regenerate AI summaries:', err)
      setError('Unable to regenerate summaries right now.')
    } finally {
      setRegeneratingAll(false)
    }
  }

  const handleRegenerateOne = async (patientId: string) => {
    try {
      setRefreshingPatientId(patientId)
      setError(null)
      await patientService.regeneratePatientAISummary(patientId)
      await loadSummaries()
    } catch (err) {
      console.error('Failed to regenerate patient summary:', err)
      setError('Unable to refresh this summary right now.')
    } finally {
      setRefreshingPatientId(null)
    }
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
                activeNav === item ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-white hover:bg-slate-800',
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
              className={clsx(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-all',
                activeNav === item ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-white hover:bg-slate-800',
              )}
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
          <h1 className="text-xl font-bold text-slate-900">AI Summaries</h1>
          <div className="flex items-center gap-2">
            <input
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              placeholder="Search patient..."
              className="w-[180px] bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600"
            />
            <button className="text-sm border border-slate-200 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-lg">📅 Date range</button>
            <button
              onClick={handleRegenerateAll}
              disabled={regeneratingAll}
              className="bg-teal-500 hover:bg-teal-600 disabled:bg-teal-300 text-white text-sm font-semibold px-4 py-2 rounded-lg"
            >
              {regeneratingAll ? 'Regenerating...' : '↺ Regenerate All'}
            </button>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto p-4 md:p-5 flex flex-col gap-3">
          <div className="flex gap-2 items-center flex-wrap">
            <input
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              placeholder="Search patient..."
              className="w-[220px] bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600"
            />
            <button
              onClick={() => setRiskFilter('ALL')}
              className={clsx('text-xs font-medium px-3 py-1.5 rounded-full border', riskFilter === 'ALL' ? 'bg-slate-100 text-slate-700 border-slate-300' : 'border-slate-200 text-slate-700')}
            >
              All Patients
            </button>
            <button
              onClick={() => setRiskFilter('High')}
              className={clsx('text-xs font-medium px-3 py-1.5 rounded-full border', riskFilter === 'High' ? 'bg-red-50 text-red-700 border-red-300' : 'border-slate-200 text-slate-700')}
            >
              🔴 High Risk
            </button>
            <button
              onClick={() => setRiskFilter('Medium')}
              className={clsx('text-xs font-medium px-3 py-1.5 rounded-full border', riskFilter === 'Medium' ? 'bg-amber-50 text-amber-700 border-amber-300' : 'border-slate-200 text-slate-700')}
            >
              🟡 Medium Risk
            </button>
            <button
              onClick={() => setRiskFilter('Low')}
              className={clsx('text-xs font-medium px-3 py-1.5 rounded-full border', riskFilter === 'Low' ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'border-slate-200 text-slate-700')}
            >
              🟢 Low Risk
            </button>
            <div className="ml-auto flex gap-2">
              <button className="text-sm border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1.5 rounded-lg">📅 Filter by date</button>
              <button
                onClick={handleRegenerateAll}
                disabled={regeneratingAll}
                className="bg-teal-500 hover:bg-teal-600 disabled:bg-teal-300 text-white text-sm font-semibold px-4 py-2 rounded-lg"
              >
                {regeneratingAll ? 'Regenerating...' : '↺ Regenerate All'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Stat title="High Risk" value={highCount} className="bg-red-50 border-red-200 text-red-600" />
            <Stat title="Medium Risk" value={mediumCount} className="bg-amber-50 border-amber-200 text-amber-700" />
            <Stat title="Low Risk" value={lowCount} className="bg-emerald-50 border-emerald-200 text-emerald-700" />
            <Stat title="Generated Today" value={generatedToday} className="bg-teal-50 border-teal-200 text-teal-700" />
          </div>

          {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}

          {loading && <div className="text-sm text-slate-600">Loading summaries...</div>}

          {!loading && filteredSummaries.length === 0 && (
            <div className="text-sm text-slate-600 bg-white border border-slate-200 rounded-lg px-4 py-3">No summaries match your filter.</div>
          )}

          {filteredSummaries.map(item => (
            <div key={item.id} className={clsx('bg-white border border-slate-200 rounded-xl p-4', item.riskLevel === 'Low' ? 'border-l-[4px] border-l-emerald-500' : item.riskLevel === 'High' ? 'border-l-[4px] border-l-red-500' : 'border-l-[4px] border-l-amber-500')}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className={clsx('w-8 h-8 rounded-full text-white text-xs font-bold flex items-center justify-center bg-gradient-to-br', avatarGradientForRisk(item.riskLevel))}>{initials(item.patientName)}</div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{item.patientName}</p>
                    <p className="text-xs text-slate-500">{formatGeneratedLabel(item.generatedAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                  <span className={clsx('text-xs font-semibold px-2 py-0.5 rounded-full border', riskTone(item.riskLevel))}>Risk: {(item.riskScore ?? 0).toFixed(2)}</span>
                  {item.riskLevel !== 'Low' && (
                    <button
                      className="text-xs bg-teal-500 text-white px-2.5 py-1 rounded-md hover:bg-teal-600"
                      onClick={() => navigate(`/patients/${item.patientId}`)}
                    >
                      📝 See Care Plan
                    </button>
                  )}
                  <button
                    onClick={() => handleRegenerateOne(item.patientId)}
                    disabled={refreshingPatientId === item.patientId}
                    className="text-xs border border-slate-200 px-2.5 py-1 rounded-md hover:bg-slate-50 disabled:text-slate-400"
                  >
                    {refreshingPatientId === item.patientId ? 'Refreshing...' : '↺ Refresh'}
                  </button>
                  <button
                    onClick={() => navigate(`/patients/${item.patientId}`)}
                    className="text-xs border border-slate-200 px-2.5 py-1 rounded-md hover:bg-slate-50"
                  >
                    👁 View Profile
                  </button>
                </div>
              </div>

              {item.riskLevel !== 'Low' && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-3">
                  <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-teal-600 mb-1">🧠 AI Explanation</p>
                  <p className="text-sm text-slate-700 leading-6">{item.summaryText}</p>
                </div>
              )}

              <div className="flex items-center gap-1.5 flex-wrap">
                {item.riskLevel !== 'Low' && <span className="text-xs font-semibold text-slate-700">Suggested Actions:</span>}
                {item.riskLevel === 'Low' && <span className="text-xs font-semibold text-emerald-700">✓ No action needed</span>}
                {item.suggestedActions.map(action => (
                  <span key={action} className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">{action}</span>
                ))}
              </div>
            </div>
          ))}
        </section>
      </main>
    </div>
  )
}

function Stat({
  title,
  value,
  className,
}: {
  title: string
  value: number
  className: string
}) {
  return (
    <div className={clsx('rounded-xl border px-4 py-3 text-center', className)}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs font-semibold">{title}</p>
    </div>
  )
}
