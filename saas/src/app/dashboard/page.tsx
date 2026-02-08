import Link from 'next/link'
import { Plus, FileText, Users, TrendingUp } from 'lucide-react'
import { TIERS, SubscriptionTier } from '@/types'
import { PageHeader } from '@/components/PageHeader'
import { StatCard } from '@/components/StatCard'
import { AlertBanner } from '@/components/AlertBanner'
import { requireAuth } from '@/lib/auth'
import { getDashboardData } from '@/lib/data/dashboard'

export default async function DashboardPage() {
  const { user, supabase } = await requireAuth()
  const { trainer, clientCount, planCount } = await getDashboardData(supabase, user.id)

  const tier = trainer?.subscription_tier as SubscriptionTier | null
  const plansLimit = tier ? TIERS[tier].plansPerMonth : 0
  const plansUsed = trainer?.plans_used_this_month || 0
  const plansRemaining = Math.max(0, plansLimit - plansUsed)

  const hasSubscription = tier && trainer?.subscription_status === 'active'

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle={`Welcome back${trainer?.full_name ? `, ${trainer.full_name.split(' ')[0]}` : ''}!`}
        action={
          hasSubscription ? (
            <Link href="/dashboard/clients/new" className="btn-primary flex items-center">
              <Plus className="h-5 w-5 mr-2" />
              New Plan
            </Link>
          ) : (
            <Link href="/pricing" className="btn-accent flex items-center">
              Upgrade to Create Plans
            </Link>
          )
        }
      />

      {/* Subscription alert */}
      {!hasSubscription && (
        <AlertBanner variant="warning" className="mb-6">
          <strong>No active subscription.</strong>{' '}
          <Link href="/pricing" className="underline">Choose a plan</Link> to start generating nutrition plans for your clients.
        </AlertBanner>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={<FileText className="h-6 w-6 text-primary-800" />}
          iconBg="bg-primary-100"
          label="Plans This Month"
          value={`${plansUsed} / ${plansLimit || '\u221E'}`}
        />
        <StatCard
          icon={<TrendingUp className="h-6 w-6 text-green-700" />}
          iconBg="bg-green-100"
          label="Plans Remaining"
          value={plansRemaining}
        />
        <StatCard
          icon={<Users className="h-6 w-6 text-blue-700" />}
          iconBg="bg-blue-100"
          label="Total Clients"
          value={clientCount}
        />
        <StatCard
          icon={<FileText className="h-6 w-6 text-purple-700" />}
          iconBg="bg-purple-100"
          label="Total Plans"
          value={planCount}
        />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link
              href="/dashboard/clients/new"
              className={`block p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors ${!hasSubscription ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <p className="font-medium text-gray-900">Create New Plan</p>
              <p className="text-sm text-gray-600">Generate a nutrition plan for a client</p>
            </Link>
            <Link
              href="/dashboard/clients"
              className="block p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
            >
              <p className="font-medium text-gray-900">View Clients</p>
              <p className="text-sm text-gray-600">See all your clients and their plans</p>
            </Link>
            <Link
              href="/dashboard/settings"
              className="block p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
            >
              <p className="font-medium text-gray-900">Branding Settings</p>
              <p className="text-sm text-gray-600">Customise your PDF branding</p>
            </Link>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Plan</h2>
          {hasSubscription ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-2xl font-bold text-primary-800 capitalize">
                  {tier} Plan
                </span>
                <span className="text-gray-600">
                  £{tier ? TIERS[tier].price : 0}/month
                </span>
              </div>
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Plans used</span>
                  <span className="font-medium">{plansUsed} / {plansLimit}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary-800 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (plansUsed / plansLimit) * 100)}%` }}
                  />
                </div>
              </div>
              <Link
                href="/dashboard/settings#billing"
                className="text-sm text-primary-800 hover:underline"
              >
                Manage subscription →
              </Link>
            </div>
          ) : (
            <div>
              <p className="text-gray-600 mb-4">
                You don&apos;t have an active subscription. Choose a plan to start creating nutrition plans.
              </p>
              <Link href="/pricing" className="btn-primary">
                View Plans
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
