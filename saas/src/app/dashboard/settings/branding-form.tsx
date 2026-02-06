'use client'

import { useState } from 'react'
import { Loader2, Check, Palette } from 'lucide-react'

interface BrandingFormProps {
  initialBranding: {
    logoUrl: string | null
    primaryColour: string
    secondaryColour: string
    accentColour: string
  }
  devMode: boolean
}

export default function BrandingForm({ initialBranding, devMode }: BrandingFormProps) {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [colours, setColours] = useState({
    primaryColour: initialBranding.primaryColour,
    secondaryColour: initialBranding.secondaryColour,
    accentColour: initialBranding.accentColour,
  })

  const handleSave = async () => {
    if (devMode) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      return
    }

    setSaving(true)
    setError(null)

    try {
      const res = await fetch('/api/branding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          primary_colour: colours.primaryColour,
          secondary_colour: colours.secondaryColour,
          accent_colour: colours.accentColour,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save branding')
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
        <Palette className="h-5 w-5 text-gray-500" />
        <p className="text-sm text-gray-600">
          These colours will be used in your branded PDF nutrition plans.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="label">Primary Colour</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={colours.primaryColour}
                onChange={(e) => setColours(prev => ({ ...prev, primaryColour: e.target.value }))}
                className="h-10 w-14 rounded border border-gray-300 cursor-pointer"
              />
              <input
                type="text"
                value={colours.primaryColour}
                onChange={(e) => setColours(prev => ({ ...prev, primaryColour: e.target.value }))}
                className="input flex-1 font-mono text-sm"
                placeholder="#2C5F2D"
              />
            </div>
          </div>

          <div>
            <label className="label">Secondary Colour</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={colours.secondaryColour}
                onChange={(e) => setColours(prev => ({ ...prev, secondaryColour: e.target.value }))}
                className="h-10 w-14 rounded border border-gray-300 cursor-pointer"
              />
              <input
                type="text"
                value={colours.secondaryColour}
                onChange={(e) => setColours(prev => ({ ...prev, secondaryColour: e.target.value }))}
                className="input flex-1 font-mono text-sm"
                placeholder="#4A7C4E"
              />
            </div>
          </div>

          <div>
            <label className="label">Accent Colour</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={colours.accentColour}
                onChange={(e) => setColours(prev => ({ ...prev, accentColour: e.target.value }))}
                className="h-10 w-14 rounded border border-gray-300 cursor-pointer"
              />
              <input
                type="text"
                value={colours.accentColour}
                onChange={(e) => setColours(prev => ({ ...prev, accentColour: e.target.value }))}
                className="input flex-1 font-mono text-sm"
                placeholder="#FF8C00"
              />
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-500 mb-3">Preview</p>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg" style={{ backgroundColor: colours.primaryColour }} />
            <div className="h-10 w-10 rounded-lg" style={{ backgroundColor: colours.secondaryColour }} />
            <div className="h-10 w-10 rounded-lg" style={{ backgroundColor: colours.accentColour }} />
            <div className="ml-4 flex-1">
              <div className="h-3 rounded-full w-3/4 mb-2" style={{ backgroundColor: colours.primaryColour }} />
              <div className="h-2 rounded-full w-1/2" style={{ backgroundColor: colours.secondaryColour, opacity: 0.6 }} />
            </div>
          </div>
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
              'Save Branding'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
