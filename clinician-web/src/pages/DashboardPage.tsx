import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { patientService } from '../services/patientService'
import { DashboardStats, Patient, Meeting, Task, Alert } from '../types'

const navMain = ['Dashboard', 'Patients', 'AI Summaries', 'Alerts']
const navTools = ['Schedule']

const navIcons: Record<string, string> = {
  Dashboard: '▦',
  Patients: '👥',
  'AI Summaries': '🧠',
  Alerts: '🔔',
  Schedule: '🗓️',
}

const MOCK_MEETINGS: Meeting[] = [
  {
    id: 1,
    time: '09:00',
    period: 'AM',
    type: 'Review',
    name: 'John Doe',
    mode: 'Video call',
    duration: '30 min',
    tag: 'Upcoming',
    tagColor: 'bg-emerald-100 text-emerald-700',
    dotColor: 'bg-emerald-500',
    borderColor: 'border-emerald-300',
  },
  {
    id: 2,
    time: '12:30',
    period: 'PM',
    type: 'Consult',
    name: 'Emma Johnson',
    mode: 'In-person',
    duration: '45 min',
    tag: 'Priority',
    tagColor: 'bg-amber-100 text-amber-700',
    dotColor: 'bg-amber-500',
    borderColor: 'border-amber-300',
  },
]

const MOCK_TASKS: Task[] = [
  { id: 1, label: 'Review glucose trend for John Doe', done: false, tag: 'Today', tagColor: 'bg-sky-100 text-sky-700' },
  { id: 2, label: 'Approve meal plan changes', done: false, tag: 'Pending', tagColor: 'bg-amber-100 text-amber-700' },
  { id: 3, label: 'Send follow-up summary', done: true },
]

const MOCK_ALERTS: Alert[] = [
  { id: 1, name: 'Emma Johnson', issue: 'High glucose', detail: '3 elevated readings in 24h', severity: 'High' },
  { id: 2, name: 'John Doe', issue: 'Low adherence', detail: 'Missed 2 meals this week', severity: 'Medium' },
]

