'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, Zap } from 'lucide-react'
import { AlertBanner } from '@/components/AlertBanner'

export default function GeneratePlanPage({
  params,
}: {
  params: { id: string }
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: params.id }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate plan')
      }

      router.push(`/dashboard/plans/${data.plan_id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href={`/dashboard/clients/${params.id}`} className="inline-flex items-center text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Client
        </Link>
      </div>

      <div className="card">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 mb-4">
            <Zap className="h-8 w-8 text-primary-800" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Generate Nutrition Plan
          </h1>
          <p className="text-gray-600">
            This will create a new nutrition plan using the client&apos;s current profile information.
          </p>
        </div>

        {error && <AlertBanner variant="error" className="mb-6">{error}</AlertBanner>}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">What happens next:</h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Your plan will be queued for generation</li>
            <li>AI will create a personalized nutrition plan based on the client&apos;s profile</li>
            <li>You&apos;ll be redirected to track the progress</li>
            <li>Plan generation typically takes 2-4 minutes</li>
          </ul>
        </div>

        <div className="flex gap-3">
          <Link
            href={`/dashboard/clients/${params.id}`}
            className="btn-secondary flex-1"
          >
            Cancel
          </Link>
          <button
            type="button"
            disabled={loading}
            onClick={handleGenerate}
            className="btn-primary flex-1 flex items-center justify-center disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Starting Generation...
              </>
            ) : (
              <>
                <Zap className="h-5 w-5 mr-2" />
                Generate Plan
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
