'use client'
import type { FC } from 'react'
import React, { useEffect, useRef, useState } from 'react'
import {
  Paperclip,
  Globe,
  Mic,
  MicOff,
  CornerDownLeft,
  ChevronDown,
  FileText,
  X,
  Square,
  Loader2,
} from 'lucide-react'
import type { FeedbackFunc } from './type'
import Answer from './answer'
import Question from './question'
import type { ChatItem, VisionFile, VisionSettings } from '@/types/app'
import { TransferMethod } from '@/types/app'
import type { FileUpload } from '@/app/components/base/file-uploader-in-attachment/types'
import { fileUpload } from '@/app/components/base/file-uploader-in-attachment/utils'

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
  selectedSkill: any
  setSelectedSkill: (skill: any) => void
  skills: any[]
  documentTemplates: any[]
  selectedDocTemplate: any
  setSelectedDocTemplate: (doc: any) => void
  isSpeakingMessageId: string | null
  onSpeakToggle: (text: string, messageId: string) => void
  isRecordingAudio: boolean
  onToggleSpeechRecognition: () => void
  onOpenUrlModal: () => void
  visionConfig?: VisionSettings
  fileConfig?: FileUpload
  inputText: string
  setInputText: (text: string) => void
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
  selectedSkill,
  setSelectedSkill,
  skills,
  documentTemplates,
  selectedDocTemplate,
  setSelectedDocTemplate,
  isSpeakingMessageId,
  onSpeakToggle,
  isRecordingAudio,
  onToggleSpeechRecognition,
  onOpenUrlModal,
  inputText,
  setInputText,
}) => {
  const [showSkillDropdown, setShowSkillDropdown] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [attachedFiles, setAttachedFiles] = useState<AttachedFileItem[]>([])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFiles = Array.from(e.target.files || [])
    if (rawFiles.length > 0) {
      rawFiles.forEach((file) => {
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
    if (fileInputRef.current) { fileInputRef.current.value = '' }
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

  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatList, isResponding])

  return (
    <div className="flex flex-1 flex-col h-full min-h-0 w-full relative overflow-hidden">
      {/* Feed de Mensajes */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-6 md:px-12 py-3 sm:py-6 space-y-3 sm:space-y-6 scrollbar-thin">
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
          {/* Chips de Adjuntos Pendientes */}
          {attachedFiles.length > 0 && (
            <div className="flex flex-wrap gap-1.5 sm:gap-2 px-3 sm:px-4 pt-2.5">
              {attachedFiles.map(file => (
                <div
                  key={file.id}
                  className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-mono border ${
                    file.error
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                      : darkMode
                        ? 'bg-slate-800/80 border-slate-700 text-slate-200'
                        : 'bg-slate-100 border-slate-300 text-slate-800'
                  }`}
                >
                  {file.uploading
                    ? (
                      <Loader2 className="h-3 w-3 animate-spin text-amber-400 shrink-0" />
                    )
                    : file.type === 'url'
                      ? (
                        <Globe className="h-3 w-3 text-cyan-400 shrink-0" />
                      )
                      : (
                        <FileText className="h-3 w-3 text-amber-400 shrink-0" />
                      )}
                  <span className="max-w-[110px] sm:max-w-[150px] truncate">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => setAttachedFiles(attachedFiles.filter(i => i.id !== file.id))}
                    className="hover:text-rose-400 transition-colors shrink-0 cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Barra de Herramientas y Habilidades */}
          <div className="flex items-center justify-between px-3 sm:px-4 pt-2 text-xs gap-2">
            {/* Selector Desplegable de Habilidad del Chat */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowSkillDropdown(!showSkillDropdown)}
                className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg font-medium text-[11px] sm:text-xs transition-all ${
                  darkMode
                    ? 'bg-slate-800/60 hover:bg-slate-800 text-slate-300 border border-slate-700/50'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {selectedSkill?.icon && <selectedSkill.icon className={`h-3.5 w-3.5 shrink-0 ${selectedSkill.color || 'text-emerald-400'}`} />}
                <span className="truncate max-w-[130px] sm:max-w-none">Habilidad: {selectedSkill?.name || 'General'}</span>
                <ChevronDown className="h-3 w-3 opacity-60 shrink-0" />
              </button>

              {showSkillDropdown && (
                <div
                  className={`absolute bottom-full mb-2 left-0 w-[calc(100vw-1.5rem)] max-w-sm sm:w-96 rounded-2xl border p-2 shadow-2xl z-50 max-h-[70vh] overflow-y-auto scrollbar-thin ${
                    darkMode ? 'bg-[#0E1422] border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Habilidad del Chat</div>

                  <div className="space-y-1">
                    {skills.map(s => (
                      <div key={s.id} className="space-y-1">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSkill(s)
                            if (!s.isDocumentGenerator) {
                              setSelectedDocTemplate(null)
                              setShowSkillDropdown(false)
                            }
                          }}
                          className={`w-full flex items-start gap-2.5 p-2 rounded-xl text-left transition-all ${
                            selectedSkill?.id === s.id
                              ? darkMode ? 'bg-slate-800/90 text-white border border-slate-700' : 'bg-slate-100 text-slate-900 border border-slate-300'
                              : darkMode ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'
                          }`}
                        >
                          <s.icon className={`h-4 w-4 mt-0.5 shrink-0 ${s.color}`} />
                          <div className="flex flex-col flex-1 min-w-0">
                            <span className="text-xs font-semibold flex items-center justify-between">
                              <span className="truncate">{s.name}</span>
                              {s.isDocumentGenerator && (
                                <span className="text-[10px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/20 shrink-0 ml-1">3 Tipos</span>
                              )}
                            </span>
                            <span className="text-[10px] text-slate-400 line-clamp-2">{s.desc}</span>
                          </div>
                        </button>

                        {/* Opciones de Documentos al seleccionar Generador */}
                        {s.isDocumentGenerator && selectedSkill?.id === s.id && (
                          <div className={`ml-4 pl-3 border-l-2 space-y-1.5 my-1.5 ${darkMode ? 'border-amber-500/40' : 'border-amber-400'}`}>
                            <div className="text-[10px] font-semibold text-amber-400/90 uppercase tracking-wider">Opciones de Documento:</div>
                            {documentTemplates.map(doc => (
                              <button
                                key={doc.id}
                                type="button"
                                onClick={() => {
                                  setSelectedDocTemplate(doc)
                                  setInputText(doc.prompt)
                                  setShowSkillDropdown(false)
                                }}
                                className={`w-full text-left p-2 rounded-lg border transition-all ${
                                  selectedDocTemplate?.id === doc.id
                                    ? darkMode
                                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-200'
                                      : 'bg-amber-100 border-amber-300 text-amber-900'
                                    : darkMode
                                      ? 'bg-slate-900/60 border-slate-800 hover:bg-slate-850 text-slate-300'
                                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                                }`}
                              >
                                <div className="flex items-center justify-between text-[11px] font-medium">
                                  <span>{doc.title}</span>
                                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-black/20 text-amber-400 font-mono">{doc.badge}</span>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{doc.desc}</p>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Indicador de Estado de Conexión */}
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 shrink-0">
              <span className="flex items-center gap-1 font-mono">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50 animate-pulse"></span>
                <span className="hidden sm:inline">Conexión Amyet IA / Studio</span>
                <span className="sm:hidden text-emerald-400">Online</span>
              </span>
            </div>
          </div>

          {/* Caja de Texto Principal */}
          <form onSubmit={handleSendMessage} className="p-2 sm:p-3 pt-1">
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage()
                }
              }}
              rows={2}
              placeholder={
                isRecordingAudio
                  ? 'Escuchando tu voz...'
                  : 'Escribe una instrucción, consulta de CRM o tarea...'
              }
              className="w-full resize-none bg-transparent px-1 py-1 text-sm outline-none placeholder:text-slate-500 font-normal leading-relaxed text-inherit"
            />

            {/* Botones de Acción */}
            <div className="flex items-center justify-between pt-1.5 sm:pt-2 border-t border-inherit">
              <div className="flex items-center gap-0.5 sm:gap-1">
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

                {/* Analizar URL Web */}
                <button
                  type="button"
                  onClick={onOpenUrlModal}
                  className={`p-1.5 sm:p-2 rounded-lg transition-colors ${
                    darkMode
                      ? 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                      : 'hover:bg-slate-100 text-slate-600'
                  }`}
                  title="Analizar Página Web o API"
                >
                  <Globe className="h-4 w-4" />
                </button>

                {/* Grabación de Voz (STT) */}
                <button
                  type="button"
                  onClick={onToggleSpeechRecognition}
                  className={`p-1.5 sm:p-2 rounded-lg transition-all ${
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
              </div>

              {/* Botón Ejecutar / Detener */}
              {isResponding
                ? (
                  <button
                    type="button"
                    onClick={onStop}
                    className="flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-semibold transition-all bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 shadow-sm active:scale-95 cursor-pointer"
                    title="Detener respuesta"
                  >
                    <Square className="h-3 w-3 fill-rose-400 text-rose-400" />
                    <span>Detener</span>
                  </button>
                )
                : (
                  <button
                    type="submit"
                    disabled={(!inputText.trim() && attachedFiles.length === 0) || attachedFiles.some(f => f.uploading)}
                    className={`flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-semibold transition-all shadow-md ${
                      (inputText.trim() || attachedFiles.length > 0) && !attachedFiles.some(f => f.uploading)
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-emerald-500/20 cursor-pointer'
                        : 'bg-slate-800/40 text-slate-500 cursor-not-allowed border border-slate-700/30'
                    }`}
                  >
                    <span>Ejecutar</span>
                    <CornerDownLeft className="h-3 w-3" />
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
