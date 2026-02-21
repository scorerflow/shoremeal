'use client'

import { useEffect, useState } from 'react'
import { Loader2, Clock, Users } from 'lucide-react'

interface QueueStatusProps {
  planId: string
  initialStatus?: 'pending' | 'generating' | 'completed' | 'failed'
  onStatusChange?: (status: string) => void
}

interface StatusData {
  id: string
  status: 'pending' | 'generating' | 'completed' | 'failed'
  queuePosition: number
  totalInQueue: number
  estimatedMinutes: number
  elapsedSeconds: number
  errorMessage: string | null
  attempts: number
}

export function QueueStatus({ planId, initialStatus = 'pending', onStatusChange }: QueueStatusProps) {
  const [status, setStatus] = useState<StatusData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null

    const fetchStatus = async () => {
      try {
        const response = await fetch(`/api/plans/${planId}/status`)

        if (!response.ok) {
          throw new Error('Failed to fetch status')
        }

        const data: StatusData = await response.json()
        setStatus(data)
        setError(null)

        // Notify parent of status change
        if (onStatusChange && data.status !== initialStatus) {
          onStatusChange(data.status)
        }

        // Stop polling if plan is complete or failed
        if (data.status === 'completed' || data.status === 'failed') {
          if (intervalId) {
            clearInterval(intervalId)
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch status')
      }
    }

    // Initial fetch
    fetchStatus()

    // Poll every 2 seconds (only if not completed/failed)
    if (initialStatus === 'pending' || initialStatus === 'generating') {
      intervalId = setInterval(fetchStatus, 2000)
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [planId, initialStatus, onStatusChange])

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-sm text-red-800">Error loading status: {error}</p>
      </div>
    )
  }

  if (!status) {
    return (
      <div className="flex items-center gap-3 text-gray-600">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Loading status...</span>
      </div>
    )
  }

  // Completed status
  if (status.status === 'completed') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <p className="text-sm font-medium text-green-900">✅ Plan generation complete!</p>
        <p className="text-xs text-green-700 mt-1">
          Generated in {formatElapsedTime(status.elapsedSeconds)}
        </p>
      </div>
    )
  }

  // Failed status
  if (status.status === 'failed') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-sm font-medium text-red-900">❌ Plan generation failed</p>
        {status.errorMessage && (
          <p className="text-xs text-red-700 mt-1">{status.errorMessage}</p>
        )}
        {status.attempts > 0 && (
          <p className="text-xs text-red-600 mt-1">Attempts: {status.attempts}</p>
        )}
      </div>
    )
  }

  // Generating/Pending status with queue info
  const showQueue = status.queuePosition > 0

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <Loader2 className="h-5 w-5 text-blue-600 animate-spin flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium text-blue-900">
            {status.status === 'generating' ? 'Generating your plan...' : 'Queued for generation...'}
          </p>

          {showQueue && (
            <div className="mt-2 space-y-1.5">
              <div className="flex items-center gap-2 text-xs text-blue-700">
                <Users className="h-3.5 w-3.5" />
                <span>
                  Position <strong>{status.queuePosition}</strong> of <strong>{status.totalInQueue}</strong> in queue
                </span>
              </div>

              {status.estimatedMinutes > 0 && (
                <div className="flex items-center gap-2 text-xs text-blue-700">
                  <Clock className="h-3.5 w-3.5" />
                  <span>
                    Estimated time: <strong>{status.estimatedMinutes} {status.estimatedMinutes === 1 ? 'minute' : 'minutes'}</strong>
                  </span>
                </div>
              )}
            </div>
          )}

          <p className="text-xs text-blue-600 mt-2">
            Elapsed: {formatElapsedTime(status.elapsedSeconds)}
          </p>

          {status.status === 'generating' && !showQueue && (
            <p className="text-xs text-blue-600 mt-1">
              This usually takes 20-40 seconds
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function formatElapsedTime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`
  }

  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60

  if (remainingSeconds === 0) {
    return `${minutes}m`
  }

  return `${minutes}m ${remainingSeconds}s`
}
