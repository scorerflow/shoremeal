import { createClient } from '@/lib/supabase/server'
import { TIERS, type SubscriptionTier } from '@/types'
import BrandingForm from './branding-form'
import BillingSection from './billing-section'

const DEV_MODE = process.env.DEV_MODE === 'true'

export default async function SettingsPage() {
  let trainer: Record<string, any> | null = null
  let branding: Record<string, any> | null = null

  if (DEV_MODE) {
    trainer = {
      id: 'dev-user',
      full_name: 'David Scorer',
      business_name: 'Shore Fitness',
      subscription_tier: 'pro',
      subscription_status: 'active',
      plans_used_this_month: 3,
      stripe_customer_id: null,
    }
    branding = {
      id: 'dev-branding',
      trainer_id: 'dev-user',
      logo_url: null,
      primary_colour: '#2C5F2D',
      secondary_colour: '#4A7C4E',
      accent_colour: '#FF8C00',
    }
  } else {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const { data: t } = await supabase
        .from('trainers')
        .select('*')
        .eq('id', user.id)
        .single()
      trainer = t

      const { data: b } = await supabase
        .from('branding')
        .select('*')
        .eq('trainer_id', user.id)
        .single()
      branding = b
    }
  }

  const tier = trainer?.subscription_tier as SubscriptionTier | null
  const tierConfig = tier ? TIERS[tier] : null

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your branding and subscription.</p>
      </div>

      {/* Branding */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Branding</h2>
        <BrandingForm
          initialBranding={{
            logoUrl: branding?.logo_url || null,
            primaryColour: branding?.primary_colour || '#2C5F2D',
            secondaryColour: branding?.secondary_colour || '#4A7C4E',
            accentColour: branding?.accent_colour || '#FF8C00',
          }}
          devMode={DEV_MODE}
        />
      </div>

      {/* Billing */}
      <div id="billing">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Billing & Subscription</h2>
        <BillingSection
          tier={tier}
          tierConfig={tierConfig}
          status={trainer?.subscription_status || null}
          plansUsed={trainer?.plans_used_this_month || 0}
          hasStripeCustomer={!!trainer?.stripe_customer_id}
          devMode={DEV_MODE}
        />
      </div>
    </div>
  )
}
