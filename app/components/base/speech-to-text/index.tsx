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
  const recognitionRef = useRef<any>(null)
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
    }
  }, [])

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      Toast.notify({ type: 'error', message: 'Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.' })
      return
    }

    baseTextRef.current = currentValue ? (currentValue.endsWith(' ') ? currentValue : `${currentValue} `) : ''

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
        console.error('Speech recognition error:', event.error)
        setIsListening(false)
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognitionRef.current = recognition
      recognition.start()
    }
    catch (err) {
      console.error('Failed to start speech recognition:', err)
      setIsListening(false)
    }
  }

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      }
      catch {
      }
    }
    setIsListening(false)
  }

  const handleToggle = () => {
    if (disabled) { return }
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
