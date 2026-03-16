import { Patient } from '../../types'

interface PatientCardProps {
  patient: Patient
}

export function PatientCard({ patient }: PatientCardProps) {
  const riskBgColor = patient.riskLevel === 'high' ? 'bg-red-100' : patient.riskLevel === 'medium' ? 'bg-yellow-100' : 'bg-green-100'
  const riskTextColor = patient.riskLevel === 'high' ? 'text-red-700' : patient.riskLevel === 'medium' ? 'text-yellow-700' : 'text-green-700'

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">{patient.firstName} {patient.lastName}</h3>
          <p className="text-sm text-gray-600">DOB: {patient.dateOfBirth}</p>
        </div>
        <span className={`${riskBgColor} ${riskTextColor} text-xs font-bold px-3 py-1 rounded-full`}>
          {patient.riskLevel.toUpperCase()}
        </span>
      </div>

      <div className="space-y-3 mb-4">
        <div>
          <p className="text-xs text-gray-500 font-medium">ADHERENCE SCORE</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  patient.adherenceScore >= 80
                    ? 'bg-green-600'
                    : patient.adherenceScore >= 60
                    ? 'bg-yellow-600'
                    : 'bg-red-600'
                }`}
                style={{ width: `${patient.adherenceScore}%` }}
              ></div>
            </div>
            <span className="font-bold text-sm text-gray-700">{patient.adherenceScore}%</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-gray-500">Condition</p>
            <p className="font-medium text-gray-900">{patient.diabetesType.toUpperCase()}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Status</p>
            <p className="font-medium text-gray-900 capitalize">{patient.status}</p>
          </div>
        </div>
      </div>

      <button className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition">
        View Details
      </button>
    </div>
  )
}
