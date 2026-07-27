'use client'
import type { FC } from 'react'
import React, { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { ToolInfoInThought } from '../type'
import Loading02 from '@/app/components/base/icons/line/loading-02'
import CheckCircle from '@/app/components/base/icons/solid/general/check-circle'
import DataSetIcon from '@/app/components/base/icons/public/data-set'
import type { Emoji } from '@/types/tools'
import AppIcon from '@/app/components/base/app-icon'

interface Props {
  payload: ToolInfoInThought
  allToolIcons?: Record<string, string | Emoji>
}

const getIcon = (toolName: string, allToolIcons: Record<string, string | Emoji>) => {
  if (toolName.startsWith('dataset-')) { return <DataSetIcon className='shrink-0'></DataSetIcon> }
  const icon = allToolIcons[toolName]
  if (!icon) { return null }
  return (
    typeof icon === 'string'
      ? (
        <div
          className='w-3.5 h-3.5 bg-cover bg-center rounded-[3px] shrink-0'
          style={{
            backgroundImage: `url(${icon})`,
          }}
        ></div>
      )
      : (
        <AppIcon
          className='rounded-[3px] shrink-0'
          size='xs'
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
    <div className='my-1'>
      <div className='shadow-sm inline-flex items-center max-w-full overflow-x-auto bg-white rounded-md border border-gray-100/80 px-2.5 h-7 space-x-1.5'>
        {!isFinished && (
          <Loading02 className='w-3.5 h-3.5 text-gray-500 animate-spin shrink-0' />
        )}
        {isFinished && (
          icon || <CheckCircle className='w-3.5 h-3.5 text-[#12B76A] shrink-0' />
        )}
        <span className='text-xs font-medium text-gray-500 shrink-0'>
          {t(`tools.thought.${isFinished ? 'used' : 'using'}`)}
        </span>
        <span
          className='text-xs font-medium text-gray-700 truncate max-w-[280px] sm:max-w-none'
          title={toolName}
        >
          {toolName}
        </span>
        {formattedTime && (
          <span className='ml-1 px-1.5 py-0.5 text-[11px] font-mono font-normal text-gray-500 bg-gray-100/80 rounded shrink-0 select-none'>
            {formattedTime}
          </span>
        )}
      </div>
    </div>
  )
}
export default React.memo(Tool)
