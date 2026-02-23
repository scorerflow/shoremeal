import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { handleRouteError } from '@/lib/errors'
import { getClientsByTrainer, createClient } from '@/lib/repositories/clients'
import { createClientSchema } from '@/lib/validation'
import { writeAuditLog } from '@/lib/audit'

export const GET = withAuth(async (request, { user, supabase }) => {
  try {
    const { searchParams } = new URL(request.url)
    const sortBy = searchParams.get('sortBy') as 'name' | 'last_plan_date' | 'created_at' | null
    const sortOrder = searchParams.get('sortOrder') as 'asc' | 'desc' | null

    const clients = await getClientsByTrainer(supabase, user.id, {
      sortBy: sortBy || undefined,
      sortOrder: sortOrder || undefined,
    })

    return NextResponse.json(clients)
  } catch (error) {
    return handleRouteError(error, 'clients.list')
  }
})

export const POST = withAuth(async (request, { user, supabase }) => {
  try {
    const body = await request.json()
    const validatedData = createClientSchema.parse(body)

    // Separate profile fields from form_data fields
    const { name, email, phone, ...formDataFields } = validatedData

    const client = await createClient(supabase, {
      trainer_id: user.id,
      name,
      email: email || null,
      phone: phone || null,
      form_data: formDataFields as unknown as Record<string, unknown>,
    })

    writeAuditLog({
      userId: user.id,
      action: 'client.created',
      resourceType: 'client',
      resourceId: client.id,
      metadata: { name: client.name },
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    })

    return NextResponse.json(
      {
        id: client.id,
        name: client.name,
        email: client.email,
        phone: client.phone,
        created_at: client.created_at,
      },
      { status: 201 }
    )
  } catch (error) {
    return handleRouteError(error, 'clients.create')
  }
})
