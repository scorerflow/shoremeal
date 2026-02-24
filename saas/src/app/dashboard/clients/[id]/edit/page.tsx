'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, User } from 'lucide-react'
import { AlertBanner } from '@/components/AlertBanner'

export default function EditClientPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [fetchingClient, setFetchingClient] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    age: '',
    gender: 'M',
    height: '',
    weight: '',
    ideal_weight: '',
    activity_level: 'moderately_active',
    goal: 'fat_loss',
    dietary_type: 'omnivore',
    allergies: '',
    dislikes: '',
    preferences: '',
    budget: '70',
    cooking_skill: 'intermediate',
    prep_time: '30',
    meals_per_day: '3',
    plan_duration: '7',
    meal_prep_style: 'batch',
  })

  // Fetch client data
  useEffect(() => {
    const fetchClientData = async () => {
      try {
        const response = await fetch(`/api/clients/${params.id}`)
        if (!response.ok) {
          throw new Error('Failed to load client')
        }

        const data = await response.json()
        setFormData({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          age: String(data.age || ''),
          gender: data.gender || 'M',
          height: String(data.height || ''),
          weight: String(data.weight || ''),
          ideal_weight: String(data.ideal_weight || ''),
          activity_level: data.activity_level || 'moderately_active',
          goal: data.goal || 'fat_loss',
          dietary_type: data.dietary_type || 'omnivore',
          allergies: data.allergies || '',
          dislikes: data.dislikes || '',
          preferences: data.preferences || '',
          budget: String(data.budget || '70'),
          cooking_skill: data.cooking_skill || 'intermediate',
          prep_time: String(data.prep_time || '30'),
          meals_per_day: String(data.meals_per_day || '3'),
          plan_duration: String(data.plan_duration || '7'),
          meal_prep_style: data.meal_prep_style || 'batch',
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load client')
      } finally {
        setFetchingClient(false)
      }
    }

    fetchClientData()
  }, [params.id])

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (fieldErrors[field]) {
      setFieldErrors(prev => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setFieldErrors({})

    try {
      const response = await fetch(`/api/clients/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.code === 'VALIDATION_ERROR' && data.details) {
          setFieldErrors(data.details)
          throw new Error('Please fix the highlighted fields')
        }
        throw new Error(data.error || 'Failed to update client')
      }

      router.push(`/dashboard/clients/${params.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  if (fetchingClient) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="card">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-green-600" />
            <span className="ml-3 text-gray-600">Loading client...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <Link href={`/dashboard/clients/${params.id}`} className="inline-flex items-center text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Client
        </Link>
      </div>

      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-blue-100 rounded-lg">
            <User className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Client</h1>
            <p className="text-gray-600">Update {formData.name}&apos;s information and preferences.</p>
          </div>
        </div>

        {error && <AlertBanner variant="error" className="mb-6">{error}</AlertBanner>}

        <form onSubmit={handleSubmit}>
          {/* Contact Information */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  className={`w-full px-4 py-2 border ${fieldErrors.name ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  placeholder="Client's full name"
                />
                {fieldErrors.name && <p className="mt-1 text-sm text-red-600">{fieldErrors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  className={`w-full px-4 py-2 border ${fieldErrors.email ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  placeholder="client@example.com"
                />
                {fieldErrors.email && <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  className={`w-full px-4 py-2 border ${fieldErrors.phone ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  placeholder="+44 7700 900000"
                />
                {fieldErrors.phone && <p className="mt-1 text-sm text-red-600">{fieldErrors.phone}</p>}
              </div>
            </div>
          </div>

          {/* Physical Details */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Physical Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Age <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => updateField('age', e.target.value)}
                  className={`w-full px-4 py-2 border ${fieldErrors.age ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  placeholder="25"
                />
                {fieldErrors.age && <p className="mt-1 text-sm text-red-600">{fieldErrors.age}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gender <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => updateField('gender', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Height (cm) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.height}
                  onChange={(e) => updateField('height', e.target.value)}
                  className={`w-full px-4 py-2 border ${fieldErrors.height ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  placeholder="175"
                />
                {fieldErrors.height && <p className="mt-1 text-sm text-red-600">{fieldErrors.height}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Weight (kg) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.weight}
                  onChange={(e) => updateField('weight', e.target.value)}
                  className={`w-full px-4 py-2 border ${fieldErrors.weight ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  placeholder="75"
                />
                {fieldErrors.weight && <p className="mt-1 text-sm text-red-600">{fieldErrors.weight}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Goal Weight (kg) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.ideal_weight}
                  onChange={(e) => updateField('ideal_weight', e.target.value)}
                  className={`w-full px-4 py-2 border ${fieldErrors.ideal_weight ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  placeholder="70"
                />
                {fieldErrors.ideal_weight && <p className="mt-1 text-sm text-red-600">{fieldErrors.ideal_weight}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Activity Level <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.activity_level}
                  onChange={(e) => updateField('activity_level', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="sedentary">Sedentary (little or no exercise)</option>
                  <option value="lightly_active">Lightly active (1-3 days/week)</option>
                  <option value="moderately_active">Moderately active (3-5 days/week)</option>
                  <option value="very_active">Very active (6-7 days/week)</option>
                  <option value="extremely_active">Extra active (physical job + exercise)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Goals & Dietary */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Goals & Dietary Preferences</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Primary Goal <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.goal}
                  onChange={(e) => updateField('goal', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="fat_loss">Fat loss (maintain muscle)</option>
                  <option value="muscle_gain">Muscle gain / bulking</option>
                  <option value="maintenance">Weight maintenance</option>
                  <option value="recomp">General health & wellness</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Diet Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.dietary_type}
                  onChange={(e) => updateField('dietary_type', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="omnivore">Omnivore</option>
                  <option value="vegetarian">Vegetarian</option>
                  <option value="vegan">Vegan</option>
                  <option value="pescatarian">Pescatarian</option>
                  <option value="keto">Keto</option>
                  <option value="paleo">Paleo</option>
                  <option value="gluten_free">Gluten Free</option>
                  <option value="dairy_free">Dairy Free</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Allergies</label>
                <textarea
                  value={formData.allergies}
                  onChange={(e) => updateField('allergies', e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="List any allergies..."
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Foods to Avoid</label>
                <textarea
                  value={formData.dislikes}
                  onChange={(e) => updateField('dislikes', e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="List any foods they dislike or want to avoid..."
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Cuisine Preferences</label>
                <textarea
                  value={formData.preferences}
                  onChange={(e) => updateField('preferences', e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Italian, Asian, Mediterranean..."
                />
              </div>
            </div>
          </div>

          {/* Practical Details */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Practical Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Weekly Budget (£) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.budget}
                  onChange={(e) => updateField('budget', e.target.value)}
                  className={`w-full px-4 py-2 border ${fieldErrors.budget ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  placeholder="70"
                />
                {fieldErrors.budget && <p className="mt-1 text-sm text-red-600">{fieldErrors.budget}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cooking Skill <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.cooking_skill}
                  onChange={(e) => updateField('cooking_skill', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="beginner">Beginner (simple recipes)</option>
                  <option value="intermediate">Intermediate (moderate complexity)</option>
                  <option value="advanced">Advanced (any complexity)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prep Time (minutes) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.prep_time}
                  onChange={(e) => updateField('prep_time', e.target.value)}
                  className={`w-full px-4 py-2 border ${fieldErrors.prep_time ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  placeholder="30"
                />
                {fieldErrors.prep_time && <p className="mt-1 text-sm text-red-600">{fieldErrors.prep_time}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meals per Day <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.meals_per_day}
                  onChange={(e) => updateField('meals_per_day', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="2">2 meals</option>
                  <option value="3">3 meals</option>
                  <option value="4">4 meals</option>
                  <option value="5">5 meals</option>
                  <option value="6">6 meals</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default Plan Duration (days) <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.plan_duration}
                  onChange={(e) => updateField('plan_duration', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="3">3 days</option>
                  <option value="7">7 days</option>
                  <option value="14">14 days</option>
                  <option value="21">21 days</option>
                  <option value="30">30 days</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meal Prep Style <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.meal_prep_style}
                  onChange={(e) => updateField('meal_prep_style', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="daily">High variety (different meals daily)</option>
                  <option value="batch">Moderate variety (batch cooking - meals repeat every 2-3 days)</option>
                  <option value="mixed">Low variety (same meals all week)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <Link href={`/dashboard/clients/${params.id}`} className="btn-secondary">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex items-center disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Saving Changes...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
