import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getClient, getInfo, setSession } from '@/app/api/utils/common'

export async function GET(request: NextRequest) {
  const { sessionId, user, botId } = getInfo(request)
  const client = getClient(request)
  const { searchParams } = new URL(request.url)
  const conversationId = searchParams.get('conversation_id')

  if (!conversationId) {
    return NextResponse.json({ data: [] })
  }

  try {
    const { data }: any = await client.getConversationMessages(user, conversationId)
    return NextResponse.json(data, {
      headers: setSession(sessionId, botId),
    })
  }
  catch (error: any) {
    return NextResponse.json({
      data: [],
      error: error?.message || 'Conversation not found',
    }, {
      status: 200,
    })
  }
}
