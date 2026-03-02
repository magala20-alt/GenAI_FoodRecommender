import { useEffect, useState } from 'react'
import { patientService } from '../services/patientService'
import { DashboardStats, Patient } from '../types'
import { PatientCard } from '../components/molecules/PatientCard'

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [patients, setPatients] = useState<Patient[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [generatingAI, setGeneratingAI] = useState(false)

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    setIsLoading(true)
    setError(null)
    try {
      // Load patients
      const allPatients = await patientService.getPatients()
      setPatients(allPatients)

      // Calculate stats
      const highRiskCount = allPatients.filter(p => p.riskLevel === 'high').length
      const activeCount = allPatients.filter(p => p.status !== 'inactive').length
      const avgAdherence = allPatients.length > 0
        ? Math.round(allPatients.reduce((sum, p) => sum + p.adherenceScore, 0) / allPatients.length)
        : 0

      setStats({
        totalPatients: allPatients.length,
        activePatients: activeCount,
        highRiskCount,
        avgAdherence,
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
      // Generate AI summaries in background
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <StatCard
              title="Total Patients"
              value={stats.totalPatients}
              Unit="{0}"
            />
            <StatCard
              title="Active Patients"
              value={stats.activePatients}
              unit=""
            />
            <StatCard
              title="High Risk"
              value={stats.highRiskCount}
              unit=""
              highlight="danger"
            />
            <StatCard
              title="Avg Adherence"
              value={stats.avgAdherence}
              unit="%"
            />
            <StatCard
              title="Pending Interventions"
              value={stats.pendingInterventions}
              unit=""
              highlight="warning"
            />
            <StatCard
              title="Reviews This Week"
              value={stats.reviewsThisWeek}
              unit=""
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="mb-8 flex gap-4">
          <button
            onClick={loadDashboard}
            disabled={isLoading}
            className="px-6 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition"
          >
            Refresh
          </button>
          <button
            onClick={handleGenerateAISummaries}
            disabled={generatingAI || patients.length === 0}
            className="px-6 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition"
          >
            {generatingAI ? 'Generating...' : 'Generate AI Summaries'}
          </button>
        </div>

        {/* Patients Grid */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Patients</h2>
          {patients.length === 0 ? (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <p className="text-gray-600">No patients found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {patients.map(patient => (
                <PatientCard key={patient.id} patient={patient} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface StatCardProps {
  title: string
  value: number
  unit: string
  highlight?: 'danger' | 'warning'
}

function StatCard({ title, value, unit, highlight }: StatCardProps) {
  const bgColor = highlight === 'danger' ? 'bg-red-50' : highlight === 'warning' ? 'bg-yellow-50' : 'bg-blue-50'
  const textColor = highlight === 'danger' ? 'text-red-600' : highlight === 'warning' ? 'text-yellow-600' : 'text-blue-600'

  return (
    <div className={`${bgColor} rounded-lg p-6 border border-gray-200`}>
      <p className="text-gray-600 text-sm font-medium mb-2">{title}</p>
      <p className={`${textColor} text-4xl font-bold`}>
        {value}
        <span className="text-lg">{unit}</span>
      </p>
    </div>
  )
}
