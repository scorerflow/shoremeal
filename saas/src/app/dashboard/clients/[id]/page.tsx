import Link from 'next/link'
import { ArrowLeft, User, Mail, Plus, FileText } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { EmptyState } from '@/components/EmptyState'
import { AlertBanner } from '@/components/AlertBanner'
import { StatusPill } from '@/components/StatusBadge'
import { requireAuth } from '@/lib/auth'
import { getClientDetail } from '@/lib/data/client-detail'
import { DISPLAY_LABELS } from '@/lib/constants'

export default async function ClientDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const { user, supabase } = await requireAuth()
  const client = await getClientDetail(supabase, params.id, user.id)

  if (!client) {
    return (
      <div>
        <div className="mb-6">
          <Link href="/dashboard/clients" className="inline-flex items-center text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Clients
          </Link>
        </div>
        <AlertBanner variant="error">
          <div className="flex items-center gap-3">
            <User className="h-6 w-6 text-red-600 flex-shrink-0" />
            <div>
              <h2 className="font-semibold text-red-900">Client not found</h2>
              <p className="text-red-700">This client does not exist or you do not have access to view it.</p>
            </div>
          </div>
        </AlertBanner>
      </div>
    )
  }

  const sortedPlans = [...client.plans].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  return (
    <div>
      <div className="mb-6">
        <Link href="/dashboard/clients" className="inline-flex items-center text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Clients
        </Link>
      </div>

      <PageHeader
        title={client.name}
        subtitle={`Client since ${new Date(client.created_at).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })}`}
        action={
          <Link href={`/dashboard/clients/new?clientId=${client.id}`} className="btn-primary flex items-center">
            <Plus className="h-5 w-5 mr-2" />
            Generate New Plan
          </Link>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Client Profile */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h2>
            <div className="space-y-3">
              {client.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="text-gray-900">{client.email}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Physical Info */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Physical Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Age</p>
                <p className="text-gray-900">{client.form_data.age} years</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Gender</p>
                <p className="text-gray-900">{client.form_data.gender === 'M' ? 'Male' : 'Female'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Height</p>
                <p className="text-gray-900">{client.form_data.height} cm</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Current Weight</p>
                <p className="text-gray-900">{client.form_data.weight} kg</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Goal Weight</p>
                <p className="text-gray-900">{client.form_data.ideal_weight} kg</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Activity Level</p>
                <p className="text-gray-900">
                  {DISPLAY_LABELS.activity_level[client.form_data.activity_level] || client.form_data.activity_level}
                </p>
              </div>
            </div>
          </div>

          {/* Goals & Dietary */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Goals & Dietary Preferences</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Primary Goal</p>
                <p className="text-gray-900">
                  {DISPLAY_LABELS.goal[client.form_data.goal] || client.form_data.goal}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Diet Type</p>
                <p className="text-gray-900">
                  {DISPLAY_LABELS.dietary_type[client.form_data.dietary_type] || client.form_data.dietary_type}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Allergies</p>
                <p className="text-gray-900">{client.form_data.allergies || 'None'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Dislikes</p>
                <p className="text-gray-900">{client.form_data.dislikes || 'None'}</p>
              </div>
              {client.form_data.preferences && (
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-500">Preferences</p>
                  <p className="text-gray-900">{client.form_data.preferences}</p>
                </div>
              )}
            </div>
          </div>

          {/* Practical Info */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Practical Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Budget</p>
                <p className="text-gray-900 capitalize">{client.form_data.budget}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Cooking Skill</p>
                <p className="text-gray-900">
                  {DISPLAY_LABELS.cooking_skill[client.form_data.cooking_skill] || client.form_data.cooking_skill}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Prep Time</p>
                <p className="text-gray-900">{client.form_data.prep_time}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Meals per Day</p>
                <p className="text-gray-900">{client.form_data.meals_per_day} meals</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Meal Variety</p>
                <p className="text-gray-900">
                  {DISPLAY_LABELS.meal_prep_style[client.form_data.meal_prep_style] || client.form_data.meal_prep_style}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Plan History Sidebar */}
        <div className="lg:col-span-1">
          <div className="card sticky top-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Plan History</h2>
              <span className="text-sm text-gray-500">{client.plans.length} total</span>
            </div>

            {client.plans.length === 0 ? (
              <EmptyState
                icon={<FileText className="h-12 w-12 text-gray-300" />}
                heading="No plans yet"
                description="Generate your first plan for this client"
                actionLabel="Create Plan"
                actionHref={`/dashboard/clients/new?clientId=${client.id}`}
              />
            ) : (
              <div className="space-y-3">
                {sortedPlans.map((plan) => (
                  <Link
                    key={plan.id}
                    href={`/dashboard/plans/${plan.id}`}
                    className="block border border-gray-200 hover:border-primary-500 rounded-lg p-3 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <StatusPill status={plan.status} />
                      <FileText className="h-4 w-4 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-900 font-medium">
                      {new Date(plan.created_at).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(plan.created_at).toLocaleTimeString('en-GB', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
