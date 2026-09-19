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
    return NextResponse.json(data || { result: 'success' })
  }
  catch (error: any) {
    console.warn(`[Delete Conversation] Warning for ${conversationId}:`, error?.message || error)
    // Permitir éxito si ya no existe en el backend para limpiar la UI del usuario
    return NextResponse.json({
      result: 'success',
      warning: error?.message || 'Eliminada localmente',
    })
  }
}

export async function POST(request: NextRequest, context: { params: Promise<{ conversationId: string }> }) {
  return DELETE(request, context)
}
