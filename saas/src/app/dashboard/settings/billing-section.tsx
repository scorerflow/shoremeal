'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Loader2, CreditCard, ExternalLink } from 'lucide-react'
import type { TierConfig, SubscriptionTier } from '@/types'

interface BillingSectionProps {
  tier: SubscriptionTier | null
  tierConfig: TierConfig | null
  status: string | null
  plansUsed: number
  hasStripeCustomer: boolean
  devMode: boolean
}

export default function BillingSection({
  tier,
  tierConfig,
  status,
  plansUsed,
  hasStripeCustomer,
  devMode,
}: BillingSectionProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleManageBilling = async () => {
    if (devMode) {
      alert('Billing portal is not available in dev mode')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/billing', { method: 'POST' })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to open billing portal')
      }

      window.location.href = data.url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  const isActive = status === 'active'
  const plansLimit = tierConfig?.plansPerMonth || 0
  const usagePercent = plansLimit > 0 ? Math.min(100, (plansUsed / plansLimit) * 100) : 0

  return (
    <div className="card">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {isActive && tierConfig ? (
        <div>
          {/* Current plan */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-gray-900 capitalize">{tier} Plan</h3>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                  Active
                </span>
              </div>
              <p className="text-gray-600 mt-1">
                £{tierConfig.price}/month
              </p>
            </div>
            <CreditCard className="h-8 w-8 text-gray-300" />
          </div>

          {/* Usage */}
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Plans used this month</span>
              <span className="font-medium text-gray-900">{plansUsed} / {plansLimit}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-primary-800 h-2.5 rounded-full transition-all"
                style={{ width: `${usagePercent}%` }}
              />
            </div>
            {usagePercent >= 80 && (
              <p className="text-sm text-amber-600 mt-2">
                You&apos;re approaching your monthly limit. Consider upgrading for more plans.
              </p>
            )}
          </div>

          {/* Features */}
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-700 mb-2">Your plan includes:</p>
            <ul className="space-y-1">
              {tierConfig.features.map((feature) => (
                <li key={feature} className="text-sm text-gray-600 flex items-center gap-2">
                  <span className="text-green-500">&#10003;</span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {/* Manage button */}
          <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={handleManageBilling}
              disabled={loading || !hasStripeCustomer}
              className="btn-secondary flex items-center disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Opening...
                </>
              ) : (
                <>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Manage Subscription
                </>
              )}
            </button>
            <p className="text-xs text-gray-400">
              Update payment method, view invoices, or cancel
            </p>
          </div>
        </div>
      ) : (
        <div className="text-center py-4">
          <CreditCard className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No active subscription</h3>
          <p className="text-gray-600 mb-4">
            Choose a plan to start generating personalised nutrition plans for your clients.
          </p>
          <Link href="/pricing" className="btn-primary">
            View Plans
          </Link>

          {status === 'past_due' && (
            <div className="mt-4 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg text-sm">
              Your last payment failed. Please update your payment method to restore access.
              <button
                onClick={handleManageBilling}
                disabled={loading || !hasStripeCustomer}
                className="block mt-2 text-amber-900 underline font-medium"
              >
                Update Payment Method
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
