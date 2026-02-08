'use client'

import type { SelectOption } from '@/lib/constants'

export function SelectField({
  label,
  name,
  value,
  onChange,
  options,
  error,
}: {
  label: string
  name: string
  value: string
  onChange: (field: string, value: string) => void
  options: SelectOption[]
  error?: string
}) {
  const inputClass = `input ${error ? 'border-red-400 focus:border-red-500 focus:ring-red-200' : ''}`

  return (
    <div>
      <label className="label">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        className={inputClass}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
    </div>
  )
}
