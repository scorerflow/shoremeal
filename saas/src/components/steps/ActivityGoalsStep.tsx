'use client'

import { SelectField } from '@/components/SelectField'
import { ACTIVITY_LEVELS, GOALS } from '@/lib/constants'

export function ActivityGoalsStep({
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
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Activity Level & Goals</h2>

      <SelectField
        label="Activity Level *"
        name="activity_level"
        value={formData.activity_level}
        onChange={onChange}
        options={ACTIVITY_LEVELS}
        error={errors.activity_level}
      />

      <SelectField
        label="Primary Goal *"
        name="goal"
        value={formData.goal}
        onChange={onChange}
        options={GOALS}
        error={errors.goal}
      />
    </div>
  )
}
