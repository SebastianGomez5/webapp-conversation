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

    // Asegurar que los bots permitidos estén actualizados
    if (!payload.allowed_bots || payload.allowed_bots.length === 0) {
      payload.allowed_bots = getAllowedBotsForRoles(payload.roles || [payload.role])
    }

    return NextResponse.json({
      authenticated: true,
      user: payload,
    })
  }
  catch (error: any) {
    return NextResponse.json(
      { authenticated: false, user: null, error: error.message },
      { status: 500 },
    )
  }
}
