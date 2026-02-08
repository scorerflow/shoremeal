'use client'

import { FormField } from '@/components/FormField'
import { SelectField } from '@/components/SelectField'
import { DIET_TYPES } from '@/lib/constants'

export function DietaryStep({
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
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Dietary Requirements</h2>

      <SelectField
        label="Diet Type *"
        name="dietary_type"
        value={formData.dietary_type}
        onChange={onChange}
        options={DIET_TYPES}
        error={errors.dietary_type}
      />

      <FormField
        label="Allergies"
        name="allergies"
        value={formData.allergies}
        onChange={onChange}
        error={errors.allergies}
        placeholder="e.g., nuts, shellfish (leave blank if none)"
      />

      <FormField
        label="Foods to Avoid"
        name="dislikes"
        value={formData.dislikes}
        onChange={onChange}
        error={errors.dislikes}
        placeholder="e.g., mushrooms, olives"
      />

      <FormField
        label="Cuisine Preferences"
        name="preferences"
        value={formData.preferences}
        onChange={onChange}
        error={errors.preferences}
        placeholder="e.g., Mediterranean, Asian"
      />
    </div>
  )
}
