// Simple MSW setup that avoids ES module issues
let mockServer: any = null

export function setupMockServer() {
  try {
    const { setupServer } = require('msw/node')
    const { handlers } = require('./handlers')
    
    mockServer = setupServer(...handlers)
    
    // Start server
    mockServer.listen({
      onUnhandledRequest: 'bypass',
    })
    
    return mockServer
  } catch (error) {
    console.warn('MSW setup failed, tests will run without API mocking:', error instanceof Error ? error.message : error)
    return null
  }
}

export function resetMockServer() {
  if (mockServer) {
    mockServer.resetHandlers()
  }
}

export function closeMockServer() {
  if (mockServer) {
    mockServer.close()
  }
}

// Setup hooks
beforeAll(() => {
  setupMockServer()
})

afterEach(() => {
  resetMockServer()
})

afterAll(() => {
  closeMockServer()
})