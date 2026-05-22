import { createClient } from '@/lib/supabase/client'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { email, password, full_name, company_name, phone } = await request.json()
    
    if (!email || !password) {
      return NextResponse.json(
        { error: 'البريد وكلمة المرور مطلوبان' },
        { status: 400 }
      )
    }

    const supabase = createClient()
    
    // Sign up - Supabase will handle email confirmation if enabled
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name,
          company_name,
          phone,
        }
      }
    })

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      )
    }

    // Check if user needs email confirmation
    if (authData.user && !authData.session) {
      return NextResponse.json({
        success: true,
        message: 'تم إنشاء الحساب! يرجى تأكيد البريد الإلكتروني قبل تسجيل الدخول.',
        needsConfirmation: true,
        user: { id: authData.user.id, email: authData.user.email }
      })
    }

    // If we have a session, user is confirmed - create company and user record
    if (authData.user && authData.session) {
      // Create company
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .insert({
          name: company_name || 'شركتي',
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
          full_name: full_name || 'مستخدم',
          phone: phone,
          role: 'company_owner',
          company_id: companyData.id,
          is_active: true,
          is_verified: true,
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'تم إنشاء الحساب بنجاح - يمكنك تسجيل الدخول الآن'
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في الخادم' },
      { status: 500 }
    )
  }
}