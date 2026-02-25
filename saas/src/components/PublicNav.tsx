import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

interface PublicNavProps {
  maxWidth?: '4xl' | '7xl'
}

const maxWidthClasses = {
  '4xl': 'max-w-4xl',
  '7xl': 'max-w-7xl',
} as const

export default async function PublicNav({ maxWidth = '7xl' }: PublicNavProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className={`${maxWidthClasses[maxWidth]} mx-auto px-4 sm:px-6 lg:px-8`}>
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold text-primary-800">
              Forzafed
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              <Link href="/dashboard" className="btn-primary">
                Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-gray-600 hover:text-gray-900">
                  Log in
                </Link>
                <Link href="/signup" className="btn-primary">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
