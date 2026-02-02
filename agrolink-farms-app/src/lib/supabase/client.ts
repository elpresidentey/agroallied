/**
 * Supabase client factory functions and cookie configuration
 * 
 * This module provides factory functions for creating Supabase clients
 * optimized for different Next.js contexts (browser, server, API routes, middleware).
 * Each client is configured with appropriate session management and security settings.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import type { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies'

/**
 * Cookie configuration options for Supabase session management
 */
export interface CookieOptions {
  /** Cookie name */
  name?: string
  /** Cookie domain */
  domain?: string
  /** Maximum age in seconds */
  maxAge?: number
  /** Cookie path */
  path?: string
  /** SameSite attribute for CSRF protection */
  sameSite?: 'lax' | 'strict' | 'none'
  /** Secure flag (HTTPS only) */
  secure?: boolean
  /** HttpOnly flag (prevents JavaScript access) */
  httpOnly?: boolean
}

/**
 * Secure cookie configuration constants
 * 
 * Defines security settings for different types of authentication cookies:
 * - SESSION: General session cookies (7 days)
 * - REFRESH_TOKEN: Long-lived refresh tokens (30 days, most secure)
 * - ACCESS_TOKEN: Short-lived access tokens (1 hour)
 * 
 * All cookies use:
 * - HttpOnly flag to prevent XSS attacks
 * - Secure flag in production (HTTPS only)
 * - SameSite=lax for CSRF protection
 */
export const COOKIE_CONFIG = {
  // Session cookie settings
  SESSION: {
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true
  },
  // Refresh token cookie settings (more secure)
  REFRESH_TOKEN: {
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true
  },
  // Access token cookie settings (shorter lived)
  ACCESS_TOKEN: {
    maxAge: 60 * 60, // 1 hour
    path: '/',
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true
  }
} as const

/**
 * Configuration interface for Supabase client cookie handling
 */
export interface SupabaseClientConfig {
  /** Cookie management functions */
  cookies?: {
    /** Get cookie value by name */
    get: (name: string) => string | undefined
    /** Set cookie with options */
    set: (name: string, value: string, options?: CookieOptions) => void
    /** Remove cookie */
    remove: (name: string, options?: CookieOptions) => void
  }
}

/**
 * Validate and retrieve Supabase configuration from environment variables
 * 
 * @throws Error if required environment variables are missing
 * @returns Supabase URL and anonymous key
 */
function getSupabaseConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    // In development, provide helpful error message
    if (process.env.NODE_ENV === 'development') {
      console.error('🚨 Supabase Configuration Missing!')
      console.error('Please create a .env.local file with your Supabase credentials:')
      console.error('NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co')
      console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here')
      console.error('')
      console.error('Get these values from: https://supabase.com/dashboard > Settings > API')
      
      // Return dummy values for development to prevent crashes
      return {
        supabaseUrl: 'https://dummy.supabase.co',
        supabaseAnonKey: 'dummy-key-for-development'
      }
    }
    
    throw new Error('Missing Supabase environment variables')
  }

  return { supabaseUrl, supabaseAnonKey }
}

// Browser client - singleton with automatic session management
let browserClient: SupabaseClient | null = null

/**
 * Create a Supabase client for browser/client-side usage
 * 
 * This client is optimized for browser environments with:
 * - Automatic session management and token refresh
 * - localStorage persistence for sessions
 * - URL-based session detection (for auth callbacks)
 * - PKCE flow for enhanced security
 * 
 * Uses singleton pattern to ensure only one browser client exists.
 * 
 * @returns Configured Supabase client for browser use
 * 
 * @example
 * const supabase = createBrowserClient()
 * const { data, error } = await supabase.auth.signInWithPassword({
 *   email: 'user@example.com',
 *   password: 'password'
 * })
 */
export function createBrowserClient(): SupabaseClient {
  if (browserClient) {
    return browserClient
  }

  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig()

  browserClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      // Configure automatic session management
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      // Use localStorage for session persistence in browser
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      storageKey: 'supabase.auth.token',
      flowType: 'pkce'
    },
    global: {
      headers: {
        'X-Client-Info': 'agrolink-farms-browser'
      }
    }
  })

  return browserClient
}

/**
 * Create a Supabase client for Server Components
 * 
 * This client is optimized for Next.js Server Components with:
 * - Cookie-based session reading (no writing capability)
 * - No automatic token refresh (server-side)
 * - No session persistence (stateless)
 * - Read-only access to authentication state
 * 
 * @param cookieStore - Next.js cookie store from Server Component
 * @returns Configured Supabase client for server use
 * 
 * @example
 * import { cookies } from 'next/headers'
 * 
 * export default async function ServerComponent() {
 *   const supabase = createServerClient(cookies())
 *   const { data: { user } } = await supabase.auth.getUser()
 *   
 *   return <div>User: {user?.email}</div>
 * }
 */
