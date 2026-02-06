import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, FileText, Users, TrendingUp } from 'lucide-react'
import { TIERS, SubscriptionTier } from '@/types'

const DEV_MODE = process.env.DEV_MODE === 'true'

export default async function DashboardPage() {
  let trainer: Record<string, any> | null = null
  let clientCount: number | null = 0
  let planCount: number | null = 0

  if (DEV_MODE) {
    trainer = {
      full_name: 'David Scorer',
      business_name: 'Shore Fitness',
      subscription_tier: 'pro',
      subscription_status: 'active',
      plans_used_this_month: 3,
    }
    clientCount = 5
    planCount = 12
  } else {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data } = await supabase
      .from('trainers')
      .select('*')
      .eq('id', user?.id)
      .single()
    trainer = data

    const { count: cc } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .eq('trainer_id', user?.id)
    clientCount = cc

    const { count: pc } = await supabase
      .from('plans')
      .select('*', { count: 'exact', head: true })
      .eq('trainer_id', user?.id)
    planCount = pc
  }

  const tier = trainer?.subscription_tier as SubscriptionTier | null
  const plansLimit = tier ? TIERS[tier].plansPerMonth : 0
  const plansUsed = trainer?.plans_used_this_month || 0
  const plansRemaining = Math.max(0, plansLimit - plansUsed)

  const hasSubscription = tier && trainer?.subscription_status === 'active'

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back{trainer?.full_name ? `, ${trainer.full_name.split(' ')[0]}` : ''}!</p>
        </div>
        {hasSubscription ? (
          <Link href="/dashboard/clients/new" className="btn-primary flex items-center">
            <Plus className="h-5 w-5 mr-2" />
            New Plan
          </Link>
        ) : (
          <Link href="/pricing" className="btn-accent flex items-center">
            Upgrade to Create Plans
          </Link>
        )}
      </div>

      {/* Subscription alert */}
      {!hasSubscription && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <p className="text-amber-800">
            <strong>No active subscription.</strong>{' '}
            <Link href="/pricing" className="underline">Choose a plan</Link> to start generating nutrition plans for your clients.
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-primary-100 rounded-lg mr-4">
              <FileText className="h-6 w-6 text-primary-800" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Plans This Month</p>
              <p className="text-2xl font-bold text-gray-900">
                {plansUsed} / {plansLimit || '∞'}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg mr-4">
              <TrendingUp className="h-6 w-6 text-green-700" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Plans Remaining</p>
              <p className="text-2xl font-bold text-gray-900">{plansRemaining}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg mr-4">
              <Users className="h-6 w-6 text-blue-700" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Clients</p>
              <p className="text-2xl font-bold text-gray-900">{clientCount || 0}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg mr-4">
              <FileText className="h-6 w-6 text-purple-700" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Plans</p>
              <p className="text-2xl font-bold text-gray-900">{planCount || 0}</p>
            </div>
          </div>
        </div>
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
