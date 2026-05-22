import { createClient } from '@/lib/supabase/client'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    let email: string, password: string;

    const contentType = request.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      const body = await request.json()
      email = body.email
      password = body.password
    } else {
      const formData = await request.formData()
      email = formData.get('email') as string
      password = formData.get('password') as string
    }
    
    if (!email || !password) {
      return NextResponse.json(
        { error: 'البريد وكلمة المرور مطلوبان' },
        { status: 400 }
      )
    }

    const supabase = createClient()
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }

    // Check user role and redirect
    if (data.user) {
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single()
      
      const redirectUrl = profile?.role === 'super_admin' ? '/super-admin' : '/company'
      
      return NextResponse.json(
        { success: true, redirect: redirectUrl },
        { status: 200 }
      )
    }

    return NextResponse.json(
      { error: 'خطأ غير متوقع' },
      { status: 500 }
    )
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في الخادم' },
      { status: 500 }
    )
  }
}