import React, { useState, useEffect, lazy, Suspense } from 'react'
import { MapPin, User, LayoutDashboard, X, UserPlus, Coins } from 'lucide-react'
import { supabase } from './supabaseClient'
import { LogoMark } from './components/Logo'
import {
  BG, BORDER, CARD, GREEN, GREEN_LIGHT, NAVY, TEXT_MUTED,
  DARK_BG, DARK_CARD, DARK_BORDER, DARK_TEXT_MUTED,
  SHADOW_GREEN
} from './theme'

import PantallaBienvenida from './screens/PantallaBienvenida'
const PantallaLogin    = lazy(() => import('./screens/PantallaLogin'))
const VistaMapa        = lazy(() => import('./screens/VistaMapa'))
const VistaCliente     = lazy(() => import('./screens/VistaCliente'))
const VistaEnermonedas = lazy(() => import('./screens/VistaEnermonedas'))
const VistaAdmin       = lazy(() => import('./screens/VistaAdmin'))

// ─── Helpers ────────────────────────────────────────────────
function esModoOscuro() {
  const h = new Date().getHours()
  return h >= 18 || h < 6
}

const REFERIDOS_ACTIVO = () => {
  const now = new Date()
  return now >= new Date('2026-07-01') && now <= new Date('2026-08-15T23:59:59')
}

// ─── Spinner de carga ───────────────────────────────────────
function Spinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 160 }}>
      <div style={{
        width: 24, height: 24, borderRadius: '50%',
        border: '2px solid ' + GREEN,
        borderTopColor: 'transparent',
        animation: 'spin 0.7s linear infinite',
      }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

// ─── Pantalla de carga ──────────────────────────────────────
function PantallaCarga() {
  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 24,
      background: 'linear-gradient(155deg, #0A1620 0%, #0F2A4A 50%, #1A3D6B 100%)',
    }}>
      <div style={{ animation: 'epPulse 1.5s ease-in-out infinite' }}>
        <LogoMark size={72} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.3px' }}>
          <span style={{ color: '#fff' }}>ENER</span>
          <span style={{ color: GREEN }}>PETROL</span>
        </span>
        <div style={{ width: 160, height: 3, borderRadius: 99, overflow: 'hidden', background: 'rgba(255,255,255,0.1)' }}>
          <div style={{
            height: '100%', width: '45%', borderRadius: 99,
            background: `linear-gradient(90deg, ${GREEN}, ${GREEN_LIGHT})`,
            animation: 'epSlide 1.4s ease-in-out infinite',
          }} />
        </div>
      </div>
      <style>{`
        @keyframes epPulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.07);opacity:.85} }
        @keyframes epSlide { 0%{transform:translateX(-100%)} 100%{transform:translateX(380%)} }
      `}</style>
    </div>
  )
}

