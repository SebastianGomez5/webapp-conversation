import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getClient, getInfo, setSession } from '@/app/api/utils/common'

export async function GET(request: NextRequest) {
  const { sessionId, user, botId } = getInfo(request)
  const client = getClient(request)
  try {
    const { data } = await client.getApplicationParameters(user)
    return NextResponse.json(data as object, {
      headers: setSession(sessionId, botId),
    })
  }
  catch (error) {
    return NextResponse.json([])
  }
}
