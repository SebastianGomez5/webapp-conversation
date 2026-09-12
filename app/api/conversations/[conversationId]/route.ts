import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getClient, getInfo } from '@/app/api/utils/common'

export async function DELETE(request: NextRequest, { params }: {
  params: Promise<{ conversationId: string }>
}) {
  const { conversationId } = await params
  const { user } = getInfo(request)
  const client = getClient(request)

  try {
    const { data } = await client.deleteConversation(conversationId, user)
    return NextResponse.json(data)
  }
  catch (error: any) {
    return NextResponse.json({
      result: 'error',
      message: error?.message || 'Error deleting conversation',
    }, { status: 500 })
  }
}
