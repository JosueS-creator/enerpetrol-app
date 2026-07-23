import React, { useState, useEffect, useRef } from 'react'
import { Navigation, LocateFixed } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { NAVY, NAVY_SOFT, GREEN, BORDER, CARD, TEXT_MUTED, CIUDADES, DARK_BG, DARK_CARD, DARK_BORDER, DARK_TEXT_MUTED } from '../theme'

function urlWaze(lat, lng) {
  return `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`
}

export default function VistaMapa({ ciudad: ciudadPerfil, darkMode }) {
  const [ciudadVista, setCiudadVista] = useState(ciudadPerfil)
  const [estacionesBD, setEstacionesBD] = useState([])
  const [cargandoEstaciones, setCargandoEstaciones] = useState(true)
  const [ubicacion, setUbicacion] = useState(null)
  const [estado, setEstado] = useState('inicial')
  const [seleccion, setSeleccion] = useState(null)
  const mapRef = useRef(null)
  const mapaInstancia = useRef(null)
  const marcadores = useRef([])

  const bg = darkMode ? DARK_BG : '#F7F8FA'
  const card = darkMode ? DARK_CARD : CARD
  const border = darkMode ? DARK_BORDER : BORDER
  const textMuted = darkMode ? DARK_TEXT_MUTED : TEXT_MUTED
  const textPrimary = darkMode ? '#E6EDF3' : NAVY

  useEffect(() => {
    // Cargar Leaflet CSS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link')
      link.id = 'leaflet-css'
      link.rel = 'stylesheet'
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css'
      document.head.appendChild(link)
    }
    // Cargar Leaflet JS
    if (!window.L) {
      const script = document.createElement('script')
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js'
      script.onload = () => inicializarMapa()
      document.head.appendChild(script)
    } else {
      inicializarMapa()
    }
    return () => {
      if (mapaInstancia.current) {
        mapaInstancia.current.remove()
        mapaInstancia.current = null
      }
    }
  }, [])

  function inicializarMapa() {
    if (!mapRef.current || mapaInstancia.current) return
    const L = window.L
    const mapa = L.map(mapRef.current, {
      center: [14.0818, -87.2068],
      zoom: 13,
      zoomControl: false,
    })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 19,
    }).addTo(mapa)
    L.control.zoom({ position: 'bottomright' }).addTo(mapa)
    mapaInstancia.current = mapa
  }

  useEffect(() => {
    async function cargarEstaciones() {
      setCargandoEstaciones(true)
      const { data, error } = await supabase
        .from('estaciones')
        .select('*')
        .eq('activa', true)
        .eq('ciudad', ciudadVista)
      if (!error && data) setEstacionesBD(data)
      setCargandoEstaciones(false)
    }
    cargarEstaciones()
    setSeleccion(null)
  }, [ciudadVista])

  useEffect(() => {
    if (!mapaInstancia.current || !window.L || estacionesBD.length === 0) return
    const L = window.L
    const mapa = mapaInstancia.current

    // Limpiar marcadores anteriores
    marcadores.current.forEach((m) => mapa.removeLayer(m))
    marcadores.current = []

    // Ícono personalizado Enerpetrol
    const iconoEnerpetrol = L.divIcon({
      className: '',
      html: `
        <div style="
          background: linear-gradient(135deg, #0F2A4A 0%, #1A3D6B 100%);
          border: 2.5px solid #5BAE2F;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.35);
        ">
          <div style="transform: rotate(45deg); color: #5BAE2F; font-weight: 900; font-size: 11px; line-height: 1;">E</div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 36],
      popupAnchor: [0, -36],
    })

    estacionesBD.forEach((e) => {
      const marcador = L.marker([e.lat, e.lng], { icon: iconoEnerpetrol })
        .addTo(mapa)
        .bindPopup(`
          <div style="font-family: sans-serif; min-width: 160px;">
            <p style="font-weight: 700; color: #0F2A4A; margin: 0 0 4px 0; font-size: 13px;">${e.nombre}</p>
            ${e.descuento ? `<p style="color: #5BAE2F; font-weight: 700; font-size: 12px; margin: 0 0 6px 0;">L ${e.descuento} de descuento</p>` : ''}
            <a href="${urlWaze(e.lat, e.lng)}" target="_blank"
              style="background: #33CCFF; color: white; padding: 5px 10px; border-radius: 6px; font-size: 11px; font-weight: 600; text-decoration: none; display: block; text-align: center;">
              Ir con Waze
            </a>
          </div>
        `)
        .on('click', () => setSeleccion(e))
      marcadores.current.push(marcador)
    })

    // Centrar mapa en las estaciones
    if (estacionesBD.length > 0) {
      const bounds = L.latLngBounds(estacionesBD.map((e) => [e.lat, e.lng]))
      mapa.fitBounds(bounds, { padding: [40, 40] })
    }
  }, [estacionesBD])

  useEffect(() => {
    if (!mapaInstancia.current || !window.L || !ubicacion) return
    const L = window.L
    const mapa = mapaInstancia.current
    const iconoUbicacion = L.divIcon({
      className: '',
      html: `<div style="width:14px;height:14px;background:#0F2A4A;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.4);"></div>`,
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    })
    L.marker([ubicacion.lat, ubicacion.lng], { icon: iconoUbicacion }).addTo(mapa)
  }, [ubicacion])

  function pedirUbicacion() {
    if (!navigator.geolocation) { setEstado('error'); return }
    setEstado('buscando')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setUbicacion(loc)
        setEstado('ok')
        if (mapaInstancia.current) {
          mapaInstancia.current.setView([loc.lat, loc.lng], 14)
        }
      },
      () => setEstado('error'),
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }

  useEffect(() => { pedirUbicacion() }, [])

  const estacionesOrdenadas = ubicacion
    ? [...estacionesBD].sort((a, b) => {
        const distA = Math.sqrt((a.lat - ubicacion.lat) ** 2 + (a.lng - ubicacion.lng) ** 2)
        const distB = Math.sqrt((b.lat - ubicacion.lat) ** 2 + (b.lng - ubicacion.lng) ** 2)
        return distA - distB
      })
    : estacionesBD

  const estacionCercana = estacionesOrdenadas[0]

  if (cargandoEstaciones && estacionesBD.length === 0) {
    return <div className="px-5 pt-6 text-sm" style={{ color: textMuted }}>Cargando estaciones...</div>
  }

  return (
    <div className="pb-6" style={{ background: bg, minHeight: '100%' }}>
      <div className="px-5 pt-2 pb-3">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold" style={{ color: textPrimary }}>Estaciones participantes</h2>
          <button onClick={pedirUbicacion} className="flex items-center gap-1 text-xs font-medium" style={{ color: GREEN }}>
            <LocateFixed size={14} /> Actualizar
          </button>
        </div>

        <div className="mb-3">
          <label className="text-xs mb-1 block" style={{ color: textMuted }}>Ver estaciones en:</label>
          <select value={ciudadVista} onChange={(e) => setCiudadVista(e.target.value)}
            className="w-full rounded-lg px-3 py-2.5 text-sm border focus:outline-none"
            style={{ borderColor: border, background: card, color: textPrimary }}>
            {CIUDADES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          {ciudadVista !== ciudadPerfil && (
            <button onClick={() => setCiudadVista(ciudadPerfil)} className="text-xs mt-1.5" style={{ color: GREEN }}>
              Volver a mi ciudad ({ciudadPerfil})
            </button>
          )}
        </div>

        <p className="text-xs mb-3" style={{ color: textMuted }}>
          {estado === 'ok' && 'Toca un marcador en el mapa para ver detalles'}
          {estado === 'buscando' && 'Buscando tu ubicacion...'}
          {estado === 'error' && 'No se pudo obtener tu ubicacion'}
          {estado === 'inicial' && 'Toca un marcador para ver la estacion'}
        </p>
      </div>

      {/* Mapa Leaflet */}
      <div ref={mapRef} style={{ height: 280, width: '100%', zIndex: 1 }} />

      <div className="px-5 pt-3">
        {estacionCercana && estado === 'ok' && (
          <div className="rounded-xl border p-3.5 mb-3 card-3d"
            style={{ borderColor: GREEN + '60', background: darkMode ? '#0D2818' : GREEN + '0D' }}>
            <div className="flex items-center gap-3 mb-3">
              <Navigation size={18} style={{ color: GREEN }} />
              <div>
                <p className="text-xs uppercase tracking-wide" style={{ color: '#4A9123' }}>Mas cercana</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium" style={{ color: textPrimary }}>{estacionCercana.nombre}</p>
                  {estacionCercana.descuento && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: GREEN, color: '#fff' }}>
                      L {estacionCercana.descuento} desc.
                    </span>
                  )}
                </div>
              </div>
            </div>
            <a href={urlWaze(estacionCercana.lat, estacionCercana.lng)} target="_blank" rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-white"
              style={{ background: '#33CCFF' }}>
              <Navigation size={15} /> Como llegar con Waze
            </a>
          </div>
        )}

        {seleccion && seleccion.id !== estacionCercana?.id && (
          <div className="rounded-xl border p-3.5 mb-3 card-3d" style={{ borderColor: border, background: card }}>
            <p className="text-sm font-semibold mb-1" style={{ color: textPrimary }}>{seleccion.nombre}</p>
            {seleccion.descuento && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full inline-block mb-2" style={{ background: GREEN, color: '#fff' }}>
                L {seleccion.descuento} desc.
              </span>
            )}
            <a href={urlWaze(seleccion.lat, seleccion.lng)} target="_blank" rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold text-white"
              style={{ background: '#33CCFF' }}>
              <Navigation size={13} /> Como llegar con Waze
            </a>
          </div>
        )}

        <div className="space-y-2">
          {estacionesBD.length === 0 && (
            <p className="text-sm" style={{ color: '#9AA5AE' }}>No hay estaciones en {ciudadVista}.</p>
          )}
          {estacionesOrdenadas.map((e) => {
            const esSeleccionada = seleccion?.id === e.id
            return (
              <div key={e.id}
                onClick={() => {
                  setSeleccion(e)
                  if (mapaInstancia.current) {
                    mapaInstancia.current.setView([e.lat, e.lng], 16)
                    marcadores.current.forEach((m) => {
                      if (m.getLatLng().lat === e.lat) m.openPopup()
                    })
                  }
                }}
                className="w-full text-left rounded-xl p-3.5 flex items-start gap-3 border transition-colors cursor-pointer card-3d"
                style={{ borderColor: esSeleccionada ? GREEN + '80' : border, background: esSeleccionada ? (darkMode ? '#0D2818' : GREEN + '0D') : card }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: esSeleccionada ? GREEN : NAVY, boxShadow: '0 2px 6px rgba(0,0,0,0.2)' }}>
                  <span className="text-white font-black text-xs">E</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium" style={{ color: textPrimary }}>{e.nombre}</p>
                    {e.descuento && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ml-2" style={{ background: GREEN, color: '#fff' }}>
                        L {e.descuento}
                      </span>
                    )}
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: textMuted }}>{e.direccion}</p>
                  <a href={urlWaze(e.lat, e.lng)} target="_blank" rel="noopener noreferrer"
                    onClick={(ev) => ev.stopPropagation()}
                    className="inline-flex items-center gap-1.5 mt-2 text-xs font-semibold"
                    style={{ color: '#1B9FD6' }}>
                    <Navigation size={12} /> Como llegar con Waze
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
    }
