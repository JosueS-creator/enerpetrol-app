import React, { useState, useRef, useEffect } from 'react'
import { Upload, CheckCircle2, Clock, XCircle, Star, Camera, PartyPopper, Download } from 'lucide-react'
import * as XLSX from 'xlsx'
import { supabase } from '../supabaseClient'
import TarjetaDigital from '../components/TarjetaDigital'
import Medidor from '../components/Medidor'
import { NAVY, GREEN, GREEN_LIGHT, BORDER, CARD, TEXT_MUTED, UMBRAL_PUNTOS_CANJE } from '../theme'

const ESTADO_STYLES = {
  aprobada: { bg: 'bg-[#5BAE2F]/10', text: 'text-[#4A9123]', icon: CheckCircle2, label: 'Aprobada' },
  pendiente: { bg: 'bg-[#0F2A4A]/8', text: 'text-[#274463]', icon: Clock, label: 'Pendiente' },
  rechazada: { bg: 'bg-red-500/10', text: 'text-red-600', icon: XCircle, label: 'Rechazada' },
}

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

export default function VistaCliente({ usuario }) {
  const [perfil, setPerfil] = useState(null)
  const [facturas, setFacturas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [galones, setGalones] = useState('')
  const [archivo, setArchivo] = useState(null)
  const [subiendo, setSubiendo] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [generandoReporte, setGenerandoReporte] = useState(false)
  const fileRef = useRef(null)
  const camaraRef = useRef(null)

  async function cargarDatos() {
    const { data: perfilData } = await supabase.from('perfiles').select('*').eq('id', usuario.id).single()
    setPerfil(perfilData)
    const { data: facturasData } = await supabase
      .from('facturas')
      .select('*')
      .eq('cliente_id', usuario.id)
      .order('creado_en', { ascending: false })
    setFacturas(facturasData || [])
    setCargando(false)
  }

  useEffect(() => {
    cargarDatos()
  }, [usuario.id])

  function handleArchivo(e) {
    const f = e.target.files?.[0]
    if (f) setArchivo(f)
  }

  async function handleEnviar() {
    if (!archivo) return
    setSubiendo(true)
    const nombreArchivo = `${usuario.id}/${Date.now()}_${archivo.name}`
    const { error: errorSubida } = await supabase.storage.from('Facturas').upload(nombreArchivo, archivo)
    let imagenUrl = null
    if (!errorSubida) {
      const { data: urlData } = supabase.storage.from('Facturas').getPublicUrl(nombreArchivo)
      imagenUrl = urlData.publicUrl
    }
    const { error: errorFactura } = await supabase.from('facturas').insert({
      cliente_id: usuario.id,
      galones: galones ? parseFloat(galones) : null,
      imagen_url: imagenUrl,
      estado: 'pendiente',
    })
    setSubiendo(false)
    if (!errorFactura) {
      setGalones('')
      setArchivo(null)
      setEnviado(true)
      setTimeout(() => setEnviado(false), 2500)
      cargarDatos()
    }
  }

  async function descargarReporte(tipo) {
    setGenerandoReporte(true)
    const ahora = new Date()
    let inicio, fin, etiqueta

    if (tipo === 'semanal') {
      const diaSemana = ahora.getDay()
      inicio = new Date(ahora)
      inicio.setDate(ahora.getDate() - diaSemana)
      inicio.setHours(0, 0, 0, 0)
      fin = new Date(inicio)
      fin.setDate(inicio.getDate() + 7)
      etiqueta = 'Semana_' + inicio.toLocaleDateString('es-HN').replace(/\//g, '-')
    } else {
      inicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1)
      fin = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 1)
      etiqueta = MESES[ahora.getMonth()] + '_' + ahora.getFullYear()
    }

    const { data: lista } = await supabase
      .from('facturas')
      .select('*')
      .eq('cliente_id', usuario.id)
      .gte('creado_en', inicio.toISOString())
      .lt('creado_en', fin.toISOString())
      .order('creado_en', { ascending: true })

    setGenerandoReporte(false)
    const facturasPeriodo = lista || []
    const aprobadas = facturasPeriodo.filter((f) => f.estado === 'aprobada')
    const totalGalones = aprobadas.reduce((acc, f) => acc + (Number(f.galones) || 0), 0)
    const totalPuntos = Math.floor(totalGalones)

    const resumen = [
      ['Mi reporte de consumo - Enerpetrol'],
      ['Periodo', etiqueta.replace(/_/g, ' ')],
      [],
      ['Total facturas enviadas', facturasPeriodo.length],
      ['Facturas aprobadas', aprobadas.length],
      ['Facturas pendientes', facturasPeriodo.filter((f) => f.estado === 'pendiente').length],
      ['Facturas rechazadas', facturasPeriodo.filter((f) => f.estado === 'rechazada').length],
      [],
      ['Total galones aprobados', totalGalones],
      ['Puntos acumulados en el periodo', totalPuntos],
    ]

    const detalle = [
      ['Fecha', 'Galones', 'Estado'],
      ...facturasPeriodo.map((f) => [
        new Date(f.creado_en).toLocaleDateString('es-HN'),
        f.galones ? Number(f.galones) : 'No indicado',
        f.estado,
      ]),
    ]

    const wb = XLSX.utils.book_new()
    const hojaResumen = XLSX.utils.aoa_to_sheet(resumen)
    const hojaDetalle = XLSX.utils.aoa_to_sheet(detalle)
    hojaResumen['!cols'] = [{ wch: 30 }, { wch: 20 }]
    hojaDetalle['!cols'] = [{ wch: 14 }, { wch: 14 }, { wch: 12 }]
    XLSX.utils.book_append_sheet(wb, hojaResumen, 'Resumen')
    XLSX.utils.book_append_sheet(wb, hojaDetalle, 'Mis facturas')
    XLSX.writeFile(wb, `Enerpetrol_MiConsumo_${etiqueta}.xlsx`)
  }

  if (cargando || !perfil) {
    return <div className="px-5 pt-6 text-sm" style={{ color: TEXT_MUTED }}>Cargando tu cuenta...</div>
  }

  return (
    <div className="px-5 pt-2 pb-6">
      <h2 className="text-lg font-semibold mb-4" style={{ color: NAVY }}>Mi cuenta</h2>

      <TarjetaDigital cliente={perfil} />

      <div className="mt-6 rounded-xl border p-5" style={{ borderColor: BORDER, background: CARD }}>
        <Medidor valor={perfil.galones_acumulados} meta={300} />
        <p className="text-center text-xs mt-3" style={{ color: TEXT_MUTED }}>Consumo acumulado este periodo</p>
      </div>

      <div className="mt-4 rounded-xl border p-4 flex items-center gap-3" style={{ borderColor: `${GREEN}50`, background: `${GREEN}0D` }}>
        <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: GREEN }}>
          <Star size={20} className="text-white" />
        </div>
        <div className="flex-1">
          <p className="text-[10px] uppercase tracking-widest" style={{ color: '#4A9123' }}>Puntos Enerpetrol</p>
          <p className="text-2xl font-bold tabular-nums" style={{ color: NAVY }}>{Math.floor(perfil.galones_acumulados)} pts</p>
        </div>
        <p className="text-xs text-right" style={{ color: TEXT_MUTED, maxWidth: 90 }}>1 punto<br />por galon</p>
      </div>

      {perfil.galones_acumulados >= UMBRAL_PUNTOS_CANJE && (
        <div className="mt-4 rounded-xl p-4 flex items-center gap-3" style={{ background: 'linear-gradient(135deg, #5BAE2F 0%, #3D7A1F 100%)', boxShadow: '0 4px 14px rgba(91,174,47,0.35)' }}>
          <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.2)' }}>
            <PartyPopper size={20} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Ya puedes canjear tu descuento!</p>
            <p className="text-xs text-white/85">Acercate a tu gasolinera con tu codigo de la tarjeta.</p>
          </div>
        </div>
      )}

      <div className="mt-6">
        <h3 className="text-sm font-semibold mb-3" style={{ color: NAVY }}>Subir factura</h3>
        <div className="rounded-xl border border-dashed p-4" style={{ borderColor: '#C7CFD6', background: CARD }}>
          <input ref={camaraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleArchivo} />
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleArchivo} />
          <div className="flex gap-2 mb-3">
            <button onClick={() => camaraRef.current?.click()} className="flex-1 flex items-center justify-center gap-2 rounded-lg border py-3 text-sm" style={{ borderColor: BORDER, background: '#F7F8FA', color: '#274463' }}>
              <Camera size={16} style={{ color: GREEN }} /> Camara
            </button>
            <button onClick={() => fileRef.current?.click()} className="flex-1 flex items-center justify-center gap-2 rounded-lg border py-3 text-sm" style={{ borderColor: BORDER, background: '#F7F8FA', color: '#274463' }}>
              <Upload size={16} style={{ color: GREEN }} /> Galeria
            </button>
          </div>
          {archivo && (
            <p className="text-xs mb-3 text-center" style={{ color: '#4A9123' }}>{archivo.name}</p>
          )}
          <label className="text-xs mb-1.5 block" style={{ color: TEXT_MUTED }}>Galones en la factura (opcional)</label>
          <input
            type="number"
            value={galones}
            onChange={(e) => setGalones(e.target.value)}
            placeholder="Ej. 20.5"
            className="w-full rounded-lg border px-3 py-2.5 text-sm mb-3 focus:outline-none"
            style={{ borderColor: BORDER, color: NAVY, background: '#FFFFFF' }}
          />
          <button
            onClick={handleEnviar}
            disabled={!archivo || subiendo}
            className="w-full rounded-lg py-2.5 text-sm font-semibold flex items-center justify-center gap-1.5 disabled:opacity-40 text-white"
            style={{ background: GREEN }}
          >
            <Upload size={15} /> {subiendo ? 'Subiendo...' : 'Enviar para revision'}
          </button>
          {enviado && (
            <p className="text-xs text-center mt-2.5" style={{ color: '#4A9123' }}>Factura enviada. Sera revisada por el equipo.</p>
          )}
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-semibold mb-3" style={{ color: NAVY }}>Mi reporte de consumo</h3>
        <div className="rounded-xl border p-4" style={{ borderColor: BORDER, background: CARD }}>
          <p className="text-xs mb-3" style={{ color: TEXT_MUTED }}>Descarga un resumen de tus facturas y galones consumidos</p>
          <div className="flex gap-2">
            <button
              onClick={() => descargarReporte('semanal')}
              disabled={generandoReporte}
              className="flex-1 rounded-lg py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 text-white disabled:opacity-50"
              style={{ background: NAVY }}
            >
              <Download size={13} /> Esta semana
            </button>
            <button
              onClick={() => descargarReporte('mensual')}
              disabled={generandoReporte}
              className="flex-1 rounded-lg py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 text-white disabled:opacity-50"
              style={{ background: GREEN }}
            >
              <Download size={13} /> Este mes
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-semibold mb-3" style={{ color: NAVY }}>Mis facturas</h3>
        <div className="space-y-2">
          {facturas.length === 0 && <p className="text-sm" style={{ color: '#9AA5AE' }}>Aun no has subido facturas.</p>}
          {facturas.map((f) => {
            const s = ESTADO_STYLES[f.estado]
            const Icon = s.icon
            return (
              <div key={f.id} className="rounded-lg border p-3 flex items-center justify-between" style={{ borderColor: BORDER, background: CARD }}>
                <div>
                  <p className="text-sm" style={{ color: NAVY }}>{f.galones ? f.galones + ' gal' : 'Sin galones'}</p>
                  <p className="text-xs" style={{ color: '#9AA5AE' }}>{new Date(f.creado_en).toLocaleDateString('es-HN')}</p>
                </div>
                <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${s.bg} ${s.text}`}>
                  <Icon size={12} /> {s.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
                                                 }
