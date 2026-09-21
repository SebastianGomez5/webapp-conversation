'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import type { FC } from 'react'
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  ChevronDown,
  Sparkles,
  ArrowUp,
  Square,
  AlertCircle,
} from 'lucide-react'
import type { AgentConfig } from '@/config/agents'

export interface IVoiceModalProps {
  isOpen: boolean
  onClose: () => void
  activeAgent: AgentConfig
  agentsList: AgentConfig[]
  onSelectAgent?: (agent: AgentConfig) => void
  onSendVoiceMessage: (
    message: string,
    callbacks?: {
      onChunk?: (chunk: string) => void
      onComplete?: (fullText: string) => void
      onError?: (err: any) => void
      onThought?: (status: string) => void
    },
  ) => Promise<void>
  darkMode?: boolean
}

type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking'

// Eliminar duplicaciones que a veces devuelven agentes con herramientas
const removeDuplicateResponse = (text: string): string => {
  const trimmed = text.trim()
  if (trimmed.length > 20) {
    const half = Math.floor(trimmed.length / 2)
    const firstHalf = trimmed.slice(0, half).trim()
    const secondHalf = trimmed.slice(half).trim()
    if (firstHalf === secondHalf) {
      return firstHalf
    }
  }
  return text
}

// Limpiar markdown, emojis excesivos y símbolos para que la síntesis de voz suene completamente natural
const cleanTextForSpeech = (text: string): string => {
  return text
    // Eliminar bloques de código
    .replace(/```[\s\S]*?```/g, ' fragmento de código omitido ')
    // Eliminar código en línea
    .replace(/`([^`]+)`/g, '$1')
    // Eliminar enlaces markdown [texto](url)
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Eliminar encabezados
    .replace(/#{1,6}\s+/g, '')
    // Eliminar negritas y cursivas
    .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1')
    // Eliminar listas con viñetas
    .replace(/^[\s]*[-*+]\s+/gm, '')
    // Eliminar listas numeradas
    .replace(/^[\s]*\d+\.\s+/gm, '')
    // Eliminar URLs completas
    .replace(/https?:\/\/\S+/g, 'enlace web')
    // Reemplazar saltos de línea repetidos por pausa
    .replace(/\n+/g, '. ')
    .trim()
}

export const VoiceModal: FC<IVoiceModalProps> = ({
  isOpen,
  onClose,
  activeAgent,
  agentsList,
  onSelectAgent,
  onSendVoiceMessage,
  darkMode = true,
}) => {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle')
  const [transcript, setTranscript] = useState('')
  const [lastResponse, setLastResponse] = useState('')
  const [processingStatus, setProcessingStatus] = useState<string>('')
  const [showAgentPicker, setShowAgentPicker] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([])

  const recognitionRef = useRef<any>(null)
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isListeningRef = useRef(false)
  const voiceStateRef = useRef<VoiceState>('idle')
  voiceStateRef.current = voiceState

  const activeAgentRef = useRef(activeAgent)
  activeAgentRef.current = activeAgent

  const onSendVoiceMessageRef = useRef(onSendVoiceMessage)
  onSendVoiceMessageRef.current = onSendVoiceMessage

  const isMutedRef = useRef(isMuted)
  isMutedRef.current = isMuted

  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const resumeIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const startListeningRef = useRef<() => void>(() => {})
  const stopListeningRef = useRef<() => void>(() => {})
  const stopSpeakingRef = useRef<() => void>(() => {})
  const submitQueryRef = useRef<(text: string) => void>(() => {})
  const speakResponseRef = useRef<(text: string) => void>(() => {})

  // Cargar voces del sistema disponibles
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) { return }

    const updateVoices = () => {
      const voices = window.speechSynthesis.getVoices()
      const spanishVoices = voices.filter(v => v.lang.toLowerCase().startsWith('es'))
      setAvailableVoices(spanishVoices.length > 0 ? spanishVoices : voices)
    }

    updateVoices()
    window.speechSynthesis.onvoiceschanged = updateVoices
  }, [])

  // Seleccionar la mejor voz según el agente
  const getAgentVoice = useCallback((): SpeechSynthesisVoice | null => {
    const voices = availableVoices.length > 0
      ? availableVoices
      : (typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis.getVoices() : [])
    if (voices.length === 0) { return null }

    const spanishVoices = voices.filter(v => v.lang.toLowerCase().startsWith('es'))
    const searchPool = spanishVoices.length > 0 ? spanishVoices : voices

    // Nombres femeninos para Wendy o Jessica
    const isFemaleAgent = activeAgentRef.current.id === 'wendy' || activeAgentRef.current.id === 'jessica'
    if (isFemaleAgent) {
      const femaleVoice = searchPool.find(v =>
        /monica|paulina|sabina|lucia|elena|sofia|female|helena|laura|mia|rosa/i.test(v.name),
      )
      if (femaleVoice) { return femaleVoice }
    } else {
      // Voces masculinas/profundas para Carlos, Darius, Bobby, etc.
      const maleVoice = searchPool.find(v =>
        /jorge|pablo|diego|miguel|carlos|male|raul|alvaro|pedro|enrique/i.test(v.name),
      )
      if (maleVoice) { return maleVoice }
    }

    return searchPool[0] || null
  }, [availableVoices])

  // Detener sintetizador de voz
  const stopSpeaking = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      if (resumeIntervalRef.current) {
        clearInterval(resumeIntervalRef.current)
        resumeIntervalRef.current = null
      }
      try {
        window.speechSynthesis.cancel()
      } catch {
        // ignore
      }
      currentUtteranceRef.current = null
    }
  }, [])
  stopSpeakingRef.current = stopSpeaking

  // Detener el micrófono
  const stopListening = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }
    isListeningRef.current = false
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onresult = null
        recognitionRef.current.onerror = null
        recognitionRef.current.onend = null
        recognitionRef.current.stop()
      } catch {
        // ignore
      }
      recognitionRef.current = null
    }
  }, [])
  stopListeningRef.current = stopListening

  // Iniciar sintetizador de voz para leer la respuesta
  const speakResponse = useCallback((rawText: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setVoiceState('listening')
      return
    }

    if (isMutedRef.current) {
      setVoiceState('listening')
      return
    }

    stopSpeaking()

    const deduplicated = removeDuplicateResponse(rawText)
    const cleanText = cleanTextForSpeech(deduplicated)

    if (!cleanText) {
      console.warn('Voice response was empty, resuming listening')
      setTimeout(() => {
        if (voiceStateRef.current !== 'idle') {
          startListeningRef.current()
        }
      }, 400)
      return
    }

    setVoiceState('speaking')
    setLastResponse(deduplicated)

    // Forzar despausa en Chrome si el motor estaba en pausa previa
    try {
      window.speechSynthesis.cancel()
      window.speechSynthesis.resume()
    } catch {
      // ignore
    }

    const utterance = new SpeechSynthesisUtterance(cleanText)
    currentUtteranceRef.current = utterance
    utterance.lang = 'es-ES'
    utterance.rate = 1.05 // Velocidad fluida y natural
    utterance.pitch = (activeAgentRef.current.id === 'wendy' || activeAgentRef.current.id === 'jessica') ? 1.05 : 0.95

    const selectedVoice = getAgentVoice()
    if (selectedVoice) {
      utterance.voice = selectedVoice
    }

    // Intervalo de seguridad para evitar que Chrome congele SpeechSynthesis en textos largos
    if (resumeIntervalRef.current) {
      clearInterval(resumeIntervalRef.current)
    }
    resumeIntervalRef.current = setInterval(() => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
          window.speechSynthesis.pause()
          window.speechSynthesis.resume()
        }
      }
    }, 4500)

    const finishSpeaking = () => {
      if (resumeIntervalRef.current) {
        clearInterval(resumeIntervalRef.current)
        resumeIntervalRef.current = null
      }
      currentUtteranceRef.current = null
      setTimeout(() => {
        if (voiceStateRef.current !== 'idle') {
          startListeningRef.current()
        }
      }, 400)
    }

    utterance.onend = finishSpeaking
    utterance.onerror = (e) => {
      console.warn('Speech synthesis utterance interrupted/error:', e)
      finishSpeaking()
    }

    window.speechSynthesis.speak(utterance)
  }, [getAgentVoice, stopSpeaking])
  speakResponseRef.current = speakResponse

  // Enviar consulta del usuario a Dify
  const submitQuery = useCallback(async (queryText: string) => {
    const trimmed = queryText.trim()
    if (!trimmed) {
      startListeningRef.current()
      return
    }

    stopListening()
    stopSpeaking()
    setVoiceState('processing')
    setProcessingStatus(`Consultando con ${activeAgentRef.current.name}...`)
    setErrorMsg(null)

    try {
      let accumulatedResponse = ''
      await onSendVoiceMessageRef.current(trimmed, {
        onThought: (status) => {
          setProcessingStatus(`${activeAgentRef.current.name}: ${status}`)
        },
        onChunk: (chunk) => {
          accumulatedResponse += chunk
          setLastResponse(accumulatedResponse)
        },
        onComplete: (fullText) => {
          const finalAnswer = fullText || accumulatedResponse
          setProcessingStatus('')
          setLastResponse(finalAnswer)
          speakResponseRef.current(finalAnswer)
        },
        onError: (err) => {
          console.error('Error in voice chat:', err)
          setErrorMsg('Error al comunicar con el agente. Intentando de nuevo...')
          setProcessingStatus('')
          setTimeout(() => startListeningRef.current(), 1500)
        },
      })
    } catch (err: any) {
      console.error('Submit query failed:', err)
      setErrorMsg('No se pudo enviar el mensaje.')
      setProcessingStatus('')
      setTimeout(() => startListeningRef.current(), 1500)
    }
  }, [stopListening, stopSpeaking])
  submitQueryRef.current = submitQuery

  // Iniciar reconocimiento de voz
  const startListening = useCallback(() => {
    stopSpeaking()
    setErrorMsg(null)

    if (typeof window === 'undefined') { return }

    const SpeechRecognition
      = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) {
      setErrorMsg('Tu navegador no soporta reconocimiento de voz nativo. Usa Chrome o Edge.')
      setVoiceState('idle')
      return
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.onresult = null
          recognitionRef.current.onerror = null
          recognitionRef.current.onend = null
          recognitionRef.current.abort()
        } catch {
          // ignore
        }
        recognitionRef.current = null
      }

      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'es-ES'

      recognition.onstart = () => {
        isListeningRef.current = true
        setVoiceState('listening')
        setTranscript('')
      }

      recognition.onresult = (event: any) => {
        let currentInterim = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentInterim += event.results[i][0].transcript
        }

        if (currentInterim.trim()) {
          setTranscript(currentInterim)

          // Detección de silencio (VAD): esperar 1.5s sin hablar para auto-enviar
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current)
          }

          silenceTimerRef.current = setTimeout(() => {
            const finalQuery = currentInterim.trim()
            if (finalQuery.length > 1) {
              submitQueryRef.current(finalQuery)
            }
          }, 1500)
        }
      }

      recognition.onerror = (event: any) => {
        console.warn('SpeechRecognition error:', event.error)
        if (event.error === 'not-allowed') {
          setErrorMsg('Permiso de micrófono denegado. Permite el acceso para hablar.')
          setVoiceState('idle')
          isListeningRef.current = false
        } else if (event.error === 'aborted') {
          // Ignorar abort intencional
        } else if (event.error !== 'no-speech') {
          if (voiceStateRef.current === 'listening') {
            setTimeout(() => {
              if (voiceStateRef.current === 'listening') {
                startListeningRef.current()
              }
            }, 300)
          }
        }
      }

      recognition.onend = () => {
        isListeningRef.current = false
        // Si el navegador cerró la escucha pero seguimos en estado 'listening', relanzar
        if (voiceStateRef.current === 'listening') {
          setTimeout(() => {
            if (voiceStateRef.current === 'listening') {
              startListeningRef.current()
            }
          }, 150)
        }
      }

      recognitionRef.current = recognition
      recognition.start()
    } catch (e: any) {
      console.error('Error starting recognition:', e)
      setErrorMsg('No se pudo activar el micrófono.')
      setVoiceState('idle')
    }
  }, [stopSpeaking])
  startListeningRef.current = startListening

  // Iniciar automáticamente el flujo al abrir el modal y limpiar al cerrar
  useEffect(() => {
    if (isOpen) {
      setTranscript('')
      setLastResponse('')
      setErrorMsg(null)
      startListeningRef.current()
    } else {
      stopListeningRef.current()
      stopSpeakingRef.current()
      setVoiceState('idle')
    }

    return () => {
      stopListeningRef.current()
      stopSpeakingRef.current()
    }
  }, [isOpen])

  if (!isOpen) { return null }

  // Colores de tema según el agente activo
  const agentColorMap: Record<string, { aura: string, border: string, pulse: string, text: string }> = {
    carlos: { aura: 'from-emerald-500/30 to-teal-500/20', border: 'border-emerald-500/40', pulse: 'bg-emerald-400', text: 'text-emerald-400' },
    wendy: { aura: 'from-rose-500/30 to-pink-500/20', border: 'border-rose-500/40', pulse: 'bg-rose-400', text: 'text-rose-400' },
    jessica: { aura: 'from-purple-500/30 to-indigo-500/20', border: 'border-purple-500/40', pulse: 'bg-purple-400', text: 'text-purple-400' },
    donald: { aura: 'from-amber-500/30 to-orange-500/20', border: 'border-amber-500/40', pulse: 'bg-amber-400', text: 'text-amber-400' },
    elliot: { aura: 'from-cyan-500/30 to-blue-500/20', border: 'border-cyan-500/40', pulse: 'bg-cyan-400', text: 'text-cyan-400' },
    bobby: { aura: 'from-yellow-500/30 to-amber-500/20', border: 'border-yellow-500/40', pulse: 'bg-yellow-400', text: 'text-yellow-400' },
    darius: { aura: 'from-blue-500/30 to-sky-500/20', border: 'border-blue-500/40', pulse: 'bg-blue-400', text: 'text-blue-400' },
    denova: { aura: 'from-teal-500/30 to-cyan-500/20', border: 'border-teal-500/40', pulse: 'bg-teal-400', text: 'text-teal-400' },
  }

  const agentTheme = agentColorMap[activeAgent.id] || agentColorMap.carlos

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-2xl p-4 animate-in fade-in duration-200">
      <div
        className={`relative w-full max-w-xl rounded-3xl p-6 sm:p-8 text-center border shadow-2xl flex flex-col items-center justify-between min-h-[580px] sm:min-h-[620px] overflow-hidden transition-all ${
          darkMode ? 'bg-[#080C14] border-slate-800 text-white shadow-black/90' : 'bg-white border-slate-200 text-slate-900 shadow-xl'
        }`}
      >
        {/* Glow de fondo ambiental según el estado */}
        <div
          className={`absolute inset-0 bg-gradient-to-b ${agentTheme.aura} pointer-events-none opacity-40 blur-3xl transition-opacity duration-700 ${
            voiceState === 'listening' ? 'opacity-60 scale-105' : voiceState === 'speaking' ? 'opacity-70 scale-110' : 'opacity-20'
          }`}
        />

        {/* Header del Modal: Selector de Agente y Cierre */}
        <div className="w-full flex items-center justify-between z-10">
          {/* Selector Desplegable de Bot en Vivo */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowAgentPicker(!showAgentPicker)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all cursor-pointer ${
                darkMode
                  ? 'bg-slate-900/80 hover:bg-slate-800 border-slate-700/60 text-slate-200'
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
              }`}
            >
              <img
                src={activeAgent.avatar}
                alt={activeAgent.name}
                className="h-5 w-5 rounded-full object-cover border border-inherit"
              />
              <span>{activeAgent.name}</span>
              <span className={`text-[10px] font-mono font-medium ${agentTheme.text}`}>
                ({activeAgent.role})
              </span>
              <ChevronDown className="h-3.5 w-3.5 opacity-60" />
            </button>

            {/* Menú de cambio de bot */}
            {showAgentPicker && (
              <>
                <div
                  className="fixed inset-0 z-40 bg-transparent"
                  onClick={() => setShowAgentPicker(false)}
                />
                <div
                  className={`absolute left-0 top-full mt-2 w-72 rounded-2xl border p-2 shadow-2xl z-50 max-h-64 overflow-y-auto scrollbar-thin ${
                    darkMode ? 'bg-[#0E1422] border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-b border-inherit mb-1">
                    Cambiar Asistente de Voz
                  </div>
                  {agentsList.map(agent => (
                    <button
                      key={agent.id}
                      type="button"
                      onClick={() => {
                        onSelectAgent?.(agent)
                        setShowAgentPicker(false)
                        stopSpeaking()
                        startListening()
                      }}
                      className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-left text-xs transition-colors cursor-pointer ${
                        activeAgent.id === agent.id
                          ? darkMode ? 'bg-slate-800 text-white font-bold' : 'bg-slate-100 text-slate-900 font-bold'
                          : darkMode ? 'hover:bg-slate-800/60 text-slate-300' : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <img src={agent.avatar} alt={agent.name} className="h-6 w-6 rounded-full object-cover" />
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="truncate">{agent.name}</span>
                        <span className="text-[10px] text-slate-400 truncate">{agent.role}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Botón de Cerrar */}
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-800/80 text-slate-400 hover:text-white transition-colors"
            title="Cerrar modo de voz"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Centro: Orbe Interactivo & Estado */}
        <div className="flex flex-col items-center justify-center my-auto z-10 w-full max-w-md">
          {/* Indicador de Estado */}
          <div className="mb-6 flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border bg-slate-900/60 backdrop-blur-md border-slate-800">
            <span
              className={`h-2 w-2 rounded-full ${
                voiceState === 'listening'
                  ? 'bg-emerald-400 animate-ping'
                  : voiceState === 'speaking'
                    ? `${agentTheme.pulse} animate-pulse`
                    : voiceState === 'processing'
                      ? 'bg-amber-400 animate-spin'
                      : 'bg-slate-500'
              }`}
            />
            <span className="text-slate-300 text-[11px] font-mono">
              {voiceState === 'listening' && 'Te escucho... habla naturalmente'}
              {voiceState === 'processing' && (processingStatus || `Procesando con ${activeAgent.name}...`)}
              {voiceState === 'speaking' && `${activeAgent.name} respondiendo...`}
              {voiceState === 'idle' && 'En pausa'}
            </span>
          </div>

          {/* Orbe Visual Interactivo Principal */}
          <div
            onClick={() => {
              if (voiceState === 'speaking') {
                stopSpeaking()
                startListening()
              } else if (voiceState === 'listening' && transcript.trim()) {
                submitQuery(transcript)
              }
            }}
            className="relative flex items-center justify-center cursor-pointer group py-4 select-none"
            title={voiceState === 'speaking' ? 'Toca para interrumpir y hablar' : 'Toca para enviar'}
          >
            {/* Anillos de expansión según el estado */}
            <div
              className={`absolute h-52 w-52 rounded-full border transition-all duration-700 ${
                voiceState === 'listening'
                  ? 'border-emerald-500/20 scale-110 animate-ping'
                  : voiceState === 'speaking'
                    ? `${agentTheme.border} scale-125 animate-pulse`
                    : 'border-slate-800 scale-95'
              }`}
            />
            <div
              className={`absolute h-40 w-40 rounded-full transition-all duration-500 ${
                voiceState === 'listening'
                  ? 'bg-emerald-500/15 animate-pulse'
                  : voiceState === 'speaking'
                    ? 'bg-cyan-500/20 animate-pulse scale-110'
                    : 'bg-slate-800/40'
              }`}
            />

            {/* Núcleo del Orbe con avatar y ondas */}
            <div
              className={`relative h-28 w-28 sm:h-32 sm:w-32 rounded-full p-1 bg-gradient-to-tr ${
                voiceState === 'listening'
                  ? 'from-emerald-400 via-teal-500 to-cyan-400 shadow-emerald-500/40'
                  : voiceState === 'speaking'
                    ? 'from-cyan-400 via-indigo-500 to-rose-400 shadow-indigo-500/40'
                    : 'from-amber-400 via-orange-500 to-rose-500 shadow-amber-500/40'
              } shadow-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-105`}
            >
              <img
                src={activeAgent.avatar}
                alt={activeAgent.name}
                className="h-full w-full rounded-full object-cover border-2 border-black/40 shadow-inner"
              />

              {/* Botón flotante sobre el orbe para feedback */}
              <div className="absolute inset-0 rounded-full bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                {voiceState === 'speaking'
                  ? (
                    <Square className="h-8 w-8 text-white fill-white drop-shadow-md" />
                  )
                  : (
                    <ArrowUp className="h-8 w-8 text-white drop-shadow-md" />
                  )}
              </div>
            </div>
          </div>

          {/* Barras de Audio Animadas */}
          <div className="flex items-center gap-1.5 h-6 my-2">
            {[40, 75, 100, 60, 90, 45, 80, 50].map((h, i) => (
              <span
                key={i}
                className={`w-1 rounded-full transition-all duration-150 ${
                  voiceState === 'listening'
                    ? 'bg-emerald-400 animate-pulse'
                    : voiceState === 'speaking'
                      ? 'bg-cyan-400 animate-pulse'
                      : 'bg-slate-700 h-1.5'
                }`}
                style={{
                  height: voiceState === 'listening' || voiceState === 'speaking' ? `${Math.max(4, (h * Math.random()) / 2.5)}px` : '4px',
                }}
              />
            ))}
          </div>

          {/* Subtítulos en Vivo: Lo que estás diciendo o lo que respondió */}
          <div className="w-full min-h-[90px] max-h-36 overflow-y-auto px-4 py-3 rounded-2xl bg-slate-900/50 border border-slate-800/80 backdrop-blur-md text-center flex flex-col items-center justify-center scrollbar-thin">
            {voiceState === 'listening' && (
              <p className="text-sm sm:text-base font-medium text-slate-100 leading-relaxed italic">
                {transcript || (
                  <span className="text-slate-500 not-italic text-xs sm:text-sm">
                    Habla naturalmente... al hacer una pausa se enviará a {activeAgent.name}
                  </span>
                )}
              </p>
            )}

            {voiceState === 'processing' && (
              <div className="flex items-center gap-2 text-amber-300 text-sm font-medium">
                <Sparkles className="h-4 w-4 animate-spin text-amber-400" />
                <span>{processingStatus || `Consultando con ${activeAgent.name}...`}</span>
              </div>
            )}

            {voiceState === 'speaking' && (
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed max-h-28 overflow-y-auto scrollbar-thin">
                {lastResponse || 'Hablando...'}
              </p>
            )}

            {voiceState === 'idle' && !errorMsg && (
              <p className="text-xs text-slate-400">Presiona el micrófono para iniciar la conversación</p>
            )}

            {errorMsg && (
              <div className="flex items-center gap-2 text-rose-400 text-xs font-medium">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer: Acciones y Controles de Voz */}
        <div className="w-full flex items-center justify-between gap-4 pt-4 border-t border-slate-800/80 z-10">
          {/* Alternar Mute de Altavoz */}
          <button
            type="button"
            onClick={() => {
              if (!isMuted) { stopSpeaking() }
              setIsMuted(!isMuted)
            }}
            className={`p-2.5 rounded-full border transition-all ${
              isMuted
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                : 'bg-slate-900/80 text-slate-300 border-slate-700/60 hover:bg-slate-800'
            }`}
            title={isMuted ? 'Activar voz del bot' : 'Silenciar voz del bot'}
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>

          {/* Botón Principal Central: Micrófono / Interrupción */}
          <div className="flex items-center gap-2">
            {voiceState === 'speaking'
              ? (
                <button
                  type="button"
                  onClick={() => {
                    stopSpeaking()
                    startListening()
                  }}
                  className="px-5 py-2.5 rounded-full bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-2 border border-slate-700 shadow-md transition-all active:scale-95"
                >
                  <Square className="h-3.5 w-3.5 fill-white" />
                  <span>Interrumpir</span>
                </button>
              )
              : voiceState === 'listening'
                ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (transcript.trim()) {
                        submitQuery(transcript)
                      } else {
                        stopListening()
                        setVoiceState('idle')
                      }
                    }}
                    className={`px-5 py-2.5 rounded-full text-xs font-semibold flex items-center gap-2 shadow-lg transition-all active:scale-95 ${
                      transcript.trim()
                        ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/30 font-bold'
                        : 'bg-rose-600/80 hover:bg-rose-600 text-white border border-rose-500/40'
                    }`}
                  >
                    {transcript.trim()
                      ? (
                        <>
                          <ArrowUp className="h-4 w-4" />
                          <span>Enviar ahora</span>
                        </>
                      )
                      : (
                        <>
                          <MicOff className="h-4 w-4" />
                          <span>Pausar micrófono</span>
                        </>
                      )}
                  </button>
                )
                : (
                  <button
                    type="button"
                    onClick={startListening}
                    className="px-6 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/30 transition-all active:scale-95"
                  >
                    <Mic className="h-4 w-4" />
                    <span>Hablar</span>
                  </button>
                )}
          </div>

          {/* Botón Finalizar Sesión */}
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-full bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-colors"
          >
            Finalizar
          </button>
        </div>
      </div>
    </div>
  )
}

export default VoiceModal
