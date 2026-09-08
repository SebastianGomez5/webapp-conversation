import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getClient, getInfo, setSession } from '@/app/api/utils/common'

export async function GET(request: NextRequest) {
  const { sessionId, user, botId } = getInfo(request)
  const client = getClient(request)
  try {
    const { data }: any = await client.getConversations(user)
    return NextResponse.json(data, {
      headers: setSession(sessionId, botId),
    })
  }
  catch (error: any) {
    return NextResponse.json({
      data: [],
      error: error.message,
    })
  }
}
