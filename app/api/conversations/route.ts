import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { ChatClient } from 'dify-client'
import { getInfo, setSession } from '@/app/api/utils/common'
import { AGENTS_LIST } from '@/config/agents'
import { API_KEY, API_URL } from '@/config'

export async function GET(request: NextRequest) {
  const { sessionId, botId } = getInfo(request)
  const singleBot = request.nextUrl.searchParams.get('single_bot') === 'true'

  // Si se solicita específicamente un solo bot
  if (singleBot) {
    const specificBotId = request.headers.get('x-bot-id') || request.nextUrl.searchParams.get('bot_id') || botId
    const specificAgent = AGENTS_LIST.find(a => a.id === specificBotId) || AGENTS_LIST[0]
    const customKey = request.headers.get('x-bot-api-key')
    const client = new ChatClient(customKey || specificAgent.apiKey || API_KEY, specificAgent.apiUrl || API_URL || undefined)
    const userForBot = `user_${specificAgent.id}:${sessionId}`
    try {
      const { data }: any = await client.getConversations(userForBot)
      const list = (Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []).map((item: any) => ({
        ...item,
        botId: specificAgent.id,
      }))
      return NextResponse.json({ data: list }, {
        headers: setSession(sessionId, specificBotId),
      })
    }
    catch (error: any) {
      return NextResponse.json({ data: [], error: (error as any)?.message || 'Error fetching conversations' })
    }
  }

  // Traer las conversaciones de TODOS los bots activos para el usuario unificado
  try {
    const results = await Promise.allSettled(
      AGENTS_LIST.map(async (agent) => {
        const userForBot = `user_${agent.id}:${sessionId}`
        const agentClient = new ChatClient(agent.apiKey || API_KEY, agent.apiUrl || API_URL || undefined)
        const res: any = await agentClient.getConversations(userForBot).catch(() => ({ data: [] }))
        const rawList = Array.isArray(res?.data?.data)
          ? res.data.data
          : Array.isArray(res?.data)
            ? res.data
            : Array.isArray(res)
              ? res
              : []
        return rawList.map((item: any) => ({
          ...item,
          botId: agent.id,
        }))
      }),
    )

    const allConversations: any[] = []
    results.forEach((result) => {
      if (result.status === 'fulfilled' && Array.isArray(result.value)) {
        allConversations.push(...result.value)
      }
    })

    // Ordenar cronológicamente descendente (más recientes primero)
    allConversations.sort((a, b) => {
      const timeA = a.created_at || a.updated_at || 0
      const timeB = b.created_at || b.updated_at || 0
      return timeB - timeA
    })

    return NextResponse.json({ data: allConversations }, {
      headers: setSession(sessionId, botId),
    })
  }
  catch (error: any) {
    return NextResponse.json({
      data: [],
      error: error?.message || 'Error fetching all conversations',
    })
  }
}
