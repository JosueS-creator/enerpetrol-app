import React, { useState, useEffect } from 'react'
import { MapPin, User, LayoutDashboard, X } from 'lucide-react'
import { supabase } from './supabaseClient'
import { LogoMark } from './components/Logo'
import PantallaBienvenida from './screens/PantallaBienvenida'
import PantallaLogin from './screens/PantallaLogin'
import VistaMapa from './screens/VistaMapa'
import VistaCliente from './screens/VistaCliente'
import VistaAdmin from './screens/VistaAdmin'
import { BG, BORDER, CARD, GREEN, GREEN_LIGHT, NAVY, TEXT_MUTED } from './theme'

export default function App() {
  const [mostrarBienvenida, setMostrarBienvenida] = useState(true)
  const [sesion, setSesion] = useState(null)
  const [rol, setRol] = useState(null)
  const [ciudadUsuario, setCiudadUsuario] = useState('Tegucigalpa')
  const [cargandoSesion, setCargandoSesion] = useState(true)
  const [vista, setVista] = useState('mapa')
  const [banner, setBanner] = useState(null)
  const [mostrarBanner, setMostrarBanner] = useState(false)
  const [segundos, setSegundos] = useState(5)

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
      if (!sesion?.user) {
        setRol(null)
        return
      }

      const { data: perfilExistente } = await supabase
        .from('perfiles')
        .select('rol, ciudad')
        .eq('id', sesion.user.id)
        .single()

      if (perfilExistente) {
        setRol(perfilExistente.rol || 'cliente')
        setCiudadUsuario(perfilExistente.ciudad || 'Tegucigalpa')
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
        setSegundos(5)
      }
    }

    obtenerPerfil()
  }, [sesion])

  useEffect(() => {
    if (!mostrarBanner) return
    if (segundos <= 0) {
      setMostrarBanner(false)
      return
    }
    const timer = setTimeout(() => setSegundos((s) => s - 1), 1000)
    return () => clearTimeout(timer)
  }, [mostrarBanner, segundos])

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
    <div className="min-h-screen w-full flex justify-center" style={{ background: '#E8EBEE' }}>
      <div className="w-full max-w-md min-h-screen flex flex-col" style={{ background: BG }}>

        <div className="px-5 pt-6 pb-4 flex items-center justify-between border-b" style={{ borderColor: BORDER, background: CARD }}>
          <div className="flex items-center gap-2">
            <LogoMark size={28} />
            <span className="text-lg font-bold tracking-tight">
              <span style={{ color: NAVY }}>ENER</span>
              <span style={{ color: GREEN }}>PETROL</span>
            </span>
          </div>
          <button onClick={cerrarSesion} className="text-xs" style={{ color: TEXT_MUTED }}>
            Cerrar sesion
          </button>
        </div>

        <div className="px-5 py-2 text-center" style={{ background: CARD, borderBottom: `1px solid ${BORDER}` }}>
          <p className="text-[10px] uppercase tracking-widest" style={{ color: TEXT_MUTED }}>
            Conectamos consumidores. Generamos ahorro.
          </p>
        </div>

        {mostrarBanner && banner && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-6"
            style={{ background: 'rgba(0,0,0,0.7)' }}>
            <div className="w-full max-w-sm rounded-2xl overflow-hidden"
              style={{ background: CARD, boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>

              <div className="px-5 pt-5 pb-3" style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #1A3D6B 100%)` }}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <LogoMark size={24} />
                    <span className="text-sm font-bold text-white">Enerpetrol</span>
                  </div>
                  <button onClick={() => setMostrarBanner(false)}
                    className="w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(255,255,255,0.15)' }}>
                    <X size={14} className="text-white" />
                  </button>
                </div>
                <p className="text-[10px] uppercase tracking-widest" style={{ color: GREEN_LIGHT }}>
                  Aviso importante
                </p>
              </div>

              {banner.imagen_url ? (
                <img
                  src={banner.imagen_url}
                  alt="Aviso Enerpetrol"
                  className="w-full"
                  style={{ display: 'block' }}
                />
              ) : (
                <div className="px-5 py-6">
                  <p className="text-sm leading-relaxed" style={{ color: NAVY }}>
                    {banner.mensaje}
                  </p>
                </div>
              )}

              <div className="px-5 pb-5 pt-4">
                <button
                  onClick={() => setMostrarBanner(false)}
                  className="w-full rounded-xl py-3 text-sm font-semibold text-white"
                  style={{ background: `linear-gradient(135deg, ${GREEN} 0%, #3D7A1F 100%)` }}
                >
                  Continuar {segundos > 0 ? `(${segundos})` : ''}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {vista === 'mapa' && <VistaMapa ciudad={ciudadUsuario} />}
          {vista === 'cliente' && <VistaCliente usuario={sesion.user} />}
          {vista === 'admin' && rol === 'admin' && <VistaAdmin />}
        </div>

        <div className="border-t flex" style={{ borderColor: BORDER, background: CARD }}>
          {tabs.map((t) => {
            const Icon = t.icon
            const activo = vista === t.id
            return (
              <button key={t.id} onClick={() => setVista(t.id)} className="flex-1 flex flex-col items-center gap-1 py-3">
                <Icon size={18} style={{ color: activo ? GREEN : '#9AA5AE' }} />
                <span className="text-[10px]" style={{ color: activo ? GREEN : '#9AA5AE' }}>{t.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
