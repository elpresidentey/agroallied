import * as fc from 'fast-check'

/**
 * Arbitrary for generating valid email addresses
 */
export const emailArbitrary = fc.emailAddress()

/**
 * Arbitrary for generating user roles
 */
export const roleArbitrary = fc.constantFrom('buyer', 'seller', 'admin')

/**
 * Arbitrary for generating verification statuses
 */
export const verificationStatusArbitrary = fc.constantFrom(
  'pending',
  'approved',
  'rejected',
  'unverified'
)

/**
 * Arbitrary for generating passwords (8-100 characters)
 */
export const passwordArbitrary = fc.string({ minLength: 8, maxLength: 100 })

/**
 * Arbitrary for generating user names
 */
export const nameArbitrary = fc.string({ minLength: 1, maxLength: 100 })

/**
 * Arbitrary for generating user IDs (UUIDs)
 */
export const userIdArbitrary = fc.uuid()

/**
 * Arbitrary for generating timestamps
 */
export const timestampArbitrary = fc.date({ 
  min: new Date('2020-01-01T00:00:00.000Z'), 
  max: new Date('2030-12-31T23:59:59.999Z') 
}).map(d => d.toISOString())

/**
 * Arbitrary for generating access tokens
 */
export const accessTokenArbitrary = fc.string({ minLength: 20, maxLength: 200 })

/**
 * Arbitrary for generating refresh tokens
 */
export const refreshTokenArbitrary = fc.string({ minLength: 20, maxLength: 200 })

/**
 * Arbitrary for generating token expiration times (in seconds from now)
 */
export const expiresInArbitrary = fc.integer({ min: 60, max: 7200 })

/**
 * Arbitrary for generating complete user objects
 */
export const userArbitrary = fc.record({
  id: userIdArbitrary,
  email: emailArbitrary,
  name: nameArbitrary,
  role: roleArbitrary,
  verification_status: verificationStatusArbitrary,
  created_at: timestampArbitrary,
  updated_at: timestampArbitrary,
})

/**
 * Arbitrary for generating session objects
 */
export const sessionArbitrary = fc.record({
  access_token: accessTokenArbitrary,
  refresh_token: refreshTokenArbitrary,
  expires_in: expiresInArbitrary,
  token_type: fc.constant('bearer'),
  user: fc.record({
    id: userIdArbitrary,
    email: emailArbitrary,
    email_confirmed_at: fc.option(timestampArbitrary, { nil: null }),
    user_metadata: fc.dictionary(fc.string(), fc.anything()),
    app_metadata: fc.dictionary(fc.string(), fc.anything()),
  }),
})

/**
 * Arbitrary for generating auth error codes
 */
export const authErrorCodeArbitrary = fc.constantFrom(
  'invalid_credentials',
  'email_not_verified',
  'rate_limit_exceeded',
  'network_error',
  'session_expired',
  'profile_creation_failed',
  'unknown_error'
)

/**
 * Arbitrary for generating auth errors
 */
export const authErrorArbitrary = fc.record({
  code: authErrorCodeArbitrary,
  message: fc.string({ minLength: 10, maxLength: 200 }),
  userMessage: fc.string({ minLength: 10, maxLength: 200 }),
  retryable: fc.boolean(),
  retryAfter: fc.option(fc.integer({ min: 1000, max: 60000 }), { nil: undefined }),
})

/**
 * Configuration for property-based tests
 * Ensures minimum 100 iterations as per design requirements
 */
export const propertyTestConfig = {
  numRuns: 100,
  verbose: true,
}
