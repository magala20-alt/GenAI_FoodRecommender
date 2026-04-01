import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '../hooks'

type ScheduleItem = {
  id: number
  time: string
  period: 'AM' | 'PM'
  title: string
  detail: string
  borderColor: string
  badge?: {
    label: string
    className: string
  }
}

type TodoItem = {
  id: number
  label: string
  done: boolean
  badge?: {
    label: string
    className: string
  }
}

const navMain = ['Dashboard', 'Patients', 'AI Summaries', 'Alerts']
const navTools = ['Schedule']

const navIcons: Record<string, string> = {
  Dashboard: '⊞',
  Patients: '👥',
  'AI Summaries': '🧠',
  Alerts: '🔔',
  Schedule: '📅',
}

const scheduleItems: ScheduleItem[] = [
  {
    id: 1,
    time: '09:00',
    period: 'AM',
    title: 'Check-in · Sarah Mensah',
    detail: 'Video call · 30 min · Join →',
    borderColor: 'border-teal-500',
    badge: { label: 'Now', className: 'bg-teal-100 text-teal-700' },
  },
  {
    id: 2,
    time: '11:30',
    period: 'AM',
    title: 'Review · James Tekeba',
    detail: 'In-person · Room 4B · 45 min',
    borderColor: 'border-amber-500',
    badge: { label: 'In 2h', className: 'bg-amber-100 text-amber-700' },
  },
  {
    id: 3,
    time: '02:00',
    period: 'PM',
    title: 'Follow-up · Priya Krishnan',
    detail: 'Phone call · 20 min',
    borderColor: 'border-slate-400',
  },
  {
    id: 4,
    time: '04:30',
    period: 'PM',
    title: 'New patient onboarding · Ruth Boateng',
    detail: 'In-person · 60 min',
    borderColor: 'border-slate-400',
  },
]

const todoItems: TodoItem[] = [
  { id: 1, label: 'Review David O. glucose report', done: true },
  { id: 2, label: 'Send intervention note to Sarah M.', done: false, badge: { label: 'Urgent', className: 'bg-red-100 text-red-600' } },
  { id: 3, label: 'Update Priya K. calorie targets', done: false, badge: { label: 'Today', className: 'bg-amber-100 text-amber-700' } },
  { id: 4, label: 'Generate AI summaries batch', done: true },
]

function clsx(...tokens: Array<string | false | undefined>) {
  return tokens.filter(Boolean).join(' ')
}

export function SchedulePage() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [activeNav, setActiveNav] = useState('Schedule')

  const clinicianName = user ? `${user.firstName} ${user.lastName}` : 'Unknown User'
  const clinicianInitials = user ? `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase() : 'NA'
  const clinicianRole = user?.role === 'admin' ? 'Administrator' : 'Clinician'
  const monthLabel = 'March 2026'

  const navMainResolved = useMemo(() => {
    if (user?.role === 'admin') {
      return ['Dashboard', 'Doctor Accounts', 'Patients', 'AI Summaries', 'Alerts']
    }
    return navMain
  }, [user?.role])

  const navIconsResolved: Record<string, string> = {
    ...navIcons,
    'Doctor Accounts': '🩺',
  }

  const handleNavClick = (item: string) => {
    setActiveNav(item)
    if (item === 'Dashboard') navigate('/dashboard')
    if (item === 'Doctor Accounts') navigate('/admin/doctors/onboard')
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
          {navMainResolved.map(item => (
            <button
              key={item}
              onClick={() => handleNavClick(item)}
              className={clsx(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-all',
                activeNav === item ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-white hover:bg-slate-800',
              )}
            >
              <span>{navIconsResolved[item]}</span>
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
          <h1 className="text-xl font-bold text-slate-900">Schedule</h1>
          <div className="flex items-center gap-2">
            <button className="text-sm border border-slate-200 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-lg">← March 2026 →</button>
            <button className="bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold px-4 py-2 rounded-lg">+ Add Appointment</button>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto p-4 md:p-5 flex flex-col gap-3">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-slate-900">{monthLabel}</h2>
                <div className="flex gap-1.5">
                  <button className="w-7 h-7 bg-slate-50 border border-slate-200 rounded-md text-sm">‹</button>
                  <button className="w-7 h-7 bg-slate-50 border border-slate-200 rounded-md text-sm">›</button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1 mb-1.5 text-[10.5px] font-bold text-slate-500">
                {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(day => (
                  <div key={day} className="text-center py-1">{day}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1 text-[12.5px]">
                {['24', '25', '26', '27', '28', '1', '2'].map(d => (
                  <div key={d} className="text-center py-1.5 text-slate-400">{d}</div>
                ))}

                <div className="text-center py-1.5">3</div>
                <div className="text-center py-1.5">4</div>
                <div className="flex justify-center py-1">
                  <span className="w-[30px] h-[30px] rounded-full bg-teal-500 text-white text-[12px] font-bold flex items-center justify-center">5</span>
                </div>
                <div className="text-center py-1.5">
                  6
                  <div className="w-1 h-1 bg-amber-500 rounded-full mx-auto mt-0.5" />
                </div>
                <div className="text-center py-1.5">
                  7
                  <div className="w-1 h-1 bg-teal-500 rounded-full mx-auto mt-0.5" />
                </div>
                <div className="text-center py-1.5">8</div>
                <div className="text-center py-1.5">9</div>

                <div className="text-center py-1.5">10</div>
                <div className="text-center py-1.5">11</div>
                <div className="text-center py-1.5">
                  12
                  <div className="w-1 h-1 bg-red-500 rounded-full mx-auto mt-0.5" />
                </div>
                <div className="text-center py-1.5">13</div>
                <div className="text-center py-1.5">14</div>
                <div className="text-center py-1.5">15</div>
                <div className="text-center py-1.5">16</div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <h3 className="text-sm font-bold text-slate-900 mb-3">📅 Wednesday, 5 March</h3>
                <div className="flex flex-col gap-2">
                  {scheduleItems.map(item => (
                    <div key={item.id} className={clsx('border-l-[3px] border border-slate-100 rounded-lg px-3 py-2 flex items-start gap-2.5', item.borderColor)}>
                      <div className="w-10 shrink-0 leading-tight">
                        <p className="text-sm font-bold text-slate-800">{item.time}</p>
                        <p className="text-[10px] text-slate-500">{item.period}</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                        <p className="text-xs text-slate-500">{item.detail}</p>
                      </div>
                      {item.badge && (
                        <span className={clsx('text-xs font-semibold px-2 py-0.5 rounded-full shrink-0', item.badge.className)}>{item.badge.label}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <h3 className="text-sm font-bold text-slate-900 mb-3">✅ To-Do Today</h3>
                <div className="flex flex-col gap-2">
                  {todoItems.map(item => (
                    <div key={item.id} className="flex items-center gap-2 border border-slate-100 rounded-lg px-2.5 py-2">
                      <div className={clsx('w-4 h-4 rounded border flex items-center justify-center text-[10px]', item.done ? 'bg-teal-500 border-teal-500 text-white' : 'border-slate-300')}>
                        {item.done ? '✓' : ''}
                      </div>
                      <span className={clsx('text-sm flex-1', item.done ? 'line-through text-slate-500' : 'font-medium text-slate-800')}>
                        {item.label}
                      </span>
                      {item.badge && (
                        <span className={clsx('text-[10px] font-semibold px-2 py-0.5 rounded-full', item.badge.className)}>{item.badge.label}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
