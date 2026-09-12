'use client'

import React, { useState } from 'react'
import {
  Lock,
  User,
  Eye,
  EyeOff,
  Sparkles,
  AlertCircle,
  Loader2,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react'
import type { AuthenticatedUser } from '@/config/roles'

interface LoginViewProps {
  onLoginSuccess: (user: AuthenticatedUser) => void
}

export default function LoginView({ onLoginSuccess }: LoginViewProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleLogin = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!username.trim() || !password.trim()) {
      setErrorMsg('Por favor ingresa tu usuario o correo y tu contraseña.')
      return
    }

    setLoading(true)
    setErrorMsg('')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
        }),
      })

      const data = await res.json()

      if (res.ok && data.success && data.user) {
        onLoginSuccess(data.user)
      }
      else {
        setErrorMsg(data.message || 'Error al autenticar. Verifica tus credenciales de WordPress.')
      }
    }
    catch {
      setErrorMsg('No se pudo conectar con el servidor de autenticación. Intenta nuevamente.')
    }
    finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#070A12] p-4 sm:p-6 relative overflow-hidden font-sans select-none text-slate-100">
      {/* Luces de fondo ambientales */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-cyan-600/15 rounded-full blur-3xl pointer-events-none animate-pulse" />

      {/* Tarjeta de Login */}
      <div className="w-full max-w-md bg-[#0F1423]/90 backdrop-blur-2xl border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80 relative z-10 transition-all">
        {/* Cabecera & Logo */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="relative mb-3 group">
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-500" />
            <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-[#090D18] border border-slate-700/60 p-2.5 shadow-xl">
              <img
                src="https://studioalvarodiaz.es/wp-content/uploads/2026/07/ICONO-simbolo-del-vortice.png"
                alt="Álvaro Díaz Studio"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none'
                }}
              />
            </div>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Álvaro Díaz Studio
          </h1>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5 font-mono">
            <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
            Ecosistema de Agentes de IA
          </p>
        </div>

        {/* Mensaje de Error */}
        {errorMsg && (
          <div className="mb-5 p-3 sm:p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">{errorMsg}</div>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleLogin} className="space-y-4">
          {/* Campo Usuario / Correo */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Usuario o Correo de WordPress
            </label>
            <div className="relative flex items-center">
              <User className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="ej: alvaropublicita@gmail.com"
                required
                className="w-full bg-[#080C16] border border-slate-700/80 focus:border-emerald-500 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition-all focus:ring-1 focus:ring-emerald-500/50"
              />
            </div>
          </div>

          {/* Campo Contraseña */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Contraseña
            </label>
            <div className="relative flex items-center">
              <Lock className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Ingresa tu contraseña"
                required
                className="w-full bg-[#080C16] border border-slate-700/80 focus:border-emerald-500 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition-all focus:ring-1 focus:ring-emerald-500/50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-slate-400 hover:text-slate-200 p-1 cursor-pointer transition-colors"
                title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Botón de Iniciar Sesión */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.98]"
          >
            {loading
              ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Verificando credenciales...</span>
                </>
              )
              : (
                <>
                  <span>Iniciar Sesión</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
          </button>
        </form>

        {/* Footer Informativo de Seguridad */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-center gap-1.5 text-[10px] text-slate-500 font-mono">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400/80" />
          <span>Autenticación sincronizada con WordPress & Dify</span>
        </div>
      </div>
    </div>
  )
}
