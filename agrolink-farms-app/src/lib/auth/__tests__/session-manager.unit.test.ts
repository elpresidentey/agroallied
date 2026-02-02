import { SessionManager } from '../session-manager'
import { createMockSession, createMockSupabaseClient } from '@/test/utils/auth-helpers'

// Mock the Supabase client
jest.mock('../../supabase/client', () => ({
  createBrowserClient: jest.fn()
}))

describe('SessionManager Unit Tests', () => {
  let sessionManager: SessionManager
  let mockSupabaseClient: any

  beforeEach(() => {
    // Create a fresh mock client for each test
    mockSupabaseClient = createMockSupabaseClient()
    
    // Mock the createBrowserClient to return our mock
    const { createBrowserClient } = require('../../supabase/client')
    createBrowserClient.mockReturnValue(mockSupabaseClient)
    
    // Create a new session manager instance for each test
    sessionManager = new SessionManager()
  })

  afterEach(() => {
    // Clean up any timers
    sessionManager.destroy()
  })

  describe('getSession', () => {
    it('should return session when Supabase returns valid session', async () => {
      const mockSession = createMockSession()
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      const result = await sessionManager.getSession()

      expect(result).toEqual(mockSession)
      expect(mockSupabaseClient.auth.getSession).toHaveBeenCalledTimes(1)
    })

    it('should return null when Supabase returns error', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'Session not found' }
      })

      const result = await sessionManager.getSession()

      expect(result).toBeNull()
    })

    it('should return null when Supabase throws exception', async () => {
      mockSupabaseClient.auth.getSession.mockRejectedValue(new Error('Network error'))

      const result = await sessionManager.getSession()

      expect(result).toBeNull()
    })
  })

  describe('refreshSession', () => {
    it('should refresh session successfully', async () => {
      const mockSession = createMockSession()
      mockSupabaseClient.auth.refreshSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      const result = await sessionManager.refreshSession()

      expect(result).toEqual(mockSession)
      expect(mockSupabaseClient.auth.refreshSession).toHaveBeenCalledTimes(1)
    })

    it('should throw AuthError when refresh fails', async () => {
      mockSupabaseClient.auth.refreshSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'Invalid refresh token' }
      })

      await expect(sessionManager.refreshSession()).rejects.toMatchObject({
        code: 'token_refresh_failed',
        userMessage: expect.stringContaining('Session refresh failed')
      })
    })

    it('should deduplicate concurrent refresh requests', async () => {
      const mockSession = createMockSession()
      mockSupabaseClient.auth.refreshSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      // Start multiple refresh operations simultaneously
      const promises = [
        sessionManager.refreshSession(),
        sessionManager.refreshSession(),
        sessionManager.refreshSession()
      ]

      const results = await Promise.all(promises)

      // All should return the same session
      results.forEach(result => expect(result).toEqual(mockSession))
      
      // But Supabase should only be called once
      expect(mockSupabaseClient.auth.refreshSession).toHaveBeenCalledTimes(1)
    })
  })

  describe('clearSession', () => {
    it('should sign out from Supabase successfully', async () => {
      mockSupabaseClient.auth.signOut.mockResolvedValue({ error: null })

      await sessionManager.clearSession()

      expect(mockSupabaseClient.auth.signOut).toHaveBeenCalledTimes(1)
    })

    it('should continue cleanup even if signOut fails', async () => {
      mockSupabaseClient.auth.signOut.mockResolvedValue({
        error: { message: 'Network error' }
      })

      // Should not throw error
      await expect(sessionManager.clearSession()).resolves.toBeUndefined()
      expect(mockSupabaseClient.auth.signOut).toHaveBeenCalledTimes(1)
    })

    it('should continue cleanup even if signOut throws exception', async () => {
      mockSupabaseClient.auth.signOut.mockRejectedValue(new Error('Network error'))

      // Should not throw error
      await expect(sessionManager.clearSession()).resolves.toBeUndefined()
    })
  })

  describe('isSessionValid', () => {
    it('should return true for valid session', () => {
      const futureTime = Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
      const session = createMockSession({ expires_at: futureTime })

      const result = sessionManager.isSessionValid(session)

      expect(result).toBe(true)
    })

    it('should return false for expired session', () => {
      const pastTime = Math.floor(Date.now() / 1000) - 3600 // 1 hour ago
      const session = createMockSession({ expires_at: pastTime })

      const result = sessionManager.isSessionValid(session)

      expect(result).toBe(false)
    })

    it('should return false for session expiring within buffer time', () => {
      const nearFutureTime = Math.floor(Date.now() / 1000) + 15 // 15 seconds from now (within 30s buffer)
      const session = createMockSession({ expires_at: nearFutureTime })

      const result = sessionManager.isSessionValid(session)

      expect(result).toBe(false)
    })

    it('should return false for session without access token', () => {
      const session = createMockSession({ access_token: null })

      const result = sessionManager.isSessionValid(session)

      expect(result).toBe(false)
    })

    it('should return false for session without expires_at', () => {
      const session = createMockSession({ expires_at: null })

      const result = sessionManager.isSessionValid(session)

      expect(result).toBe(false)
    })

    it('should return false for null session', () => {
      const result = sessionManager.isSessionValid(null as any)

      expect(result).toBe(false)
    })
  })
})