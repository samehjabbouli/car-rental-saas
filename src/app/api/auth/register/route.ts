import { createClient } from '@/lib/supabase/client'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    let email: string, password: string, fullName: string, companyName: string, phone: string;

    // Handle both form data and JSON
    const contentType = request.headers.get('content-type') || '';
    
    if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      email = formData.get('email') as string
      password = formData.get('password') as string
      fullName = formData.get('full_name') as string
      companyName = formData.get('company_name') as string
      phone = formData.get('phone') as string
    } else {
      const body = await request.json()
      email = body.email
      password = body.password
      fullName = body.full_name
      companyName = body.company_name
      phone = body.phone
    }

    if (!email || !password) {
      return NextResponse.json(
        { error: 'البريد وكلمة المرور مطلوبان' },
        { status: 400 }
      )
    }

    const supabase = createClient()
    
    // Sign up
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          company_name: companyName,
          phone: phone,
        }
      }
    })

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      )
    }

    // If signup successful but needs email confirmation
    if (authData.user && !authData.session) {
      return NextResponse.json(
        { success: true, message: 'تم إنشاء الحساب، يرجى تأكيد البريد الإلكتروني' },
        { status: 200 }
      )
    }

    // If we have a session, create company and user record
    if (authData.user && authData.session) {
      // Create company
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .insert({
          name: companyName || 'شركتي',
          email: email,
          phone: phone,
          status: 'trial',
          subscription_plan: 'starter',
          max_vehicles: 10,
          max_users: 5,
        })
        .select()
        .single()

      if (companyError) {
        console.error('Company creation error:', companyError)
      }

      // Create user record
      if (companyData) {
        await supabase.from('users').insert({
          id: authData.user.id,
          email: email,
          full_name: fullName || 'مستخدم',
          phone: phone,
          role: 'company_owner',
          company_id: companyData.id,
          is_active: true,
          is_verified: true,
        })
      }

      return NextResponse.json(
        { success: true, redirect: '/company' },
        { status: 200 }
      )
    }

    return NextResponse.json(
      { success: true, message: 'تم إنشاء الحساب' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في الخادم' },
      { status: 500 }
    )
  }
}