'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, CheckCircle2, XCircle, Clock, FileText } from 'lucide-react'

type PlanStatus = 'pending' | 'generating' | 'completed' | 'failed'

interface PlanData {
  id: string
  status: PlanStatus
  plan_text?: string
  client_name?: string
  created_at: string
  updated_at: string
}

const STATUS_CONFIG = {
  pending: {
    icon: Clock,
    label: 'Queued',
    description: 'Your plan is in the queue and will begin generating shortly.',
    colour: 'text-amber-600',
    bg: 'bg-amber-50 border-amber-200',
  },
  generating: {
    icon: Loader2,
    label: 'Generating',
    description: 'Claude is creating a personalised nutrition plan. This usually takes 30-60 seconds.',
    colour: 'text-blue-600',
    bg: 'bg-blue-50 border-blue-200',
  },
  completed: {
    icon: CheckCircle2,
    label: 'Completed',
    description: 'Your nutrition plan is ready.',
    colour: 'text-green-600',
    bg: 'bg-green-50 border-green-200',
  },
  failed: {
    icon: XCircle,
    label: 'Failed',
    description: 'Something went wrong generating this plan. Please try again.',
    colour: 'text-red-600',
    bg: 'bg-red-50 border-red-200',
  },
}

export default function PlanDetailPage() {
  const params = useParams()
  const planId = params.id as string
  const [plan, setPlan] = useState<PlanData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/plans/${planId}/status`)
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to fetch plan status')
      }
      const data = await res.json()
      setPlan(data)
      return data.status as PlanStatus
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      return null
    } finally {
      setLoading(false)
    }
  }, [planId])

  useEffect(() => {
    const startPolling = async () => {
      const status = await fetchStatus()

      if (status === 'pending' || status === 'generating') {
        intervalRef.current = setInterval(async () => {
          const newStatus = await fetchStatus()
          if (newStatus !== 'pending' && newStatus !== 'generating') {
            if (intervalRef.current) {
              clearInterval(intervalRef.current)
              intervalRef.current = null
            }
          }
        }, 3000)
      }
    }

    startPolling()

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [fetchStatus])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-800" />
      </div>
    )
  }

  if (error || !plan) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link href="/dashboard" className="inline-flex items-center text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </div>
        <div className="card bg-red-50 border border-red-200">
          <div className="flex items-center gap-3">
            <XCircle className="h-6 w-6 text-red-600 flex-shrink-0" />
            <div>
              <h2 className="font-semibold text-red-900">Error</h2>
              <p className="text-red-700">{error || 'Plan not found'}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const config = STATUS_CONFIG[plan.status]
  const StatusIcon = config.icon
  const isActive = plan.status === 'pending' || plan.status === 'generating'

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link href="/dashboard" className="inline-flex items-center text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {plan.client_name ? `${plan.client_name}'s Nutrition Plan` : 'Nutrition Plan'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Created {new Date(plan.created_at).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
      </div>

      {/* Status banner */}
      <div className={`border rounded-lg p-4 mb-6 ${config.bg}`}>
        <div className="flex items-center gap-3">
          <StatusIcon
            className={`h-6 w-6 flex-shrink-0 ${config.colour} ${isActive ? 'animate-spin' : ''}`}
          />
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

      {/* Plan content */}
      {plan.status === 'completed' && plan.plan_text && (
        <div className="card">
          <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-200">
            <FileText className="h-5 w-5 text-primary-800" />
            <h2 className="text-lg font-semibold text-gray-900">Plan Details</h2>
          </div>
          <div className="prose prose-sm max-w-none">
            <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
              {plan.plan_text}
            </div>
          </div>
        </div>
      )}

      {/* Failed - retry link */}
      {plan.status === 'failed' && (
        <div className="card text-center py-8">
          <XCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Generation Failed</h3>
          <p className="text-gray-600 mb-6">
            We were unable to generate this nutrition plan. This can happen due to high demand or a temporary issue.
          </p>
          <Link href="/dashboard/clients/new" className="btn-primary">
            Try Again
          </Link>
        </div>
      )}
    </div>
  )
}
