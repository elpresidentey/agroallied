import { http, HttpResponse } from 'msw'

// Define request handlers for Supabase API mocking
export const handlers = [
  // Mock Supabase Auth endpoints
  http.post('*/auth/v1/signup', async ({ request }) => {
    const body = await request.json() as any
    return HttpResponse.json({
      user: {
        id: 'mock-user-id',
        email: body?.email || 'test@example.com',
        email_confirmed_at: null,
        user_metadata: body?.data || {},
      },
      session: null,
    })
  }),

  http.post('*/auth/v1/token', async ({ request }) => {
    const body = await request.json() as any
    
    if (body?.grant_type === 'password') {
      return HttpResponse.json({
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        expires_in: 3600,
        token_type: 'bearer',
        user: {
          id: 'mock-user-id',
          email: body?.email || 'test@example.com',
          email_confirmed_at: new Date().toISOString(),
          user_metadata: {},
        },
      })
    }
    
    if (body?.grant_type === 'refresh_token') {
      return HttpResponse.json({
        access_token: 'mock-refreshed-access-token',
        refresh_token: 'mock-refreshed-refresh-token',
        expires_in: 3600,
        token_type: 'bearer',
        user: {
          id: 'mock-user-id',
          email: 'test@example.com',
          email_confirmed_at: new Date().toISOString(),
          user_metadata: {},
        },
      })
    }

    return HttpResponse.json({ error: 'Invalid grant type' }, { status: 400 })
  }),

  http.post('*/auth/v1/logout', () => {
    return HttpResponse.json({})
  }),

  http.get('*/auth/v1/user', () => {
    return HttpResponse.json({
      id: 'mock-user-id',
      email: 'test@example.com',
      email_confirmed_at: new Date().toISOString(),
      user_metadata: {},
    })
  }),

  http.post('*/auth/v1/recover', () => {
    return HttpResponse.json({})
  }),

  http.post('*/auth/v1/verify', () => {
    return HttpResponse.json({
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
      expires_in: 3600,
      token_type: 'bearer',
      user: {
        id: 'mock-user-id',
        email: 'test@example.com',
        email_confirmed_at: new Date().toISOString(),
        user_metadata: {},
      },
    })
  }),

  // Mock Supabase Database endpoints
  http.get('*/rest/v1/users', () => {
    return HttpResponse.json([
      {
        id: 'mock-user-id',
        email: 'test@example.com',
        name: 'Test User',
        role: 'buyer',
        verification_status: 'approved',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ])
  }),

  http.post('*/rest/v1/users', async ({ request }) => {
    const body = await request.json() as any
    return HttpResponse.json({
      id: body?.id || 'mock-user-id',
      email: body?.email || 'test@example.com',
      name: body?.name || 'Test User',
      role: body?.role || 'buyer',
      verification_status: body?.verification_status || 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
  }),

  http.patch('*/rest/v1/users', async ({ request }) => {
    const body = await request.json() as any
    return HttpResponse.json({
      id: 'mock-user-id',
      email: 'test@example.com',
      name: body?.name || 'Test User',
      role: body?.role || 'buyer',
      verification_status: body?.verification_status || 'approved',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
  }),
]
