import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks'
import { ClinicianPatientListItem, patientService } from '../services/patientService'

type RiskLevel = 'High' | 'Medium' | 'Low'

type RiskFilter = 'All patients' | 'High' | 'Medium' | 'Low' | 'Has Alerts'

const navMain = ['Dashboard', 'Patients', 'AI Summaries', 'Alerts']
const navTools = ['Schedule']
const aiQuickFilters = ['High risk only', 'Rising BP', 'Missed meals 3+ days', 'Weight gain projected', 'Low adherence']

// AI Prompt Map
const aiPromptMap: Record<string, string> = {
  'High risk only': 'Show high-risk patients only',
  'Rising BP': 'Show patients with rising blood pressure this week',
  'Missed meals 3+ days': 'Find patients who missed meals for 3 or more days',
  'Weight gain projected': 'Find patients with projected weight gain trend',
  'Low adherence': 'Show patients with low adherence below target',
}

// side bar navigation
const navIcons: Record<string, string> = {
  Dashboard: '⊞',
  Patients: '👥',
  'AI Summaries': '🧠',
  Alerts: '🔔',
  Schedule: '📅',
}

function clsx(...tokens: Array<string | false | undefined>) {
  return tokens.filter(Boolean).join(' ')
}

function riskStyles(risk: RiskLevel | null) {
  if (risk === 'High') return { badge: 'bg-red-100 text-red-600', dot: 'text-red-500', bar: 'bg-red-500' }
  if (risk === 'Medium') return { badge: 'bg-amber-100 text-amber-700', dot: 'text-amber-500', bar: 'bg-amber-500' }
  if (risk === 'Low') return { badge: 'bg-emerald-100 text-emerald-700', dot: 'text-emerald-500', bar: 'bg-emerald-500' }
  return { badge: 'bg-slate-100 text-slate-600', dot: 'text-slate-500', bar: 'bg-slate-300' }
}

