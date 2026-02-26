import { Suspense } from 'react'
import PublicNav from '@/components/PublicNav'
import PricingContent from './pricing-content'

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <PublicNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-gray-600 max-w-xl mx-auto">
            Start generating professional nutrition plans for your clients today.
            Start generating professional nutrition plans for your clients today.
          </p>
        </div>

        <Suspense>
          <PricingContent />
        </Suspense>

        <p className="text-center text-sm text-gray-500 mt-8">
          Cancel anytime. No long-term commitment.
        </p>
      </div>
    </div>
  )
}
