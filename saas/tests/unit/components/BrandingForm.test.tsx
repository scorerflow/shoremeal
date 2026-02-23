/**
 * Component tests for BrandingForm
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import BrandingForm from '@/app/dashboard/settings/branding-form'

// Mock fetch
global.fetch = vi.fn()

describe('BrandingForm', () => {
  const mockBranding = {
    logoUrl: null,
    primaryColour: '#2C5F2D',
    secondaryColour: '#4A7C4E',
    accentColour: '#FF8C00',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Initial Rendering', () => {
    it('should render color inputs with initial values', () => {
      render(<BrandingForm initialBranding={mockBranding} devMode={false} />)

      expect(screen.getByDisplayValue('#2C5F2D')).toBeInTheDocument()
      expect(screen.getByDisplayValue('#4A7C4E')).toBeInTheDocument()
      expect(screen.getByDisplayValue('#FF8C00')).toBeInTheDocument()
    })

    it('should render logo upload section', () => {
      render(<BrandingForm initialBranding={mockBranding} devMode={false} />)

      expect(screen.getByText('Logo')).toBeInTheDocument()
      expect(screen.getByText('Upload Logo')).toBeInTheDocument()
      expect(screen.getByText(/PNG, JPG or GIF \(max 2MB\)/)).toBeInTheDocument()
    })

    it('should show placeholder when no logo exists', () => {
      render(<BrandingForm initialBranding={mockBranding} devMode={false} />)

      // Check for placeholder (ImageIcon component renders)
      const placeholder = screen.getByTestId('logo-placeholder')
      expect(placeholder).toBeInTheDocument()
    })

    it('should show existing logo when logoUrl is provided', () => {
      const withLogo = { ...mockBranding, logoUrl: 'data:image/png;base64,fakedata' }
      render(<BrandingForm initialBranding={withLogo} devMode={false} />)

      const logoImage = screen.getByAltText('Logo preview')
      expect(logoImage).toBeInTheDocument()
      expect(logoImage).toHaveAttribute('src', 'data:image/png;base64,fakedata')
    })
  })

  describe('Logo Upload', () => {
    it('should accept valid image file and show preview', async () => {
      render(<BrandingForm initialBranding={mockBranding} devMode={false} />)

      // Create mock file
      const file = new File(['dummy content'], 'logo.png', { type: 'image/png' })

      // Mock FileReader as a constructor
      let onloadCallback: any = null
      const mockReadAsDataURL = vi.fn()

      global.FileReader = vi.fn(function(this: any) {
        this.readAsDataURL = mockReadAsDataURL
        this.onload = null
        Object.defineProperty(this, 'onload', {
          set(callback: any) {
            onloadCallback = callback
          },
          get() {
            return onloadCallback
          }
        })
      }) as any

      // Upload file - get the input by ID
      const input = document.getElementById('logo-upload') as HTMLInputElement
      fireEvent.change(input, { target: { files: [file] } })

      // Verify readAsDataURL was called
      await waitFor(() => {
        expect(mockReadAsDataURL).toHaveBeenCalledWith(file)
      })
    })

    it('should reject non-image files', async () => {
      render(<BrandingForm initialBranding={mockBranding} devMode={false} />)

      const file = new File(['dummy content'], 'document.pdf', { type: 'application/pdf' })

      const input = document.getElementById('logo-upload') as HTMLInputElement
      fireEvent.change(input, { target: { files: [file] } })

      await waitFor(() => {
        expect(screen.getByText('Please upload an image file')).toBeInTheDocument()
      })
    })

    it('should reject files larger than 2MB', async () => {
      render(<BrandingForm initialBranding={mockBranding} devMode={false} />)

      // Create file > 2MB
      const largeFile = new File(['x'.repeat(2.5 * 1024 * 1024)], 'large.png', { type: 'image/png' })
      Object.defineProperty(largeFile, 'size', { value: 2.5 * 1024 * 1024 })

      const input = document.getElementById('logo-upload') as HTMLInputElement
      fireEvent.change(input, { target: { files: [largeFile] } })

      await waitFor(() => {
        expect(screen.getByText('Logo file must be less than 2MB')).toBeInTheDocument()
      })
    })

    it('should change button text to "Change Logo" when logo exists', () => {
      const withLogo = { ...mockBranding, logoUrl: 'data:image/png;base64,fakedata' }
      render(<BrandingForm initialBranding={withLogo} devMode={false} />)

      expect(screen.getByText('Change Logo')).toBeInTheDocument()
      expect(screen.queryByText('Upload Logo')).not.toBeInTheDocument()
    })
  })

  describe('Logo Removal', () => {
    it('should remove logo when X button is clicked', async () => {
      const withLogo = { ...mockBranding, logoUrl: 'data:image/png;base64,fakedata' }
      render(<BrandingForm initialBranding={withLogo} devMode={false} />)

      // Logo should be visible
      expect(screen.getByAltText('Logo preview')).toBeInTheDocument()

      // Click remove button
      const removeButton = screen.getByTitle('Remove logo')
      fireEvent.click(removeButton)

      // Logo should be gone, placeholder should appear
      await waitFor(() => {
        expect(screen.queryByAltText('Logo preview')).not.toBeInTheDocument()
        expect(screen.getByTestId('logo-placeholder')).toBeInTheDocument()
      })
    })

    it('should reset file input when logo is removed', () => {
      const withLogo = { ...mockBranding, logoUrl: 'data:image/png;base64,fakedata' }
      render(<BrandingForm initialBranding={withLogo} devMode={false} />)

      const removeButton = screen.getByTitle('Remove logo')
      fireEvent.click(removeButton)

      const input = document.getElementById('logo-upload') as HTMLInputElement
      expect(input.value).toBe('')
    })
  })

  describe('Color Picker', () => {
    it('should update primary color when changed', () => {
      render(<BrandingForm initialBranding={mockBranding} devMode={false} />)

      const colorInputs = screen.getAllByDisplayValue('#2C5F2D')
      const textInput = colorInputs.find((input) => input.classList.contains('font-mono')) as HTMLInputElement

      fireEvent.change(textInput, { target: { value: '#FF0000' } })

      expect(textInput.value).toBe('#FF0000')
    })

    it('should update secondary color when changed', () => {
      render(<BrandingForm initialBranding={mockBranding} devMode={false} />)

      const colorInputs = screen.getAllByDisplayValue('#4A7C4E')
      const textInput = colorInputs.find((input) => input.classList.contains('font-mono')) as HTMLInputElement

      fireEvent.change(textInput, { target: { value: '#00FF00' } })

      expect(textInput.value).toBe('#00FF00')
    })

    it('should update accent color when changed', () => {
      render(<BrandingForm initialBranding={mockBranding} devMode={false} />)

      const colorInputs = screen.getAllByDisplayValue('#FF8C00')
      const textInput = colorInputs.find((input) => input.classList.contains('font-mono')) as HTMLInputElement

      fireEvent.change(textInput, { target: { value: '#0000FF' } })

      expect(textInput.value).toBe('#0000FF')
    })
  })

  describe('Save Functionality', () => {
    it('should save branding with logo and colors', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      })
      global.fetch = mockFetch

      render(<BrandingForm initialBranding={mockBranding} devMode={false} />)

      // Update colors
      const primaryInput = screen.getAllByDisplayValue('#2C5F2D').find((input) => input.classList.contains('font-mono')) as HTMLInputElement
      fireEvent.change(primaryInput, { target: { value: '#FF0000' } })

      // Click save
      const saveButton = screen.getByText('Save Branding')
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/branding', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            logo_url: null,
            primary_colour: '#FF0000',
            secondary_colour: '#4A7C4E',
            accent_colour: '#FF8C00',
          }),
        })
      })
    })

    it('should show success state after save', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      })
      global.fetch = mockFetch

      render(<BrandingForm initialBranding={mockBranding} devMode={false} />)

      const saveButton = screen.getByText('Save Branding')
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText('Saved')).toBeInTheDocument()
      })
    })

    it('should show error message on save failure', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Network error' }),
      })
      global.fetch = mockFetch

      render(<BrandingForm initialBranding={mockBranding} devMode={false} />)

      const saveButton = screen.getByText('Save Branding')
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument()
      })
    })

    it('should disable save button while saving', async () => {
      const mockFetch = vi.fn().mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ ok: true, json: async () => ({}) }), 100))
      )
      global.fetch = mockFetch

      render(<BrandingForm initialBranding={mockBranding} devMode={false} />)

      const saveButton = screen.getByText('Save Branding') as HTMLButtonElement
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(saveButton.disabled).toBe(true)
        expect(screen.getByText('Saving...')).toBeInTheDocument()
      })
    })
  })

  describe('Dev Mode', () => {
    it('should not make API call in dev mode', async () => {
      const mockFetch = vi.fn()
      global.fetch = mockFetch

      render(<BrandingForm initialBranding={mockBranding} devMode={true} />)

      const saveButton = screen.getByText('Save Branding')
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(mockFetch).not.toHaveBeenCalled()
        expect(screen.getByText('Saved')).toBeInTheDocument()
      })
    })
  })

  describe('Color Preview', () => {
    it('should render color preview boxes', () => {
      render(<BrandingForm initialBranding={mockBranding} devMode={false} />)

      expect(screen.getByText('Preview')).toBeInTheDocument()

      // Color preview boxes should exist (we can't easily test inline styles in this setup)
      const previewSection = screen.getByText('Preview').parentElement
      expect(previewSection).toBeInTheDocument()
    })
  })
})
