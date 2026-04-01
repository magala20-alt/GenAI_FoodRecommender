import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '../hooks'

type AlertPriority = 'High' | 'Medium' | 'Low'
type AlertStatus = 'Open' | 'Resolved'

type AlertItem = {
  id: number
  patientName: string
  patientMeta: string
  initials: string
  avatarGradient: string
  type: string
  details: string
  triggered: string
  priority: AlertPriority
  status: AlertStatus
  actions: string[]
}

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

const alerts: AlertItem[] = [
  {
    id: 1,
    patientName: 'Sarah Mensah',
    patientMeta: 'Age 42 · Type 2',
    initials: 'SM',
    avatarGradient: 'from-teal-600 to-sky-500',
    type: '🔴 High Disengagement',
    details: 'Risk score 0.87 · Meals missed 4 days · 3 app sessions in 7d',
    triggered: 'Today · 08:14',
    priority: 'High',
    status: 'Open',
    actions: ['Intervene', 'View'],
  },
  {
    id: 2,
    patientName: 'James Tekeba',
    patientMeta: 'Age 57 · Type 2',
    initials: 'JT',
    avatarGradient: 'from-violet-700 to-fuchsia-500',
    type: '🔴 Rising BP',
    details: 'Systolic 142 mmHg · Threshold 140 · 3 consecutive readings',
    triggered: 'Today · 07:55',
    priority: 'High',
    status: 'Open',
    actions: ['Intervene', 'View'],
  },
  {
    id: 3,
    patientName: 'David Osei',
    patientMeta: 'Age 64 · Type 2',
    initials: 'DO',
    avatarGradient: 'from-emerald-600 to-green-500',
    type: '🔴 Glucose Spike',
    details: 'Fasting glucose 11.8 mmol/L · Above threshold 11.0',
    triggered: 'Yesterday · 22:10',
    priority: 'High',
    status: 'Open',
    actions: ['Intervene', 'View'],
  },
  {
    id: 4,
    patientName: 'Priya Krishnan',
    patientMeta: 'Age 38 · Type 2',
    initials: 'PK',
    avatarGradient: 'from-orange-600 to-amber-500',
    type: '🟡 Weight Gain Projected',
    details: '+1.4 kg forecast over 14 days · Caloric excess +18%',
    triggered: 'Yesterday · 09:30',
    priority: 'Medium',
    status: 'Open',
    actions: ['Note', 'View'],
  },
  {
    id: 5,
    patientName: 'Amina Nkosi',
    patientMeta: 'Age 45 · Type 2',
    initials: 'AN',
    avatarGradient: 'from-sky-600 to-cyan-400',
    type: '🟡 Missed Appointment',
    details: 'Check-in scheduled Mar 3 not attended · Rebook needed',
    triggered: 'Mar 3 · 14:00',
    priority: 'Medium',
    status: 'Open',
    actions: ['Rebook', 'View'],
  },
  {
    id: 6,
    patientName: 'Sarah Mensah',
    patientMeta: 'Age 42 · Type 2',
    initials: 'SM',
    avatarGradient: 'from-teal-600 to-sky-500',
    type: '🟢 Resolved',
    details: 'Meal plan regenerated · Patient re-engaged',
    triggered: 'Mar 4 · 11:20',
    priority: 'Low',
    status: 'Resolved',
    actions: [],
  },
]

function clsx(...tokens: Array<string | false | undefined>) {
  return tokens.filter(Boolean).join(' ')
}

function badgeForPriority(priority: AlertPriority) {
  if (priority === 'High') return 'bg-red-100 text-red-600'
  if (priority === 'Medium') return 'bg-amber-100 text-amber-700'
  return 'bg-slate-100 text-slate-600'
}

function statusBadge(status: AlertStatus) {
  return status === 'Resolved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
}

function rowBorder(priority: AlertPriority) {
  if (priority === 'High') return 'border-l-red-500'
  if (priority === 'Medium') return 'border-l-amber-500'
  return 'border-l-slate-300'
}

export function AlertsPage() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [activeNav, setActiveNav] = useState('Alerts')

  const clinicianName = user ? `${user.firstName} ${user.lastName}` : 'Unknown User'
  const clinicianInitials = user ? `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase() : 'NA'
  const clinicianRole = user?.role === 'admin' ? 'Administrator' : 'Clinician'

  const navMain = useMemo(() => {
    if (user?.role === 'admin') {
      return ['Dashboard', 'Doctor Accounts', ...navMainBase.slice(1)]
    }
    return navMainBase
  }, [user?.role])

  const activeCount = alerts.filter(alert => alert.status === 'Open').length
  const highCount = alerts.filter(alert => alert.priority === 'High' && alert.status === 'Open').length
  const mediumCount = alerts.filter(alert => alert.priority === 'Medium' && alert.status === 'Open').length
  const lowCount = alerts.filter(alert => alert.priority === 'Low').length
  const resolvedToday = 2

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
            <p className="text-xs text-slate-500 mt-0.5">{activeCount} active · {resolvedToday} resolved today</p>
          </div>

          <div className="flex items-center gap-2">
            <button className="text-xs border border-red-200 text-red-600 bg-red-50 px-2.5 py-1 rounded-full">🔴 High</button>
            <button className="text-xs border border-amber-200 text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">🟡 Medium</button>
            <button className="text-xs border border-emerald-200 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">🟢 Low</button>
            <button className="text-sm border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1.5 rounded-lg">✓ Resolve All</button>
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
              <p className="text-2xl font-bold text-slate-600">{resolvedToday}</p>
              <p className="text-xs font-semibold text-slate-500">Resolved Today</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden flex-1 min-h-[360px]">
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-2">
              <h2 className="text-sm font-bold text-slate-900">Active Alerts</h2>
              <div className="w-[210px] bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-500">🔍 Search patient...</div>
            </div>

            <div className="overflow-auto h-full">
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
                  {alerts.map(alert => (
                    <tr
                      key={alert.id}
                      className={clsx(
                        'border-b border-slate-100 last:border-b-0 border-l-[3px]',
                        rowBorder(alert.priority),
                        alert.status === 'Resolved' && 'opacity-60',
                      )}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className={clsx('w-8 h-8 rounded-full text-white text-xs font-bold flex items-center justify-center bg-gradient-to-br', alert.avatarGradient)}>{alert.initials}</div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{alert.patientName}</p>
                            <p className="text-xs text-slate-500">{alert.patientMeta}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold text-slate-700">{alert.type}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">{alert.details}</td>
                      <td className="px-4 py-3 text-xs text-slate-700 whitespace-nowrap">{alert.triggered}</td>
                      <td className="px-4 py-3">
                        <span className={clsx('text-xs font-semibold px-2 py-0.5 rounded-full', badgeForPriority(alert.priority))}>{alert.priority}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={clsx('text-xs font-semibold px-2 py-0.5 rounded-full', statusBadge(alert.status))}>{alert.status}</span>
                      </td>
                      <td className="px-4 py-3">
                        {alert.actions.length > 0 ? (
                          <div className="flex gap-1.5">
                            {alert.actions.map(action => (
                              <button
                                key={action}
                                className={clsx(
                                  'text-xs px-2.5 py-1 rounded-md border',
                                  action === 'Intervene'
                                    ? 'bg-teal-500 border-teal-500 text-white hover:bg-teal-600'
                                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50',
                                )}
                              >
                                {action}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500">No action needed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}