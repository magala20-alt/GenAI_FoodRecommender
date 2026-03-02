export const formatDate = (date: string | Date) => {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export const formatDateTime = (date: string | Date) => {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const formatTime = (date: string | Date) => {
  const d = new Date(date)
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export const capitalizeFirstLetter = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export const truncateText = (text: string, length: number) => {
  return text.length > length ? text.substring(0, length) + '...' : text
}

export const calculateBMI = (weightKg: number, heightM: number) => {
  return (weightKg / (heightM * heightM)).toFixed(1)
}

export const getRiskColor = (riskLevel: 'low' | 'medium' | 'high') => {
  switch (riskLevel) {
    case 'low':
      return '#10b981' // emerald
    case 'medium':
      return '#f59e0b' // amber
    case 'high':
      return '#ef4444' // red
  }
}

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
    case 'active':
      return '#10b981'
    case 'in_progress':
      return '#3b82f6'
    case 'pending':
      return '#f59e0b'
    case 'cancelled':
    case 'inactive':
      return '#6b7280'
    default:
      return '#6b7280'
  }
}

export const getAdhereanceStatus = (adherence: number) => {
  if (adherence >= 80) return { label: 'Excellent', color: '#10b981' }
  if (adherence >= 60) return { label: 'Good', color: '#84cc16' }
  if (adherence >= 40) return { label: 'Fair', color: '#f59e0b' }
  return { label: 'Poor', color: '#ef4444' }
}

export const cn = (...classes: (string | undefined | null | false)[]) => {
  return classes.filter(Boolean).join(' ')
}
