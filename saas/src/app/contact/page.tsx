import Link from 'next/link'
import type { Metadata } from 'next'
import { Mail, MessageSquare, HelpCircle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Contact Us | Forzafed',
  description: 'Get in touch with the Forzafed team for support, questions, or feedback.',
}

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link href="/" className="text-2xl font-bold text-primary-800">
              Forzafed
            </Link>
            <Link href="/" className="text-gray-600 hover:text-gray-900">
              ← Back to Home
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 md:p-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Contact Us
          </h1>
          <p className="text-gray-600 mb-8">
            We&apos;re here to help. Choose the best way to reach us based on your needs.
          </p>

          {/* Contact Options */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {/* General Support */}
            <div className="card">
              <div className="flex items-center justify-center w-12 h-12 bg-primary-100 rounded-lg mb-4">
                <Mail className="h-6 w-6 text-primary-800" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                General Support
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                Questions about your account, billing, or using the service
              </p>
              <a
                href="mailto:hello@forzafed.com?subject=Support Request"
                className="text-primary-800 hover:underline font-medium"
              >
                hello@forzafed.com
              </a>
              <p className="text-sm text-gray-500 mt-2">
                Response within 48 hours
              </p>
            </div>

            {/* Privacy & Legal */}
            <div className="card">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-4">
                <HelpCircle className="h-6 w-6 text-blue-700" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Privacy & Legal
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                Data requests, privacy concerns, or legal enquiries
              </p>
              <a
                href="mailto:hello@forzafed.com?subject=Privacy Request"
                className="text-primary-800 hover:underline font-medium"
              >
                hello@forzafed.com
              </a>
              <p className="text-sm text-gray-500 mt-2">
                Response within 30 days
              </p>
            </div>

            {/* Feedback */}
            <div className="card">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mb-4">
                <MessageSquare className="h-6 w-6 text-green-700" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Feedback
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                Feature requests, suggestions, or general feedback
              </p>
              <a
                href="mailto:hello@forzafed.com?subject=Feedback"
                className="text-primary-800 hover:underline font-medium"
              >
                hello@forzafed.com
              </a>
              <p className="text-sm text-gray-500 mt-2">
                We read every message
              </p>
            </div>
          </div>

          {/* FAQ Section */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Frequently Asked Questions
            </h2>

            <div className="space-y-6">
              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  How do I cancel my subscription?
                </h3>
                <p className="text-gray-700">
                  You can cancel anytime from the Settings page in your dashboard. Navigate to Settings → Billing → Manage Subscription. Your access continues until the end of your current billing period.
                </p>
              </div>

              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Can I upgrade or downgrade my plan?
                </h3>
                <p className="text-gray-700">
                  Yes! You can change your subscription tier anytime from the Settings page. Upgrades take effect immediately. Downgrades take effect at the next billing cycle.
                </p>
              </div>

              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  What if I run out of plans before the month ends?
                </h3>
                <p className="text-gray-700">
                  You can upgrade to a higher tier anytime to get more monthly plans. The upgrade is prorated, so you only pay for the remaining days in the current billing period.
                </p>
              </div>

              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  How do I delete my account and data?
                </h3>
                <p className="text-gray-700">
                  Go to Settings → Account → Delete Account. This will permanently delete all your data within 30 days. Make sure to export any plans you want to keep before deleting.
                </p>
              </div>

              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Is my client data secure?
                </h3>
                <p className="text-gray-700">
                  Yes. We use industry-standard encryption, row-level security policies, and secure third-party processors (Supabase, Stripe). All data is encrypted in transit and at rest. See our{' '}
                  <Link href="/privacy" className="text-primary-800 hover:underline">
                    Privacy Policy
                  </Link>{' '}
                  for details.
                </p>
              </div>

              <div className="pb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Do you offer refunds?
                </h3>
                <p className="text-gray-700">
                  Subscriptions are non-refundable after the billing period starts. However, we offer refunds for technical issues, duplicate charges, or charges after cancellation. See our{' '}
                  <Link href="/terms" className="text-primary-800 hover:underline">
                    Terms of Service
                  </Link>{' '}
                  for full details.
                </p>
              </div>
            </div>
          </section>

          {/* Business Hours */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Support Hours
            </h2>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <p className="text-gray-700 mb-2">
                <strong>Standard Support:</strong> Monday - Friday, 9am - 5pm GMT
              </p>
              <p className="text-gray-700 mb-4">
                <strong>Priority Support (Pro & Agency):</strong> Extended hours with faster response times
              </p>
              <p className="text-gray-600 text-sm">
                Emergency issues affecting service availability are handled 24/7.
              </p>
            </div>
          </section>

          {/* Before You Contact Us */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Before You Contact Us
            </h2>
            <p className="text-gray-700 mb-4">
              To help us assist you faster, please include:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-1">
              <li>Your registered email address</li>
              <li>A clear description of the issue or question</li>
              <li>Screenshots (if applicable)</li>
              <li>Steps to reproduce the problem (for technical issues)</li>
              <li>Browser and device information (for technical issues)</li>
            </ul>
          </section>

          {/* Footer Links */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="flex flex-wrap gap-6 text-sm text-gray-600">
              <Link href="/privacy" className="hover:text-primary-800">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-primary-800">
                Terms of Service
              </Link>
              <Link href="/" className="hover:text-primary-800">
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
