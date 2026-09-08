import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getClient, getInfo } from '@/app/api/utils/common'

export async function POST(request: NextRequest, { params }: {
  params: Promise<{ conversationId: string }>
}) {
  const body = await request.json()
  const {
    auto_generate,
    name,
  } = body
  const { conversationId } = await params
  const { user } = getInfo(request)
  const client = getClient(request)

  // auto generate name
  const { data } = await client.renameConversation(conversationId, name, user, auto_generate)
  return NextResponse.json(data)
}
