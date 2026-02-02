import { setupServer } from 'msw/node'
import { handlers } from './handlers'

// This setup is for Node.js environment (Jest tests)
export const server = setupServer(...handlers)

// Establish API mocking before all tests
beforeAll(() => {
  server.listen({
    onUnhandledRequest: 'bypass',
  })
})

// Reset any request handlers that we may add during the tests,
// so they don't affect other tests
afterEach(() => {
  server.resetHandlers()
})

// Clean up after the tests are finished
afterAll(() => {
  server.close()
})
