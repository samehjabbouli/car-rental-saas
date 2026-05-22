import { createClient } from '@/lib/supabase/client'
import { NextResponse } from 'next/server'

// Create a test user with confirmed email
export async function POST() {
  try {
    const supabase = createClient()
    
    // Use admin API to create user directly with confirmed email
    const adminUrl = process.env.NEXT_PUBLIC_SUPABASE_URL + '/auth/v1/admin/users'
    const adminKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    const response = await fetch(adminUrl, {
      method: 'POST',
      headers: new Headers({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminKey}`,
        'apikey': adminKey,
      }),
      body: JSON.stringify({
        email: 'admin@rental.com',
        password: 'Admin123!',
        email_confirm: true,
        user_metadata: {
          full_name: 'مدير النظام',
          company_name: 'شركة التأجير',
        }
      })
    })

    const data = await response.json()

    return NextResponse.json({
      success: true,
      user: data,
      credentials: {
        email: 'admin@rental.com',
        password: 'Admin123!'
      }
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
}