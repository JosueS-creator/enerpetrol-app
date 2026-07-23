import React, { useState, useEffect, useRef } from 'react'
import { Navigation, LocateFixed } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { NAVY, GREEN, BORDER, CARD, TEXT_MUTED, CIUDADES, DARK_BG, DARK_CARD, DARK_BORDER, DARK_TEXT_MUTED } from '../theme'

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
  const marcadorUbicacion = useRef(null)

  const bg = darkMode ? DARK_BG : '#F7F8FA'
  const card = darkMode ? DARK_CARD : CARD
  const border = darkMode ? DARK_BORDER : BORDER
  const textMuted = darkMode ? DARK_TEXT_MUTED : TEXT_MUTED
  const textPrimary = darkMode ? '#E6EDF3' : NAVY

  function inicializarMapa() {
    if (!mapRef.current || mapaInstancia.current) return
    if (mapRef.current.offsetHeight === 0) {
      setTimeout(() => inicializarMapa(), 200)
      return
    }
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
    setTimeout(() => mapa.invalidateSize(), 300)
  }

  useEffect(() => {
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link')
      link.id = 'leaflet-css'
      link.rel = 'stylesheet'
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css'
      document.head.appendChild(link)
    }

    function cargarLeaflet() {
      if (!window.L) {
        const script = document.createElement('script')
        script.id = 'leaflet-js'
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js'
        script.onload = () => setTimeout(() => inicializarMapa(), 100)
        document.head.appendChild(script)
      } else {
        setTimeout(() => inicializarMapa(), 100)
      }
    }

    setTimeout(() => cargarLeaflet(), 200)

    return () => {
      if (mapaInstancia.current) {
        mapaInstancia.current.remove()
        mapaInstancia.current = null
      }
    }
  }, [])

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

    marcadores.current.forEach((m) => mapa.removeLayer(m))
    marcadores.current = []

    const iconoEnerpetrol = L.divIcon({
  className: '',
  html: `<svg width="32" height="42" viewBox="0 0 32 42" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 0 C7.163 0 0 7.163 0 16 C0 28 16 42 16 42 C16 42 32 28 32 16 C32 7.163 24.837 0 16 0Z" fill="#0F2A4A" stroke="#5BAE2F" stroke-width="2.5"/>
    <circle cx="16" cy="16" r="9" fill="#5BAE2F"/>
    <text x="16" y="21" text-anchor="middle" font-family="Arial Black, sans-serif" font-weight="900" font-size="11" fill="white">E</text>
  </svg>`,
  iconSize: [32, 42],
  iconAnchor: [16, 42],
  popupAnchor: [0, -42],
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

    const bounds = L.latLngBounds(estacionesBD.map((e) => [e.lat, e.lng]))
    mapa.fitBounds(bounds, { padding: [40, 40] })
    mapa.invalidateSize()
  }, [estacionesBD])

  useEffect(() => {
    if (!mapaInstancia.current || !window.L || !ubicacion) return
    const L = window.L
    const mapa = mapaInstancia.current

    if (marcadorUbicacion.current) {
      mapa.removeLayer(marcadorUbicacion.current)
    }

    const iconoUbicacion = L.divIcon({
      className: '',
      html: `<div style="width:14px;height:14px;background:#0F2A4A;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.4);"></div>`,
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    })

    marcadorUbicacion.current = L.marker([ubicacion.lat, ubicacion.lng], { icon: iconoUbicacion }).addTo(mapa)
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
          mapaInstancia.current.invalidateSize()
        }
      },
      () => setEstado('error'),
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }

  useEffect(() => { pedirUbicacion() }, [])

  function distanciaKm(lat1, lng1, lat2, lng2) {
    const R = 6371
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLng = ((lng2 - lng1) * Math.PI) / 180
    const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  }

  const estacionesOrdenadas = ubicacion
    ? [...estacionesBD].sort((a, b) => distanciaKm(ubicacion.lat, ubicacion.lng, a.lat, a.lng) - distanciaKm(ubicacion.lat, ubicacion.lng, b.lat, b.lng))
    : estacionesBD

  const estacionCercana = estacionesOrdenadas[0]

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

      <div ref={mapRef} style={{ height: 280, width: '100%', zIndex: 1, background: '#e8e8e8' }} />

      <div className="px-5 pt-3">
        {cargandoEstaciones && (
          <p className="text-sm text-center py-3" style={{ color: textMuted }}>Cargando estaciones...</p>
        )}

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
          {!cargandoEstaciones && estacionesBD.length === 0 && (
            <p className="text-sm" style={{ color: '#9AA5AE' }}>No hay estaciones en {ciudadVista}.</p>
          )}
          {estacionesOrdenadas.map((e) => {
            const esSeleccionada = seleccion?.id === e.id
            const dist = ubicacion ? distanciaKm(ubicacion.lat, ubicacion.lng, e.lat, e.lng) : null
            return (
              <div key={e.id}
                onClick={() => {
                  setSeleccion(e)
                  if (mapaInstancia.current) {
                    mapaInstancia.current.setView([e.lat, e.lng], 16)
                    mapaInstancia.current.invalidateSize()
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
                  {e.direccion && <p className="text-xs mt-0.5" style={{ color: textMuted }}>{e.direccion}</p>}
                  {dist !== null && (
                    <p className="text-xs mt-0.5 font-semibold" style={{ color: GREEN }}>{dist.toFixed(1)} km</p>
                  )}
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
