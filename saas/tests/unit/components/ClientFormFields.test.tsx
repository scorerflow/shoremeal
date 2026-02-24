/**
 * Unit tests for ClientFormFields component
 * Tests: rendering, sections, field interactions, error display, select options
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ClientFormFields } from '@/components/ClientFormFields'
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

const defaultFormData: Record<string, string> = {
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
}

function renderFields(overrides?: {
  formData?: Partial<Record<string, string>>
  fieldErrors?: Record<string, string>
  onChange?: (field: string, value: string) => void
}) {
  const onChange = overrides?.onChange ?? vi.fn()
  const props = {
    formData: { ...defaultFormData, ...overrides?.formData },
    onChange,
    fieldErrors: overrides?.fieldErrors ?? {},
  }
  render(<ClientFormFields {...props} />)
  return { onChange }
}

describe('ClientFormFields', () => {
  describe('Sections', () => {
    it('should render all 4 section headings', () => {
      renderFields()
      expect(screen.getByText('Contact Information')).toBeInTheDocument()
      expect(screen.getByText('Physical Details')).toBeInTheDocument()
      expect(screen.getByText('Goals & Dietary Preferences')).toBeInTheDocument()
      expect(screen.getByText('Practical Details')).toBeInTheDocument()
    })
  })

  describe('Contact Information', () => {
    it('should render name, email, and phone fields', () => {
      renderFields()
      expect(screen.getByPlaceholderText("Client's full name")).toBeInTheDocument()
      expect(screen.getByPlaceholderText('client@example.com')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('+44 7700 900000')).toBeInTheDocument()
    })

    it('should display form data values', () => {
      renderFields({ formData: { name: 'John Doe', email: 'john@test.com', phone: '07700900000' } })
      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument()
      expect(screen.getByDisplayValue('john@test.com')).toBeInTheDocument()
      expect(screen.getByDisplayValue('07700900000')).toBeInTheDocument()
    })

    it('should call onChange when name is typed', () => {
      const { onChange } = renderFields()
      fireEvent.change(screen.getByPlaceholderText("Client's full name"), { target: { value: 'Jane' } })
      expect(onChange).toHaveBeenCalledWith('name', 'Jane')
    })
  })

  describe('Physical Details', () => {
    it('should render age, height, weight, ideal_weight fields', () => {
      renderFields()
      expect(screen.getByPlaceholderText('25')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('175')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('75')).toBeInTheDocument()
      // "70" matches both ideal_weight placeholder and budget value
      expect(screen.getAllByPlaceholderText('70').length).toBeGreaterThanOrEqual(1)
    })

    it('should render gender select with correct options', () => {
      renderFields()
      for (const opt of GENDERS) {
        expect(screen.getByText(opt.label)).toBeInTheDocument()
      }
    })

    it('should render activity level select with correct options', () => {
      renderFields()
      for (const opt of ACTIVITY_LEVELS) {
        expect(screen.getByText(opt.label)).toBeInTheDocument()
      }
    })

    it('should call onChange when age is typed', () => {
      const { onChange } = renderFields()
      fireEvent.change(screen.getByPlaceholderText('25'), { target: { value: '30' } })
      expect(onChange).toHaveBeenCalledWith('age', '30')
    })
  })

  describe('Goals & Dietary', () => {
    it('should render goal select with correct options', () => {
      renderFields()
      for (const opt of GOALS) {
        expect(screen.getByText(opt.label)).toBeInTheDocument()
      }
    })

    it('should render diet type select with correct options', () => {
      renderFields()
      for (const opt of DIET_TYPES) {
        expect(screen.getByText(opt.label)).toBeInTheDocument()
      }
    })

    it('should render textarea fields for allergies, dislikes, preferences', () => {
      renderFields()
      expect(screen.getByPlaceholderText('List any allergies...')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('List any foods they dislike or want to avoid...')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('e.g., Italian, Asian, Mediterranean...')).toBeInTheDocument()
    })

    it('should render textareas as textarea elements', () => {
      renderFields()
      const allergies = screen.getByPlaceholderText('List any allergies...')
      expect(allergies.tagName).toBe('TEXTAREA')
    })

    it('should call onChange when textarea is typed', () => {
      const { onChange } = renderFields()
      fireEvent.change(screen.getByPlaceholderText('List any allergies...'), { target: { value: 'Peanuts' } })
      expect(onChange).toHaveBeenCalledWith('allergies', 'Peanuts')
    })
  })

  describe('Practical Details', () => {
    it('should render budget and prep_time fields', () => {
      renderFields()
      expect(screen.getByDisplayValue('70')).toBeInTheDocument()
      expect(screen.getByDisplayValue('30')).toBeInTheDocument()
    })

    it('should render cooking skill select with correct options', () => {
      renderFields()
      for (const opt of COOKING_SKILLS) {
        expect(screen.getByText(opt.label)).toBeInTheDocument()
      }
    })

    it('should render meals per day select with correct options', () => {
      renderFields()
      for (const opt of MEALS_PER_DAY) {
        expect(screen.getByText(opt.label)).toBeInTheDocument()
      }
    })

    it('should render plan duration select with correct options', () => {
      renderFields()
      for (const opt of PLAN_DURATIONS) {
        expect(screen.getByText(opt.label)).toBeInTheDocument()
      }
    })

    it('should render meal prep style select with correct options', () => {
      renderFields()
      for (const opt of MEAL_PREP_STYLES) {
        expect(screen.getByText(opt.label)).toBeInTheDocument()
      }
    })
  })

  describe('Error Display', () => {
    it('should show error message for a field with an error', () => {
      renderFields({ fieldErrors: { name: 'Name is required' } })
      expect(screen.getByText('Name is required')).toBeInTheDocument()
    })

    it('should show multiple field errors simultaneously', () => {
      renderFields({ fieldErrors: { name: 'Name is required', age: 'Age must be positive' } })
      expect(screen.getByText('Name is required')).toBeInTheDocument()
      expect(screen.getByText('Age must be positive')).toBeInTheDocument()
    })

    it('should not show errors when fieldErrors is empty', () => {
      renderFields()
      const errorElements = document.querySelectorAll('.text-red-600')
      expect(errorElements.length).toBe(0)
    })
  })

  describe('Select Defaults', () => {
    it('should have correct default selected values', () => {
      renderFields()
      // Check selects have default values from formData
      expect((screen.getByText('Male').closest('select') as HTMLSelectElement).value).toBe('M')
      expect((screen.getByText('Moderately active (3-5 days/week)').closest('select') as HTMLSelectElement).value).toBe('moderately_active')
      expect((screen.getByText('Fat loss (maintain muscle)').closest('select') as HTMLSelectElement).value).toBe('fat_loss')
      expect((screen.getByText('Omnivore').closest('select') as HTMLSelectElement).value).toBe('omnivore')
      expect((screen.getByText('Intermediate (moderate complexity)').closest('select') as HTMLSelectElement).value).toBe('intermediate')
    })

    it('should call onChange when a select is changed', () => {
      const { onChange } = renderFields()
      const genderSelect = screen.getByText('Male').closest('select') as HTMLSelectElement
      fireEvent.change(genderSelect, { target: { value: 'F' } })
      expect(onChange).toHaveBeenCalledWith('gender', 'F')
    })
  })
})
