/**
 * DEV_MODE mock data fixtures
 * All development mode mock data consolidated in one place
 */

import type { Trainer, Branding, PlanStatus } from '@/types'

export interface MockTrainer extends Partial<Trainer> {
  id: string
  email: string
  full_name: string
  business_name: string
  subscription_tier: 'starter' | 'pro' | 'agency'
  subscription_status: 'active' | 'cancelled' | 'past_due'
  plans_used_this_month: number
  stripe_customer_id: string | null
}

export interface MockBranding extends Partial<Branding> {
  id: string
  trainer_id: string
  logo_url: string | null
  primary_colour: string
  secondary_colour: string
  accent_colour: string
}

export interface MockClient {
  id: string
  name: string
  email: string | null
  created_at: string
  plans: { id: string; status: PlanStatus; created_at: string }[]
}

export interface MockPlan {
  id: string
  status: PlanStatus
  generation_cost: number
  tokens_used: number
  created_at: string
  updated_at: string
  clients: { name: string } | null
}

// Default trainer for DEV_MODE
export const DEV_TRAINER: MockTrainer = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'dev@forzafed.test',
  full_name: 'David Scorer',
  business_name: 'Shore Fitness',
  subscription_tier: 'pro',
  subscription_status: 'active',
  plans_used_this_month: 3,
  stripe_customer_id: null,
}

// Default branding for DEV_MODE
export const DEV_BRANDING: MockBranding = {
  id: 'dev-branding',
  trainer_id: '00000000-0000-0000-0000-000000000001',
  logo_url: null,
  primary_colour: '#2C5F2D',
  secondary_colour: '#4A7C4E',
  accent_colour: '#FF8C00',
}

// Mock clients for DEV_MODE
export const DEV_CLIENTS: MockClient[] = [
  {
    id: '1',
    name: 'Sarah Mitchell',
    email: 'sarah@example.com',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    plans: [
      { id: 'p1', status: 'completed', created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
    ],
  },
  {
    id: '2',
    name: 'James Wilson',
    email: 'james@example.com',
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    plans: [
      { id: 'p2', status: 'completed', created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
      { id: 'p3', status: 'completed', created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString() },
    ],
  },
  {
    id: '3',
    name: 'Emma Thompson',
    email: null,
    created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    plans: [
      { id: 'p4', status: 'generating', created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString() },
    ],
  },
  {
    id: '4',
    name: 'Tom Bradley',
    email: 'tom.b@example.com',
    created_at: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
    plans: [],
  },
  {
    id: '5',
    name: 'Lucy Chen',
    email: 'lucy.chen@example.com',
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    plans: [
      { id: 'p5', status: 'completed', created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() },
    ],
  },
]

// Mock plans for DEV_MODE
export const DEV_PLANS: MockPlan[] = [
  {
    id: 'p1',
    status: 'completed',
    generation_cost: 0.042,
    tokens_used: 11200,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    clients: { name: 'Sarah Mitchell' },
  },
  {
    id: 'p2',
    status: 'completed',
    generation_cost: 0.038,
    tokens_used: 10800,
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    clients: { name: 'James Wilson' },
  },
  {
    id: 'p3',
    status: 'completed',
    generation_cost: 0.040,
    tokens_used: 11000,
    created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    clients: { name: 'James Wilson' },
  },
  {
    id: 'p4',
    status: 'generating',
    generation_cost: 0,
    tokens_used: 0,
    created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    clients: { name: 'Emma Thompson' },
  },
  {
    id: 'p5',
    status: 'completed',
    generation_cost: 0.045,
    tokens_used: 11500,
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    clients: { name: 'Lucy Chen' },
  },
]

// Dashboard stats for DEV_MODE
export const DEV_CLIENT_COUNT = 5
export const DEV_PLAN_COUNT = 12
