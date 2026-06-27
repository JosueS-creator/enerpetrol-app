import React, { useState, useEffect } from 'react'
import { CheckCircle2, Clock, XCircle, Camera, PartyPopper, Download, FileSpreadsheet } from 'lucide-react'
import * as XLSX from 'xlsx'
import { supabase } from '../supabaseClient'
import { NAVY, GREEN, GREEN_LIGHT, BORDER, CARD, TEXT_MUTED, META_GALONES_MENSUAL, GANANCIA_POR_GALON, UMBRAL_PUNTOS_CANJE, VALOR_POR_PUNTO, CIUDADES } from '../theme'

const ESTADO_STYLES = {
  aprobada: { bg: 'bg-[#5BAE2F]/10', text: 'text-[#4A9123]', icon: CheckCircle2, label: 'Aprobada' },
  pendiente: { bg: 'bg-[#0F2A4A]/8', text: 'text-[#274463]', icon: Clock, label: 'Pendiente' },
  rechazada: { bg: 'bg-red-500/10', text: 'text-red-600', icon: XCircle, label: 'Rechazada' },
}

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

export default function VistaAdmin() {
  const [ciudadSeleccionada, setCiudadSeleccionada] = useState('Tegucigalpa')
  const [facturas, setFacturas] = useState([])
  const [clientesParaCanje, setClientesParaCanje] = useState([])
  const [cargando, setCargando] = useState(true)
  const [generandoReporte, setGenerandoReporte] = useState(false)

  const ahora = new Date()
  const [mesReporte, setMesReporte] = useState(ahora.getMonth()) // 0-indexado
  const [anioReporte, setAnioReporte] = useState(ahora.getFullYear())

  async function cargarFacturas() {
    // Filtramos por la ciudad del cliente que subió la factura (via join con perfiles)
    const { data, error } = await supabase
      .from('facturas')
      .select('*, perfiles!inner(nombre, numero_tarjeta, ciudad)')
      .eq('perfiles.ciudad', ciudadSeleccionada)
      .order('creado_en', { ascending: false })
    if (!error) setFacturas(data || [])

    // Clientes de esta ciudad que ya cruzaron el umbral de puntos para canje
    const { data: listosCanje } = await supabase
      .from('perfiles')
      .select('nombre, numero_tarjeta, galones_acumulados')
      .eq('ciudad', ciudadSeleccionada)
      .gte('galones_acumulados', UMBRAL_PUNTOS_CANJE)
      .order('galones_acumulados', { ascending: false })
    setClientesParaCanje(listosCanje || [])

    setCargando(false)
  }

  useEffect(() => {
    setCargando(true)
    cargarFacturas()
  }, [ciudadSeleccionada])

  async function resolver(facturaId, clienteId, galones, nuevoEstado) {
    const { error } = await supabase
      .from('facturas')
      .update({ estado: nuevoEstado, resuelto_en: new Date().toISOString() })
      .eq('id', facturaId)

    if (!error && nuevoEstado === 'aprobada') {
      // Sumar los galones aprobados al acumulado del cliente
      const { data: perfilActual } = await supabase.from('perfiles').select('galones_acumulados').eq('id', clienteId).single()
      const nuevoAcumulado = (perfilActual?.galones_acumulados || 0) + galones
      await supabase.from('perfiles').update({ galones_acumulados: nuevoAcumulado }).eq('id', clienteId)
    }

    cargarFacturas()
  }

  async function descargarReporteMensual() {
    setGenerandoReporte(true)

    const inicioMes = new Date(anioReporte, mesReporte, 1).toISOString()
    const finMes = new Date(anioReporte, mesReporte + 1, 1).toISOString()

    const { data: facturasMes, error } = await supabase
      .from('facturas')
      .select('*, perfiles!inner(nombre, numero_tarjeta, ciudad)')
      .eq('perfiles.ciudad', ciudadSeleccionada)
      .gte('creado_en', inicioMes)
      .lt('creado_en', finMes)
      .order('creado_en', { ascending: true })

    setGenerandoReporte(false)
    if (error) {
      alert('No se pudo generar el reporte: ' + error.message)
      return
    }

    const lista = facturasMes || []
    const aprobadas = lista.filter((f) => f.estado === 'aprobada')
    const totalGalones = aprobadas.reduce((acc, f) => acc + Number(f.galones), 0)
    const ganancia = totalGalones * GANANCIA_POR_GALON
    const costoPuntos = totalGalones * VALOR_POR_PUNTO
    const gananciaNeta = ganancia - costoPuntos
    const clientesUnicos = new Set(lista.map((f) => f.perfiles?.numero_tarjeta)).size

    // Hoja 1: resumen
    const resumen = [
      ['Reporte mensual Enerpetrol'],
      ['Ciudad', ciudadSeleccionada],
      ['Mes', `${MESES[mesReporte]} ${anioReporte}`],
      [],
      ['Total facturas recibidas', lista.length],
      ['Facturas aprobadas', aprobadas.length],
      ['Facturas pendientes', lista.filter((f) => f.estado === 'pendiente').length],
      ['Facturas rechazadas', lista.filter((f) => f.estado === 'rechazada').length],
      ['Clientes que reportaron consumo', clientesUnicos],
      ['Total galones aprobados', totalGalones],
      [],
      ['Ganancia bruta (L 1.00 por galon)', ganancia],
      [`Costo programa de puntos (L ${VALOR_POR_PUNTO.toFixed(2)} por punto)`, costoPuntos],
      ['Ganancia neta despues de puntos', gananciaNeta],
    ]

    // Hoja 2: detalle de cada factura
    const detalle = [
      ['Fecha', 'Cliente', 'Numero de tarjeta', 'Galones', 'Estado', 'Puntos otorgados', 'Costo en puntos (L)'],
      ...lista.map((f) => [
        new Date(f.creado_en).toLocaleDateString('es-HN'),
        f.perfiles?.nombre || '',
        f.perfiles?.numero_tarjeta || '',
        Number(f.galones),
        f.estado,
        f.estado === 'aprobada' ? Number(f.galones) : 0,
        f.estado === 'aprobada' ? Number(f.galones) * VALOR_POR_PUNTO : 0,
      ]),
    ]

    const wb = XLSX.utils.book_new()
    const hojaResumen = XLSX.utils.aoa_to_sheet(resumen)
    const hojaDetalle = XLSX.utils.aoa_to_sheet(detalle)
    hojaResumen['!cols'] = [{ wch: 34 }, { wch: 20 }]
    hojaDetalle['!cols'] = [{ wch: 14 }, { wch: 24 }, { wch: 18 }, { wch: 10 }, { wch: 12 }, { wch: 16 }, { wch: 18 }]
    XLSX.utils.book_append_sheet(wb, hojaResumen, 'Resumen')
    XLSX.utils.book_append_sheet(wb, hojaDetalle, 'Detalle de facturas')

    const nombreArchivo = `Enerpetrol_${ciudadSeleccionada.replace(/\s+/g, '_')}_${MESES[mesReporte]}_${anioReporte}.xlsx`
    XLSX.writeFile(wb, nombreArchivo)
  }

  const pendientes = facturas.filter((f) => f.estado === 'pendiente')
  const resueltas = facturas.filter((f) => f.estado !== 'pendiente')
  const totalGalonesMes = facturas.reduce((acc, f) => (f.estado === 'aprobada' ? acc + Number(f.galones) : acc), 0)
  const gananciaMes = totalGalonesMes * GANANCIA_POR_GALON
  const pctMeta = Math.min(totalGalonesMes / META_GALONES_MENSUAL, 1)

  return (
    <div className="px-5 pt-2 pb-6">
      <h2 className="text-lg font-semibold mb-1" style={{ color: NAVY }}>Panel de administrador</h2>
      <p className="text-sm mb-3" style={{ color: TEXT_MUTED }}>Revisa y aprueba las facturas subidas por los clientes</p>

      <select
        value={ciudadSeleccionada}
        onChange={(e) => setCiudadSeleccionada(e.target.value)}
        className="w-full rounded-lg px-3 py-2.5 text-sm font-semibold mb-3 border focus:outline-none"
        style={{ borderColor: BORDER, background: CARD, color: NAVY }}
      >
        {CIUDADES.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>

      <div className="rounded-xl border p-4 mb-5" style={{ borderColor: BORDER, background: CARD }}>
        <div className="flex items-center gap-2 mb-3">
          <FileSpreadsheet size={16} style={{ color: GREEN }} />
          <p className="text-sm font-semibold" style={{ color: NAVY }}>Reporte mensual descargable</p>
        </div>
        <div className="flex gap-2 mb-3">
          <select
            value={mesReporte}
            onChange={(e) => setMesReporte(Number(e.target.value))}
            className="flex-1 rounded-lg px-2 py-2 text-sm border focus:outline-none"
            style={{ borderColor: BORDER, color: NAVY }}
          >
            {MESES.map((m, i) => (
              <option key={m} value={i}>{m}</option>
            ))}
          </select>
          <select
            value={anioReporte}
            onChange={(e) => setAnioReporte(Number(e.target.value))}
            className="rounded-lg px-2 py-2 text-sm border focus:outline-none"
            style={{ borderColor: BORDER, color: NAVY }}
          >
            {[ahora.getFullYear(), ahora.getFullYear() - 1].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <button
          onClick={descargarReporteMensual}
          disabled={generandoReporte}
          className="w-full rounded-lg py-2.5 text-sm font-semibold flex items-center justify-center gap-1.5 text-white disabled:opacity-50"
          style={{ background: GREEN }}
        >
          <Download size={15} /> {generandoReporte ? 'Generando...' : 'Descargar reporte en Excel'}
        </button>
      </div>

      {cargando ? (
        <p className="text-sm" style={{ color: TEXT_MUTED }}>Cargando datos de {ciudadSeleccionada}...</p>
      ) : (
        <>
      <div className="rounded-xl border p-4 mb-5" style={{ borderColor: BORDER, background: CARD }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs uppercase tracking-wide" style={{ color: TEXT_MUTED }}>Meta mensual de la red</span>
          <span className="text-xs font-semibold" style={{ color: GREEN }}>{(pctMeta * 100).toFixed(0)}%</span>
        </div>
        <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ background: '#EDF0F3' }}>
          <div className="h-full rounded-full" style={{ width: `${pctMeta * 100}%`, background: `linear-gradient(90deg, ${GREEN_LIGHT}, ${GREEN})` }} />
        </div>
        <div className="flex items-center justify-between mt-2.5">
          <p className="text-sm" style={{ color: NAVY }}>
            <span className="font-bold tabular-nums">{totalGalonesMes.toLocaleString('es-HN', { maximumFractionDigits: 0 })}</span>
            <span style={{ color: TEXT_MUTED }}> / {META_GALONES_MENSUAL.toLocaleString('es-HN')} gal</span>
          </p>
          <p className="text-sm font-semibold" style={{ color: GREEN }}>
            L {gananciaMes.toLocaleString('es-HN', { maximumFractionDigits: 0 })}
          </p>
        </div>
        <p className="text-[11px] mt-1" style={{ color: '#9AA5AE' }}>Ganancia estimada a L {GANANCIA_POR_GALON} por galón consumido</p>
      </div>

      {clientesParaCanje.length > 0 && (
        <div className="rounded-xl p-4 mb-5" style={{ background: 'linear-gradient(135deg, #5BAE2F 0%, #3D7A1F 100%)', boxShadow: '0 4px 14px rgba(91,174,47,0.3)' }}>
          <div className="flex items-center gap-2 mb-3">
            <PartyPopper size={18} className="text-white" />
            <p className="text-sm font-bold text-white">
              {clientesParaCanje.length} cliente{clientesParaCanje.length > 1 ? 's' : ''} listo{clientesParaCanje.length > 1 ? 's' : ''} para canje
            </p>
          </div>
          <div className="space-y-1.5">
            {clientesParaCanje.map((c) => (
              <div key={c.numero_tarjeta} className="flex items-center justify-between rounded-lg px-3 py-2" style={{ background: 'rgba(255,255,255,0.15)' }}>
                <div>
                  <p className="text-sm font-medium text-white">{c.nombre}</p>
                  <p className="text-[11px] text-white/75 font-mono">{c.numero_tarjeta}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-white">{Math.floor(c.galones_acumulados)} pts</p>
                  <p className="text-[11px] text-white/75">L {(Math.floor(c.galones_acumulados) * VALOR_POR_PUNTO).toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 mb-6">
        <div className="rounded-lg border p-3 text-center" style={{ borderColor: BORDER, background: CARD }}>
          <p className="font-mono text-xl" style={{ color: NAVY }}>{pendientes.length}</p>
          <p className="text-[10px] uppercase tracking-wide mt-1" style={{ color: TEXT_MUTED }}>Pendientes</p>
        </div>
        <div className="rounded-lg border p-3 text-center" style={{ borderColor: BORDER, background: CARD }}>
          <p className="font-mono text-xl" style={{ color: GREEN }}>{facturas.filter((f) => f.estado === 'aprobada').length}</p>
          <p className="text-[10px] uppercase tracking-wide mt-1" style={{ color: TEXT_MUTED }}>Aprobadas</p>
        </div>
        <div className="rounded-lg border p-3 text-center" style={{ borderColor: BORDER, background: CARD }}>
          <p className="font-mono text-xl" style={{ color: NAVY }}>{totalGalonesMes.toFixed(1)}</p>
          <p className="text-[10px] uppercase tracking-wide mt-1" style={{ color: TEXT_MUTED }}>Gal. validados</p>
        </div>
      </div>

      <h3 className="text-sm font-semibold mb-3" style={{ color: NAVY }}>Pendientes de revisión</h3>
      <div className="space-y-2.5 mb-6">
        {pendientes.length === 0 && <p className="text-sm" style={{ color: '#9AA5AE' }}>No hay facturas pendientes.</p>}
        {pendientes.map((f) => (
          <div key={f.id} className="rounded-xl border p-4" style={{ borderColor: BORDER, background: CARD }}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-medium" style={{ color: NAVY }}>{f.perfiles?.nombre || 'Cliente'}</p>
                <p className="text-xs" style={{ color: TEXT_MUTED }}>
                  {new Date(f.creado_en).toLocaleDateString('es-HN')} · {f.galones} galones
                </p>
              </div>
              {f.imagen_url ? (
                <a href={f.imagen_url} target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-lg border overflow-hidden flex-shrink-0" style={{ borderColor: BORDER }}>
                  <img src={f.imagen_url} alt="Factura" className="w-full h-full object-cover" />
                </a>
              ) : (
                <div className="w-12 h-12 rounded-lg border flex items-center justify-center" style={{ background: '#F7F8FA', borderColor: BORDER }}>
                  <Camera size={16} style={{ color: '#9AA5AE' }} />
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => resolver(f.id, f.cliente_id, Number(f.galones), 'aprobada')}
                className="flex-1 rounded-lg py-2 text-xs font-semibold flex items-center justify-center gap-1 text-white"
                style={{ background: GREEN }}
              >
                <CheckCircle2 size={13} /> Aprobar
              </button>
              <button
                onClick={() => resolver(f.id, f.cliente_id, Number(f.galones), 'rechazada')}
                className="flex-1 rounded-lg py-2 text-xs font-semibold flex items-center justify-center gap-1 border"
                style={{ borderColor: '#C7CFD6', color: '#274463' }}
              >
                <XCircle size={13} /> Rechazar
              </button>
            </div>
          </div>
        ))}
      </div>

      <h3 className="text-sm font-semibold mb-3" style={{ color: NAVY }}>Historial</h3>
      <div className="space-y-2">
        {resueltas.map((f) => {
          const s = ESTADO_STYLES[f.estado]
          const Icon = s.icon
          return (
            <div key={f.id} className="rounded-lg border p-3 flex items-center justify-between" style={{ borderColor: BORDER, background: CARD }}>
              <div>
                <p className="text-sm" style={{ color: NAVY }}>{f.perfiles?.nombre || 'Cliente'}</p>
                <p className="text-xs" style={{ color: '#9AA5AE' }}>{new Date(f.creado_en).toLocaleDateString('es-HN')} · {f.galones} gal</p>
              </div>
              <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${s.bg} ${s.text}`}>
                <Icon size={12} /> {s.label}
              </span>
            </div>
          )
        })}
      </div>
      </>
      )}
    </div>
  )
}
