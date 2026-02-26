import Link from 'next/link'
import { Lock } from 'lucide-react'
import { requireAuth } from '@/lib/auth'
import { getCachedTrainer, getCachedBranding } from '@/lib/data/cached'
import type { SubscriptionTier } from '@/types'
import BrandingForm from '../settings/branding-form'

const DEV_MODE = process.env.DEV_MODE === 'true'

export default async function BrandingPage() {
  const { user } = await requireAuth()
  const trainer = await getCachedTrainer(user.id)

  const tier = trainer?.subscription_tier as SubscriptionTier | null
  const hasSubscription = DEV_MODE || (tier && trainer?.subscription_status === 'active')

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Branding</h1>
        <p className="text-gray-600">Customise the look of your PDF nutrition plans.</p>
      </div>

      {hasSubscription ? (
        <BrandingForm
          initialBranding={await getBrandingData(user.id)}
          devMode={DEV_MODE}
        />
      ) : (
        <div className="card text-center py-12">
          <Lock className="h-10 w-10 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Branding requires a subscription
          </h2>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Subscribe to customise your logo and brand colours on PDF nutrition plans sent to your clients.
          </p>
          <Link href="/pricing" className="btn-primary">
            View Plans
          </Link>
        </div>
      )}
    </div>
  )
}

async function getBrandingData(userId: string) {
  const branding = await getCachedBranding(userId)
  return {
    logoUrl: branding?.logo_url || null,
    primaryColour: branding?.primary_colour || '#2C5F2D',
    secondaryColour: branding?.secondary_colour || '#4A7C4E',
    accentColour: branding?.accent_colour || '#FF8C00',
  }
}
