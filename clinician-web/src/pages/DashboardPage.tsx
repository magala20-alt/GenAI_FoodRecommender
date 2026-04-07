import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks'
import { AlertsSummary, ClinicianPatientListItem, PatientAISummary, ScheduleTodayResponse, patientService } from '../services/patientService'
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

function toDateTimeLocalValue(date = new Date()) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 16)
}

export function DashboardPage() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [activeNav, setActiveNav] = useState('Dashboard')
  const [patients, setPatients] = useState<ClinicianPatientListItem[]>([])
  const [alertsSummary, setAlertsSummary] = useState<AlertsSummary>({ openCount: 0, highCount: 0, mediumCount: 0, lowCount: 0 })
  const [alerts, setAlerts] = useState<Array<{ id: string; patientName: string; message: string; severity: string; riskScoreSnapshot: number | null }>>([])
  const [schedule, setSchedule] = useState<ScheduleTodayResponse>({ dateLabel: '', meetings: [], todos: [] })
  const [aiSummaries, setAiSummaries] = useState<PatientAISummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showAppointmentForm, setShowAppointmentForm] = useState(false)
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [appointmentPatientId, setAppointmentPatientId] = useState('')
  const [appointmentAt, setAppointmentAt] = useState(toDateTimeLocalValue())
  const [appointmentTitle, setAppointmentTitle] = useState('Care Plan Check-in')
  const [appointmentDetail, setAppointmentDetail] = useState('Discuss adherence and update next steps')
  const [taskDescription, setTaskDescription] = useState('Prepare notes for high-risk patient follow-up')
  const [taskType, setTaskType] = useState('follow_up')
  const [submitMessage, setSubmitMessage] = useState<string | null>(null)
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
    let isActive = true
    const loadDashboard = async () => {
      try {
        setIsLoading(true)
        const [list, summary, alertsList, scheduleToday, summaries] = await Promise.all([
          patientService.getPatientListForClinician(),
          patientService.getAlertsSummary(),
          patientService.getAlerts(),
          patientService.getScheduleToday(),
          patientService.getAISummaries(),
        ])
        if (!isActive) return
        setPatients(list)
        setAlertsSummary(summary)
        setAlerts(alertsList.slice(0, 4))
        setSchedule(scheduleToday)
        setAiSummaries(summaries)
      } catch {
        if (!isActive) return
        setPatients([])
        setAlertsSummary({ openCount: 0, highCount: 0, mediumCount: 0, lowCount: 0 })
        setAlerts([])
        setSchedule({ dateLabel: '', meetings: [], todos: [] })
        setAiSummaries([])
      } finally {
        if (isActive) setIsLoading(false)
      }
    }

    void loadDashboard()
    return () => {
      isActive = false
    }
  }, [])

  const patientCount = patients.length
  const activePlans = patients.filter(patient => patient.adherence != null).length
  const generatedToday = useMemo(() => {
    const today = new Date().toDateString()
    return aiSummaries.filter(item => new Date(item.generatedAt).toDateString() === today).length
  }, [aiSummaries])

  const riskDistribution = useMemo(() => {
    const high = patients.filter(patient => patient.riskLevel === 'High').length
    const medium = patients.filter(patient => patient.riskLevel === 'Medium').length
    const low = patients.filter(patient => patient.riskLevel === 'Low').length
    const total = Math.max(1, high + medium + low)
    return { high, medium, low, total }
  }, [patients])

  const donutStyle = useMemo(() => {
    const lowPct = Math.round((riskDistribution.low / riskDistribution.total) * 100)
    const mediumPct = Math.round((riskDistribution.medium / riskDistribution.total) * 100)
    const highPct = 100 - lowPct - mediumPct
    return {
      background: `conic-gradient(#16a34a 0 ${lowPct}%, #f59e0b ${lowPct}% ${lowPct + mediumPct}%, #ef4444 ${lowPct + mediumPct}% ${lowPct + mediumPct + highPct}%)`,
    }
  }, [riskDistribution])

  const statCards = useMemo(() => {
    return [
      {
        icon: '👥',
        value: isLoading ? '...' : String(patientCount),
        label: 'Total Patients',
        delta: 'Live from assignments',
        deltaTone: 'text-emerald-600',
      },
      {
        icon: '🍽',
        value: isLoading ? '...' : String(activePlans),
        label: 'Active Plans Today',
        delta: 'From patient metrics',
        deltaTone: 'text-emerald-600',
      },
      {
        icon: '🚨',
        value: isLoading ? '...' : String(alertsSummary.openCount),
        label: 'Active Alerts',
        delta: alertsSummary.highCount > 0 ? 'High priority' : 'Monitored',
        valueTone: alertsSummary.openCount > 0 ? 'text-red-600' : 'text-slate-900',
        deltaTone: alertsSummary.highCount > 0 ? 'text-red-600' : 'text-slate-500',
      },
      {
        icon: '🧠',
        value: isLoading ? '...' : String(aiSummaries.length),
        label: 'AI Summaries',
        delta: generatedToday > 0 ? `${generatedToday} generated today` : 'No new summaries today',
        deltaTone: 'text-emerald-600',
      },
    ]
  }, [activePlans, aiSummaries.length, alertsSummary.highCount, alertsSummary.openCount, generatedToday, isLoading, patientCount])

  const badgeForSeverity = (severity: string) => {
    if (severity === 'High') return 'bg-red-100 text-red-600'
    if (severity === 'Medium') return 'bg-amber-100 text-amber-700'
    return 'bg-slate-100 text-slate-600'
  }

  const scheduleBadgeTone = (tone: string | null) => {
    if (tone === 'now') return 'bg-teal-100 text-teal-700'
    if (tone === 'soon') return 'bg-amber-100 text-amber-700'
    return 'bg-slate-100 text-slate-600'
  }

  const scheduleBorderTone = (tone: string) => {
    if (tone === 'high') return 'border-l-teal-500'
    if (tone === 'medium') return 'border-l-amber-500'
    return 'border-l-slate-400'
  }

  useEffect(() => {
    if (patients.length > 0 && !appointmentPatientId) {
      setAppointmentPatientId(patients[0].id)
    }
  }, [appointmentPatientId, patients])

  const handleCreateAppointment = async () => {
    if (!appointmentPatientId || !appointmentAt.trim() || !appointmentTitle.trim()) {
      setSubmitMessage('Patient, date/time, and title are required to book an appointment.')
      return
    }

    try {
      setIsSubmitting(true)
      setSubmitMessage(null)
      const created = await patientService.createScheduleAppointment({
        patientId: appointmentPatientId,
        scheduledAt: new Date(appointmentAt).toISOString(),
        title: appointmentTitle.trim(),
        detail: appointmentDetail.trim() || undefined,
      })
      setSchedule(prev => ({ ...prev, meetings: [created, ...prev.meetings] }))
      setShowAppointmentForm(false)
      setSubmitMessage('Appointment booked successfully.')
    } catch {
      setSubmitMessage('Could not book appointment. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCreateTask = async () => {
    if (!taskDescription.trim()) {
      setSubmitMessage('Task description is required.')
      return
    }

    try {
      setIsSubmitting(true)
      setSubmitMessage(null)
      const created = await patientService.createScheduleTask({
        description: taskDescription.trim(),
        taskType,
      })
      setSchedule(prev => ({ ...prev, todos: [created, ...prev.todos] }))
      setShowTaskForm(false)
      setSubmitMessage('Task added successfully.')
    } catch {
      setSubmitMessage('Could not add task. Please try again.')
    } finally {
      setIsSubmitting(false)
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
                <span className="ml-auto bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">{alertsSummary.openCount}</span>
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
          <div>
            <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-xs text-slate-500 mt-0.5">{schedule.dateLabel || 'Today'}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(user?.role === 'admin' ? '/admin/doctors/onboard' : '/patients/onboard')}
              className="bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold px-4 py-2 rounded-lg"
            >
              {user?.role === 'admin' ? '+ Onboard Doctor' : '+ Onboard Patient'}
            </button>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto p-4 md:p-5 min-h-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-4">
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
                  <span className="text-xs font-semibold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">{alertsSummary.openCount} open</span>
                </div>

                <div className="space-y-2">
                  {alerts.length === 0 ? (
                    <p className="text-sm text-slate-500">No active alerts.</p>
                  ) : (
                    alerts.map(alert => (
                      <div key={alert.id} className="border border-slate-100 rounded-lg px-3 py-2 flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{alert.patientName}</p>
                          <p className="text-xs text-slate-500">{alert.message}</p>
                        </div>
                        <span className={clsx('text-xs font-semibold px-2 py-0.5 rounded-full', badgeForSeverity(alert.severity))}>
                          {alert.severity}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <h3 className="text-sm font-bold text-slate-900 mb-3">Patient Risk Distribution</h3>
                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-center">
                  <div className="space-y-2">
                    <RiskRow label="Low risk" value={riskDistribution.low} total={riskDistribution.total} barClass="bg-emerald-500" textClass="text-emerald-600" />
                    <RiskRow label="Medium" value={riskDistribution.medium} total={riskDistribution.total} barClass="bg-amber-500" textClass="text-amber-600" />
                    <RiskRow label="High" value={riskDistribution.high} total={riskDistribution.total} barClass="bg-red-500" textClass="text-red-600" />
                  </div>
                  <div className="relative w-16 h-16 rounded-full" style={donutStyle}>
                    <div className="absolute inset-[8px] rounded-full bg-white flex flex-col items-center justify-center">
                      <span className="text-sm font-bold text-slate-900">{patientCount}</span>
                      <span className="text-[10px] text-slate-500">total</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 overflow-hidden">
              <div className="bg-white border border-slate-200 rounded-xl p-4 flex-1 overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                  <button onClick={() => navigate('/schedule')} className="text-sm font-bold text-slate-900 hover:text-teal-600">📅 Today's Schedule</button>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowAppointmentForm(prev => !prev)}
                      className="text-xs bg-teal-500 hover:bg-teal-600 text-white font-semibold px-2.5 py-1 rounded-md"
                    >
                      Book Appointment
                    </button>
                    <button
                      onClick={() => setShowTaskForm(prev => !prev)}
                      className="text-xs border border-slate-200 bg-slate-50 hover:bg-slate-100 px-2.5 py-1 rounded-md"
                    >
                      Add Task
                    </button>
                    <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{schedule.meetings.length} meetings</span>
                  </div>
                </div>

                {(showAppointmentForm || showTaskForm || submitMessage) && (
                  <div className="grid grid-cols-1 gap-2 mb-3">
                    {showAppointmentForm && (
                      <div className="border border-slate-200 rounded-lg p-3 space-y-2">
                        <select
                          value={appointmentPatientId}
                          onChange={event => setAppointmentPatientId(event.target.value)}
                          className="w-full border border-slate-200 rounded-md px-2 py-1.5 text-xs"
                        >
                          <option value="">Select patient</option>
                          {patients.map(patient => (
                            <option key={patient.id} value={patient.id}>{patient.firstName} {patient.lastName}</option>
                          ))}
                        </select>
                        <input
                          type="datetime-local"
                          value={appointmentAt}
                          onChange={event => setAppointmentAt(event.target.value)}
                          className="w-full border border-slate-200 rounded-md px-2 py-1.5 text-xs"
                        />
                        <input
                          value={appointmentTitle}
                          onChange={event => setAppointmentTitle(event.target.value)}
                          placeholder="Appointment title"
                          className="w-full border border-slate-200 rounded-md px-2 py-1.5 text-xs"
                        />
                        <input
                          value={appointmentDetail}
                          onChange={event => setAppointmentDetail(event.target.value)}
                          placeholder="Details"
                          className="w-full border border-slate-200 rounded-md px-2 py-1.5 text-xs"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setShowAppointmentForm(false)}
                            className="text-xs border border-slate-200 bg-white hover:bg-slate-50 px-2.5 py-1 rounded-md"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleCreateAppointment}
                            disabled={isSubmitting}
                            className="text-xs bg-teal-500 hover:bg-teal-600 text-white font-semibold px-2.5 py-1 rounded-md disabled:opacity-70"
                          >
                            {isSubmitting ? 'Saving...' : 'Save'}
                          </button>
                        </div>
                      </div>
                    )}

                    {showTaskForm && (
                      <div className="border border-slate-200 rounded-lg p-3 space-y-2">
                        <input
                          value={taskDescription}
                          onChange={event => setTaskDescription(event.target.value)}
                          placeholder="Task description"
                          className="w-full border border-slate-200 rounded-md px-2 py-1.5 text-xs"
                        />
                        <select
                          value={taskType}
                          onChange={event => setTaskType(event.target.value)}
                          className="w-full border border-slate-200 rounded-md px-2 py-1.5 text-xs"
                        >
                          <option value="follow_up">Follow-up</option>
                          <option value="today">Today</option>
                          <option value="urgent">Urgent</option>
                        </select>
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setShowTaskForm(false)}
                            className="text-xs border border-slate-200 bg-white hover:bg-slate-50 px-2.5 py-1 rounded-md"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleCreateTask}
                            disabled={isSubmitting}
                            className="text-xs bg-slate-900 hover:bg-slate-800 text-white font-semibold px-2.5 py-1 rounded-md disabled:opacity-70"
                          >
                            {isSubmitting ? 'Saving...' : 'Save'}
                          </button>
                        </div>
                      </div>
                    )}

                    {submitMessage && (
                      <div className="text-xs text-slate-600 bg-slate-100 border border-slate-200 rounded-md px-2.5 py-1.5">
                        {submitMessage}
                      </div>
                    )}
                  </div>
                )}

                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Upcoming Meetings</p>
                <div className="space-y-2 mb-4">
                  {schedule.meetings.length === 0 ? (
                    <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-3">
                      <p className="text-sm text-slate-600">No meetings yet.</p>
                    </div>
                  ) : (
                    schedule.meetings.slice(0, 3).map(meeting => (
                      <div key={meeting.id} className={clsx('border-l-[3px] border border-slate-100 rounded-lg px-3 py-2 flex items-start gap-2.5', scheduleBorderTone(meeting.borderTone))}>
                        <div className="w-10 shrink-0 leading-tight">
                          <p className="text-sm font-bold text-slate-800">{meeting.time}</p>
                          <p className="text-[10px] text-slate-500">{meeting.period}</p>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800">{meeting.title}</p>
                          <p className="text-xs text-slate-500">{meeting.detail}</p>
                        </div>
                        {meeting.badgeLabel && (
                          <span className={clsx('text-xs font-semibold px-2 py-0.5 rounded-full shrink-0', scheduleBadgeTone(meeting.badgeTone))}>{meeting.badgeLabel}</span>
                        )}
                      </div>
                    ))
                  )}
                </div>

                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">To-Do Tasks</p>
                <div className="space-y-2">
                  {schedule.todos.length === 0 ? (
                    <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-3">
                      <p className="text-sm text-slate-600">No tasks yet.</p>
                    </div>
                  ) : (
                    schedule.todos.slice(0, 3).map(todo => (
                      <div key={todo.id} className="flex items-center gap-2 border border-slate-100 rounded-lg px-2.5 py-2">
                        <div className={clsx('w-4 h-4 rounded border flex items-center justify-center text-[10px]', todo.done ? 'bg-teal-500 border-teal-500 text-white' : 'border-slate-300')}>
                          {todo.done ? '✓' : ''}
                        </div>
                        <span className={clsx('text-sm flex-1', todo.done ? 'line-through text-slate-500' : 'font-medium text-slate-800')}>
                          {todo.label}
                        </span>
                        {todo.badgeLabel && (
                          <span className={clsx('text-[10px] font-semibold px-2 py-0.5 rounded-full', todo.badgeTone === 'urgent' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700')}>
                            {todo.badgeLabel}
                          </span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

function RiskRow({
  label,
  value,
  total,
  barClass,
  textClass,
}: {
  label: string
  value: number
  total: number
  barClass: string
  textClass: string
}) {
  const width = total === 0 ? 0 : Math.round((value / total) * 100)
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className={clsx('font-semibold', textClass)}>{label}</span>
        <span className="text-slate-600 font-semibold">{value}</span>
      </div>
      <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <div className={clsx('h-full rounded-full', barClass)} style={{ width: `${width}%` }} />
      </div>
    </div>
  )
}
