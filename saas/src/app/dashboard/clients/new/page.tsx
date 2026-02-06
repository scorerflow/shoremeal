'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'

const activityLevels = [
  { value: 'sedentary', label: 'Sedentary (little or no exercise)' },
  { value: 'lightly_active', label: 'Lightly active (1-3 days/week)' },
  { value: 'moderately_active', label: 'Moderately active (3-5 days/week)' },
  { value: 'very_active', label: 'Very active (6-7 days/week)' },
  { value: 'extremely_active', label: 'Extra active (physical job + exercise)' },
]

const goals = [
  { value: 'fat_loss', label: 'Fat loss (maintain muscle)' },
  { value: 'maintenance', label: 'Weight maintenance' },
  { value: 'muscle_gain', label: 'Muscle gain / bulking' },
  { value: 'recomp', label: 'General health & wellness' },
]

const dietTypes = [
  { value: 'omnivore', label: 'Omnivore' },
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'pescatarian', label: 'Pescatarian' },
  { value: 'keto', label: 'Keto' },
  { value: 'paleo', label: 'Paleo' },
  { value: 'gluten_free', label: 'Gluten-free' },
  { value: 'dairy_free', label: 'Dairy-free' },
]

const cookingSkills = [
  { value: 'beginner', label: 'Beginner (simple recipes)' },
  { value: 'intermediate', label: 'Intermediate (moderate complexity)' },
  { value: 'advanced', label: 'Advanced (any complexity)' },
]

const mealPrepStyles = [
  { value: 'daily', label: 'Daily (cook fresh each day)' },
  { value: 'batch', label: 'Batch (prep meals in advance)' },
  { value: 'mixed', label: 'Mixed (combination of both)' },
]

