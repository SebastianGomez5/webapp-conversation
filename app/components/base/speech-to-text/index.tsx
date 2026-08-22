'use client'
import type { FC } from 'react'
import React, { useEffect, useRef, useState } from 'react'
import cn from '@/utils/classnames'
import Toast from '@/app/components/base/toast'

const MicrophoneIcon: FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="22" />
  </svg>
)

interface SpeechToTextProps {
  onValueChange: (value: string) => void
  currentValue?: string
  disabled?: boolean
  className?: string
}

export const SpeechToText: FC<SpeechToTextProps> = ({
  onValueChange,
  currentValue = '',
  disabled = false,
  className,
}) => {
  const [isListening, setIsListening] = useState(false)
  const [isRecordingMedia, setIsRecordingMedia] = useState(false)
  const recognitionRef = useRef<any>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const baseTextRef = useRef<string>('')

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        }
        catch {
        }
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop()
        }
        catch {
        }
      }
    }
  }, [])

  const startMediaRecorder = async () => {
    if (typeof window === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      Toast.notify({ type: 'error', message: 'El micrófono no está disponible en este navegador.' })
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      audioChunksRef.current = []
      const mediaRecorder = new MediaRecorder(stream)

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop())
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        if (audioBlob.size > 0) {
          await transcribeAudioBlob(audioBlob)
        }
        setIsRecordingMedia(false)
        setIsListening(false)
      }

      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start()
      setIsRecordingMedia(true)
      setIsListening(true)
    }
    catch (err) {
      console.error('Error al acceder al micrófono:', err)
      Toast.notify({ type: 'error', message: 'No se pudo acceder al micrófono. Por favor verifica los permisos.' })
      setIsListening(false)
      setIsRecordingMedia(false)
    }
  }

  const transcribeAudioBlob = async (blob: Blob) => {
    try {
      const formData = new FormData()
      formData.append('file', blob, 'recording.webm')

      const res = await fetch('/api/audio-to-text', {
        method: 'POST',
        body: formData,
      })

      if (res.ok) {
        const data = await res.json()
        if (data && data.text) {
          onValueChange(`${baseTextRef.current}${data.text}`)
        }
      }
    }
    catch (err) {
      console.error('Transcription error:', err)
    }
  }

  const startListening = () => {
    baseTextRef.current = currentValue ? (currentValue.endsWith(' ') ? currentValue : `${currentValue} `) : ''
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition()
        recognition.lang = 'es-ES'
        recognition.continuous = true
        recognition.interimResults = true

        recognition.onstart = () => {
          setIsListening(true)
        }

        recognition.onresult = (event: any) => {
          let transcript = ''
          for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript
          }
          if (transcript) {
            onValueChange(`${baseTextRef.current}${transcript}`)
          }
        }

        recognition.onerror = (event: any) => {
          console.warn('SpeechRecognition error, attempting MediaRecorder fallback:', event.error)
          try {
            recognition.stop()
          }
          catch {
          }
          setIsListening(false)
          startMediaRecorder()
        }

        recognition.onend = () => {
          setIsListening(false)
        }

        recognitionRef.current = recognition
        recognition.start()
        return
      }
      catch (err) {
        console.warn('SpeechRecognition failed to start, using MediaRecorder fallback:', err)
      }
    }

    startMediaRecorder()
  }

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      }
      catch {
      }
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop()
      }
      catch {
      }
    }
    setIsListening(false)
    setIsRecordingMedia(false)
  }

  const handleToggle = () => {
    if (disabled) { return }
    if (isListening || isRecordingMedia) {
      stopListening()
    }
    else {
      startListening()
    }
  }

  return (
    <div
      className={cn(
        'relative flex items-center justify-center w-8 h-8 rounded-lg transition-colors select-none',
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
        isListening
          ? 'bg-red-50 text-red-600 ring-1 ring-red-300 animate-pulse'
          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100',
        className,
      )}
      title={isListening ? 'Detener micrófono' : 'Hablar por micrófono (Dictado)'}
      onClick={handleToggle}
    >
      <MicrophoneIcon className={cn('w-4 h-4', isListening && 'text-red-600')} />
    </div>
  )
}

export default SpeechToText
