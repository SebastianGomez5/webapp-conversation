import type { NextRequest } from 'next/server'
import { API_KEY, API_URL } from '@/config'
import { getInfo } from '@/app/api/utils/common'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const { user } = getInfo(request)
    if (!formData.has('user')) {
      formData.append('user', user)
    }

    const apiUrl = API_URL || 'https://api.dify.ai/v1'
    const res = await fetch(`${apiUrl}/audio-to-text`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
      },
      body: formData,
    })

    if (!res.ok) {
      const errorText = await res.text()
      return new Response(errorText, { status: res.status })
    }

    const data = await res.json()
    return Response.json(data)
  }
  catch (e: any) {
    return new Response(e.message || 'Error processing audio', { status: 500 })
  }
}
