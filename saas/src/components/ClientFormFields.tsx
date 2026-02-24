'use client'

import { FormField } from '@/components/FormField'
import { SelectField } from '@/components/SelectField'
import {
  ACTIVITY_LEVELS,
  GOALS,
  DIET_TYPES,
  COOKING_SKILLS,
  MEAL_PREP_STYLES,
  GENDERS,
  PLAN_DURATIONS,
  MEALS_PER_DAY,
} from '@/lib/constants'

interface ClientFormFieldsProps {
  formData: Record<string, string>
  onChange: (field: string, value: string) => void
  fieldErrors: Record<string, string>
}

export function ClientFormFields({ formData, onChange, fieldErrors }: ClientFormFieldsProps) {
  return (
    <>
      {/* Contact Information */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <FormField
              label="Name *"
              name="name"
              value={formData.name}
              onChange={onChange}
              error={fieldErrors.name}
              placeholder="Client's full name"
            />
          </div>
          <FormField
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={onChange}
            error={fieldErrors.email}
            placeholder="client@example.com"
          />
          <FormField
            label="Phone"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={onChange}
            error={fieldErrors.phone}
            placeholder="+44 7700 900000"
          />
        </div>
      </div>

      {/* Physical Details */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Physical Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            label="Age *"
            name="age"
            type="number"
            value={formData.age}
            onChange={onChange}
            error={fieldErrors.age}
            placeholder="25"
          />
          <SelectField
            label="Gender *"
            name="gender"
            value={formData.gender}
            onChange={onChange}
            options={GENDERS}
            error={fieldErrors.gender}
          />
          <FormField
            label="Height (cm) *"
            name="height"
            type="number"
            value={formData.height}
            onChange={onChange}
            error={fieldErrors.height}
            placeholder="175"
          />
          <FormField
            label="Current Weight (kg) *"
            name="weight"
            type="number"
            value={formData.weight}
            onChange={onChange}
            error={fieldErrors.weight}
            placeholder="75"
          />
          <FormField
            label="Goal Weight (kg) *"
            name="ideal_weight"
            type="number"
            value={formData.ideal_weight}
            onChange={onChange}
            error={fieldErrors.ideal_weight}
            placeholder="70"
          />
          <SelectField
            label="Activity Level *"
            name="activity_level"
            value={formData.activity_level}
            onChange={onChange}
            options={ACTIVITY_LEVELS}
            error={fieldErrors.activity_level}
          />
        </div>
      </div>

      {/* Goals & Dietary */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Goals & Dietary Preferences</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SelectField
            label="Primary Goal *"
            name="goal"
            value={formData.goal}
            onChange={onChange}
            options={GOALS}
            error={fieldErrors.goal}
          />
          <SelectField
            label="Diet Type *"
            name="dietary_type"
            value={formData.dietary_type}
            onChange={onChange}
            options={DIET_TYPES}
            error={fieldErrors.dietary_type}
          />
          <div className="md:col-span-2">
            <FormField
              label="Allergies"
              name="allergies"
              type="textarea"
              value={formData.allergies}
              onChange={onChange}
              error={fieldErrors.allergies}
              placeholder="List any allergies..."
            />
          </div>
          <div className="md:col-span-2">
            <FormField
              label="Foods to Avoid"
              name="dislikes"
              type="textarea"
              value={formData.dislikes}
              onChange={onChange}
              error={fieldErrors.dislikes}
              placeholder="List any foods they dislike or want to avoid..."
            />
          </div>
          <div className="md:col-span-2">
            <FormField
              label="Cuisine Preferences"
              name="preferences"
              type="textarea"
              value={formData.preferences}
              onChange={onChange}
              error={fieldErrors.preferences}
              placeholder="e.g., Italian, Asian, Mediterranean..."
            />
          </div>
        </div>
      </div>

      {/* Practical Details */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Practical Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Weekly Budget (&pound;) *"
            name="budget"
            type="number"
            value={formData.budget}
            onChange={onChange}
            error={fieldErrors.budget}
            placeholder="70"
          />
          <SelectField
            label="Cooking Skill *"
            name="cooking_skill"
            value={formData.cooking_skill}
            onChange={onChange}
            options={COOKING_SKILLS}
            error={fieldErrors.cooking_skill}
          />
          <FormField
            label="Prep Time (minutes) *"
            name="prep_time"
            type="number"
            value={formData.prep_time}
            onChange={onChange}
            error={fieldErrors.prep_time}
            placeholder="30"
          />
          <SelectField
            label="Meals per Day *"
            name="meals_per_day"
            value={formData.meals_per_day}
            onChange={onChange}
            options={MEALS_PER_DAY}
            error={fieldErrors.meals_per_day}
          />
          <SelectField
            label="Default Plan Duration (days) *"
            name="plan_duration"
            value={formData.plan_duration}
            onChange={onChange}
            options={PLAN_DURATIONS}
            error={fieldErrors.plan_duration}
          />
          <SelectField
            label="Meal Variety *"
            name="meal_prep_style"
            value={formData.meal_prep_style}
            onChange={onChange}
            options={MEAL_PREP_STYLES}
            error={fieldErrors.meal_prep_style}
          />
        </div>
      </div>
    </>
  )
}
