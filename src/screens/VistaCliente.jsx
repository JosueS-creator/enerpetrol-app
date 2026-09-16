import React, { useState, useRef, useEffect } from 'react'
import { Upload, CheckCircle2, Clock, XCircle, Camera, Download, X, Copy, Check, Bell, Sparkles, AlertCircle, Trash2, MapPin, Zap } from 'lucide-react'
import * as XLSX from 'xlsx'
import { supabase } from '../supabaseClient'
import TarjetaDigital from '../components/TarjetaDigital'
import { NAVY, GREEN, GREEN_LIGHT, BORDER, CARD, TEXT_MUTED } from '../theme'

const ESTADO_STYLES = {
  aprobada: { bg: 'bg-[#5BAE2F]/10', text: 'text-[#4A9123]', icon: CheckCircle2, label: 'Aprobada' },
  pendiente: { bg: 'bg-[#0F2A4A]/8', text: 'text-[#274463]', icon: Clock, label: 'Pendiente' },
  rechazada: { bg: 'bg-red-500/10', text: 'text-red-600', icon: XCircle, label: 'Rechazada' },
}
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const CARAS = [
  { valor: 'malo',      emoji: '😞', label: 'Malo',      color: '#EF4444' },
  { valor: 'regular',   emoji: '😐', label: 'Regular',   color: '#F59E0B' },
  { valor: 'bueno',     emoji: '😊', label: 'Bueno',     color: '#3B82F6' },
  { valor: 'excelente', emoji: '🤩', label: 'Excelente', color: GREEN },
]
const REFERIDOS_ACTIVO = () => {
  const ahora = new Date()
  return ahora >= new Date('2026-07-01') && ahora <= new Date('2026-08-15T23:59:59')
}
const VAPID_PUBLIC_KEY = 'BOlOf_QAUrzqYvPTbWA0p-CHzn5TRP737H_It9-oVlJy91rV9rc6dj6_zpFg_cBBLXhlPVQ09Zg3ym7VlT_hiD8'

const CSS = `
  @keyframes epSheetIn  { from { transform: translateY(100%); } to { transform: translateY(0); } }
  @keyframes epOverlayIn { from { background: rgba(0,0,0,0); } to { background: rgba(0,0,0,0.55); } }
  @keyframes epIconFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-3px)} }
  @keyframes epBlink    { 0%,100%{opacity:1} 50%{opacity:.3} }
  @keyframes epFloat {
    0%,100% { transform: translateY(0); box-shadow: 0 8px 28px rgba(91,174,47,0.45); }
    50%     { transform: translateY(-5px); box-shadow: 0 16px 40px rgba(91,174,47,0.6); }
  }
  @keyframes glowRun {
    0%   { background-position: 0% 0%; }
    25%  { background-position: 100% 0%; }
    50%  { background-position: 100% 100%; }
    75%  { background-position: 0% 100%; }
    100% { background-position: 0% 0%; }
  }
  @keyframes glowPulse { 0%,100% { opacity: 0.7; } 50% { opacity: 1; } }
  @keyframes btn3dFloat {
    0%,100% { transform: translateY(0); box-shadow: 0 8px 0 #2A6B14, 0 10px 20px rgba(91,174,47,0.5); }
    50%     { transform: translateY(-3px); box-shadow: 0 11px 0 #2A6B14, 0 14px 28px rgba(91,174,47,0.6); }
  }
  .btn-3d {
    position: relative;
    background: linear-gradient(180deg, #7DD44A 0%, #5BAE2F 40%, #4A9123 100%);
    border-radius: 18px; border: none; cursor: pointer;
    color: #fff; font-weight: 800; font-size: 15px; padding: 17px 20px;
    width: 100%; display: flex; align-items: center; justify-content: center; gap: 10px;
    box-shadow: 0 8px 0 #2A6B14, 0 10px 20px rgba(91,174,47,0.5);
    animation: btn3dFloat 3s ease-in-out infinite;
    text-shadow: 0 1px 2px rgba(0,0,0,0.2);
    transition: transform 0.08s ease, box-shadow 0.08s ease;
  }
  .btn-3d:active {
    transform: translateY(5px) !important;
    box-shadow: 0 3px 0 #2A6B14, 0 4px 8px rgba(91,174,47,0.4) !important;
    animation: none !important;
  }
  .tarjeta-glow-wrap {
    position: relative; border-radius: 22px; padding: 2px;
    animation: glowPulse 2.5s ease-in-out infinite;
  }
  .tarjeta-glow-wrap::before {
    content: ''; position: absolute; inset: -2px; border-radius: 24px;
    background: linear-gradient(90deg,
      transparent 0%, rgba(91,174,47,0.9) 20%, rgba(143,203,77,1) 40%,
      rgba(255,255,255,0.6) 50%, rgba(143,203,77,1) 60%, rgba(91,174,47,0.9) 80%, transparent 100%
    );
    background-size: 300% 300%;
    animation: glowRun 3s linear infinite; z-index: 0;
  }
  .tarjeta-glow-inner { position: relative; z-index: 1; border-radius: 20px; overflow: hidden; }
`

async function leerGalonesDeFactura(archivo) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = async (e) => {
      const base64 = e.target.result.split(',')[1]
      try {
        const res = await fetch(
          'https://toyqwvyzdjvfomfomwdl.supabase.co/functions/v1/leer-factura-ocr',
          { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ imagenBase64: base64 }) }
        )
        const data = await res.json()
        resolve(data.galones || null)
      } catch { resolve(null) }
    }
    reader.readAsDataURL(archivo)
  })
}

