# Authentication API Documentation

This document provides comprehensive API documentation for the AgroLink Farms authentication system, including all services, methods, types, and error codes.

## Table of Contents

- [Overview](#overview)
- [AuthService](#authservice)
- [SessionManager](#sessionmanager)
- [ErrorHandler](#errorhandler)
- [ProfileSyncService](#profilesyncservice)
- [Auth Context](#auth-context)
- [Protected Route Component](#protected-route-component)
- [Types and Interfaces](#types-and-interfaces)
- [Error Codes](#error-codes)
- [Migration Guide](#migration-guide)

## Overview

The authentication system consists of several interconnected services:

- **AuthService**: Core authentication operations (signup, signin, password reset)
- **SessionManager**: Session lifecycle management and token refresh
- **ErrorHandler**: Consistent error parsing and user-friendly messages
- **ProfileSyncService**: User profile creation and synchronization
- **Auth Context**: React context for authentication state management
- **Protected Route**: Component for role-based access control

## AuthService

The `AuthService` class provides the main authentication business logic.

### Constructor

```typescript
constructor(
  supabaseClient?: SupabaseClient,
  sessionManager?: SessionManager,
  errorHandler?: ErrorHandler,
  profileSync?: ProfileSyncService
)
```

**Parameters:**
- `supabaseClient` (optional): Custom Supabase client instance
- `sessionManager` (optional): Custom session manager instance
- `errorHandler` (optional): Custom error handler instance
- `profileSync` (optional): Custom profile sync service instance

### Methods

#### signUp(params: SignUpParams): Promise<SignUpResult>

Register a new user with email, password, name, and role.

**Parameters:**
```typescript
interface SignUpParams {
  email: string
  password: string
  name: string
  role: UserRole // 'buyer' | 'seller' | 'admin'
}
```

**Returns:**
```typescript
interface SignUpResult {
  success: boolean
  needsVerification: boolean
  user?: User
  error?: AuthError
}
```

**Features:**
- Rate limiting (5-second cooldown between attempts)
- Input validation (email format, password strength, required fields)
- Automatic profile creation for verified emails
- Email verification flow for unverified emails

**Example:**
```typescript
const result = await authService.signUp({
  email: 'user@example.com',
  password: 'securePassword123',
  name: 'John Doe',
  role: 'buyer'
})

if (result.success) {
  if (result.needsVerification) {
    // Show verification message
    console.log('Please check your email to verify your account')
  } else {
    // User is signed in
    console.log('Welcome!', result.user)
  }
} else {
  console.error(result.error?.userMessage)
}
```

#### signIn(email: string, password: string): Promise<SignInResult>

Sign in an existing user with email and password.

**Parameters:**
- `email`: User's email address
- `password`: User's password

**Returns:**
```typescript
interface SignInResult {
  success: boolean
  user?: User
  error?: AuthError
}
```

**Features:**
- Credential validation
- Automatic token refresh setup
- Profile synchronization
- Profile creation for users without profiles

**Example:**
```typescript
const result = await authService.signIn('user@example.com', 'password123')

if (result.success) {
  console.log('Signed in as:', result.user?.name)
  // Redirect based on user role
  const redirectPath = result.user?.role === 'admin' ? '/admin' 
    : result.user?.role === 'seller' ? '/seller/dashboard'
    : '/buyer/dashboard'
} else {
  console.error(result.error?.userMessage)
}
```

#### signOut(): Promise<void>

Sign out the current user and terminate session.

**Features:**
- Token revocation
- Local session cleanup
- Graceful error handling (ensures local cleanup even if server signout fails)

**Example:**
```typescript
await authService.signOut()
console.log('User signed out')
```

#### getCurrentUser(): Promise<User | null>

Get the current authenticated user.

**Returns:** Current user profile or `null` if not authenticated

**Example:**
```typescript
const user = await authService.getCurrentUser()
if (user) {
  console.log('Current user:', user.name, user.role)
} else {
  console.log('No user authenticated')
}
```

#### updateProfile(userId: string, updates: Partial<User>): Promise<User>

Update user profile information.

**Parameters:**
- `userId`: ID of user to update
- `updates`: Partial user data to update

**Returns:** Updated user profile

**Security:** Verifies that the authenticated user can only update their own profile

**Example:**
```typescript
const updatedUser = await authService.updateProfile(user.id, {
  name: 'New Name',
  phone: '+1234567890'
})
console.log('Profile updated:', updatedUser)
```

#### requestPasswordReset(email: string): Promise<void>

Send password reset email to user.

**Parameters:**
- `email`: Email address to send reset link to

**Features:**
- Email format validation
- Secure reset link generation
- Does not reveal if email exists (security feature)

**Example:**
```typescript
try {
  await authService.requestPasswordReset('user@example.com')
  console.log('Password reset email sent')
} catch (error) {
  console.error(error.userMessage)
}
```

#### resetPassword(token: string, newPassword: string): Promise<void>

Reset password using token from email.

**Parameters:**
- `token`: Reset token from email
- `newPassword`: New password to set

**Features:**
- Password strength validation
- Token validation and expiration handling
- Automatic session invalidation after reset

**Example:**
```typescript
try {
  await authService.resetPassword(resetToken, 'newSecurePassword123')
  console.log('Password reset successfully')
  // User needs to sign in with new password
} catch (error) {
  console.error(error.userMessage)
}
```

#### resendVerificationEmail(email: string): Promise<void>

Resend email verification to user.

**Parameters:**
- `email`: Email address to send verification to

**Example:**
```typescript
try {
  await authService.resendVerificationEmail('user@example.com')
  console.log('Verification email sent')
} catch (error) {
  console.error(error.userMessage)
}
```

#### verifyEmail(token: string): Promise<void>

Complete email verification process.

**Parameters:**
- `token`: Verification token from email

**Features:**
- Token validation
- Profile creation for verified users
- Role-based activation (buyers: immediate, sellers: pending admin approval)

**Example:**
```typescript
try {
  await authService.verifyEmail(verificationToken)
  console.log('Email verified successfully')
} catch (error) {
  console.error(error.userMessage)
}
```

## SessionManager

The `SessionManager` class handles session lifecycle and token management.

### Methods

#### getSession(): Promise<Session | null>

Get the current session.

**Returns:** Current session or `null` if no valid session

#### refreshSession(): Promise<Session>

Manually refresh the current session.

**Returns:** Refreshed session

**Throws:** AuthError if refresh fails

#### clearSession(): Promise<void>

Clear the current session and revoke tokens.

#### isSessionValid(session?: Session): boolean

Check if a session is valid (not expired).

**Parameters:**
- `session` (optional): Session to check, defaults to current session

**Returns:** `true` if session is valid

#### setupAutoRefresh(session: Session): void

Set up automatic token refresh for a session.

**Parameters:**
- `session`: Session to set up auto-refresh for

**Features:**
- Refreshes tokens 5 minutes before expiration
- Handles refresh failures with retry logic
- Runs in background without user intervention

#### persistSessionToCookies(session: Session): void

Persist session data to secure cookies.

**Parameters:**
- `session`: Session to persist

**Features:**
- HttpOnly cookies for security
- Secure flag in production
- SameSite protection against CSRF
- Appropriate expiration times

#### restoreSessionFromCookies(): Promise<Session | null>

Restore session from cookies on app initialization.

**Returns:** Restored session or `null` if no valid session in cookies

## ErrorHandler

The `ErrorHandler` class provides consistent error handling across the authentication system.

### Methods

#### parseAuthError(error: unknown): AuthError

Parse various error types into structured AuthError format.

**Parameters:**
- `error`: Any error object or value

**Returns:** Structured AuthError object

**Features:**
- Handles Supabase errors
- Handles network errors
- Handles generic JavaScript errors
- Provides consistent error structure

#### getUserMessage(error: AuthError): string

Generate user-friendly error message.

**Parameters:**
- `error`: AuthError to generate message for

**Returns:** User-friendly error message

#### isRetryable(error: AuthError): boolean

Determine if an error can be retried.

**Parameters:**
- `error`: AuthError to check

**Returns:** `true` if error is retryable

#### logError(error: AuthError, context: string): void

Log error for debugging purposes.

**Parameters:**
- `error`: AuthError to log
- `context`: Context where error occurred

**Features:**
- Console logging in development
- Structured logging format
- Timestamp and context information

## ProfileSyncService

The `ProfileSyncService` class manages user profile creation and synchronization.

### Methods

#### createProfile(authUser: AuthUser, metadata: UserMetadata): Promise<User>

Create a new user profile in the database.

**Parameters:**
- `authUser`: Supabase auth user object
- `metadata`: User metadata (name, role)

**Returns:** Created user profile

#### syncProfile(userId: string): Promise<User>

Synchronize user profile with auth metadata.

**Parameters:**
- `userId`: User ID to synchronize

**Returns:** Synchronized user profile

#### getProfile(userId: string): Promise<User | null>

Get user profile from database.

**Parameters:**
- `userId`: User ID to fetch

**Returns:** User profile or `null` if not found

#### updateProfile(userId: string, updates: Partial<User>): Promise<User>

Update user profile in database.

**Parameters:**
- `userId`: User ID to update
- `updates`: Partial user data to update

**Returns:** Updated user profile

#### retryProfileCreation(authUser: AuthUser, metadata: UserMetadata): Promise<User>

Create profile with retry logic and race condition handling.

**Parameters:**
- `authUser`: Supabase auth user object
- `metadata`: User metadata (name, role)

**Returns:** Created user profile

**Features:**
- Exponential backoff retry logic
- Race condition handling
- Idempotency checks

## Auth Context

The Auth Context provides authentication state and methods to React components.

### Provider Setup

```typescript
import { AuthProvider } from '@/lib/auth-context'

function App() {
  return (
    <AuthProvider>
      {/* Your app components */}
    </AuthProvider>
  )
}
```

### Hook Usage

```typescript
import { useAuth } from '@/lib/auth-context'

function MyComponent() {
  const {
    user,
    loading,
    initializing,
    isAuthenticated,
    signUp,
    signIn,
    signOut,
    error,
    requestPasswordReset,
    resetPassword,
    resendVerificationEmail,
    updateProfile,
    refreshUser
  } = useAuth()
  
  // Component logic
}
```

### Context Properties

| Property | Type | Description |
|----------|------|-------------|
| `user` | `User \| null` | Current authenticated user |
| `loading` | `boolean` | True during auth operations |
| `initializing` | `boolean` | True during initial session restoration |
| `isAuthenticated` | `boolean` | True if user is authenticated |
| `error` | `AuthError \| null` | Current error state |

### Context Methods

All methods from AuthService are available through the context with the same signatures and behavior.

## Protected Route Component

The `ProtectedRoute` component provides role-based access control.

### Props

```typescript
interface ProtectedRouteProps {
  children: ReactNode
  requiredRole?: UserRole
  fallback?: ReactNode
  redirectTo?: string
}
```

### Usage Examples

```typescript
// Basic authentication required
<ProtectedRoute>
  <Dashboard />
</ProtectedRoute>

// Role-based access
<ProtectedRoute requiredRole="admin">
  <AdminPanel />
</ProtectedRoute>

// Custom fallback and redirect
<ProtectedRoute
  requiredRole="seller"
  fallback={<AccessDenied />}
  redirectTo="/custom-login"
>
  <SellerDashboard />
</ProtectedRoute>
```

## Types and Interfaces

### User

```typescript
interface User {
  id: string
  email: string
  name: string
  role: UserRole
  phone?: string
  verification_status: 'pending' | 'verified' | 'rejected'
  created_at: string
  updated_at: string
}
```

### UserRole

```typescript
type UserRole = 'buyer' | 'seller' | 'admin'
```

### AuthError

```typescript
interface AuthError {
  name?: string
  code: AuthErrorCode
  message: string
  userMessage: string
  retryable: boolean
  retryAfter?: number
  metadata?: Record<string, any>
}
```

### Session

```typescript
interface Session {
  access_token: string
  refresh_token: string
  expires_at: number
  user: AuthUser
}
```

## Error Codes

### Authentication Errors
- `INVALID_CREDENTIALS`: Wrong email/password
- `EMAIL_NOT_VERIFIED`: Email needs verification
- `ACCOUNT_LOCKED`: Account temporarily locked

### Network Errors
- `NETWORK_ERROR`: Connection problem
- `SERVICE_UNAVAILABLE`: Service temporarily unavailable

### Rate Limiting
- `RATE_LIMIT_EXCEEDED`: Too many attempts
- `SIGNUP_COOLDOWN`: Signup cooldown active

### Validation Errors
- `INVALID_EMAIL`: Invalid email format
- `WEAK_PASSWORD`: Password doesn't meet requirements
- `MISSING_FIELDS`: Required fields missing

### Session Errors
- `SESSION_EXPIRED`: Session has expired
- `TOKEN_REFRESH_FAILED`: Token refresh failed
- `INVALID_TOKEN`: Invalid authentication token

### Profile Errors
- `PROFILE_CREATION_FAILED`: Profile creation failed
- `PROFILE_UPDATE_FAILED`: Profile update failed
- `DATABASE_ERROR`: Database operation failed

### Password Reset Errors
- `INVALID_RESET_TOKEN`: Invalid or expired reset token
- `RESET_TOKEN_EXPIRED`: Reset token has expired

### Email Verification Errors
- `INVALID_VERIFICATION_TOKEN`: Invalid verification token
- `VERIFICATION_TOKEN_EXPIRED`: Verification token expired

### Generic Errors
- `UNKNOWN_ERROR`: Unexpected error occurred
- `INTERNAL_ERROR`: Internal server error

## Migration Guide

### From Old Auth System

If migrating from a previous authentication implementation:

1. **Replace direct Supabase calls:**
   ```typescript
   // Old
   const { data, error } = await supabase.auth.signUp(...)
   
   // New
   const result = await authService.signUp(...)
   ```

2. **Update error handling:**
   ```typescript
   // Old
   if (error) {
     console.error(error.message)
   }
   
   // New
   if (!result.success) {
     console.error(result.error?.userMessage)
   }
   ```

3. **Use Auth Context instead of direct service calls:**
   ```typescript
   // Old
   import { authService } from '@/lib/auth/auth-service'
   
   // New
   import { useAuth } from '@/lib/auth-context'
   const { signIn } = useAuth()
   ```

4. **Replace custom protected route logic:**
   ```typescript
   // Old
   if (!user) {
     router.push('/login')
     return null
   }
   
   // New
   <ProtectedRoute>
     <YourComponent />
   </ProtectedRoute>
   ```

### Breaking Changes

- All authentication methods now return structured result objects instead of throwing errors
- Error messages are now user-friendly by default
- Session management is handled automatically
- Profile creation is integrated into the signup flow

### Compatibility

The new system is designed to be backward compatible with existing Supabase auth data. Existing users can sign in without issues, and their profiles will be created automatically if missing.

## Best Practices

1. **Always use the Auth Context in React components** instead of calling services directly
2. **Handle both success and error cases** in authentication operations
3. **Use ProtectedRoute for access control** instead of manual checks
4. **Display user-friendly error messages** using `error.userMessage`
5. **Implement loading states** during authentication operations
6. **Check `initializing` state** before rendering auth-dependent content
7. **Use TypeScript** for better type safety and developer experience

## Support

For additional help:
- Check the [Authentication Guide](./AUTHENTICATION_GUIDE.md) for usage examples
- Review the inline code documentation (JSDoc comments)
- Check browser console for detailed error logs in development
- Refer to [Supabase Auth documentation](https://supabase.com/docs/guides/auth) for underlying concepts