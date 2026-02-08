import type { ReactNode } from 'react'

export function StatCard({
  icon,
  label,
  value,
  iconBg,
}: {
  icon: ReactNode
  label: string
  value: string | number
  iconBg: string
}) {
  return (
    <div className="card">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg mr-4 ${iconBg}`}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-gray-600">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  )
}
