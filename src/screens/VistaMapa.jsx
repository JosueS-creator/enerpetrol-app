import React, { useState, useEffect, useRef } from 'react'
import { Navigation, LocateFixed, Search, X, ChevronUp, ChevronDown } from 'lucide-react'
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
  const [busqueda, setBusqueda] = useState('')
  const [sheetExpandido, setSheetExpandido] = useState(false)
  const [mostrarCiudad, setMostrarCiudad] = useState(false)
  const mapRef = useRef(null)
  const mapaInstancia = useRef(null)
  const marcadores = useRef([])
  const marcadorUbicacion = useRef(null)
  const estacionesRef = useRef([])

  const bg = darkMode ? DARK_BG : '#F0F4F8'
  const card = darkMode ? DARK_CARD : CARD
  const border = darkMode ? DARK_BORDER : BORDER
  const textMuted = darkMode ? DARK_TEXT_MUTED : TEXT_MUTED
  const textPrimary = darkMode ? '#E6EDF3' : NAVY

  function crearIcono(L, seleccionada) {
    const fill = seleccionada ? GREEN : NAVY
    const stroke = seleccionada ? '#fff' : GREEN
    return L.divIcon({
      className: '',
      html: `<svg width="36" height="48" viewBox="0 0 36 48" xmlns="http://www.w3.org/2000/svg">
        <path d="M18 0 C8.059 0 0 8.059 0 18 C0 31.5 18 48 18 48 C18 48 36 31.5 36 18 C36 8.059 27.941 0 18 0Z" fill="${fill}" stroke="${stroke}" stroke-width="2.5"/>
        <circle cx="18" cy="18" r="10" fill="${stroke}" opacity="0.2"/>
        <circle cx="18" cy="18" r="6" fill="${stroke}"/>
        <text x="18" y="22" text-anchor="middle" font-family="Arial Black, sans-serif" font-weight="900" font-size="8" fill="${fill}">E</text>
      </svg>`,
      iconSize: [36, 48],
      iconAnchor: [18, 48],
      popupAnchor: [0, -48],
    })
  }

  function agregarMarcadoresAlMapa(mapa, L, estaciones) {
    marcadores.current.forEach((m) => mapa.removeLayer(m))
    marcadores.current = []
    if (!estaciones || estaciones.length === 0) return
    estaciones.forEach((e) => {
      const icono = crearIcono(L, false)
      const marcador = L.marker([e.lat, e.lng], { icon: icono })
        .addTo(mapa)
        .on('click', () => {
          setSeleccion(e)
          setSheetExpandido(true)
        })
      marcadores.current.push(marcador)
    })
    const bounds = L.latLngBounds(estaciones.map((e) => [e.lat, e.lng]))
    mapa.fitBounds(bounds, { padding: [60, 60] })
    mapa.invalidateSize()
  }

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
    mapaInstancia.current = mapa
    setTimeout(() => {
      mapa.invalidateSize()
      if (estacionesRef.current.length > 0) {
        agregarMarcadoresAlMapa(mapa, L, estacionesRef.current)
      }
    }, 300)
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
        .from('estaciones').select('*').eq('activa', true).eq('ciudad', ciudadVista)
      if (!error && data) {
        setEstacionesBD(data)
        estacionesRef.current = data
      }
      setCargandoEstaciones(false)
    }
    cargarEstaciones()
    setSeleccion(null)
  }, [ciudadVista])

  useEffect(() => {
    if (!mapaInstancia.current || !window.L || estacionesBD.length === 0) return
    agregarMarcadoresAlMapa(mapaInstancia.current, window.L, estacionesBD)
  }, [estacionesBD])

  useEffect(() => {
    if (!mapaInstancia.current || !window.L || !ubicacion) return
    const L = window.L
    const mapa = mapaInstancia.current
    if (marcadorUbicacion.current) mapa.removeLayer(marcadorUbicacion.current)
    const iconoUbicacion = L.divIcon({
      className: '',
      html: `<div style="width:16px;height:16px;background:#4285F4;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(66,133,244,0.5);"></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
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

  const estacionesFiltradas = busqueda
    ? estacionesOrdenadas.filter((e) => e.nombre.toLowerCase().includes(busqueda.toLowerCase()))
    : estacionesOrdenadas

  const sheetHeight = sheetExpandido ? '70vh' : '220px'

  return (
    <div style={{ position: 'relative', height: 'calc(100vh - 130px)', overflow: 'hidden', background: bg }}>

      {/* MAPA */}
      <div ref={mapRef} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1 }} />

      {/* BARRA SUPERIOR */}
      <div style={{ position: 'absolute', top: 12, left: 12, right: 12, zIndex: 10 }}>
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 rounded-2xl px-4 py-3 shadow-lg"
            style={{ background: card, boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
            <Search size={16} style={{ color: textMuted, flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Buscar gasolinera..."
              value={busqueda}
              onChange={(e) => { setBusqueda(e.target.value); setSheetExpandido(true) }}
              className="flex-1 text-sm bg-transparent focus:outline-none"
              style={{ color: textPrimary }}
            />
            {busqueda && (
              <button onClick={() => setBusqueda('')}>
                <X size={14} style={{ color: textMuted }} />
              </button>
            )}
          </div>
          <button
            onClick={() => setMostrarCiudad(!mostrarCiudad)}
            className="rounded-2xl px-3 py-3 shadow-lg text-xs font-bold"
            style={{ background: NAVY, color: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', whiteSpace: 'nowrap' }}>
            {ciudadVista.split(' ')[0]}
          </button>
        </div>

        {mostrarCiudad && (
          <div className="mt-2 rounded-2xl overflow-hidden shadow-xl" style={{ background: card }}>
            {CIUDADES.map((c) => (
              <button key={c} onClick={() => { setCiudadVista(c); setMostrarCiudad(false) }}
                className="w-full text-left px-4 py-3 text-sm border-b"
                style={{ borderColor: border, color: c === ciudadVista ? GREEN : textPrimary, fontWeight: c === ciudadVista ? '700' : '400', background: c === ciudadVista ? GREEN + '10' : card }}>
                {c}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* BOTÓN MI UBICACIÓN */}
      <button
        onClick={pedirUbicacion}
        className="rounded-full shadow-lg flex items-center justify-center"
        style={{ position: 'absolute', right: 12, bottom: parseInt(sheetHeight) + 20, zIndex: 10, width: 44, height: 44, background: card, boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
        <LocateFixed size={20} style={{ color: estado === 'ok' ? '#4285F4' : textMuted }} />
      </button>

      {/* BOTTOM SHEET */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: sheetHeight,
        zIndex: 20,
        background: card,
        borderRadius: '24px 24px 0 0',
        boxShadow: '0 -8px 32px rgba(0,0,0,0.15)',
        transition: 'height 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Handle */}
        <div className="flex flex-col items-center pt-3 pb-2 flex-shrink-0" onClick={() => setSheetExpandido(!sheetExpandido)} style={{ cursor: 'pointer' }}>
          <div className="w-10 h-1 rounded-full mb-2" style={{ background: border }} />
          <div className="flex items-center justify-between w-full px-5">
            <div>
              <p className="text-sm font-bold" style={{ color: textPrimary }}>
                {estacionesFiltradas.length} estacion{estacionesFiltradas.length !== 1 ? 'es' : ''}
                {busqueda ? ' encontradas' : ' cerca de ti'}
              </p>
              {estado === 'ok' && !sheetExpandido && estacionesOrdenadas[0] && (
                <p className="text-xs" style={{ color: textMuted }}>
                  Mas cercana: {estacionesOrdenadas[0].nombre}
                </p>
              )}
            </div>
            <button style={{ color: textMuted }}>
              {sheetExpandido ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
            </button>
          </div>
        </div>

        {/* Estacion seleccionada */}
        {seleccion && (
          <div className="mx-4 mb-3 rounded-2xl p-4 flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, ' + NAVY + ' 0%, #1A3D6B 100%)', boxShadow: '0 4px 16px rgba(15,42,74,0.3)' }}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-bold text-white">{seleccion.nombre}</p>
                  {seleccion.descuento && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ background: GREEN, color: '#fff' }}>
                      L {seleccion.descuento} desc
                    </span>
                  )}
                </div>
                {seleccion.direccion && (
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>{seleccion.direccion}</p>
                )}
                {ubicacion && (
                  <p className="text-xs font-semibold mt-1" style={{ color: '#8FCB4D' }}>
                    {distanciaKm(ubicacion.lat, ubicacion.lng, seleccion.lat, seleccion.lng).toFixed(1)} km de distancia
                  </p>
                )}
              </div>
              <button onClick={() => setSeleccion(null)} style={{ color: 'rgba(255,255,255,0.5)', flexShrink: 0 }}>
                <X size={16} />
              </button>
            </div>
            <div className="flex gap-2">
              <a href={urlWaze(seleccion.lat, seleccion.lng)} target="_blank" rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-white"
                style={{ background: '#33CCFF' }}>
                <Navigation size={15} /> Iniciar ruta
              </a>
              <button
                onClick={() => {
                  if (mapaInstancia.current) {
                    mapaInstancia.current.setView([seleccion.lat, seleccion.lng], 17)
                    mapaInstancia.current.invalidateSize()
                  }
                }}
                className="rounded-xl px-4 py-2.5 text-sm font-bold"
                style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}>
                Ver en mapa
              </button>
            </div>
          </div>
        )}

        {/* Lista de estaciones */}
        <div style={{ overflowY: 'auto', flex: 1, paddingBottom: 8 }}>
          {cargandoEstaciones && (
            <p className="text-sm text-center py-4" style={{ color: textMuted }}>Cargando estaciones...</p>
          )}
          {!cargandoEstaciones && estacionesFiltradas.length === 0 && (
            <p className="text-sm text-center py-4" style={{ color: textMuted }}>No se encontraron estaciones.</p>
          )}
          {estacionesFiltradas.map((e, idx) => {
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
                className="mx-4 mb-2 rounded-2xl p-3.5 flex items-center gap-3 cursor-pointer"
                style={{
                  background: esSeleccionada ? GREEN + '12' : darkMode ? '#1E2A35' : '#F8FAFC',
                  border: '1px solid ' + (esSeleccionada ? GREEN + '50' : border),
                  boxShadow: esSeleccionada ? '0 2px 12px rgba(91,174,47,0.15)' : 'none',
                }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: esSeleccionada ? GREEN : NAVY }}>
                  <span className="text-white font-black text-xs">E</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-semibold truncate" style={{ color: textPrimary }}>{e.nombre}</p>
                    {idx === 0 && estado === 'ok' && (
                      <span className="text-xs font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                        style={{ background: GREEN + '20', color: GREEN, fontSize: '9px' }}>MAS CERCANA</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {dist !== null && (
                      <p className="text-xs font-semibold" style={{ color: GREEN }}>{dist.toFixed(1)} km</p>
                    )}
                    {e.descuento && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{ background: GREEN, color: '#fff' }}>
                        L {e.descuento} ahorro/gal
                      </span>
                    )}
                  </div>
                </div>
                <a href={urlWaze(e.lat, e.lng)} target="_blank" rel="noopener noreferrer"
                  onClick={(ev) => ev.stopPropagation()}
                  className="rounded-xl px-3 py-2 text-xs font-bold flex-shrink-0 flex items-center gap-1"
                  style={{ background: '#33CCFF', color: '#fff' }}>
                  <Navigation size={12} />
                </a>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