export default function NewClientPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [step, setStep] = useState(1)

  const [formData, setFormData] = useState({
    // Personal
    name: '',
    age: '',
    gender: 'M' as 'M' | 'F',
    height: '',
    weight: '',
    ideal_weight: '',
    // Activity & Goals
    activity_level: 'moderately_active',
    goal: 'fat_loss',
    // Dietary
    dietary_type: 'omnivore',
    allergies: '',
    dislikes: '',
    preferences: '',
    // Practical
    budget: '£70',
    cooking_skill: 'intermediate',
    prep_time: '30',
    meals_per_day: '3',
    // Plan
    plan_duration: '7',
    meal_prep_style: 'mixed',
  })

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear field error when user edits
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
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        // Handle field-level validation errors
        if (data.code === 'VALIDATION_ERROR' && data.details) {
          setFieldErrors(data.details)
          // Jump to the step containing the first error
          const errorFields = Object.keys(data.details)
          const step1Fields = ['name', 'age', 'gender', 'height', 'weight', 'ideal_weight']
          const step2Fields = ['activity_level', 'goal']
          const step3Fields = ['dietary_type', 'allergies', 'dislikes', 'preferences']

          if (errorFields.some(f => step1Fields.includes(f))) setStep(1)
          else if (errorFields.some(f => step2Fields.includes(f))) setStep(2)
          else if (errorFields.some(f => step3Fields.includes(f))) setStep(3)
          else setStep(4)

          throw new Error('Please fix the highlighted fields')
        }

        throw new Error(data.error || 'Failed to generate plan')
      }

      // Redirect to plan detail page (will poll for status)
      router.push(`/dashboard/plans/${data.plan_id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  const fieldError = (field: string) => {
    if (!fieldErrors[field]) return null
    return (
      <p className="text-sm text-red-600 mt-1">{fieldErrors[field]}</p>
    )
  }

  const inputClass = (field: string) =>
    `input ${fieldErrors[field] ? 'border-red-400 focus:border-red-500 focus:ring-red-200' : ''}`

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Link>
      </div>

      <div className="card">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Create Nutrition Plan
        </h1>
        <p className="text-gray-600 mb-6">
          Enter your client&apos;s information to generate a personalised nutrition plan.
        </p>

        {/* Progress steps */}
        <div className="flex items-center mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center">
              <button
                onClick={() => setStep(s)}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  step >= s
                    ? 'bg-primary-800 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {s}
              </button>
              {s < 4 && (
                <div
                  className={`w-12 h-1 mx-1 ${
                    step > s ? 'bg-primary-800' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Step 1: Personal Information */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Personal Information
              </h2>

              <div>
                <label className="label">Client Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  required
                  className={inputClass('name')}
                  placeholder="e.g., Sarah Mitchell"
                />
                {fieldError('name')}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Age *</label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => updateField('age', e.target.value)}
                    required
                    min="16"
                    max="100"
                    className={inputClass('age')}
                    placeholder="e.g., 35"
                  />
                  {fieldError('age')}
                </div>
                <div>
                  <label className="label">Gender *</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => updateField('gender', e.target.value)}
                    className={inputClass('gender')}
                  >
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                  </select>
                  {fieldError('gender')}
                </div>
              </div>

              <div>
                <label className="label">Height *</label>
                <input
                  type="text"
                  value={formData.height}
                  onChange={(e) => updateField('height', e.target.value)}
                  required
                  className={inputClass('height')}
                  placeholder="e.g., 175cm or 5'9&quot;"
                />
                {fieldError('height')}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Current Weight *</label>
                  <input
                    type="text"
                    value={formData.weight}
                    onChange={(e) => updateField('weight', e.target.value)}
                    required
                    className={inputClass('weight')}
                    placeholder="e.g., 80kg"
                  />
                  {fieldError('weight')}
                </div>
                <div>
                  <label className="label">Goal Weight *</label>
                  <input
                    type="text"
                    value={formData.ideal_weight}
                    onChange={(e) => updateField('ideal_weight', e.target.value)}
                    required
                    className={inputClass('ideal_weight')}
                    placeholder="e.g., 72kg"
                  />
                  {fieldError('ideal_weight')}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Activity & Goals */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Activity Level & Goals
              </h2>

              <div>
                <label className="label">Activity Level *</label>
                <select
                  value={formData.activity_level}
                  onChange={(e) => updateField('activity_level', e.target.value)}
                  className={inputClass('activity_level')}
                >
                  {activityLevels.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
                {fieldError('activity_level')}
              </div>

              <div>
                <label className="label">Primary Goal *</label>
                <select
                  value={formData.goal}
                  onChange={(e) => updateField('goal', e.target.value)}
                  className={inputClass('goal')}
                >
                  {goals.map((goal) => (
                    <option key={goal.value} value={goal.value}>
                      {goal.label}
                    </option>
                  ))}
                </select>
                {fieldError('goal')}
              </div>
            </div>
          )}

          {/* Step 3: Dietary Requirements */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Dietary Requirements
              </h2>

              <div>
                <label className="label">Diet Type *</label>
                <select
                  value={formData.dietary_type}
                  onChange={(e) => updateField('dietary_type', e.target.value)}
                  className={inputClass('dietary_type')}
                >
                  {dietTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                {fieldError('dietary_type')}
              </div>

              <div>
                <label className="label">Allergies</label>
                <input
                  type="text"
                  value={formData.allergies}
                  onChange={(e) => updateField('allergies', e.target.value)}
                  className={inputClass('allergies')}
                  placeholder="e.g., nuts, shellfish (leave blank if none)"
                />
                {fieldError('allergies')}
              </div>

              <div>
                <label className="label">Foods to Avoid</label>
                <input
                  type="text"
                  value={formData.dislikes}
                  onChange={(e) => updateField('dislikes', e.target.value)}
                  className={inputClass('dislikes')}
                  placeholder="e.g., mushrooms, olives"
                />
                {fieldError('dislikes')}
              </div>

              <div>
                <label className="label">Cuisine Preferences</label>
                <input
                  type="text"
                  value={formData.preferences}
                  onChange={(e) => updateField('preferences', e.target.value)}
                  className={inputClass('preferences')}
                  placeholder="e.g., Mediterranean, Asian"
                />
                {fieldError('preferences')}
              </div>
            </div>
          )}

          {/* Step 4: Practical Details */}
          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Practical Details
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Weekly Budget *</label>
                  <input
                    type="text"
                    value={formData.budget}
                    onChange={(e) => updateField('budget', e.target.value)}
                    required
                    className={inputClass('budget')}
                    placeholder="e.g., £70"
                  />
                  {fieldError('budget')}
                </div>
                <div>
                  <label className="label">Cooking Skill *</label>
                  <select
                    value={formData.cooking_skill}
                    onChange={(e) => updateField('cooking_skill', e.target.value)}
                    className={inputClass('cooking_skill')}
                  >
                    {cookingSkills.map((skill) => (
                      <option key={skill.value} value={skill.value}>
                        {skill.label}
                      </option>
                    ))}
                  </select>
                  {fieldError('cooking_skill')}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Max Prep Time (mins/day) *</label>
                  <input
                    type="number"
                    value={formData.prep_time}
                    onChange={(e) => updateField('prep_time', e.target.value)}
                    required
                    min="10"
                    max="120"
                    className={inputClass('prep_time')}
                  />
                  {fieldError('prep_time')}
                </div>
                <div>
                  <label className="label">Meals Per Day *</label>
                  <select
                    value={formData.meals_per_day}
                    onChange={(e) => updateField('meals_per_day', e.target.value)}
                    className={inputClass('meals_per_day')}
                  >
                    {[3, 4, 5, 6].map((n) => (
                      <option key={n} value={n}>
                        {n} meals
                      </option>
                    ))}
                  </select>
                  {fieldError('meals_per_day')}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Plan Duration *</label>
                  <select
                    value={formData.plan_duration}
                    onChange={(e) => updateField('plan_duration', e.target.value)}
                    className={inputClass('plan_duration')}
                  >
                    <option value="3">3 days</option>
                    <option value="5">5 days</option>
                    <option value="7">7 days (1 week)</option>
                    <option value="14">14 days (2 weeks)</option>
                  </select>
                  {fieldError('plan_duration')}
                </div>
                <div>
                  <label className="label">Meal Prep Style *</label>
                  <select
                    value={formData.meal_prep_style}
                    onChange={(e) => updateField('meal_prep_style', e.target.value)}
                    className={inputClass('meal_prep_style')}
                  >
                    {mealPrepStyles.map((style) => (
                      <option key={style.value} value={style.value}>
                        {style.label}
                      </option>
                    ))}
                  </select>
                  {fieldError('meal_prep_style')}
                </div>
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="btn-secondary"
              >
                Previous
              </button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                className="btn-primary"
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex items-center disabled:opacity-50"
              >
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
