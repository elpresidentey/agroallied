# Authentication Guide

This guide provides comprehensive documentation for the AgroLink Farms authentication system, including the new Auth Context API, Protected Route usage, and common patterns.

## Table of Contents

- [Overview](#overview)
- [Auth Context API](#auth-context-api)
- [Protected Routes](#protected-routes)
- [Authentication Flow](#authentication-flow)
- [Error Handling](#error-handling)
- [Session Management](#session-management)
- [Common Use Cases](#common-use-cases)
- [Troubleshooting](#troubleshooting)

## Overview

The AgroLink Farms authentication system is built on top of Supabase Auth and provides:

- **Secure session management** with automatic token refresh
- **Role-based access control** (buyer, seller, admin)
- **Email verification** flow
- **Password reset** functionality
- **Protected routes** with customizable access control
- **Consistent error handling** with user-friendly messages
- **Session persistence** across page refreshes

## Auth Context API

The `AuthProvider` component provides authentication state and methods throughout your application.

### Basic Setup

```tsx
import { AuthProvider } from '@/lib/auth-context'

function App() {
  return (
    <AuthProvider>
      {/* Your app components */}
    </AuthProvider>
  )
}
```

### Using the Auth Hook

```tsx
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
    error
  } = useAuth()

  if (initializing) {
    return <div>Loading...</div>
  }

  if (isAuthenticated) {
    return <div>Welcome, {user.name}!</div>
  }

  return <div>Please sign in</div>
}
```

### Auth Context Properties

| Property | Type | Description |
|----------|------|-------------|
| `user` | `User \| null` | Current authenticated user or null |
| `loading` | `boolean` | True during auth operations (sign in, sign up, etc.) |
| `initializing` | `boolean` | True during initial session restoration |
| `isAuthenticated` | `boolean` | True if user is authenticated |
| `error` | `AuthError \| null` | Current error state or null |

### Auth Context Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `signUp` | `(email, password, name, role) => Promise<SignUpResult>` | Register new user |
| `signIn` | `(email, password) => Promise<SignInResult>` | Sign in existing user |
| `signOut` | `() => Promise<void>` | Sign out current user |
| `requestPasswordReset` | `(email) => Promise<void>` | Send password reset email |
| `resetPassword` | `(token, newPassword) => Promise<void>` | Reset password with token |
| `resendVerificationEmail` | `(email) => Promise<void>` | Resend verification email |
| `updateProfile` | `(updates) => Promise<User>` | Update user profile |
| `refreshUser` | `() => Promise<void>` | Refresh user data |

## Protected Routes

Use the `ProtectedRoute` component to restrict access to authenticated users or specific roles.

### Basic Protection

```tsx
import { ProtectedRoute } from '@/components/auth/protected-route'

function Dashboard() {
  return (
    <ProtectedRoute>
      <div>Protected dashboard content</div>
    </ProtectedRoute>
  )
}
```

### Role-Based Protection

```tsx
function AdminPanel() {
  return (
    <ProtectedRoute requiredRole="admin">
      <div>Admin-only content</div>
    </ProtectedRoute>
  )
}

function SellerDashboard() {
  return (
    <ProtectedRoute requiredRole="seller">
      <div>Seller dashboard</div>
    </ProtectedRoute>
  )
}
```

### Custom Fallback and Redirect

```tsx
function ProtectedPage() {
  return (
    <ProtectedRoute
      requiredRole="buyer"
      redirectTo="/custom-login"
      fallback={<div>Access denied</div>}
    >
      <div>Buyer-only content</div>
    </ProtectedRoute>
  )
}
```

### ProtectedRoute Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactNode` | - | Content to render when access is granted |
| `requiredRole` | `'buyer' \| 'seller' \| 'admin'` | - | Required user role (optional) |
| `fallback` | `ReactNode` | Loading spinner | Content to show while checking auth |
| `redirectTo` | `string` | `/login` | Redirect path for unauthenticated users |

## Authentication Flow

### Sign Up Flow

1. User submits sign up form
2. System validates input and checks rate limits
3. Supabase creates auth user and sends verification email
4. User clicks verification link
5. System creates user profile in database
6. User is redirected to appropriate dashboard

```tsx
const handleSignUp = async (formData) => {
  const { email, password, name, role } = formData
  
  const result = await signUp(email, password, name, role)
  
  if (result.success) {
    if (result.needsVerification) {
      // Show verification message
      setMessage('Please check your email to verify your account')
    } else {
      // User is signed in
      router.push('/dashboard')
    }
  } else {
    // Handle error
    setError(result.error.userMessage)
  }
}
```

### Sign In Flow

1. User submits credentials
2. System validates with Supabase
3. On success, user profile is loaded
4. User is redirected to role-appropriate dashboard

```tsx
const handleSignIn = async (email, password) => {
  const result = await signIn(email, password)
  
  if (result.success) {
    // Redirect based on user role
    const redirectPath = user.role === 'admin' ? '/admin' 
      : user.role === 'seller' ? '/seller/dashboard'
      : '/buyer/dashboard'
    router.push(redirectPath)
  } else {
    setError(result.error.userMessage)
  }
}
```

### Password Reset Flow

1. User requests password reset
2. System sends reset email
3. User clicks reset link
4. User enters new password
5. System updates password and invalidates all sessions

```tsx
const handlePasswordReset = async (email) => {
  try {
    await requestPasswordReset(email)
    setMessage('Password reset email sent')
  } catch (error) {
    setError(error.userMessage)
  }
}

const handlePasswordUpdate = async (token, newPassword) => {
  try {
    await resetPassword(token, newPassword)
    setMessage('Password updated successfully')
    router.push('/login')
  } catch (error) {
    setError(error.userMessage)
  }
}
```

## Error Handling

The authentication system provides consistent error handling with user-friendly messages.

### Error Types

```tsx
interface AuthError {
  code: string
  message: string        // Technical message for debugging
  userMessage: string    // User-friendly message
  retryable: boolean     // Whether the operation can be retried
  retryAfter?: number    // Milliseconds to wait before retry
}
```

### Common Error Codes

| Code | Description | User Action |
|------|-------------|-------------|
| `invalid_credentials` | Wrong email/password | Check credentials |
| `email_not_verified` | Email needs verification | Check email for verification link |
| `rate_limit_exceeded` | Too many attempts | Wait before retrying |
| `network_error` | Connection issue | Check internet connection |
| `session_expired` | Session timed out | Sign in again |

### Error Handling Pattern

```tsx
const { error } = useAuth()

useEffect(() => {
  if (error) {
    // Show user-friendly message
    toast.error(error.userMessage)
    
    // Log technical details for debugging
    console.error('Auth error:', error.code, error.message)
    
    // Handle retryable errors
    if (error.retryable && error.retryAfter) {
      setTimeout(() => {
        // Enable retry button
        setCanRetry(true)
      }, error.retryAfter)
    }
  }
}, [error])
```

## Session Management

The system automatically handles session management including token refresh and persistence.

### Automatic Token Refresh

- Tokens are automatically refreshed 5 minutes before expiration
- Failed refresh attempts trigger re-authentication
- Refresh happens in the background without user intervention

### Session Persistence

- Sessions persist across page refreshes
- Secure cookies are used for server-side access
- Sessions are restored on app initialization

### Manual Session Operations

```tsx
const { refreshUser } = useAuth()

// Manually refresh user data
const handleRefreshProfile = async () => {
  await refreshUser()
}

// Check authentication status
const { isAuthenticated, user } = useAuth()

if (isAuthenticated) {
  console.log('User is signed in:', user.email)
} else {
  console.log('User is not authenticated')
}
```

## Common Use Cases

### Conditional Rendering Based on Auth State

```tsx
function Navigation() {
  const { isAuthenticated, user, signOut } = useAuth()
  
  return (
    <nav>
      {isAuthenticated ? (
        <>
          <span>Welcome, {user.name}</span>
          <button onClick={signOut}>Sign Out</button>
        </>
      ) : (
        <>
          <Link href="/login">Sign In</Link>
          <Link href="/signup">Sign Up</Link>
        </>
      )}
    </nav>
  )
}
```

### Role-Based UI Elements

```tsx
function Dashboard() {
  const { user } = useAuth()
  
  return (
    <div>
      <h1>Dashboard</h1>
      
      {user.role === 'admin' && (
        <AdminPanel />
      )}
      
      {user.role === 'seller' && (
        <SellerTools />
      )}
      
      {user.role === 'buyer' && (
        <BuyerInterface />
      )}
    </div>
  )
}
```

### Loading States

```tsx
function MyComponent() {
  const { loading, initializing } = useAuth()
  
  if (initializing) {
    return <div>Initializing app...</div>
  }
  
  return (
    <div>
      <button disabled={loading}>
        {loading ? 'Processing...' : 'Submit'}
      </button>
    </div>
  )
}
```

### Form Validation with Auth

```tsx
function SignUpForm() {
  const { signUp, loading, error } = useAuth()
  const [formData, setFormData] = useState({})
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const result = await signUp(
      formData.email,
      formData.password,
      formData.name,
      formData.role
    )
    
    if (result.success) {
      // Handle success
    }
    // Error is automatically available in error state
  }
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      {error && (
        <div className="error">{error.userMessage}</div>
      )}
      <button type="submit" disabled={loading}>
        {loading ? 'Creating Account...' : 'Sign Up'}
      </button>
    </form>
  )
}
```

## Troubleshooting

### Common Issues

#### "User not authenticated" errors
- Check if `AuthProvider` wraps your app
- Verify session hasn't expired
- Check browser console for auth errors

#### Protected routes not working
- Ensure `ProtectedRoute` component is used correctly
- Verify user has required role
- Check if user is properly authenticated

#### Email verification not working
- Check spam folder for verification emails
- Verify Supabase email settings
- Ensure callback URL is configured correctly

#### Session not persisting
- Check if cookies are enabled
- Verify secure cookie settings in production
- Check for JavaScript errors during initialization

### Debug Mode

Enable debug logging by setting environment variable:

```bash
NEXT_PUBLIC_AUTH_DEBUG=true
```

This will log detailed authentication events to the browser console.

### Getting Help

1. Check browser console for error messages
2. Verify network requests in DevTools
3. Check Supabase dashboard for auth logs
4. Review this documentation for common patterns

For additional support, refer to the [Supabase Auth documentation](https://supabase.com/docs/guides/auth) or create an issue in the project repository.