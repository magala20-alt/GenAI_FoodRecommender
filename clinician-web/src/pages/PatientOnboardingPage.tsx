import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

type DiabetesType = 'Type 1' | 'Type 2' | 'Pre-diabetic' | 'Gestational'
type BudgetLevel = 'Low' | 'Medium' | 'High'
type ActivityLevel = 'Sedentary' | 'Light' | 'Moderate' | 'Active'

interface MedicationItem {
  id: number
  name: string
  dosage: string
  active: boolean
}

const onboardingSteps = [
  { id: 1, title: 'Personal Info', subtitle: 'Name, DOB, contact' },
  { id: 2, title: 'Medical Profile', subtitle: 'Meds, vitals, tests' },
  { id: 3, title: 'Dietary & Goals', subtitle: 'Budget, cuisine, targets' },
  { id: 4, title: 'Review & Confirm', subtitle: 'Summary & send invite' },
]

function clsx(...tokens: Array<string | false>) {
  return tokens.filter(Boolean).join(' ')
}

function calcAge(dob: string) {
  if (!dob) return 0
  const birthDate = new Date(dob)
  if (Number.isNaN(birthDate.getTime())) return 0

  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1
  }

  return age
}

function calcBmi(weightKg: number, heightCm: number) {
  if (!weightKg || !heightCm) return 0
  const heightM = heightCm / 100
  return weightKg / (heightM * heightM)
}

function calcBmr(weightKg: number, heightCm: number, age: number) {
  if (!weightKg || !heightCm || !age) return 0
  // Female Mifflin-St Jeor to align with mock profile values.
  return 10 * weightKg + 6.25 * heightCm - 5 * age - 161
}

function calcCaloriePlan(bmr: number, level: ActivityLevel) {
  if (!bmr) return 0

  const multipliers: Record<ActivityLevel, number> = {
    Sedentary: 1.2,
    Light: 1.35,
    Moderate: 1.5,
    Active: 1.7,
  }

  return Math.round(bmr * multipliers[level] - 350)
}

