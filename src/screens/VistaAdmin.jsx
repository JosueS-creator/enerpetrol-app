import React, { useState, useEffect } from 'react'
import { CheckCircle2, Clock, XCircle, Camera, PartyPopper, Download, FileSpreadsheet, Pencil, Save, X, Users } from 'lucide-react'
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
  const [galonesEditando, setGalonesEditando] = useState({})
  const [facturaEditando, setFacturaEditando] = useState(null)
  const [galonesEdicion, setGalonesEdicion] = useState('')
  const [seccion, setSeccion] = useState('facturas')
  const [clientes, setClientes] = useState([])
  const [busquedaCliente, setBusquedaCliente] = useState('')
  const [clienteEditando, setClienteEditando] = useState(null)
  const [nuevaCiudad, setNuevaCiudad] = useState('')
  const [guardandoCiudad, setGuardandoCiudad] = useState(false)

  const ahora = new Date()
  const [mesReporte, setMesReporte] = useState(ahora.getMonth())
  const [anioReporte, setAnioReporte] = useState(ahora.getFullYear())

  async function cargarFacturas() {
    const { data, error } = await supabase
      .from('facturas')
      .select('*, perfiles(nombre, numero_tarjeta, ciudad)')
      .order('creado_en', { ascending: false })
    if (!error) setFacturas(data || [])

    const { data: listosCanje } = await supabase
      .from('perfiles')
      .select('nombre, numero_tarjeta, galones_acumulados')
      .eq('ciudad', ciudadSeleccionada)
      .gte('galones_acumulados', UMBRAL_PUNTOS_CANJE)
      .order('galones_acumulados', { ascending: false })
    setClientesParaCanje(listosCanje || [])
    setCargando(false)
  }

  async function cargarClientes() {
    const { data } = await supabase
      .from('perfiles')
      .select('id, nombre, ciudad, numero_tarjeta, galones_acumulados, rol')
      .order('nombre')
    setClientes(data || [])
  }

  useEffect(() => {
    setCargando(true)
    cargarFacturas()
  }, [ciudadSeleccionada])

  useEffect(() => {
    if (seccion === 'clientes') cargarClientes()
  }, [seccion])

  async function resolver(facturaId, clienteId, galonesOriginales, nuevoEstado) {
    const galonesFinales = parseFloat(galonesEditando[facturaId] || galonesOriginales) || 0
    await supabase
      .from('facturas')
      .update({ estado: nuevoEstado, galones: galonesFinales, resuelto_en: new Date().toISOString() })
      .eq('id', facturaId)
    if (nuevoEstado === 'aprobada') {
      const { data: perfilActual } = await supabase.from('perfiles').select('galones_acumulados').eq('id', clienteId).single()
      const nuevoAcumulado = (perfilActual?.galones_acumulados || 0) + galonesFinales
      await supabase.from('perfiles').update({ galones_acumulados: nuevoAcumulado }).eq('id', clienteId)
    }
    const nuevosEditando = { ...galonesEditando }
    delete nuevosEditando[facturaId]
    setGalonesEditando(nuevosEditando)
    cargarFacturas()
  }

  async function cambiarEstado(factura, nuevoEstado) {
    const galonesFactura = Number(factura.galones) || 0
    await supabase.from('facturas').update({ estado: nuevoEstado, resuelto_en: new Date().toISOString() }).eq('id', factura.id)
    if (nuevoEstado === 'aprobada') {
      const { data: perfilActual } = await supabase.from('perfiles').select('galones_acumulados').eq('id', factura.cliente_id).single()
      const nuevoAcumulado = (perfilActual?.galones_acumulados || 0) + galonesFactura
      await supabase.from('perfiles').update({ galones_acumulados: nuevoAcumulado }).eq('id', factura.cliente_id)
    }
    if (factura.estado === 'aprobada' && nuevoEstado !== 'aprobada') {
      const { data: perfilActual } = await supabase.from('perfiles').select('galones_acumulados').eq('id', factura.cliente_id).single()
      const nuevoAcumulado = Math.max(0, (perfilActual?.galones_acumulados || 0) - galonesFactura)
      await supabase.from('perfiles').update({ galones_acumulados: nuevoAcumulado }).eq('id', factura.cliente_id)
    }
    cargarFacturas()
  }

  async function guardarEdicionGalones(factura) {
    const galonesNuevos = parseFloat(galonesEdicion)
    if (!galonesNuevos || galonesNuevos <= 0) return
    const galonesAnteriores = Number(factura.galones) || 0
    const diferencia = galonesNuevos - galonesAnteriores
    await supabase.from('facturas').update({ galones: galonesNuevos }).eq('id', factura.id)
    if (factura.estado === 'aprobada' && diferencia !== 0) {
      const { data: perfilActual } = await supabase.from('perfiles').select('galones_acumulados').eq('id', factura.cliente_id).single()
      const nuevoAcumulado = Math.max(0, (perfilActual?.galones_acumulados || 0) + diferencia)
      await supabase.from('perfiles').update({ galones_acumulados: nuevoAcumulado }).eq('id', factura.cliente_id)
    }
    setFacturaEditando(null)
    setGalonesEdicion('')
    cargarFacturas()
  }

  async function guardarCiudadCliente() {
    if (!nuevaCiudad || !clienteEditando) return
    setGuardandoCiudad(true)
    await supabase.from('perfiles').update({ ciudad: nuevaCiudad }).eq('id', clienteEditando.id)
    setGuardandoCiudad(false)
    setClienteEditando(null)
    setNuevaCiudad('')
    cargarClientes()
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
    if (error) { alert('No se pudo generar el reporte: ' + error.message); return }
    const lista = facturasMes || []
    const aprobadas = lista.filter((f) => f.estado === 'aprobada')
    const totalGalones = aprobadas.reduce((acc, f) => acc + Number(f.galones), 0)
    const ganancia = totalGalones * GANANCIA_POR_GALON
    const costoPuntos = totalGalones * VALOR_POR_PUNTO
    const gananciaNeta = ganancia - costoPuntos
    const clientesUnicos = new Set(lista.map((f) => f.perfiles?.numero_tarjeta)).size
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
    XLSX.writeFile(wb, `Enerpetrol_${ciudadSeleccionada.replace(/\s+/g, '_')}_${MESES[mesReporte]}_${anioReporte}.xlsx`)
  }

  const pendientes = facturas.filter((f) => f.perfiles?.ciudad === ciudadSeleccionada && f.estado === 'pendiente')
  const resueltas = facturas.filter((f) => f.perfiles?.ciudad === ciudadSeleccionada && f.estado !== 'pendiente')
  const totalGalonesMes = facturas
    .filter((f) => f.perfiles?.ciudad === ciudadSeleccionada && f.estado === 'aprobada')
    .reduce((acc, f) => acc + Number(f.galones || 0), 0)
  const gananciaMes = totalGalonesMes * GANANCIA_POR_GALON
  const pctMeta = Math.min(totalGalonesMes / META_GALONES_MENSUAL, 1)

  const clientesFiltrados = clientes.filter((c) =>
    c.nombre?.toLowerCase().includes(busquedaCliente.toLowerCase()) ||
    c.numero_tarjeta?.toLowerCase().includes(busquedaCliente.toLowerCase())
  )

  return (
    <div className="px-5 pt-2 pb-6">
      <h2 className="text-lg font-semibold mb-1" style={{ color: NAVY }}>Panel de administrador</h2>

      <div className="flex rounded-lg overflow-hidden mb-4 border" style={{ borderColor: BORDER }}>
        <button
          onClick={() => setSeccion('facturas')}
          className="flex-1 py-2.5 text-xs font-semibold"
          style={{ background: seccion === 'facturas' ? GREEN : CARD, color: seccion === 'facturas' ? '#0B1A12' : TEXT_MUTED }}
        >
          Facturas
        </button>
        <button
          onClick={() => setSeccion('clientes')}
          className="flex-1 py-2.5 text-xs font-semibold flex items-center justify-center gap-1"
          style={{ background: seccion === 'clientes' ? GREEN : CARD, color: seccion === 'clientes' ? '#0B1A12' : TEXT_MUTED }}
        >
          <Users size={12} /> Clientes
        </button>
      </div>

      {seccion === 'clientes' && (
        <div>
          <p className="text-sm mb-3" style={{ color: TEXT_MUTED }}>Busca un cliente para cambiar su ciudad u otros datos</p>
          <input
            type="text"
            value={busquedaCliente}
            onChange={(e) => setBusquedaCliente(e.target.value)}
            placeholder="Buscar por nombre o numero de tarjeta..."
            className="w-full rounded-lg border px-3 py-2.5 text-sm mb-4 focus:outline-none"
            style={{ borderColor: BORDER, color: NAVY }}
          />
          <div className="space-y-2">
            {clientesFiltrados.map((c) => (
              <div key={c.id} className="rounded-xl border p-3" style={{ borderColor: BORDER, background: CARD }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium" style={{ color: NAVY }}>{c.nombre}</p>
                    <p className="text-xs font-mono" style={{ color: TEXT_MUTED }}>{c.numero_tarjeta}</p>
                    <p className="text-xs mt-0.5" style={{ color: TEXT_MUTED }}>
                      {c.ciudad} · {Math.floor(c.galones_acumulados || 0)} pts · {c.rol}
                    </p>
                  </div>
                  <button
                    onClick={() => { setClienteEditando(c); setNuevaCiudad(c.ciudad) }}
                    className="p-1.5 rounded border flex-shrink-0"
                    style={{ borderColor: BORDER, color: GREEN }}
                  >
                    <Pencil size={14} />
                  </button>
                </div>

                {clienteEditando?.id === c.id && (
                  <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${BORDER}` }}>
                    <label className="text-xs mb-1.5 block font-semibold" style={{ color: NAVY }}>Cambiar ciudad:</label>
                    <select
                      value={nuevaCiudad}
                      onChange={(e) => setNuevaCiudad(e.target.value)}
                      className="w-full rounded-lg border px-3 py-2 text-sm mb-2 focus:outline-none"
                      style={{ borderColor: BORDER, color: NAVY }}
                    >
                      {CIUDADES.map((ciudad) => (
                        <option key={ciudad} value={ciudad}>{ciudad}</option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <button
                        onClick={guardarCiudadCliente}
                        disabled={guardandoCiudad || nuevaCiudad === c.ciudad}
                        className="flex-1 rounded-lg py-2 text-xs font-semibold text-white flex items-center justify-center gap-1 disabled:opacity-40"
                        style={{ background: GREEN }}
                      >
                        <Save size={12} /> {guardandoCiudad ? 'Guardando...' : 'Guardar'}
                      </button>
                      <button
                        onClick={() => { setClienteEditando(null); setNuevaCiudad('') }}
                        className="rounded-lg px-3 py-2 text-xs border"
                        style={{ borderColor: BORDER, color: TEXT_MUTED }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {clientesFiltrados.length === 0 && busquedaCliente && (
              <p className="text-sm text-center py-4" style={{ color: '#9AA5AE' }}>No se encontraron clientes.</p>
            )}
          </div>
        </div>
      )}

      {seccion === 'facturas' && (
        <>
          <p className="text-sm mb-3" style={{ color: TEXT_MUTED }}>Revisa y aprueba las facturas subidas por los clientes</p>

          <select
            value={ciudadSeleccionada}
            onChange={(e) => setCiudadSeleccionada(e.target.value)}
            className="w-full rounded-lg px-3 py-2.5 text-sm font-semibold mb-3 border focus:outline-none"
            style={{ borderColor: BORDER, background: CARD, color: NAVY }}
          >
            {CIUDADES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>

          <div className="rounded-xl border p-4 mb-5" style={{ borderColor: BORDER, background: CARD }}>
            <div className="flex items-center gap-2 mb-3">
              <FileSpreadsheet size={16} style={{ color: GREEN }} />
              <p className="text-sm font-semibold" style={{ color: NAVY }}>Reporte mensual descargable</p>
            </div>
            <div className="flex gap-2 mb-3">
              <select value={mesReporte} onChange={(e) => setMesReporte(Number(e.target.value))} className="flex-1 rounded-lg px-2 py-2 text-sm border focus:outline-none" style={{ borderColor: BORDER, color: NAVY }}>
                {MESES.map((m, i) => <option key={m} value={i}>{m}</option>)}
              </select>
              <select value={anioReporte} onChange={(e) => setAnioReporte(Number(e.target.value))} className="rounded-lg px-2 py-2 text-sm border focus:outline-none" style={{ borderColor: BORDER, color: NAVY }}>
                {[ahora.getFullYear(), ahora.getFullYear() - 1].map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <button onClick={descargarReporteMensual} disabled={generandoReporte} className="w-full rounded-lg py-2.5 text-sm font-semibold flex items-center justify-center gap-1.5 text-white disabled:opacity-50" style={{ background: GREEN }}>
              <Download size={15} /> {generandoReporte ? 'Generando...' : 'Descargar reporte en Excel'}
            </button>
          </div>

          {cargando ? (
            <p className="text-sm" style={{ color: TEXT_MUTED }}>Cargando datos...</p>
          ) : (
            <>
              <div className="rounded-xl border p-4 mb-5" style={{ borderColor: BORDER, background: CARD }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs uppercase tracking-wide" style={{ color: TEXT_MUTED }}>Meta mensual - {ciudadSeleccionada}</span>
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
                  <p className="text-sm font-semibold" style={{ color: GREEN }}>L {gananciaMes.toLocaleString('es-HN', { maximumFractionDigits: 0 })}</p>
                </div>
                <p className="text-[11px] mt-1" style={{ color: '#9AA5AE' }}>Ganancia estimada a L {GANANCIA_POR_GALON} por galon consumido</p>
              </div>

              {clientesParaCanje.length > 0 && (
                <div className="rounded-xl p-4 mb-5" style={{ background: 'linear-gradient(135deg, #5BAE2F 0%, #3D7A1F 100%)', boxShadow: '0 4px 14px rgba(91,174,47,0.3)' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <PartyPopper size={18} className="text-white" />
                    <p className="text-sm font-bold text-white">{clientesParaCanje.length} cliente{clientesParaCanje.length > 1 ? 's' : ''} listo{clientesParaCanje.length > 1 ? 's' : ''} para canje</p>
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
                  <p className="font-mono text-xl" style={{ color: GREEN }}>{resueltas.filter((f) => f.estado === 'aprobada').length}</p>
                  <p className="text-[10px] uppercase tracking-wide mt-1" style={{ color: TEXT_MUTED }}>Aprobadas</p>
                </div>
                <div className="rounded-lg border p-3 text-center" style={{ borderColor: BORDER, background: CARD }}>
                  <p className="font-mono text-xl" style={{ color: NAVY }}>{totalGalonesMes.toFixed(1)}</p>
                  <p className="text-[10px] uppercase tracking-wide mt-1" style={{ color: TEXT_MUTED }}>Gal. validados</p>
                </div>
              </div>

              <h3 className="text-sm font-semibold mb-3" style={{ color: NAVY }}>Pendientes de revision - {ciudadSeleccionada}</h3>
              <div className="space-y-2.5 mb-6">
                {pendientes.length === 0 && <p className="text-sm" style={{ color: '#9AA5AE' }}>No hay facturas pendientes en {ciudadSeleccionada}.</p>}
                {pendientes.map((f) => (
                  <div key={f.id} className="rounded-xl border p-4" style={{ borderColor: BORDER, background: CARD }}>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-sm font-medium" style={{ color: NAVY }}>{f.perfiles?.nombre || 'Cliente'}</p>
                        <p className="text-xs mb-2" style={{ color: TEXT_MUTED }}>{new Date(f.creado_en).toLocaleDateString('es-HN')}</p>
                        <div className="flex items-center gap-2">
                          <label className="text-xs" style={{ color: TEXT_MUTED }}>Galones:</label>
                          <input
                            type="number"
                            value={galonesEditando[f.id] !== undefined ? galonesEditando[f.id] : (f.galones || '')}
                            onChange={(e) => setGalonesEditando({ ...galonesEditando, [f.id]: e.target.value })}
                            className="w-20 rounded px-2 py-1 text-xs border focus:outline-none"
                            style={{ borderColor: BORDER, color: NAVY }}
                            placeholder="0.0"
                            step="0.01"
                          />
                        </div>
                      </div>
                      {f.imagen_url ? (
                        <a href={f.imagen_url} target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-lg border overflow-hidden flex-shrink-0" style={{ borderColor: BORDER }}>
                          <img src={f.imagen_url} alt="Factura" className="w-full h-full object-cover" />
                        </a>
                      ) : (
                        <div className="w-12 h-12 rounded-lg border flex items-center justify-center flex-shrink-0" style={{ background: '#F7F8FA', borderColor: BORDER }}>
                          <Camera size={16} style={{ color: '#9AA5AE' }} />
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => resolver(f.id, f.cliente_id, Number(f.galones), 'aprobada')} className="flex-1 rounded-lg py-2 text-xs font-semibold flex items-center justify-center gap-1 text-white" style={{ background: GREEN }}>
                        <CheckCircle2 size={13} /> Aprobar
                      </button>
                      <button onClick={() => resolver(f.id, f.cliente_id, Number(f.galones), 'rechazada')} className="flex-1 rounded-lg py-2 text-xs font-semibold flex items-center justify-center gap-1 border" style={{ borderColor: '#C7CFD6', color: '#274463' }}>
                        <XCircle size={13} /> Rechazar
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <h3 className="text-sm font-semibold mb-3" style={{ color: NAVY }}>Historial - {ciudadSeleccionada}</h3>
              <div className="space-y-2">
                {resueltas.length === 0 && <p className="text-sm" style={{ color: '#9AA5AE' }}>No hay facturas en el historial.</p>}
                {resueltas.map((f) => {
                  const s = ESTADO_STYLES[f.estado]
                  const Icon = s.icon
                  const editando = facturaEditando === f.id
                  return (
                    <div key={f.id} className="rounded-lg border p-3" style={{ borderColor: BORDER, background: CARD }}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-sm font-medium" style={{ color: NAVY }}>{f.perfiles?.nombre || 'Cliente'}</p>
                          <p className="text-xs" style={{ color: '#9AA5AE' }}>{new Date(f.creado_en).toLocaleDateString('es-HN')}</p>
                          {!editando && (
                            <p className="text-xs mt-0.5" style={{ color: '#9AA5AE' }}>{f.galones ? f.galones + ' gal' : 'Sin galones'}</p>
                          )}
                          {editando && (
                            <div className="flex items-center gap-2 mt-1">
                              <input
                                type="number"
                                value={galonesEdicion}
                                onChange={(e) => setGalonesEdicion(e.target.value)}
                                className="w-20 rounded px-2 py-1 text-xs border focus:outline-none"
                                style={{ borderColor: BORDER, color: NAVY }}
                                step="0.01"
                                placeholder="0.0"
                              />
                              <button onClick={() => guardarEdicionGalones(f)} className="rounded px-2 py-1 text-xs font-semibold text-white flex items-center gap-1" style={{ background: GREEN }}>
                                <Save size={12} /> Guardar
                              </button>
                            </div>
                          )}
                          {f.imagen_url && (
                            <a href={f.imagen_url} target="_blank" rel="noopener noreferrer" className="inline-block mt-2">
                              <img src={f.imagen_url} alt="Factura" className="rounded-lg object-cover" style={{ width: 48, height: 48, border: `1px solid ${BORDER}` }} />
                            </a>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1.5">
                          <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${s.bg} ${s.text}`}>
                            <Icon size={12} /> {s.label}
                          </span>
                          <div className="flex gap-1 flex-wrap justify-end">
                            <button
                              onClick={() => { setFacturaEditando(editando ? null : f.id); setGalonesEdicion(String(f.galones || '')) }}
                              className="p-1 rounded border"
                              style={{ borderColor: BORDER, color: editando ? '#9AA5AE' : GREEN }}
                            >
                              {editando ? <X size={12} /> : <Pencil size={12} />}
                            </button>
                            {f.estado === 'aprobada' && (
                              <button onClick={() => cambiarEstado(f, 'rechazada')} className="px-2 py-1 rounded border text-[10px] font-semibold" style={{ borderColor: '#C7CFD6', color: '#9AA5AE' }}>
                                Rechazar
                              </button>
                            )}
                            {f.estado === 'rechazada' && (
                              <button onClick={() => cambiarEstado(f, 'aprobada')} className="px-2 py-1 rounded border text-[10px] font-semibold" style={{ borderColor: GREEN, color: GREEN }}>
                                Aprobar
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
