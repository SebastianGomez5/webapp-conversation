'use client'
import React, { useRef, useState } from 'react'
import type { FC } from 'react'
import {
  User,
  Palette,
  Volume2,
  X,
  Camera,
  Trash2,
  Check,
  Sparkles,
  Bot,
  Sun,
  Moon,
  Sliders,
} from 'lucide-react'

export interface UserCustomization {
  userName: string
  userRole: string
  userAvatar: string
  botAvatar: string
  botName: string
  accentColor: 'emerald' | 'cyan' | 'amber' | 'violet' | 'rose' | 'blue'
  fontSize: 'small' | 'normal' | 'large'
  speechRate: number
}

export const DEFAULT_CUSTOMIZATION: UserCustomization = {
  userName: 'Álvaro Díaz',
  userRole: 'Admin Pro',
  userAvatar: '',
  botAvatar: 'https://studioalvarodiaz.es/wp-content/uploads/2026/07/Carlos-scaled.jpg',
  botName: 'Carlos - Asistente IA',
  accentColor: 'emerald',
  fontSize: 'normal',
  speechRate: 1,
}

export const ACCENT_COLOR_MAP = {
  emerald: {
    label: 'Esmeralda Neón',
    badge: 'bg-emerald-500 text-slate-950',
    primary: 'emerald',
    gradient: 'from-emerald-500 to-teal-500',
    bubbleUser: 'from-emerald-600 to-teal-600',
    text: 'text-emerald-400',
    border: 'border-emerald-500',
    ring: 'ring-emerald-500',
    bgLight: 'bg-emerald-500/10',
  },
  cyan: {
    label: 'Cyberpunk Cyan',
    badge: 'bg-cyan-500 text-slate-950',
    primary: 'cyan',
    gradient: 'from-cyan-500 to-blue-500',
    bubbleUser: 'from-cyan-600 to-blue-600',
    text: 'text-cyan-400',
    border: 'border-cyan-500',
    ring: 'ring-cyan-500',
    bgLight: 'bg-cyan-500/10',
  },
  amber: {
    label: 'Ámbar Dorado',
    badge: 'bg-amber-500 text-slate-950',
    primary: 'amber',
    gradient: 'from-amber-500 to-orange-500',
    bubbleUser: 'from-amber-600 to-orange-600',
    text: 'text-amber-400',
    border: 'border-amber-500',
    ring: 'ring-amber-500',
    bgLight: 'bg-amber-500/10',
  },
  violet: {
    label: 'Púrpura Galáctico',
    badge: 'bg-violet-500 text-white',
    primary: 'violet',
    gradient: 'from-violet-500 to-purple-600',
    bubbleUser: 'from-violet-600 to-purple-600',
    text: 'text-violet-400',
    border: 'border-violet-500',
    ring: 'ring-violet-500',
    bgLight: 'bg-violet-500/10',
  },
  rose: {
    label: 'Rubí Coral',
    badge: 'bg-rose-500 text-white',
    primary: 'rose',
    gradient: 'from-rose-500 to-pink-600',
    bubbleUser: 'from-rose-600 to-pink-600',
    text: 'text-rose-400',
    border: 'border-rose-500',
    ring: 'ring-rose-500',
    bgLight: 'bg-rose-500/10',
  },
  blue: {
    label: 'Azul Ejecutivo',
    badge: 'bg-blue-600 text-white',
    primary: 'blue',
    gradient: 'from-blue-600 to-indigo-600',
    bubbleUser: 'from-blue-600 to-indigo-600',
    text: 'text-blue-400',
    border: 'border-blue-500',
    ring: 'ring-blue-500',
    bgLight: 'bg-blue-500/10',
  },
}

const PRESET_USER_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
]

const PRESET_BOT_AVATARS = [
  'https://studioalvarodiaz.es/wp-content/uploads/2026/07/Carlos-scaled.jpg',
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1633409381648-524a8fc48598?w=150&auto=format&fit=crop&q=80',
]

