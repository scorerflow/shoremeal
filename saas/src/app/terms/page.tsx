/* eslint-disable react/no-unescaped-entities */
// Static legal document - quotation marks are necessary for legal language
// No XSS risk as this is hardcoded content, not user input
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service | Forzafed',
  description: 'Terms and conditions for using the Forzafed nutrition planning service.',
}

export default function TermsPage() {
  const lastUpdated = '22 February 2026'
  const contactEmail = 'hello@forzafed.com'

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
            Terms of Service
          </h1>
          <p className="text-gray-600 mb-8">
            Last updated: {lastUpdated}
          </p>

          {/* Introduction */}
          <section className="mb-8">
            <p className="text-gray-700 mb-4">
              Welcome to Forzafed. By accessing or using our service, you agree to be bound by these Terms of Service ("Terms"). Please read them carefully.
            </p>
            <p className="text-gray-700">
              If you do not agree to these Terms, you may not use our service.
            </p>
          </section>

          {/* Acceptance */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-700 mb-4">
              By creating an account or using Forzafed, you agree to:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-1">
              <li>These Terms of Service</li>
              <li>Our Privacy Policy</li>
              <li>All applicable laws and regulations</li>
            </ul>
            <p className="text-gray-700">
              These Terms constitute a legally binding agreement between you and Forzafed.
            </p>
          </section>

          {/* Service Description */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Service Description</h2>
            <p className="text-gray-700 mb-4">
              Forzafed provides:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-1">
              <li>AI-powered nutrition plan generation for your clients</li>
              <li>PDF export functionality with custom branding</li>
              <li>Client management and plan history</li>
              <li>Monthly subscription-based access</li>
            </ul>
            <p className="text-gray-700 mb-4">
              <strong>Important:</strong> Forzafed is a tool for nutrition professionals. You are responsible for:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-1">
              <li>Reviewing all generated plans before delivery to clients</li>
              <li>Ensuring plans are appropriate for your clients&apos; needs</li>
              <li>Obtaining necessary consents from your clients</li>
              <li>Complying with professional standards and regulations in your jurisdiction</li>
            </ul>
          </section>

          {/* Eligibility */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Eligibility</h2>
            <p className="text-gray-700 mb-4">
              To use Forzafed, you must:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-1">
              <li>Be at least 18 years old</li>
              <li>Be a qualified nutrition professional, personal trainer, or health coach</li>
              <li>Have the legal capacity to enter into a binding contract</li>
              <li>Provide accurate and complete registration information</li>
              <li>Comply with all laws in your jurisdiction</li>
            </ul>
            <p className="text-gray-700">
              We reserve the right to refuse service or terminate accounts at our discretion.
            </p>
          </section>

          {/* Account Registration */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Account Registration and Security</h2>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">4.1 Account Creation</h3>
            <p className="text-gray-700 mb-4">
              When you create an account:
            </p>
            <ul className="list-disc pl-6 mb-6 text-gray-700 space-y-1">
              <li>You must provide accurate, current, and complete information</li>
              <li>You must update information promptly if it changes</li>
              <li>You are responsible for maintaining account security</li>
              <li>You must not share your account credentials</li>
              <li>You must notify us immediately of unauthorized access</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">4.2 Account Responsibility</h3>
            <p className="text-gray-700 mb-4">
              You are fully responsible for all activity under your account. We are not liable for losses due to unauthorized use of your account.
            </p>
          </section>

          {/* Subscriptions */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Subscriptions and Billing</h2>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">5.1 Subscription Tiers</h3>
            <p className="text-gray-700 mb-4">
              We offer three subscription tiers:
            </p>
            <ul className="list-disc pl-6 mb-6 text-gray-700 space-y-1">
              <li><strong>Starter:</strong> £29/month - 10 plans per month</li>
              <li><strong>Pro:</strong> £49/month - 30 plans per month</li>
              <li><strong>Agency:</strong> £99/month - 100 plans per month</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">5.2 Billing Cycle</h3>
            <p className="text-gray-700 mb-4">
              Subscriptions are billed:
            </p>
            <ul className="list-disc pl-6 mb-6 text-gray-700 space-y-1">
              <li><strong>Monthly:</strong> Charged on the same day each month</li>
              <li><strong>Automatically:</strong> Recurring charges unless cancelled</li>
              <li><strong>In advance:</strong> Payment is due at the start of each billing period</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">5.3 Payment Methods</h3>
            <p className="text-gray-700 mb-4">
              We accept payment via credit/debit card processed through Stripe. By providing payment information, you:
            </p>
            <ul className="list-disc pl-6 mb-6 text-gray-700 space-y-1">
              <li>Authorize us to charge the payment method</li>
              <li>Represent that you are authorized to use the payment method</li>
              <li>Agree to keep payment information current and accurate</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">5.4 Price Changes</h3>
            <p className="text-gray-700 mb-4">
              We may change subscription prices with 30 days&apos; notice. Changes apply to renewal periods, not current subscriptions.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">5.5 Failed Payments</h3>
            <p className="text-gray-700 mb-4">
              If a payment fails:
            </p>
            <ul className="list-disc pl-6 mb-6 text-gray-700 space-y-1">
              <li>We will attempt to process payment again</li>
              <li>Your access may be suspended until payment succeeds</li>
              <li>Your account may be cancelled after repeated failures</li>
              <li>You remain responsible for outstanding charges</li>
            </ul>
          </section>

          {/* Usage Limits */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Usage Limits and Fair Use</h2>
            <p className="text-gray-700 mb-4">
              Each subscription tier includes a monthly plan generation limit:
            </p>
            <ul className="list-disc pl-6 mb-6 text-gray-700 space-y-1">
              <li>Limits reset on the 1st of each calendar month</li>
              <li>Unused plans do not roll over to the next month</li>
              <li>You cannot generate plans once your monthly limit is reached</li>
              <li>Upgrade your tier anytime for higher limits</li>
            </ul>
            <p className="text-gray-700 mb-4">
              <strong>Fair Use:</strong> You agree not to:
            </p>
            <ul className="list-disc pl-6 mb-6 text-gray-700 space-y-1">
              <li>Abuse or exploit the service (e.g., rapid-fire plan generation)</li>
              <li>Use automated tools to generate plans</li>
              <li>Share account access with others</li>
              <li>Resell or redistribute generated plans at scale without proper licensing</li>
            </ul>
          </section>

          {/* Cancellation */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Cancellation and Refunds</h2>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">7.1 Cancellation</h3>
            <p className="text-gray-700 mb-4">
              You may cancel your subscription at any time:
            </p>
            <ul className="list-disc pl-6 mb-6 text-gray-700 space-y-1">
              <li>Cancel through the Settings page in your dashboard</li>
              <li>Cancellation takes effect at the end of the current billing period</li>
              <li>You retain access until the end of the paid period</li>
              <li>No charges will occur after cancellation</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">7.2 Refund Policy</h3>
            <p className="text-gray-700 mb-4">
              <strong>Standard Policy:</strong>
            </p>
            <ul className="list-disc pl-6 mb-6 text-gray-700 space-y-1">
              <li>Subscriptions are <strong>non-refundable</strong> after the billing period starts</li>
              <li>No partial refunds for unused portion of billing period</li>
              <li>No refunds for unused plan generation credits</li>
            </ul>
            <p className="text-gray-700 mb-4">
              <strong>Exceptions:</strong>
            </p>
            <ul className="list-disc pl-6 mb-6 text-gray-700 space-y-1">
              <li>Technical issues preventing service access (we&apos;ll fix or refund)</li>
              <li>Duplicate charges (refunded immediately)</li>
              <li>Charges after cancellation (refunded immediately)</li>
            </ul>
            <p className="text-gray-700">
              Contact{' '}
              <a href={`mailto:${contactEmail}`} className="text-primary-800 hover:underline">
                {contactEmail}
              </a>{' '}
              to request a refund for exceptional circumstances.
            </p>
          </section>

          {/* Intellectual Property */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Intellectual Property</h2>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">8.1 Our Content</h3>
            <p className="text-gray-700 mb-4">
              Forzafed and all related content (software, design, text, graphics, logos) are owned by us and protected by copyright, trademark, and other laws.
            </p>
            <p className="text-gray-700 mb-6">
              You may not copy, modify, distribute, or reverse-engineer any part of our service without written permission.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">8.2 Generated Content</h3>
            <p className="text-gray-700 mb-4">
              Nutrition plans generated through Forzafed:
            </p>
            <ul className="list-disc pl-6 mb-6 text-gray-700 space-y-1">
              <li><strong>You own</strong> the generated nutrition plans</li>
              <li>You may use plans for your clients without restriction</li>
              <li>You may customize, edit, and rebrand plans</li>
              <li>You may not resell Forzafed service itself or redistribute at scale</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">8.3 Your Content</h3>
            <p className="text-gray-700 mb-4">
              You retain ownership of:
            </p>
            <ul className="list-disc pl-6 mb-6 text-gray-700 space-y-1">
              <li>Client data you input</li>
              <li>Your business name and branding</li>
              <li>Your logo and brand assets</li>
            </ul>
            <p className="text-gray-700">
              You grant us a limited license to use this content solely to provide our service to you.
            </p>
          </section>

          {/* Acceptable Use */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Acceptable Use Policy</h2>
            <p className="text-gray-700 mb-4">
              You agree <strong>not</strong> to:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-1">
              <li>Violate any laws or regulations</li>
              <li>Infringe intellectual property rights</li>
              <li>Upload malware, viruses, or malicious code</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Interfere with service operation or other users</li>
              <li>Use the service for illegal or harmful purposes</li>
              <li>Impersonate others or provide false information</li>
              <li>Scrape, data mine, or extract data without permission</li>
              <li>Use automated systems to access the service (bots, scrapers)</li>
              <li>Share account credentials or circumvent usage limits</li>
            </ul>
            <p className="text-gray-700">
              Violation may result in immediate account termination without refund.
            </p>
          </section>

          {/* Professional Responsibility */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Professional Responsibility</h2>
            <p className="text-gray-700 mb-4">
              <strong>You acknowledge that:</strong>
            </p>
            <ul className="list-disc pl-6 mb-6 text-gray-700 space-y-1">
              <li>Generated plans are <strong>suggestions</strong>, not medical advice</li>
              <li>You must review all plans before delivering to clients</li>
              <li>You are responsible for ensuring plans are safe and appropriate</li>
              <li>You must comply with professional standards in your jurisdiction</li>
              <li>You must obtain informed consent from clients</li>
              <li>You are responsible for client outcomes, not Forzafed</li>
            </ul>
            <p className="text-gray-700 mb-4">
              <strong>Forzafed is not:</strong>
            </p>
            <ul className="list-disc pl-6 mb-6 text-gray-700 space-y-1">
              <li>A medical device or medical service</li>
              <li>A substitute for professional judgement</li>
              <li>Liable for client health outcomes</li>
              <li>Responsible for your professional conduct</li>
            </ul>
          </section>

          {/* Disclaimers */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Disclaimers</h2>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-6">
              <p className="text-gray-700 mb-4">
                <strong>THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND.</strong>
              </p>
              <p className="text-gray-700">
                We disclaim all warranties, express or implied, including warranties of merchantability, fitness for a particular purpose, non-infringement, and accuracy.
              </p>
            </div>
            <p className="text-gray-700 mb-4">
              <strong>We do not warrant that:</strong>
            </p>
            <ul className="list-disc pl-6 mb-6 text-gray-700 space-y-1">
              <li>The service will be uninterrupted, secure, or error-free</li>
              <li>Generated plans will be accurate, complete, or suitable</li>
              <li>Defects will be corrected</li>
              <li>The service will meet your requirements</li>
            </ul>
            <p className="text-gray-700">
              Your use of the service is at your sole risk.
            </p>
          </section>

          {/* Limitation of Liability */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Limitation of Liability</h2>
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
              <p className="text-gray-700 mb-4">
                <strong>TO THE MAXIMUM EXTENT PERMITTED BY LAW, FORZAFED SHALL NOT BE LIABLE FOR:</strong>
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-1">
                <li>Indirect, incidental, special, consequential, or punitive damages</li>
                <li>Loss of profits, revenue, data, or business opportunities</li>
                <li>Client health outcomes or professional liability claims</li>
                <li>Service interruptions or data loss</li>
                <li>Third-party actions or content</li>
              </ul>
            </div>
            <p className="text-gray-700 mb-4">
              <strong>Our total liability</strong> for all claims shall not exceed the amount you paid us in the 12 months before the claim, or £100, whichever is greater.
            </p>
            <p className="text-gray-700">
              Some jurisdictions do not allow limitation of liability, so these limitations may not apply to you.
            </p>
          </section>

          {/* Indemnification */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Indemnification</h2>
            <p className="text-gray-700 mb-4">
              You agree to indemnify, defend, and hold harmless Forzafed from all claims, damages, losses, and expenses (including legal fees) arising from:
            </p>
            <ul className="list-disc pl-6 mb-6 text-gray-700 space-y-1">
              <li>Your use of the service</li>
              <li>Your violation of these Terms</li>
              <li>Your violation of any laws or third-party rights</li>
              <li>Client claims related to nutrition plans you deliver</li>
              <li>Your professional conduct or negligence</li>
            </ul>
          </section>

          {/* Termination */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">14. Termination</h2>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">14.1 By You</h3>
            <p className="text-gray-700 mb-6">
              You may cancel your account anytime through Settings. Cancellation takes effect at the end of the billing period.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">14.2 By Us</h3>
            <p className="text-gray-700 mb-4">
              We may suspend or terminate your account immediately if:
            </p>
            <ul className="list-disc pl-6 mb-6 text-gray-700 space-y-1">
              <li>You violate these Terms</li>
              <li>Your payment fails repeatedly</li>
              <li>You engage in fraudulent or illegal activity</li>
              <li>Your use harms our service or other users</li>
              <li>We are required to do so by law</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">14.3 Effect of Termination</h3>
            <p className="text-gray-700 mb-4">
              Upon termination:
            </p>
            <ul className="list-disc pl-6 mb-6 text-gray-700 space-y-1">
              <li>Your access to the service ends immediately</li>
              <li>You may download your data within 30 days</li>
              <li>We may delete your data after 30 days</li>
              <li>Outstanding charges remain due</li>
              <li>Provisions that should survive (liability, indemnification) remain in effect</li>
            </ul>
          </section>

          {/* Data Export */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">15. Data Export and Portability</h2>
            <p className="text-gray-700 mb-4">
              You may export your data at any time:
            </p>
            <ul className="list-disc pl-6 mb-6 text-gray-700 space-y-1">
              <li>Client lists and contact information</li>
              <li>Generated nutrition plans (PDF format)</li>
              <li>Plan history and metadata</li>
            </ul>
            <p className="text-gray-700">
              Contact us at{' '}
              <a href={`mailto:${contactEmail}`} className="text-primary-800 hover:underline">
                {contactEmail}
              </a>{' '}
              for assistance with bulk data export.
            </p>
          </section>

          {/* Changes to Terms */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">16. Changes to Terms</h2>
            <p className="text-gray-700 mb-4">
              We may modify these Terms at any time. We will notify you of material changes by:
            </p>
            <ul className="list-disc pl-6 mb-6 text-gray-700 space-y-1">
              <li>Updating the "Last updated" date</li>
              <li>Sending an email to your registered address</li>
              <li>Displaying a notice in the dashboard</li>
            </ul>
            <p className="text-gray-700">
              Continued use after changes constitutes acceptance. If you disagree, you must cancel your account.
            </p>
          </section>

          {/* Dispute Resolution */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">17. Dispute Resolution</h2>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">17.1 Informal Resolution</h3>
            <p className="text-gray-700 mb-6">
              Before filing a claim, contact us at{' '}
              <a href={`mailto:${contactEmail}`} className="text-primary-800 hover:underline">
                {contactEmail}
              </a>{' '}
              to resolve the dispute informally. We commit to good-faith resolution.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">17.2 Governing Law</h3>
            <p className="text-gray-700 mb-6">
              These Terms are governed by the laws of England and Wales, without regard to conflict of law principles.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">17.3 Jurisdiction</h3>
            <p className="text-gray-700 mb-6">
              Any disputes shall be resolved in the courts of England and Wales. You consent to personal jurisdiction in these courts.
            </p>
          </section>

          {/* Miscellaneous */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">18. Miscellaneous</h2>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">18.1 Entire Agreement</h3>
            <p className="text-gray-700 mb-6">
              These Terms, together with our Privacy Policy, constitute the entire agreement between you and Forzafed.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">18.2 Severability</h3>
            <p className="text-gray-700 mb-6">
              If any provision is found unenforceable, the remaining provisions remain in effect.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">18.3 Waiver</h3>
            <p className="text-gray-700 mb-6">
              Failure to enforce a provision does not waive our right to enforce it later.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">18.4 Assignment</h3>
            <p className="text-gray-700 mb-6">
              You may not assign these Terms without our consent. We may assign these Terms without restriction.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">18.5 Force Majeure</h3>
            <p className="text-gray-700 mb-6">
              We are not liable for delays or failures due to circumstances beyond our reasonable control (natural disasters, wars, pandemics, infrastructure failures).
            </p>
          </section>

          {/* Contact */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">19. Contact Information</h2>
            <p className="text-gray-700 mb-4">
              For questions about these Terms:
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <p className="text-gray-700 mb-2">
                <strong>Email:</strong>{' '}
                <a href={`mailto:${contactEmail}`} className="text-primary-800 hover:underline">
                  {contactEmail}
                </a>
              </p>
              <p className="text-gray-700 mb-2">
                <strong>Service Name:</strong> Forzafed
              </p>
              <p className="text-gray-700">
                <strong>Website:</strong>{' '}
                <a href="https://forzafed.com" className="text-primary-800 hover:underline">
                  forzafed.com
                </a>
              </p>
            </div>
          </section>

          {/* Acknowledgement */}
          <section className="mb-8">
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-6">
              <p className="text-gray-900 font-semibold mb-2">
                By using Forzafed, you acknowledge that:
              </p>
              <ul className="list-disc pl-6 mb-0 text-gray-700 space-y-1">
                <li>You have read and understood these Terms</li>
                <li>You agree to be bound by these Terms</li>
                <li>You meet the eligibility requirements</li>
                <li>You will use the service responsibly and professionally</li>
              </ul>
            </div>
          </section>

          {/* Footer Links */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="flex flex-wrap gap-6 text-sm text-gray-600">
              <Link href="/privacy" className="hover:text-primary-800">
                Privacy Policy
              </Link>
              <Link href="/contact" className="hover:text-primary-800">
                Contact Us
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
