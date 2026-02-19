import Link from 'next/link'
import { Check } from 'lucide-react'

const tiers = [
  {
    name: 'Starter',
    price: 29,
    plans: 10,
    features: [
      '10 nutrition plans per month',
      'PDF export',
      'Email support',
      'Basic branding (logo)',
    ],
    cta: 'Start Free Trial',
    popular: false,
  },
  {
    name: 'Pro',
    price: 49,
    plans: 30,
    features: [
      '30 nutrition plans per month',
      'PDF export',
      'Priority support',
      'Full branding (logo + colours)',
      'Client history',
    ],
    cta: 'Start Free Trial',
    popular: true,
  },
  {
    name: 'Agency',
    price: 99,
    plans: 100,
    features: [
      '100 nutrition plans per month',
      'PDF export',
      'Dedicated support',
      'Full white-label branding',
      'Client history',
      'API access',
    ],
    cta: 'Start Free Trial',
    popular: false,
  },
]

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-primary-800">Forzafed</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login" className="text-gray-600 hover:text-gray-900">
                Log in
              </Link>
              <Link href="/signup" className="btn-primary">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-gradient-to-b from-primary-50 to-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Professional Nutrition Plans
            <span className="text-primary-800"> in Minutes</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Generate personalised, comprehensive nutrition plans for your clients.
            Complete with recipes, shopping lists, and meal prep guides.
          </p>
          <div className="flex justify-center space-x-4">
            <Link href="/signup" className="btn-primary text-lg px-8 py-3">
              Start Free Trial
            </Link>
            <Link href="#pricing" className="btn-secondary text-lg px-8 py-3">
              View Pricing
            </Link>
          </div>
          <p className="text-sm text-gray-500 mt-4">No credit card required</p>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Everything You Need
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'AI-Powered Plans',
                description: 'Advanced AI generates comprehensive, personalised nutrition plans tailored to each client\'s needs, goals, and preferences.',
              },
              {
                title: 'Professional PDFs',
                description: 'Beautiful, branded PDF documents your clients will love. Include your logo and colours for a premium feel.',
              },
              {
                title: 'Complete Packages',
                description: 'Each plan includes nutritional analysis, full meal plans, detailed recipes, shopping lists, and meal prep guides.',
              },
              {
                title: 'UK Focused',
                description: 'British spelling, UK measurements, and prices in pounds. Recipes use British terminology and ingredients.',
              },
              {
                title: 'Muscle Preservation',
                description: 'Plans prioritise protein intake to maintain lean muscle mass during fat loss - critical for your clients\' results.',
              },
              {
                title: 'Budget Friendly',
                description: 'Plans respect your clients\' weekly food budgets with practical, affordable meal suggestions.',
              },
            ].map((feature, index) => (
              <div key={index} className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-center text-gray-600 mb-12">
            Choose the plan that fits your practice
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className={`card relative ${
                  tier.popular ? 'ring-2 ring-primary-800' : ''
                }`}
              >
                {tier.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-800 text-white text-sm font-medium px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                )}
                <h3 className="text-xl font-bold text-gray-900">{tier.name}</h3>
                <div className="mt-4 mb-6">
                  <span className="text-4xl font-bold text-gray-900">£{tier.price}</span>
                  <span className="text-gray-600">/month</span>
                </div>
                <p className="text-sm text-gray-600 mb-6">
                  {tier.plans} nutrition plans per month
                </p>
                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="h-5 w-5 text-primary-800 mr-2 flex-shrink-0" />
                      <span className="text-gray-600 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className={`block text-center py-2 px-4 rounded-lg font-medium transition-colors ${
                    tier.popular
                      ? 'bg-primary-800 text-white hover:bg-primary-700'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {tier.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Transform Your Practice?
          </h2>
          <p className="text-primary-100 mb-8">
            Join personal trainers and nutritionists who are saving hours every week
            with professional, AI-generated nutrition plans.
          </p>
          <Link href="/signup" className="inline-block bg-white text-primary-800 font-medium px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors">
            Start Your Free Trial
          </Link>
        </div>
      </section>

      {/* Footer */}
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
    </div>
  )
}
