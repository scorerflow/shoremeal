'use client'

import { FormField } from '@/components/FormField'
import { SelectField } from '@/components/SelectField'
import { COOKING_SKILLS, MEAL_PREP_STYLES, PLAN_DURATIONS, MEALS_PER_DAY } from '@/lib/constants'

export function PracticalDetailsStep({
  formData,
  onChange,
  errors,
}: {
  formData: Record<string, string>
  onChange: (field: string, value: string) => void
  errors: Record<string, string>
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Practical Details</h2>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          label="Weekly Budget (£) *"
          name="budget"
          value={formData.budget}
          onChange={onChange}
          error={errors.budget}
          required
          placeholder="e.g., 70"
        />
        <SelectField
          label="Cooking Skill *"
          name="cooking_skill"
          value={formData.cooking_skill}
          onChange={onChange}
          options={COOKING_SKILLS}
          error={errors.cooking_skill}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          label="Max Prep Time (mins/day) *"
          name="prep_time"
          value={formData.prep_time}
          onChange={onChange}
          error={errors.prep_time}
          type="number"
          required
          min="10"
          max="120"
        />
        <SelectField
          label="Meals Per Day *"
          name="meals_per_day"
          value={formData.meals_per_day}
          onChange={onChange}
          options={MEALS_PER_DAY}
          error={errors.meals_per_day}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <SelectField
          label="Plan Duration (days) *"
          name="plan_duration"
          value={formData.plan_duration}
          onChange={onChange}
          options={PLAN_DURATIONS}
          error={errors.plan_duration}
        />
        <SelectField
          label="Meal Variety *"
          name="meal_prep_style"
          value={formData.meal_prep_style}
          onChange={onChange}
          options={MEAL_PREP_STYLES}
          error={errors.meal_prep_style}
        />
      </div>
    </div>
  )
}
