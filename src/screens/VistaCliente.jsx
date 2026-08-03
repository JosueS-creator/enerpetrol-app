import React, { useState, useRef, useEffect } from 'react'
import { Upload, CheckCircle2, Clock, XCircle, Camera, Download, X, Copy, Check, Bell, Sparkles, AlertCircle } from 'lucide-react'
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
  { valor: 'malo', emoji: '😞', label: 'Malo', color: '#EF4444' },
  { valor: 'regular', emoji: '😐', label: 'Regular', color: '#F59E0B' },
  { valor: 'bueno', emoji: '😊', label: 'Bueno', color: '#3B82F6' },
  { valor: 'excelente', emoji: '🤩', label: 'Excelente', color: GREEN },
]

const REFERIDOS_ACTIVO = () => {
  const ahora = new Date()
  return ahora >= new Date('2026-07-01') && ahora <= new Date('2026-08-15T23:59:59')
}

const VAPID_PUBLIC_KEY = 'BOlOf_QAUrzqYvPTbWA0p-CHzn5TRP737H_It9-oVlJy91rV9rc6dj6_zpFg_cBBLXhlPVQ09Zg3ym7VlT_hiD8'

// Leer galones de la factura usando Claude OCR
async function leerGalonesDeFactura(archivoImagen) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = async (e) => {
      const base64 = e.target.result.split(',')[1]
      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'claude-sonnet-4-6',
            max_tokens: 200,
            messages: [{
              role: 'user',
              content: [
                {
                  type: 'image',
                  source: { type: 'base64', media_type: 'image/jpeg', data: base64 }
                },
                {
                  type: 'text',
                  text: 'Esta es una factura de una gasolinera de Honduras. Encuentra la cantidad de combustible vendido. Puede estar en litros o galones. Si está en litros, convierte a galones dividiendo entre 3.785. Responde ÚNICAMENTE con un número decimal con 2 decimales, por ejemplo: 15.50. Si no puedes determinar la cantidad, responde: null'
                }
              ]
            }]
          })
        })
        const data = await response.json()
        const texto = data.content?.[0]?.text?.trim()
        if (!texto || texto === 'null') {
          resolve(null)
        } else {
          const numero = parseFloat(texto)
          resolve(isNaN(numero) ? null : numero.toFixed(2))
        }
      } catch (e) {
        resolve(null)
      }
    }
    reader.readAsDataURL(archivoImagen)
  })
}

