import React, { useState, useEffect } from 'react'
import { MapPin, Navigation, LocateFixed } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { NAVY, NAVY_SOFT, GREEN, BORDER, CARD, TEXT_MUTED } from '../theme'

function distanciaKm(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function urlWaze(lat, lng) {
  return `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`
}

export default function VistaMapa({ ciudad }) {
  const [estacionesBD, setEstacionesBD] = useState([])
  const [cargandoEstaciones, setCargandoEstaciones] = useState(true)
  const [ubicacion, setUbicacion] = useState(null)
  const [estado, setEstado] = useState('inicial')
  const [seleccion, setSeleccion] = useState(null)

  useEffect(() => {
    async function cargarEstaciones() {
      const resultado = await supabase
        .from('estaciones')
        .select('*')
        .eq('activa', true)
        .eq('ciudad', ciudad)
      const data = resultado.data
      const error = resultado.error
      if (!error && data) {
        setEstacionesBD(data)
      }
      setCargandoEstaciones(false)
    }
    cargarEstaciones()
  }, [ciudad])

  function pedirUbicacion() {
    if (!navigator.geolocation) {
      setEstado('error')
      return
    }
    setEstado('buscando')
    navigator.geolocation.getCurrentPosition(
      function (pos) {
        setUbicacion({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setEstado('ok')
      },
      function () {
        setEstado('error')
      },
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }

  useEffect(() => {
    pedirUbicacion()
  }, [])

  let estaciones
  if (ubicacion) {
    estaciones = estacionesBD
      .map(function (e) {
        const dist = distanciaKm(ubicacion.lat, ubicacion.lng, e.lat, e.lng)
        return Object.assign({}, e, { distancia: dist })
      })
      .sort(function (a, b) {
        return a.distancia - b.distancia
      })
  } else {
    estaciones = estacionesBD.map(function (e) {
      return Object.assign({}, e, { distancia: null })
    })
  }

  const activa = seleccion || estaciones[0]

  function proyectar(e) {
    const puntos = ubicacion ? estacionesBD.concat([ubicacion]) : estacionesBD
    if (puntos.length === 0) {
      return { x: 160, y: 110 }
    }
    const lats = puntos.map(function (s) { return s.lat })
    const lngs = puntos.map(function (s) { return s.lng })
    const minLat = Math.min.apply(null, lats)
    const maxLat = Math.max.apply(null, lats)
    const minLng = Math.min.apply(null, lngs)
    const maxLng = Math.max.apply(null, lngs)
    const x = 50 + ((e.lng - minLng) / (maxLng - minLng || 1)) * 220
    const y = 60 + (1 - (e.lat - minLat) / (maxLat - minLat || 1)) * 130
    return { x: x, y: y }
  }

  if (cargandoEstaciones) {
    return (
      <div className="px-5 pt-6 text-sm" style={{ color: TEXT_MUTED }}>
        Cargando estaciones
      </div>
    )
  }

  return (
    <div className="px-5 pt-2 pb-6">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-lg font-semibold" style={{ color: NAVY }}>
          Estaciones participantes
        </h2>
        <button
          onClick={pedirUbicacion}
          className="flex items-center gap-1 text-xs font-medium"
          style={{ color: GREEN }}
        >
          <LocateFixed size={14} /> Actualizar
        </button>
      </div>

      <p className="text-sm mb-4" style={{ color: TEXT_MUTED }}>
        {estado === 'ok' && 'Ordenadas de la mas cercana a la mas lejana'}
        {estado === 'buscando' && 'Buscando tu ubicacion'}
        {estado === 'error' && 'No se pudo obtener tu ubicacion, mostrando todas las estaciones'}
        {estado === 'inicial' && 'Toca una estacion para ver su direccion'}
      </p>

      <div
        className="rounded-xl overflow-hidden border mb-4 relative"
        style={{ height: 240, background: '#E9EEEA', borderColor: BORDER }}
      >
        <svg viewBox="0 0 320 240" className="w-full h-full">
          <rect width="320" height="240" fill="#E9EEEA" />
          {[0, 60, 120, 180, 240].map(function (y) {
            return (
              <rect key={'h' + y} x="0" y={y} width="320" height="7" fill="#D7DED9" />
            )
          })}
          {[0, 70, 150, 230, 300].map(function (x) {
            return (
              <rect key={'v' + x} x={x} y="0" width="6" height="240" fill="#D7DED9" />
            )
          })}
          {[
            [10, 10, 50, 42],
            [80, 10, 60, 42],
            [160, 10, 60, 42],
            [240, 10, 60, 42],
            [10, 70, 50, 70],
            [240, 70, 60, 70],
            [10, 156, 50, 64],
            [80, 70, 60, 156],
            [160, 70, 60, 156],
            [240, 156, 60, 64]
          ].map(function (bloque, i) {
            const bx = bloque[0]
            const by = bloque[1]
            const bw = bloque[2]
            const bh = bloque[3]
            return (
              <rect key={i} x={bx} y={by} width={bw} height={bh} fill="#DDE6E0" rx="3" />
            )
          })}

          {ubicacion ? (function () {
            const punto = proyectar(ubicacion)
            return (
              <g>
                <circle cx={punto.x} cy={punto.y} r="14" fill={NAVY} opacity="0.15" />
                <circle cx={punto.x} cy={punto.y} r="7" fill={NAVY} stroke="#FFFFFF" strokeWidth="2" />
                <text x={punto.x} y={punto.y + 24} textAnchor="middle" fontSize="9.5" fontWeight="600" fill={NAVY}>
                  Tu
                </text>
              </g>
            )
          })() : null}

          {estaciones.map(function (e) {
            const punto = proyectar(e)
            const px = punto.x
            const py = punto.y
            const esActiva = activa && activa.id === e.id
            const radioGrande = esActiva ? 22 : 17
            const radioChico = esActiva ? 7 : 5.5
            const radioMedio = esActiva ? 15 : 11.5
            const colorPin = esActiva ? GREEN : NAVY_SOFT
            const puntoRadio = esActiva ? 3 : 2.3

            const pathD =
              'M ' + px + ' ' + (py - radioGrande) +
              ' c ' + radioChico + ' 0 ' + radioChico + ' ' + radioChico + ' ' + radioChico + ' ' + radioChico +
              ' c 0 ' + (esActiva ? 8 : 6) + ' -' + radioChico + ' ' + radioMedio + ' -' + radioChico + ' ' + radioMedio +
              ' c 0 0 -' + radioChico + ' -' + radioChico + ' -' + radioChico + ' -' + radioMedio +
              ' c 0 -' + radioChico + ' ' + radioChico + ' -' + radioChico + ' ' + radioChico + ' -' + radioChico +
              ' z'

            return (
              <g key={e.id} onClick={function () { setSeleccion(e) }} className="cursor-pointer">
                <path d={pathD} fill={colorPin} stroke="#FFFFFF" strokeWidth="1.5" />
                <circle cx={px} cy={py - radioGrande} r={puntoRadio} fill="#FFFFFF" />
              </g>
            )
          })}
        </svg>

        {activa ? (
          <div
            className="absolute top-2 left-2 right-2 rounded-lg px-3 py-2 flex items-center gap-2"
            style={{ background: 'rgba(255,255,255,0.92)', border: '1px solid ' + BORDER }}
          >
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: GREEN }} />
            <p className="text-xs font-medium truncate" style={{ color: NAVY }}>
              {activa.nombre}
            </p>
          </div>
        ) : null}
      </div>

      {estaciones[0] && estado === 'ok' ? (
        <div
          className="rounded-xl border p-3.5 mb-3"
          style={{ borderColor: GREEN + '60', background: GREEN + '0D' }}
        >
          <div className="flex items-center gap-3 mb-3">
            <Navigation size={18} style={{ color: GREEN }} />
            <div>
              <p className="text-xs uppercase tracking-wide" style={{ color: '#4A9123' }}>
                Mas cercana
              </p>
              <p className="text-sm font-medium" style={{ color: NAVY }}>
                {estaciones[0].nombre} - {estaciones[0].distancia.toFixed(1)} km
              </p>
            </div>
          </div>
          <a
            href={urlWaze(estaciones[0].lat, estaciones[0].lng)}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-white"
            style={{ background: '#33CCFF' }}
          >
            <Navigation size={15} /> Como llegar con Waze
          </a>
        </div>
      ) : null}

      <div className="space-y-2">
        {estaciones.map(function (e) {
          const esActiva = activa && activa.id === e.id
          return (
            <div
              key={e.id}
              onClick={function () { setSeleccion(e) }}
              className="w-full text-left rounded-xl p-3.5 flex items-start gap-3 border transition-colors cursor-pointer"
              style={{
                borderColor: esActiva ? GREEN + '80' : BORDER,
                background: esActiva ? GREEN + '0D' : CARD
              }}
            >
              <MapPin size={18} style={{ color: esActiva ? GREEN : '#9AA5AE', marginTop: 2 }} />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium" style={{ color: NAVY }}>
                    {e.nombre}
                  </p>
                  {e.distancia !== null ? (
                    <span className="text-xs font-semibold" style={{ color: GREEN }}>
                      {e.distancia.toFixed(1)} km
                    </span>
                  ) : null}
                </div>
                <p className="text-xs mt-0.5" style={{ color: TEXT_MUTED }}>
                  {e.direccion}
                </p>
                <a
                  href={urlWaze(e.lat, e.lng)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={function (ev) { ev.stopPropagation() }}
                  className="inline-flex items-center gap-1.5 mt-2 text-xs font-semibold"
                  style={{ color: '#1B9FD6' }}
                >
                  <Navigation size={12} /> Como llegar con Waze
                </a>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

