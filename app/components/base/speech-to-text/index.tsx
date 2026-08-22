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

const LoadingSpinner: FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={cn('animate-spin', className)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
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
  const [isProcessing, setIsProcessing] = useState(false)
  const recognitionRef = useRef<any>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const initialTextRef = useRef<string>('')
  const isWebSpeechModeRef = useRef<boolean>(false)
  const shouldKeepListeningRef = useRef<boolean>(false)

  useEffect(() => {
    return () => {
      shouldKeepListeningRef.current = false
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

  const transcribeAudioBlob = async (blob: Blob) => {
    try {
      const formData = new FormData()
      const audioFile = new File([blob], 'speech.mp3', { type: 'audio/mp3' })
      formData.append('file', audioFile, 'speech.mp3')

      const res = await fetch('/api/audio-to-text', {
        method: 'POST',
        body: formData,
      })

      if (res.ok) {
        const data = await res.json()
        if (data && data.text) {
          const prefix = initialTextRef.current
          const newText = prefix ? (prefix.endsWith(' ') ? `${prefix}${data.text}` : `${prefix} ${data.text}`) : data.text
          onValueChange(newText)
        }
      }
      else {
        const errText = await res.text()
        console.warn('Audio transcription error:', errText)
        Toast.notify({ type: 'error', message: 'No se pudo transcribir el audio.' })
      }
    }
    catch (err) {
      console.error('Transcription error:', err)
      Toast.notify({ type: 'error', message: 'Error al procesar el dictado.' })
    }
  }

  const startMediaRecorder = async () => {
    if (typeof window === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      Toast.notify({ type: 'error', message: 'El micrófono no está disponible en este navegador.' })
      setIsListening(false)
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      audioChunksRef.current = []

      let mimeType = ''
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus'
      }
      else if (MediaRecorder.isTypeSupported('audio/webm')) {
        mimeType = 'audio/webm'
      }
      else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4'
      }

      const options = mimeType ? { mimeType } : undefined
      const mediaRecorder = new MediaRecorder(stream, options)

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop())
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType || 'audio/webm' })
        if (audioBlob.size > 0) {
          setIsProcessing(true)
          await transcribeAudioBlob(audioBlob)
          setIsProcessing(false)
        }
        setIsListening(false)
      }

      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start(250)
      isWebSpeechModeRef.current = false
      setIsListening(true)
    }
    catch (err) {
      console.error('Error al acceder al micrófono:', err)
      Toast.notify({ type: 'error', message: 'No se pudo acceder al micrófono. Por favor verifica los permisos.' })
      setIsListening(false)
    }
  }

  const startWebSpeech = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      startMediaRecorder()
      return
    }

    try {
      const recognition = new SpeechRecognition()
      recognition.lang = 'es-ES'
      recognition.continuous = true
      recognition.interimResults = true

      recognition.onstart = () => {
        isWebSpeechModeRef.current = true
        setIsListening(true)
      }

      recognition.onresult = (event: any) => {
        let finalTranscript = ''
        let interimTranscript = ''

        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i]
          if (result.isFinal) {
            finalTranscript += `${result[0].transcript} `
          }
          else {
            interimTranscript += result[0].transcript
          }
        }

        const currentText = (finalTranscript + interimTranscript).trim()
        if (currentText) {
          const prefix = initialTextRef.current
          const combined = prefix ? (prefix.endsWith(' ') ? `${prefix}${currentText}` : `${prefix} ${currentText}`) : currentText
          onValueChange(combined)
        }
      }

      recognition.onerror = (event: any) => {
        console.warn('SpeechRecognition error:', event.error)
        try {
          recognition.stop()
        }
        catch {
        }
        if (event.error === 'network' || event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          shouldKeepListeningRef.current = false
          startMediaRecorder()
        }
      }

      recognition.onend = () => {
        if (shouldKeepListeningRef.current) {
          try {
            recognition.start()
          }
          catch {
            setIsListening(false)
          }
        }
        else {
          setIsListening(false)
        }
      }

      recognitionRef.current = recognition
      recognition.start()
    }
    catch (err) {
      console.warn('SpeechRecognition failed, fallback to MediaRecorder:', err)
      startMediaRecorder()
    }
  }

  const startListening = async () => {
    initialTextRef.current = currentValue || ''
    shouldKeepListeningRef.current = true

    const isBrave = typeof (navigator as any).brave !== 'undefined'
    if (isBrave) {
      await startMediaRecorder()
      return
    }

    startWebSpeech()
  }

  const stopListening = () => {
    shouldKeepListeningRef.current = false
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
  }

  const handleToggle = () => {
    if (disabled || isProcessing) { return }
    if (isListening) {
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
        disabled || isProcessing ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
        isListening
          ? 'bg-red-50 text-red-600 ring-1 ring-red-300 animate-pulse'
          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100',
        className,
      )}
      title={isProcessing ? 'Procesando dictado...' : (isListening ? 'Detener micrófono' : 'Hablar por micrófono (Dictado)')}
      onClick={handleToggle}
    >
      {isProcessing
        ? (
          <LoadingSpinner className="w-4 h-4 text-gray-500" />
        )
        : (
          <MicrophoneIcon className={cn('w-4 h-4', isListening && 'text-red-600')} />
        )}
    </div>
  )
}

export default SpeechToText
