'use client'
import type { FC } from 'react'
import React from 'react'
import { Download, FileText } from 'lucide-react'
import ImageGallery from '@/app/components/base/image-gallery'
import { ACCENT_COLOR_MAP } from '@/app/components/settings/customization-modal'
import type { VisionFile } from '@/types/app'

interface IQuestionProps {
  id: string
  content: string
  timestamp?: string
  created_at?: number
  imgSrcs?: string[]
  message_files?: VisionFile[]
  darkMode?: boolean
  userAvatar?: string
  userName?: string
  accentColor?: string
}

const Question: FC<IQuestionProps> = ({
  id,
  content,
  timestamp,
  created_at,
  imgSrcs = [],
  message_files = [],
  darkMode = true,
  userAvatar,
  userName,
  accentColor = 'emerald',
}) => {
  const images = (imgSrcs.length > 0
    ? imgSrcs
    : message_files.filter(f => f.type === 'image' || !f.type).map(f => f.url).filter(Boolean)) as string[]

  const docFiles = message_files.filter(f => f.type !== 'image' && f.type)

  const accent = ACCENT_COLOR_MAP[(accentColor as keyof typeof ACCENT_COLOR_MAP) || 'emerald'] || ACCENT_COLOR_MAP.emerald

  const userInitials = (userName || 'AD')
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()

  const formattedTime = (() => {
    if (timestamp && timestamp !== 'Ahora')
    { return timestamp }
    if (created_at) {
      const date = new Date(created_at > 1e11 ? created_at : created_at * 1000)
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  })()

  return (
    <div key={id} className="flex gap-2 sm:gap-4 max-w-4xl mx-auto justify-end w-full">
      <div className="flex flex-col space-y-1 max-w-[88%] sm:max-w-[80%] items-end">
        {/* Burbuja Principal */}
        <div
          className={`relative px-3 sm:px-4 py-2.5 sm:py-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed select-text ${
            darkMode
              ? `bg-gradient-to-r ${accent.bubbleUser} text-white rounded-tr-sm shadow-md`
              : 'bg-slate-900 text-white rounded-tr-sm shadow-md'
          }`}
        >
          {/* Imágenes adjuntas */}
          {images.length > 0 && (
            <div className="mb-2">
              <ImageGallery srcs={images} />
            </div>
          )}

          {/* Archivos / URLs adjuntos con opción de descarga */}
          {docFiles.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {docFiles.map((file, idx) => {
                const displayName = file.name || (file.url && !file.url.startsWith('http') && !file.url.startsWith('blob:') ? file.url : 'Documento adjunto')
                const hasDownloadableUrl = file.url && (file.url.startsWith('http') || file.url.startsWith('blob:') || file.url.startsWith('data:'))

                return (
                  <div
                    key={idx}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/25 hover:bg-black/35 border border-white/10 text-xs text-white/95 transition-all shadow-sm"
                  >
                    <div className="p-1 rounded bg-white/10 text-emerald-300">
                      <FileText className="h-3.5 w-3.5 shrink-0" />
                    </div>
                    <div className="flex flex-col min-w-0 pr-1">
                      <span className="truncate max-w-[180px] sm:max-w-[240px] font-medium text-[11px] sm:text-xs">
                        {displayName}
                      </span>
                      {file.size
                        ? (
                          <span className="text-[9px] text-white/60">
                            {(file.size / 1024).toFixed(1)} KB
                          </span>
                        )
                        : null}
                    </div>
                    {hasDownloadableUrl && (
                      <a
                        href={file.url}
                        download={file.name || displayName}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 rounded hover:bg-white/20 text-white/70 hover:text-white transition-colors"
                        title="Descargar o abrir archivo"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          <div className="whitespace-pre-wrap font-normal select-text">{content}</div>
        </div>

        {/* Timestamp */}
        <div className={`flex items-center gap-2 text-[10px] sm:text-[11px] px-1 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
          <span>{formattedTime}</span>
        </div>
      </div>

      {/* Avatar del Usuario */}
      <div className="flex h-7 w-7 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-[10px] sm:text-xs font-bold shadow-md select-none overflow-hidden">
        {userAvatar
          ? (
            <img src={userAvatar} alt={userName || 'Usuario'} className="w-full h-full object-cover" />
          )
          : (
            <span>{userInitials}</span>
          )}
      </div>
    </div>
  )
}

export default React.memo(Question)
