'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, XCircle, FileText, Download } from 'lucide-react'
import { StatusBanner } from '@/components/StatusBadge'
import { EmptyState } from '@/components/EmptyState'
import { AlertBanner } from '@/components/AlertBanner'
import { APP_CONFIG } from '@/lib/config'

type PlanStatus = 'pending' | 'generating' | 'completed' | 'failed'

interface PlanData {
  id: string
  status: PlanStatus
  plan_text?: string
  client_name?: string
  created_at: string
  updated_at: string
}

export default function PlanDetailPage() {
  const params = useParams()
  const planId = params.id as string
  const [plan, setPlan] = useState<PlanData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [retrying, setRetrying] = useState(false)
  const [pollingTimeout, setPollingTimeout] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const pollCountRef = useRef(0)

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

  const handleDownloadPdf = async () => {
    setPdfLoading(true)
    try {
      const res = await fetch(`/api/plans/${planId}/pdf`)
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to generate PDF')
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = res.headers.get('Content-Disposition')?.match(/filename="(.+)"/)?.[1] || 'Nutrition_Plan.pdf'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download PDF')
    } finally {
      setPdfLoading(false)
    }
  }

  const handleRetry = async () => {
    setRetrying(true)
    setError(null)
    try {
      const res = await fetch(`/api/plans/${planId}/retry`, { method: 'POST' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to retry plan generation')
      }
      await fetchStatus()
      pollCountRef.current = 0
      setPollingTimeout(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to retry plan generation')
    } finally {
      setRetrying(false)
    }
  }

  useEffect(() => {
    pollCountRef.current = 0
    setPollingTimeout(false)

    const startPolling = async () => {
      const status = await fetchStatus()

      if (status === 'pending' || status === 'generating') {
        intervalRef.current = setInterval(async () => {
          pollCountRef.current += 1

          if (pollCountRef.current >= APP_CONFIG.polling.maxPolls) {
            if (intervalRef.current) {
              clearInterval(intervalRef.current)
              intervalRef.current = null
            }
            setPollingTimeout(true)
            return
          }

          const newStatus = await fetchStatus()
          if (newStatus !== 'pending' && newStatus !== 'generating') {
            if (intervalRef.current) {
              clearInterval(intervalRef.current)
              intervalRef.current = null
            }
          }
        }, APP_CONFIG.polling.intervalMs)
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
        <AlertBanner variant="error">
          <div className="flex items-center gap-3">
            <XCircle className="h-6 w-6 text-red-600 flex-shrink-0" />
            <div>
              <h2 className="font-semibold text-red-900">Error</h2>
              <p className="text-red-700">{error || 'Plan not found'}</p>
            </div>
          </div>
        </AlertBanner>
      </div>
    )
  }

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
        {plan.status === 'completed' && (
          <button
            onClick={handleDownloadPdf}
            disabled={pdfLoading}
            className="btn-primary inline-flex items-center gap-2"
          >
            {pdfLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating PDF...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Download PDF
              </>
            )}
          </button>
        )}
      </div>

      {/* Status banner */}
      <div className="mb-6">
        <StatusBanner status={plan.status} />
      </div>

      {/* Polling timeout warning */}
      {pollingTimeout && (plan.status === 'pending' || plan.status === 'generating') && (
        <AlertBanner variant="warning">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-semibold text-yellow-900">Taking longer than expected</h2>
              <p className="text-yellow-700">
                Your plan is still being generated, but it&apos;s taking longer than usual.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                pollCountRef.current = 0
                setPollingTimeout(false)
                fetchStatus()
              }}
              className="btn-secondary flex-shrink-0 text-sm"
            >
              Check again
            </button>
          </div>
        </AlertBanner>
      )}

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

      {/* Failed - retry */}
      {plan.status === 'failed' && (
        <div className="card">
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
            <XCircle className="h-12 w-12 text-red-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Generation Failed</h2>
            <p className="text-gray-600 mb-6 max-w-md">
              We were unable to generate this nutrition plan. This can happen due to high demand or a temporary issue.
              Click below to try generating the plan again.
            </p>
            <button
              onClick={handleRetry}
              disabled={retrying}
              className="btn-primary inline-flex items-center gap-2"
            >
              {retrying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Retrying...
                </>
              ) : (
                'Retry Generation'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
