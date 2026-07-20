import React, { useState, useEffect, lazy, Suspense } from 'react'
import { MapPin, User, LayoutDashboard, X, UserPlus } from 'lucide-react'
import { supabase } from './supabaseClient'
import { LogoMark } from './components/Logo'
import { BG, BORDER, CARD, GREEN, GREEN_LIGHT, NAVY, TEXT_MUTED, DARK_BG, DARK_CARD, DARK_BORDER, DARK_TEXT_MUTED } from './theme'

const PantallaBienvenida = lazy(() => import('./screens/PantallaBienvenida'))
const PantallaLogin = lazy(() => import('./screens/PantallaLogin'))
const VistaMapa = lazy(() => import('./screens/VistaMapa'))
const VistaCliente = lazy(() => import('./screens/VistaCliente'))
const VistaAdmin = lazy(() => import('./screens/VistaAdmin'))

function esModoOscuro() {
  const hora = new Date().getHours()
  return hora >= 18 || hora < 6
}

const REFERIDOS_ACTIVO = () => {
  const ahora = new Date()
  return ahora >= new Date('2026-07-01') && ahora <= new Date('2026-08-15T23:59:59')
}

export default function App() {
  const [mostrarBienvenida, setMostrarBienvenida] = useState(true)
  const [sesion, setSesion] = useState(null)
  const [rol, setRol] = useState(null)
  const [ciudadUsuario, setCiudadUsuario] = useState('Tegucigalpa')
  const [cargandoSesion, setCargandoSesion] = useState(true)
  const [vista, setVista] = useState('mapa')
  const [banner, setBanner] = useState(null)
  const [mostrarBanner, setMostrarBanner] = useState(false)
  const [segundos, setSegundos] = useState(10)
  const [darkMode, setDarkMode] = useState(esModoOscuro())
  const [perfil, setPerfil] = useState(null)
  const [mostrarInvitar, setMostrarInvitar] = useState(false)
  const [copiado, setCopiado] = useState(false)
  const [modoRecuperacion, setModoRecuperacion] = useState(false)
  const [nuevaPassword, setNuevaPassword] = useState('')
  const [actualizando, setActualizando] = useState(false)
  const [passwordActualizado, setPasswordActualizado] = useState(false)
  const [mostrarBienvenidaPersonal, setMostrarBienvenidaPersonal] = useState(false)

  useEffect(() => {
    const intervalo = setInterval(() => setDarkMode(esModoOscuro()), 60000)
    return () => clearInterval(intervalo)
  }, [])

  useEffect(() => {
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setModoRecuperacion(true)
    })
  }, [])

  const bg = darkMode ? DARK_BG : BG
  const card = darkMode ? DARK_CARD : CARD
  const border = darkMode ? DARK_BORDER : BORDER
  const textMuted = darkMode ? DARK_TEXT_MUTED : TEXT_MUTED
  const textPrimary = darkMode ? '#E6EDF3' : NAVY

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSesion(data.session)
      setCargandoSesion(false)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSesion(session)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    async function obtenerPerfil() {
      if (!sesion?.user) { setRol(null); return }

      const { data: perfilExistente } = await supabase
        .from('perfiles')
        .select('rol, ciudad, nombre, numero_tarjeta')
        .eq('id', sesion.user.id)
        .single()

      if (perfilExistente) {
        setRol(perfilExistente.rol || 'cliente')
        setCiudadUsuario(perfilExistente.ciudad || 'Tegucigalpa')
        setPerfil(perfilExistente)
        const hoy = new Date().toDateString()
        const ultimaBienvenida = localStorage.getItem('enerpetrol_ultima_bienvenida')
        if (ultimaBienvenida !== hoy) {
          localStorage.setItem('enerpetrol_ultima_bienvenida', hoy)
          setMostrarBienvenidaPersonal(true)
          setTimeout(() => setMostrarBienvenidaPersonal(false), 2500)
        }
      } else {
        const nombreEmail = sesion.user.email?.split('@')[0] || 'Cliente'
        const numeroTarjeta = 'ENP-' + Math.floor(1000 + Math.random() * 9000) + '-' + Math.floor(1000 + Math.random() * 9000)
        await supabase.from('perfiles').insert({
          id: sesion.user.id,
          nombre: nombreEmail,
          numero_tarjeta: numeroTarjeta,
          rol: 'cliente',
          ciudad: 'Tegucigalpa',
          galones_acumulados: 0,
        })
        setRol('cliente')
        setCiudadUsuario('Tegucigalpa')
        setPerfil({ nombre: nombreEmail, numero_tarjeta: numeroTarjeta })
      }

      if (!sessionStorage.getItem('enerpetrol_banner_visto')) {
        const { data: bannerData } = await supabase
          .from('banners')
          .select('*')
          .eq('activo', true)
          .order('creado_en', { ascending: false })
          .limit(1)
          .single()
        if (bannerData) {
          setBanner(bannerData)
          setMostrarBanner(true)
          setSegundos(10)
          sessionStorage.setItem('enerpetrol_banner_visto', 'true')
        }
      }
    }
    obtenerPerfil()
  }, [sesion])

  useEffect(() => {
    if (!mostrarBanner) return
    if (segundos <= 0) { setMostrarBanner(false); return }
    const timer = setTimeout(() => setSegundos((s) => s - 1), 1000)
    return () => clearTimeout(timer)
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
    let mensaje
    if (REFERIDOS_ACTIVO()) {
      mensaje = `Hola! Te invito a unirte a Enerpetrol, la app de descuentos en gasolineras de Honduras 🚗⛽\n\nPara instalar la app:\n1. Copia este link\n2. Abrelo en Chrome (no desde WhatsApp)\n3. Toca "Agregar a pantalla de inicio"\n\n🔗 https://enerpetrol-app.vercel.app/\n\nAl registrarte ingresa mi codigo *${codigo}* y ambos ganamos Enermonedas!`
    } else {
      mensaje = `Hola! Te invito a unirte a Enerpetrol, la app de descuentos en gasolineras de Honduras 🚗⛽\n\nPara instalar la app:\n1. Copia este link\n2. Abrelo en Chrome (no desde WhatsApp)\n3. Toca "Agregar a pantalla de inicio"\n\n🔗 https://enerpetrol-app.vercel.app/`
    }
    window.open('https://wa.me/?text=' + encodeURIComponent(mensaje), '_blank')
  }

  async function cerrarSesion() {
    await supabase.auth.signOut()
    setVista('mapa')
  }

  if (modoRecuperacion) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6"
        style={{ background: `linear-gradient(155deg, #1C2226 0%, ${NAVY} 38%, #0A1620 100%)` }}>
        <div className="w-full max-w-xs rounded-2xl p-6"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}>
          <div className="flex justify-center mb-4"><LogoMark size={48} /></div>
          <h3 className="text-white text-base font-semibold mb-2 text-center">Nueva contrasena</h3>
          <p className="text-xs mb-4 text-center" style={{ color: '#B9C2CC' }}>
            Ingresa tu nueva contrasena para acceder a tu cuenta.
          </p>
          {passwordActualizado ? (
            <p className="text-sm text-center font-semibold py-4" style={{ color: GREEN_LIGHT }}>
              Contrasena actualizada correctamente. Ya puedes iniciar sesion.
            </p>
          ) : (
            <>
              <input type="password" placeholder="Nueva contrasena (min. 6 caracteres)"
                value={nuevaPassword} onChange={(e) => setNuevaPassword(e.target.value)}
                className="w-full rounded-lg px-3 py-2.5 text-sm mb-4 focus:outline-none"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#F2F4F5' }}
                minLength={6} />
              <button disabled={actualizando || nuevaPassword.length < 6}
                onClick={async () => {
                  setActualizando(true)
                  const { error } = await supabase.auth.updateUser({ password: nuevaPassword })
                  setActualizando(false)
                  if (!error) {
                    setPasswordActualizado(true)
                    setTimeout(() => { setModoRecuperacion(false); setPasswordActualizado(false); setNuevaPassword('') }, 2500)
                  }
                }}
                className="w-full rounded-xl py-3 text-sm font-semibold disabled:opacity-50"
                style={{ background: GREEN, color: '#0B1A12' }}>
                {actualizando ? 'Actualizando...' : 'Guardar nueva contrasena'}
              </button>
            </>
          )}
        </div>
      </div>
    )
  }

  if (mostrarBienvenida) {
    return <PantallaBienvenida onContinuar={() => setMostrarBienvenida(false)} />
  }

  if (cargandoSesion) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6"
        style={{ background: `linear-gradient(155deg, #0A1620 0%, ${NAVY} 50%, #1A3D6B 100%)` }}>
        <div style={{ animation: 'pulse 1.5s ease-in-out infinite' }}>
          <LogoMark size={80} />
        </div>
        <div className="flex flex-col items-center gap-2">
          <span className="text-lg font-bold tracking-tight">
            <span style={{ color: '#ffffff' }}>ENER</span>
            <span style={{ color: GREEN }}>PETROL</span>
          </span>
          <div className="w-48 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.15)' }}>
            <div className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${GREEN}, #8FCB4D)`, animation: 'loading 1.5s ease-in-out infinite', width: '40%' }} />
          </div>
        </div>
        <style>{`
          @keyframes pulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.08); opacity: 0.85; } }
          @keyframes loading { 0% { transform: translateX(-100%); } 100% { transform: translateX(350%); } }
        `}</style>
      </div>
    )
  }

  if (!sesion) {
    return (
      <Suspense fallback={<div className="min-h-screen" style={{ background: NAVY }} />}>
        <PantallaLogin onAutenticado={() => {}} />
      </Suspense>
    )
  }

  if (mostrarBienvenidaPersonal && perfil) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-8"
        style={{ background: `linear-gradient(155deg, #0A1620 0%, ${NAVY} 50%, #1A3D6B 100%)` }}>
        <div style={{ animation: 'fadeIn 0.5s ease-in-out' }}>
          <LogoMark size={64} />
        </div>
        <div className="mt-6 text-center" style={{ animation: 'fadeIn 0.8s ease-in-out' }}>
          <p className="text-sm mb-1" style={{ color: 'rgba(255,255,255,0.6)' }}>Bienvenido de vuelta</p>
          <p className="text-2xl font-bold text-white">{perfil.nombre}</p>
          <p className="mt-2 text-sm font-mono" style={{ color: GREEN_LIGHT }}>{perfil.numero_tarjeta}</p>
        </div>
        <style>{`
          @keyframes fadeIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        `}</style>
      </div>
    )
  }

  const tabs = [
    { id: 'mapa', label: 'Estaciones', icon: MapPin },
    { id: 'cliente', label: 'Mi cuenta', icon: User },
    ...(rol === 'admin' ? [{ id: 'admin', label: 'Admin', icon: LayoutDashboard }] : []),
  ]

  return (
    <div className="min-h-screen w-full flex justify-center" style={{ background: darkMode ? '#010409' : '#E8EBEE' }}>
      <div className="w-full max-w-md min-h-screen flex flex-col relative" style={{ background: bg }}>

        <div className="px-5 pt-6 pb-4 flex items-center justify-between border-b" style={{ borderColor: border, background: card }}>
          <div className="flex items-center gap-2">
            <LogoMark size={28} />
            <span className="text-lg font-bold tracking-tight">
              <span style={{ color: darkMode ? '#58A6FF' : NAVY }}>ENER</span>
              <span style={{ color: GREEN }}>PETROL</span>
            </span>
          </div>
          <button onClick={cerrarSesion} className="text-xs" style={{ color: textMuted }}>Cerrar sesion</button>
        </div>

        <div className="px-5 py-2 text-center" style={{ background: card, borderBottom: `1px solid ${border}` }}>
          <p className="text-[10px] uppercase tracking-widest" style={{ color: textMuted }}>
            Conectamos consumidores. Generamos ahorro.
          </p>
        </div>

        {mostrarBanner && banner && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-6" style={{ background: 'rgba(0,0,0,0.7)' }}>
            <div className="w-full max-w-sm rounded-2xl overflow-hidden" style={{ background: card, boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
              <div className="px-5 pt-5 pb-3" style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #1A3D6B 100%)` }}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <LogoMark size={24} />
                    <span className="text-sm font-bold text-white">Enerpetrol</span>
                  </div>
                  <button onClick={() => setMostrarBanner(false)} className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.15)' }}>
                    <X size={14} className="text-white" />
                  </button>
                </div>
                <p className="text-[10px] uppercase tracking-widest" style={{ color: GREEN_LIGHT }}>Aviso importante</p>
              </div>
              {banner.imagen_url ? (
                <img src={banner.imagen_url} alt="Aviso Enerpetrol" className="w-full" style={{ display: 'block' }} />
              ) : (
                <div className="px-5 py-6">
                  <p className="text-sm leading-relaxed" style={{ color: textPrimary }}>{banner.mensaje}</p>
                </div>
              )}
              <div className="px-5 pb-5 pt-4" style={{ background: card }}>
                <button onClick={() => setMostrarBanner(false)} className="w-full rounded-xl py-3 text-sm font-semibold text-white"
                  style={{ background: `linear-gradient(135deg, ${GREEN} 0%, #3D7A1F 100%)` }}>
                  Continuar {segundos > 0 ? `(${segundos})` : ''}
                </button>
              </div>
            </div>
          </div>
        )}

        {mostrarInvitar && perfil && (
          <div className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-24" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={() => setMostrarInvitar(false)}>
            <div className="w-full max-w-sm rounded-2xl overflow-hidden" style={{ background: card, boxShadow: '0 -8px 40px rgba(0,0,0,0.3)' }} onClick={(e) => e.stopPropagation()}>
              <div className="px-5 pt-5 pb-4" style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #1A3D6B 100%)` }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-bold text-base">Invita a un amigo</p>
                    {REFERIDOS_ACTIVO() ? (
                      <p className="text-xs mt-0.5" style={{ color: GREEN_LIGHT }}>Gana 1 Enermoneda por cada referido hasta el 15 de agosto</p>
                    ) : (
                      <p className="text-xs mt-0.5" style={{ color: '#8B949E' }}>Comparte la app con tus amigos</p>
                    )}
                  </div>
                  <button onClick={() => setMostrarInvitar(false)} className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.15)' }}>
                    <X size={15} className="text-white" />
                  </button>
                </div>
              </div>
              <div className="px-5 py-5">
                {REFERIDOS_ACTIVO() && (
                  <>
                    <p className="text-xs mb-2 font-semibold" style={{ color: textPrimary }}>Tu codigo de referido:</p>
                    <div className="flex items-center gap-2 rounded-xl border px-4 py-3 mb-4" style={{ borderColor: GREEN, background: darkMode ? '#0D2818' : `${GREEN}0D` }}>
                      <p className="font-mono text-lg font-bold flex-1" style={{ color: GREEN }}>{perfil.numero_tarjeta}</p>
                      <button onClick={copiarCodigo} className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ background: copiado ? GREEN : `${GREEN}20`, color: copiado ? '#fff' : GREEN }}>
                        {copiado ? 'Copiado' : 'Copiar'}
                      </button>
                    </div>
                    <p className="text-xs mb-4" style={{ color: textMuted }}>Tu amigo debe ingresar este codigo al registrarse. Cuando suba su primera factura, recibiras 1 Enermoneda automaticamente.</p>
                  </>
                )}
                {!REFERIDOS_ACTIVO() && (
                  <p className="text-xs mb-4" style={{ color: textMuted }}>Comparte la app Enerpetrol con tus amigos y familiares para que tambien disfruten de los descuentos en gasolineras de Honduras.</p>
                )}
                <button onClick={compartirWhatsApp} className="w-full rounded-xl py-3.5 text-sm font-bold flex items-center justify-center gap-2 text-white mb-3" style={{ background: '#25D366' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.117 1.528 5.844L.054 23.5l5.813-1.452A11.934 11.934 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.892a9.875 9.875 0 01-5.031-1.378l-.361-.214-3.741.981 1.003-3.635-.235-.374A9.86 9.86 0 012.108 12C2.108 6.561 6.561 2.108 12 2.108c5.438 0 9.892 4.453 9.892 9.892 0 5.438-4.454 9.892-9.892 9.892z"/>
                  </svg>
                  Compartir por WhatsApp
                </button>
                <p className="text-[10px] text-center" style={{ color: textMuted }}>Link: enerpetrol-app.vercel.app</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          <Suspense fallback={
            <div className="flex items-center justify-center h-40">
              <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: GREEN, borderTopColor: 'transparent' }} />
            </div>
          }>
            {vista === 'mapa' && <VistaMapa ciudad={ciudadUsuario} darkMode={darkMode} />}
            {vista === 'cliente' && <VistaCliente usuario={sesion.user} darkMode={darkMode} />}
            {vista === 'admin' && rol === 'admin' && <VistaAdmin darkMode={darkMode} />}
          </Suspense>
        </div>

        {sesion && perfil && (
          <button onClick={() => setMostrarInvitar(true)}
            className="absolute right-4 flex items-center gap-2 rounded-full px-4 py-2.5 shadow-lg"
            style={{ bottom: '72px', background: `linear-gradient(135deg, ${GREEN} 0%, #3D7A1F 100%)`, boxShadow: `0 4px 16px ${GREEN}60`, zIndex: 40 }}>
            <UserPlus size={16} className="text-white" />
            <span className="text-xs font-bold text-white">Invita a un amigo</span>
          </button>
        )}

        <div className="border-t flex" style={{ borderColor: border, background: card }}>
          {tabs.map((t) => {
            const Icon = t.icon
            const activo = vista === t.id
            return (
              <button key={t.id} onClick={() => setVista(t.id)} className="flex-1 flex flex-col items-center gap-1 py-3">
                <Icon size={18} style={{ color: activo ? GREEN : textMuted }} />
                <span className="text-[10px]" style={{ color: activo ? GREEN : textMuted }}>{t.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
