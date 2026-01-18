import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  badge?: string
  badgeColor?: 'gray' | 'green' | 'blue' | 'yellow' | 'red'
  trend?: {
    value: number
    positive: boolean
  }
}

const badgeColors = {
  gray: 'bg-gray-100 text-gray-600',
  green: 'bg-green-100 text-green-700',
  blue: 'bg-blue-100 text-blue-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  red: 'bg-red-100 text-red-700',
}

export function StatCard({
  title,
  value,
  icon: Icon,
  badge,
  badgeColor = 'gray',
  trend
}: StatCardProps) {
  return (
    <div className="bg-white border border-gray-100 rounded p-4 hover:border-gray-200 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <div className="p-1.5 bg-gray-50 rounded">
          <Icon className="w-3.5 h-3.5 text-gray-500" />
        </div>
        {badge && (
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${badgeColors[badgeColor]}`}>
            {badge}
          </span>
        )}
      </div>
      <div className="text-lg font-semibold text-gray-900">{value}</div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">{title}</span>
        {trend && (
          <span className={`text-[10px] font-medium ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
            {trend.positive ? '+' : ''}{trend.value}%
          </span>
        )}
      </div>
    </div>
  )
}
