'use client'
import type { FC } from 'react'
import React, { useEffect, useState } from 'react'
import Tooltip from '@/app/components/base/tooltip'
import Toast from '@/app/components/base/toast'

const SpeakerIcon: FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
  </svg>
)

const SpeakerMuteIcon: FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <line x1="22" y1="9" x2="16" y2="15" />
    <line x1="16" y1="9" x2="22" y2="15" />
  </svg>
)

const cleanMarkdownForSpeech = (text: string) => {
  if (!text) { return '' }
  return text
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[#*_-]/g, '')
    .replace(/\n+/g, '. ')
    .trim()
}

interface TextToSpeechProps {
  content: string
  className?: string
}

export const TextToSpeech: FC<TextToSpeechProps> = ({ content, className }) => {
  const [isSpeaking, setIsSpeaking] = useState(false)

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  const handleToggleSpeak = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      Toast.notify({ type: 'error', message: 'Text to speech is not supported in this browser.' })
      return
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
      return
    }

    const plainText = cleanMarkdownForSpeech(content)
    if (!plainText) { return }

    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(plainText)
    utterance.lang = 'es-ES'
    utterance.rate = 1.0

    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)

    setIsSpeaking(true)
    window.speechSynthesis.speak(utterance)
  }

  return (
    <Tooltip selector="tts-tip" content={isSpeaking ? 'Detener lectura' : 'Escuchar respuesta'}>
      <div
        className={`relative box-border flex items-center justify-center h-7 w-7 p-0.5 rounded-lg bg-white cursor-pointer transition-all select-none ${
          isSpeaking ? 'text-primary-600 bg-primary-50 ring-1 ring-primary-300' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
        } ${className || ''}`}
        style={{ boxShadow: '0px 4px 6px -1px rgba(0, 0, 0, 0.1), 0px 2px 4px -2px rgba(0, 0, 0, 0.05)' }}
        onClick={handleToggleSpeak}
      >
        <div className="rounded-lg h-6 w-6 flex items-center justify-center">
          {isSpeaking ? <SpeakerMuteIcon className="w-4 h-4 text-primary-600 animate-pulse" /> : <SpeakerIcon className="w-4 h-4" />}
        </div>
      </div>
    </Tooltip>
  )
}

export default TextToSpeech
