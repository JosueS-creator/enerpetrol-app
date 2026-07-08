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
      .select('id, nombre, ciudad, numero_tarjeta, galones_acumulados, rol')
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
      .select('galones_acumulados, nombre')
      .eq('id', referido.referidor_id)
      .single()

    if (perfilReferidor) {
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

      const esLaPrimeraFactura = count === 1
      await verificarYPremiarReferido(clienteId, esLaPrimeraFactura)
    }

    const nuevosEditando = { ...galonesEditando }