export function createServerClient(cookieStore: ReadonlyRequestCookies): SupabaseClient {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig()

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      // Configure cookie-based session management for Server Components
      autoRefreshToken: false, // Server doesn't need auto-refresh
      persistSession: false, // Server doesn't persist sessions
      detectSessionInUrl: false, // Server doesn't handle URL detection
      flowType: 'pkce',
      storage: {
        getItem: (key: string) => {
          const cookie = cookieStore.get(key)
          return cookie?.value || null
        },
        setItem: (key: string, value: string) => {
          // Server Components can't set cookies directly
          // This will be handled by middleware or API routes
        },
        removeItem: (key: string) => {
          // Server Components can't remove cookies directly
          // This will be handled by middleware or API routes
        }
      }
    },
    global: {
      headers: {
        'X-Client-Info': 'agrolink-farms-server'
      }
    }
  })
}

/**
 * Create a Supabase client for API routes
 * 
 * This client is optimized for Next.js API routes with:
 * - Cookie-based session management (read and write)
 * - Secure cookie settings based on token type
 * - Session persistence via HTTP cookies
 * - Request/response cookie handling
 * 
 * @param request - HTTP request object
 * @param response - HTTP response object or Next.js response with cookies
 * @returns Configured Supabase client for API routes
 * 
 * @example
 * export async function POST(request: Request) {
 *   const response = new Response()
 *   const supabase = createApiClient(request, response)
 *   
 *   const { data, error } = await supabase.auth.signInWithPassword({
 *     email: 'user@example.com',
 *     password: 'password'
 *   })
 *   
 *   return response
 * }
 */
export function createApiClient(
  request: Request,
  response: Response | { cookies: { set: Function, delete: Function } }
): SupabaseClient {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig()

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      // Configure cookie-based session management for API routes
      autoRefreshToken: false, // API routes don't auto-refresh
      persistSession: true, // API routes can persist sessions via cookies
      detectSessionInUrl: false, // API routes don't handle URL detection
      flowType: 'pkce',
      storage: {
        getItem: (key: string) => {
          // Extract cookies from request headers
          const cookieHeader = request.headers.get('cookie')
          if (!cookieHeader) return null
          
          const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
            const [name, value] = cookie.trim().split('=')
            acc[name] = value
            return acc
          }, {} as Record<string, string>)
          
          return cookies[key] || null
        },
        setItem: (key: string, value: string, options?: CookieOptions) => {
          // Determine cookie type and apply appropriate security settings
          let cookieConfig = COOKIE_CONFIG.SESSION
          
          if (key.includes('refresh')) {
            cookieConfig = COOKIE_CONFIG.REFRESH_TOKEN
          } else if (key.includes('access')) {
            cookieConfig = COOKIE_CONFIG.ACCESS_TOKEN
          }
          
          // Set cookie with secure settings
          const cookieOptions = {
            path: options?.path || cookieConfig.path,
            maxAge: options?.maxAge || cookieConfig.maxAge,
            sameSite: options?.sameSite || cookieConfig.sameSite,
            secure: options?.secure ?? cookieConfig.secure,
            httpOnly: options?.httpOnly ?? cookieConfig.httpOnly
          }
          
          if ('cookies' in response && response.cookies.set) {
            response.cookies.set(key, value, cookieOptions)
          }
        },
        removeItem: (key: string, options?: CookieOptions) => {
          // Remove cookie with secure settings
          const cookieOptions = {
            path: options?.path || COOKIE_CONFIG.SESSION.path,
            maxAge: 0,
            sameSite: options?.sameSite || COOKIE_CONFIG.SESSION.sameSite,
            secure: options?.secure ?? COOKIE_CONFIG.SESSION.secure,
            httpOnly: options?.httpOnly ?? COOKIE_CONFIG.SESSION.httpOnly
          }
          
          if ('cookies' in response && response.cookies.delete) {
            response.cookies.delete(key, cookieOptions)
          }
        }
      }
    },
    global: {
      headers: {
        'X-Client-Info': 'agrolink-farms-api'
      }
    }
  })
}

/**
 * Create a Supabase client for Next.js middleware
 * 
 * This client is optimized for middleware with:
 * - Cookie reading from request
 * - Cookie writing to response
 * - Secure cookie configuration
 * - Session validation for route protection
 * 
 * @param request - Next.js middleware request
 * @param response - Next.js middleware response
 * @returns Configured Supabase client for middleware
 * 
 * @example
 * export async function middleware(request: NextRequest) {
 *   const response = NextResponse.next()
 *   const supabase = createMiddlewareClient(request, response)
 *   
 *   const { data: { user } } = await supabase.auth.getUser()
 *   
 *   if (!user && request.nextUrl.pathname.startsWith('/protected')) {
 *     return NextResponse.redirect(new URL('/login', request.url))
 *   }
 *   
 *   return response
 * }
 */
