import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks'
import { patientService } from '../services/patientService'
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

export function DashboardPage() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [activeNav, setActiveNav] = useState('Dashboard')
  const [patientCount, setPatientCount] = useState(0)
  const [isLoadingPatients, setIsLoadingPatients] = useState(true)
  const clinicianName = user ? `${user.firstName} ${user.lastName}` : 'Unknown User'
  const clinicianInitials = user ? `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase() : 'NA'
  const clinicianRole = user?.role === 'admin' ? 'Administrator' : 'Clinician'
  const navMain = user?.role === 'admin'
    ? ['Dashboard', 'Doctor Accounts', 'Patients', 'AI Summaries', 'Alerts']
    : ['Dashboard', 'Patients', 'AI Summaries', 'Alerts']

  const handleNavClick = (item: string) => {
    setActiveNav(item)
    if (item === 'Dashboard') navigate('/dashboard')
    if (item === 'Doctor Accounts') navigate('/admin/doctors/onboard')
    if (item === 'Patients') navigate('/patients')
    if (item === 'AI Summaries') navigate('/ai-summaries')
    if (item === 'Schedule') navigate('/schedule')
    if (item === 'Alerts') navigate('/alerts')
  }

  useEffect(() => {
    const loadPatientCount = async () => {
      setIsLoadingPatients(true)
      try {
        const list = await patientService.getPatientListForClinician()
        setPatientCount(list.length)
      } catch {
        setPatientCount(0)
      } finally {
        setIsLoadingPatients(false)
      }
    }

    loadPatientCount()
  }, [])

  const statCards = useMemo(() => {
    return [
      {
        icon: '👥',
        value: isLoadingPatients ? 'Loading...' : String(patientCount),
        label: 'Total Patients',
        delta: 'Populated from clinician assignments',
        deltaTone: 'text-emerald-600',
      },
      {
        icon: '🍽',
        value: 'Null',
        label: 'Active Plans Today',
        delta: 'Meal plan tracking not connected yet',
        deltaTone: 'text-slate-500',
      },
      {
        icon: '⚠️',
        value: 'Null',
        label: 'Pending Interventions',
        delta: 'Intervention queue not connected yet',
        valueTone: 'text-slate-600',
        deltaTone: 'text-slate-500',
      },
      {
        icon: '🚨',
        value: 'Null',
        label: 'Active Alerts',
        delta: 'No alerts yet',
        valueTone: 'text-slate-600',
        deltaTone: 'text-slate-500',
      },
      {
        icon: '🧠',
        value: 'Null',
        label: 'AI Summaries',
        delta: 'AI summary generation not connected yet',
        valueTone: 'text-slate-600',
        deltaTone: 'text-slate-500',
      },
    ]
  }, [isLoadingPatients, patientCount])

  const totalPatients = patientCount

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
                <span className="ml-auto bg-slate-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">0</span>
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
            <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-xs text-slate-500 mt-0.5">Wednesday, 5 March 2026</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="w-8 h-8 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center text-sm">🔔</button>
            <button
              onClick={() => navigate(user?.role === 'admin' ? '/admin/doctors/onboard' : '/patients/onboard')}
              className="bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold px-4 py-2 rounded-lg"
            >
              {user?.role === 'admin' ? '+ Onboard Doctor' : '+ Onboard Patient'}
            </button>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto p-4 md:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3 mb-4">
            {statCards.map(card => (
              <div key={card.label} className="bg-white border border-slate-200 rounded-xl p-4">
                <div className="text-lg mb-1">{card.icon}</div>
                <div className={clsx('text-2xl font-bold text-slate-900', card.valueTone)}>{card.value}</div>
                <div className="text-xs text-slate-500 mt-0.5">{card.label}</div>
                <div className={clsx('text-xs font-semibold mt-1', card.deltaTone)}>{card.delta}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 xl:h-[530px]">
            <div className="flex flex-col gap-3 overflow-hidden">
              <div className="bg-white border border-slate-200 rounded-xl p-4 flex-1 overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                  <button onClick={() => navigate('/alerts')} className="text-sm font-bold text-slate-900 hover:text-teal-600">🚨 Active Alerts</button>
                  <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">No alerts yet</span>
                </div>

                <div className="h-full flex items-center justify-center">
                  <p className="text-sm text-slate-500">No alerts yet. Alerts will appear here once monitoring is connected.</p>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <h3 className="text-sm font-bold text-slate-900 mb-3">Patient Risk Distribution</h3>
                <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-3">
                  <p className="text-sm text-slate-600">Null: Risk distribution is not populated yet because risk scoring data is not connected.</p>
                  <p className="text-xs text-slate-500 mt-1">Current total patients: {isLoadingPatients ? 'Loading...' : totalPatients}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 overflow-hidden">
              <div className="bg-white border border-slate-200 rounded-xl p-4 flex-1 overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                  <button onClick={() => navigate('/schedule')} className="text-sm font-bold text-slate-900 hover:text-teal-600">📅 Today's Schedule</button>
                  <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">Null</span>
                </div>

                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Upcoming Meetings</p>
                <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-3 mb-4">
                  <p className="text-sm text-slate-600">Null: No meetings yet. Scheduling integration is not connected.</p>
                </div>

                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">To-Do Tasks</p>
                <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-3">
                  <p className="text-sm text-slate-600">Null: No tasks yet. Task management integration is not connected.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