function getInitials(firstName: string, lastName: string) {
  return `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase() || 'NA'
}

function gradientFromId(id: string) {
  const gradients = [
    'from-teal-600 to-sky-500',
    'from-violet-700 to-fuchsia-500',
    'from-orange-600 to-amber-500',
    'from-emerald-600 to-green-500',
    'from-sky-600 to-cyan-400',
  ]
  const idx = Math.abs(id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % gradients.length
  return gradients[idx]
}

// schema for the list
export function PatientListPage() {
  const rowsPerPage = 8
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [activeNav, setActiveNav] = useState('Patients')
  const [searchText, setSearchText] = useState('')
  const [activeFilter, setActiveFilter] = useState<RiskFilter>('All patients')
  const [currentPage, setCurrentPage] = useState(1)
  const [patients, setPatients] = useState<ClinicianPatientListItem[]>([])
  const [openAlertsCount, setOpenAlertsCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [aiQuery, setAiQuery] = useState('')
  const [isAIFiltering, setIsAIFiltering] = useState(false)
  const [aiFilteredIds, setAiFilteredIds] = useState<string[] | null>(null)
  const [aiReasoning, setAiReasoning] = useState<string | null>(null)
  const [aiFiltersApplied, setAiFiltersApplied] = useState<string[]>([])

  const clinicianName = user ? `${user.firstName} ${user.lastName}` : 'Unknown User'
  const clinicianInitials = user ? `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase() : 'NA'
  const clinicianRole = user?.role === 'admin' ? 'Administrator' : 'Clinician'

  useEffect(() => {
    let isActive = true

    const loadPatients = async (showLoading = false) => {
      if (showLoading) {
        setIsLoading(true)
      }
      setError(null)
      try {
        const [list, summary] = await Promise.all([
          patientService.getPatientListForClinician(),
          patientService.getAlertsSummary(),
        ])
        if (isActive) {
          setPatients(list)
          setOpenAlertsCount(summary.openCount)
        }
      } catch (loadError) {
        if (isActive) {
          setError(loadError instanceof Error ? loadError.message : 'Failed to load patients')
        }
      } finally {
        if (isActive && showLoading) {
          setIsLoading(false)
        }
      }
    }

    void loadPatients(true)
    const refreshTimer = window.setInterval(() => {
      void loadPatients(false)
    }, 15000)

    return () => {
      isActive = false
      window.clearInterval(refreshTimer)
    }
  }, [])

  const filteredPatients = useMemo(() => {
    return patients.filter(patient => {
      if (aiFilteredIds && !aiFilteredIds.includes(patient.id)) {
        return false
      }

      const fullName = `${patient.firstName} ${patient.lastName}`.toLowerCase()
      const matchesSearch = `${fullName} ${patient.email}`.includes(searchText.toLowerCase())
      if (!matchesSearch) return false

      if (activeFilter === 'All patients') return true
      if (activeFilter === 'Has Alerts') return Boolean(patient.alerts) || (patient.alertsCount ?? 0) > 0
      return patient.riskLevel === activeFilter
    })
  }, [patients, aiFilteredIds, searchText, activeFilter])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchText, activeFilter])

  const totalPages = Math.max(1, Math.ceil(filteredPatients.length / rowsPerPage))

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const paginatedPatients = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage
    return filteredPatients.slice(start, start + rowsPerPage)
  }, [filteredPatients, currentPage, rowsPerPage])

  const pageStart = filteredPatients.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1
  const pageEnd = filteredPatients.length === 0 ? 0 : Math.min(currentPage * rowsPerPage, filteredPatients.length)

  const handleNavClick = (item: string) => {
    setActiveNav(item)
    if (item === 'Dashboard') navigate('/dashboard')
    if (item === 'Patients') navigate('/patients')
    if (item === 'AI Summaries') navigate('/ai-summaries')
    if (item === 'Schedule') navigate('/schedule')
    if (item === 'Alerts') navigate('/alerts')
  }

  // clear filter
  const clearAIFilter = () => {
    setAiQuery('')
    setAiFilteredIds(null)
    setAiReasoning(null)
    setAiFiltersApplied([])
    setActiveFilter('All patients')
    setSearchText('')
  }

  const applyAIFilter = async (queryOverride?: string) => {
    const queryToRun = (queryOverride ?? aiQuery).trim()
    if (!queryToRun) {
      clearAIFilter()
      return
    }

    try {
      setIsAIFiltering(true)
      setError(null)
      setAiQuery(queryToRun)
      const result = await patientService.filterPatientsWithAI(queryToRun)
      setAiFilteredIds(result.matchingPatientIds)
      setAiReasoning(result.reasoning || null)
      setAiFiltersApplied(result.filtersApplied || [])
      setCurrentPage(1)
    } catch (filterError) {
      setError(filterError instanceof Error ? filterError.message : 'Unable to apply AI filter right now')
    } finally {
      setIsAIFiltering(false)
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
              {item === 'Alerts' && (
                <span className="ml-auto bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">{openAlertsCount}</span>
              )}
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

      <main className="flex-1 flex flex-col overflow-hidden min-h-0">
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
          <h1 className="text-xl font-bold text-slate-900">Patients</h1>
          <div className="flex items-center gap-2">
            <div className="w-[220px] bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-500 flex items-center gap-2">
              <span>🔍</span>
              <input
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                placeholder="Search patients..."
                className="bg-transparent outline-none w-full"
              />
            </div>
            <button
              onClick={() => navigate('/patients/onboard')}
              className="bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold px-4 py-2 rounded-lg"
            >
              + Onboard Patient
            </button>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto p-4 md:p-5 flex flex-col gap-3 min-h-0">
          <div className="rounded-xl bg-slate-900 border border-slate-800 px-4 py-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-teal-500 rounded-md flex items-center justify-center text-xs">🤖</div>
                <p className="text-sm font-bold text-white">AI Patient Filter</p>
                <span className="text-[10px] bg-teal-900/60 text-teal-300 px-2 py-0.5 rounded-full font-semibold">BETA</span>
              </div>
              <p className="text-xs text-white/40">Ask in plain English to filter patients</p>
            </div>

            <div className="mt-2 rounded-lg bg-white/5 border border-white/10 px-3 py-2">
              <div className="flex gap-2 items-center">
                <span className="text-sm text-white/80">💬</span>
                <input
                  value={aiQuery}
                  onChange={event => setAiQuery(event.target.value)}
                  onKeyDown={event => {
                    if (event.key === 'Enter') {
                      void applyAIFilter()
                    }
                  }}
                  placeholder="Show me high-risk patients with rising blood pressure this week"
                  className="w-full bg-transparent text-sm text-white placeholder:text-white/40 outline-none"
                />
                <button
                  onClick={() => void applyAIFilter()}
                  disabled={isAIFiltering}
                  className="text-xs font-semibold bg-teal-500 hover:bg-teal-600 disabled:bg-teal-400 text-white px-2.5 py-1 rounded-md"
                >
                  {isAIFiltering ? 'Filtering...' : 'Run'}
                </button>
              </div>
            </div>

            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {aiQuickFilters.map(chip => (
                <button
                  key={chip}
                  onClick={() => void applyAIFilter(aiPromptMap[chip])}
                  className="text-xs rounded-full bg-white/10 text-teal-100 px-2.5 py-1 hover:bg-white/20"
                >
                  {chip}
                </button>
              ))}
            </div>

            <div className="mt-2.5 bg-white/5 rounded-lg px-3 py-2 flex items-center justify-between gap-2">
              <p className="text-sm text-white/70">
                {aiReasoning
                  ? `AI: ${aiReasoning}`
                  : 'List populated from clinician assignments with backend risk and adherence metrics.'}
              </p>
              <button onClick={clearAIFilter} className="text-xs text-teal-300 hover:text-teal-200">Clear filter</button>
            </div>

            {aiFiltersApplied.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {aiFiltersApplied.map(filter => (
                  <span key={filter} className="text-[11px] rounded-full bg-teal-900/70 text-teal-100 px-2 py-0.5">
                    {filter}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-1.5 flex-wrap items-center">
            <span className="text-sm text-slate-500 font-semibold mr-1">Filter:</span>
            <FilterChip label="All patients" selected={activeFilter === 'All patients'} onClick={() => setActiveFilter('All patients')} />
            <FilterChip label="🔴 High Risk" selected={activeFilter === 'High'} onClick={() => setActiveFilter('High')} outlined />
            <FilterChip label="🟠 Medium" selected={activeFilter === 'Medium'} onClick={() => setActiveFilter('Medium')} outlined />
            <FilterChip label="🟢 Low" selected={activeFilter === 'Low'} onClick={() => setActiveFilter('Low')} outlined />
            <FilterChip label="⚠️ Has Alerts" selected={activeFilter === 'Has Alerts'} onClick={() => setActiveFilter('Has Alerts')} outlined />
          </div>

          {error && <div className="text-sm font-medium text-red-600">{error}</div>}

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col flex-1 min-h-0">
            <div className="overflow-auto flex-1 min-h-0">
              <table className="w-full min-w-[860px]">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {['Patient', 'Age', 'Risk Level', 'Adherence', 'Alerts', 'Actions'].map(column => (
                      <th key={column} className="text-left text-xs font-semibold text-slate-500 px-4 py-3">{column}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr><td className="px-4 py-6 text-sm text-slate-500" colSpan={6}>Loading patients...</td></tr>
                  ) : filteredPatients.length === 0 ? (
                    <tr><td className="px-4 py-6 text-sm text-slate-500" colSpan={6}>No patients found for this filter.</td></tr>
                  ) : (
                    paginatedPatients.map(patient => {
                      const styles = riskStyles(patient.riskLevel)
                      const hasAlert = Boolean(patient.alerts)
                      const adherencePercent = patient.adherence ?? 0
                      const adherenceLabel = patient.adherence == null ? 'not updated' : `${patient.adherence}%`

                      return (
                        <tr key={patient.id} className="border-b border-slate-100 last:border-b-0">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className={clsx('w-8 h-8 rounded-full bg-gradient-to-br text-white text-xs font-bold flex items-center justify-center', gradientFromId(patient.id))}>{getInitials(patient.firstName, patient.lastName)}</div>
                              <div>
                                <p className="text-sm font-semibold text-slate-800">{patient.firstName} {patient.lastName}</p>
                                <p className="text-xs text-slate-500">{patient.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-700">{patient.age ?? 'Null'}</td>
                          <td className="px-4 py-3">
                            <span className={clsx('text-xs font-semibold px-2 py-0.5 rounded-full', styles.badge)}>
                              <span className={styles.dot}>●</span> {patient.riskLevel ?? 'Null'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="w-20">
                              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-1">
                                <div className={clsx('h-full rounded-full', styles.bar)} style={{ width: `${adherencePercent}%` }} />
                              </div>
                              <p className="text-[10px] text-slate-500">{adherenceLabel}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col items-start gap-1.5">
                              <span className={clsx(
                                'text-xs font-semibold px-2 py-0.5 rounded-full',
                                !hasAlert && 'bg-slate-100 text-slate-500',
                                patient.riskLevel === 'High' && hasAlert && 'bg-red-100 text-red-600',
                                patient.riskLevel === 'Medium' && hasAlert && 'bg-amber-100 text-amber-700',
                              )}>
                                <button
                                onClick={() => navigate(`/alerts?patientId=${encodeURIComponent(patient.id)}`)}
                                className="text-xs border border-amber-200 bg-amber-50 text-amber-700 px-2.5 py-1 rounded-md hover:bg-amber-100"
                              >
                                Alerts ({patient.alertsCount ?? 0})
                              </button>
              
                              </span>
                              
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => navigate(`/patients/${patient.id}?tab=overview`)}
                                className="text-xs border border-slate-200 px-2.5 py-1 rounded-md hover:bg-slate-50"
                              >
                                View Profile
                              </button>
                              <button
                                onClick={() => navigate(`/patients/${patient.id}?tab=care-plan`)}
                                className="text-xs bg-teal-500 text-white px-2.5 py-1 rounded-md hover:bg-teal-600"
                              >
                                Care Plan
                              </button>
                              <button
                                onClick={() => navigate(`/patients/${patient.id}?tab=ai-summary`)}
                                className="text-xs border border-slate-200 px-2.5 py-1 rounded-md hover:bg-slate-50"
                              >
                                AI summary
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-4 py-3 flex items-center justify-between border-t border-slate-200 bg-slate-50">
              <p className="text-sm text-slate-500">
                Showing {pageStart}-{pageEnd} of {filteredPatients.length} filtered ({patients.length} total)
              </p>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className={clsx(
                    'text-xs border px-2.5 py-1 rounded-md',
                    currentPage === 1 ? 'border-slate-200 text-slate-300 cursor-not-allowed' : 'border-slate-200 hover:bg-white',
                  )}
                >
                  ◀ Prev
                </button>

                {Array.from({ length: totalPages }, (_, index) => index + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={clsx(
                      'text-xs px-2.5 py-1 rounded-md border',
                      currentPage === page ? 'bg-teal-500 text-white border-teal-500' : 'border-slate-200 hover:bg-white text-slate-700',
                    )}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className={clsx(
                    'text-xs border px-2.5 py-1 rounded-md',
                    currentPage === totalPages ? 'border-slate-200 text-slate-300 cursor-not-allowed' : 'border-slate-200 hover:bg-white',
                  )}
                >
                  Next ▶
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

// pagination UI
function FilterChip({
  label,
  selected,
  onClick,
  outlined,
}: {
  label: string
  selected: boolean
  onClick: () => void
  outlined?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'text-xs font-medium px-2.5 py-1 rounded-full transition',
        selected && 'bg-slate-900 text-white',
        !selected && outlined && 'border border-slate-200 text-slate-600 hover:bg-slate-50',
        !selected && !outlined && 'bg-slate-100 text-slate-700 hover:bg-slate-200',
      )}
    >
      {label}
    </button>
  )
}