export function createMiddlewareClient(request: NextRequest, response: NextResponse): SupabaseClient {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig()

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      // Configure cookie reading and writing for middleware context
      autoRefreshToken: false, // Middleware doesn't auto-refresh
      persistSession: false, // Middleware doesn't persist sessions
      detectSessionInUrl: false, // Middleware doesn't handle URL detection
      flowType: 'pkce',
      storage: {
        getItem: (key: string) => {
          const cookie = request.cookies.get(key)
          return cookie?.value || null
        },
        setItem: (key: string, value: string, options?: CookieOptions) => {
          // Determine cookie type and apply appropriate security settings
          let cookieConfig = COOKIE_CONFIG.SESSION
          
          if (key.includes('refresh')) {
            cookieConfig = COOKIE_CONFIG.REFRESH_TOKEN
          } else if (key.includes('access')) {
            cookieConfig = COOKIE_CONFIG.ACCESS_TOKEN
          }
          
          // Set cookie in response for middleware with secure settings
          response.cookies.set(key, value, {
            path: options?.path || cookieConfig.path,
            maxAge: options?.maxAge || cookieConfig.maxAge,
            sameSite: options?.sameSite || cookieConfig.sameSite,
            secure: options?.secure ?? cookieConfig.secure,
            httpOnly: options?.httpOnly ?? cookieConfig.httpOnly
          })
        },
        removeItem: (key: string, options?: CookieOptions) => {
          // Remove cookie in response for middleware with secure settings
          response.cookies.set(key, '', {
            path: options?.path || COOKIE_CONFIG.SESSION.path,
            maxAge: 0,
            sameSite: options?.sameSite || COOKIE_CONFIG.SESSION.sameSite,
            secure: options?.secure ?? COOKIE_CONFIG.SESSION.secure,
            httpOnly: options?.httpOnly ?? COOKIE_CONFIG.SESSION.httpOnly
          })
        }
      }
    },
    global: {
      headers: {
        'X-Client-Info': 'agrolink-farms-middleware'
      }
    }
  })
}

/**
 * Get secure cookie options for different token types
 * 
 * Returns appropriate security settings based on the cookie type:
 * - session: General session cookies (7 days)
 * - refresh: Long-lived refresh tokens (30 days, most secure)
 * - access: Short-lived access tokens (1 hour)
 * 
 * @param cookieType - Type of cookie to get options for
 * @returns Cookie options with security settings
 * 
 * @example
 * const options = getSecureCookieOptions('refresh')
 * response.cookies.set('refresh-token', token, options)
 */
export function getSecureCookieOptions(cookieType: 'session' | 'refresh' | 'access' = 'session'): CookieOptions {
  switch (cookieType) {
    case 'refresh':
      return COOKIE_CONFIG.REFRESH_TOKEN
    case 'access':
      return COOKIE_CONFIG.ACCESS_TOKEN
    default:
      return COOKIE_CONFIG.SESSION
  }
}

/**
 * Check if the application is running in production environment
 * 
 * @returns True if NODE_ENV is 'production'
 */
export function isProductionEnvironment(): boolean {
  return process.env.NODE_ENV === 'production'
}

/**
 * Create a secure cookie string with proper formatting
 * 
 * Generates a cookie string with security attributes properly formatted
 * for use in HTTP headers or manual cookie setting.
 * 
 * @param name - Cookie name
 * @param value - Cookie value
 * @param options - Additional cookie options (merged with defaults)
 * @returns Formatted cookie string
 * 
 * @example
 * const cookieString = createSecureCookieString('session', 'token123', {
 *   maxAge: 3600,
 *   secure: true
 * })
 * // Returns: "session=token123; Path=/; Max-Age=3600; SameSite=lax; Secure; HttpOnly"
 */
export function createSecureCookieString(name: string, value: string, options?: Partial<CookieOptions>): string {
  const config = { ...COOKIE_CONFIG.SESSION, ...options }
  
  let cookieString = `${name}=${value}`
  
  if (config.path) cookieString += `; Path=${config.path}`
  if (config.maxAge) cookieString += `; Max-Age=${config.maxAge}`
  if (config.sameSite) cookieString += `; SameSite=${config.sameSite}`
  if (config.secure) cookieString += `; Secure`
  if (config.httpOnly) cookieString += `; HttpOnly`
  if (config.domain) cookieString += `; Domain=${config.domain}`
  
  return cookieString
}