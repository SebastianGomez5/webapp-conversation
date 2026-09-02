'use client'
import type { FC } from 'react'
import React, { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CheckCircle2, RefreshCw } from 'lucide-react'
import type { ToolInfoInThought } from '../type'
import DataSetIcon from '@/app/components/base/icons/public/data-set'
import type { Emoji } from '@/types/tools'
import AppIcon from '@/app/components/base/app-icon'

interface Props {
  payload: ToolInfoInThought
  allToolIcons?: Record<string, string | Emoji>
}

const getIcon = (toolName: string, allToolIcons: Record<string, string | Emoji>) => {
  if (toolName.startsWith('dataset-')) { return <DataSetIcon className="shrink-0"></DataSetIcon> }
  const icon = allToolIcons[toolName]
  if (!icon) { return null }
  return (
    typeof icon === 'string'
      ? (
        <div
          className="w-3.5 h-3.5 bg-cover bg-center rounded-[3px] shrink-0"
          style={{
            backgroundImage: `url(${icon})`,
          }}
        ></div>
      )
      : (
        <AppIcon
          className="rounded-[3px] shrink-0"
          size="xs"
          icon={icon?.content}
          background={icon?.background}
        />
      ))
}

const Tool: FC<Props> = ({
  payload,
  allToolIcons = {},
}) => {
  const { t } = useTranslation()
  const { name, isFinished, latency, created_at } = payload
  const toolName = name.startsWith('dataset-') ? t('dataset.knowledge') : name
  const icon = getIcon(toolName, allToolIcons) as any

  const [elapsedTime, setElapsedTime] = useState<number | null>(() => {
    if (latency !== undefined && latency !== null && Number(latency) > 0) {
      return typeof latency === 'number' ? latency : parseFloat(latency)
    }
    return null
  })
  const startTimeRef = useRef<number>(
    created_at ? (created_at > 1e11 ? created_at : created_at * 1000) : Date.now(),
  )

  useEffect(() => {
    if (latency !== undefined && latency !== null && Number(latency) > 0) {
      setElapsedTime(typeof latency === 'number' ? latency : parseFloat(latency))
      return
    }

    if (!isFinished) {
      if (!startTimeRef.current) { startTimeRef.current = Date.now() }
      const interval = setInterval(() => {
        setElapsedTime((Date.now() - startTimeRef.current) / 1000)
      }, 100)
      return () => clearInterval(interval)
    }
    else {
      if (startTimeRef.current) {
        const finalTime = (Date.now() - startTimeRef.current) / 1000
        setElapsedTime(finalTime > 0.05 ? finalTime : 0.1)
      }
    }
  }, [isFinished, latency])

  const formattedTime = elapsedTime !== null && elapsedTime > 0
    ? `${elapsedTime.toFixed(2)}s`
    : ''

  return (
    <div className="my-1.5">
      <div className="shadow-sm inline-flex items-center max-w-full overflow-x-auto bg-slate-900/90 rounded-lg border border-slate-800 px-3 py-1.5 space-x-2 text-[11px] font-mono text-slate-300">
        {!isFinished && (
          <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin shrink-0" />
        )}
        {isFinished && (
          icon || <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        )}
        <span className="text-slate-400 shrink-0">
          {isFinished ? 'Ejecutado' : 'Ejecutando'}
        </span>
        <span
          className="font-medium text-slate-200 truncate max-w-[280px] sm:max-w-none"
          title={toolName}
        >
          {toolName}
        </span>
        {formattedTime && (
          <span className="px-1.5 py-0.5 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded shrink-0 select-none">
            {formattedTime}
          </span>
        )}
      </div>
    </div>
  )
}
export default React.memo(Tool)
