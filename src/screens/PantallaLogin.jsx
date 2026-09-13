import React, { useState, useEffect } from 'react'
import { Fingerprint, Eye, EyeOff, Mail, KeyRound, Building2, Gift, ChevronRight } from 'lucide-react'
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

// --- Estilos de presentación (dark + lime) ---
const FONDO = 'linear-gradient(165deg, #16294A 0%, #1E3559 44%, #27436B 100%)'
const LIME = '#84CC16'
const LIME_CLARO = '#A3E635'
const TINTA_LIME = '#12220A'
const TEXTO_TENUE = '#93A1AD'

const claseInput =
  'w-full h-[50px] rounded-2xl bg-white/[0.07] border border-white/15 text-[15px] text-[#F2F4F5] placeholder:text-[#7C8A93] outline-none transition focus:border-[#84CC16] focus:ring-[3px] focus:ring-[#84CC16]/20'
const claseTarjeta =
  'w-full rounded-3xl p-[22px] border border-white/15 backdrop-blur-md shadow-[0_24px_50px_-20px_rgba(0,0,0,0.6)] bg-[linear-gradient(160deg,rgba(11,19,43,0.62),rgba(11,19,43,0.48))]'
const claseCtaPrimaria =
  'w-full h-[52px] rounded-2xl text-[16px] font-extrabold transition active:translate-y-px disabled:opacity-50 shadow-[0_10px_22px_-10px_rgba(132,204,22,0.8)] hover:shadow-[0_12px_26px_-10px_rgba(132,204,22,0.9)]'
const estiloCtaPrimaria = {
  background: 'linear-gradient(180deg, ' + LIME_CLARO + ', ' + LIME + ')',
  color: TINTA_LIME,
}

const CSS_ANIMACIONES = `
@keyframes enpGiro { to { transform: rotate(360deg); } }
@keyframes enpGiroInv { to { transform: rotate(-360deg); } }
@keyframes enpTrazo { to { stroke-dashoffset: -1400; } }
@keyframes enpLatido { 0%, 100% { opacity: 0.22; } 50% { opacity: 0.5; } }
@keyframes enpVeta { to { transform: translate3d(-6%, 4%, 0); } }
.enp-arco-sup { transform-origin: 195px 150px; animation: enpGiro 120s linear infinite; }
.enp-arco-inf { transform-origin: 195px 630px; animation: enpGiroInv 150s linear infinite; }
.enp-trazo { stroke-dasharray: 120 620; animation: enpTrazo 14s linear infinite; }
.enp-trazo-lento { stroke-dasharray: 200 900; animation: enpTrazo 26s linear infinite reverse; }
.enp-latido { animation: enpLatido 9s ease-in-out infinite; }
.enp-veta { animation: enpVeta 40s ease-in-out infinite alternate; }
@media (prefers-reduced-motion: reduce) {
  .enp-arco-sup, .enp-arco-inf, .enp-trazo, .enp-trazo-lento, .enp-latido, .enp-veta { animation: none; }
}
`

