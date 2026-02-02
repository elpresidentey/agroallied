// Mock Supabase client
const mockCreateClient = jest.fn(() => ({
  auth: {
    getSession: jest.fn(),
    onAuthStateChange: jest.fn(),
    signOut: jest.fn()
  }
}))

jest.mock('@supabase/supabase-js', () => ({
  createClient: mockCreateClient
}))

// Mock Next.js cookies
const mockCookieStore = {
  get: jest.fn(),
  set: jest.fn(),
  delete: jest.fn()
}

jest.mock('next/headers', () => ({
  cookies: () => mockCookieStore
}))

// Mock environment variables
const mockEnv = {
  NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key'
}

describe('Supabase Client Factory', () => {
  let originalEnv: NodeJS.ProcessEnv

  beforeEach(() => {
    // Store original env
    originalEnv = process.env
    
    // Set mock environment variables
    process.env = { ...originalEnv, ...mockEnv }
    
    // Clear mocks and reset module cache to clear singleton
    jest.clearAllMocks()
    jest.resetModules()
  })

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv
  })

  describe('createBrowserClient', () => {
    it('should create a Supabase client with correct configuration', () => {
      const { createBrowserClient } = require('../client')
      
      const client = createBrowserClient()
      
      expect(mockCreateClient).toHaveBeenCalledWith(
        mockEnv.NEXT_PUBLIC_SUPABASE_URL,
        mockEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        expect.objectContaining({
          auth: expect.objectContaining({
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true,
            storageKey: 'supabase.auth.token',
            flowType: 'pkce'
          }),
          global: expect.objectContaining({
            headers: expect.objectContaining({
              'X-Client-Info': 'agrolink-farms-browser'
            })
          })
        })
      )
      
      expect(client).toBeDefined()
    })

    it('should return the same client instance on subsequent calls (singleton)', () => {
      const { createBrowserClient } = require('../client')
      
      const client1 = createBrowserClient()
      const client2 = createBrowserClient()
      
      expect(client1).toBe(client2)
      // Should only call createClient once due to singleton
      expect(mockCreateClient).toHaveBeenCalledTimes(1)
    })

    it('should throw error when SUPABASE_URL is missing', () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL
      
      // Re-require the module to get fresh instance
      const { createBrowserClient } = require('../client')
      
      expect(() => createBrowserClient()).toThrow('Missing Supabase environment variables')
    })

    it('should throw error when SUPABASE_ANON_KEY is missing', () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      // Re-require the module to get fresh instance
      const { createBrowserClient } = require('../client')
      
      expect(() => createBrowserClient()).toThrow('Missing Supabase environment variables')
    })

    it('should configure client with proper auth settings', () => {
      const { createBrowserClient } = require('../client')
      
      createBrowserClient()
      
      const callArgs = mockCreateClient.mock.calls[0]
      const config = callArgs[2]
      
      expect(config.auth).toEqual(expect.objectContaining({
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storageKey: 'supabase.auth.token',
        flowType: 'pkce'
      }))
    })
  })

  describe('createServerClient', () => {
    it('should create a server client with cookie store configuration', () => {
      const { createServerClient } = require('../client')
      
      const mockCookieStore = {
        get: jest.fn().mockReturnValue({ value: 'test-token' }),
        set: jest.fn(),
        delete: jest.fn()
      }
      
      const client = createServerClient(mockCookieStore)
      
      expect(mockCreateClient).toHaveBeenCalledWith(
        mockEnv.NEXT_PUBLIC_SUPABASE_URL,
        mockEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        expect.objectContaining({
          auth: expect.objectContaining({
            autoRefreshToken: false,
            persistSession: false,
            detectSessionInUrl: false,
            flowType: 'pkce',
            storage: expect.objectContaining({
              getItem: expect.any(Function),
              setItem: expect.any(Function),
              removeItem: expect.any(Function)
            })
          }),
          global: expect.objectContaining({
            headers: expect.objectContaining({
              'X-Client-Info': 'agrolink-farms-server'
            })
          })
        })
      )
      
      expect(client).toBeDefined()
    })

    it('should read session from cookies via storage interface', () => {
      const { createServerClient } = require('../client')
      
      const mockCookieStore = {
        get: jest.fn().mockReturnValue({ value: 'test-session-token' }),
        set: jest.fn(),
        delete: jest.fn()
      }
      
      createServerClient(mockCookieStore)
      
      const callArgs = mockCreateClient.mock.calls[0]
      const config = callArgs[2]
      const storage = config.auth.storage
      
      // Test getItem functionality
      const result = storage.getItem('supabase.auth.token')
      expect(mockCookieStore.get).toHaveBeenCalledWith('supabase.auth.token')
      expect(result).toBe('test-session-token')
    })

    it('should return null when cookie does not exist', () => {
      const { createServerClient } = require('../client')
      
      const mockCookieStore = {
        get: jest.fn().mockReturnValue(undefined),
        set: jest.fn(),
        delete: jest.fn()
      }
      
      createServerClient(mockCookieStore)
      
      const callArgs = mockCreateClient.mock.calls[0]
      const config = callArgs[2]
      const storage = config.auth.storage
      
      // Test getItem functionality with missing cookie
      const result = storage.getItem('supabase.auth.token')
      expect(mockCookieStore.get).toHaveBeenCalledWith('supabase.auth.token')
      expect(result).toBeNull()
    })

    it('should create new client instance each time (no singleton for server)', () => {
      const { createServerClient } = require('../client')
      
      const mockCookieStore1 = { get: jest.fn(), set: jest.fn(), delete: jest.fn() }
      const mockCookieStore2 = { get: jest.fn(), set: jest.fn(), delete: jest.fn() }
      
      const client1 = createServerClient(mockCookieStore1)
      const client2 = createServerClient(mockCookieStore2)
      
      // Should create separate instances for server clients
      expect(mockCreateClient).toHaveBeenCalledTimes(2)
    })

    it('should throw error when environment variables are missing', () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL
      
      const { createServerClient } = require('../client')
      const mockCookieStore = { get: jest.fn(), set: jest.fn(), delete: jest.fn() }
      
      expect(() => createServerClient(mockCookieStore)).toThrow('Missing Supabase environment variables')
    })
  })

  describe('createMiddlewareClient', () => {
    it('should create a middleware client with request/response configuration', () => {
      const { createMiddlewareClient } = require('../client')
      
      const mockRequest = {
        cookies: {
          get: jest.fn().mockReturnValue({ value: 'test-middleware-token' })
        }
      }
      
      const mockResponse = {
        cookies: {
          set: jest.fn(),
          delete: jest.fn()
        }
      }
      
      const client = createMiddlewareClient(mockRequest, mockResponse)
      
      expect(mockCreateClient).toHaveBeenCalledWith(
        mockEnv.NEXT_PUBLIC_SUPABASE_URL,
        mockEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        expect.objectContaining({
          auth: expect.objectContaining({
            autoRefreshToken: false,
            persistSession: false,
            detectSessionInUrl: false,
            flowType: 'pkce',
            storage: expect.objectContaining({
              getItem: expect.any(Function),
              setItem: expect.any(Function),
              removeItem: expect.any(Function)
            })
          }),
          global: expect.objectContaining({
            headers: expect.objectContaining({
              'X-Client-Info': 'agrolink-farms-middleware'
            })
          })
        })
      )
      
      expect(client).toBeDefined()
    })

    it('should read cookies from request via storage interface', () => {
      const { createMiddlewareClient } = require('../client')
      
      const mockRequest = {
        cookies: {
          get: jest.fn().mockReturnValue({ value: 'middleware-session-token' })
        }
      }
      
      const mockResponse = {
        cookies: {
          set: jest.fn(),
          delete: jest.fn()
        }
      }
      
      createMiddlewareClient(mockRequest, mockResponse)
      
      const callArgs = mockCreateClient.mock.calls[0]
      const config = callArgs[2]
      const storage = config.auth.storage
      
      // Test getItem functionality
      const result = storage.getItem('supabase.auth.token')
      expect(mockRequest.cookies.get).toHaveBeenCalledWith('supabase.auth.token')
      expect(result).toBe('middleware-session-token')
    })

    it('should set cookies in response via storage interface', () => {
      const { createMiddlewareClient } = require('../client')
      
      const mockRequest = {
        cookies: {
          get: jest.fn()
        }
      }
      
      const mockResponse = {
        cookies: {
          set: jest.fn(),
          delete: jest.fn()
        }
      }
      
      createMiddlewareClient(mockRequest, mockResponse)
      
      const callArgs = mockCreateClient.mock.calls[0]
      const config = callArgs[2]
      const storage = config.auth.storage
      
      // Test setItem functionality
      storage.setItem('supabase.auth.token', 'new-token-value')
      
      expect(mockResponse.cookies.set).toHaveBeenCalledWith(
        'supabase.auth.token',
        'new-token-value',
        expect.objectContaining({
          path: '/',
          maxAge: 60 * 60 * 24 * 7, // 7 days
          sameSite: 'lax',
          httpOnly: true
        })
      )
    })

    it('should remove cookies in response via storage interface', () => {
      const { createMiddlewareClient } = require('../client')
      
      const mockRequest = {
        cookies: {
          get: jest.fn()
        }
      }
      
      const mockResponse = {
        cookies: {
          set: jest.fn(),
          delete: jest.fn()
        }
      }
      
      createMiddlewareClient(mockRequest, mockResponse)
      
      const callArgs = mockCreateClient.mock.calls[0]
      const config = callArgs[2]
      const storage = config.auth.storage
      
      // Test removeItem functionality
      storage.removeItem('supabase.auth.token')
      
      expect(mockResponse.cookies.set).toHaveBeenCalledWith(
        'supabase.auth.token',
        '',
        expect.objectContaining({
          path: '/',
          maxAge: 0,
          sameSite: 'lax',
          httpOnly: true
        })
      )
    })

    it('should create new client instance each time (no singleton for middleware)', () => {
      const { createMiddlewareClient } = require('../client')
      
      const mockRequest1 = { cookies: { get: jest.fn() } }
      const mockResponse1 = { cookies: { set: jest.fn(), delete: jest.fn() } }
      const mockRequest2 = { cookies: { get: jest.fn() } }
      const mockResponse2 = { cookies: { set: jest.fn(), delete: jest.fn() } }
      
      const client1 = createMiddlewareClient(mockRequest1, mockResponse1)
      const client2 = createMiddlewareClient(mockRequest2, mockResponse2)
      
      // Should create separate instances for middleware clients
      expect(mockCreateClient).toHaveBeenCalledTimes(2)
    })

    it('should throw error when environment variables are missing', () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      const { createMiddlewareClient } = require('../client')
      const mockRequest = { cookies: { get: jest.fn() } }
      const mockResponse = { cookies: { set: jest.fn(), delete: jest.fn() } }
      
      expect(() => createMiddlewareClient(mockRequest, mockResponse)).toThrow('Missing Supabase environment variables')
    })
  })

  describe('Cookie Configuration', () => {
    it('should use secure cookie settings in production', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      const { COOKIE_CONFIG } = require('../client')

      expect(COOKIE_CONFIG.SESSION.secure).toBe(true)
      expect(COOKIE_CONFIG.REFRESH_TOKEN.secure).toBe(true)
      expect(COOKIE_CONFIG.ACCESS_TOKEN.secure).toBe(true)

      process.env.NODE_ENV = originalEnv
    })

    it('should not use secure flag in development', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      // Re-require to get fresh config
      jest.resetModules()
      const { COOKIE_CONFIG } = require('../client')

      expect(COOKIE_CONFIG.SESSION.secure).toBe(false)
      expect(COOKIE_CONFIG.REFRESH_TOKEN.secure).toBe(false)
      expect(COOKIE_CONFIG.ACCESS_TOKEN.secure).toBe(false)

      process.env.NODE_ENV = originalEnv
    })

    it('should configure httpOnly flag for all cookie types', () => {
      const { COOKIE_CONFIG } = require('../client')

      expect(COOKIE_CONFIG.SESSION.httpOnly).toBe(true)
      expect(COOKIE_CONFIG.REFRESH_TOKEN.httpOnly).toBe(true)
      expect(COOKIE_CONFIG.ACCESS_TOKEN.httpOnly).toBe(true)
    })

    it('should set sameSite to lax for CSRF protection', () => {
      const { COOKIE_CONFIG } = require('../client')

      expect(COOKIE_CONFIG.SESSION.sameSite).toBe('lax')
      expect(COOKIE_CONFIG.REFRESH_TOKEN.sameSite).toBe('lax')
      expect(COOKIE_CONFIG.ACCESS_TOKEN.sameSite).toBe('lax')
    })

    it('should configure appropriate expiration times', () => {
      const { COOKIE_CONFIG } = require('../client')

      // Session: 7 days
      expect(COOKIE_CONFIG.SESSION.maxAge).toBe(60 * 60 * 24 * 7)
      // Refresh token: 30 days
      expect(COOKIE_CONFIG.REFRESH_TOKEN.maxAge).toBe(60 * 60 * 24 * 30)
      // Access token: 1 hour
      expect(COOKIE_CONFIG.ACCESS_TOKEN.maxAge).toBe(60 * 60)
    })

    it('should set path to root for all cookies', () => {
      const { COOKIE_CONFIG } = require('../client')

      expect(COOKIE_CONFIG.SESSION.path).toBe('/')
      expect(COOKIE_CONFIG.REFRESH_TOKEN.path).toBe('/')
      expect(COOKIE_CONFIG.ACCESS_TOKEN.path).toBe('/')
    })
  })

  describe('Cookie Utility Functions', () => {
    it('should return correct cookie options for different types', () => {
      const { getSecureCookieOptions, COOKIE_CONFIG } = require('../client')

      expect(getSecureCookieOptions('session')).toEqual(COOKIE_CONFIG.SESSION)
      expect(getSecureCookieOptions('refresh')).toEqual(COOKIE_CONFIG.REFRESH_TOKEN)
      expect(getSecureCookieOptions('access')).toEqual(COOKIE_CONFIG.ACCESS_TOKEN)
      expect(getSecureCookieOptions()).toEqual(COOKIE_CONFIG.SESSION) // default
    })

    it('should detect production environment correctly', () => {
      const originalEnv = process.env.NODE_ENV
      
      process.env.NODE_ENV = 'production'
      jest.resetModules()
      const { isProductionEnvironment: isProdTrue } = require('../client')
      expect(isProdTrue()).toBe(true)

      process.env.NODE_ENV = 'development'
      jest.resetModules()
      const { isProductionEnvironment: isProdFalse } = require('../client')
      expect(isProdFalse()).toBe(false)

      process.env.NODE_ENV = originalEnv
    })

    it('should create secure cookie string with all attributes', () => {
      const { createSecureCookieString } = require('../client')

      const cookieString = createSecureCookieString('test-cookie', 'test-value', {
        maxAge: 3600,
        secure: true,
        httpOnly: true,
        sameSite: 'lax',
        path: '/test'
      })

      expect(cookieString).toContain('test-cookie=test-value')
      expect(cookieString).toContain('Path=/test')
      expect(cookieString).toContain('Max-Age=3600')
      expect(cookieString).toContain('SameSite=lax')
      expect(cookieString).toContain('Secure')
      expect(cookieString).toContain('HttpOnly')
    })

    it('should create cookie string with default options', () => {
      const { createSecureCookieString } = require('../client')

      const cookieString = createSecureCookieString('test-cookie', 'test-value')

      expect(cookieString).toContain('test-cookie=test-value')
      expect(cookieString).toContain('Path=/')
      expect(cookieString).toContain('SameSite=lax')
      expect(cookieString).toContain('HttpOnly')
    })

    it('should handle optional cookie attributes', () => {
      const { createSecureCookieString } = require('../client')

      const cookieString = createSecureCookieString('test-cookie', 'test-value', {
        domain: 'example.com'
      })

      expect(cookieString).toContain('test-cookie=test-value')
      expect(cookieString).toContain('Domain=example.com')
    })
  })

  describe('Middleware Cookie Type Detection', () => {
    it('should apply refresh token settings for refresh token cookies', () => {
      const { createMiddlewareClient } = require('../client')
      
      const mockRequest = { cookies: { get: jest.fn() } }
      const mockResponse = { cookies: { set: jest.fn() } }
      
      createMiddlewareClient(mockRequest, mockResponse)
      
      const callArgs = mockCreateClient.mock.calls[0]
      const config = callArgs[2]
      const storage = config.auth.storage
      
      // Test setItem with refresh token key
      storage.setItem('supabase.auth.refresh-token', 'refresh-value')
      
      expect(mockResponse.cookies.set).toHaveBeenCalledWith(
        'supabase.auth.refresh-token',
        'refresh-value',
        expect.objectContaining({
          maxAge: 60 * 60 * 24 * 30, // 30 days for refresh token
          httpOnly: true,
          sameSite: 'lax'
        })
      )
    })

    it('should apply access token settings for access token cookies', () => {
      const { createMiddlewareClient } = require('../client')
      
      const mockRequest = { cookies: { get: jest.fn() } }
      const mockResponse = { cookies: { set: jest.fn() } }
      
      createMiddlewareClient(mockRequest, mockResponse)
      
      const callArgs = mockCreateClient.mock.calls[0]
      const config = callArgs[2]
      const storage = config.auth.storage
      
      // Test setItem with access token key
      storage.setItem('supabase.auth.access-token', 'access-value')
      
      expect(mockResponse.cookies.set).toHaveBeenCalledWith(
        'supabase.auth.access-token',
        'access-value',
        expect.objectContaining({
          maxAge: 60 * 60, // 1 hour for access token
          httpOnly: true,
          sameSite: 'lax'
        })
      )
    })

    it('should apply session settings for other cookies', () => {
      const { createMiddlewareClient } = require('../client')
      
      const mockRequest = { cookies: { get: jest.fn() } }
      const mockResponse = { cookies: { set: jest.fn() } }
      
      createMiddlewareClient(mockRequest, mockResponse)
      
      const callArgs = mockCreateClient.mock.calls[0]
      const config = callArgs[2]
      const storage = config.auth.storage
      
      // Test setItem with generic session key
      storage.setItem('supabase.auth.token', 'session-value')
      
      expect(mockResponse.cookies.set).toHaveBeenCalledWith(
        'supabase.auth.token',
        'session-value',
        expect.objectContaining({
          maxAge: 60 * 60 * 24 * 7, // 7 days for session
          httpOnly: true,
          sameSite: 'lax'
        })
      )
    })
  })

  describe('createApiClient', () => {
    it('should create API client with cookie support', () => {
      const { createApiClient } = require('../client')
      
      const mockRequest = new Request('https://example.com', {
        headers: { cookie: 'test-cookie=test-value' }
      })
      
      const mockResponse = {
        cookies: {
          set: jest.fn(),
          delete: jest.fn()
        }
      }
      
      const client = createApiClient(mockRequest, mockResponse)
      
      expect(mockCreateClient).toHaveBeenCalledWith(
        mockEnv.NEXT_PUBLIC_SUPABASE_URL,
        mockEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        expect.objectContaining({
          auth: expect.objectContaining({
            autoRefreshToken: false,
            persistSession: true,
            detectSessionInUrl: false,
            flowType: 'pkce',
            storage: expect.objectContaining({
              getItem: expect.any(Function),
              setItem: expect.any(Function),
              removeItem: expect.any(Function)
            })
          }),
          global: expect.objectContaining({
            headers: expect.objectContaining({
              'X-Client-Info': 'agrolink-farms-api'
            })
          })
        })
      )
      
      expect(client).toBeDefined()
    })

    it('should parse cookies from request headers', () => {
      const { createApiClient } = require('../client')
      
      const mockRequest = new Request('https://example.com', {
        headers: { cookie: 'supabase.auth.token=test-token; other=value' }
      })
      
      const mockResponse = { cookies: { set: jest.fn(), delete: jest.fn() } }
      
      createApiClient(mockRequest, mockResponse)
      
      const callArgs = mockCreateClient.mock.calls[0]
      const config = callArgs[2]
      const storage = config.auth.storage
      
      // Test getItem functionality
      const result = storage.getItem('supabase.auth.token')
      expect(result).toBe('test-token')
    })

    it('should return null for missing cookies', () => {
      const { createApiClient } = require('../client')
      
      const mockRequest = new Request('https://example.com')
      const mockResponse = { cookies: { set: jest.fn(), delete: jest.fn() } }
      
      createApiClient(mockRequest, mockResponse)
      
      const callArgs = mockCreateClient.mock.calls[0]
      const config = callArgs[2]
      const storage = config.auth.storage
      
      // Test getItem functionality with no cookies
      const result = storage.getItem('supabase.auth.token')
      expect(result).toBeNull()
    })

    it('should set cookies with secure settings', () => {
      const { createApiClient } = require('../client')
      
      const mockRequest = new Request('https://example.com')
      const mockResponse = { cookies: { set: jest.fn(), delete: jest.fn() } }
      
      createApiClient(mockRequest, mockResponse)
      
      const callArgs = mockCreateClient.mock.calls[0]
      const config = callArgs[2]
      const storage = config.auth.storage
      
      // Test setItem functionality
      storage.setItem('supabase.auth.token', 'new-token')
      
      expect(mockResponse.cookies.set).toHaveBeenCalledWith(
        'supabase.auth.token',
        'new-token',
        expect.objectContaining({
          path: '/',
          maxAge: 60 * 60 * 24 * 7, // 7 days
          sameSite: 'lax',
          httpOnly: true
        })
      )
    })
  })
})