export function PatientOnboardingPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)

  const [firstName, setFirstName] = useState('Sarah')
  const [lastName, setLastName] = useState('Mensah')
  const [email, setEmail] = useState('sarah.m@email.com')
  const [phone, setPhone] = useState('+233 20 000 0000')
  const [dob, setDob] = useState('1983-03-14')
  const [gender, setGender] = useState('Female')
  const [country, setCountry] = useState('GH Ghana')
  const [language, setLanguage] = useState('English')
  const [emergencyName, setEmergencyName] = useState('Kwame Mensah')
  const [emergencyRelationship, setEmergencyRelationship] = useState('Spouse')
  const [emergencyPhone, setEmergencyPhone] = useState('+233 24 000 0000')

  const [diabetesType, setDiabetesType] = useState<DiabetesType>('Type 2')
  const [weightKg, setWeightKg] = useState(79)
  const [heightCm, setHeightCm] = useState(165)
  const [systolicBp, setSystolicBp] = useState(134)
  const [diastolicBp, setDiastolicBp] = useState(86)
  const [fastingGlucose, setFastingGlucose] = useState(9.1)
  const [hba1c, setHba1c] = useState(7.9)
  const [medications, setMedications] = useState<MedicationItem[]>([
    { id: 1, name: 'Metformin', dosage: '500mg · Twice daily · With meals', active: true },
    { id: 2, name: 'Lisinopril', dosage: '10mg · Once daily · Morning', active: true },
  ])
  const [comorbidities, setComorbidities] = useState(['Hypertension', 'Dyslipidaemia'])
  const [notes, setNotes] = useState('Poorly controlled T2DM. Referred by GP. Begin structured nutrition & lifestyle intervention.')

  const [budgetLevel, setBudgetLevel] = useState<BudgetLevel>('Low')
  const [restrictions, setRestrictions] = useState<string[]>(['Low-sodium', 'Low-GI'])
  const [cuisines, setCuisines] = useState<string[]>(['West African', 'Mediterranean'])
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('Light')
  const [mealReminders, setMealReminders] = useState({ breakfast: true, lunch: true, dinner: true })

  const age = useMemo(() => calcAge(dob), [dob])
  const bmi = useMemo(() => calcBmi(weightKg, heightCm), [weightKg, heightCm])
  const bmr = useMemo(() => calcBmr(weightKg, heightCm, age), [weightKg, heightCm, age])
  const caloriePlan = useMemo(() => calcCaloriePlan(bmr, activityLevel), [bmr, activityLevel])

  const patientName = `${firstName} ${lastName}`.trim()

  const toggleTag = (value: string, values: string[], setValues: (next: string[]) => void) => {
    setValues(values.includes(value) ? values.filter(v => v !== value) : [...values, value])
  }

  const addMedication = () => {
    setMedications(prev => [
      ...prev,
      {
        id: Date.now(),
        name: 'Atorvastatin',
        dosage: '20mg · Once daily · Evening',
        active: true,
      },
    ])
  }

  const removeMedication = (id: number) => {
    setMedications(prev => prev.filter(m => m.id !== id))
  }

  const goToStep = (nextStep: number) => {
    setStep(Math.max(1, Math.min(4, nextStep)))
  }

  const handleSaveDraft = () => {
    alert('Draft saved locally for this onboarding flow.')
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <aside className="w-56 bg-slate-900 flex flex-col py-6 px-4 shrink-0">
        <div className="flex items-center gap-2 px-1 mb-8">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-xs">⚕️</div>
          <span className="text-white font-bold tracking-widest text-sm">CARESYNC</span>
        </div>

        <p className="text-slate-500 text-xs font-semibold px-1 mb-3 tracking-wider">ONBOARDING STEPS</p>
        <div className="relative flex flex-col gap-4">
          {onboardingSteps.map(item => {
            const isDone = step > item.id
            const isActive = step === item.id

            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id <= step) {
                    goToStep(item.id)
                  }
                }}
                className="flex items-start gap-3 text-left"
              >
                <div className={clsx(
                  'w-7 h-7 mt-0.5 rounded-full text-xs font-bold flex items-center justify-center border',
                  isDone && 'bg-emerald-500 border-emerald-500 text-white',
                  isActive && 'bg-teal-500 border-teal-500 text-white',
                  !isDone && !isActive && 'bg-slate-800 border-slate-700 text-slate-400',
                )}>
                  {isDone ? '✓' : item.id}
                </div>
                <div>
                  <p className={clsx('font-semibold text-sm', isActive || isDone ? 'text-teal-300' : 'text-slate-400')}>
                    {item.title}
                  </p>
                  <p className="text-xs text-slate-500">{item.subtitle}</p>
                </div>
              </button>
            )
          })}
        </div>

        <div className="mt-auto flex items-center gap-2 px-1 pt-4 border-t border-slate-700">
          <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center text-white text-xs font-bold">DJ</div>
          <div>
            <p className="text-white text-xs font-semibold">Dr. Johnson</p>
            <p className="text-slate-400 text-xs">Endocrinologist</p>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-slate-200 px-7 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <button onClick={() => navigate('/dashboard')} className="text-slate-400 hover:text-slate-700">← Patient List</button>
            <span className="text-slate-300">/</span>
            <span className="font-bold text-slate-800">Onboard New Patient</span>
            {step > 1 && <span className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 font-medium">{patientName}</span>}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400">Step {step} of 4</span>
            <button onClick={() => navigate('/dashboard')} className="text-sm border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50">× Cancel</button>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto p-7">
          {step === 1 && (
            <div className="max-w-4xl mx-auto space-y-5">
              <div>
                <h2 className="text-3xl font-bold text-slate-800">Personal Information</h2>
                <p className="text-slate-500 mt-1">Enter the patient's basic details to create their CareSync account.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input label="First Name" value={firstName} onChange={setFirstName} required />
                <Input label="Last Name" value={lastName} onChange={setLastName} required />
                <Input label="Email Address" value={email} onChange={setEmail} required type="email" />
                <Input label="Phone Number" value={phone} onChange={setPhone} />
                <Input label="Date of Birth" value={dob} onChange={setDob} required type="date" />
                <ReadOnlyField label="Age" value={age ? `${age} (auto)` : ''} />
                <SelectField label="Gender" value={gender} onChange={setGender} options={['Female', 'Male', 'Other']} required />
                <SelectField label="Country of Residence" value={country} onChange={setCountry} options={['GH Ghana', 'NG Nigeria', 'KE Kenya', 'ZA South Africa']} />
                <SelectField label="Preferred Language" value={language} onChange={setLanguage} options={['English', 'French', 'Swahili']} />
              </div>

              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="font-semibold text-slate-700 mb-3">Emergency Contact <span className="text-slate-400 font-normal">(optional)</span></p>
                <div className="grid grid-cols-3 gap-4">
                  <Input label="Full Name" value={emergencyName} onChange={setEmergencyName} />
                  <SelectField label="Relationship" value={emergencyRelationship} onChange={setEmergencyRelationship} options={['Spouse', 'Parent', 'Sibling', 'Friend']} />
                  <Input label="Phone" value={emergencyPhone} onChange={setEmergencyPhone} />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="max-w-4xl mx-auto space-y-5">
              <div>
                <h2 className="text-3xl font-bold text-slate-800">Medical Profile</h2>
                <p className="text-slate-500 mt-1">Record diagnosis, current medications, and baseline clinical readings.</p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-700">Diabetes Type</p>
                <div className="grid grid-cols-4 gap-3">
                  {(['Type 2', 'Type 1', 'Pre-diabetic', 'Gestational'] as DiabetesType[]).map(item => (
                    <ChoiceButton key={item} selected={diabetesType === item} onClick={() => setDiabetesType(item)}>{item}</ChoiceButton>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3">
                <Input label="Weight (kg)" value={String(weightKg)} onChange={v => setWeightKg(Number(v) || 0)} />
                <Input label="Height (cm)" value={String(heightCm)} onChange={v => setHeightCm(Number(v) || 0)} />
                <Input label="Systolic BP" value={String(systolicBp)} onChange={v => setSystolicBp(Number(v) || 0)} />
                <Input label="Diastolic BP" value={String(diastolicBp)} onChange={v => setDiastolicBp(Number(v) || 0)} />
                <Input label="Fasting Glucose (mmol/L)" value={String(fastingGlucose)} onChange={v => setFastingGlucose(Number(v) || 0)} />
                <Input label="HbA1c (%)" value={String(hba1c)} onChange={v => setHba1c(Number(v) || 0)} />
                <ReadOnlyField label="BMR (auto-calc)" value={`${Math.round(bmr).toLocaleString()} kcal`} />
                <ReadOnlyField label="BMI (auto-calc)" value={bmi ? bmi.toFixed(1) : ''} warning={bmi >= 25} />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-slate-700">Current Medications</p>
                  <button onClick={addMedication} className="text-sm px-3 py-1 rounded-lg border border-slate-200 hover:bg-slate-50">+ Add Medication</button>
                </div>
                <div className="rounded-2xl border border-slate-200 overflow-hidden">
                  {medications.map(med => (
                    <div key={med.id} className="flex items-center justify-between px-4 py-3 border-b border-slate-100 last:border-b-0">
                      <div>
                        <p className="font-semibold text-slate-800">{med.name}</p>
                        <p className="text-sm text-slate-500">{med.dosage}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">{med.active ? 'Active' : 'Inactive'}</span>
                        <button onClick={() => removeMedication(med.id)} className="text-slate-400 hover:text-red-500">×</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-700 mb-2">Comorbidities</p>
                  <div className="flex flex-wrap gap-2">
                    {comorbidities.map(tag => (
                      <button key={tag} onClick={() => setComorbidities(prev => prev.filter(c => c !== tag))} className="text-sm rounded-full bg-teal-100 text-teal-700 px-3 py-1">
                        {tag}
                      </button>
                    ))}
                    <button onClick={() => setComorbidities(prev => prev.includes('Neuropathy') ? prev : [...prev, 'Neuropathy'])} className="text-sm rounded-full border border-slate-200 px-3 py-1 hover:bg-slate-50">
                      + Add
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-700 mb-2">Clinical Notes</p>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="w-full min-h-24 rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-500 flex items-center justify-between">
                <span>Auto Alert Thresholds: Glucose &gt; 11.0 · BP &gt; 145/95 · Missed meals &gt; 3 days · Risk score &gt; 0.75</span>
                <button className="text-red-500 hover:text-red-600 underline">Customise →</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="max-w-5xl mx-auto grid grid-cols-[1fr_360px] gap-5">
              <div className="space-y-5">
                <div>
                  <h2 className="text-3xl font-bold text-slate-800">Dietary Preferences & Health Goals</h2>
                  <p className="text-slate-500 mt-1">Configure the patient's meal plan parameters and care targets.</p>
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-700 mb-2">Monthly Food Budget</p>
                  <div className="grid grid-cols-3 gap-3">
                    {(['Low', 'Medium', 'High'] as BudgetLevel[]).map(level => (
                      <ChoiceButton key={level} selected={budgetLevel === level} onClick={() => setBudgetLevel(level)}>
                        {level}
                      </ChoiceButton>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-700 mb-2">Dietary Restrictions</p>
                  <div className="flex flex-wrap gap-2">
                    {['Low-sodium', 'Low-GI', 'Vegetarian', 'Vegan', 'Gluten-free', 'Dairy-free', 'No nuts'].map(tag => (
                      <TagButton
                        key={tag}
                        selected={restrictions.includes(tag)}
                        onClick={() => toggleTag(tag, restrictions, setRestrictions)}
                      >
                        {tag}
                      </TagButton>
                    ))}
                    <button onClick={() => toggleTag('Custom', restrictions, setRestrictions)} className="text-sm rounded-full border border-slate-200 px-3 py-1 hover:bg-slate-50">+ Custom</button>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-700 mb-2">Cuisine Preferences</p>
                  <div className="grid grid-cols-2 gap-3">
                    {['West African', 'Mediterranean', 'Asian', 'Western'].map(tag => (
                      <ChoiceButton key={tag} selected={cuisines.includes(tag)} onClick={() => toggleTag(tag, cuisines, setCuisines)}>
                        {tag}
                      </ChoiceButton>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-700 mb-2">Physical Activity Level</p>
                  <div className="grid grid-cols-4 gap-3">
                    {(['Sedentary', 'Light', 'Moderate', 'Active'] as ActivityLevel[]).map(level => (
                      <ChoiceButton key={level} selected={activityLevel === level} onClick={() => setActivityLevel(level)}>{level}</ChoiceButton>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl p-5 text-white bg-gradient-to-br from-slate-900 to-teal-900">
                  <p className="text-xs uppercase tracking-wide text-teal-200">Calorie Plan</p>
                  <p className="text-5xl font-bold mt-2">{caloriePlan.toLocaleString()}</p>
                  <p className="text-sm text-slate-200">kcal/day</p>
                  <p className="text-sm text-slate-300 mt-3">BMR {Math.round(bmr).toLocaleString()} · {activityLevel} activity · Deficit for weight loss</p>
                  <div className="mt-4 text-sm space-y-1">
                    <div className="flex justify-between"><span>Meals per day</span><span>3 main + 1 snack</span></div>
                    <div className="flex justify-between"><span>Daily step goal</span><span>8,000 steps</span></div>
                    <div className="flex justify-between"><span>Plan start</span><span>{new Date().toLocaleDateString()}</span></div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="font-semibold text-slate-700 mb-2">Health Targets</p>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between"><span className="text-slate-500">Target Weight</span><span className="font-semibold text-teal-600">73.0 kg</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Target HbA1c</span><span className="font-semibold text-teal-600">&lt; 7.0%</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Target BP</span><span className="font-semibold text-teal-600">&lt; 130/80</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Timeline</span><span className="font-semibold text-teal-600">6 months</span></div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="font-semibold text-slate-700 mb-2">Meal Log Reminders</p>
                  <ToggleRow label="Breakfast" checked={mealReminders.breakfast} onChange={() => setMealReminders(prev => ({ ...prev, breakfast: !prev.breakfast }))} />
                  <ToggleRow label="Lunch" checked={mealReminders.lunch} onChange={() => setMealReminders(prev => ({ ...prev, lunch: !prev.lunch }))} />
                  <ToggleRow label="Dinner" checked={mealReminders.dinner} onChange={() => setMealReminders(prev => ({ ...prev, dinner: !prev.dinner }))} />
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="max-w-4xl mx-auto space-y-4">
              <h2 className="text-3xl font-bold text-slate-800">Review & Confirm Patient Summary</h2>

              <div className="rounded-2xl border border-slate-200 p-4 bg-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-teal-500 text-white font-bold flex items-center justify-center">
                      {(firstName[0] || 'S')}{(lastName[0] || 'M')}
                    </div>
                    <div>
                      <p className="font-bold text-xl text-slate-800">{patientName}</p>
                      <p className="text-sm text-slate-500">{age} yrs · {gender} · {email} · {country}</p>
                      <p className="text-sm text-slate-500">{weightKg}kg · {heightCm}cm · BMI {bmi.toFixed(1)} · BMR {Math.round(bmr).toLocaleString()} kcal/day</p>
                    </div>
                  </div>
                  <button onClick={() => goToStep(1)} className="border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50">✏️ Edit</button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <SummaryCard title="Medical" rows={[
                  ['Type', `${diabetesType} Diabetes`],
                  ['HbA1c', `${hba1c}%`],
                  ['Glucose', `${fastingGlucose} mmol/L`],
                  ['BP', `${systolicBp}/${diastolicBp}`],
                  ['Meds', medications.map(m => m.name).join(', ')],
                ]} />
                <SummaryCard title="Dietary" rows={[
                  ['Calories', `${caloriePlan.toLocaleString()} kcal/day`],
                  ['Cuisine', cuisines.join(', ')],
                  ['Restrictions', restrictions.join(', ')],
                  ['Budget', budgetLevel],
                  ['Activity', `${activityLevel} · 8k steps`],
                ]} />
                <SummaryCard title="Targets" rows={[
                  ['Weight', '73.0 kg'],
                  ['HbA1c', '< 7.0%'],
                  ['BP', '< 130/80'],
                  ['Timeline', '6 months'],
                  ['Start', new Date().toLocaleDateString()],
                ]} />
              </div>

              <div className="rounded-2xl border border-slate-200 p-4 bg-white space-y-2">
                <p className="font-semibold text-slate-800">Patient Invite Email Preview</p>
                <p className="text-sm text-slate-500">To: {email} · Subject: "Your CareSync health plan is ready"</p>
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                  <p className="text-sm text-slate-700">Hi {firstName}, Dr. Johnson has set up your personalised diabetes care plan on CARESYNC.</p>
                  <button
                    disabled
                    className="mt-3 w-full bg-teal-500/70 cursor-not-allowed text-white font-semibold py-2.5 rounded-lg"
                  >
                    Activate My Account →
                  </button>
                  <p className="text-xs text-slate-500 mt-3">Temp password: cs-SM-2026-0306 · Link expires in 48 hours.</p>
                </div>
              </div>
            </div>
          )}
        </section>

        <footer className="border-t border-slate-200 bg-white px-7 py-4 flex items-center justify-between">
          <div>
            {step > 1 ? (
              <button onClick={() => goToStep(step - 1)} className="border border-slate-200 px-4 py-2 rounded-xl hover:bg-slate-50">← Back</button>
            ) : (
              <button onClick={() => navigate('/dashboard')} className="border border-slate-200 px-4 py-2 rounded-xl hover:bg-slate-50">× Cancel</button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {step === 4 && (
              <button onClick={handleSaveDraft} className="border border-slate-200 px-4 py-2 rounded-xl hover:bg-slate-50">Save Draft</button>
            )}

            {step < 4 ? (
              <button onClick={() => goToStep(step + 1)} className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-xl font-semibold">
                {step === 1 && 'Next: Medical Profile →'}
                {step === 2 && 'Next: Dietary & Goals →'}
                {step === 3 && 'Next: Review & Confirm →'}
              </button>
            ) : (
              <button
                disabled
                className="bg-teal-500/70 cursor-not-allowed text-white px-4 py-2 rounded-xl font-semibold"
              >
                🚀 Onboard Patient & Send Invite
              </button>
            )}
          </div>
        </footer>
      </main>
    </div>
  )
}

function Input({
  label,
  value,
  onChange,
  required,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  type?: string
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
      {label}{required ? ' *' : ''}
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="rounded-xl border border-slate-200 px-3 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-400"
      />
    </label>
  )
}

function SelectField({
  label,
  value,
  onChange,
  options,
  required,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: string[]
  required?: boolean
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
      {label}{required ? ' *' : ''}
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="rounded-xl border border-slate-200 px-3 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-400"
      >
        {options.map(option => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </label>
  )
}

function ReadOnlyField({ label, value, warning }: { label: string; value: string; warning?: boolean }) {
  return (
    <div className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
      {label}
      <div className={clsx(
        'rounded-xl border px-3 py-2.5 text-slate-700',
        warning ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-emerald-50 border-emerald-100',
      )}>
        {value}
      </div>
    </div>
  )
}

function ChoiceButton({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: string }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'rounded-xl border px-3 py-2.5 text-sm font-semibold transition',
        selected ? 'bg-teal-500 border-teal-500 text-white' : 'border-slate-200 text-slate-500 hover:bg-slate-50',
      )}
    >
      {children}
    </button>
  )
}

function TagButton({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: string }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'text-sm rounded-full border px-3 py-1 transition',
        selected ? 'bg-teal-100 border-teal-200 text-teal-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50',
      )}
    >
      {children}
    </button>
  )
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm text-slate-700">{label}</span>
      <button
        onClick={onChange}
        className={clsx(
          'w-11 h-6 rounded-full relative transition',
          checked ? 'bg-teal-500' : 'bg-slate-300',
        )}
      >
        <span className={clsx(
          'absolute top-0.5 w-5 h-5 rounded-full bg-white transition',
          checked ? 'left-5' : 'left-0.5',
        )} />
      </button>
    </div>
  )
}

function SummaryCard({ title, rows }: { title: string; rows: [string, string][] }) {
  return (
    <div className="rounded-2xl border border-slate-200 p-4 bg-white">
      <p className="font-semibold text-slate-800 mb-2">{title}</p>
      <div className="space-y-1.5 text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-2">
            <span className="text-slate-500">{label}</span>
            <span className="font-semibold text-slate-700 text-right">{value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
