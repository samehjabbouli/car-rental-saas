import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

const DEFAULT_URL = 'https://dyesocyzpmyzxasmgxat.supabase.co'
const DEFAULT_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5ZXNvY3l6cG15enhhc21neGF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0MTE2ODgsImV4cCI6MjA5NDk4NzY4OH0.dYai4mJSAmuJL8It96eNVUxAGv25z8oQu0a2l-7Pnm8'

// More robust empty check - treat empty strings as missing
const getEnv = (key: string, fallback: string): string => {
  const val = process.env[key]
  return (val && val.length > 0 && val.trim().length > 0) ? val : fallback
}

const supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL', DEFAULT_URL)
const supabaseAnonKey = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', DEFAULT_KEY)

export const createClient = async () => {
  const cookieStore = await cookies()

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // Handle cookie setting error
        }
      },
    },
  })
}