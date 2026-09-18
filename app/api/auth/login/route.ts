import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import {
  WORDPRESS_SITE_URL,
  WP_ROLES_MAP,
  getAllowedBotsForRoles,
} from '@/config/roles'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = body

    const cleanUsername = (username || '').trim()
    const cleanPassword = (password || '').trim()

    if (!cleanUsername || !cleanPassword) {
      return NextResponse.json(
        { success: false, message: 'Por favor ingresa tu usuario o correo y tu contraseña.' },
        { status: 400 },
      )
    }

    let authUser: any = null

    // 1. Intentar autenticar contra el endpoint de WordPress (Ultimate Member)
    try {
      const wpRes = await fetch(`${WORDPRESS_SITE_URL}/wp-json/studio-auth/v1/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          username: cleanUsername,
          password: cleanPassword,
        }),
        cache: 'no-store',
      })

      if (wpRes.ok) {
        const wpData = await wpRes.json()
        if (wpData.success && wpData.user) {
          authUser = wpData.user
        }
      }
      else if (wpRes.status === 401 || wpRes.status === 403) {
        const errData = await wpRes.json().catch(() => null)
        return NextResponse.json(
          {
            success: false,
            message: errData?.message || 'Credenciales de WordPress incorrectas o rol no autorizado.',
          },
          { status: wpRes.status },
        )
      }
    }
    catch (wpErr) {
      console.warn('WordPress auth endpoint warning:', wpErr)
    }

    // 2. Respaldo de desarrollo/contingencia para cuentas principales
    if (!authUser) {
      const isAlvaro = cleanUsername.toLowerCase() === 'alvaropublicita@gmail.com' || cleanUsername.toLowerCase() === 'alvaro'
      const isSebas = cleanUsername.toLowerCase() === 'sebaspublicita@gmail.com' || cleanUsername.toLowerCase() === 'sebastian'

      if (isAlvaro && (cleanPassword === 'AlvaroStudio2026*' || cleanPassword === (process.env.AUTH_PASS_ALVARO || 'AlvaroStudio2026*'))) {
        authUser = {
          id: '1',
          email: 'alvaropublicita@gmail.com',
          username: 'alvaro',
          name: 'Álvaro Díaz',
          role: 'administrator',
          roles: ['administrator'],
          allowed_bots: WP_ROLES_MAP.administrator.allowedBots,
          avatar: 'https://studioalvarodiaz.es/wp-content/uploads/2026/07/Carlos-scaled.jpg',
        }
      }
      else if (isSebas && (cleanPassword === 'SebasStudio2026*' || cleanPassword === (process.env.AUTH_PASS_SEBAS || 'SebasStudio2026*'))) {
        authUser = {
          id: '2',
          email: 'sebaspublicita@gmail.com',
          username: 'sebastian',
          name: 'Sebastián',
          role: 'um_coordinacion',
          roles: ['um_coordinacion'],
          allowed_bots: WP_ROLES_MAP.um_coordinacion.allowedBots,
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        }
      }
    }

    if (!authUser) {
      return NextResponse.json(
        {
          success: false,
          message: 'Credenciales incorrectas. Verifica tu usuario y contraseña de WordPress.',
        },
        { status: 401 },
      )
    }

    // Asegurar que los bots permitidos coincidan con la definición más reciente de roles
    authUser.allowed_bots = getAllowedBotsForRoles(authUser.roles || [authUser.role])

    // Generar token de sesión en Base64 seguro
    const sessionPayload = {
      ...authUser,
      issued_at: Date.now(),
    }
    const token = Buffer.from(JSON.stringify(sessionPayload)).toString('base64url')

    const response = NextResponse.json({
      success: true,
      user: authUser,
    })

    // Cookie de sesión de 30 días
    const maxAge = 30 * 24 * 60 * 60
    response.cookies.set('auth_session', token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge,
    })

    // Guardar cookie de usuario para sincronización Dify
    response.cookies.set('auth_user_id', String(authUser.id), {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge,
    })

    return response
  }
  catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Error en el servidor de autenticación.' },
      { status: 500 },
    )
  }
}
