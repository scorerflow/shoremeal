'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { AlertBanner } from '@/components/AlertBanner'
import { FormProgress } from '@/components/steps/FormProgress'
import { PersonalInfoStep } from '@/components/steps/PersonalInfoStep'
import { ActivityGoalsStep } from '@/components/steps/ActivityGoalsStep'
import { DietaryStep } from '@/components/steps/DietaryStep'
import { PracticalDetailsStep } from '@/components/steps/PracticalDetailsStep'

const STEP_FIELDS: Record<number, string[]> = {
  1: ['name', 'age', 'gender', 'height', 'weight', 'ideal_weight'],
  2: ['activity_level', 'goal'],
  3: ['dietary_type', 'allergies', 'dislikes', 'preferences'],
  4: ['budget', 'cooking_skill', 'prep_time', 'meals_per_day', 'plan_duration', 'meal_prep_style'],
}

export default function NewClientPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const clientId = searchParams.get('clientId')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [step, setStep] = useState(1)
  const [fetchingClient, setFetchingClient] = useState(false)
  const [clientName, setClientName] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
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

  // Fetch client data if clientId is provided
  useEffect(() => {
    if (!clientId) return

    const fetchClientData = async () => {
      setFetchingClient(true)
      try {
        const response = await fetch(`/api/clients/${clientId}`)
        if (response.ok) {
          const data = await response.json()
          setClientName(data.name)
          setFormData({
            name: data.name || '',
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
        }
      } catch (err) {
        // Silently fail and show empty form
        console.error('Failed to fetch client data:', err)
      } finally {
        setFetchingClient(false)
      }
    }

    fetchClientData()
  }, [clientId])

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

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)
    setFieldErrors({})

    try {
      const payload = clientId
        ? { ...formData, clientId }
        : formData

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.code === 'VALIDATION_ERROR' && data.details) {
          setFieldErrors(data.details)
          const errorFields = Object.keys(data.details)
          const errorStep = Object.entries(STEP_FIELDS).find(
            ([, fields]) => errorFields.some(f => fields.includes(f))
          )
          if (errorStep) setStep(Number(errorStep[0]))
          throw new Error('Please fix the highlighted fields')
        }
        throw new Error(data.error || 'Failed to generate plan')
      }

      router.push(`/dashboard/plans/${data.plan_id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <Link href="/dashboard" className="inline-flex items-center text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Link>
      </div>

      <div className="card">
        {fetchingClient ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600">Loading client data...</span>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {clientName ? `New Plan for ${clientName}` : 'Create Nutrition Plan'}
            </h1>
            <p className="text-gray-600 mb-6">
              {clientName
                ? 'Review and update the information below to generate a new nutrition plan.'
                : 'Enter your client\'s information to generate a personalised nutrition plan.'}
            </p>

            <FormProgress currentStep={step} totalSteps={4} onStepClick={setStep} />

            {error && <AlertBanner variant="error" className="mb-6">{error}</AlertBanner>}

            <div>
              {step === 1 && <PersonalInfoStep formData={formData} onChange={updateField} errors={fieldErrors} />}
              {step === 2 && <ActivityGoalsStep formData={formData} onChange={updateField} errors={fieldErrors} />}
              {step === 3 && <DietaryStep formData={formData} onChange={updateField} errors={fieldErrors} />}
              {step === 4 && <PracticalDetailsStep formData={formData} onChange={updateField} errors={fieldErrors} />}

              <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
                {step > 1 ? (
                  <button type="button" onClick={() => setStep(step - 1)} className="btn-secondary">
                    Previous
                  </button>
                ) : (
                  <div />
                )}

                {step < 4 ? (
                  <button type="button" onClick={() => setStep(step + 1)} className="btn-primary">
                    Next
                  </button>
                ) : (
                  <button type="button" disabled={loading} onClick={handleGenerate} className="btn-primary flex items-center disabled:opacity-50">
                    {loading ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Generate Plan'
                    )}
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