export default function VistaCliente({ usuario }) {
  const [perfil, setPerfil] = useState(null)
  const [facturas, setFacturas] = useState([])
  const [estaciones, setEstaciones] = useState([])
  const [notificaciones, setNotificaciones] = useState([])
  const [cargando, setCargando] = useState(true)
  const [galones, setGalones] = useState('')
  const [archivo, setArchivo] = useState(null)
  const [archivoPreview, setArchivoPreview] = useState(null)
  const [estacionSeleccionada, setEstacionSeleccionada] = useState('')
  const [subiendo, setSubiendo] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [generandoReporte, setGenerandoReporte] = useState(false)
  const [mostrarCalificacion, setMostrarCalificacion] = useState(false)
  const [facturaRecienSubida, setFacturaRecienSubida] = useState(null)
  const [calificacion, setCalificacion] = useState(null)
  const [comentario, setComentario] = useState('')
  const [enviandoCalificacion, setEnviandoCalificacion] = useState(false)
  const [copiado, setCopiado] = useState(false)
  const [notifActivadas, setNotifActivadas] = useState(false)
  const [activandoNotif, setActivandoNotif] = useState(false)
  const [leyendoOCR, setLeyendoOCR] = useState(false)
  const [ocrResultado, setOcrResultado] = useState(null) // 'exito' | 'manual' | null
  const fileRef = useRef(null)
  const camaraRef = useRef(null)

  async function cargarDatos() {
    const { data: perfilData } = await supabase.from('perfiles').select('*').eq('id', usuario.id).single()
    setPerfil(perfilData)
    const { data: facturasData } = await supabase.from('facturas').select('*').eq('cliente_id', usuario.id).order('creado_en', { ascending: false })
    setFacturas(facturasData || [])
    const { data: estacionesData } = await supabase.from('estaciones').select('id, nombre, ciudad').eq('activa', true).eq('ciudad', perfilData?.ciudad || 'Tegucigalpa').order('nombre')
    setEstaciones(estacionesData || [])
    const { data: notifData } = await supabase.from('notificaciones').select('*').eq('usuario_id', usuario.id).order('creado_en', { ascending: false })
    setNotificaciones(notifData || [])
    try {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        const registro = await navigator.serviceWorker.ready
        const suscripcionExistente = await registro.pushManager.getSubscription()
        setNotifActivadas(!!suscripcionExistente)
      }
    } catch (e) {}
    setCargando(false)
  }

  useEffect(() => { cargarDatos() }, [usuario.id])

  async function activarNotificaciones() {
    setActivandoNotif(true)
    try {
      const permiso = await Notification.requestPermission()
      if (permiso !== 'granted') { setActivandoNotif(false); return }
      const registro = await navigator.serviceWorker.ready
      const suscripcion = await registro.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: VAPID_PUBLIC_KEY })
      const { endpoint, keys } = suscripcion.toJSON()
      await supabase.from('push_subscriptions').upsert({ usuario_id: usuario.id, endpoint, p256dh: keys.p256dh, auth: keys.auth }, { onConflict: 'usuario_id,endpoint' })
      setNotifActivadas(true)
    } catch (e) {}
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
    setGalones('')
    setOcrResultado(null)
    const reader = new FileReader()
    reader.onload = (event) => {
      setArchivoPreview(event.target.result)
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const maxSize = 1200
        let width = img.width, height = img.height
        if (width > height) { if (width > maxSize) { height = (height * maxSize) / width; width = maxSize } }
        else { if (height > maxSize) { width = (width * maxSize) / height; height = maxSize } }
        canvas.width = width; canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        canvas.toBlob(async (blob) => {
          const nombreLimpio = f.name.replace(/\.heic$/i, '.jpg').replace(/\.heif$/i, '.jpg').replace(/[^a-zA-Z0-9._-]/g, '_')
          const archivoComprimido = new File([blob], nombreLimpio, { type: 'image/jpeg' })
          setArchivo(archivoComprimido)
          // OCR automático
          setLeyendoOCR(true)
          const galonesDetectados = await leerGalonesDeFactura(archivoComprimido)
          setLeyendoOCR(false)
          if (galonesDetectados) {
            setGalones(String(galonesDetectados))
            setOcrResultado('exito')
          } else {
            setOcrResultado('manual')
          }
        }, 'image/jpeg', 0.7)
      }
      img.src = event.target.result
    }
    reader.readAsDataURL(f)
  }

  function copiarCodigo() {
    if (!perfil?.numero_tarjeta) return
    navigator.clipboard.writeText(perfil.numero_tarjeta).then(() => { setCopiado(true); setTimeout(() => setCopiado(false), 2000) })
  }

  async function verificarYPremiarReferido(esLaPrimeraFactura) {
    if (!esLaPrimeraFactura || !REFERIDOS_ACTIVO()) return
    const { data: referido } = await supabase.from('referidos').select('*').eq('referido_id', usuario.id).eq('punto_otorgado', false).single()
    if (!referido) return
    const { data: perfilReferidor } = await supabase.from('perfiles').select('galones_acumulados').eq('id', referido.referidor_id).single()
    if (perfilReferidor) {
      await supabase.from('perfiles').update({ galones_acumulados: (perfilReferidor.galones_acumulados || 0) + 1 }).eq('id', referido.referidor_id)
      await supabase.from('referidos').update({ punto_otorgado: true }).eq('id', referido.id)
    }
  }

  async function handleEnviar() {
    if (!archivo) return
    setSubiendo(true)
    const esLaPrimeraFactura = facturas.length === 0
    const nombreArchivo = usuario.id + '/' + Date.now() + '_' + archivo.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const { error: errorSubida } = await supabase.storage.from('Facturas').upload(nombreArchivo, archivo)
    let imagenUrl = null
    if (!errorSubida) {
      const { data: urlData } = supabase.storage.from('Facturas').getPublicUrl(nombreArchivo)
      imagenUrl = urlData.publicUrl
    }
    const { data: facturaData, error: errorFactura } = await supabase.from('facturas').insert({
      cliente_id: usuario.id,
      estacion_id: estacionSeleccionada ? parseInt(estacionSeleccionada) : null,
      galones: galones ? parseFloat(galones) : null,
      imagen_url: imagenUrl,
      estado: 'pendiente',
    }).select().single()
    if (!errorFactura) {
      await verificarYPremiarReferido(esLaPrimeraFactura)
      setGalones(''); setArchivo(null); setArchivoPreview(null)
      setEstacionSeleccionada(''); setOcrResultado(null)
      setEnviado(true); setTimeout(() => setEnviado(false), 2500)
      setFacturaRecienSubida(facturaData); setMostrarCalificacion(true)
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
      const diaSemana = ahora.getDay()
      inicio = new Date(ahora); inicio.setDate(ahora.getDate() - diaSemana); inicio.setHours(0, 0, 0, 0)
      fin = new Date(inicio); fin.setDate(inicio.getDate() + 7)
      etiqueta = 'Semana_' + inicio.toLocaleDateString('es-HN').replace(/\//g, '-')
    } else {
      inicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1)
      fin = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 1)
      etiqueta = MESES[ahora.getMonth()] + '_' + ahora.getFullYear()
    }
    const { data: lista } = await supabase.from('facturas').select('*').eq('cliente_id', usuario.id).gte('creado_en', inicio.toISOString()).lt('creado_en', fin.toISOString()).order('creado_en', { ascending: true })
    setGenerandoReporte(false)
    const facturasPeriodo = lista || []
    const aprobadas = facturasPeriodo.filter((f) => f.estado === 'aprobada')
    const totalGalones = aprobadas.reduce((acc, f) => acc + (Number(f.galones) || 0), 0)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
      ['Mi reporte - Enerpetrol'], ['Periodo', etiqueta.replace(/_/g, ' ')], [],
      ['Total facturas', facturasPeriodo.length], ['Aprobadas', aprobadas.length],
      ['Total galones', totalGalones], ['Enermonedas', Math.floor(totalGalones)],
    ]), 'Resumen')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
      ['Fecha', 'Galones', 'Estado'],
      ...facturasPeriodo.map((f) => [new Date(f.creado_en).toLocaleDateString('es-HN'), f.galones ? Number(f.galones) : 'No indicado', f.estado]),
    ]), 'Facturas')
    XLSX.writeFile(wb, 'Enerpetrol_MiConsumo_' + etiqueta + '.xlsx')
  }

  if (cargando || !perfil) {
    return <div className="px-5 pt-6 text-sm" style={{ color: TEXT_MUTED }}>Cargando tu cuenta...</div>
  }

  const negativa = calificacion === 'malo' || calificacion === 'regular'
  const puedeEnviarCalificacion = calificacion && (!negativa || comentario.trim())
  const notifNoLeidas = notificaciones.filter((n) => !n.leida)

  return (
    <div className="px-5 pt-4 pb-6">

      {mostrarCalificacion && (
        <div className="fixed inset-0 flex items-center justify-center z-50 px-6" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: CARD }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold" style={{ color: NAVY }}>Como fue la atencion?</h3>
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
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: '#EF4444' }}>Cuentanos que paso (obligatorio)</label>
                <textarea value={comentario} onChange={(e) => setComentario(e.target.value)} placeholder="Describe tu experiencia..." rows={3}
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none resize-none" style={{ borderColor: '#EF4444', color: NAVY }} />
              </div>
            )}
            {calificacion && !negativa && (
              <div className="mb-4">
                <label className="text-xs mb-1.5 block" style={{ color: TEXT_MUTED }}>Comentario adicional (opcional)</label>
                <textarea value={comentario} onChange={(e) => setComentario(e.target.value)} placeholder="Algo mas..." rows={2}
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none resize-none" style={{ borderColor: BORDER, color: NAVY }} />
              </div>
            )}
            <button onClick={enviarCalificacion} disabled={!puedeEnviarCalificacion || enviandoCalificacion}
              className="w-full rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-40" style={{ background: GREEN }}>
              {enviandoCalificacion ? 'Enviando...' : 'Enviar calificacion'}
            </button>
            <button onClick={() => setMostrarCalificacion(false)} className="w-full text-xs text-center mt-3" style={{ color: TEXT_MUTED }}>Omitir</button>
          </div>
        </div>
      )}

      {/* Tarjeta digital */}
      <TarjetaDigital cliente={perfil} />

      {/* Notificaciones */}
      {'Notification' in window && (
        <button onClick={activarNotificaciones} disabled={notifActivadas || activandoNotif}
          className="mt-4 w-full rounded-2xl py-3 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-70"
          style={{ background: notifActivadas ? GREEN + '15' : CARD, border: '1px solid ' + (notifActivadas ? GREEN : BORDER), color: notifActivadas ? GREEN : NAVY }}>
          <Bell size={16} style={{ color: notifActivadas ? GREEN : NAVY }} />
          {activandoNotif ? 'Activando...' : notifActivadas ? '✓ Notificaciones activadas' : 'Activar notificaciones'}
        </button>
      )}

      {notificaciones.length > 0 && (
        <div className="mt-4 rounded-2xl border overflow-hidden" style={{ borderColor: notifNoLeidas.length > 0 ? '#EF4444' : BORDER }}>
          <div className="px-4 py-3 flex items-center justify-between"
            style={{ background: notifNoLeidas.length > 0 ? '#FEF2F2' : '#F7F8FA' }}>
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
                <button onClick={() => marcarLeida(n.id)}
                  className="text-xs font-semibold flex-shrink-0 px-2 py-1 rounded" style={{ background: '#FEE2E2', color: '#EF4444' }}>
                  Borrar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Referidos */}
      {REFERIDOS_ACTIVO() && (
        <div className="mt-4 rounded-2xl border p-4" style={{ borderColor: GREEN + '50', background: GREEN + '0D' }}>
          <p className="text-xs font-bold mb-1" style={{ color: '#4A9123' }}>🎉 Programa de referidos — Vigente hasta el 15 de agosto</p>
          <p className="text-xs mb-3" style={{ color: TEXT_MUTED }}>Comparte tu codigo y gana 1 Enermoneda por cada amigo.</p>
          <div className="flex items-center gap-2 rounded-xl border px-3 py-2.5" style={{ borderColor: GREEN, background: CARD }}>
            <p className="font-mono text-sm font-bold flex-1" style={{ color: NAVY }}>{perfil.numero_tarjeta}</p>
            <button onClick={copiarCodigo} className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg"
              style={{ background: copiado ? GREEN : GREEN + '20', color: copiado ? '#fff' : GREEN }}>
              {copiado ? <><Check size={12} /> Copiado</> : <><Copy size={12} /> Copiar</>}
            </button>
          </div>
        </div>
      )}

      {/* Subir factura con OCR */}
      <div className="mt-6">
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-sm font-bold" style={{ color: NAVY }}>Subir factura</h3>
          <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ background: GREEN + '15', color: GREEN }}>
            <Sparkles size={10} /> Lectura automatica
          </span>
        </div>

        <div className="rounded-2xl border border-dashed p-4" style={{ borderColor: '#C7CFD6', background: CARD }}>
          <input ref={camaraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleArchivo} />
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleArchivo} />

          {/* Botones de cámara/galería */}
          <div className="flex gap-2 mb-3">
            <button onClick={() => camaraRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl border py-3 text-sm"
              style={{ borderColor: BORDER, background: '#F7F8FA', color: '#274463' }}>
              <Camera size={16} style={{ color: GREEN }} /> Camara
            </button>
            <button onClick={() => fileRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl border py-3 text-sm"
              style={{ borderColor: BORDER, background: '#F7F8FA', color: '#274463' }}>
              <Upload size={16} style={{ color: GREEN }} /> Galeria
            </button>
          </div>

          {/* Preview de imagen */}
          {archivoPreview && (
            <div className="mb-3 rounded-xl overflow-hidden relative"
              style={{ border: '1px solid ' + BORDER }}>
              <img src={archivoPreview} alt="Factura" className="w-full object-contain"
                style={{ maxHeight: 160 }} />
              <button onClick={() => { setArchivo(null); setArchivoPreview(null); setGalones(''); setOcrResultado(null) }}
                className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(0,0,0,0.5)' }}>
                <X size={12} className="text-white" />
              </button>
            </div>
          )}

          {/* Estado OCR */}
          {leyendoOCR && (
            <div className="rounded-xl p-3 mb-3 flex items-center gap-2"
              style={{ background: GREEN + '10', border: '1px solid ' + GREEN + '30' }}>
              <div className="w-4 h-4 rounded-full border-2 animate-spin flex-shrink-0"
                style={{ borderColor: GREEN, borderTopColor: 'transparent' }} />
              <p className="text-xs font-semibold" style={{ color: GREEN }}>Leyendo factura automaticamente...</p>
            </div>
          )}

          {ocrResultado === 'exito' && !leyendoOCR && (
            <div className="rounded-xl p-3 mb-3 flex items-center gap-2"
              style={{ background: GREEN + '10', border: '1px solid ' + GREEN + '30' }}>
              <CheckCircle2 size={16} style={{ color: GREEN, flexShrink: 0 }} />
              <div className="flex-1">
                <p className="text-xs font-bold" style={{ color: GREEN }}>Galones detectados automaticamente</p>
                <p className="text-xs" style={{ color: TEXT_MUTED }}>Verifica el valor antes de enviar</p>
              </div>
            </div>
          )}

          {ocrResultado === 'manual' && !leyendoOCR && (
            <div className="rounded-xl p-3 mb-3 flex items-center gap-2"
              style={{ background: '#FEF9C3', border: '1px solid #FDE047' }}>
              <AlertCircle size={16} style={{ color: '#854D0E', flexShrink: 0 }} />
              <div className="flex-1">
                <p className="text-xs font-bold" style={{ color: '#854D0E' }}>No se pudo leer la cantidad</p>
                <p className="text-xs" style={{ color: '#A16207' }}>Ingresa los galones manualmente</p>
              </div>
            </div>
          )}

          {/* Gasolinera */}
          <label className="text-xs mb-1.5 block" style={{ color: TEXT_MUTED }}>Gasolinera donde cargaste</label>
          <select value={estacionSeleccionada} onChange={(e) => setEstacionSeleccionada(e.target.value)}
            className="w-full rounded-xl border px-3 py-2.5 text-sm mb-3 focus:outline-none"
            style={{ borderColor: BORDER, color: estacionSeleccionada ? NAVY : '#9AA5AE', background: '#FFFFFF' }}>
            <option value="">Selecciona la gasolinera (opcional)</option>
            {estaciones.map((e) => <option key={e.id} value={e.id}>{e.nombre} — {e.ciudad}</option>)}
          </select>

          {/* Galones — siempre editable */}
          <label className="text-xs mb-1.5 block" style={{ color: TEXT_MUTED }}>
            Galones {ocrResultado === 'exito' ? '(detectados — puedes corregir)' : ''}
          </label>
          <input type="number" value={galones} onChange={(e) => setGalones(e.target.value)}
            placeholder="Ej. 20.50"
            className="w-full rounded-xl border px-3 py-2.5 text-sm mb-3 focus:outline-none"
            style={{
              borderColor: ocrResultado === 'exito' ? GREEN : BORDER,
              color: NAVY,
              background: ocrResultado === 'exito' ? GREEN + '08' : '#FFFFFF',
              fontWeight: ocrResultado === 'exito' ? '700' : '400',
            }} />

          <button onClick={handleEnviar} disabled={!archivo || subiendo || leyendoOCR}
            className="w-full rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-1.5 disabled:opacity-40 text-white"
            style={{ background: GREEN }}>
            <Upload size={15} />
            {subiendo ? 'Subiendo...' : leyendoOCR ? 'Leyendo factura...' : 'Enviar para revision'}
          </button>

          {enviado && (
            <p className="text-xs text-center mt-2.5" style={{ color: '#4A9123' }}>
              ✅ Factura enviada. Sera revisada por el administrador.
            </p>
          )}
        </div>
      </div>

      {/* Reporte */}
      <div className="mt-6">
        <h3 className="text-sm font-bold mb-3" style={{ color: NAVY }}>Mi reporte de consumo</h3>
        <div className="rounded-2xl border p-4" style={{ borderColor: BORDER, background: CARD }}>
          <div className="flex gap-2">
            <button onClick={() => descargarReporte('semanal')} disabled={generandoReporte}
              className="flex-1 rounded-xl py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 text-white disabled:opacity-50"
              style={{ background: NAVY }}>
              <Download size={13} /> Esta semana
            </button>
            <button onClick={() => descargarReporte('mensual')} disabled={generandoReporte}
              className="flex-1 rounded-xl py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 text-white disabled:opacity-50"
              style={{ background: GREEN }}>
              <Download size={13} /> Este mes
            </button>
          </div>
        </div>
      </div>

      {/* Facturas */}
      <div className="mt-6">
        <h3 className="text-sm font-bold mb-3" style={{ color: NAVY }}>Mis facturas</h3>
        <div className="space-y-2">
          {facturas.length === 0 && <p className="text-sm" style={{ color: '#9AA5AE' }}>Aun no has subido facturas.</p>}
          {facturas.map((f) => {
            const s = ESTADO_STYLES[f.estado]
            const Icon = s.icon
            return (
              <div key={f.id} className="rounded-2xl border p-3"
                style={{ borderColor: f.estado === 'rechazada' ? '#FCA5A5' : BORDER, background: CARD }}>
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
                    <p className="text-xs font-semibold mb-0.5" style={{ color: '#EF4444' }}>Razon del rechazo:</p>
                    <p className="text-xs" style={{ color: '#7F1D1D' }}>{f.razon_rechazo}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
