import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@/lib/supabase/client'
import { AuthService } from '@/lib/auth/auth-service'
import { AuthErrorCode } from '@/lib/auth/types'
import { UserRole } from '@/types'

/**
 * Parameters extracted from callback URL
 */
interface CallbackParams {
  code?: string
  error?: string
  error_description?: string
  type?: string
}

/**
 * Auth callback handler for email verification and OAuth flows
 * Handles the callback after user clicks verification link or completes OAuth
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const cookieStore = cookies()
  
  try {
    // Extract callback parameters from URL
    const params = parseCallbackParams(url)
    
    // Handle error in callback
    if (params.error) {
      return handleCallbackError(params.error, params.error_description)
    }
    
    // Handle successful callback with code
    if (params.code) {
      return await handleCodeExchange(params.code, cookieStore)
    }
    
    // No code or error - invalid callback
    return handleCallbackError('invalid_request', 'Missing required parameters')
    
  } catch (error) {
    console.error('Callback handler error:', error)
    return handleCallbackError(
      'server_error', 
      'An unexpected error occurred during authentication'
    )
  }
}

/**
 * Extract and validate callback parameters from URL
 */
function parseCallbackParams(url: URL): CallbackParams {
  return {
    code: url.searchParams.get('code') || undefined,
    error: url.searchParams.get('error') || undefined,
    error_description: url.searchParams.get('error_description') || undefined,
    type: url.searchParams.get('type') || undefined
  }
}

/**
 * Handle callback error by redirecting to status page with error message
 */
function handleCallbackError(error: string, description?: string): NextResponse {
  const errorMessage = description || error || 'Authentication failed'
  const redirectUrl = new URL('/auth/callback/status', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000')
  redirectUrl.searchParams.set('error', errorMessage)
  
  return NextResponse.redirect(redirectUrl)
}

/**
 * Handle code exchange for session and determine redirect destination
 */
async function handleCodeExchange(code: string, cookieStore: any): Promise<NextResponse> {
  try {
    // Create server client for code exchange
    const supabase = createServerClient(cookieStore)
    
    // Exchange code for session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('Code exchange error:', error)
      return handleCallbackError('exchange_failed', error.message)
    }
    
    if (!data.session || !data.user) {
      return handleCallbackError('no_session', 'Failed to create session')
    }
    
    // Initialize auth service to handle post-verification logic
    const authService = new AuthService()
    
    try {
      // Handle email verification completion
      await authService.verifyEmail(code)
    } catch (verifyError) {
      // Log but don't fail - session was created successfully
      console.warn('Post-verification handling failed:', verifyError)
    }
    
    // Determine redirect URL based on user role
    const redirectUrl = await determineRedirectUrl(data.user, supabase)
    
    return NextResponse.redirect(redirectUrl)
    
  } catch (error) {
    console.error('Code exchange handler error:', error)
    return handleCallbackError('exchange_error', 'Failed to complete authentication')
  }
}

/**
 * Determine redirect destination based on user role and profile status
 * Handles race conditions where profile creation might be in progress
 */
async function determineRedirectUrl(user: any, supabase: any): Promise<string> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  
  try {
    // Fetch user profile with retry logic for race conditions
    const profile = await fetchUserProfileWithRetry(user.id, supabase)
    
    if (!profile) {
      console.warn('User profile not found after retries, redirecting to profile page')
      return `${baseUrl}/profile?message=profile_setup_needed`
    }
    
    const role = profile.role as UserRole
    const verificationStatus = profile.verification_status
    
    // Role-based redirect logic
    switch (role) {
      case 'buyer':
        // Buyers are active immediately after email verification
        return `${baseUrl}/buyer/dashboard`
        
      case 'seller':
        // Sellers need admin approval, redirect based on verification status
        if (verificationStatus === 'approved') {
          return `${baseUrl}/seller/dashboard`
        } else {
          // Pending approval - redirect to profile with message
          return `${baseUrl}/profile?message=verification_pending`
        }
        
      case 'admin':
        return `${baseUrl}/admin`
        
      default:
        // Unknown role - redirect to profile
        return `${baseUrl}/profile?message=role_setup_needed`
    }
    
  } catch (error) {
    console.error('Error determining redirect URL:', error)
    // Fallback to profile page
    return `${baseUrl}/profile?message=redirect_error`
  }
}

/**
 * Fetch user profile with retry logic to handle race conditions
 * Profile creation might be in progress when callback is processed
 */
async function fetchUserProfileWithRetry(userId: string, supabase: any, maxRetries: number = 3): Promise<any> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const { data: profile, error } = await supabase
        .from('users')
        .select('role, verification_status')
        .eq('id', userId)
        .single()
      
      if (error) {
        if (error.code === 'PGRST116') {
          // Profile not found - might be race condition
          if (attempt < maxRetries) {
            console.log(`Profile not found, retrying... (attempt ${attempt}/${maxRetries})`)
            // Wait with exponential backoff
            await new Promise(resolve => setTimeout(resolve, attempt * 500))
            continue
          }
        }
        throw error
      }
      
      return profile
      
    } catch (error) {
      if (attempt === maxRetries) {
        throw error
      }
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, attempt * 500))
    }
  }
  
  return null
}