function Encabezado() {
  return (
    <div className="mb-7 flex flex-col items-center gap-3">
      <div className="relative flex items-center justify-center">
        <div
          aria-hidden="true"
          className="absolute w-[150px] h-[150px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(132,204,22,0.22), rgba(132,204,22,0) 66%)' }}
        />
        <img
          src={logoImg}
          alt="Enerpetrol"
          className="relative w-[104px] h-[104px] object-contain rounded-[26px] border border-white/[0.14] shadow-[0_16px_34px_-14px_rgba(0,0,0,0.7)]"
        />
      </div>
      <div className="flex items-center gap-2.5">
        <span className="w-[22px] h-px" style={{ background: 'linear-gradient(90deg, rgba(132,204,22,0), ' + LIME + ')' }} />
        <span className="text-[11px] font-bold uppercase tracking-[0.22em] whitespace-nowrap text-[#CBD5CF]">
          Carga menos, <span style={{ color: LIME_CLARO }}>ahorra más</span>
        </span>
        <span className="w-[22px] h-px" style={{ background: 'linear-gradient(90deg, ' + LIME + ', rgba(132,204,22,0))' }} />
      </div>
    </div>
  )
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
  // Empresa
  const [empresas, setEmpresas] = useState([])
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState('')
  const [numeroEmpleado, setNumeroEmpleado] = useState('')

  useEffect(() => {
    dispositivoTieneBiometria().then((resultado) => {
      setTieneBiometria(resultado)
    })
    setHayCredencialGuardada(!!localStorage.getItem(CLAVE_CREDENCIAL))
    // Cargar empresas activas
    supabase.from('empresas').select('id, nombre').eq('activa', true).then(({ data }) => {
      setEmpresas(data || [])
    })
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

  async function loginConGoogle() {
    setError('')
    setCargando(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'https://enerpetrol-app.vercel.app',
      }
    })
    if (error) { setError('No se pudo iniciar sesión con Google.'); setCargando(false) }
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
      empresa_id: empresaSeleccionada ? parseInt(empresaSeleccionada) : null,
      numero_empleado: empresaSeleccionada && numeroEmpleado.trim() ? numeroEmpleado.trim() : null,
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
      <div className="min-h-screen w-full flex flex-col items-center justify-center px-6 py-12" style={{ background: FONDO }}>
        <div className={claseTarjeta + ' max-w-[380px] text-center'}>
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(132,204,22,0.14)', border: '1px solid rgba(132,204,22,0.35)' }}
          >
            <Fingerprint size={32} strokeWidth={1.5} style={{ color: LIME_CLARO }} />
          </div>
          <h3 className="text-white text-[17px] font-bold mb-2">Activar inicio con huella?</h3>
          <p className="text-[13px] leading-relaxed mb-6" style={{ color: '#B9C2CC' }}>
            La proxima vez podras entrar mas rapido usando tu huella o Face ID.
          </p>
          <button onClick={() => activarBiometria(usuarioRecienAutenticado)} className={claseCtaPrimaria + ' mb-2'} style={estiloCtaPrimaria}>
            Si, activar
          </button>
          <button
            onClick={() => onAutenticado(usuarioRecienAutenticado)}
            className="w-full h-11 rounded-2xl text-[13px] transition hover:bg-white/[0.06]"
            style={{ color: TEXTO_TENUE }}
          >
            Ahora no
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center px-6 py-12 overflow-hidden" style={{ background: FONDO }}>
      <style>{CSS_ANIMACIONES}</style>

      {/* Veta metálica cepillada */}
      <div
        aria-hidden="true"
        className="enp-veta absolute -inset-[12%] pointer-events-none opacity-75 mix-blend-soft-light"
        style={{
          background:
            'repeating-linear-gradient(104deg, rgba(255,255,255,0.055) 0px, rgba(255,255,255,0) 2px, rgba(255,255,255,0) 5px, rgba(255,255,255,0.035) 7px, rgba(0,0,0,0.05) 9px, rgba(255,255,255,0) 12px)',
        }}
      />
      {/* Reflejo diagonal del acero */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(104deg, rgba(255,255,255,0) 18%, rgba(255,255,255,0.11) 38%, rgba(255,255,255,0) 52%, rgba(0,0,0,0.16) 74%, rgba(255,255,255,0.06) 92%)',
        }}
      />

      {/* Arcos derivados del logo */}
      <svg
        aria-hidden="true"
        viewBox="0 0 390 780"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 w-full h-full pointer-events-none"
      >
        <defs>
          <linearGradient id="loginArcoLime" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor="#84CC16" stopOpacity="0" />
            <stop offset="0.55" stopColor="#A3E635" stopOpacity="0.85" />
            <stop offset="1" stopColor="#84CC16" stopOpacity="0.1" />
          </linearGradient>
          <linearGradient id="loginArcoAcero" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.02" />
            <stop offset="0.5" stopColor="#FFFFFF" stopOpacity="0.3" />
            <stop offset="1" stopColor="#FFFFFF" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <g fill="none" strokeLinecap="round">
          <g className="enp-arco-sup">
            <path d="M 300 -60 A 210 210 0 1 1 90 150" stroke="url(#loginArcoLime)" strokeWidth="10" opacity="0.4" />
            <path className="enp-trazo" d="M 318 -42 A 246 246 0 1 1 54 168" stroke="url(#loginArcoAcero)" strokeWidth="2" opacity="0.6" />
            <path className="enp-latido" d="M 336 -24 A 282 282 0 1 1 18 186" stroke="url(#loginArcoLime)" strokeWidth="1.5" />
          </g>
          <g className="enp-arco-inf">
            <path d="M 100 840 A 230 230 0 1 1 330 610" stroke="url(#loginArcoLime)" strokeWidth="9" opacity="0.3" />
            <path className="enp-trazo-lento" d="M 76 864 A 266 266 0 1 1 366 598" stroke="url(#loginArcoAcero)" strokeWidth="2" opacity="0.45" />
          </g>
        </g>
      </svg>

      {/* Halos de fondo */}
      <div
        aria-hidden="true"
        className="absolute -top-[140px] -right-[120px] w-[340px] h-[340px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(132,204,22,0.14), rgba(132,204,22,0) 68%)' }}
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-[160px] -left-[140px] w-[360px] h-[360px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(143,181,224,0.20), rgba(143,181,224,0) 70%)' }}
      />

      <div className="relative w-full max-w-[380px] flex flex-col items-center">
        <Encabezado />

        {hayCredencialGuardada && modo === 'login' && !modoReset && (
          <button
            onClick={entrarConHuella}
            disabled={cargando}
            className="w-full h-[50px] mb-3 rounded-2xl text-[15px] font-semibold flex items-center justify-center gap-2 transition hover:bg-white/[0.14] disabled:opacity-50"
            style={{ background: 'rgba(255,255,255,0.09)', border: '1px solid rgba(132,204,22,0.4)', color: LIME_CLARO }}
          >
            <Fingerprint size={18} strokeWidth={1.5} /> Entrar con huella
          </button>
        )}

        {/* Botón Google */}
        {!modoReset && (
          <div className="w-full mb-4">
            <button
              type="button"
              onClick={loginConGoogle}
              disabled={cargando}
              className="w-full h-[50px] flex items-center justify-center gap-3 rounded-2xl text-[15px] font-semibold transition hover:bg-[#F4F5F7] active:bg-[#E8EAED] disabled:opacity-50"
              style={{ background: '#fff', color: '#3C4043', border: '1px solid #DADCE0', boxShadow: '0 1px 3px rgba(0,0,0,0.18)' }}
            >
              <svg width="19" height="19" viewBox="0 0 18 18" aria-hidden="true">
                <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
                <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"/>
                <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07z"/>
                <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z"/>
              </svg>
              Continuar con Google
            </button>

            <div className="flex items-center gap-3 mt-4">
              <div className="flex-1 h-px bg-white/[0.14]" />
              <span className="text-[11px] uppercase tracking-[0.1em] text-white/40">o</span>
              <div className="flex-1 h-px bg-white/[0.14]" />
            </div>
          </div>
        )}

        {modoReset ? (
          <form onSubmit={manejarReset} className={claseTarjeta}>
            <h3 className="text-white text-[16px] font-bold mb-1">Restablecer contrasena</h3>
            <p className="text-[13px] leading-relaxed mb-4" style={{ color: '#B9C2CC' }}>
              Ingresa tu correo y te enviaremos un enlace para crear una nueva contrasena.
            </p>
            <div className="relative flex items-center mb-3">
              <Mail size={17} strokeWidth={1.5} className="absolute left-[14px] pointer-events-none" style={{ color: '#7C8A93' }} />
              <input
                type="email"
                placeholder="Correo electronico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={claseInput + ' pl-[42px] pr-[14px]'}
                required
              />
            </div>
            {error && <p className="text-[13px] mb-3" style={{ color: '#FF8A8A' }}>{error}</p>}
            {mensajeExito && <p className="text-[13px] mb-3" style={{ color: LIME_CLARO }}>{mensajeExito}</p>}
            <button type="submit" disabled={cargando} className={claseCtaPrimaria + ' mb-3'} style={estiloCtaPrimaria}>
              {cargando ? 'Enviando...' : 'Enviar enlace'}
            </button>
            <button
              type="button"
              onClick={() => { setModoReset(false); setError(''); setMensajeExito('') }}
              className="w-full text-[13px] text-center transition hover:underline hover:text-[#D4DCE3]"
              style={{ color: TEXTO_TENUE }}
            >
              Volver al inicio de sesion
            </button>
          </form>
        ) : (
          <form onSubmit={modo === 'login' ? manejarLogin : manejarRegistro} className={claseTarjeta}>
            {/* Tabs */}
            <div className="flex gap-1 p-1 rounded-2xl mb-4" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.07)' }}>
              {[
                { id: 'login', etiqueta: 'Iniciar sesion' },
                { id: 'registro', etiqueta: 'Crear cuenta' },
              ].map((tab) => {
                const activo = modo === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setModo(tab.id)}
                    className="flex-1 h-10 rounded-xl text-[14px] font-bold transition"
                    style={
                      activo
                        ? { background: 'linear-gradient(180deg, ' + LIME_CLARO + ', ' + LIME + ')', color: TINTA_LIME, boxShadow: '0 6px 14px -8px rgba(132,204,22,0.9)' }
                        : { background: 'transparent', color: '#B9C2CC' }
                    }
                  >
                    {tab.etiqueta}
                  </button>
                )
              })}
            </div>

            {modo === 'registro' && (
              <>
                <input
                  type="text"
                  placeholder="Tu nombre completo"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className={claseInput + ' px-[14px] mb-3'}
                  required
                />

                <label className="text-[12px] mb-1.5 block" style={{ color: '#B9C2CC' }}>Tu ciudad</label>
                <select
                  value={ciudad}
                  onChange={(e) => setCiudad(e.target.value)}
                  className={claseInput + ' px-[14px] mb-3'}
                >
                  {CIUDADES.map((c) => <option key={c} value={c} style={{ color: '#000' }}>{c}</option>)}
                </select>

                {empresas.length > 0 && (
                  <>
                    {/* Banner empresa */}
                    <div
                      className="rounded-2xl p-3 mb-3 flex items-center gap-3"
                      style={{ background: 'rgba(132,204,22,0.1)', border: '1px solid rgba(132,204,22,0.3)' }}
                    >
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: 'rgba(132,204,22,0.14)' }}
                      >
                        <Building2 size={18} strokeWidth={1.5} style={{ color: LIME_CLARO }} />
                      </div>
                      <div>
                        <p className="text-[12px] font-bold" style={{ color: LIME_CLARO }}>¿Trabajas en una empresa afiliada?</p>
                        <p className="text-[11px]" style={{ color: '#7C8A93' }}>Selecciónala para obtener tu tarjeta corporativa</p>
                      </div>
                    </div>
                    <select
                      value={empresaSeleccionada}
                      onChange={(e) => { setEmpresaSeleccionada(e.target.value); setNumeroEmpleado('') }}
                      className={claseInput + ' px-[14px] mb-3'}
                      style={
                        empresaSeleccionada
                          ? { background: 'rgba(132,204,22,0.12)', borderColor: 'rgba(132,204,22,0.5)' }
                          : undefined
                      }
                    >
                      <option value="" style={{ color: '#000' }}>No pertenezco a ninguna empresa</option>
                      {empresas.map((emp) => (
                        <option key={emp.id} value={emp.id} style={{ color: '#000' }}>{emp.nombre}</option>
                      ))}
                    </select>
                  </>
                )}

                {REFERIDOS_ACTIVO() && (
                  <div className="mb-3">
                    <label className="text-[12px] mb-1.5 flex items-center gap-1.5" style={{ color: LIME_CLARO }}>
                      <Gift size={14} strokeWidth={1.5} />
                      Codigo de referido (opcional) — Vigente hasta el 15 de agosto
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. ENP-1234-5678"
                      value={codigoReferido}
                      onChange={(e) => setCodigoReferido(e.target.value)}
                      className={claseInput + ' px-[14px] uppercase'}
                      style={{ borderColor: 'rgba(132,204,22,0.4)' }}
                    />
                    <p className="text-[11px] mt-1" style={{ color: '#7C8A93' }}>
                      Si alguien te invito, ingresa su numero de tarjeta ENP
                    </p>
                  </div>
                )}
              </>
            )}

            <div className="relative flex items-center mb-3">
              <Mail size={17} strokeWidth={1.5} className="absolute left-[14px] pointer-events-none" style={{ color: '#7C8A93' }} />
              <input
                type="email"
                placeholder="Correo electronico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={claseInput + ' pl-[42px] pr-[14px]'}
                required
              />
            </div>

            <div className="relative flex items-center mb-4">
              <KeyRound size={17} strokeWidth={1.5} className="absolute left-[14px] pointer-events-none" style={{ color: '#7C8A93' }} />
              <input
                type={mostrarPassword ? 'text' : 'password'}
                placeholder="Contrasena"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={claseInput + ' pl-[42px] pr-[46px]'}
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setMostrarPassword(!mostrarPassword)}
                aria-label="Mostrar u ocultar contrasena"
                className="absolute right-1.5 w-[38px] h-[38px] flex items-center justify-center rounded-xl transition hover:bg-white/[0.06] hover:text-[#A3E635]"
                style={{ color: '#7C8A93' }}
              >
                {mostrarPassword ? <EyeOff size={17} strokeWidth={1.5} /> : <Eye size={17} strokeWidth={1.5} />}
              </button>
            </div>

            {error && <p className="text-[13px] mb-3" style={{ color: '#FF8A8A' }}>{error}</p>}

            <button type="submit" disabled={cargando} className={claseCtaPrimaria} style={estiloCtaPrimaria}>
              {cargando ? 'Un momento...' : modo === 'login' ? 'Entrar' : 'Crear mi cuenta'}
            </button>

            {modo === 'login' && (
              <button
                type="button"
                onClick={() => { setModoReset(true); setError('') }}
                className="w-full text-[13px] text-center mt-3 transition hover:underline hover:text-[#D4DCE3]"
                style={{ color: TEXTO_TENUE }}
              >
                Olvide mi contrasena
              </button>
            )}
          </form>
        )}
      </div>
    </div>
  )
}
