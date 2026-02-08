'use client'

export function FormField({
  label,
  name,
  value,
  onChange,
  error,
  type = 'text',
  placeholder,
  required,
  min,
  max,
}: {
  label: string
  name: string
  value: string
  onChange: (field: string, value: string) => void
  error?: string
  type?: 'text' | 'number'
  placeholder?: string
  required?: boolean
  min?: string
  max?: string
}) {
  const inputClass = `input ${error ? 'border-red-400 focus:border-red-500 focus:ring-red-200' : ''}`

  return (
    <div>
      <label className="label">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        required={required}
        min={min}
        max={max}
        className={inputClass}
        placeholder={placeholder}
      />
      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
    </div>
  )
}
