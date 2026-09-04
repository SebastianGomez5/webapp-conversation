'use client'
import type { FC } from 'react'
import React, { useState } from 'react'
import {
  Volume2,
  VolumeX,
  Copy,
  Check,
  Cpu,
  Bot,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
} from 'lucide-react'
import copy from 'copy-to-clipboard'
import type { FeedbackFunc } from '../type'
import type { ChatItem, VisionFile } from '@/types/app'
import type { Emoji } from '@/types/tools'
import StreamdownMarkdown from '@/app/components/base/streamdown-markdown'
import WorkflowProcess from '@/app/components/workflow/workflow-process'
import ImageGallery from '../../base/image-gallery'
import Thought from '../thought'

interface IAnswerProps {
  item: ChatItem
  feedbackDisabled?: boolean
  onFeedback?: FeedbackFunc
  isResponding?: boolean
  allToolIcons?: Record<string, string | Emoji>
  suggestionClick?: (suggestion: string) => void
  darkMode?: boolean
  isSpeaking?: boolean
  onSpeakToggle?: (text: string, messageId: string) => void
}

const Answer: FC<IAnswerProps> = ({
  item,
  feedbackDisabled = false,
  onFeedback,
  isResponding,
  allToolIcons,
  suggestionClick = () => { },
  darkMode = true,
  isSpeaking = false,
  onSpeakToggle,
}) => {
  const { id, content, feedback, agent_thoughts, workflowProcess, suggestedQuestions = [] } = item
  const [copied, setCopied] = useState(false)

  const getImgs = (list?: VisionFile[]) => {
    if (!list) { return [] }
    return list.filter(file => file.type === 'image' && file.belongs_to === 'assistant')
  }

  const isAgentMode = !!agent_thoughts && agent_thoughts.length > 0

  // Mostrar un único log dinámico de la herramienta activa o la última ejecutada
  const toolThoughts = (agent_thoughts || []).filter(item => Boolean(item.tool))
  const latestToolThought = toolThoughts[toolThoughts.length - 1]

  // Recolectar imágenes generadas por el asistente
  const assistantImages = (agent_thoughts || []).flatMap(item => getImgs(item.message_files))

  // Texto final de respuesta (del content o del thought final del LLM)
  const nonToolThoughts = (agent_thoughts || []).filter(item => !item.tool && Boolean(item.thought))
  const finalThoughtText = nonToolThoughts[nonToolThoughts.length - 1]?.thought || ''
  const displayContent = content || finalThoughtText

  // Razonamiento preliminar si existe antes de herramientas
  const preliminaryThought = (agent_thoughts || [])[0]
  const showPreliminaryThought = preliminaryThought && !preliminaryThought.tool && preliminaryThought.thought && !displayContent && isResponding

  const handleCopy = () => {
    if (!displayContent) { return }
    copy(displayContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const agentModeAnswer = (
    <div className="space-y-2">
      {/* Texto de razonamiento preliminar (si existe antes de la respuesta) */}
      {showPreliminaryThought && (
        <div className={`text-[11px] font-mono px-3 py-2 rounded-lg border flex items-center gap-2 ${
          darkMode ? 'bg-slate-900/90 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
        }`}>
          <Cpu className="h-3.5 w-3.5 text-cyan-400 animate-spin shrink-0" />
          <div className="flex-1 overflow-hidden">
            <StreamdownMarkdown content={preliminaryThought.thought} />
          </div>
        </div>
      )}

      {/* Log único de la herramienta activa (se reemplaza dinámicamente) */}
      {latestToolThought && (
        <Thought
          thought={latestToolThought}
          allToolIcons={allToolIcons || {}}
          isFinished={Boolean(latestToolThought.observation) || !isResponding}
        />
      )}

      {/* Imágenes adjuntas generadas */}
      {assistantImages.length > 0 && (
        <div className="mt-2">
          <ImageGallery srcs={assistantImages.map(f => f.url)} />
        </div>
      )}

      {/* Respuesta redactada final */}
      {displayContent && (
        <div className="mt-2">
          <StreamdownMarkdown content={displayContent} />
        </div>
      )}
    </div>
  )

  return (
    <div key={id} className="flex gap-2 sm:gap-4 max-w-4xl mx-auto justify-start w-full">
      {/* Avatar del Asistente */}
      <div className="flex h-7 w-7 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 text-amber-400 shadow-md overflow-hidden select-none">
        <img
          src="https://studioalvarodiaz.es/wp-content/uploads/2026/07/Carlos-scaled.jpg"
          alt="Carlos"
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.currentTarget as HTMLElement).style.display = 'none'
          }}
        />
        <Bot className="h-4 w-4 sm:h-5 sm:w-5" />
      </div>

      {/* Contenido del Mensaje */}
      <div className="flex flex-col space-y-1.5 max-w-[88%] sm:max-w-[80%] min-w-0">
        {/* Burbuja Principal */}
        <div
          className={`relative px-3 sm:px-4 py-2.5 sm:py-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed select-text ${
            darkMode
              ? 'bg-slate-900/90 border border-slate-800 text-slate-100 rounded-tl-sm shadow-sm'
              : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm'
          }`}
        >
          {workflowProcess && (
            <div className="mb-3">
              <WorkflowProcess data={workflowProcess} hideInfo />
            </div>
          )}

          {!displayContent && !latestToolThought && isResponding
            ? (
              <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono py-1">
                <RefreshCw className="h-3.5 w-3.5 animate-spin shrink-0" />
                <span>Consultando MCP & ejecutando razonamiento...</span>
              </div>
            )
            : isAgentMode
              ? (
                agentModeAnswer
              )
              : (
                <StreamdownMarkdown content={displayContent} />
              )}

          {/* Preguntas sugeridas */}
          {suggestedQuestions.length > 0 && (
            <div className="mt-4 pt-3 border-t border-inherit">
              <div className="text-[11px] font-semibold text-slate-400 mb-1.5">Sugerencias:</div>
              <div className="flex gap-1.5 flex-wrap">
                {suggestedQuestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => suggestionClick(suggestion)}
                    className={`text-xs px-2.5 py-1 rounded-lg border transition-all text-left ${
                      darkMode
                        ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border-slate-700/60'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Acciones Inferiores del Mensaje */}
        <div className={`flex items-center gap-2 text-[11px] px-1 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
          <span>{item.created_at ? new Date(item.created_at * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Ahora'}</span>
          <span>•</span>

          {/* Botón de Voz (TTS) */}
          {onSpeakToggle && displayContent && (
            <>
              <button
                onClick={() => onSpeakToggle(displayContent, id)}
                className={`hover:text-amber-400 flex items-center gap-1 transition-colors ${
                  isSpeaking ? 'text-amber-400 font-semibold' : ''
                }`}
                title={isSpeaking ? 'Detener voz' : 'Escuchar respuesta'}
              >
                {isSpeaking ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                <span>{isSpeaking ? 'Detener' : 'Voz'}</span>
              </button>
              <span>•</span>
            </>
          )}

          {/* Copiar texto */}
          {displayContent && (
            <>
              <button
                onClick={handleCopy}
                className="hover:text-emerald-400 flex items-center gap-1 transition-colors"
                title="Copiar texto"
              >
                {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                <span>{copied ? 'Copiado' : 'Copiar'}</span>
              </button>
              <span>•</span>
            </>
          )}

          {/* Feedback Rating */}
          {!feedbackDisabled && !item.feedbackDisabled && onFeedback && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => onFeedback(id, { rating: feedback?.rating === 'like' ? null : 'like' })}
                className={`p-1 rounded hover:text-emerald-400 transition-colors ${
                  feedback?.rating === 'like' ? 'text-emerald-400' : ''
                }`}
                title="Me gusta"
              >
                <ThumbsUp className="h-3 w-3" />
              </button>
              <button
                onClick={() => onFeedback(id, { rating: feedback?.rating === 'dislike' ? null : 'dislike' })}
                className={`p-1 rounded hover:text-rose-400 transition-colors ${
                  feedback?.rating === 'dislike' ? 'text-rose-400' : ''
                }`}
                title="No me gusta"
              >
                <ThumbsDown className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default React.memo(Answer)