export default function VistaCliente({ usuario, irATab, onPasoChange }) {
  const [pasoActual, setPasoActual] = useState(() => {
    const g = parseInt(localStorage.getItem('enp_paso_actual') || '1')
    return g === 3 ? 2 : g
  })
  const [perfil,               setPerfil]               = useState(null)
  const [facturas,             setFacturas]             = useState([])
  const [estaciones,           setEstaciones]           = useState([])
  const [notificaciones,       setNotificaciones]       = useState([])
  const [cargando,             setCargando]             = useState(true)
  const [galones,              setGalones]              = useState('')
  const [archivo,              setArchivo]              = useState(null)
  const [archivoPreview,       setArchivoPreview]       = useState(null)
  const [estacionSeleccionada, setEstacionSeleccionada] = useState('')
  const [estacionNoAcumula,    setEstacionNoAcumula]    = useState(false)
  const [subiendo,             setSubiendo]             = useState(false)
  const [enviado,              setEnviado]              = useState(false)
  const [generandoReporte,     setGenerandoReporte]     = useState(false)
  const [mostrarCalificacion,  setMostrarCalificacion]  = useState(false)
  const [facturaRecienSubida,  setFacturaRecienSubida]  = useState(null)
  const [calificacion,         setCalificacion]         = useState(null)
  const [comentario,           setComentario]           = useState('')
  const [enviandoCalificacion, setEnviandoCalificacion] = useState(false)
  const [copiado,              setCopiado]              = useState(false)
  const [notifActivadas,       setNotifActivadas]       = useState(false)
  const [activandoNotif,       setActivandoNotif]       = useState(false)
  const [leyendoOCR,           setLeyendoOCR]           = useState(false)
  const [ocrResultado,         setOcrResultado]         = useState(null)
  const [mostrarSheet,         setMostrarSheet]         = useState(false)
  const [sheetEstado,          setSheetEstado]          = useState('opciones')
  const [mostrarEliminarCuenta,setMostrarEliminarCuenta]= useState(false)
  const [eliminandoCuenta,     setEliminandoCuenta]     = useState(false)
  const [confirmacionTexto,    setConfirmacionTexto]    = useState('')
  const [verTodasFacturas,     setVerTodasFacturas]     = useState(false)

  function avanzarPaso(n) {
    setPasoActual(n)
    localStorage.setItem('enp_paso_actual', String(n))
    onPasoChange && onPasoChange(n)
  }

  async function cargarDatos() {
    const { data: p } = await supabase.from('perfiles').select('*').eq('id', usuario.id).single()
    setPerfil(p)
    const { data: f } = await supabase.from('facturas').select('*').eq('cliente_id', usuario.id).order('creado_en', { ascending: false })
    setFacturas(f || [])
    const { data: e } = await supabase.from('estaciones').select('id, nombre, ciudad, acumula_puntos').eq('activa', true).eq('ciudad', p?.ciudad || 'Tegucigalpa').order('nombre')
    setEstaciones(e || [])
    const { data: n } = await supabase.from('notificaciones').select('*').eq('usuario_id', usuario.id).order('creado_en', { ascending: false })
    setNotificaciones(n || [])
    try {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        const reg = await navigator.serviceWorker.ready
        setNotifActivadas(!!(await reg.pushManager.getSubscription()))
      }
    } catch {}
    setCargando(false)
  }

  useEffect(() => { cargarDatos() }, [usuario.id])

  function abrirSheet() {
    setMostrarSheet(true); setSheetEstado('opciones')
    setGalones(''); setOcrResultado(null); setArchivo(null); setArchivoPreview(null)
  }
  function cerrarSheet() { setMostrarSheet(false); setSheetEstado('opciones') }

  async function activarNotificaciones() {
    setActivandoNotif(true)
    try {
      if ((await Notification.requestPermission()) !== 'granted') { setActivandoNotif(false); return }
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: VAPID_PUBLIC_KEY })
      const { endpoint, keys } = sub.toJSON()
      await supabase.from('push_subscriptions').upsert({ usuario_id: usuario.id, endpoint, p256dh: keys.p256dh, auth: keys.auth }, { onConflict: 'usuario_id,endpoint' })
      setNotifActivadas(true)
    } catch {}
    setActivandoNotif(false)
  }

  async function marcarLeida(id) {
    await supabase.from('notificaciones').delete().eq('id', id)
    setNotificaciones((prev) => prev.filter((n) => n.id !== id))
  }
  async function marcarTodasLeidas() {
    await supabase.from('notificaciones').delete().eq('usuario_id', usuario.id)
    setNotificaciones([])
    if ('clearAppBadge' in navigator) navigator.clearAppBadge()
  }

  function handleArchivo(e) {
    const f = e.target.files?.[0]
    if (!f) return
    // Reset input para permitir seleccionar el mismo archivo de nuevo
    e.target.value = ''
    setGalones(''); setOcrResultado(null); setSheetEstado('ocr')
    const reader = new FileReader()
    reader.onload = (ev) => {
      setArchivoPreview(ev.target.result)
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const MAX = 1200
        let w = img.width, h = img.height
        if (w > h) { if (w > MAX) { h = h * MAX / w; w = MAX } }
        else       { if (h > MAX) { w = w * MAX / h; h = MAX } }
        canvas.width = w; canvas.height = h
        canvas.getContext('2d').drawImage(img, 0, 0, w, h)
        canvas.toBlob(async (blob) => {
          const nombre = f.name.replace(/\.heic$/i,'.jpg').replace(/\.heif$/i,'.jpg').replace(/[^a-zA-Z0-9._-]/g,'_')
          const comprimido = new File([blob], nombre, { type: 'image/jpeg' })
          setArchivo(comprimido)
          setLeyendoOCR(true)
          const gal = await leerGalonesDeFactura(comprimido)
          setLeyendoOCR(false)
          if (gal) { setGalones(String(gal)); setOcrResultado('exito') }
          else { setOcrResultado('manual') }
        }, 'image/jpeg', 0.7)
      }
      img.src = ev.target.result
    }
    reader.readAsDataURL(f)
  }

  function copiarCodigo() {
    if (!perfil?.numero_tarjeta) return
    navigator.clipboard.writeText(perfil.numero_tarjeta).then(() => { setCopiado(true); setTimeout(() => setCopiado(false), 2000) })
  }

  async function verificarYPremiarReferido(esLaPrimera) {
    if (!esLaPrimera || !REFERIDOS_ACTIVO()) return
    const { data: ref } = await supabase.from('referidos').select('*').eq('referido_id', usuario.id).eq('punto_otorgado', false).single()
    if (!ref) return
    const { data: pr } = await supabase.from('perfiles').select('galones_acumulados').eq('id', ref.referidor_id).single()
    if (pr) {
      await supabase.from('perfiles').update({ galones_acumulados: (pr.galones_acumulados || 0) + 1 }).eq('id', ref.referidor_id)
      await supabase.from('referidos').update({ punto_otorgado: true }).eq('id', ref.id)
    }
  }

  async function handleEnviar() {
    if (!archivo) return
    setSubiendo(true)
    const esLaPrimera = facturas.length === 0
    const nombre = `${usuario.id}/${Date.now()}_${archivo.name.replace(/[^a-zA-Z0-9._-]/g,'_')}`
    const { error: errSubida } = await supabase.storage.from('Facturas').upload(nombre, archivo)
    let imagenUrl = null
    if (!errSubida) {
      const { data: u } = supabase.storage.from('Facturas').getPublicUrl(nombre)
      imagenUrl = u.publicUrl
    }
    const { data: facturaData, error: errFactura } = await supabase.from('facturas').insert({
      cliente_id: usuario.id,
      estacion_id: estacionSeleccionada ? parseInt(estacionSeleccionada) : null,
      galones: galones ? parseFloat(galones) : null,
      imagen_url: imagenUrl, estado: 'pendiente',
    }).select().single()
    if (!errFactura) {
      await verificarYPremiarReferido(esLaPrimera)
      setGalones(''); setArchivo(null); setArchivoPreview(null)
      setEstacionSeleccionada(''); setOcrResultado(null)
      setEnviado(true); setTimeout(() => setEnviado(false), 2500)
      setFacturaRecienSubida(facturaData)
      cerrarSheet()
      setMostrarCalificacion(true)
      avanzarPaso(4)
      cargarDatos()
    }
    setSubiendo(false)
  }

  async function enviarCalificacion() {
    if (!calificacion) return
    const negativa = calificacion === 'malo' || calificacion === 'regular'
    if (negativa && !comentario.trim()) return
    setEnviandoCalificacion(true)
    await supabase.from('calificaciones').insert({
      cliente_id: usuario.id,
      estacion_id: facturaRecienSubida?.estacion_id || null,
      factura_id: facturaRecienSubida?.id || null,
      calificacion, comentario: comentario.trim() || null,
    })
    setEnviandoCalificacion(false); setMostrarCalificacion(false)
    setCalificacion(null); setComentario(''); setFacturaRecienSubida(null)
  }

  async function descargarReporte(tipo) {
    setGenerandoReporte(true)
    const ahora = new Date()
    let inicio, fin, etiqueta
    if (tipo === 'semanal') {
      const d = ahora.getDay()
      inicio = new Date(ahora); inicio.setDate(ahora.getDate() - d); inicio.setHours(0,0,0,0)
      fin = new Date(inicio); fin.setDate(inicio.getDate() + 7)
      etiqueta = 'Semana_' + inicio.toLocaleDateString('es-HN').replace(/\//g,'-')
    } else {
      inicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1)
      fin    = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 1)
      etiqueta = MESES[ahora.getMonth()] + '_' + ahora.getFullYear()
    }
    const { data: lista } = await supabase.from('facturas').select('*')
      .eq('cliente_id', usuario.id).gte('creado_en', inicio.toISOString()).lt('creado_en', fin.toISOString()).order('creado_en', { ascending: true })
    setGenerandoReporte(false)
    const periodo = lista || []
    const aprobadas = periodo.filter((f) => f.estado === 'aprobada')
    const total = aprobadas.reduce((acc, f) => acc + (Number(f.galones) || 0), 0)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
      ['Mi reporte - Enerpetrol'], ['Periodo', etiqueta.replace(/_/g,' ')], [],
      ['Total facturas', periodo.length], ['Aprobadas', aprobadas.length],
      ['Total galones', total], ['Enermonedas', Math.floor(total)],
    ]), 'Resumen')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
      ['Fecha','Galones','Estado'],
      ...periodo.map((f) => [new Date(f.creado_en).toLocaleDateString('es-HN'), f.galones ? Number(f.galones) : 'No indicado', f.estado]),
    ]), 'Facturas')
    XLSX.writeFile(wb, `Enerpetrol_MiConsumo_${etiqueta}.xlsx`)
  }

  async function eliminarCuenta() {
    setEliminandoCuenta(true)
    try {
      await supabase.from('notificaciones').delete().eq('usuario_id', usuario.id)
      await supabase.from('push_subscriptions').delete().eq('usuario_id', usuario.id)
      await supabase.from('calificaciones').delete().eq('cliente_id', usuario.id)
      await supabase.from('canjes').delete().eq('cliente_id', usuario.id)
      await supabase.from('facturas').delete().eq('cliente_id', usuario.id)
      await supabase.from('referidos').delete().eq('referido_id', usuario.id)
      await supabase.from('perfiles').delete().eq('id', usuario.id)
      await supabase.auth.signOut()
      localStorage.clear()
    } catch (e) { console.error(e) }
    setEliminandoCuenta(false)
  }

  if (cargando || !perfil) return <div className="px-5 pt-6 text-sm" style={{ color: TEXT_MUTED }}>Cargando tu cuenta...</div>

  const negativa = calificacion === 'malo' || calificacion === 'regular'
  const puedeEnviarCalificacion = calificacion && (!negativa || comentario.trim())
  const notifNoLeidas = notificaciones.filter((n) => !n.leida)

  return (
    <div style={{ paddingBottom: 24 }}>
      <style>{CSS}</style>

      {/* ── Modal Calificación ── */}
      {mostrarCalificacion && (
        <div className="fixed inset-0 flex items-center justify-center z-50 px-6" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: CARD }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold" style={{ color: NAVY }}>¿Cómo fue la atención?</h3>
              <button onClick={() => setMostrarCalificacion(false)}><X size={18} style={{ color: TEXT_MUTED }} /></button>
            </div>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {CARAS.map((c) => (
                <button key={c.valor} onClick={() => setCalificacion(c.valor)}
                  className="flex flex-col items-center gap-1 rounded-xl py-3 border"
                  style={{ borderColor: calificacion === c.valor ? c.color : BORDER, background: calificacion === c.valor ? c.color + '18' : '#F7F8FA' }}>
                  <span style={{ fontSize: 28 }}>{c.emoji}</span>
                  <span className="text-xs font-semibold" style={{ color: calificacion === c.valor ? c.color : TEXT_MUTED }}>{c.label}</span>
                </button>
              ))}
            </div>
            {negativa && (
              <div className="mb-4">
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: '#EF4444' }}>Cuéntanos qué pasó (obligatorio)</label>
                <textarea value={comentario} onChange={(e) => setComentario(e.target.value)} placeholder="Describe tu experiencia..." rows={3}
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none resize-none" style={{ borderColor: '#EF4444', color: NAVY }} />
              </div>
            )}
            {calificacion && !negativa && (
              <div className="mb-4">
                <label className="text-xs mb-1.5 block" style={{ color: TEXT_MUTED }}>Comentario adicional (opcional)</label>
                <textarea value={comentario} onChange={(e) => setComentario(e.target.value)} placeholder="Algo más..." rows={2}
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none resize-none" style={{ borderColor: BORDER, color: NAVY }} />
              </div>
            )}
            <button onClick={enviarCalificacion} disabled={!puedeEnviarCalificacion || enviandoCalificacion}
              className="w-full rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-40" style={{ background: GREEN }}>
              {enviandoCalificacion ? 'Enviando...' : 'Enviar calificación'}
            </button>
            <button onClick={() => setMostrarCalificacion(false)} className="w-full text-xs text-center mt-3" style={{ color: TEXT_MUTED }}>Omitir</button>
          </div>
        </div>
      )}

      {/* ── Bottom Sheet overlay ── */}
      {mostrarSheet && (
        <div className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.55)', animation: 'epOverlayIn 0.35s ease both' }} onClick={cerrarSheet} />
      )}

      {/* ── Bottom Sheet ── */}
      {mostrarSheet && (
        <div className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl px-5 pb-10"
          style={{ background: '#fff', maxWidth: 480, margin: '0 auto', boxShadow: '0 -8px 40px rgba(0,0,0,0.15)', animation: 'epSheetIn 0.4s cubic-bezier(0.23,1,0.32,1) both' }}
          onClick={(e) => e.stopPropagation()}>
          <div style={{ width: 40, height: 4, background: '#E0E4E8', borderRadius: 2, margin: '14px auto 20px' }} />

          {sheetEstado === 'opciones' && (
            <>
              <p className="text-base font-bold mb-1" style={{ color: NAVY }}>Subir factura</p>
              <p className="text-xs mb-5" style={{ color: TEXT_MUTED }}>Gana Enermonedas con cada compra</p>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {/* CÁMARA — label envuelve input directamente, funciona en iOS y Android */}
                <label className="rounded-2xl flex flex-col items-center gap-3 py-5 cursor-pointer"
                  style={{ background: '#F5F7FA', border: '1px solid #E8EDF2' }}>
                  <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleArchivo} />
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center relative"
                    style={{ background: 'rgba(55,138,221,0.1)', border: '1px solid rgba(55,138,221,0.2)', animation: 'epIconFloat 3s ease-in-out infinite' }}>
                    <Camera size={28} style={{ color: '#378ADD' }} />
                    <div style={{ position:'absolute', top:4, right:4, width:10, height:10, borderRadius:'50%', background: GREEN, border: '2px solid white', animation: 'epBlink 1.8s ease-in-out infinite' }} />
                  </div>
                  <div><p className="text-sm font-bold" style={{ color: NAVY }}>Cámara</p><p className="text-xs" style={{ color: TEXT_MUTED }}>Tomar foto</p></div>
                </label>
                {/* GALERÍA */}
                <label className="rounded-2xl flex flex-col items-center gap-3 py-5 cursor-pointer"
                  style={{ background: '#F5F7FA', border: '1px solid #E8EDF2' }}>
                  <input type="file" accept="image/*" className="hidden" onChange={handleArchivo} />
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{ background: 'rgba(91,174,47,0.1)', border: '1px solid rgba(91,174,47,0.2)', animation: 'epIconFloat 3s ease-in-out infinite 0.3s' }}>
                    <Upload size={28} style={{ color: GREEN }} />
                  </div>
                  <div><p className="text-sm font-bold" style={{ color: NAVY }}>Galería</p><p className="text-xs" style={{ color: TEXT_MUTED }}>Elegir imagen</p></div>
                </label>
              </div>
              <div className="flex items-center gap-2 rounded-xl p-3 mb-4"
                style={{ background: 'rgba(91,174,47,0.07)', border: '1px solid rgba(91,174,47,0.18)' }}>
                <Sparkles size={14} style={{ color: GREEN, flexShrink: 0 }} />
                <p className="text-xs font-semibold" style={{ color: '#3D7A1F' }}>Lectura automática de galones activada</p>
              </div>
              <button onClick={cerrarSheet} className="w-full py-3 rounded-2xl text-sm font-semibold"
                style={{ border: '1px solid #E8EDF2', color: TEXT_MUTED }}>Cancelar</button>
            </>
          )}

          {sheetEstado === 'ocr' && (
            <>
              <p className="text-base font-bold mb-4" style={{ color: NAVY }}>Revisando factura</p>
              {archivoPreview && (
                <div className="rounded-2xl overflow-hidden mb-3 relative" style={{ border: '1px solid ' + BORDER }}>
                  <img src={archivoPreview} alt="Factura" className="w-full object-contain" style={{ maxHeight: 150 }} />
                  <button onClick={() => { setArchivo(null); setArchivoPreview(null); setGalones(''); setOcrResultado(null); setSheetEstado('opciones') }}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(0,0,0,0.5)' }}>
                    <X size={14} className="text-white" />
                  </button>
                </div>
              )}
              {leyendoOCR && (
                <div className="rounded-xl p-3 mb-3 flex items-center gap-2"
                  style={{ background: GREEN + '10', border: '1px solid ' + GREEN + '30' }}>
                  <div className="w-4 h-4 rounded-full border-2 animate-spin flex-shrink-0" style={{ borderColor: GREEN, borderTopColor: 'transparent' }} />
                  <p className="text-xs font-semibold" style={{ color: GREEN }}>Leyendo factura automáticamente...</p>
                </div>
              )}
              {ocrResultado === 'exito' && !leyendoOCR && (
                <div className="rounded-xl p-3 mb-3 flex items-center gap-2"
                  style={{ background: GREEN + '10', border: '1px solid ' + GREEN + '30' }}>
                  <CheckCircle2 size={16} style={{ color: GREEN, flexShrink: 0 }} />
                  <div>
                    <p className="text-xs font-bold" style={{ color: GREEN }}>Galones detectados automáticamente</p>
                    <p className="text-xs" style={{ color: TEXT_MUTED }}>Verifica el valor antes de enviar</p>
                  </div>
                </div>
              )}
              {ocrResultado === 'manual' && !leyendoOCR && (
                <div className="rounded-xl p-3 mb-3 flex items-center gap-2"
                  style={{ background: '#FEF9C3', border: '1px solid #FDE047' }}>
                  <AlertCircle size={16} style={{ color: '#854D0E', flexShrink: 0 }} />
                  <div>
                    <p className="text-xs font-bold" style={{ color: '#854D0E' }}>No se pudo leer la cantidad</p>
                    <p className="text-xs" style={{ color: '#A16207' }}>Ingresa los galones manualmente</p>
                  </div>
                </div>
              )}
              <label className="text-xs mb-1.5 block" style={{ color: TEXT_MUTED }}>Gasolinera donde cargaste</label>
              <select value={estacionSeleccionada} onChange={(e) => {
                setEstacionSeleccionada(e.target.value)
                const est = estaciones.find(s => String(s.id) === e.target.value)
                setEstacionNoAcumula(est ? est.acumula_puntos === false : false)
              }} className="w-full rounded-xl border px-3 py-2.5 text-sm mb-3 focus:outline-none"
                style={{ borderColor: BORDER, color: estacionSeleccionada ? NAVY : '#9AA5AE', background: '#fff' }}>
                <option value="">Selecciona la gasolinera (opcional)</option>
                {estaciones.map((e) => <option key={e.id} value={e.id}>{e.nombre} — {e.ciudad}</option>)}
              </select>
              {estacionNoAcumula && (
                <div className="rounded-xl p-3 mb-3 flex items-center gap-2"
                  style={{ background: '#FEF9C3', border: '1px solid #FDE047' }}>
                  <AlertCircle size={15} style={{ color: '#854D0E', flexShrink: 0 }} />
                  <p className="text-xs" style={{ color: '#854D0E' }}>Esta gasolinera aún no acumula Enermonedas. Tu factura será aprobada pero no sumará puntos.</p>
                </div>
              )}
              <label className="text-xs mb-1.5 block" style={{ color: TEXT_MUTED }}>
                Galones {ocrResultado === 'exito' ? '(detectados — puedes corregir)' : ''}
              </label>
              <input type="number" value={galones} onChange={(e) => setGalones(e.target.value)} placeholder="Ej. 20.50"
                className="w-full rounded-xl border px-3 py-2.5 text-sm mb-4 focus:outline-none"
                style={{ borderColor: ocrResultado === 'exito' ? GREEN : BORDER, color: NAVY, background: ocrResultado === 'exito' ? GREEN + '08' : '#fff', fontWeight: ocrResultado === 'exito' ? '700' : '400' }} />
              <button onClick={handleEnviar} disabled={!archivo || subiendo || leyendoOCR}
                className="w-full rounded-2xl py-3.5 text-sm font-bold flex items-center justify-center gap-2 text-white disabled:opacity-40 mb-2"
                style={{ background: 'linear-gradient(135deg, #5BAE2F, #3D7A1F)', boxShadow: '0 4px 16px rgba(91,174,47,0.4)' }}>
                <Upload size={15} />
                {subiendo ? 'Subiendo...' : leyendoOCR ? 'Leyendo factura...' : 'Enviar para revisión'}
              </button>
              {enviado && <p className="text-xs text-center mb-2" style={{ color: '#4A9123' }}>✅ Factura enviada correctamente.</p>}
              <button onClick={cerrarSheet} className="w-full py-3 rounded-2xl text-sm font-semibold"
                style={{ border: '1px solid #E8EDF2', color: TEXT_MUTED }}>Cancelar</button>
            </>
          )}
        </div>
      )}

      {/* ══ ACCIÓN PRINCIPAL — 4 pasos ══ */}
      <div style={{ padding: '16px 16px 0' }}>

        {/* PASO 1 */}
        {pasoActual === 1 && (
          <div style={{ background: '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', marginBottom: 4 }}>
            <div style={{ padding: '22px 22px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>⛽</div>
              <p style={{ fontSize: 19, fontWeight: 700, color: NAVY, marginBottom: 6 }}>¡Vamos a ahorrar!</p>
              <p style={{ fontSize: 13, color: TEXT_MUTED, marginBottom: 22, lineHeight: 1.5 }}>
                Encuentra una gasolinera participante<br/>y obtén tu descuento hoy mismo.
              </p>
              <button className="btn-3d" onClick={() => { avanzarPaso(2); irATab && irATab('mapa') }}>
                <MapPin size={18} /> Ver estaciones
              </button>
            </div>
            <div style={{ padding: '12px 22px 16px', background: '#F8FAFC', borderTop: '1px solid #E8EDF2' }}>
              <p style={{ fontSize: 11, color: TEXT_MUTED, textAlign: 'center' }}>
                ¿Ya encontraste tu gasolinera?{' '}
                <button onClick={() => avanzarPaso(2)} style={{ color: GREEN, fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', fontSize: 11 }}>
                  Ir al paso 2 →
                </button>
              </p>
            </div>
          </div>
        )}

        {/* PASO 2 */}
        {pasoActual === 2 && (
          <div style={{ background: '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', marginBottom: 4 }}>
            <div style={{ background: 'linear-gradient(135deg, #0F2A4A, #1A3D6B)', padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ background: 'rgba(91,174,47,0.25)', border: '1px solid rgba(91,174,47,0.4)', borderRadius: 99, padding: '3px 10px', fontSize: 10, fontWeight: 700, color: '#8FCB4D', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Paso 2 de 3
              </span>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Muestra tu tarjeta al bombero</p>
            </div>
            <div style={{ padding: 14 }}>
              <div className="tarjeta-glow-wrap">
                <div className="tarjeta-glow-inner">
                  <TarjetaDigital cliente={perfil} />
                </div>
              </div>
            </div>
            <div style={{ margin: '0 14px 14px', padding: '12px 14px', background: 'rgba(91,174,47,0.07)', border: '1px solid rgba(91,174,47,0.2)', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 20 }}>💬</span>
              <p style={{ fontSize: 12, color: NAVY, fontWeight: 600, lineHeight: 1.4 }}>
                Muéstrale esta tarjeta al bombero <strong>antes</strong> de comenzar a cargar combustible.
              </p>
            </div>
            <div style={{ padding: '0 14px 18px' }}>
              <button className="btn-3d" onClick={() => { avanzarPaso(3); abrirSheet() }}>
                <Camera size={18} /> Ya cargué — Subir mi factura
              </button>
            </div>
          </div>
        )}

        {/* PASO 3 */}
        {pasoActual === 3 && (
          <div style={{ background: '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', marginBottom: 4 }}>
            <div style={{ padding: '22px 22px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📄</div>
              <p style={{ fontSize: 19, fontWeight: 700, color: NAVY, marginBottom: 6 }}>¿Ya cargaste combustible?</p>
              <p style={{ fontSize: 13, color: TEXT_MUTED, marginBottom: 22, lineHeight: 1.5 }}>
                Sube la foto de tu factura para registrar<br/>tu compra y ganar Enermonedas.
              </p>
              <button className="btn-3d" onClick={abrirSheet}>
                <Camera size={18} /> Subir mi factura
              </button>
            </div>
            <div style={{ padding: '12px 22px 16px', background: '#F8FAFC', borderTop: '1px solid #E8EDF2' }}>
              <p style={{ fontSize: 11, color: TEXT_MUTED, textAlign: 'center' }}>
                <button onClick={() => avanzarPaso(2)} style={{ color: TEXT_MUTED, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontSize: 11 }}>
                  ← Volver a la tarjeta
                </button>
              </p>
            </div>
          </div>
        )}

        {/* PASO 4 */}
        {pasoActual === 4 && (
          <div style={{ background: 'linear-gradient(135deg, #0F2A4A 0%, #1A3D6B 100%)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.12)', marginBottom: 4 }}>
            <div style={{ padding: '28px 22px', textAlign: 'center' }}>
              <div style={{ fontSize: 56, marginBottom: 14 }}>🎉</div>
              <p style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 8 }}>¡Listo!</p>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>Tu compra ya está registrada.</p>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(91,174,47,0.2)', border: '1px solid rgba(91,174,47,0.4)', borderRadius: 99, padding: '6px 16px', marginBottom: 22, fontSize: 13, fontWeight: 700, color: '#8FCB4D' }}>
                <Zap size={14} /> Enermonedas en camino
              </div>
              <button className="btn-3d" onClick={() => irATab && irATab('enermonedas')}>
                <Zap size={18} /> Ver mis Enermonedas
              </button>
              <button onClick={() => avanzarPaso(1)}
                style={{ marginTop: 12, width: '100%', padding: '12px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Nueva carga
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ══ CONTENIDO SECUNDARIO ══ */}
      <div style={{ padding: '20px 16px 0' }}>

        {/* Notificaciones */}
        {'Notification' in window && !notifActivadas && (
          <button onClick={activarNotificaciones} disabled={activandoNotif}
            className="w-full rounded-2xl py-3 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-70 mb-3"
            style={{ background: CARD, border: '1px solid ' + BORDER, color: NAVY }}>
            <Bell size={16} style={{ color: NAVY }} />
            {activandoNotif ? 'Activando...' : 'Activar notificaciones'}
          </button>
        )}

        {notificaciones.length > 0 && (
          <div className="rounded-2xl border overflow-hidden mb-4" style={{ borderColor: notifNoLeidas.length > 0 ? '#EF4444' : BORDER }}>
            <div className="px-4 py-3 flex items-center justify-between" style={{ background: notifNoLeidas.length > 0 ? '#FEF2F2' : '#F7F8FA' }}>
              <div className="flex items-center gap-2">
                <Bell size={14} style={{ color: notifNoLeidas.length > 0 ? '#EF4444' : TEXT_MUTED }} />
                <p className="text-xs font-semibold" style={{ color: notifNoLeidas.length > 0 ? '#EF4444' : NAVY }}>
                  Notificaciones {notifNoLeidas.length > 0 ? '(' + notifNoLeidas.length + ')' : ''}
                </p>
              </div>
              <button onClick={marcarTodasLeidas} className="text-xs font-semibold" style={{ color: '#EF4444' }}>Borrar todas</button>
            </div>
            <div className="divide-y" style={{ borderColor: BORDER }}>
              {notificaciones.map((n) => (
                <div key={n.id} className="px-4 py-3 flex items-start gap-3" style={{ background: n.leida ? CARD : '#FFF5F5' }}>
                  <div className="flex-1">
                    <p className="text-xs" style={{ color: n.leida ? TEXT_MUTED : NAVY }}>{n.mensaje}</p>
                    <p className="text-xs mt-1" style={{ color: '#9AA5AE' }}>{new Date(n.creado_en).toLocaleDateString('es-HN')}</p>
                  </div>
                  <button onClick={() => marcarLeida(n.id)} className="text-xs font-semibold flex-shrink-0 px-2 py-1 rounded" style={{ background: '#FEE2E2', color: '#EF4444' }}>Borrar</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Referidos */}
        {REFERIDOS_ACTIVO() && (
          <div className="rounded-2xl border p-4 mb-4" style={{ borderColor: GREEN + '50', background: GREEN + '0D' }}>
            <p className="text-xs font-bold mb-1" style={{ color: '#4A9123' }}>🎉 Programa de referidos — Vigente hasta el 15 de agosto</p>
            <p className="text-xs mb-3" style={{ color: TEXT_MUTED }}>Comparte tu código y gana 1 Enermoneda por cada amigo.</p>
            <div className="flex items-center gap-2 rounded-xl border px-3 py-2.5" style={{ borderColor: GREEN, background: CARD }}>
              <p className="font-mono text-sm font-bold flex-1" style={{ color: NAVY }}>{perfil.numero_tarjeta}</p>
              <button onClick={copiarCodigo} className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg"
                style={{ background: copiado ? GREEN : GREEN + '20', color: copiado ? '#fff' : GREEN }}>
                {copiado ? <><Check size={12} /> Copiado</> : <><Copy size={12} /> Copiar</>}
              </button>
            </div>
          </div>
        )}

        {/* Reporte */}
        <div className="mb-4">
          <p className="text-sm font-bold mb-3" style={{ color: NAVY }}>Mi reporte de consumo</p>
          <div className="rounded-2xl border p-4" style={{ borderColor: BORDER, background: CARD }}>
            <div className="flex gap-2">
              <button onClick={() => descargarReporte('semanal')} disabled={generandoReporte}
                className="flex-1 rounded-xl py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 text-white disabled:opacity-50" style={{ background: NAVY }}>
                <Download size={13} /> Esta semana
              </button>
              <button onClick={() => descargarReporte('mensual')} disabled={generandoReporte}
                className="flex-1 rounded-xl py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 text-white disabled:opacity-50" style={{ background: GREEN }}>
                <Download size={13} /> Este mes
              </button>
            </div>
          </div>
        </div>

        {/* Facturas */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold" style={{ color: NAVY }}>Mis facturas</p>
            {facturas.length > 3 && (
              <button onClick={() => setVerTodasFacturas(!verTodasFacturas)} className="text-xs font-semibold" style={{ color: GREEN }}>
                {verTodasFacturas ? 'Ver menos' : `Ver todas (${facturas.length})`}
              </button>
            )}
          </div>
          <div className="space-y-2">
            {facturas.length === 0 && <p className="text-sm" style={{ color: '#9AA5AE' }}>Aún no has subido facturas.</p>}
            {(verTodasFacturas ? facturas : facturas.slice(0, 3)).map((f) => {
              const s = ESTADO_STYLES[f.estado]
              const Icon = s.icon
              return (
                <div key={f.id} className="rounded-2xl border p-3" style={{ borderColor: f.estado === 'rechazada' ? '#FCA5A5' : BORDER, background: CARD }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm" style={{ color: NAVY }}>{f.galones ? f.galones + ' gal' : 'Sin galones'}</p>
                      <p className="text-xs" style={{ color: '#9AA5AE' }}>{new Date(f.creado_en).toLocaleDateString('es-HN')}</p>
                    </div>
                    <span className={'flex items-center gap-1 px-2 py-1 rounded-full text-xs ' + s.bg + ' ' + s.text}>
                      <Icon size={12} /> {s.label}
                    </span>
                  </div>
                  {f.estado === 'rechazada' && f.razon_rechazo && (
                    <div className="mt-2 rounded-xl px-3 py-2" style={{ background: '#FEF2F2' }}>
                      <p className="text-xs font-semibold mb-0.5" style={{ color: '#EF4444' }}>Razón del rechazo:</p>
                      <p className="text-xs" style={{ color: '#7F1D1D' }}>{f.razon_rechazo}</p>
                    </div>
                  )}
                </div>
              )
            })}
            {!verTodasFacturas && facturas.length > 3 && (
              <button onClick={() => setVerTodasFacturas(true)}
                className="w-full py-3 rounded-2xl text-sm font-semibold"
                style={{ background: '#F5F7FA', color: NAVY, border: '1px solid ' + BORDER }}>
                Ver todas las facturas ({facturas.length})
              </button>
            )}
          </div>
        </div>

        {/* Eliminar cuenta */}
        <div className="pt-4" style={{ borderTop: '1px solid #E8EDF2' }}>
          <button onClick={() => { setMostrarEliminarCuenta(true); setConfirmacionTexto('') }}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold"
            style={{ background: '#FEF2F2', color: '#EF4444', border: '1px solid #FCA5A5' }}>
            <Trash2 size={15} /> Eliminar mi cuenta
          </button>
          <p className="text-xs text-center mt-2" style={{ color: '#9AA5AE' }}>Esta acción es permanente y no se puede deshacer</p>
        </div>
      </div>

      {/* Modal eliminar cuenta */}
      {mostrarEliminarCuenta && (
        <div className="fixed inset-0 flex items-center justify-center z-50 px-6" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: '#fff' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#FEF2F2' }}>
                <Trash2 size={18} style={{ color: '#EF4444' }} />
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: NAVY }}>Eliminar cuenta</p>
                <p className="text-xs" style={{ color: TEXT_MUTED }}>Esta acción es permanente</p>
              </div>
            </div>
            <p className="text-xs mb-4" style={{ color: TEXT_MUTED }}>
              Se eliminarán todos tus datos incluyendo tu perfil, facturas, Enermonedas e historial.
            </p>
            <p className="text-xs font-semibold mb-2" style={{ color: NAVY }}>Escribe <span style={{ color: '#EF4444' }}>ELIMINAR</span> para confirmar:</p>
            <input type="text" value={confirmacionTexto} onChange={(e) => setConfirmacionTexto(e.target.value.toUpperCase())}
              placeholder="ELIMINAR"
              className="w-full rounded-xl border px-3 py-2.5 text-sm mb-4 focus:outline-none"
              style={{ borderColor: '#FCA5A5', color: NAVY }} />
            <button onClick={eliminarCuenta} disabled={confirmacionTexto !== 'ELIMINAR' || eliminandoCuenta}
              className="w-full rounded-xl py-3 text-sm font-bold text-white mb-2 disabled:opacity-40"
              style={{ background: '#EF4444' }}>
              {eliminandoCuenta ? 'Eliminando...' : 'Eliminar mi cuenta permanentemente'}
            </button>
            <button onClick={() => { setMostrarEliminarCuenta(false); setConfirmacionTexto('') }}
              className="w-full text-xs text-center py-2" style={{ color: TEXT_MUTED }}>
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
