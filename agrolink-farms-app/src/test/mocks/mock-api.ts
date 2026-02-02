/**
 * Simple API mocking utilities for tests
 * This provides a fallback when MSW has compatibility issues
 */

export interface MockResponse {
  status: number
  data: any
  headers?: Record<string, string>
}

export class MockAPI {
  private static responses: Map<string, MockResponse> = new Map()

  static mockResponse(url: string, response: MockResponse) {
    this.responses.set(url, response)
  }

  static getResponse(url: string): MockResponse | undefined {
    return this.responses.get(url)
  }

  static clearMocks() {
    this.responses.clear()
  }

  static setupDefaultAuthMocks() {
    // Mock Supabase auth endpoints
    this.mockResponse('*/auth/v1/signup', {
      status: 200,
      data: {
        user: {
          id: 'mock-user-id',
          email: 'test@example.com',
          email_confirmed_at: null,
          user_metadata: {},
        },
        session: null,
      },
    })

    this.mockResponse('*/auth/v1/token', {
      status: 200,
      data: {
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
      },
    })

    this.mockResponse('*/rest/v1/users', {
      status: 200,
      data: [
        {
          id: 'mock-user-id',
          email: 'test@example.com',
          name: 'Test User',
          role: 'buyer',
          verification_status: 'approved',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
    })
  }
}

// Setup default mocks
beforeEach(() => {
  MockAPI.setupDefaultAuthMocks()
})

afterEach(() => {
  MockAPI.clearMocks()
})