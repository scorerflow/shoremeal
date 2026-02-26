'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Check, Loader2 } from 'lucide-react'

const tiers = [
  {
    key: 'starter',
    name: 'Starter',
    price: 29,
    plans: 10,
    features: [
      '10 nutrition plans per month',
      'PDF export',
      'Email support',
      'Basic branding (logo)',
    ],
    popular: false,
  },
  {
    key: 'pro',
    name: 'Pro',
    price: 49,
    plans: 30,
    features: [
      '30 nutrition plans per month',
      'PDF export',
      'Priority support',
      'Full branding (logo + colours)',
      'Client history',
    ],
    popular: true,
  },
  {
    key: 'agency',
    name: 'Agency',
    price: 99,
    plans: 100,
    features: [
      '100 nutrition plans per month',
      'PDF export',
      'Dedicated support',
      'Full white-label branding',
      'Client history',
      'API access',
    ],
    popular: false,
  },
]

export default function PricingContent() {
  const searchParams = useSearchParams()
  const cancelled = searchParams.get('cancelled')
  const [loadingTier, setLoadingTier] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleCheckout = async (tier: string) => {
    setLoadingTier(tier)
    setError(null)

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      })

      const data = await res.json()

      if (!res.ok) {
        // If unauthorized, redirect to signup
        if (res.status === 401) {
          window.location.href = `/signup?tier=${tier}`
          return
        }
        throw new Error(data.error || 'Failed to start checkout')
      }

      window.location.href = data.url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoadingTier(null)
    }
  }

  return (
    <>
      {cancelled && (
        <div className="max-w-md mx-auto mb-8 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg text-center">
          Checkout was cancelled. You can try again when you&apos;re ready.
        </div>
      )}

      {error && (
        <div className="max-w-md mx-auto mb-8 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-center">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {tiers.map((tier) => (
          <div
            key={tier.key}
            className={`card relative ${
              tier.popular ? 'ring-2 ring-primary-800' : ''
            }`}
          >
            {tier.popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-800 text-white text-sm font-medium px-3 py-1 rounded-full">
                Most Popular
              </span>
            )}
            <h3 className="text-xl font-bold text-gray-900">{tier.name}</h3>
            <div className="mt-4 mb-6">
              <span className="text-4xl font-bold text-gray-900">£{tier.price}</span>
              <span className="text-gray-600">/month</span>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              {tier.plans} nutrition plans per month
            </p>
            <ul className="space-y-3 mb-8">
              {tier.features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <Check className="h-5 w-5 text-primary-800 mr-2 flex-shrink-0" />
                  <span className="text-gray-600 text-sm">{feature}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleCheckout(tier.key)}
              disabled={loadingTier !== null}
              className={`block w-full text-center py-2.5 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 ${
                tier.popular
                  ? 'bg-primary-800 text-white hover:bg-primary-700'
                  : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
              }`}
            >
              {loadingTier === tier.key ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Redirecting...
                </span>
              ) : (
                'Get Started'
              )}
            </button>
          </div>
        ))}
      </div>
    </>
  )
}