// ─── App ────────────────────────────────────────────────────
export default function App() {
  const [mostrarBienvenida, setMostrarBienvenida]           = useState(true)
  const [sesion, setSesion]                                 = useState(null)
  const [rol, setRol]                                       = useState(null)
  const [ciudadUsuario, setCiudadUsuario]                   = useState('Tegucigalpa')
  const [cargandoSesion, setCargandoSesion]                 = useState(true)
  const [vista, setVista]                                   = useState('mapa')
  const [banner, setBanner]                                 = useState(null)
  const [mostrarBanner, setMostrarBanner]                   = useState(false)
  const [segundos, setSegundos]                             = useState(10)
  const [darkMode, setDarkMode]                             = useState(esModoOscuro())
  const [perfil, setPerfil]                                 = useState(null)
  const [mostrarInvitar, setMostrarInvitar]                 = useState(false)
  const [copiado, setCopiado]                               = useState(false)
  const [modoRecuperacion, setModoRecuperacion]             = useState(false)
  const [nuevaPassword, setNuevaPassword]                   = useState('')
  const [actualizando, setActualizando]                     = useState(false)
  const [passwordActualizado, setPasswordActualizado]       = useState(false)
  const [mostrarBienvenidaPersonal, setMostrarBienvenidaPersonal] = useState(false)
  const [mostrarInstalar, setMostrarInstalar]               = useState(false)
  const [promptInstalacion, setPromptInstalacion]           = useState(null)

  // Tokens de tema
  const bg         = darkMode ? DARK_BG   : BG
  const card       = darkMode ? DARK_CARD : CARD
  const border     = darkMode ? DARK_BORDER : BORDER
  const textMuted  = darkMode ? DARK_TEXT_MUTED : TEXT_MUTED
  const textPrimary = darkMode ? '#E6EDF3' : NAVY

  // Dark mode automático por hora
  useEffect(() => {
    const t = setInterval(() => setDarkMode(esModoOscuro()), 60_000)
    return () => clearInterval(t)
  }, [])

  // Password recovery
  useEffect(() => {
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setModoRecuperacion(true)
    })
  }, [])

  // PWA install prompt
  useEffect(() => {
    const handler = (e) => { e.preventDefault(); setPromptInstalacion(e); setMostrarInstalar(true) }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  // Sesión
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSesion(data.session)
      setCargandoSesion(false)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_e, s) => setSesion(s))
    return () => listener.subscription.unsubscribe()
  }, [])

  // Perfil y banner
  useEffect(() => {
    async function obtenerPerfil() {
      if (!sesion?.user) { setRol(null); return }

      const { data: p } = await supabase
        .from('perfiles')
        .select('rol, ciudad, nombre, numero_tarjeta')
        .eq('id', sesion.user.id)
        .single()

      if (p) {
        setRol(p.rol || 'cliente')
        setCiudadUsuario(p.ciudad || 'Tegucigalpa')
        setPerfil(p)
        const hoy = new Date().toDateString()
        if (localStorage.getItem('enerpetrol_ultima_bienvenida') !== hoy) {
          localStorage.setItem('enerpetrol_ultima_bienvenida', hoy)
          setMostrarBienvenidaPersonal(true)
          setTimeout(() => setMostrarBienvenidaPersonal(false), 2400)
        }
      } else {
        const nombre = sesion.user.email?.split('@')[0] || 'Cliente'
        const tarjeta = 'ENP-' + Math.floor(1000 + Math.random() * 9000) + '-' + Math.floor(1000 + Math.random() * 9000)
        await supabase.from('perfiles').insert({
          id: sesion.user.id, nombre, numero_tarjeta: tarjeta,
          rol: 'cliente', ciudad: 'Tegucigalpa', galones_acumulados: 0,
        })
        setRol('cliente')
        setCiudadUsuario('Tegucigalpa')
        setPerfil({ nombre, numero_tarjeta: tarjeta })
      }

      if (!sessionStorage.getItem('enerpetrol_banner_visto')) {
        const { data: b } = await supabase
          .from('banners').select('*').eq('activo', true)
          .order('creado_en', { ascending: false }).limit(1).single()
        if (b) {
          setBanner(b); setMostrarBanner(true); setSegundos(10)
          sessionStorage.setItem('enerpetrol_banner_visto', 'true')
        }
      }
    }
    obtenerPerfil()
  }, [sesion])

  // Countdown banner
  useEffect(() => {
    if (!mostrarBanner) return
    if (segundos <= 0) { setMostrarBanner(false); return }
    const t = setTimeout(() => setSegundos((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [mostrarBanner, segundos])

  function copiarCodigo() {
    if (!perfil?.numero_tarjeta) return
    navigator.clipboard.writeText(perfil.numero_tarjeta).then(() => {
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    })
  }

  function compartirWhatsApp() {
    const codigo = perfil?.numero_tarjeta || ''
    const msg = REFERIDOS_ACTIVO()
      ? `Hola! Te invito a Enerpetrol, la app de descuentos en gasolineras de Honduras\n\nPara instalar:\n1. Abre este link en Chrome\n2. Toca "Agregar a pantalla de inicio"\n\nhttps://enerpetrol-app.vercel.app/\n\nAl registrarte ingresa mi codigo ${codigo} y ambos ganamos Enermonedas!`
      : 'Hola! Te invito a Enerpetrol, la app de descuentos en gasolineras de Honduras\n\nhttps://enerpetrol-app.vercel.app/'
    window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank')
  }

  async function cerrarSesion() {
    await supabase.auth.signOut()
    setVista('mapa')
  }

  // ─── Pantallas especiales ──────────────────────────────────

  if (modoRecuperacion) {
    return (
      <div style={{
        minHeight: '100dvh', display: 'flex',
        alignItems: 'center', justifyContent: 'center', padding: '0 24px',
        background: 'linear-gradient(155deg, #1C2226 0%, #0F2A4A 38%, #0A1620 100%)',
      }}>
        <div style={{
          width: '100%', maxWidth: 320, borderRadius: 20, padding: 24,
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <LogoMark size={48} />
          </div>
          <h3 style={{ color: '#fff', fontSize: 15, fontWeight: 600, textAlign: 'center', marginBottom: 16 }}>
            Nueva contraseña
          </h3>
          {passwordActualizado ? (
            <p style={{ color: GREEN_LIGHT, fontSize: 14, textAlign: 'center', padding: '16px 0' }}>
              Contraseña actualizada. Ya puedes iniciar sesión.
            </p>
          ) : (
            <>
              <input
                type="password" minLength={6} value={nuevaPassword}
                onChange={(e) => setNuevaPassword(e.target.value)}
                placeholder="Nueva contraseña (mín. 6 caracteres)"
                style={{
                  width: '100%', borderRadius: 12, padding: '12px 14px',
                  fontSize: 14, marginBottom: 12, outline: 'none',
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#F2F4F5',
                }}
              />
              <button
                disabled={actualizando || nuevaPassword.length < 6}
                onClick={async () => {
                  setActualizando(true)
                  const { error } = await supabase.auth.updateUser({ password: nuevaPassword })
                  setActualizando(false)
                  if (!error) {
                    setPasswordActualizado(true)
                    setTimeout(() => {
                      setModoRecuperacion(false)
                      setPasswordActualizado(false)
                      setNuevaPassword('')
                    }, 2500)
                  }
                }}
                style={{
                  width: '100%', borderRadius: 12, padding: '13px',
                  fontSize: 14, fontWeight: 600, border: 'none',
                  background: GREEN, color: '#fff', cursor: 'pointer', opacity: actualizando || nuevaPassword.length < 6 ? 0.5 : 1,
                }}>
                {actualizando ? 'Actualizando...' : 'Guardar nueva contraseña'}
              </button>
            </>
          )}
        </div>
      </div>
    )
  }

  if (mostrarBienvenida) {
    return (
      <Suspense fallback={<div style={{ minHeight: '100dvh', background: NAVY }} />}>
        <PantallaBienvenida onContinuar={() => setMostrarBienvenida(false)} />
      </Suspense>
    )
  }

  if (cargandoSesion) return <PantallaCarga />

  if (!sesion) {
    return (
      <Suspense fallback={<div style={{ minHeight: '100dvh', background: NAVY }} />}>
        <PantallaLogin onAutenticado={() => {}} />
      </Suspense>
    )
  }

  if (mostrarBienvenidaPersonal && perfil) {
    return (
      <div style={{
        minHeight: '100dvh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: '0 32px',
        background: 'linear-gradient(155deg, #0A1620 0%, #0F2A4A 50%, #1A3D6B 100%)',
        animation: 'epFadeIn 0.4s ease both',
      }}>
        <LogoMark size={60} />
        <div style={{ marginTop: 24, textAlign: 'center', animation: 'epFadeIn 0.6s 0.1s ease both', opacity: 0 }}>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginBottom: 6 }}>Bienvenido de vuelta</p>
          <p style={{ fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 6 }}>{perfil.nombre}</p>
          <p style={{ fontSize: 13, fontFamily: 'monospace', color: GREEN_LIGHT }}>{perfil.numero_tarjeta}</p>
        </div>
        <style>{`@keyframes epFadeIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>
      </div>
    )
  }

  const tabs = [
    { id: 'mapa',        label: 'Estaciones', icon: MapPin },
    { id: 'cliente',     label: 'Mi cuenta',  icon: User },
    { id: 'enermonedas', label: 'Enermonedas', icon: Coins },
    ...(rol === 'admin' ? [{ id: 'admin', label: 'Admin', icon: LayoutDashboard }] : []),
  ]

  return (
    <div style={{ minHeight: '100dvh', width: '100%', display: 'flex', justifyContent: 'center', background: darkMode ? '#010409' : '#E8EBEE' }}>
      <div style={{ width: '100%', maxWidth: 448, minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: bg }}>

        {/* ── Header ── */}
        <div style={{
          padding: '16px 20px 14px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: `1px solid ${border}`, background: card,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <LogoMark size={26} />
            <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.3px' }}>
              <span style={{ color: darkMode ? '#58A6FF' : NAVY }}>ENER</span>
              <span style={{ color: GREEN }}>PETROL</span>
            </span>
          </div>
          <button
            onClick={cerrarSesion}
            style={{
              fontSize: 12, color: textMuted, background: 'none', border: 'none',
              cursor: 'pointer', padding: '8px 12px', borderRadius: 8,
              minHeight: 36, // área de toque mínima
            }}>
            Cerrar sesión
          </button>
        </div>

        {/* ── Banner instalación ── */}
        {mostrarInstalar && (
          <div style={{
            padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12,
            background: 'linear-gradient(135deg, #0F2A4A 0%, #1A3D6B 100%)',
            borderBottom: '1px solid rgba(91,174,47,0.25)',
          }}>
            <LogoMark size={30} />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#fff', marginBottom: 2 }}>Instala Enerpetrol</p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>Accede más rápido desde tu pantalla de inicio</p>
            </div>
            <button
              onClick={async () => {
                if (promptInstalacion) {
                  promptInstalacion.prompt()
                  await promptInstalacion.userChoice
                  setMostrarInstalar(false)
                  setPromptInstalacion(null)
                }
              }}
              style={{
                fontSize: 12, fontWeight: 700, padding: '8px 14px',
                borderRadius: 10, border: 'none', background: GREEN,
                color: '#fff', cursor: 'pointer', flexShrink: 0,
              }}>
              Instalar
            </button>
            <button
              onClick={() => setMostrarInstalar(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, color: 'rgba(255,255,255,0.45)' }}>
              <X size={16} />
            </button>
          </div>
        )}

        {/* ── Modal Banner ── */}
        {mostrarBanner && banner && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 50,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 20px',
            background: 'rgba(0,0,0,0.65)',
          }}>
            <div style={{
              width: '100%', maxWidth: 360, borderRadius: 22, overflow: 'hidden',
              background: card, boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
            }}>
              <div style={{ padding: '18px 20px 14px', background: 'linear-gradient(135deg, #0F2A4A 0%, #1A3D6B 100%)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <LogoMark size={22} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Enerpetrol</span>
                  </div>
                  <button
                    onClick={() => setMostrarBanner(false)}
                    style={{
                      width: 28, height: 28, borderRadius: '50%', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      background: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer',
                    }}>
                    <X size={14} color="#fff" />
                  </button>
                </div>
                <span style={{ fontSize: 10, color: GREEN_LIGHT, letterSpacing: '2px', textTransform: 'uppercase' }}>
                  Aviso importante
                </span>
              </div>
              {banner.imagen_url
                ? <img src={banner.imagen_url} alt="Aviso" style={{ width: '100%', display: 'block' }} />
                : <div style={{ padding: '20px' }}><p style={{ fontSize: 14, lineHeight: 1.6, color: textPrimary }}>{banner.mensaje}</p></div>
              }
              <div style={{ padding: '16px 20px 20px', background: card }}>
                <button
                  onClick={() => setMostrarBanner(false)}
                  style={{
                    width: '100%', borderRadius: 14, padding: '14px',
                    fontSize: 14, fontWeight: 600, border: 'none',
                    background: `linear-gradient(135deg, ${GREEN} 0%, ${GREEN} 100%)`,
                    color: '#fff', cursor: 'pointer',
                  }}>
                  Continuar{segundos > 0 ? ` (${segundos})` : ''}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Modal Invitar ── */}
        {mostrarInvitar && perfil && (
          <div
            style={{
              position: 'fixed', inset: 0, zIndex: 50,
              display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
              padding: '0 16px 96px', background: 'rgba(0,0,0,0.55)',
            }}
            onClick={() => setMostrarInvitar(false)}>
            <div
              style={{ width: '100%', maxWidth: 360, borderRadius: 22, overflow: 'hidden', background: card }}
              onClick={(e) => e.stopPropagation()}>
              <div style={{ padding: '20px 20px 16px', background: 'linear-gradient(135deg, #0F2A4A 0%, #1A3D6B 100%)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ color: '#fff', fontWeight: 700, fontSize: 16, marginBottom: 3 }}>Invita a un amigo</p>
                    <p style={{ fontSize: 12, color: REFERIDOS_ACTIVO() ? GREEN_LIGHT : '#8B949E' }}>
                      {REFERIDOS_ACTIVO() ? 'Gana 1 Enermoneda por cada referido' : 'Comparte la app con tus amigos'}
                    </p>
                  </div>
                  <button
                    onClick={() => setMostrarInvitar(false)}
                    style={{
                      width: 30, height: 30, borderRadius: '50%', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      background: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer',
                    }}>
                    <X size={15} color="#fff" />
                  </button>
                </div>
              </div>
              <div style={{ padding: '20px' }}>
                {REFERIDOS_ACTIVO() && (
                  <>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      borderRadius: 14, border: `1.5px solid ${GREEN}`,
                      padding: '12px 14px', marginBottom: 12,
                      background: darkMode ? '#0D2818' : 'rgba(91,174,47,0.07)',
                    }}>
                      <p style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 700, flex: 1, color: GREEN }}>
                        {perfil.numero_tarjeta}
                      </p>
                      <button
                        onClick={copiarCodigo}
                        style={{
                          fontSize: 12, fontWeight: 600, padding: '7px 14px', borderRadius: 10, border: 'none',
                          background: copiado ? GREEN : 'rgba(91,174,47,0.15)',
                          color: copiado ? '#fff' : GREEN, cursor: 'pointer', transition: 'all 0.2s',
                        }}>
                        {copiado ? 'Copiado' : 'Copiar'}
                      </button>
                    </div>
                    <p style={{ fontSize: 12, color: textMuted, marginBottom: 16 }}>
                      Tu amigo debe ingresar este código al registrarse.
                    </p>
                  </>
                )}
                {!REFERIDOS_ACTIVO() && (
                  <p style={{ fontSize: 12, color: textMuted, marginBottom: 16 }}>
                    Comparte Enerpetrol con tus amigos para que disfruten los descuentos.
                  </p>
                )}
                <button
                  onClick={compartirWhatsApp}
                  style={{
                    width: '100%', borderRadius: 14, padding: '14px',
                    fontSize: 14, fontWeight: 700, border: 'none',
                    background: '#25D366', color: '#fff', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.117 1.528 5.844L.054 23.5l5.813-1.452A11.934 11.934 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.892a9.875 9.875 0 01-5.031-1.378l-.361-.214-3.741.981 1.003-3.635-.235-.374A9.86 9.86 0 012.108 12C2.108 6.561 6.561 2.108 12 2.108c5.438 0 9.892 4.453 9.892 9.892 0 5.438-4.454 9.892-9.892 9.892z"/>
                  </svg>
                  Compartir por WhatsApp
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Contenido ── */}
        <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 80 }}>
          <Suspense fallback={<Spinner />}>
            {vista === 'mapa'        && <VistaMapa        ciudad={ciudadUsuario} darkMode={darkMode} />}
            {vista === 'enermonedas' && <VistaEnermonedas usuario={sesion.user} />}
            {vista === 'cliente'     && <VistaCliente     usuario={sesion.user} darkMode={darkMode} />}
            {vista === 'admin'       && rol === 'admin' && <VistaAdmin darkMode={darkMode} />}
          </Suspense>
        </div>

        {/* ── FAB Invitar ── */}
        {sesion && perfil && (
          <button
            onClick={() => setMostrarInvitar(true)}
            style={{
              position: 'fixed', bottom: 80, right: 16, zIndex: 40,
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '10px 16px', borderRadius: 99, border: 'none',
              background: `linear-gradient(135deg, ${GREEN} 0%, ${GREEN} 100%)`,
              boxShadow: '0 4px 18px rgba(91,174,47,0.5)',
              cursor: 'pointer',
            }}>
            <UserPlus size={15} color="#fff" />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>Invitar</span>
          </button>
        )}

        {/* ── Tab Bar con safe area ── */}
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 30,
          maxWidth: 448, margin: '0 auto',
          display: 'flex',
          borderTop: `1px solid ${border}`,
          background: card,
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}>
          {tabs.map(({ id, label, icon: Icon }) => {
            const activo = vista === id
            return (
              <button
                key={id}
                onClick={() => setVista(id)}
                style={{
                  flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                  gap: 3, padding: '10px 4px 10px', border: 'none', background: 'none', cursor: 'pointer',
                  minHeight: 56,
                }}>
                <Icon size={20} color={activo ? GREEN : textMuted} />
                <span style={{
                  fontSize: 10, fontWeight: activo ? 600 : 400,
                  color: activo ? GREEN : textMuted,
                  letterSpacing: activo ? '0.2px' : '0',
                }}>
                  {label}
                </span>
                {activo && (
                  <div style={{
                    position: 'absolute', bottom: 'env(safe-area-inset-bottom, 0px)',
                    width: 20, height: 2, borderRadius: 1, background: GREEN,
                  }} />
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
