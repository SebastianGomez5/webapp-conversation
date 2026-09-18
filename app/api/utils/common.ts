import type { NextRequest } from 'next/server'
import { ChatClient } from 'dify-client'
import { v4 } from 'uuid'
import { API_KEY, API_URL, APP_INFO } from '@/config'
import { getAgentById } from '@/config/agents'

export const getInfo = (request: NextRequest) => {
  const botId = request.headers.get('x-bot-id') || 'carlos'
  const userPrefix = `user_${botId}:`

  // 1. Extraer ID del usuario autenticado (WordPress / Ultimate Member)
  const headerUserId = request.headers.get('x-user-id')
  const cookieUserId = request.cookies.get('auth_user_id')?.value

  let wpUserId = headerUserId || cookieUserId
  if (!wpUserId) {
    const sessionCookie = request.cookies.get('auth_session')?.value
    if (sessionCookie) {
      try {
        const decoded = Buffer.from(sessionCookie, 'base64url').toString('utf-8')
        const payload = JSON.parse(decoded)
        if (payload?.id) {
          wpUserId = String(payload.id)
        }
      }
      catch {
      }
    }
  }

  // 2. Si hay usuario autenticado, usamos su identificador permanente 'wp_{id}'
  if (wpUserId) {
    const user = `${userPrefix}wp_${wpUserId}`
    return {
      sessionId: `wp_${wpUserId}`,
      user,
      botId,
    }
  }

  // 3. Fallback de sesión efímera
  const sessionId = request.cookies.get(`session_id_${botId}`)?.value || v4()
  const user = userPrefix + sessionId
  return {
    sessionId,
    user,
    botId,
  }
}

export const setSession = (sessionId: string, botId = 'carlos') => {
  if (sessionId.startsWith('wp_')) {
    return {}
  }
  if (APP_INFO.disable_session_same_site) {
    return { 'Set-Cookie': `session_id_${botId}=${sessionId}; SameSite=None; Secure; Path=/` }
  }

  return { 'Set-Cookie': `session_id_${botId}=${sessionId}; Path=/` }
}

export const getClient = (request?: NextRequest) => {
  if (!request) {
    return new ChatClient(API_KEY, API_URL || undefined)
  }
  const customKey = request.headers.get('x-bot-api-key')
  const botId = request.headers.get('x-bot-id')
  const agent = getAgentById(botId || undefined)
  const activeKey = customKey || agent.apiKey || API_KEY
  const activeUrl = agent.apiUrl || API_URL || undefined
  return new ChatClient(activeKey, activeUrl)
}

export const client = new ChatClient(API_KEY, API_URL || undefined)
