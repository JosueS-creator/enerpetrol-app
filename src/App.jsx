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
    return <PantallaBienvenida onCont
