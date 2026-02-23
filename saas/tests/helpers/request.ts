/**
 * Helper functions for creating NextRequest objects in tests
 */

import { NextRequest } from 'next/server'

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  headers?: Record<string, string>
  body?: any
  authToken?: string
  searchParams?: Record<string, string>
}

/**
 * Create a NextRequest for testing API routes
 */
export function createTestRequest(url: string, options: RequestOptions = {}): NextRequest {
  const {
    method = 'GET',
    headers = {},
    body,
    authToken,
    searchParams,
  } = options

  // Build URL with search params
  const urlObj = new URL(url, 'http://localhost:3000')
  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => {
      urlObj.searchParams.set(key, value)
    })
  }

  // Build headers
  const requestHeaders = new Headers(headers)

  // Add auth cookie if provided
  if (authToken) {
    requestHeaders.set('Cookie', `auth-token=${authToken}`)
  }

  // Add content-type for POST/PUT
  if ((method === 'POST' || method === 'PUT' || method === 'PATCH') && body) {
    requestHeaders.set('Content-Type', 'application/json')
  }

  // Create request
  const request = new NextRequest(urlObj.toString(), {
    method,
    headers: requestHeaders,
    body: body ? JSON.stringify(body) : undefined,
  })

  return request
}

/**
 * Extract JSON from NextResponse
 */
export async function getResponseJson(response: Response): Promise<any> {
  const text = await response.text()
  return text ? JSON.parse(text) : null
}
