'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, User } from 'lucide-react'
import { AlertBanner } from '@/components/AlertBanner'
import { ClientFormFields } from '@/components/ClientFormFields'

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
          <ClientFormFields formData={formData} onChange={updateField} fieldErrors={fieldErrors} />

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
