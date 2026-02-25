'use client'

import { useState } from 'react'
import { Loader2, AlertTriangle } from 'lucide-react'

interface DeleteAccountSectionProps {
  hasStripeCustomer: boolean
}

export default function DeleteAccountSection({ hasStripeCustomer }: DeleteAccountSectionProps) {
  const [expanded, setExpanded] = useState(false)
  const [confirmation, setConfirmation] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    if (confirmation !== 'DELETE') return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmation: 'DELETE' }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete account')
      }

      // Full page redirect to clear auth state
      window.location.href = '/'
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div className="border border-red-200 rounded-lg p-6 bg-red-50/50">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="h-5 w-5 text-red-600" />
        <h3 className="text-lg font-semibold text-red-900">Danger Zone</h3>
      </div>

      {!expanded ? (
        <div>
          <p className="text-sm text-red-700 mb-4">
            Permanently delete your account and all associated data.
          </p>
          <button
            onClick={() => setExpanded(true)}
            className="px-4 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
          >
            Delete Account
          </button>
        </div>
      ) : (
        <div>
          {error && (
            <div className="bg-red-100 border border-red-300 text-red-800 px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <div className="text-sm text-red-800 mb-4">
            <p className="font-medium mb-2">This will permanently delete your account, including:</p>
            <ul className="list-disc list-inside space-y-1 ml-1">
              <li>All client records</li>
              <li>All nutrition plans (download PDFs first)</li>
              <li>Your branding settings</li>
              {hasStripeCustomer && (
                <li>Your active subscription will be cancelled</li>
              )}
            </ul>
            <p className="mt-3 font-semibold">
              This action cannot be undone. Type <span className="font-mono bg-red-100 px-1 rounded">DELETE</span> to confirm.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="text"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              placeholder='Type "DELETE" to confirm'
              className="px-3 py-2 text-sm border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 w-48"
              disabled={loading}
              autoComplete="off"
            />
            <button
              onClick={handleDelete}
              disabled={confirmation !== 'DELETE' || loading}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Permanently Delete'
              )}
            </button>
            <button
              onClick={() => {
                setExpanded(false)
                setConfirmation('')
                setError(null)
              }}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
