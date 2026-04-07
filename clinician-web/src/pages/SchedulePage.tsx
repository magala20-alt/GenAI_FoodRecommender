import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '../hooks'
import { AlertsSummary, ClinicianPatientListItem, ScheduleAppointmentRead, ScheduleMeeting, ScheduleTodo, patientService } from '../services/patientService'

const navMain = ['Dashboard', 'Patients', 'AI Summaries', 'Alerts']
const navTools = ['Schedule']

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

function toDateTimeLocalValue(date = new Date()) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 16)
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function addMonths(date: Date, months: number) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1)
}

function isSameMonthDay(date: Date, isoValue: string) {
  const target = new Date(isoValue)
  return (
    date.getFullYear() === target.getFullYear()
    && date.getMonth() === target.getMonth()
    && date.getDate() === target.getDate()
  )
}

function formatMonthYear(date: Date) {
  return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
}

function formatDayNumber(date: Date) {
  return date.getDate().toString()
}

function localDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function SchedulePage() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [activeNav, setActiveNav] = useState('Schedule')
  const [alertsSummary, setAlertsSummary] = useState<AlertsSummary>({ openCount: 0, highCount: 0, mediumCount: 0, lowCount: 0 })
  const [dateLabel, setDateLabel] = useState('Today')
  const [meetings, setMeetings] = useState<ScheduleMeeting[]>([])
  const [todos, setTodos] = useState<ScheduleTodo[]>([])
  const [patients, setPatients] = useState<ClinicianPatientListItem[]>([])
  const [appointments, setAppointments] = useState<ScheduleAppointmentRead[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showAppointmentForm, setShowAppointmentForm] = useState(false)
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [appointmentPatientId, setAppointmentPatientId] = useState('')
  const [appointmentAt, setAppointmentAt] = useState(toDateTimeLocalValue())
  const [appointmentTitle, setAppointmentTitle] = useState('Nutrition Follow-up')
  const [appointmentDetail, setAppointmentDetail] = useState('Review progress and discuss meal plan adjustments')
  const [taskDescription, setTaskDescription] = useState('Call patient with dietary recommendation update')
  const [taskType, setTaskType] = useState('follow_up')
  const [submitMessage, setSubmitMessage] = useState<string | null>(null)
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()))

  const clinicianName = user ? `${user.firstName} ${user.lastName}` : 'Unknown User'
  const clinicianInitials = user ? `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase() : 'NA'
  const clinicianRole = user?.role === 'admin' ? 'Administrator' : 'Clinician'
  const monthLabel = useMemo(() => {
    const now = new Date()
    return now.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
  }, [])

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

  useEffect(() => {
    let isActive = true
    const load = async () => {
      try {
        setIsLoading(true)
        const [scheduleData, summary, patientList] = await Promise.all([
          patientService.getScheduleToday(),
          patientService.getAlertsSummary(),
          patientService.getPatientListForClinician(),
        ])
        const scheduleAppointments = await patientService.getScheduleAppointments()
        if (!isActive) return
        setDateLabel(scheduleData.dateLabel)
        setMeetings(scheduleData.meetings)
        setTodos(scheduleData.todos)
        setAlertsSummary(summary)
        setPatients(patientList)
        setAppointments(scheduleAppointments)
      } finally {
        if (isActive) setIsLoading(false)
      }
    }
    void load()
    return () => {
      isActive = false
    }
  }, [])

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

  const appointmentDates = useMemo(() => {
    return new Set(
      appointments.map(appointment => localDateKey(new Date(appointment.scheduledAt))),
    )
  }, [appointments])

  const calendarCells = useMemo(() => {
    const firstDay = startOfMonth(currentMonth)
    const startWeekday = (firstDay.getDay() + 6) % 7
    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate()
    const daysInPrevMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 0).getDate()
    const totalCells = 42

    return Array.from({ length: totalCells }, (_, index) => {
      if (index < startWeekday) {
        const day = daysInPrevMonth - startWeekday + index + 1
        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, day)
        return { date, inMonth: false }
      }

      const day = index - startWeekday + 1
      if (day > daysInMonth) {
        const nextDay = day - daysInMonth
        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, nextDay)
        return { date, inMonth: false }
      }

      return {
        date: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day),
        inMonth: true,
      }
    })
  }, [currentMonth])

  const currentMonthLabel = useMemo(() => formatMonthYear(currentMonth), [currentMonth])

  const hasAppointmentOnDate = (date: Date) => appointmentDates.has(localDateKey(date))

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
      setMeetings(prev => [created, ...prev])
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
      setTodos(prev => [created, ...prev])
      setShowTaskForm(false)
      setSubmitMessage('Task added successfully.')
    } catch {
      setSubmitMessage('Could not add task. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const goToPreviousMonth = () => {
    setCurrentMonth(prev => addMonths(prev, -1))
  }

  const goToNextMonth = () => {
    setCurrentMonth(prev => addMonths(prev, 1))
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

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
          <h1 className="text-xl font-bold text-slate-900">Schedule</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAppointmentForm(prev => !prev)}
              className="text-sm bg-teal-500 hover:bg-teal-600 text-white font-semibold px-3 py-1.5 rounded-lg"
            >
              Book Appointment
            </button>
            <button
              onClick={() => setShowTaskForm(prev => !prev)}
              className="text-sm border border-slate-200 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-lg"
            >
              Add Task
            </button>
            <button className="text-sm border border-slate-200 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-lg">{monthLabel}</button>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto p-4 md:p-5 flex flex-col gap-3">
          {(showAppointmentForm || showTaskForm || submitMessage) && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
              {showAppointmentForm && (
                <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                  <h3 className="text-sm font-bold text-slate-900">Book Appointment</h3>
                  <select
                    value={appointmentPatientId}
                    onChange={event => setAppointmentPatientId(event.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
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
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  />
                  <input
                    value={appointmentTitle}
                    onChange={event => setAppointmentTitle(event.target.value)}
                    placeholder="Appointment title"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  />
                  <input
                    value={appointmentDetail}
                    onChange={event => setAppointmentDetail(event.target.value)}
                    placeholder="Appointment details"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setShowAppointmentForm(false)}
                      className="text-sm border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1.5 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateAppointment}
                      disabled={isSubmitting}
                      className="text-sm bg-teal-500 hover:bg-teal-600 text-white font-semibold px-3 py-1.5 rounded-lg disabled:opacity-70"
                    >
                      {isSubmitting ? 'Saving...' : 'Save Appointment'}
                    </button>
                  </div>
                </div>
              )}

              {showTaskForm && (
                <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                  <h3 className="text-sm font-bold text-slate-900">Add Task</h3>
                  <input
                    value={taskDescription}
                    onChange={event => setTaskDescription(event.target.value)}
                    placeholder="Task description"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  />
                  <select
                    value={taskType}
                    onChange={event => setTaskType(event.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="follow_up">Follow-up</option>
                    <option value="today">Today</option>
                    <option value="urgent">Urgent</option>
                  </select>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setShowTaskForm(false)}
                      className="text-sm border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1.5 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateTask}
                      disabled={isSubmitting}
                      className="text-sm bg-slate-900 hover:bg-slate-800 text-white font-semibold px-3 py-1.5 rounded-lg disabled:opacity-70"
                    >
                      {isSubmitting ? 'Saving...' : 'Save Task'}
                    </button>
                  </div>
                </div>
              )}

              {submitMessage && (
                <div className="xl:col-span-2 text-sm text-slate-600 bg-slate-100 border border-slate-200 rounded-lg px-3 py-2">
                  {submitMessage}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-slate-900">{currentMonthLabel}</h2>
                <div className="flex gap-1.5">
                  <button onClick={goToPreviousMonth} className="w-7 h-7 bg-slate-50 border border-slate-200 rounded-md text-sm">‹</button>
                  <button onClick={goToNextMonth} className="w-7 h-7 bg-slate-50 border border-slate-200 rounded-md text-sm">›</button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1 mb-1.5 text-[10.5px] font-bold text-slate-500">
                {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(day => (
                  <div key={day} className="text-center py-1">{day}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1 text-[12.5px]">
                {calendarCells.map(({ date, inMonth }) => {
                  const dayKey = localDateKey(date)
                  const hasAppointment = hasAppointmentOnDate(date)
                  const isToday = dayKey === new Date().toISOString().slice(0, 10)
                  return (
                    <button
                      key={dayKey}
                      type="button"
                      onClick={() => setCurrentMonth(startOfMonth(date))}
                      className={clsx(
                        'min-h-[58px] rounded-lg border p-1.5 text-left transition-colors flex flex-col justify-between',
                        inMonth ? 'border-slate-200 bg-white hover:bg-slate-50' : 'border-slate-100 bg-slate-50 text-slate-400',
                        hasAppointment && inMonth && 'bg-teal-50 border-teal-300 text-teal-900',
                        isToday && 'ring-2 ring-teal-400 ring-offset-1',
                      )}
                    >
                      <span className={clsx('text-xs font-semibold', hasAppointment && inMonth ? 'text-teal-800' : inMonth ? 'text-slate-700' : 'text-slate-400')}>
                        {formatDayNumber(date)}
                      </span>
                      {hasAppointment ? (
                        <span className="text-[10px] leading-tight font-semibold text-teal-700 bg-teal-100 rounded-full px-1.5 py-0.5 self-start">
                          Booked
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">&nbsp;</span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <h3 className="text-sm font-bold text-slate-900 mb-3">📅 {dateLabel}</h3>
                <div className="flex flex-col gap-2">
                  {isLoading ? (
                    <div className="text-sm text-slate-500">Loading schedule...</div>
                  ) : meetings.length === 0 ? (
                    <div className="text-sm text-slate-500">No meetings scheduled.</div>
                  ) : (
                    meetings.map(item => (
                    <div key={item.id} className={clsx('border-l-[3px] border border-slate-100 rounded-lg px-3 py-2 flex items-start gap-2.5', scheduleBorderTone(item.borderTone))}>
                      <div className="w-10 shrink-0 leading-tight">
                        <p className="text-sm font-bold text-slate-800">{item.time}</p>
                        <p className="text-[10px] text-slate-500">{item.period}</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                        <p className="text-xs text-slate-500">{item.detail}</p>
                      </div>
                      {item.badgeLabel && (
                        <span className={clsx('text-xs font-semibold px-2 py-0.5 rounded-full shrink-0', scheduleBadgeTone(item.badgeTone))}>{item.badgeLabel}</span>
                      )}
                    </div>
                  )))}
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <h3 className="text-sm font-bold text-slate-900 mb-3">✅ To-Do Today</h3>
                <div className="flex flex-col gap-2">
                  {isLoading ? (
                    <div className="text-sm text-slate-500">Loading tasks...</div>
                  ) : todos.length === 0 ? (
                    <div className="text-sm text-slate-500">No tasks for today.</div>
                  ) : (
                  todos.map(item => (
                    <div key={item.id} className="flex items-center gap-2 border border-slate-100 rounded-lg px-2.5 py-2">
                      <div className={clsx('w-4 h-4 rounded border flex items-center justify-center text-[10px]', item.done ? 'bg-teal-500 border-teal-500 text-white' : 'border-slate-300')}>
                        {item.done ? '✓' : ''}
                      </div>
                      <span className={clsx('text-sm flex-1', item.done ? 'line-through text-slate-500' : 'font-medium text-slate-800')}>
                        {item.label}
                      </span>
                      {item.badgeLabel && (
                        <span className={clsx('text-[10px] font-semibold px-2 py-0.5 rounded-full', item.badgeTone === 'urgent' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700')}>{item.badgeLabel}</span>
                      )}
                    </div>
                  )))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
