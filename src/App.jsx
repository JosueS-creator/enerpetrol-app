import React, { useState, useEffect } from 'react'
import { MapPin, User, LayoutDashboard, X, UserPlus } from 'lucide-react'
import { supabase } from './supabaseClient'
import { LogoMark } from './components/Logo'
import PantallaBienvenida from './screens/PantallaBienvenida'
import PantallaLogin from './screens/PantallaLogin'
import VistaMapa from './screens/VistaMapa'
import VistaCliente from './screens/VistaCliente'
import VistaAdmin from './screens/VistaAdmin'
import { BG, BORDER, CARD, GREEN, GREEN_LIGHT, NAVY, TEXT_MUTED, DARK_BG, DARK_CARD, DARK_BORDER, DARK_TEXT_MUTED } from './theme'

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

  useEffect(() => {
    const intervalo = setInterval(() => setDarkMode(esModoOscuro()), 60000)
    return () => clearInterval(intervalo)
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
    const nombre = perfil?.nombre || ''
    let mensaje
    if (REFERIDOS_ACTIVO()) {
      mensaje = `Hola! Te invito a unirte a Enerpetrol, la app que te da descuentos en gasolineras de Honduras. Registrate con mi codigo ${codigo} y ambos ganamos Enermonedas. Descarga la app aqui: https://enerpetrol-app-git-main-enerpetrol.vercel.app`
    } else {
      mensaje = `Hola! Te invito a unirte a Enerpetrol, la app que te da descuentos en gasolineras de Honduras. Descarga la app aqui: https://enerpetrol-app-git-main-enerpetrol.vercel.app`
    }
    window.open('https://wa.me/?text=' + encodeURIComponent(mensaje), '_blank')
  }

  async function cerrarSesion() {
    await supabase.auth.signOut()
    setVista('mapa')
  }

  if (mostrarBienvenida) {
    return <PantallaBienvenida onContinuar={() => setMostrarBienvenida(false)} />
  }

  if (cargandoSesion) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: NAVY }}>
        <LogoMark size={64} />
      </div>
    )
  }

  if (!sesion) {
    return <PantallaLogin onAutenticado={() => {}} />
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
          <button onClick={cerrarSesion} className="text-xs" style={{ color: textMuted }}>
            Cerrar sesion
          </button>
        </div>

        <div className="px-5 py-2 text-center" style={{ background: card, borderBottom: `1px solid ${border}` }}>
          <p className="text-[10px] uppercase tracking-widest" style={{ color: textMuted }}>
            Conectamos consumidores. Generamos ahorro.
          </p>
        </div>

        {mostrarBanner && banner && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-6"
            style={{ background: 'rgba(0,0,0,0.7)' }}>
            <div className="w-full max-w-sm rounded-2xl overflow-hidden"
              style={{ background: card, boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
              <div className="px-5 pt-5 pb-3" style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #1A3D6B 100%)` }}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <LogoMark size={24} />
                    <span className="text-sm font-bold text-white">Enerpetrol</span>
