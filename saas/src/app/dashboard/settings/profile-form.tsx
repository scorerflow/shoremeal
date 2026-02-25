'use client'

import { useState } from 'react'
import { Loader2, Check, User } from 'lucide-react'

interface ProfileFormProps {
  initialProfile: {
    fullName: string
    businessName: string
  }
}

export default function ProfileForm({ initialProfile }: ProfileFormProps) {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fullName, setFullName] = useState(initialProfile.fullName)
  const [businessName, setBusinessName] = useState(initialProfile.businessName)

  const handleSave = async () => {
    if (!fullName.trim()) {
      setError('Name is required')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const res = await fetch('/api/trainers/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName.trim(),
          business_name: businessName.trim(),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save profile')
      }

      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-4">
        <User className="h-5 w-5 text-gray-500" />
        <p className="text-sm text-gray-600">
          Your name and business details shown on plans and emails. This does not affect your login credentials.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="full-name" className="label">
            Your Name <span className="text-red-500">*</span>
          </label>
          <input
            id="full-name"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="input w-full"
            placeholder="e.g. Sarah Johnson"
            maxLength={100}
            required
          />
        </div>

        <div>
          <label htmlFor="business-name" className="label">
            Business Name
          </label>
          <input
            id="business-name"
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            className="input w-full"
            placeholder="e.g. Johnson Fitness"
            maxLength={100}
          />
          <p className="text-xs text-gray-500 mt-1">
            Appears on PDFs and emails sent to clients
          </p>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary flex items-center disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : saved ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Saved
              </>
            ) : (
              'Save Profile'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
