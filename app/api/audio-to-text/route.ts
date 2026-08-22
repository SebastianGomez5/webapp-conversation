import type { NextRequest } from 'next/server'
import { API_KEY, API_URL } from '@/config'
import { getInfo } from '@/app/api/utils/common'

export async function POST(request: NextRequest) {
  try {
    const reqFormData = await request.formData()
    const { user } = getInfo(request)
    const file = reqFormData.get('file') as File | null

    if (!file) {
      return new Response('No audio file provided', { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Determine filename extension - default to speech.mp3 / speech.wav for max compatibility with Dify STT engines
    let filename = 'speech.mp3'
    let mimeType = 'audio/mp3'

    if (file.name && file.name.endsWith('.wav')) {
      filename = 'speech.wav'
      mimeType = 'audio/wav'
    }
    else if (file.name && file.name.endsWith('.m4a')) {
      filename = 'speech.m4a'
      mimeType = 'audio/m4a'
    }
    else if (file.name && file.name.endsWith('.mp4')) {
      filename = 'speech.mp4'
      mimeType = 'audio/mp4'
    }

    const audioBlob = new Blob([buffer], { type: mimeType })
    const difyFormData = new FormData()
    difyFormData.append('file', audioBlob, filename)
    difyFormData.append('user', user)

    const baseUrl = API_URL || 'https://api.dify.ai/v1'
    const apiUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
    const endpoint = apiUrl.endsWith('/v1') ? `${apiUrl}/audio-to-text` : `${apiUrl}/v1/audio-to-text`

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
      },
      body: difyFormData,
    })

    if (!res.ok) {
      const errorText = await res.text()
      console.error('Dify audio-to-text status:', res.status, errorText)
      return new Response(errorText, { status: res.status })
    }

    const data = await res.json()
    return Response.json(data)
  }
  catch (e: any) {
    console.error('Audio processing route error:', e)
    return new Response(e.message || 'Error processing audio', { status: 500 })
  }
}
