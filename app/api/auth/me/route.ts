import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getAllowedBotsForRoles } from '@/config/roles'

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('auth_session')?.value

    if (!sessionCookie) {
      return NextResponse.json({ authenticated: false, user: null })
    }

    let payload: any = null
    try {
      const decoded = Buffer.from(sessionCookie, 'base64url').toString('utf-8')
      payload = JSON.parse(decoded)
    }
    catch {
      return NextResponse.json({ authenticated: false, user: null })
    }

    if (!payload || !payload.id) {
      return NextResponse.json({ authenticated: false, user: null })
    }

    // Asegurar que los bots permitidos siempre se sincronicen con la configuración actual de roles
    const currentAllowedBots = getAllowedBotsForRoles(payload.roles || [payload.role])
    const botsChanged = JSON.stringify(payload.allowed_bots) !== JSON.stringify(currentAllowedBots)
    payload.allowed_bots = currentAllowedBots

    const response = NextResponse.json({
      authenticated: true,
      user: payload,
    })

    // Si la lista de bots cambió (por ejemplo, se añadió DENOVA), actualizamos la cookie de sesión
    if (botsChanged) {
      const token = Buffer.from(JSON.stringify(payload)).toString('base64url')
      const maxAge = 30 * 24 * 60 * 60
      response.cookies.set('auth_session', token, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge,
      })
    }

    return response
  }
  catch (error: any) {
    return NextResponse.json(
      { authenticated: false, user: null, error: error.message },
      { status: 500 },
    )
  }
}
