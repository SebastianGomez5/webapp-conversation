import type { AppInfo } from '@/types/app'

export const APP_ID = (process.env.NEXT_PUBLIC_APP_ID && process.env.NEXT_PUBLIC_APP_ID !== 'undefined')
  ? process.env.NEXT_PUBLIC_APP_ID
  : 'ee91a6fb-c1a4-4293-9707-7268f647c4f7'

export const API_KEY = (process.env.NEXT_PUBLIC_APP_KEY && process.env.NEXT_PUBLIC_APP_KEY !== 'undefined')
  ? process.env.NEXT_PUBLIC_APP_KEY
  : 'app-fIlrxVzyja4bfpRV41YmqI0t'

export const API_URL = (process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL !== 'undefined')
  ? process.env.NEXT_PUBLIC_API_URL
  : 'https://agents.elestructurador.com/v1'

export const APP_INFO: AppInfo = {
  title: 'Studio Álvaro Díaz',
  description: 'Agente que controlará todo el ecosistema de Studio Álvaro Díaz',
  copyright: '© 2026 Studio Álvaro Díaz',
  privacy_policy: '',
  default_language: 'es',
  disable_session_same_site: true, // Habilitado para permitir incrustación en iframes
  icon_url: 'https://studioalvarodiaz.es/wp-content/uploads/2026/07/ICONO-simbolo-del-vortice.png',
}

export const isShowPrompt = false
export const promptTemplate = 'I want you to act as a javascript console.'

export const API_PREFIX = '/api'

export const LOCALE_COOKIE_NAME = 'locale'

export const DEFAULT_VALUE_MAX_LEN = 48
