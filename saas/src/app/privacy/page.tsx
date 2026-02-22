/* eslint-disable react/no-unescaped-entities */
// Static legal document - quotation marks are necessary for legal language
// No XSS risk as this is hardcoded content, not user input
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | Forzafed',
  description: 'Learn how Forzafed collects, uses, and protects your personal information.',
}

export default function PrivacyPage() {
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
            Privacy Policy
          </h1>
          <p className="text-gray-600 mb-8">
            Last updated: {lastUpdated}
          </p>

          {/* Introduction */}
          <section className="mb-8">
            <p className="text-gray-700 mb-4">
              At Forzafed, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our service.
            </p>
            <p className="text-gray-700">
              This policy applies to all users globally. We comply with the UK General Data Protection Regulation (UK GDPR), the EU General Data Protection Regulation (GDPR), the California Consumer Privacy Act (CCPA), and other applicable data protection laws.
            </p>
          </section>

          {/* Data Controller */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Data Controller</h2>
            <p className="text-gray-700 mb-2">
              Forzafed operates the service available at <strong>forzafed.com</strong> and is the data controller responsible for your personal information.
            </p>
            <p className="text-gray-700">
              For privacy-related enquiries, contact us at:{' '}
              <a href={`mailto:${contactEmail}`} className="text-primary-800 hover:underline">
                {contactEmail}
              </a>
            </p>
          </section>

          {/* Information We Collect */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Information We Collect</h2>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">2.1 Account Information</h3>
            <p className="text-gray-700 mb-4">
              When you create an account, we collect:
            </p>
            <ul className="list-disc pl-6 mb-6 text-gray-700 space-y-1">
              <li>Email address</li>
              <li>Full name</li>
              <li>Business name (optional)</li>
              <li>Password (stored encrypted)</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">2.2 Client Health Information</h3>
            <p className="text-gray-700 mb-4">
              When you generate nutrition plans for your clients, we collect:
            </p>
            <ul className="list-disc pl-6 mb-6 text-gray-700 space-y-1">
              <li>Client name</li>
              <li>Age, gender, height, weight</li>
              <li>Fitness goals and activity level</li>
              <li>Dietary preferences and restrictions</li>
              <li>Medical conditions and allergies</li>
              <li>Weekly food budget</li>
            </ul>
            <p className="text-gray-700 mb-6">
              <strong>Important:</strong> This information is classified as "special category data" under GDPR (health data). We process it only with your explicit consent as a nutrition professional acting on behalf of your clients.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">2.3 Payment Information</h3>
            <p className="text-gray-700 mb-4">
              When you subscribe to a paid plan:
            </p>
            <ul className="list-disc pl-6 mb-6 text-gray-700 space-y-1">
              <li>Payment card details (processed and stored by Stripe, not by us)</li>
              <li>Billing address</li>
              <li>Subscription tier and billing history</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">2.4 Usage Information</h3>
            <p className="text-gray-700 mb-4">
              We automatically collect:
            </p>
            <ul className="list-disc pl-6 mb-6 text-gray-700 space-y-1">
              <li>IP address and device information</li>
              <li>Browser type and version</li>
              <li>Pages visited and features used</li>
              <li>Number of plans generated</li>
              <li>Audit logs of account activity</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">2.5 Branding Assets</h3>
            <p className="text-gray-700 mb-4">
              If you customize your plan branding:
            </p>
            <ul className="list-disc pl-6 mb-6 text-gray-700 space-y-1">
              <li>Logo image (optional)</li>
              <li>Brand colour preferences</li>
            </ul>
          </section>

          {/* Legal Basis */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Legal Basis for Processing (GDPR)</h2>
            <p className="text-gray-700 mb-4">
              We process your personal information under the following legal bases:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li>
                <strong>Contract Performance:</strong> To provide our service, process payments, and fulfil our obligations to you (account data, usage tracking).
              </li>
              <li>
                <strong>Explicit Consent:</strong> For processing client health data, which you provide when generating nutrition plans.
              </li>
              <li>
                <strong>Legitimate Interests:</strong> To improve our service, prevent fraud, and maintain security (usage analytics, audit logs).
              </li>
              <li>
                <strong>Legal Obligation:</strong> To comply with tax, accounting, and data protection laws.
              </li>
            </ul>
          </section>

          {/* How We Use Information */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. How We Use Your Information</h2>
            <p className="text-gray-700 mb-4">We use your information to:</p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-1">
              <li>Create and manage your account</li>
              <li>Generate AI-powered nutrition plans for your clients</li>
              <li>Process subscription payments</li>
              <li>Provide customer support</li>
              <li>Send service-related emails (receipts, plan updates)</li>
              <li>Improve our AI models and service quality</li>
              <li>Detect and prevent fraud or abuse</li>
              <li>Comply with legal obligations</li>
            </ul>
            <p className="text-gray-700 mb-4">
              <strong>We will never:</strong>
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-1">
              <li>Sell your personal information to third parties</li>
              <li>Use your client health data for marketing</li>
              <li>Share nutrition plans with anyone except you</li>
            </ul>
          </section>

          {/* Third-Party Processors */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Third-Party Service Providers</h2>
            <p className="text-gray-700 mb-4">
              We share your information with trusted third-party processors who help us operate our service:
            </p>

            <div className="space-y-4 mb-4">
              <div className="border-l-4 border-primary-800 pl-4">
                <h4 className="font-semibold text-gray-900">Supabase (Database & Authentication)</h4>
                <p className="text-gray-700 text-sm">
                  Location: USA (AWS infrastructure)<br />
                  Purpose: User authentication, database storage<br />
                  Privacy Policy: <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary-800 hover:underline">supabase.com/privacy</a>
                </p>
              </div>

              <div className="border-l-4 border-primary-800 pl-4">
                <h4 className="font-semibold text-gray-900">Stripe (Payment Processing)</h4>
                <p className="text-gray-700 text-sm">
                  Location: USA (GDPR-compliant, Standard Contractual Clauses)<br />
                  Purpose: Subscription billing, payment processing<br />
                  Privacy Policy: <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary-800 hover:underline">stripe.com/privacy</a>
                </p>
              </div>

              <div className="border-l-4 border-primary-800 pl-4">
                <h4 className="font-semibold text-gray-900">Anthropic Claude (AI Processing)</h4>
                <p className="text-gray-700 text-sm">
                  Location: USA<br />
                  Purpose: AI-powered nutrition plan generation<br />
                  Privacy Policy: <a href="https://www.anthropic.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary-800 hover:underline">anthropic.com/privacy</a><br />
                  <strong>Note:</strong> Anthropic does not train models on your data.
                </p>
              </div>

              <div className="border-l-4 border-primary-800 pl-4">
                <h4 className="font-semibold text-gray-900">Vercel (Hosting)</h4>
                <p className="text-gray-700 text-sm">
                  Location: Global CDN<br />
                  Purpose: Web application hosting<br />
                  Privacy Policy: <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-primary-800 hover:underline">vercel.com/legal/privacy-policy</a>
                </p>
              </div>
            </div>

            <p className="text-gray-700">
              All processors are contractually bound to process your data only as instructed and to maintain appropriate security measures.
            </p>
          </section>

          {/* International Transfers */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. International Data Transfers</h2>
            <p className="text-gray-700 mb-4">
              Your information may be transferred to and processed in countries outside your country of residence, including the United States.
            </p>
            <p className="text-gray-700 mb-4">
              For transfers from the UK/EU to the USA, we rely on:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-1">
              <li><strong>Standard Contractual Clauses (SCCs)</strong> approved by the European Commission</li>
              <li><strong>Adequacy decisions</strong> where applicable</li>
              <li><strong>Processor commitments</strong> to GDPR-equivalent protections</li>
            </ul>
            <p className="text-gray-700">
              We ensure all international transfers meet the requirements of UK GDPR, EU GDPR, and other applicable data protection laws.
            </p>
          </section>

          {/* Data Retention */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Data Retention</h2>
            <p className="text-gray-700 mb-4">We retain your information for as long as:</p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-1">
              <li>Your account is active</li>
              <li>Needed to provide our service</li>
              <li>Required by law (e.g., tax records: 6 years)</li>
            </ul>
            <p className="text-gray-700 mb-4">
              <strong>Upon account deletion:</strong>
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-1">
              <li>Personal data is deleted within <strong>30 days</strong></li>
              <li>Client health data is permanently deleted</li>
              <li>Anonymised usage analytics may be retained</li>
              <li>Legal/financial records retained as required by law</li>
            </ul>
          </section>

          {/* Your Rights */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Your Rights</h2>
            <p className="text-gray-700 mb-4">
              You have the following rights regarding your personal information:
            </p>

            <h3 className="text-lg font-semibold text-gray-900 mb-3">8.1 Rights Under GDPR/UK GDPR (UK/EU Users)</h3>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-1">
              <li><strong>Right of Access:</strong> Request a copy of your personal data</li>
              <li><strong>Right to Rectification:</strong> Correct inaccurate data</li>
              <li><strong>Right to Erasure:</strong> Request deletion of your data ("right to be forgotten")</li>
              <li><strong>Right to Restrict Processing:</strong> Limit how we use your data</li>
              <li><strong>Right to Data Portability:</strong> Receive your data in a machine-readable format</li>
              <li><strong>Right to Object:</strong> Object to processing based on legitimate interests</li>
              <li><strong>Right to Withdraw Consent:</strong> Withdraw consent for health data processing</li>
              <li><strong>Right to Lodge a Complaint:</strong> Complain to your data protection authority</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-900 mb-3">8.2 Rights Under CCPA (California Users)</h3>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-1">
              <li><strong>Right to Know:</strong> What personal information we collect and how we use it</li>
              <li><strong>Right to Delete:</strong> Request deletion of your personal information</li>
              <li><strong>Right to Opt-Out:</strong> Opt-out of sale of personal information (we don&apos;t sell data)</li>
              <li><strong>Right to Non-Discrimination:</strong> Equal service regardless of privacy choices</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-900 mb-3">8.3 How to Exercise Your Rights</h3>
            <p className="text-gray-700 mb-2">
              To exercise any of these rights, contact us at:{' '}
              <a href={`mailto:${contactEmail}`} className="text-primary-800 hover:underline">
                {contactEmail}
              </a>
            </p>
            <p className="text-gray-700 mb-2">
              We will respond within:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-1">
              <li><strong>GDPR requests:</strong> 30 days (may extend to 60 days for complex requests)</li>
              <li><strong>CCPA requests:</strong> 45 days (may extend to 90 days)</li>
            </ul>
            <p className="text-gray-700">
              You may also delete your account directly from the Settings page in your dashboard.
            </p>
          </section>

          {/* Cookies */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Cookies and Tracking</h2>
            <p className="text-gray-700 mb-4">
              We use essential cookies to:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-1">
              <li>Keep you signed in</li>
              <li>Remember your preferences</li>
              <li>Prevent fraud and abuse</li>
            </ul>
            <p className="text-gray-700 mb-4">
              <strong>We do not use:</strong>
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-1">
              <li>Third-party advertising cookies</li>
              <li>Social media tracking pixels</li>
              <li>Cross-site tracking</li>
            </ul>
            <p className="text-gray-700">
              You can control cookies through your browser settings, but disabling essential cookies may prevent you from using our service.
            </p>
          </section>

          {/* Security */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Data Security</h2>
            <p className="text-gray-700 mb-4">
              We implement industry-standard security measures including:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-1">
              <li>Encryption in transit (TLS/SSL) and at rest</li>
              <li>Row-level security policies on database tables</li>
              <li>Regular security audits and updates</li>
              <li>Rate limiting to prevent abuse</li>
              <li>Audit logging of account activity</li>
              <li>Password hashing with industry-standard algorithms</li>
            </ul>
            <p className="text-gray-700">
              However, no system is 100% secure. If you suspect unauthorized access to your account, contact us immediately at{' '}
              <a href={`mailto:${contactEmail}`} className="text-primary-800 hover:underline">
                {contactEmail}
              </a>.
            </p>
          </section>

          {/* Children's Privacy */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Children&apos;s Privacy</h2>
            <p className="text-gray-700">
              Our service is not intended for individuals under 18 years of age. We do not knowingly collect personal information from children. If you believe we have collected information from a child, contact us immediately and we will delete it.
            </p>
          </section>

          {/* Changes to Policy */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Changes to This Policy</h2>
            <p className="text-gray-700 mb-4">
              We may update this Privacy Policy from time to time. We will notify you of material changes by:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-1">
              <li>Posting the updated policy with a new "Last updated" date</li>
              <li>Sending an email to your registered email address</li>
              <li>Displaying a prominent notice in the dashboard</li>
            </ul>
            <p className="text-gray-700">
              Your continued use of the service after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          {/* Contact */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Contact Us</h2>
            <p className="text-gray-700 mb-4">
              For questions, concerns, or requests regarding this Privacy Policy or your personal data:
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <p className="text-gray-700 mb-2">
                <strong>Email:</strong>{' '}
                <a href={`mailto:${contactEmail}`} className="text-primary-800 hover:underline">
                  {contactEmail}
                </a>
              </p>
              <p className="text-gray-700">
                <strong>Response Time:</strong> We aim to respond within 48 hours
              </p>
            </div>
          </section>

          {/* Supervisory Authority */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">14. Supervisory Authority</h2>
            <p className="text-gray-700 mb-4">
              If you are in the UK/EU and believe we have not adequately addressed your privacy concerns, you have the right to lodge a complaint with your local data protection authority:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-1">
              <li>
                <strong>UK:</strong> Information Commissioner&apos;s Office (ICO) -{' '}
                <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer" className="text-primary-800 hover:underline">
                  ico.org.uk
                </a>
              </li>
              <li>
                <strong>EU:</strong> Your country&apos;s data protection authority -{' '}
                <a href="https://edpb.europa.eu/about-edpb/about-edpb/members_en" target="_blank" rel="noopener noreferrer" className="text-primary-800 hover:underline">
                  Find your DPA
                </a>
              </li>
            </ul>
          </section>

          {/* Footer Links */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="flex flex-wrap gap-6 text-sm text-gray-600">
              <Link href="/terms" className="hover:text-primary-800">
                Terms of Service
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
