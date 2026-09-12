import { NextResponse } from 'next/server'

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: 'Sesión cerrada correctamente.',
  })

  response.cookies.set('auth_session', '', {
    httpOnly: false,
    path: '/',
    maxAge: 0,
  })

  response.cookies.set('auth_user_id', '', {
    httpOnly: false,
    path: '/',
    maxAge: 0,
  })

  return response
}
