'use client'

import { FormField } from '@/components/FormField'
import { SelectField } from '@/components/SelectField'

const GENDERS = [
  { value: 'M', label: 'Male' },
  { value: 'F', label: 'Female' },
]

export function PersonalInfoStep({
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
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h2>

      <FormField
        label="Client Name *"
        name="name"
        value={formData.name}
        onChange={onChange}
        error={errors.name}
        required
        placeholder="e.g., Sarah Mitchell"
      />

      <div className="grid grid-cols-2 gap-4">
        <FormField
          label="Age *"
          name="age"
          value={formData.age}
          onChange={onChange}
          error={errors.age}
          type="number"
          required
          min="16"
          max="100"
          placeholder="e.g., 35"
        />
        <SelectField
          label="Gender *"
          name="gender"
          value={formData.gender}
          onChange={onChange}
          options={GENDERS}
          error={errors.gender}
        />
      </div>

      <FormField
        label="Height *"
        name="height"
        value={formData.height}
        onChange={onChange}
        error={errors.height}
        required
        placeholder="e.g., 175cm or 5'9&quot;"
      />

      <div className="grid grid-cols-2 gap-4">
        <FormField
          label="Current Weight *"
          name="weight"
          value={formData.weight}
          onChange={onChange}
          error={errors.weight}
          required
          placeholder="e.g., 80kg"
        />
        <FormField
          label="Goal Weight *"
          name="ideal_weight"
          value={formData.ideal_weight}
          onChange={onChange}
          error={errors.ideal_weight}
          required
          placeholder="e.g., 72kg"
        />
      </div>
    </div>
  )
}
