import { TIERS, type SubscriptionTier } from '@/types'
import ProfileForm from './profile-form'
import BillingSection from './billing-section'
import DeleteAccountSection from './delete-account-section'
import { requireAuth } from '@/lib/auth'
import { getCachedTrainer } from '@/lib/data/cached'

const DEV_MODE = process.env.DEV_MODE === 'true'

export default async function SettingsPage() {
  const { user } = await requireAuth()
  const trainer = await getCachedTrainer(user.id)

  const tier = trainer?.subscription_tier as SubscriptionTier | null
  const tierConfig = tier ? TIERS[tier] : null

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
        <p className="text-gray-600">Manage your profile and subscription.</p>
      </div>

      {/* Profile */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile</h2>
        <ProfileForm
          initialProfile={{
            fullName: trainer?.full_name || '',
            businessName: trainer?.business_name || '',
          }}
        />
      </div>

      {/* Billing */}
      <div id="billing" className="mb-8">
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

      {/* Delete Account */}
      <div>
        <DeleteAccountSection hasStripeCustomer={!!trainer?.stripe_customer_id} />
      </div>
    </div>
  )
}
