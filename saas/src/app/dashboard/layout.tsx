import Link from 'next/link'
import { LayoutDashboard, Users, FileText, Settings, LogOut } from 'lucide-react'
import { requireAuth } from '@/lib/auth'
import { getTrainerById } from '@/lib/repositories/trainers'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Clients', href: '/dashboard/clients', icon: Users },
  { name: 'Plans', href: '/dashboard/plans', icon: FileText },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, supabase } = await requireAuth()
  const trainer = await getTrainerById(supabase, user.id)
  const userEmail = user.email || ''

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 hidden md:block">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-gray-200">
            <Link href="/dashboard" className="text-xl font-bold text-primary-800">
              NutriPlan Pro
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <item.icon className="h-5 w-5 mr-3 text-gray-500" />
                {item.name}
              </Link>
            ))}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-gray-200">
            <div className="mb-3">
              <p className="font-medium text-gray-900 truncate">
                {trainer?.full_name || userEmail}
              </p>
              <p className="text-sm text-gray-500 truncate">
                {trainer?.business_name || 'Personal Trainer'}
              </p>
              {trainer?.subscription_tier && (
                <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-primary-100 text-primary-800 rounded-full capitalize">
                  {trainer.subscription_tier}
                </span>
              )}
            </div>
            <form action="/api/auth/signout" method="POST">
              <button
                type="submit"
                className="flex items-center w-full px-4 py-2 text-sm text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign out
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="md:hidden bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="text-xl font-bold text-primary-800">
            NutriPlan Pro
          </Link>
          {/* Mobile menu button would go here */}
        </div>
      </header>

      {/* Main content */}
      <main className="md:ml-64 p-6">
        {children}
      </main>
    </div>
  )
}
