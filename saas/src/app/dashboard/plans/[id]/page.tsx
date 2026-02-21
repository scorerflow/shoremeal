'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { ArrowLeft, Loader2, XCircle, FileText, Download } from 'lucide-react'
import { StatusBanner } from '@/components/StatusBadge'
import { EmptyState } from '@/components/EmptyState'
import { AlertBanner } from '@/components/AlertBanner'
import { QueueStatus } from '@/components/QueueStatus'
import { APP_CONFIG } from '@/lib/config'
import remarkGfm from 'remark-gfm'

// Code-split react-markdown - only load when plan is completed
const ReactMarkdown = dynamic(() => import('react-markdown'), {
  loading: () => (
    <div className="flex items-center justify-center py-8">
      <Loader2 className="h-6 w-6 animate-spin text-primary-800" />
    </div>
  ),
  ssr: false, // Client-side only for better performance
})

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

  // Memoize markdown rendering to prevent unnecessary re-parsing
  const renderedMarkdown = useMemo(() => {
    if (!plan?.plan_text) return null

    return (
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {plan.plan_text}
      </ReactMarkdown>
    )
  }, [plan?.plan_text])

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

      {/* Status banner with queue info */}
      <div className="mb-6">
        {(plan.status === 'pending' || plan.status === 'generating') ? (
          <QueueStatus
            planId={planId}
            initialStatus={plan.status}
            onStatusChange={(newStatus) => {
              if (newStatus === 'completed' || newStatus === 'failed') {
                fetchStatus() // Refresh plan data
              }
            }}
          />
        ) : (
          <StatusBanner status={plan.status} />
        )}
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
          <div className="prose prose-lg max-w-none markdown-content">
            <style jsx>{`
              .markdown-content :global(h1) {
                font-size: 2rem;
                font-weight: 700;
                margin-top: 3rem;
                margin-bottom: 1.5rem;
                color: #111827;
              }
              .markdown-content :global(h2) {
                font-size: 1.5rem;
                font-weight: 600;
                margin-top: 2.5rem;
                margin-bottom: 1.25rem;
                color: #111827;
              }
              .markdown-content :global(h3) {
                font-size: 1.25rem;
                font-weight: 600;
                margin-top: 2rem;
                margin-bottom: 1rem;
                color: #374151;
              }
              .markdown-content :global(p) {
                margin-bottom: 1.25rem;
                line-height: 1.75;
                color: #4b5563;
              }
              .markdown-content :global(blockquote) {
                border-left: 4px solid #22c55e;
                background-color: #f9fafb;
                padding: 1.5rem;
                margin: 2rem 0;
                font-style: italic;
                border-radius: 0.375rem;
              }
              .markdown-content :global(hr) {
                margin: 3rem 0;
                border-top: 2px solid #e5e7eb;
              }
              .markdown-content :global(table) {
                width: 100%;
                margin: 2rem 0;
                border-collapse: collapse;
              }
              .markdown-content :global(th) {
                background-color: #f3f4f6;
                padding: 0.75rem 1rem;
                text-align: left;
                font-weight: 600;
                border: 1px solid #e5e7eb;
              }
              .markdown-content :global(td) {
                padding: 0.75rem 1rem;
                border: 1px solid #e5e7eb;
              }
              .markdown-content :global(ul),
              .markdown-content :global(ol) {
                margin: 1.5rem 0;
                padding-left: 2rem;
              }
              .markdown-content :global(li) {
                margin: 0.5rem 0;
                line-height: 1.75;
              }
              .markdown-content :global(strong) {
                font-weight: 600;
                color: #111827;
              }
            `}</style>
            {renderedMarkdown}
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
