'use client'
import type { FC } from 'react'
import React, { useEffect, useRef, useState } from 'react'
import {
  Paperclip,
  Mic,
  MicOff,
  Send,
  ChevronDown,
  FileText,
  X,
  Square,
  Loader2,
  UploadCloud,
} from 'lucide-react'
import type { FeedbackFunc } from './type'
import Answer from './answer'
import Question from './question'
import type { ChatItem, VisionFile, VisionSettings } from '@/types/app'
import { TransferMethod } from '@/types/app'
import type { FileUpload } from '@/app/components/base/file-uploader-in-attachment/types'
import { fileUpload } from '@/app/components/base/file-uploader-in-attachment/utils'
import type { UserCustomization } from '@/app/components/settings/customization-modal'
import { ACCENT_COLOR_MAP } from '@/app/components/settings/customization-modal'
import type { AgentConfig } from '@/config/agents'

export interface AttachedFileItem {
  id: string
  name: string
  size: number
  type: string
  file?: File
  url?: string
  uploading?: boolean
  upload_file_id?: string
  error?: boolean
}

export interface IChatProps {
  chatList: ChatItem[]
  feedbackDisabled?: boolean
  onFeedback?: FeedbackFunc
  checkCanSend?: () => boolean
  onSend?: (message: string, files: VisionFile[]) => void
  onStop?: () => void
  isResponding?: boolean
  darkMode?: boolean
  activeAgent?: AgentConfig
  agentsList?: AgentConfig[]
  onSelectAgent?: (agent: AgentConfig) => void
  isSpeakingMessageId: string | null
  onSpeakToggle: (text: string, messageId: string) => void
  isRecordingAudio: boolean
  onToggleSpeechRecognition: () => void
  onOpenUrlModal?: () => void
  visionConfig?: VisionSettings
  fileConfig?: FileUpload
  inputText: string
  setInputText: (text: string) => void
  customization?: UserCustomization
}

