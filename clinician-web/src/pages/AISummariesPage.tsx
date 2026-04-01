import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '../hooks'

type RiskTier = 'High' | 'Medium' | 'Low'

type SummaryCard = {
  id: number
  name: string
  meta: string
  initials: string
  avatarGradient: string
  risk: number
  tier: RiskTier
  explanation: string
  actions: string[]
  featureSignals?: Array<{ label: string; width: string; tone: 'red' | 'amber'; value: string }>
  compact?: string
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

const summaries: SummaryCard[] = [
  {
    id: 1,
    name: 'Sarah Mensah',
    meta: '42 yrs · Type 2 · Generated today 09:14 AM',
    initials: 'SM',
    avatarGradient: 'from-teal-600 to-sky-500',
    risk: 0.87,
    tier: 'High',
    explanation:
      'Patient engagement has declined significantly over the past 7 days, with only 2 of 7 meal logs recorded. BP rising to 142/95 mmHg. Glucose averaging 8.9 mmol/L. Risk score reached 0.87, highest in patient history. Immediate clinical review is recommended.',
    featureSignals: [
      { label: 'Meals logged (7d)', width: '85%', tone: 'red', value: '-0.34' },
      { label: 'BP change (14d)', width: '55%', tone: 'red', value: '-0.22' },
      { label: 'Calorie deviation', width: '40%', tone: 'amber', value: '-0.18' },
      { label: 'App sessions (7d)', width: '28%', tone: 'amber', value: '-0.12' },
    ],
    actions: ['Urgent review', 'Med check', 'Simplify meal plan', 'Re-engagement msg'],
  },
  {
    id: 2,
    name: 'James Tekeba',
    meta: '57 yrs · Type 2 · Generated today 08:52 AM',
    initials: 'JT',
    avatarGradient: 'from-violet-700 to-fuchsia-500',
    risk: 0.79,
    tier: 'High',
    explanation:
      'Rising systolic BP trend (142 mmHg, up from 128 two weeks ago) combined with only 3 of 7 meals logged and declining app engagement. Weight delta +1.1 kg over 14 days. BP medication review warranted.',
    actions: ['Review Lisinopril', 'Schedule check-in', 'Reduce sodium targets'],
  },
  {
    id: 3,
    name: 'Priya Krishnan',
    meta: '38 yrs · Type 2 · Generated today 08:30 AM',
    initials: 'PK',
    avatarGradient: 'from-orange-600 to-amber-500',
    risk: 0.61,
    tier: 'Medium',
    explanation:
      'Moderate engagement with 5 of 7 meals logged. Caloric excess of +18% is driving projected weight gain of +1.4 kg over 14 days. BP stable at 122/78 and glucose within range. Review calorie targets and add portion guidance.',
    actions: ['Reduce calorie target', 'Portion guidance', 'Monitor weekly'],
  },
  {
    id: 4,
    name: 'David Osei',
    meta: '64 yrs · Type 2 · Generated today 08:15 AM',
    initials: 'DO',
    avatarGradient: 'from-emerald-600 to-green-500',
    risk: 0.58,
    tier: 'Medium',
    explanation:
      'Glucose averaging 9.2 mmol/L above target with moderate adherence at 54%. Meal logging inconsistent at 4 of 7 days. Weight stable and BP slightly up at 136/88. Continue monitoring and nudge for consistency.',
    actions: ['Send check-in message', 'Review meal plan variety'],
  },
  {
    id: 5,
    name: 'Amina Nkosi',
    meta: '45 yrs · Type 2 · Generated today 08:05 AM',
    initials: 'AN',
    avatarGradient: 'from-sky-600 to-cyan-400',
    risk: 0.12,
    tier: 'Low',
    explanation: '',
    compact: '7/7 meals logged · BP stable 118/74 · Glucose avg 6.8 · Weight -0.5kg · Streak 12 days',
    actions: [],
  },
]

function clsx(...tokens: Array<string | false | undefined>) {
  return tokens.filter(Boolean).join(' ')
}

function riskTone(tier: RiskTier) {
  if (tier === 'High') return 'border-red-400 bg-red-50 text-red-600'
  if (tier === 'Medium') return 'border-amber-400 bg-amber-50 text-amber-700'
  return 'border-emerald-400 bg-emerald-50 text-emerald-700'
}

export function AISummariesPage() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [activeNav, setActiveNav] = useState('AI Summaries')

  const clinicianName = user ? `${user.firstName} ${user.lastName}` : 'Unknown User'
  const clinicianInitials = user ? `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase() : 'NA'
  const clinicianRole = user?.role === 'admin' ? 'Administrator' : 'Clinician'

  const navMain = useMemo(() => {
    if (user?.role === 'admin') {
      return ['Dashboard', 'Doctor Accounts', ...navMainBase.slice(1)]
    }
    return navMainBase
  }, [user?.role])

  const highCount = 6
  const mediumCount = 14
  const lowCount = 28
  const generatedToday = 12

  const handleNavClick = (item: string) => {
    setActiveNav(item)
    if (item === 'Dashboard') navigate('/dashboard')
    if (item === 'Patients') navigate('/patients')
    if (item === 'Doctor Accounts') navigate('/admin/doctors/onboard')
    if (item === 'AI Summaries') navigate('/ai-summaries')
    if (item === 'Alerts') navigate('/alerts')
    if (item === 'Schedule') navigate('/schedule')
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
            <div className="w-[180px] bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-500">🔍 Search patient...</div>
            <button className="text-sm border border-slate-200 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-lg">📅 Date range</button>
            <button className="bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold px-4 py-2 rounded-lg">↺ Regenerate All</button>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto p-4 md:p-5 flex flex-col gap-3">
          <div className="flex gap-2 items-center flex-wrap">
            <div className="w-[220px] bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-500">🔍 Search patient...</div>
            <button className="text-xs font-medium px-3 py-1.5 rounded-full bg-slate-100 text-slate-700">All Patients</button>
            <button className="text-xs font-medium px-3 py-1.5 rounded-full border border-slate-200 text-slate-700">🔴 High Risk</button>
            <button className="text-xs font-medium px-3 py-1.5 rounded-full border border-slate-200 text-slate-700">🟡 Medium Risk</button>
            <button className="text-xs font-medium px-3 py-1.5 rounded-full border border-slate-200 text-slate-700">🟢 Low Risk</button>
            <div className="ml-auto flex gap-2">
              <button className="text-sm border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1.5 rounded-lg">📅 Filter by date</button>
              <button className="bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold px-4 py-2 rounded-lg">↺ Regenerate All</button>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Stat title="High Risk" value={highCount} className="bg-red-50 border-red-200 text-red-600" />
            <Stat title="Medium Risk" value={mediumCount} className="bg-amber-50 border-amber-200 text-amber-700" />
            <Stat title="Low Risk" value={lowCount} className="bg-emerald-50 border-emerald-200 text-emerald-700" />
            <Stat title="Generated Today" value={generatedToday} className="bg-teal-50 border-teal-200 text-teal-700" />
          </div>

          {summaries.map(item => (
            <div key={item.id} className={clsx('bg-white border border-slate-200 rounded-xl p-4', item.tier === 'Low' ? 'border-l-[4px] border-l-emerald-500' : item.tier === 'High' ? 'border-l-[4px] border-l-red-500' : 'border-l-[4px] border-l-amber-500')}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className={clsx('w-8 h-8 rounded-full text-white text-xs font-bold flex items-center justify-center bg-gradient-to-br', item.avatarGradient)}>{item.initials}</div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{item.name}</p>
                    <p className="text-xs text-slate-500">{item.meta}</p>
                    {item.compact && <p className="text-xs text-slate-600 mt-1">{item.compact}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                  <span className={clsx('text-xs font-semibold px-2 py-0.5 rounded-full border', riskTone(item.tier))}>Risk: {item.risk.toFixed(2)}</span>
                  {item.tier !== 'Low' && <button className="text-xs bg-teal-500 text-white px-2.5 py-1 rounded-md hover:bg-teal-600">📝 Intervene</button>}
                  {item.tier === 'High' && <button className="text-xs border border-slate-200 px-2.5 py-1 rounded-md hover:bg-slate-50">↺ Refresh</button>}
                  <button className="text-xs border border-slate-200 px-2.5 py-1 rounded-md hover:bg-slate-50">👁 View Profile</button>
                </div>
              </div>

              {item.tier !== 'Low' && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-3">
                  <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-teal-600 mb-1">🧠 AI Explanation</p>
                  <p className="text-sm text-slate-700 leading-6">{item.explanation}</p>
                </div>
              )}

              {item.featureSignals && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2 mb-3">
                  {item.featureSignals.map(signal => (
                    <div key={signal.label} className="bg-slate-50 border border-slate-200 rounded-lg p-2">
                      <p className="text-[10px] text-slate-500 mb-1">{signal.label}</p>
                      <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden mb-1">
                        <div className={clsx('h-full rounded-full', signal.tone === 'red' ? 'bg-red-500' : 'bg-amber-500')} style={{ width: signal.width }} />
                      </div>
                      <p className={clsx('text-[10px] font-bold', signal.tone === 'red' ? 'text-red-600' : 'text-amber-700')}>{signal.value}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-1.5 flex-wrap">
                {item.tier !== 'Low' && <span className="text-xs font-semibold text-slate-700">Suggested Actions:</span>}
                {item.tier === 'Low' && <span className="text-xs font-semibold text-emerald-700">✓ No action needed</span>}
                {item.actions.map(action => (
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