export interface ICustomizationModalProps {
  isOpen: boolean
  onClose: () => void
  customization: UserCustomization
  onSave: (newSettings: UserCustomization) => void
  darkMode: boolean
  setDarkMode: (val: boolean) => void
}

export const CustomizationModal: FC<ICustomizationModalProps> = ({
  isOpen,
  onClose,
  customization,
  onSave,
  darkMode,
  setDarkMode,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'visual' | 'voice'>('profile')
  const [formData, setFormData] = useState<UserCustomization>(customization)
  const userPhotoInputRef = useRef<HTMLInputElement>(null)
  const botPhotoInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) { return null }

  const handleUserPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setFormData(prev => ({ ...prev, userAvatar: reader.result as string }))
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleBotPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setFormData(prev => ({ ...prev, botAvatar: reader.result as string }))
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSaveAll = () => {
    onSave(formData)
    onClose()
  }

  const userInitials = (formData.userName || 'AD')
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-3 sm:p-4 animate-in fade-in duration-200">
      <div
        className={`relative w-full max-w-2xl rounded-3xl border shadow-2xl flex flex-col max-h-[90vh] overflow-hidden ${
          darkMode ? 'bg-[#0B0F19] border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Cabecera del Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-inherit shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-500/20 to-emerald-500/20 text-amber-400 border border-amber-500/30 shadow-sm">
              <Sliders className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">Personalización de la Interfaz</h3>
              <p className="text-xs text-slate-400">Personaliza tu foto de perfil, avatar, colores y estilo visual</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-800/60 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Barra de Pestañas */}
        <div className="flex px-6 pt-3 border-b border-inherit gap-2 overflow-x-auto scrollbar-none shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 pb-3 px-2 text-xs font-semibold border-b-2 transition-all shrink-0 cursor-pointer ${
              activeTab === 'profile'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="h-4 w-4" />
            <span>Perfil de Usuario</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('visual')}
            className={`flex items-center gap-2 pb-3 px-2 text-xs font-semibold border-b-2 transition-all shrink-0 cursor-pointer ${
              activeTab === 'visual'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Palette className="h-4 w-4" />
            <span>Apariencia Visual</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('voice')}
            className={`flex items-center gap-2 pb-3 px-2 text-xs font-semibold border-b-2 transition-all shrink-0 cursor-pointer ${
              activeTab === 'voice'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Volume2 className="h-4 w-4" />
            <span>Voz y Audio</span>
          </button>
        </div>

        {/* Contenido de la Pestaña */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs scrollbar-thin">
          {/* ========================================================= */}
          {/* TAB 1: PERFIL DE USUARIO                                 */}
          {/* ========================================================= */}
          {activeTab === 'profile' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Sección Foto de Perfil */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-3">Foto de Perfil del Usuario</label>
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                  {/* Vista Previa del Avatar */}
                  <div className="relative group shrink-0">
                    <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-slate-700 shadow-xl overflow-hidden flex items-center justify-center text-lg font-bold text-slate-200">
                      {formData.userAvatar
                        ? (
                          <img src={formData.userAvatar} alt="Avatar de usuario" className="w-full h-full object-cover" />
                        )
                        : (
                          <span>{userInitials}</span>
                        )}
                    </div>
                    <button
                      type="button"
                      onClick={() => userPhotoInputRef.current?.click()}
                      className="absolute inset-0 bg-black/60 rounded-2xl opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity cursor-pointer text-[10px]"
                    >
                      <Camera className="h-5 w-5 mb-0.5" />
                      <span>Cambiar</span>
                    </button>
                  </div>

                  <div className="space-y-3 flex-1 w-full text-center sm:text-left">
                    <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                      <button
                        type="button"
                        onClick={() => userPhotoInputRef.current?.click()}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                      >
                        <Camera className="h-3.5 w-3.5" />
                        <span>Subir Foto</span>
                      </button>

                      {formData.userAvatar && (
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, userAvatar: '' }))}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 border border-slate-700 hover:border-rose-500/40 font-medium flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Usar Iniciales</span>
                        </button>
                      )}
                      <input
                        ref={userPhotoInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleUserPhotoUpload}
                        className="hidden"
                      />
                    </div>

                    {/* Galería de Avatares Predeterminados */}
                    <div>
                      <p className="text-[11px] text-slate-400 mb-2">O elige uno de estos avatares ejecutivos:</p>
                      <div className="flex gap-2.5 justify-center sm:justify-start">
                        {PRESET_USER_AVATARS.map((preset, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, userAvatar: preset }))}
                            className={`h-9 w-9 rounded-xl overflow-hidden border-2 transition-all cursor-pointer hover:scale-105 ${
                              formData.userAvatar === preset ? 'border-emerald-400 ring-2 ring-emerald-400/40 scale-105' : 'border-slate-700 opacity-70 hover:opacity-100'
                            }`}
                          >
                            <img src={preset} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Nombre y Cargo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-inherit">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300">Nombre de Usuario</label>
                  <input
                    type="text"
                    value={formData.userName}
                    onChange={e => setFormData(prev => ({ ...prev, userName: e.target.value }))}
                    placeholder="Ej. Álvaro Díaz"
                    className={`w-full px-3.5 py-2.5 rounded-xl border outline-none font-medium text-xs transition-colors ${
                      darkMode ? 'bg-slate-900/90 border-slate-700 focus:border-emerald-500' : 'bg-slate-50 border-slate-300 focus:border-emerald-500'
                    }`}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300">Rol o Título</label>
                  <input
                    type="text"
                    value={formData.userRole}
                    onChange={e => setFormData(prev => ({ ...prev, userRole: e.target.value }))}
                    placeholder="Ej. Admin Pro / CEO"
                    className={`w-full px-3.5 py-2.5 rounded-xl border outline-none font-medium text-xs transition-colors ${
                      darkMode ? 'bg-slate-900/90 border-slate-700 focus:border-emerald-500' : 'bg-slate-50 border-slate-300 focus:border-emerald-500'
                    }`}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: APARIENCIA VISUAL                                 */}
          {/* ========================================================= */}
          {activeTab === 'visual' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Tema Claro / Oscuro */}
              <div className="space-y-2.5">
                <label className="font-semibold text-slate-300 block">Tema de la Interfaz</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDarkMode(true)}
                    className={`p-3.5 rounded-2xl border flex items-center gap-3 transition-all cursor-pointer ${
                      darkMode
                        ? 'bg-slate-900 border-emerald-400 text-emerald-400 ring-2 ring-emerald-400/20'
                        : 'bg-slate-100 border-slate-300 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Moon className="h-5 w-5" />
                    <div className="text-left">
                      <div className="font-bold">Modo Oscuro</div>
                      <div className="text-[10px] text-slate-400">Cyberpunk Studio</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDarkMode(false)}
                    className={`p-3.5 rounded-2xl border flex items-center gap-3 transition-all cursor-pointer ${
                      !darkMode
                        ? 'bg-slate-100 border-emerald-500 text-emerald-600 ring-2 ring-emerald-500/20'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <Sun className="h-5 w-5" />
                    <div className="text-left">
                      <div className="font-bold">Modo Claro</div>
                      <div className="text-[10px] text-slate-400">Minimalista Clean</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Selector de Color de Acento */}
              <div className="space-y-2.5 pt-4 border-t border-inherit">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-300">Color de Acento del Sistema</label>
                  <span className="font-mono text-emerald-400 text-[11px]">
                    {ACCENT_COLOR_MAP[formData.accentColor]?.label}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {(Object.keys(ACCENT_COLOR_MAP) as Array<keyof typeof ACCENT_COLOR_MAP>).map((key) => {
                    const color = ACCENT_COLOR_MAP[key]
                    const isSelected = formData.accentColor === key
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, accentColor: key }))}
                        className={`p-2.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                          isSelected
                            ? darkMode
                              ? 'bg-slate-900 border-slate-600 ring-2 ring-emerald-400/40'
                              : 'bg-slate-100 border-slate-400 ring-2 ring-emerald-500/40'
                            : darkMode
                              ? 'bg-slate-950/60 border-slate-800 hover:bg-slate-900'
                              : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`h-4 w-4 rounded-full bg-gradient-to-tr ${color.gradient} shadow-sm shrink-0`} />
                          <span className="font-medium text-[11px]">{color.label}</span>
                        </div>
                        {isSelected && <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Avatar de Carlos (Bot) */}
              <div className="space-y-3 pt-4 border-t border-inherit">
                <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Bot className="h-4 w-4 text-amber-400" />
                  <span>Foto del Asistente (Carlos)</span>
                </label>
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-slate-800 border border-slate-700 shadow-md overflow-hidden shrink-0">
                    <img
                      src={formData.botAvatar || DEFAULT_CUSTOMIZATION.botAvatar}
                      alt="Carlos Avatar"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = 'none'
                      }}
                    />
                  </div>
                  <div className="space-y-2 flex-1">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => botPhotoInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium transition-colors cursor-pointer"
                      >
                        Subir Foto para Carlos
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, botAvatar: DEFAULT_CUSTOMIZATION.botAvatar }))}
                        className="px-3 py-1.5 rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-400 text-[11px] font-medium transition-colors cursor-pointer"
                      >
                        Restablecer Original
                      </button>
                    </div>
                    <div className="flex gap-2">
                      {PRESET_BOT_AVATARS.map((botPreset, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, botAvatar: botPreset }))}
                          className={`h-7 w-7 rounded-lg overflow-hidden border transition-transform cursor-pointer ${
                            formData.botAvatar === botPreset ? 'border-amber-400 scale-105' : 'border-slate-700 opacity-60 hover:opacity-100'
                          }`}
                        >
                          <img src={botPreset} alt={`Bot preset ${i}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                    <input
                      ref={botPhotoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleBotPhotoUpload}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Tamaño de Fuente */}
              <div className="space-y-2 pt-4 border-t border-inherit">
                <label className="font-semibold text-slate-300">Tamaño de Texto en Conversaciones</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'small', label: 'Compacto' },
                    { id: 'normal', label: 'Estándar' },
                    { id: 'large', label: 'Amplio' },
                  ].map(size => (
                    <button
                      key={size.id}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, fontSize: size.id as any }))}
                      className={`py-2 px-3 rounded-xl border font-medium text-[11px] transition-all cursor-pointer ${
                        formData.fontSize === size.id
                          ? 'bg-emerald-500/10 border-emerald-400 text-emerald-400 font-bold'
                          : darkMode
                            ? 'bg-slate-900 border-slate-800 text-slate-400'
                            : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      {size.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: VOZ Y AUDIO                                       */}
          {/* ========================================================= */}
          {activeTab === 'voice' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="font-semibold text-slate-300">Velocidad de Lectura por Voz (TTS)</label>
                  <span className="font-mono text-emerald-400 text-sm font-bold">{formData.speechRate}x</span>
                </div>
                <input
                  type="range"
                  min="0.8"
                  max="1.6"
                  step="0.1"
                  value={formData.speechRate}
                  onChange={e => setFormData(prev => ({ ...prev, speechRate: parseFloat(e.target.value) }))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>0.8x (Pausado)</span>
                  <span>1.0x (Normal)</span>
                  <span>1.6x (Rápido)</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl border border-dashed border-amber-500/30 bg-amber-500/5 text-amber-300 space-y-1">
                <div className="font-semibold flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4" />
                  <span>Modo Voz Directo Bidireccional</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Puedes activar el dictado por voz en tiempo real con el botón de auriculares en la barra superior o el ícono de micrófono del chat.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer del Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-inherit shrink-0">
          <button
            type="button"
            onClick={() => setFormData(DEFAULT_CUSTOMIZATION)}
            className="text-[11px] text-slate-400 hover:text-slate-200 underline cursor-pointer"
          >
            Restablecer Valores
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-xl text-xs font-medium transition-colors ${
                darkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-600'
              }`}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSaveAll}
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
            >
              Guardar Cambios
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CustomizationModal