export function DashboardPage() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [patients, setPatients] = useState<Patient[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [generatingAI, setGeneratingAI] = useState(false)
  const [activeNav, setActiveNav] = useState('Dashboard')
  const [meetings] = useState<Meeting[]>(MOCK_MEETINGS)
  const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS)
  const alerts: Alert[] = MOCK_ALERTS

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const allPatients = await patientService.getPatients()
      setPatients(allPatients)

      const highRiskCount = allPatients.filter(p => p.riskLevel === 'high').length
      const activeCount = allPatients.filter(p => p.status !== 'inactive').length
      const avgAdherence = allPatients.length > 0
        ? Math.round(allPatients.reduce((sum, p) => sum + p.adherenceScore, 0) / allPatients.length)
        : 0

      setStats({
        totalPatients: allPatients.length,
        activePatients: activeCount,
        highRiskCount,
        averageAdherence: avgAdherence,
        pendingInterventions: 5,
        reviewsThisWeek: 3,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerateAISummaries = async () => {
    setGeneratingAI(true)
    try {
      for (const patient of patients) {
        await patientService.getAISummary(patient.id)
      }
      alert('AI summaries generated for all patients')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate AI summaries')
    } finally {
      setGeneratingAI(false)
    }
  }

  const handleNavClick = (item: string) => {
    setActiveNav(item)
    if (item === 'Patients') {
      navigate('/patients/onboard')
    }
  }

  const toggleTask = (taskId: number) => {
    setTasks(prev => prev.map(task => task.id === taskId ? { ...task, done: !task.done } : task))
  }

  const lowRiskCount = useMemo(() => patients.filter(p => p.riskLevel === 'low').length, [patients])
  const mediumRiskCount = useMemo(() => patients.filter(p => p.riskLevel === 'medium').length, [patients])
  const highRiskCount = useMemo(() => patients.filter(p => p.riskLevel === 'high').length, [patients])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mb-4" />
          <p className="text-slate-500">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <aside className="w-52 bg-slate-900 flex flex-col py-5 px-3 shrink-0">
        <div className="flex items-center gap-2 px-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-sm">⚕️</div>
          <span className="text-white font-bold tracking-widest text-sm">CARESYNC</span>
        </div>

        <p className="text-slate-500 text-xs font-semibold px-2 mb-2 tracking-wider">MAIN</p>
        <nav className="flex flex-col gap-1 mb-6">
          {navMain.map(item => (
            <button key={item} onClick={() => handleNavClick(item)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all text-left
                ${activeNav === item ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
              <span>{navIcons[item]}</span>
              <span>{item}</span>
              {item === 'Alerts' && (
                <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {alerts.length}
                </span>
              )}
            </button>
          ))}
        </nav>

        <p className="text-slate-500 text-xs font-semibold px-2 mb-2 tracking-wider">TOOLS</p>
        <nav className="flex flex-col gap-1">
          {navTools.map(item => (
            <button key={item} onClick={() => handleNavClick(item)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all text-left
                ${activeNav === item ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
              <span>{navIcons[item]}</span>
              <span>{item}</span>
            </button>
          ))}
        </nav>

        <div className="mt-auto flex items-center gap-2 px-2 pt-4 border-t border-slate-700">
          <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center text-white text-xs font-bold">DJ</div>
          <div>
            <p className="text-white text-xs font-semibold">Dr. Johnson</p>
            <p className="text-slate-400 text-xs">Endocrinologist</p>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-slate-100 px-7 py-4 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Dashboard</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {error && (
              <span className="text-xs text-red-500 bg-red-50 px-3 py-1 rounded-lg border border-red-200">{error}</span>
            )}
            <button onClick={loadDashboard} disabled={isLoading}
              className="text-slate-400 hover:text-slate-600 text-sm px-3 py-2 rounded-xl hover:bg-slate-50 transition">
              ↻ Refresh
            </button>
            <button onClick={handleGenerateAISummaries} disabled={generatingAI || patients.length === 0}
              className="text-slate-400 hover:text-slate-600 text-sm px-3 py-2 rounded-xl hover:bg-slate-50 transition">
              {generatingAI ? 'Generating...' : 'AI Summaries'}
            </button>
            <button className="relative p-2 rounded-xl hover:bg-slate-50 transition">
              <span className="text-lg">🔔</span>
              {alerts.length > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />}
            </button>
            <button
              onClick={() => navigate('/patients/onboard')}
              className="bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition"
            >
              + Onboard Patient
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          {stats && (
            <div className="grid grid-cols-5 gap-4 mb-6">
              <StatCard icon="👥" value={stats.totalPatients} label="Total Patients" sub="↑ 3 this month" subColor="text-emerald-500" />
              <StatCard icon="📋" value={stats.activePatients} label="Active Patients" sub="↑ 71%" subColor="text-emerald-500" />
              <StatCard icon="⚠️" value={stats.pendingInterventions} label="Pending Interventions" sub="↑ 2 new" subColor="text-amber-500" />
              <StatCard icon="🚨" value={stats.highRiskCount} label="High Risk Patients" sub="High priority" subColor="text-red-500" />
              <StatCard icon="📊" value={`${stats.averageAdherence}%`} label="Avg Adherence" sub={`${stats.reviewsThisWeek} reviews this week`} subColor="text-teal-500" />
            </div>
          )}

          <div className="grid grid-cols-2 gap-5">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-slate-800 flex items-center gap-2">🚨 Active Alerts</h2>
                <span className="bg-red-100 text-red-600 text-xs font-semibold px-2.5 py-1 rounded-full">{alerts.length} open</span>
              </div>
              <div className="flex flex-col gap-3">
                {alerts.map(alert => (
                  <div key={alert.id} className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2">
                      <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${alert.severity === 'High' ? 'bg-red-500' : 'bg-amber-400'}`} />
                      <div>
                        <p className="text-sm font-semibold text-slate-700">{alert.name} - {alert.issue}</p>
                        <p className="text-xs text-slate-400">{alert.detail}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${alert.severity === 'High' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                      {alert.severity}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-slate-800 flex items-center gap-2">📅 Today's Schedule</h2>
                <span className="text-slate-500 text-sm">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              </div>

              <p className="text-xs font-semibold text-slate-400 tracking-wider mb-2">UPCOMING MEETINGS</p>
              <div className="flex flex-col gap-2 mb-5">
                {meetings.map(m => (
                  <div key={m.id} className={`flex items-center gap-3 border-l-2 pl-3 py-1 ${m.borderColor}`}>
                    <div className="w-12 shrink-0">
                      <p className="text-sm font-bold text-slate-700">{m.time}</p>
                      <p className="text-xs text-slate-400">{m.period}</p>
                    </div>
                    <div className={`w-2 h-2 rounded-full shrink-0 ${m.dotColor}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-700 truncate">{m.type} · {m.name}</p>
                      <p className="text-xs text-slate-400">{m.mode} · {m.duration}</p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${m.tagColor}`}>{m.tag}</span>
                  </div>
                ))}
              </div>

              <p className="text-xs font-semibold text-slate-400 tracking-wider mb-2">TO-DO TASKS</p>
              <div className="flex flex-col gap-2">
                {tasks.map(task => (
                  <div key={task.id} className="flex items-center gap-2">
                    <button onClick={() => toggleTask(task.id)}
                      className={`w-4 h-4 rounded shrink-0 flex items-center justify-center border transition ${task.done ? 'bg-teal-500 border-teal-500' : 'border-slate-300 hover:border-teal-400'}`}>
                      {task.done && <span className="text-white text-xs">✓</span>}
                    </button>
                    <span className={`text-sm flex-1 ${task.done ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                      {task.label}
                    </span>
                    {task.tag && !task.done && (
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${task.tagColor}`}>{task.tag}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 col-span-2">
              <h2 className="font-bold text-slate-800 mb-4">📊 Patient Risk Distribution</h2>
              <div className="flex items-center gap-8">
                <div className="flex-1 flex flex-col gap-3">
                  {[
                    { label: 'Low risk', count: lowRiskCount, color: 'bg-emerald-400', textColor: 'text-emerald-500' },
                    { label: 'Medium', count: mediumRiskCount, color: 'bg-amber-400', textColor: 'text-amber-500' },
                    { label: 'High', count: highRiskCount, color: 'bg-red-400', textColor: 'text-red-500' },
                  ].map(row => (
                    <div key={row.label} className="flex items-center gap-3">
                      <span className={`text-sm font-semibold w-20 ${row.textColor}`}>{row.label}</span>
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${row.color}`}
                          style={{ width: patients.length > 0 ? `${(row.count / patients.length) * 100}%` : '0%' }} />
                      </div>
                      <span className="text-sm text-slate-500 w-6 text-right">{row.count}</span>
                    </div>
                  ))}
                </div>
                <DonutChart
                  low={lowRiskCount}
                  medium={mediumRiskCount}
                  high={highRiskCount}
                  total={patients.length || 1}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function StatCard({
  icon,
  value,
  label,
  sub,
  subColor,
}: {
  icon: string
  value: number | string
  label: string
  sub: string
  subColor: string
}) {
  return (
    <div className="bg-white rounded-2xl p-5 flex flex-col gap-1 shadow-sm border border-slate-100">
      <span className="text-2xl">{icon}</span>
      <span className="text-3xl font-bold text-slate-800 mt-1">{value}</span>
      <span className="text-sm text-slate-500">{label}</span>
      <span className={`text-xs font-semibold ${subColor}`}>{sub}</span>
    </div>
  )
}

function DonutChart({ low, medium, high, total }: { low: number; medium: number; high: number; total: number }) {
  const r = 40
  const cx = 50
  const cy = 50
  const circ = 2 * Math.PI * r
  const gap = 2
  const highPct = (high / total) * circ
  const medPct = (medium / total) * circ
  const lowPct = (low / total) * circ

  return (
    <svg width="100" height="100" viewBox="0 0 100 100">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f87171" strokeWidth="12"
        strokeDasharray={`${highPct - gap} ${circ - highPct + gap}`}
        strokeDashoffset={0}
        style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#fbbf24" strokeWidth="12"
        strokeDasharray={`${medPct - gap} ${circ - medPct + gap}`}
        strokeDashoffset={-highPct}
        style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#34d399" strokeWidth="12"
        strokeDasharray={`${lowPct - gap} ${circ - lowPct + gap}`}
        strokeDashoffset={-(highPct + medPct)}
        style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }} />
      <text x="50" y="47" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#1e293b">{total}</text>
      <text x="50" y="60" textAnchor="middle" fontSize="8" fill="#94a3b8">total</text>
    </svg>
  )
}
