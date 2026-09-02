'use client'
import React from 'react'
import type { FC } from 'react'
import {
  Plus,
  Search,
  Trash2,
  Settings,
  X,
} from 'lucide-react'
import type { ConversationItem } from '@/types/app'

export interface ISidebarProps {
  list: ConversationItem[]
  currentId: string
  onCurrentIdChange: (id: string) => void
  onNewChat: () => void
  onDeleteChat?: (id: string) => void
  darkMode: boolean
  sidebarOpen: boolean
  onCloseSidebarMobile?: () => void
  onOpenSettings: () => void
  searchQuery: string
  onSearchQueryChange: (query: string) => void
  copyRight?: string
}

const Sidebar: FC<ISidebarProps> = ({
  list,
  currentId,
  onCurrentIdChange,
  onNewChat,
  onDeleteChat,
  darkMode,
  sidebarOpen,
  onCloseSidebarMobile,
  onOpenSettings,
  searchQuery,
  onSearchQueryChange,
}) => {
  const filteredList = list.filter(item =>
    (item.name || '').toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <aside
      className={`relative flex flex-col h-full border-r transition-all duration-300 ease-in-out shrink-0 ${
        sidebarOpen ? 'w-80' : 'w-0 -translate-x-full md:w-20 md:translate-x-0'
      } ${
        darkMode
          ? 'border-slate-800/70 bg-[#0E131F]/95 text-slate-100'
          : 'border-slate-200/80 bg-white text-slate-800'
      }`}
    >
      {/* Logo & Marca */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-inherit shrink-0">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-emerald-400 text-slate-950 shadow-md shadow-amber-500/20 overflow-hidden">
            <img
              src="https://studioalvarodiaz.es/wp-content/uploads/2026/07/ICONO-simbolo-del-vortice.png"
              alt="Logo"
              className="w-5 h-5 object-contain"
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = 'none'
              }}
            />
          </div>
          {sidebarOpen && (
            <div className="flex flex-col truncate">
              <span className="text-sm font-semibold tracking-wide truncate">Studio Álvaro Díaz</span>
              <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                VPS Hostinger Activo
              </span>
            </div>
          )}
        </div>

        {/* Mobile close button */}
        {onCloseSidebarMobile && (
          <button
            onClick={onCloseSidebarMobile}
            className="md:hidden p-1 rounded-lg text-slate-400 hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Botón Nuevo Chat */}
      <div className="p-3 shrink-0">
        <button
          onClick={onNewChat}
          className={`w-full flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-sm font-medium transition-all shadow-sm ${
            darkMode
              ? 'bg-slate-800/90 hover:bg-slate-700 text-slate-100 border border-slate-700/50 hover:border-slate-600'
              : 'bg-slate-900 hover:bg-slate-800 text-white'
          }`}
        >
          <Plus className="h-4 w-4" />
          {sidebarOpen && <span>Nueva conversación</span>}
        </button>
      </div>

      {/* Barra de Búsqueda de Chats */}
      {sidebarOpen && (
        <div className="px-3 pb-2 shrink-0">
          <div
            className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs ${
              darkMode ? 'bg-slate-900/60 text-slate-400' : 'bg-slate-100 text-slate-500'
            }`}
          >
            <Search className="h-3.5 w-3.5 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => onSearchQueryChange(e.target.value)}
              placeholder="Buscar conversaciones..."
              className="w-full bg-transparent outline-none placeholder:text-inherit text-xs"
            />
          </div>
        </div>
      )}

      {/* Lista de Conversaciones */}
      <div className="flex-1 overflow-y-auto px-2 space-y-1 scrollbar-thin">
        {filteredList.map((chat) => {
          const isActive = chat.id === currentId
          return (
            <div
              key={chat.id}
              onClick={() => onCurrentIdChange(chat.id)}
              className={`group relative flex cursor-pointer items-center justify-between rounded-xl px-3 py-2.5 text-xs transition-all ${
                isActive
                  ? darkMode
                    ? 'bg-slate-800/80 text-white shadow-sm border border-slate-700/60 font-medium'
                    : 'bg-slate-100 text-slate-900 font-semibold shadow-sm'
                  : darkMode
                    ? 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <div
                  className={`h-2 w-2 rounded-full shrink-0 ${
                    isActive ? 'bg-amber-400 shadow-sm shadow-amber-400/50' : 'bg-slate-600'
                  }`}
                ></div>
                {sidebarOpen && <span className="truncate">{chat.name || 'Nueva conversación'}</span>}
              </div>

              {sidebarOpen && onDeleteChat && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeleteChat(chat.id)
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-400 transition-opacity"
                  title="Eliminar chat"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer del Sidebar: Perfil y Ajustes */}
      <div
        className={`p-3 border-t border-inherit flex items-center justify-between shrink-0 ${
          darkMode ? 'bg-slate-950/50' : 'bg-slate-50'
        }`}
      >
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold border border-slate-700 text-slate-200">
              AD
            </div>
            <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-slate-900"></span>
          </div>
          {sidebarOpen && (
            <div className="flex flex-col">
              <span className="text-xs font-medium truncate">Álvaro Díaz</span>
              <span className="text-[10px] text-slate-400">Admin Pro</span>
            </div>
          )}
        </div>

        {sidebarOpen && (
          <div className="flex items-center gap-1">
            <button
              onClick={onOpenSettings}
              className={`p-1.5 rounded-lg transition-colors ${
                darkMode
                  ? 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                  : 'hover:bg-slate-200 text-slate-600'
              }`}
              title="Configuración de Infraestructura"
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}

export default React.memo(Sidebar)
