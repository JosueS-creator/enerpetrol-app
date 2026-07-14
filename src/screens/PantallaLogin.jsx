import React, { useState, useEffect } from 'react'
import { Fingerprint, Eye, EyeOff } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { NAVY, GREEN, GREEN_LIGHT, CIUDADES } from '../theme'
import { dispositivoTieneBiometria, registrarBiometria, verificarBiometria } from '../biometria'
import logoImg from '../assets/logo-enerpetrol.png'

const CLAVE_CREDENCIAL = 'enerpetrol_credencial_biometrica'
const CLAVE_EMAIL = 'enerpetrol_email_biometrico'

const REFERIDOS_ACTIVO = () => {
  const ahora = new Date()
  return ahora >= new Date('2026-07-01') && ahora <= new Date('2026-08-15T23:59:59')
}

export default function PantallaLogin({ onAutenticado }) {
  const [modo, setModo] = useState('login')
  const [nombre, setNombre] = useState('')
  const [ciudad, setCiudad] = useState('Tegucigalpa')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mostrarPassword, setMostrarPassword] = useState(false)
  const [codigoReferido, setCodigoReferido] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [mensajeExito, setMensajeExito] = useState('')
  const [tieneBiometria, setTieneBiometria] = useState(false)
  const [hayCredencialGuardada, setHayCredencialGuardada] = useState(false)
  const [ofrecerBiometria, setOfrecerBiometria] = useState(false)
  const [usuarioRecienAutenticado, setUsuarioRecienAutenticado] = useState(null)
  const [modoReset, setModoReset] = useState(false)

  useEffect(() => {
    dispositivoTieneBiometria().then(setTieneBiometria)
    setHayCredencialGuardada(!!localStorage.getItem(CLAVE_CREDENCIAL))
  }, [])

  async function entrarConHuella() {
    setError('')
    setCargando(true)
    try {
      const credencial = localStorage.getItem(CLAVE_CREDENCIAL)
      const exito = await verificarBiometria(credencial)
      if (exito) {
        const { data } = await supabase.auth.getSession()
        if (data.session) {
          onAutenticado(data.session.user)
        } else {
          setError('Tu huella es correcta, pero tu sesion expiro. Ingresa tu contrasena una vez mas.')
        }
      }
    } catch {
      setError('No se pudo verificar tu huella. Intenta con tu contrasena.')
    }
    setCargando(false)
  }

  async function activarBiometria(usuario) {
    try {
      const credencial = await registrarBiometria(usuario.email, nombre || usuario.email)
      localStorage.setItem(CLAVE_CREDENCIAL, credencial)
      localStorage.setItem(CLAVE_EMAIL, usuario.email)
    } catch {}
    setOfrecerBiometria(false)
    onAutenticado(usuario)
  }

  async function manejarLogin(e) {
    e.preventDefault()
    setError('')
    setCargando(true)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    setCargando(false)
    if (error) { setError('Correo o contrasena incorrectos.'); return }
    if (tieneBiometria && !hayCredencialGuardada) {
      setUsuarioRecienAutenticado(data.user)
      setOfrecerBiometria(true)
      return
    }
    onAutenticado(data.user)
  }

  async function manejarRegistro(e) {
    e.preventDefault()
    setError('')
    if (!nombre.trim()) { setError('Por favor ingresa tu nombre.'); return }
    setCargando(true)

    const { data, error: errorAuth } = await supabase.auth.signUp({ email, password })
    if (errorAuth) { setCargando(false); setError(errorAuth.message); return }

    const numeroTarjeta = 'ENP-' + Math.floor(1000 + Math.random() * 9000) + '-' + Math.floor(1000 + Math.random() * 9000)

    let referidorId = null
    if (codigoReferido.trim() && REFERIDOS_ACTIVO()) {
      const { data: perfilReferidor } = await supabase
        .from('perfiles')
        .select('id')
        .eq('numero_tarjeta', codigoReferido.trim().toUpperCase())
        .single()
      if (perfilReferidor) {
        referidorId = perfilReferidor.id
      } else {
        setCargando(false)
        setError('El codigo de referido no es valido. Verifica e intenta de nuevo.')
        return
      }
    }

    const { error: errorPerfil } = await supabase.from('perfiles').insert({
      id: data.user.id,
      nombre: nombre.trim(),
      numero_tarjeta: numeroTarjeta,
      rol: 'cliente',
      ciudad: ciudad,
      referido_por: codigoReferido.trim().toUpperCase() || null,
    })

    if (errorPerfil) {
      setCargando(false)
      setError('Tu cuenta se creo, pero hubo un problema al guardar tu perfil: ' + errorPerfil.message)
      return
    }

    if (referidorId && REFERIDOS_ACTIVO()) {
      await supabase.from('referidos').insert({
        referidor_id: referidorId,
        referido_id: data.user.id,
        codigo_usado: codigoReferido.trim().toUpperCase(),
        punto_otorgado: false,
      })
    }

    setCargando(false)
    if (tieneBiometria) {
      setUsuarioRecienAutenticado(data.user)
      setOfrecerBiometria(true)
      return
    }
    onAutenticado(data.user)
  }

  async function manejarReset(e) {
    e.preventDefault()
    setError('')
    setMensajeExito('')
    if (!email.trim()) { setError('Ingresa tu correo electronico.'); return }
    setCargando(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: 'https://enerpetrol-app-git-main-enerpetrol.vercel.app',
})
    setCargando(false)
    if (error) {
      setError('No se pudo enviar el correo. Verifica tu direccion de email.')
    } else {
      setMensajeExito('Te enviamos un correo con el enlace para restablecer tu contrasena.')
    }
  }

  if (ofrecerBiometria) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center px-8 py-12"
        style={{ background: `linear-gradient(155deg, #1C2226 0%, ${NAVY} 38%, #2B3B4A 62%, #0A1620 100%)` }}>
        <div className="w-full max-w-xs rounded-2xl p-6 text-center" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: `${GREEN}22` }}>
            <Fingerprint size={32} style={{ color: GREEN_LIGHT }} />
          </div>
          <h3 className="text-white text-base font-semibold mb-2">Activar inicio con huella?</h3>
          <p className="text-xs mb-6" style={{ color: '#B9C2CC' }}>
            La proxima vez podras entrar mas rapido usando tu huella o Face ID.
          </p>
          <button onClick={() => activarBiometria(usuarioRecienAutenticado)}
            className="w-full rounded-xl py-3 text-sm font-semibold mb-2"
            style={{ background: GREEN, color: '#0B1A12' }}>
            Si, activar
          </button>
          <button onClick={() => onAutenticado(usuarioRecienAutenticado)}
            className="w-full rounded-xl py-3 text-sm" style={{ color: '#B9C2CC' }}>
            Ahora no
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center px-8 py-12"
      style={{ background: `linear-gradient(155deg, #1C2226 0%, ${NAVY} 38%, #2B3B4A 62%, #0A1620 100%)` }}>

      <div className="mb-6 flex flex-col items-center">
        <img src={logoImg} alt="Enerpetrol" style={{ width: 120, height: 'auto', objectFit: 'contain' }} />
      </div>

      {hayCredencialGuardada && modo === 'login' && !modoReset && (
        <button onClick={entrarConHuella} disabled={cargando}
          className="w-full max-w-xs mb-3 rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-2"
          style={{ background: 'rgba(255,255,255,0.1)', border: `1px solid ${GREEN}50`, color: GREEN_LIGHT }}>
          <Fingerprint size={18} /> Entrar con huella
        </button>
      )}

      {modoReset ? (
        <form onSubmit={manejarReset} className="w-full max-w-xs rounded-2xl p-5"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}>
          <h3 className="text-white text-sm font-semibold mb-1">Restablecer contrasena</h3>
          <p className="text-xs mb-4" style={{ color: '#B9C2CC' }}>
            Ingresa tu correo y te enviaremos un enlace para crear una nueva contrasena.
          </p>
          <input type="email" placeholder="Correo electronico" value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg px-3 py-2.5 text-sm mb-3 focus:outline-none"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#F2F4F5' }} required />
          {error && <p className="text-xs mb-3" style={{ color: '#FF8A8A' }}>{error}</p>}
          {mensajeExito && <p className="text-xs mb-3" style={{ color: GREEN_LIGHT }}>{mensajeExito}</p>}
          <button type="submit" disabled={cargando}
            className="w-full rounded-xl py-3 text-sm font-semibold mb-3 disabled:opacity-50"
            style={{ background: GREEN, color: '#0B1A12' }}>
            {cargando ? 'Enviando...' : 'Enviar enlace'}
          </button>
          <button type="button" onClick={() => { setModoReset(false); setError(''); setMensajeExito('') }}
            className="w-full text-xs text-center" style={{ color: '#B9C2CC' }}>
            Volver al inicio de sesion
          </button>
        </form>
      ) : (
        <form onSubmit={modo === 'login' ? manejarLogin : manejarRegistro}
          className="w-full max-w-xs rounded-2xl p-5"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}>

          <div className="flex rounded-lg overflow-hidden mb-4" style={{ background: 'rgba(0,0,0,0.25)' }}>
            <button type="button" onClick={() => setModo('login')} className="flex-1 py-2 text-sm font-semibold"
              style={{ background: modo === 'login' ? GREEN : 'transparent', color: modo === 'login' ? '#0B1A12' : '#B9C2CC' }}>
              Iniciar sesion
            </button>
            <button type="button" onClick={() => setModo('registro')} className="flex-1 py-2 text-sm font-semibold"
              style={{ background: modo === 'registro' ? GREEN : 'transparent', color: modo === 'registro' ? '#0B1A12' : '#B9C2CC' }}>
              Crear cuenta
            </button>
          </div>

          {modo === 'registro' && (
            <>
              <input type="text" placeholder="Tu nombre completo" value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full rounded-lg px-3 py-2.5 text-sm mb-3 focus:outline-none"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#F2F4F5' }} required />
              <label className="text-xs mb-1.5 block" style={{ color: '#B9C2CC' }}>Tu ciudad</label>
              <select value={ciudad} onChange={(e) => setCiudad(e.target.value)}
                className="w-full rounded-lg px-3 py-2.5 text-sm mb-3 focus:outline-none"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#F2F4F5' }}>
                {CIUDADES.map((c) => <option key={c} value={c} style={{ color: '#000' }}>{c}</option>)}
              </select>
              {REFERIDOS_ACTIVO() && (
                <div className="mb-3">
                  <label className="text-xs mb-1.5 block" style={{ color: GREEN_LIGHT }}>
                    🎉 Codigo de referido (opcional) — Vigente hasta el 15 de agosto
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. ENP-1234-5678"
                    value={codigoReferido}
                    onChange={(e) => setCodigoReferido(e.target.value)}
                    className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none uppercase"
                    style={{ background: 'rgba(255,255,255,0.08)', border: `1px solid ${GREEN}50`, color: '#F2F4F5' }}
                  />
                  <p className="text-[10px] mt-1" style={{ color: '#7C8A93' }}>
                    Si alguien te invito, ingresa su numero de tarjeta ENP
                  </p>
                </div>
              )}
            </>
          )}

          <input type="email" placeholder="Correo electronico" value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg px-3 py-2.5 text-sm mb-3 focus:outline-none"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#F2F4F5' }} required />

          <div className="relative mb-4">
            <input
              type={mostrarPassword ? 'text' : 'password'}
              placeholder="Contrasena"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none pr-10"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#F2F4F5' }}
              required minLength={6}
            />
            <button type="button" onClick={() => setMostrarPassword(!mostrarPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#7C8A93' }}>
              {mostrarPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {error && <p className="text-xs mb-3" style={{ color: '#FF8A8A' }}>{error}</p>}

          <button type="submit" disabled={cargando}
            className="w-full rounded-xl py-3 text-sm font-semibold disabled:opacity-50"
            style={{ background: GREEN, color: '#0B1A12' }}>
            {cargando ? 'Un momento...' : modo === 'login' ? 'Entrar' : 'Crear mi cuenta'}
          </button>

          {modo === 'login' && (
            <button type="button" onClick={() => { setModoReset(true); setError('') }}
              className="w-full text-xs text-center mt-3" style={{ color: '#7C8A93' }}>
              Olvide mi contrasena
            </button>
          )}
        </form>
      )}
    </div>
  )
                  }
