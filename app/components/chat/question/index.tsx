'use client'
import type { FC } from 'react'
import React from 'react'
import { FileText } from 'lucide-react'
import ImageGallery from '@/app/components/base/image-gallery'
import type { VisionFile } from '@/types/app'

interface IQuestionProps {
  id: string
  content: string
  timestamp?: string
  imgSrcs?: string[]
  message_files?: VisionFile[]
  darkMode?: boolean
}

const Question: FC<IQuestionProps> = ({
  id,
  content,
  timestamp,
  imgSrcs = [],
  message_files = [],
  darkMode = true,
}) => {
  const images = (imgSrcs.length > 0
    ? imgSrcs
    : message_files.filter(f => f.type === 'image' || !f.type).map(f => f.url).filter(Boolean)) as string[]

  const docFiles = message_files.filter(f => f.type !== 'image' && f.type)

  return (
    <div key={id} className="flex gap-2 sm:gap-4 max-w-4xl mx-auto justify-end w-full">
      <div className="flex flex-col space-y-1 max-w-[88%] sm:max-w-[80%] items-end">
        {/* Burbuja Principal */}
        <div
          className={`relative px-3 sm:px-4 py-2.5 sm:py-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
            darkMode
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-tr-sm shadow-md'
              : 'bg-slate-900 text-white rounded-tr-sm shadow-md'
          }`}
        >
          {/* Imágenes adjuntas */}
          {images.length > 0 && (
            <div className="mb-2">
              <ImageGallery srcs={images} />
            </div>
          )}

          {/* Archivos / URLs adjuntos */}
          {docFiles.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {docFiles.map((file, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-md bg-black/20 text-[10px] sm:text-[11px] font-mono text-emerald-100"
                >
                  <FileText className="h-3 w-3 shrink-0" />
                  <span className="truncate max-w-[140px] sm:max-w-[180px]">{file.url || 'Documento adjunto'}</span>
                </div>
              ))}
            </div>
          )}

          <div className="whitespace-pre-wrap font-normal">{content}</div>
        </div>

        {/* Timestamp */}
        <div className={`flex items-center gap-2 text-[10px] sm:text-[11px] px-1 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
          <span>{timestamp || 'Ahora'}</span>
        </div>
      </div>

      {/* Avatar del Usuario */}
      <div className="flex h-7 w-7 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-[10px] sm:text-xs font-bold shadow-md select-none">
        AD
      </div>
    </div>
  )
}

export default React.memo(Question)
