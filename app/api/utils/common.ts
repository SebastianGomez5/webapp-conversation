import type { NextRequest } from 'next/server'
import { ChatClient } from 'dify-client'
import { v4 } from 'uuid'
import { API_KEY, API_URL, APP_INFO } from '@/config'
import { getAgentById } from '@/config/agents'

export const getInfo = (request: NextRequest) => {
  const botId = request.headers.get('x-bot-id') || 'carlos'
  const userPrefix = `user_${botId}:`

  const sessionId = request.cookies.get(`session_id_${botId}`)?.value || v4()
  const user = userPrefix + sessionId
  return {
    sessionId,
    user,
    botId,
  }
}

export const setSession = (sessionId: string, botId = 'carlos') => {
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
  return new ChatClient(activeKey, API_URL || undefined)
}

export const client = new ChatClient(API_KEY, API_URL || undefined)
