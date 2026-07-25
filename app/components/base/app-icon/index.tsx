import type { FC } from 'react'
import classNames from 'classnames'
import style from './style.module.css'
import { APP_INFO } from '@/config'

export interface AppIconProps {
  size?: 'xs' | 'tiny' | 'small' | 'medium' | 'large'
  rounded?: boolean
  icon?: string
  background?: string
  className?: string
}

const AppIcon: FC<AppIconProps> = ({
  size = 'medium',
  rounded = false,
  background,
  className,
  icon,
}) => {
  const defaultLogo = APP_INFO.icon_url || 'https://studioalvarodiaz.es/wp-content/uploads/2026/07/ICONO-simbolo-del-vortice.png'
  const isUrl = icon && (icon.startsWith('http://') || icon.startsWith('https://') || icon.startsWith('/'))
  const logoSrc = isUrl ? icon : defaultLogo

  return (
    <span
      className={classNames(
        style.appIcon,
        size !== 'medium' && style[size],
        rounded && style.rounded,
        className ?? '',
      )}
      style={{
        background: background || 'transparent',
      }}
    >
      {logoSrc
        ? (
          <img src={logoSrc} alt="Logo" className="w-full h-full object-contain p-0.5" />
        )
        : (
          icon || '🤖'
        )}
    </span>
  )
}

export default AppIcon
