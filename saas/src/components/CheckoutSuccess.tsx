'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export function CheckoutSuccess() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const sessionId = searchParams.get('session_id')
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying')

  useEffect(() => {
    if (!sessionId) return

    let cancelled = false

    async function verify() {
      try {
        const res = await fetch('/api/checkout/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        })

        if (cancelled) return

        if (res.ok) {
          setStatus('success')
          // Replace URL to remove session_id — prevents re-verification on refresh
          window.history.replaceState({}, '', '/dashboard')
          // Refresh server components to pick up the new subscription data
          router.refresh()
        } else {
          setStatus('error')
        }
      } catch {
        if (!cancelled) setStatus('error')
      }
    }

    verify()

    return () => { cancelled = true }
  }, [sessionId, router])

  if (!sessionId && status === 'verifying') return null

  if (status === 'verifying') {
    return (
      <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          <p className="text-sm font-medium text-blue-800">
            Activating your subscription...
          </p>
        </div>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4">
        <p className="text-sm font-medium text-green-800">
          Payment successful! Your subscription is now active.
        </p>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm font-medium text-amber-800">
          We&apos;re still processing your payment. Please refresh the page in a moment.
        </p>
      </div>
    )
  }

  return null
}
