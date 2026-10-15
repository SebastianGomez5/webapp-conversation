import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getClient, getInfo, setSession } from '@/app/api/utils/common'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const { user, sessionId, botId } = getInfo(request)
    const client = getClient(request)
    formData.append('user', user)
    const res = await client.fileUpload(formData)

    const sessionHeaders = setSession(sessionId, botId)
    return NextResponse.json({
      id: res.data.id,
      name: res.data.name,
      size: res.data.size,
      extension: res.data.extension,
      mime_type: res.data.mime_type,
      url: res.data.source_url || '',
    }, {
      status: 200,
      headers: sessionHeaders,
    })
  }
  catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error al subir archivo' }, { status: 500 })
  }
}
