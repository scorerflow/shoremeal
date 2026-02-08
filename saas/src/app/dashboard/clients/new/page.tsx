'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [step, setStep] = useState(1)

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
    budget: '£70',
    cooking_skill: 'intermediate',
    prep_time: '30',
    meals_per_day: '3',
    plan_duration: '7',
    meal_prep_style: 'mixed',
  })

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
    if (step !== 4) {
      setStep(step + 1)
      return
    }
    setLoading(true)
    setError(null)
    setFieldErrors({})

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
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
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Create Nutrition Plan</h1>
        <p className="text-gray-600 mb-6">
          Enter your client&apos;s information to generate a personalised nutrition plan.
        </p>

        <FormProgress currentStep={step} totalSteps={4} onStepClick={setStep} />

        {error && <AlertBanner variant="error" className="mb-6">{error}</AlertBanner>}

        <form onSubmit={handleSubmit}>
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
              <button type="submit" disabled={loading} className="btn-primary flex items-center disabled:opacity-50">
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
        </form>
      </div>
    </div>
  )
}
