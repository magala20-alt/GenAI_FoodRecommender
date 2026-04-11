import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { useAuth } from '../hooks'
import { patientService, type AlertsSummary, type PatientAlert } from '../services/patientService'

type AlertPriority = 'High' | 'Medium' | 'Low'
type AlertStatus = 'Open' | 'Dismissed'

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

function badgeForPriority(priority: AlertPriority) {
  if (priority === 'High') return 'bg-red-100 text-red-600'
  if (priority === 'Medium') return 'bg-amber-100 text-amber-700'
  return 'bg-slate-100 text-slate-600'
}

function statusBadge(status: AlertStatus) {
  return status === 'Dismissed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
}

function rowBorder(priority: AlertPriority) {
  if (priority === 'High') return 'border-l-red-500'
  if (priority === 'Medium') return 'border-l-amber-500'
  return 'border-l-slate-300'
}

export function AlertsPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, logout } = useAuth()
  const [activeNav, setActiveNav] = useState('Alerts')
  const [alerts, setAlerts] = useState<PatientAlert[]>([])
  const [summary, setSummary] = useState<AlertsSummary>({ openCount: 0, highCount: 0, mediumCount: 0, lowCount: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchText, setSearchText] = useState('')
  const [dismissingIds, setDismissingIds] = useState<Record<string, boolean>>({})

  const clinicianName = user ? `${user.firstName} ${user.lastName}` : 'Unknown User'
  const clinicianInitials = user ? `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase() : 'NA'
  const clinicianRole = user?.role === 'admin' ? 'Administrator' : 'Clinician'

  const navMain = useMemo(() => {
    if (user?.role === 'admin') {
      return ['Dashboard', 'Doctor Accounts', ...navMainBase.slice(1)]
    }
    return navMainBase
  }, [user?.role])

  const patientFilterId = searchParams.get('patientId')

  useEffect(() => {
    let isActive = true
    const load = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const [alertsResp, summaryResp] = await Promise.all([
          patientService.getAlerts(patientFilterId ?? undefined),
          patientService.getAlertsSummary(),
        ])
        if (!isActive) return
        setAlerts(alertsResp)
        setSummary(summaryResp)
      } catch (loadError) {
        if (!isActive) return
        const message = loadError instanceof Error ? loadError.message : 'Failed to load alerts'
        setError(message)
      } finally {
        if (isActive) setIsLoading(false)
      }
    }
    void load()
    return () => {
      isActive = false
    }
  }, [patientFilterId])

  const filteredAlerts = useMemo(() => {
    const q = searchText.trim().toLowerCase()
    if (!q) return alerts
    return alerts.filter(alert => {
      const haystack = [alert.patientName, alert.alertType, alert.message, alert.llmReason ?? '', alert.severity, alert.status].join(' ').toLowerCase()
      return haystack.includes(q)
    })
  }, [alerts, searchText])

  const activeCount = summary.openCount
  const highCount = summary.highCount
  const mediumCount = summary.mediumCount
  const lowCount = summary.lowCount

  const dismissedCount = useMemo(() => alerts.filter(alert => alert.status === 'Dismissed').length, [alerts])

  const formatTriggered = (iso: string) => {
    const date = new Date(iso)
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const toPriority = (p: PatientAlert['severity']): AlertPriority => {
    if (p === 'High') return 'High'
    if (p === 'Medium') return 'Medium'
    return 'Low'
  }

  const toStatus = (s: PatientAlert['status']): AlertStatus => {
    return s === 'Dismissed' ? 'Dismissed' : 'Open'
  }

  const handleDismiss = async (alertId: number | string) => {
    const key = String(alertId)
    try {
      setDismissingIds(prev => ({ ...prev, [key]: true }))
      await patientService.dismissAlert(alertId)
      const [alertsResp, summaryResp] = await Promise.all([
        patientService.getAlerts(patientFilterId ?? undefined),
        patientService.getAlertsSummary(),
      ])
      setAlerts(alertsResp)
      setSummary(summaryResp)
    } catch (dismissError) {
      const message = dismissError instanceof Error ? dismissError.message : 'Failed to dismiss alert'
      setError(message)
    } finally {
      setDismissingIds(prev => ({ ...prev, [key]: false }))
    }
  }

  const handleNavClick = (item: string) => {
    setActiveNav(item)
    if (item === 'Dashboard') navigate('/dashboard')
    if (item === 'Patients') navigate('/patients')
    if (item === 'Doctor Accounts') navigate('/admin/doctors/onboard')
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
                activeNav === item ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-white hover:bg-slate-800',
              )}
            >
              <span>{navIcons[item]}</span>
              <span>{item}</span>
              {item === 'Alerts' && (
                <span className="ml-auto bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">{activeCount}</span>
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

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Alerts</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {activeCount} active · {dismissedCount} dismissed
              {patientFilterId ? ' · filtered by patient' : ''}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button className="text-xs border border-red-200 text-red-600 bg-red-50 px-2.5 py-1 rounded-full">🔴 High</button>
            <button className="text-xs border border-amber-200 text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">🟡 Medium</button>
            <button className="text-xs border border-emerald-200 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">🟢 Low</button>
            {patientFilterId && (
              <button
                onClick={() => navigate('/alerts')}
                className="text-sm border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1.5 rounded-lg"
              >
                Clear Filter
              </button>
            )}
          </div>
        </header>

        <section className="flex-1 overflow-y-auto p-4 md:p-5 flex flex-col gap-3">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center">
              <p className="text-2xl font-bold text-red-600">{highCount}</p>
              <p className="text-xs font-semibold text-red-600">High Priority</p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-center">
              <p className="text-2xl font-bold text-amber-700">{mediumCount}</p>
              <p className="text-xs font-semibold text-amber-700">Medium</p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center">
              <p className="text-2xl font-bold text-emerald-700">{lowCount}</p>
              <p className="text-xs font-semibold text-emerald-700">Low / Info</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-center">
              <p className="text-2xl font-bold text-slate-600">{dismissedCount}</p>
              <p className="text-xs font-semibold text-slate-500">Dismissed</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden flex-1 min-h-[360px]">
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-2">
              <h2 className="text-sm font-bold text-slate-900">Active Alerts</h2>
              <input
                value={searchText}
                onChange={event => setSearchText(event.target.value)}
                placeholder="Search patient or reason..."
                className="w-[260px] bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="overflow-auto h-full">
              {isLoading && <div className="px-4 py-6 text-sm text-slate-500">Loading alerts...</div>}
              {error && <div className="px-4 py-6 text-sm text-red-600">{error}</div>}
              {!isLoading && !error && filteredAlerts.length === 0 && (
                <div className="px-4 py-6 text-sm text-slate-500">No alerts found.</div>
              )}
              <table className="w-full min-w-[980px] text-sm">
                <thead className="bg-white border-b border-slate-200">
                  <tr className="text-left text-xs uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-2.5">Patient</th>
                    <th className="px-4 py-2.5">Alert Type</th>
                    <th className="px-4 py-2.5">Details</th>
                    <th className="px-4 py-2.5">Triggered</th>
                    <th className="px-4 py-2.5">Priority</th>
                    <th className="px-4 py-2.5">Status</th>
                    <th className="px-4 py-2.5">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAlerts.map(alert => {
                    const priority = toPriority(alert.severity)
                    const status = toStatus(alert.status)
                    return (
                    <tr
                      key={alert.id}
                      className={clsx(
                        'border-b border-slate-100 last:border-b-0 border-l-[3px]',
                        rowBorder(priority),
                        status === 'Dismissed' && 'opacity-60',
                      )}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full text-white text-xs font-bold flex items-center justify-center bg-gradient-to-br from-teal-600 to-sky-500">
                            {alert.patientName
                              .split(' ')
                              .map(part => part[0] ?? '')
                              .join('')
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{alert.patientName}</p>
                            <p className="text-xs text-slate-500">{alert.patientId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold text-slate-700">{alert.alertType}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">{alert.llmReason ?? alert.message}</td>
                      <td className="px-4 py-3 text-xs text-slate-700 whitespace-nowrap">{formatTriggered(alert.createdAt)}</td>
                      <td className="px-4 py-3">
                        <span className={clsx('text-xs font-semibold px-2 py-0.5 rounded-full', badgeForPriority(priority))}>{priority}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={clsx('text-xs font-semibold px-2 py-0.5 rounded-full', statusBadge(status))}>{status}</span>
                      </td>
                      <td className="px-4 py-3">
                        {status === 'Open' ? (
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => navigate(`/patients/${alert.patientId}?tab=care-plan`)}
                              className="text-xs px-2.5 py-1 rounded-md border bg-teal-500 border-teal-500 text-white hover:bg-teal-600"
                            >
                              See Care Plan
                            </button>
                            <button
                              onClick={() => handleDismiss(alert.id)}
                              disabled={Boolean(dismissingIds[String(alert.id)])}
                              className="text-xs px-2.5 py-1 rounded-md border bg-white border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-60"
                            >
                              {dismissingIds[String(alert.id)] ? 'Dismissing...' : 'Dismiss'}
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500">No action needed</span>
                        )}
                      </td>
                    </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}