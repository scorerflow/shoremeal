import { Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import type { PlanStatus } from '@/types'

const STATUS_CONFIG: Record<PlanStatus, {
  icon: typeof Clock
  label: string
  description: string
  colour: string
  bg: string
  bgBorder: string
}> = {
  pending: {
    icon: Clock,
    label: 'Queued',
    description: 'Your plan is in the queue and will begin generating shortly.',
    colour: 'text-amber-600',
    bg: 'bg-amber-100',
    bgBorder: 'bg-amber-50 border-amber-200',
  },
  generating: {
    icon: Loader2,
    label: 'Generating',
    description: 'Claude is creating a personalised nutrition plan. This usually takes 30-60 seconds.',
    colour: 'text-blue-600',
    bg: 'bg-blue-100',
    bgBorder: 'bg-blue-50 border-blue-200',
  },
  completed: {
    icon: CheckCircle2,
    label: 'Completed',
    description: 'Your nutrition plan is ready.',
    colour: 'text-green-600',
    bg: 'bg-green-100',
    bgBorder: 'bg-green-50 border-green-200',
  },
  failed: {
    icon: XCircle,
    label: 'Failed',
    description: 'Something went wrong generating this plan. Please try again.',
    colour: 'text-red-600',
    bg: 'bg-red-100',
    bgBorder: 'bg-red-50 border-red-200',
  },
}

export function getStatusConfig(status: PlanStatus) {
  return STATUS_CONFIG[status] || STATUS_CONFIG.pending
}

/** Pill badge — used in list views */
export function StatusPill({ status }: { status: PlanStatus }) {
  const config = getStatusConfig(status)
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.colour}`}>
      {config.label}
    </span>
  )
}

/** Icon-only status — used inline in client rows */
export function StatusIcon({ status, className = 'h-4 w-4' }: { status: PlanStatus; className?: string }) {
  const config = getStatusConfig(status)
  const Icon = config.icon
  return (
    <Icon className={`${className} ${config.colour} ${status === 'generating' ? 'animate-spin' : ''}`} />
  )
}

/** Full status banner — used on plan detail page */
export function StatusBanner({ status }: { status: PlanStatus }) {
  const config = getStatusConfig(status)
  const Icon = config.icon
  const isActive = status === 'pending' || status === 'generating'

  return (
    <div className={`border rounded-lg p-4 ${config.bgBorder}`}>
      <div className="flex items-center gap-3">
        <Icon className={`h-6 w-6 flex-shrink-0 ${config.colour} ${isActive ? 'animate-spin' : ''}`} />
        <div>
          <h2 className={`font-semibold ${config.colour}`}>{config.label}</h2>
          <p className="text-sm text-gray-700">{config.description}</p>
        </div>
      </div>
      {isActive && (
        <div className="mt-3 ml-9">
          <div className="w-full bg-white/50 rounded-full h-1.5 overflow-hidden">
            <div className="bg-current h-1.5 rounded-full animate-pulse w-2/3" style={{ color: 'currentColor' }} />
          </div>
        </div>
      )}
    </div>
  )
}
