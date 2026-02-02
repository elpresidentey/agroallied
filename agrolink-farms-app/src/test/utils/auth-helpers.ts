import { User } from '@/types'

/**
 * Create a mock user for testing
 */
export function createMockUser(overrides?: Partial<User>): User {
  return {
    id: 'mock-user-id',
    email: 'test@example.com',
    name: 'Test User',
    role: 'buyer',
    verification_status: 'approved',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }
}

/**
 * Create a mock session for testing
 */
export function createMockSession(overrides?: Partial<any>) {
  return {
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    expires_in: 3600,
    token_type: 'bearer' as const,
    user: {
      id: 'mock-user-id',
      email: 'test@example.com',
      email_confirmed_at: new Date().toISOString(),
      user_metadata: {},
      app_metadata: {},
    },
    ...overrides,
  }
}

/**
 * Create a mock auth error for testing
 */
export function createMockAuthError(code: string, message: string) {
  return {
    code,
    message,
    userMessage: message,
    retryable: false,
  }
}

/**
 * Wait for a specified amount of time (for testing async operations)
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Create a mock Supabase client for testing
 */
export function createMockSupabaseClient() {
  return {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      getSession: jest.fn(),
      getUser: jest.fn(),
      refreshSession: jest.fn(),
      resetPasswordForEmail: jest.fn(),
      updateUser: jest.fn(),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      upsert: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      maybeSingle: jest.fn(),
    })),
  }
}

/**
 * Mock localStorage for testing
 */
export function mockLocalStorage() {
  const store: Record<string, string> = {}

  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key]
    }),
    clear: jest.fn(() => {
      Object.keys(store).forEach(key => delete store[key])
    }),
    get length() {
      return Object.keys(store).length
    },
    key: jest.fn((index: number) => {
      const keys = Object.keys(store)
      return keys[index] || null
    }),
  }
}

/**
 * Mock cookies for testing
 */
export function mockCookies() {
  const store: Record<string, string> = {}

  return {
    get: jest.fn((name: string) => store[name]),
    set: jest.fn((name: string, value: string) => {
      store[name] = value
    }),
    remove: jest.fn((name: string) => {
      delete store[name]
    }),
    getAll: jest.fn(() => store),
  }
}
