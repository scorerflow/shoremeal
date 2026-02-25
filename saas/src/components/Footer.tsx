import Link from 'next/link'

interface FooterProps {
  variant?: 'full' | 'compact'
}

export default function Footer({ variant = 'full' }: FooterProps) {
  if (variant === 'compact') {
    return (
      <footer className="border-t border-gray-200 py-4 px-6 text-center text-xs text-gray-500">
        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/privacy" className="hover:text-gray-700">Privacy</Link>
          <Link href="/terms" className="hover:text-gray-700">Terms</Link>
          <Link href="/contact" className="hover:text-gray-700">Contact</Link>
          <span>© {new Date().getFullYear()} Forzafed</span>
        </div>
      </footer>
    )
  }

  return (
    <footer className="bg-gray-900 text-gray-400 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <span className="text-xl font-bold text-white">Forzafed</span>
            <p className="text-sm mt-1">Professional nutrition plans made simple</p>
          </div>
          <div className="flex space-x-6 text-sm">
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
            <Link href="/terms" className="hover:text-white">Terms</Link>
            <Link href="/contact" className="hover:text-white">Contact</Link>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm">
          © {new Date().getFullYear()} Forzafed. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
