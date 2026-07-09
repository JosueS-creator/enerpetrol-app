import React, { useState, useEffect } from 'react'
import { CheckCircle2, Clock, XCircle, Camera, PartyPopper, Download, FileSpreadsheet, Pencil, Save, X, Users, Gift } from 'lucide-react'
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

const REFERIDOS_ACTIVO = () => {
  const ahora = new Date()
  return ahora >= new Date('2026-07-01') && ahora <= new Date('2026-08-15T23:59:59')
}

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
  const [referidos, setReferidos] = useState([])

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
      .select('id, nombre, ciudad, numero_tarjeta, galones_acumulados, rol, excluido_referidos')
      .order('nombre')
    setClientes(data || [])
  }

  async function cargarReferidos() {
    const { data } = await supabase
      .from('referidos')
      .select('*, referidor:perfiles!referidor_id(nombre, numero_tarjeta), referido:perfiles!referido_id(nombre, numero_tarjeta)')
      .order('creado_en', { ascending: false })
    setReferidos(data || [])
  }

  useEffect(() => {
    setCargando(true)
    cargarFacturas()
  }, [ciudadSeleccionada])

  useEffect(() => {
    if (seccion === 'clientes') cargarClientes()
    if (seccion === 'referidos') cargarReferidos()
  }, [seccion])

  async function verificarYPremiarReferido(clienteId, esLaPrimeraFactura) {
    if (!esLaPrimeraFactura || !REFERIDOS_ACTIVO()) return

    const { data: referido } = await supabase
      .from('referidos')
      .select('*')
      .eq('referido_id', clienteId)
      .eq('punto_otorgado', false)
      .single()

    if (!referido) return

    const { data: perfilReferidor } = await supabase
      .from('perfiles')
      .select('galones_acumulados, nombre, excluido_referidos')
      .eq('id', referido.referidor_id)
      .single()

    if (!perfilReferidor || perfilReferidor.excluido_referidos) return

    await supabase.from('perfiles').update({
      galones_acumulados: (perfilReferidor.galones_acumulados || 0) + 1
    }).eq('id', referido.referidor_id)

    await supabase.from('referidos').update({
      punto_otorgado: true
    }).eq('id', referido.id)

    await supabase.from('notificaciones').insert({
      usuario_id: referido.referidor_id,
      mensaje: '🎉 Recibiste 1 Enermoneda por un referido exitoso! Gracias por recomendar Enerpetrol.',
    })
  }

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
      const { count } = await supabase
        .from('facturas')
        .select('id', { count: 'exact' })
        .eq('cliente_id', clienteId)
        .eq('estado', 'aprobada')
      await verificarYPremiarReferido(clienteId, count === 1)
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
      const { count } = await supabase
        .from('facturas')
        .select('id', { count: 'exact' })
        .eq('cliente_id', factura.cliente_id)
        .eq('estado', 'aprobada')
      await verificarYPremiarReferido(factura.cliente_id, count === 1)
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

  async function toggleExcluirReferidos(cliente) {
    await supabase.from('perfiles')
      .update({ excluido_referidos: !cliente.excluido_referidos })
      .eq('id', cliente.id)
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
      ['Fecha', 'Cliente', 'Numero de tarjeta', 'Galones', 'Estado', 'Enermonedas otorgadas', 'Costo (L)'],
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
        <button onClick={() => setSeccion('facturas')} className="flex-1 py-2.5 text-xs font-semibold"
          style={{ background: seccion === 'facturas' ? GREEN : CARD, color: seccion === 'facturas' ? '#0B1A12' : TEXT_MUTED }}>
          Facturas
        </button>
        <button onClick={() => setSeccion('clientes')} className="flex-1 py-2.5 text-xs font-semibold flex items-center justify-center gap-1"
          style={{ background: seccion === 'clientes' ? GREEN : CARD, color: seccion === 'clientes' ? '#0B1A12' : TEXT_MUTED }}>
          <Users size={12} /> Clientes
        </button>
        <button onClick={() => setSeccion('referidos')} className="flex-1 py-2.5 text-xs font-semibold flex items-center justify-center gap-1"
          style={{ background: seccion === 'referidos' ? GREEN : CARD, color: seccion === 'referidos' ? '#0B1A12' : TEXT_MUTED }}>
          <Gift size={12} /> Referidos
        </button>
      </div>

      {seccion === 'clientes' && (
        <div>
          <p className="text-sm mb-3" style={{ color: TEXT_MUTED }}>Busca un cliente para cambiar su ciudad o configurar referidos</p>
          <input type="text" value={busquedaCliente} onChange={(e) => setBusquedaCliente(e.target.value)}
            placeholder="Buscar por nombre o numero de tarjeta..."
            className="w-full rounded-lg border px-3 py-2.5 text-sm mb-4 focus:outline-none"
            style={{ borderColor: BORDER, color: NAVY }} />
          <div className="space-y-2">
            {clientesFiltrados.map((c) => (
              <div key={c.id} className="rounded-xl border p-3" style={{ borderColor: BORDER, background: CARD }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium" style={{ color: NAVY }}>{c.nombre}</p>
                    <p className="text-xs font-mono" style={{ color: TEXT_MUTED }}>{c.numero_tarjeta}</p>
                    <p className="text-xs mt-0.5" style={{ color: TEXT_MUTED }}>
                      {c.ciudad} - {Math.floor(c.galones_acumulados || 0)} EM - {c.rol}
                    </p>
                    {c.excluido_referidos && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ background: '#FEE2E2', color: '#DC2626' }}>
                        Excluido de referidos
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1">