const Chat: FC<IChatProps> = ({
  chatList,
  feedbackDisabled = false,
  onFeedback,
  checkCanSend,
  onSend = () => { },
  onStop = () => { },
  isResponding,
  darkMode = true,
  activeAgent,
  agentsList = [],
  onSelectAgent,
  isSpeakingMessageId,
  onSpeakToggle,
  isRecordingAudio,
  onToggleSpeechRecognition,
  inputText,
  setInputText,
  customization,
}) => {
  const [showAgentDropdown, setShowAgentDropdown] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [attachedFiles, setAttachedFiles] = useState<AttachedFileItem[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const dragCounterRef = useRef(0)

  const processFileList = (files: File[]) => {
    if (files.length === 0) { return }
    files.forEach((file) => {
      const fileId = `${Date.now()}-${Math.random()}`
      const isImg = file.type.startsWith('image/')
      const newFileItem: AttachedFileItem = {
        id: fileId,
        name: file.name,
        size: file.size,
        type: isImg ? 'image' : 'document',
        file,
        uploading: true,
      }

      setAttachedFiles(prev => [...prev, newFileItem])

      fileUpload({
        file,
        onProgressCallback: () => { },
        onSuccessCallback: (res) => {
          setAttachedFiles(prev => prev.map((item) => {
            if (item.id === fileId) {
              return {
                ...item,
                uploading: false,
                upload_file_id: res.id,
                url: isImg ? URL.createObjectURL(file) : file.name,
              }
            }
            return item
          }))
        },
        onErrorCallback: () => {
          setAttachedFiles(prev => prev.map((item) => {
            if (item.id === fileId) {
              return {
                ...item,
                uploading: false,
                error: true,
              }
            }
            return item
          }))
        },
      })
    })
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFiles = Array.from(e.target.files || [])
    processFileList(rawFiles)
    if (fileInputRef.current) { fileInputRef.current.value = '' }
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current += 1
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current -= 1
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0
      setIsDragging(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    dragCounterRef.current = 0

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFileList(Array.from(e.dataTransfer.files))
      e.dataTransfer.clearData()
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    if (e.clipboardData.files && e.clipboardData.files.length > 0) {
      const files = Array.from(e.clipboardData.files)
      processFileList(files)
    }
  }

  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (isResponding) { return }

    const trimmed = inputText.trim()
    const validFiles = attachedFiles.filter(f => !f.error)
    const isUploading = validFiles.some(f => f.uploading)
    if (isUploading) { return }

    if (!trimmed && validFiles.length === 0) { return }
    if (checkCanSend && !checkCanSend()) { return }

    const visionFiles: VisionFile[] = validFiles.map(f => ({
      type: f.type as any,
      transfer_method: f.upload_file_id ? TransferMethod.local_file : TransferMethod.remote_url,
      url: f.url || f.name,
      upload_file_id: f.upload_file_id || '',
    }))

    onSend(trimmed, visionFiles)
    setInputText('')
    setAttachedFiles([])
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatList, isResponding])

  const accent = ACCENT_COLOR_MAP[customization?.accentColor || 'emerald'] || ACCENT_COLOR_MAP.emerald

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="flex flex-1 flex-col h-full min-h-0 w-full relative overflow-hidden"
    >
      {/* Overlay de Drag & Drop */}
      {isDragging && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/85 backdrop-blur-md border-2 border-dashed border-emerald-500 rounded-3xl m-2 sm:m-4 pointer-events-none transition-all shadow-2xl">
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mb-3 shadow-lg shadow-emerald-500/20">
            <UploadCloud className="h-10 w-10 animate-bounce" />
          </div>
          <p className="text-sm sm:text-base font-semibold text-emerald-400">Suelta tus archivos para adjuntarlos</p>
          <p className="text-xs text-slate-400 mt-1">Soporta documentos, imágenes, PDFs, hojas de cálculo y texto</p>
        </div>
      )}

      {/* Feed de Mensajes */}
      <div className={`flex-1 overflow-y-auto px-3 sm:px-6 md:px-12 py-3 sm:py-6 space-y-3 sm:space-y-6 scrollbar-thin ${
        customization?.fontSize === 'small' ? 'text-xs' : customization?.fontSize === 'large' ? 'text-base' : 'text-sm'
      }`}>
        {chatList.map((item) => {
          if (item.isAnswer) {
            return (
              <Answer
                key={item.id}
                item={item}
                feedbackDisabled={feedbackDisabled}
                onFeedback={onFeedback}
                isResponding={isResponding}
                darkMode={darkMode}
                isSpeaking={isSpeakingMessageId === item.id}
                onSpeakToggle={onSpeakToggle}
                botAvatar={item.botAvatar || activeAgent?.avatar || customization?.botAvatar}
                botName={item.botName || activeAgent?.name || customization?.botName}
                botRole={item.botRole || activeAgent?.role}
              />
            )
          }

          return (
            <Question
              key={item.id}
              id={item.id}
              content={item.content}
              message_files={item.message_files}
              darkMode={darkMode}
              userAvatar={customization?.userAvatar}
              userName={customization?.userName}
              accentColor={customization?.accentColor}
            />
          )
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* Dock de Entrada Futurista (Centro de Mando) */}
      <div className="p-2 sm:p-4 md:px-12 md:pb-6 z-10 shrink-0">
        <div
          className={`relative max-w-4xl mx-auto rounded-2xl border shadow-xl backdrop-blur-xl transition-all ${
            darkMode
              ? 'bg-[#111625]/95 border-slate-800 focus-within:border-emerald-500/50 shadow-black/40'
              : 'bg-white/95 border-slate-200 focus-within:border-emerald-500 shadow-slate-200'
          }`}
        >
          {/* Previsualización de Archivos Adjuntos */}
          {attachedFiles.length > 0 && (
            <div className="p-2.5 sm:p-3 border-b border-inherit flex flex-wrap gap-2 max-h-36 overflow-y-auto scrollbar-thin">
              {attachedFiles.map(file => (
                <div
                  key={file.id}
                  className={`flex items-center gap-2 pl-2 pr-1.5 py-1.5 rounded-xl border text-xs shadow-sm transition-all ${
                    file.error
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                      : darkMode
                        ? 'bg-slate-800/90 border-slate-700/80 text-slate-200'
                        : 'bg-slate-100 border-slate-300 text-slate-800'
                  }`}
                >
                  {file.type === 'image' && file.url
                    ? (
                      <img src={file.url} alt={file.name} className="h-6 w-6 rounded-md object-cover" />
                    )
                    : (
                      <FileText className="h-4 w-4 text-emerald-400 shrink-0" />
                    )}

                  <span className="max-w-[120px] sm:max-w-[160px] truncate font-medium">{file.name}</span>

                  {file.uploading && <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-400" />}

                  <button
                    type="button"
                    onClick={() => removeFile(file.id)}
                    className="p-1 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Formulario de Entrada Principal */}
          <form onSubmit={handleSendMessage} className="p-2 sm:p-3 space-y-2">
            <textarea
              ref={textareaRef}
              rows={2}
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder={`Pregunta a ${activeAgent?.name || 'Carlos'}... (Shift + Enter para salto de línea)`}
              className="w-full resize-none bg-transparent px-1 py-1 text-sm outline-none placeholder:text-slate-500 font-normal leading-relaxed text-inherit"
            />

            {/* Botones de Acción */}
            <div className="flex items-center justify-between pt-1.5 sm:pt-2 border-t border-inherit">
              <div className="flex items-center gap-1 sm:gap-1.5">
                {/* Adjuntar Documento / Imagen */}
                <label
                  className={`cursor-pointer p-1.5 sm:p-2 rounded-lg transition-colors ${
                    darkMode
                      ? 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                      : 'hover:bg-slate-100 text-slate-600'
                  }`}
                  title="Subir Documento o Imagen"
                >
                  <Paperclip className="h-4 w-4" />
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>

                {/* Grabación de Voz (STT) */}
                <button
                  type="button"
                  onClick={onToggleSpeechRecognition}
                  className={`p-1.5 sm:p-2 rounded-lg transition-all cursor-pointer ${
                    isRecordingAudio
                      ? 'bg-rose-500 text-white animate-pulse shadow-md shadow-rose-500/30'
                      : darkMode
                        ? 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                        : 'hover:bg-slate-100 text-slate-600'
                  }`}
                  title={isRecordingAudio ? 'Detener dictado' : 'Dictar por voz'}
                >
                  {isRecordingAudio ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>

                {/* Selector Desplegable de Agente Dify (Multi-Agent Switcher) */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowAgentDropdown(!showAgentDropdown)}
                    className={`flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 rounded-xl font-medium text-[11px] sm:text-xs transition-all cursor-pointer border ${
                      darkMode
                        ? 'bg-slate-800/80 hover:bg-slate-800 text-slate-200 border-slate-700/60'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
                    }`}
                  >
                    <img
                      src={activeAgent?.avatar || 'https://studioalvarodiaz.es/wp-content/uploads/2026/07/Carlos-scaled.jpg'}
                      alt={activeAgent?.name || 'Carlos'}
                      className="h-4 w-4 rounded-full object-cover shrink-0 border border-slate-600"
                    />
                    <span className="font-semibold">{activeAgent?.name || 'CARLOS'}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded border hidden sm:inline-block ${activeAgent?.badgeColor || 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                      {activeAgent?.role || 'Director'}
                    </span>
                    <ChevronDown className="h-3 w-3 opacity-60 shrink-0" />
                  </button>

                  {showAgentDropdown && (
                    <div
                      className={`absolute bottom-full mb-2 left-0 w-[calc(100vw-1.5rem)] max-w-sm sm:w-80 rounded-2xl border p-2 shadow-2xl z-50 max-h-[70vh] overflow-y-auto scrollbar-thin ${
                        darkMode ? 'bg-[#0E1422] border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
                      }`}
                    >
                      <div className="px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                        <span>Seleccionar Agente Dify</span>
                        <span className="text-[9px] text-emerald-400 font-mono">7 Bots Disponibles</span>
                      </div>

                      <div className="space-y-1 mt-1">
                        {agentsList.map(agent => (
                          <button
                            key={agent.id}
                            type="button"
                            onClick={() => {
                              onSelectAgent?.(agent)
                              setShowAgentDropdown(false)
                            }}
                            className={`w-full flex items-start gap-2.5 p-2 rounded-xl text-left transition-all cursor-pointer ${
                              activeAgent?.id === agent.id
                                ? darkMode ? 'bg-slate-800 text-white border border-slate-700 shadow-sm' : 'bg-slate-100 text-slate-900 border border-slate-300'
                                : darkMode ? 'hover:bg-slate-800/60 text-slate-300' : 'hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <img
                              src={agent.avatar}
                              alt={agent.name}
                              className="h-8 w-8 rounded-xl object-cover shrink-0 mt-0.5 border border-slate-700"
                            />
                            <div className="flex flex-col flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold truncate">{agent.name}</span>
                                <span className={`text-[9px] px-1.5 py-0.5 rounded border font-mono font-medium ${agent.badgeColor}`}>
                                  {agent.role}
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{agent.subtitle}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Botón Ejecutar / Detener */}
              {isResponding
                ? (
                  <button
                    type="button"
                    onClick={onStop}
                    className="p-2 sm:p-2.5 rounded-xl transition-all bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 shadow-sm active:scale-95 cursor-pointer flex items-center justify-center"
                    title="Detener respuesta"
                  >
                    <Square className="h-4 w-4 fill-rose-400 text-rose-400" />
                  </button>
                )
                : (
                  <button
                    type="submit"
                    disabled={(!inputText.trim() && attachedFiles.length === 0) || attachedFiles.some(f => f.uploading)}
                    className={`p-2 sm:p-2.5 rounded-xl transition-all shadow-md flex items-center justify-center ${
                      (inputText.trim() || attachedFiles.length > 0) && !attachedFiles.some(f => f.uploading)
                        ? `bg-gradient-to-r ${accent.gradient} hover:opacity-95 text-slate-950 shadow-md cursor-pointer active:scale-95`
                        : 'bg-slate-800/40 text-slate-500 cursor-not-allowed border border-slate-700/30'
                    }`}
                    title="Enviar mensaje"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                )}
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default React.memo(Chat)
