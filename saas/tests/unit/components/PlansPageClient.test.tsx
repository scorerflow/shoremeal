/**
 * Component tests for PlansPageClient
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import PlansPageClient from '@/app/dashboard/plans/PlansPageClient'
import type { ClientWithPlans } from '@/lib/data/plans-grouped'

// Mock Next.js Link component
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

describe('PlansPageClient', () => {
  const mockClientWithPlans: ClientWithPlans = {
    client_id: 'client-1',
    client_name: 'John Doe',
    plan_count: 3,
    last_plan_date: new Date().toISOString(),
    plans: [
      {
        id: 'plan-1',
        status: 'completed',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        tokens_used: 1000,
        generation_cost: 0.05,
      },
      {
        id: 'plan-2',
        status: 'pending',
        created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        updated_at: new Date(Date.now() - 86400000).toISOString(),
        tokens_used: 0,
        generation_cost: 0,
      },
      {
        id: 'plan-3',
        status: 'failed',
        created_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        updated_at: new Date(Date.now() - 172800000).toISOString(),
        tokens_used: 500,
        generation_cost: 0.025,
      },
    ],
    stats: {
      completed: 1,
      pending: 1,
      generating: 0,
      failed: 1,
    },
  }

  describe('Empty State', () => {
    it('should render empty state when no plans exist (with subscription)', () => {
      render(<PlansPageClient groupedClients={[]} hasSubscription={true} totalPlans={0} />)

      expect(screen.getByText('No plans yet')).toBeInTheDocument()
      expect(screen.getByText('Create your first nutrition plan for a client.')).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Add First Client' })).toHaveAttribute(
        'href',
        '/dashboard/clients/add'
      )
    })

    it('should render empty state when no plans exist (without subscription)', () => {
      render(<PlansPageClient groupedClients={[]} hasSubscription={false} totalPlans={0} />)

      expect(screen.getByText('No plans yet')).toBeInTheDocument()
      expect(screen.getByText('Subscribe to start generating nutrition plans.')).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'View Pricing' })).toHaveAttribute('href', '/pricing')
    })
  })

  describe('Accordion State Management', () => {
    it('should render client in collapsed state by default', () => {
      render(
        <PlansPageClient
          groupedClients={[mockClientWithPlans]}
          hasSubscription={true}
          totalPlans={3}
        />
      )

      // Client name should be visible
      expect(screen.getByText('John Doe')).toBeInTheDocument()

      // Plan count should be visible
      expect(screen.getByText(/3 plans/)).toBeInTheDocument()

      // Plan list should NOT be visible (collapsed)
      expect(screen.queryByText('plan-1')).not.toBeInTheDocument()
    })

    it('should expand client section when clicked', () => {
      render(
        <PlansPageClient
          groupedClients={[mockClientWithPlans]}
          hasSubscription={true}
          totalPlans={3}
        />
      )

      // Click client header to expand
      const clientHeader = screen.getByRole('button', { name: /john doe/i })
      fireEvent.click(clientHeader)

      // Now plan details should be visible
      // Check for View buttons (one per plan)
      const viewButtons = screen.getAllByRole('link', { name: 'View' })
      expect(viewButtons).toHaveLength(3)
    })

    it('should collapse client section when clicked again', () => {
      render(
        <PlansPageClient
          groupedClients={[mockClientWithPlans]}
          hasSubscription={true}
          totalPlans={3}
        />
      )

      const clientHeader = screen.getByRole('button', { name: /john doe/i })

      // Expand
      fireEvent.click(clientHeader)
      expect(screen.getAllByRole('link', { name: 'View' })).toHaveLength(3)

      // Collapse
      fireEvent.click(clientHeader)
      expect(screen.queryByRole('link', { name: 'View' })).not.toBeInTheDocument()
    })

    it('should handle multiple clients independently', () => {
      const client2: ClientWithPlans = {
        ...mockClientWithPlans,
        client_id: 'client-2',
        client_name: 'Jane Smith',
      }

      render(
        <PlansPageClient
          groupedClients={[mockClientWithPlans, client2]}
          hasSubscription={true}
          totalPlans={6}
        />
      )

      const johnHeader = screen.getByRole('button', { name: /john doe/i })
      const janeHeader = screen.getByRole('button', { name: /jane smith/i })

      // Expand John
      fireEvent.click(johnHeader)
      expect(screen.getAllByRole('link', { name: 'View' })).toHaveLength(3)

      // Expand Jane (John should still be expanded)
      fireEvent.click(janeHeader)
      expect(screen.getAllByRole('link', { name: 'View' })).toHaveLength(6)

      // Collapse John (Jane should still be expanded)
      fireEvent.click(johnHeader)
      expect(screen.getAllByRole('link', { name: 'View' })).toHaveLength(3)
    })
  })

  describe('Status Pills Rendering', () => {
    it('should render completed status pill', () => {
      render(
        <PlansPageClient
          groupedClients={[mockClientWithPlans]}
          hasSubscription={true}
          totalPlans={3}
        />
      )

      // Completed pill should show count
      const completedPill = screen.getByText('1', {
        selector: '.bg-green-100.text-green-700 span',
      })
      expect(completedPill).toBeInTheDocument()
    })

    it('should render pending status pill', () => {
      render(
        <PlansPageClient
          groupedClients={[mockClientWithPlans]}
          hasSubscription={true}
          totalPlans={3}
        />
      )

      // Pending pill should show count
      const pendingPills = screen.getAllByText('1', {
        selector: '.bg-blue-100.text-blue-700 span',
      })
      expect(pendingPills.length).toBeGreaterThan(0)
    })

    it('should render failed status pill', () => {
      render(
        <PlansPageClient
          groupedClients={[mockClientWithPlans]}
          hasSubscription={true}
          totalPlans={3}
        />
      )

      // Failed pill should show count
      const failedPill = screen.getByText('1', {
        selector: '.bg-red-100.text-red-700 span',
      })
      expect(failedPill).toBeInTheDocument()
    })

    it('should not render pills for zero counts', () => {
      const clientWithOnlyCompleted: ClientWithPlans = {
        ...mockClientWithPlans,
        stats: {
          completed: 1,
          pending: 0,
          generating: 0,
          failed: 0,
        },
      }

      render(
        <PlansPageClient
          groupedClients={[clientWithOnlyCompleted]}
          hasSubscription={true}
          totalPlans={1}
        />
      )

      // Should only have completed pill
      expect(screen.getByText('1', { selector: '.bg-green-100.text-green-700 span' })).toBeInTheDocument()

      // Should not have pending or failed pills
      expect(screen.queryByText('1', { selector: '.bg-blue-100.text-blue-700 span' })).not.toBeInTheDocument()
      expect(screen.queryByText('1', { selector: '.bg-red-100.text-red-700 span' })).not.toBeInTheDocument()
    })

    it('should show spinning icon for generating status', () => {
      const clientGenerating: ClientWithPlans = {
        ...mockClientWithPlans,
        stats: {
          completed: 0,
          pending: 0,
          generating: 2,
          failed: 0,
        },
      }

      render(
        <PlansPageClient
          groupedClients={[clientGenerating]}
          hasSubscription={true}
          totalPlans={2}
        />
      )

      // Generating pill should have animate-spin class
      const generatingPill = screen.getByText('2', {
        selector: '.bg-orange-100.text-orange-700 span',
      })
      expect(generatingPill).toBeInTheDocument()

      // Check for spinning clock icon (has animate-spin class)
      const spinningIcon = generatingPill.previousElementSibling
      expect(spinningIcon).toHaveClass('animate-spin')
    })
  })

  describe('Date Formatting', () => {
    it('should format today as "Today"', () => {
      const today = new Date()
      const clientToday: ClientWithPlans = {
        ...mockClientWithPlans,
        last_plan_date: today.toISOString(),
      }

      render(
        <PlansPageClient groupedClients={[clientToday]} hasSubscription={true} totalPlans={1} />
      )

      expect(screen.getByText(/Last plan: Today/)).toBeInTheDocument()
    })

    it('should format yesterday as "Yesterday"', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)

      const clientYesterday: ClientWithPlans = {
        ...mockClientWithPlans,
        last_plan_date: yesterday.toISOString(),
      }

      render(
        <PlansPageClient
          groupedClients={[clientYesterday]}
          hasSubscription={true}
          totalPlans={1}
        />
      )

      expect(screen.getByText(/Last plan: Yesterday/)).toBeInTheDocument()
    })

    it('should format recent days as "X days ago"', () => {
      const threeDaysAgo = new Date()
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)

      const clientRecent: ClientWithPlans = {
        ...mockClientWithPlans,
        last_plan_date: threeDaysAgo.toISOString(),
      }

      render(
        <PlansPageClient groupedClients={[clientRecent]} hasSubscription={true} totalPlans={1} />
      )

      expect(screen.getByText(/Last plan: 3 days ago/)).toBeInTheDocument()
    })

    it('should format weeks as "X weeks ago"', () => {
      const twoWeeksAgo = new Date()
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)

      const clientWeeks: ClientWithPlans = {
        ...mockClientWithPlans,
        last_plan_date: twoWeeksAgo.toISOString(),
      }

      render(
        <PlansPageClient groupedClients={[clientWeeks]} hasSubscription={true} totalPlans={1} />
      )

      expect(screen.getByText(/Last plan: 2 weeks ago/)).toBeInTheDocument()
    })

    it('should format old dates as full date', () => {
      const twoMonthsAgo = new Date()
      twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2)

      const clientOld: ClientWithPlans = {
        ...mockClientWithPlans,
        last_plan_date: twoMonthsAgo.toISOString(),
      }

      render(
        <PlansPageClient groupedClients={[clientOld]} hasSubscription={true} totalPlans={1} />
      )

      // Should show formatted date (e.g., "23 Dec 2025")
      const dateText = screen.getByText(/Last plan:/)
      expect(dateText.textContent).toMatch(/\d{1,2}\s\w{3}\s\d{4}/)
    })
  })

  describe('Plan Actions', () => {
    it('should render View button for all plans', () => {
      render(
        <PlansPageClient
          groupedClients={[mockClientWithPlans]}
          hasSubscription={true}
          totalPlans={3}
        />
      )

      // Expand to see plans
      const clientHeader = screen.getByRole('button', { name: /john doe/i })
      fireEvent.click(clientHeader)

      const viewButtons = screen.getAllByRole('link', { name: 'View' })
      expect(viewButtons).toHaveLength(3)
      expect(viewButtons[0]).toHaveAttribute('href', '/dashboard/plans/plan-1')
    })

    it('should render Download button only for completed plans', () => {
      render(
        <PlansPageClient
          groupedClients={[mockClientWithPlans]}
          hasSubscription={true}
          totalPlans={3}
        />
      )

      // Expand to see plans
      const clientHeader = screen.getByRole('button', { name: /john doe/i })
      fireEvent.click(clientHeader)

      // Only 1 completed plan, so only 1 download button
      const downloadLinks = screen.getAllByRole('link').filter((link) =>
        link.getAttribute('href')?.includes('/pdf')
      )
      expect(downloadLinks).toHaveLength(1)
      expect(downloadLinks[0]).toHaveAttribute('href', '/api/plans/plan-1/pdf')
    })
  })

  describe('Token Display', () => {
    it('should show token count if tokens_used > 0', () => {
      render(
        <PlansPageClient
          groupedClients={[mockClientWithPlans]}
          hasSubscription={true}
          totalPlans={3}
        />
      )

      // Expand to see plans
      const clientHeader = screen.getByRole('button', { name: /john doe/i })
      fireEvent.click(clientHeader)

      // First plan has 1000 tokens
      expect(screen.getByText(/1,000 tokens/)).toBeInTheDocument()

      // Third plan has 500 tokens
      expect(screen.getByText(/500 tokens/)).toBeInTheDocument()
    })

    it('should not show token count if tokens_used = 0', () => {
      render(
        <PlansPageClient
          groupedClients={[mockClientWithPlans]}
          hasSubscription={true}
          totalPlans={3}
        />
      )

      // Expand to see plans
      const clientHeader = screen.getByRole('button', { name: /john doe/i })
      fireEvent.click(clientHeader)

      // Second plan has 0 tokens - check it doesn't show "0 tokens"
      const planElements = screen.getAllByText(/\d{1,2}:\d{2}/)
      expect(planElements[1].textContent).not.toContain('0 tokens')
    })
  })
})
