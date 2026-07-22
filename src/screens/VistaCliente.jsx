import React, { useState, useRef, useEffect } from 'react'
import { Upload, CheckCircle2, Clock, XCircle, Camera, PartyPopper, Download, X, Gift, Copy, Check, Bell, Sparkles } from 'lucide-react'
import * as XLSX from 'xlsx'
import { supabase } from '../supabaseClient'
import TarjetaDigital from '../components/TarjetaDigital'
import Medidor from '../components/Medidor'
import { NAVY, GREEN, GREEN_LIGHT, BORDER, CARD, TEXT_MUTED, UMBRAL_PUNTOS_CANJE } from '../theme'
import iconoEnermonedas from '../assets/icono-enermoneda.png'

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

const PREMIOS_CANJE = [
  { enermonedas: 67, descripcion: 'Descuento L 10', emoji: '🎁' },
  { enermonedas: 134, descripcion: 'Descuento L 20', emoji: '🎁' },
  { enermonedas: 267, descripcion: 'Recarga L 40', emoji: '⚡' },
  { enermonedas: 334, descripcion: 'Descuento L 50', emoji: '🎁' },
  { enermonedas: 667, descripcion: 'Premio L 100', emoji: '🏆' },
]

const REFERIDOS_ACTIVO = () => {
  const ahora = new Date()
  return ahora >= new Date('2026-07-01') && ahora <= new Date('2026-08-15T23:59:59')
}

export default function VistaCliente({ usuario }) {
  const [perfil, setPerfil] = useState(null)
  const [facturas, setFacturas] = useState([])
  const [estaciones, setEstaciones] = useState([])
  const [premios, setPremios] = useState([])
  const [notificaciones, setNotificaciones] = useState([])
  const [canjes, setCanjes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [galones, setGalones] = useState('')
  const [archivo, setArchivo] = useState(null)
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
  const [mostrarCanje, setMostrarCanje] = useState(false)
  const [premioSeleccionado, setPremioSeleccionado] = useState(null)
  const [canjeando, setCanjeando] = useState(false)
  const [notificacionUmbral, setNotificacionUmbral] = useState(null)
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

    const { data: estacionesData } = await supabase
      .from('estaciones')
      .select('id, nombre, ciudad')
      .eq('activa', true)
      .eq('ciudad', perfilData?.ciudad || 'Tegucigalpa')
      .order('nombre')
    setEstaciones(estacionesData || [])

    const { data: premiosData } = await supabase
      .from('premios')
      .select('*')
      .eq('activo', true)
      .order('orden')
    setPremios(premiosData || [])

    const { data: notifData } = await supabase
      .from('notificaciones')
      .select('*')
      .eq('usuario_id', usuario.id)
      .order('creado_en', { ascending: false })
    setNotificaciones(notifData || [])

    const { data: canjesData } = await supabase
      .from('canjes')
      .select('*')
      .eq('cliente_id', usuario.id)
      .order('creado_en', { ascending: false })
    setCanjes(canjesData || [])

    // Verificar si alcanzó un umbral nuevo
    const em = Math.floor(perfilData?.galones_acumulados || 0)
    const umbrales = [67, 134, 267, 334, 667]
    const umbralAlcanzado = umbrales.find((u) => em >= u)
    if (umbralAlcanzado) {
      const keyVisto = 'enerpetrol_umbral_' + umbralAlcanzado + '_' + usuario.id
      if (!localStorage.getItem(keyVisto)) {
        localStorage.setItem(keyVisto, 'true')
        const premio = PREMIOS_CANJE.find((p) => p.enermonedas === umbralAlcanzado)
        setNotificacionUmbral(premio)
        setTimeout(() => setNotificacionUmbral(null), 5000)
      }
    }

    setCargando(false)
  }

  useEffect(() => {
    cargarDatos()
  }, [usuario.id])

  async function marcarLeida(id) {
    await supabase.from('notificaciones').update({ leida: true }).eq('id', id)
    setNotificaciones((prev) => prev.map((n) => n.id === id ? { ...n, leida: true } : n))
  }

  async function marcarTodasLeidas() {
    await supabase.from('notificaciones').update({ leida: true }).eq('usuario_id', usuario.id).eq('leida', false)
    setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })))
  }

  function handleArchivo(e) {
    const f = e.target.files?.[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const maxSize = 1200
        let width = img.width
        let height = img.height
        if (width > height) {
          if (width > maxSize) { height = (height * maxSize) / width; width = maxSize }
        } else {
          if (height > maxSize) { width = (width * maxSize) / height; height = maxSize }
        }
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        canvas.toBlob((blob) => {
          const nombreLimpio = f.name
            .replace(/\.heic$/i, '.jpg')
            .replace(/\.heif$/i, '.jpg')
            .replace(/[^a-zA-Z0-9._-]/g, '_')
          const archivoComprimido = new File([blob], nombreLimpio, { type: 'image/jpeg' })
          setArchivo(archivoComprimido)
        }, 'image/jpeg', 0.7)
      }
      img.src = event.target.result
    }
    reader.readAsDataURL(f)
  }

  function copiarCodigo() {
    if (!perfil?.numero_tarjeta) return
    navigator.clipboard.writeText(perfil.numero_tarjeta).then(() => {
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    })
  }

  async function verificarYPremiarReferido(esLaPrimeraFactura) {
    if (!esLaPrimeraFactura || !REFERIDOS_ACTIVO()) return
    const { data: referido } = await supabase
      .from('referidos')
      .select('*')
      .eq('referido_id', usuario.id)
      .eq('punto_otorgado', false)
      .single()
    if (!referido) return
    const { data: perfilReferidor } = await supabase
      .from('perfiles')
      .select('galones_acumulados')
      .eq('id', referido.referidor_id)
      .single()
    if (perfilReferidor) {
      await supabase.from('perfiles').update({
        galones_acumulados: (perfilReferidor.galones_acumulados || 0) + 1
      }).eq('id', referido.referidor_id)
      await supabase.from('referidos').update({ punto_otorgado: true }).eq('id', referido.id)
    }
  }

  async function handleEnviar() {
    if (!archivo) return
    setSubiendo(true)
    const esLaPrimeraFactura = facturas.length === 0
    const nombreLimpio = archivo.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const nombreArchivo = `${usuario.id}/${Date.now()}_${nombreLimpio}`
    const { error: errorSubida } = await supabase.storage.from('Facturas').upload(nombreArchivo, archivo)
    let imagenUrl = null
    if (!errorSubida) {
      const { data: urlData } = supabase.storage.from('Facturas').getPublicUrl(nombreArchivo)
      imagenUrl = urlData.publicUrl
    }
    const { data: facturaData, error: errorFactura } = await supabase
      .from('facturas')
      .insert({
        cliente_id: usuario.id,
        estacion_id: estacionSeleccionada ? parseInt(estacionSeleccionada) : null,
        galones: galones ? parseFloat(galones) : null,
        imagen_url: imagenUrl,
        estado: 'pendiente',
      })
      .select()
      .single()
    if (!errorFactura) {
      await verificarYPremiarReferido(esLaPrimeraFactura)
      setGalones('')
      setArchivo(null)
      setEstacionSeleccionada('')
      setEnviado(true)
      setTimeout(() => setEnviado(false), 2500)
      setFacturaRecienSubida(facturaData)
      setMostrarCalificacion(true)
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
      calificacion,
      comentario: comentario.trim() || null,
    })
    setEnviandoCalificacion(false)
    setMostrarCalificacion(false)
    setCalificacion(null)
    setComentario('')
    setFacturaRecienSubida(null)
  }

  async function confirmarCanje() {
    if (!premioSeleccionado || canjeando) return
    setCanjeando(true)
    const em = Math.floor(perfil.galones_acumulados)
    if (em < premioSeleccionado.enermonedas) {
      setCanjeando(false)
      return
    }
    const nuevoTotal = perfil.galones_acumulados - premioSeleccionado.enermonedas
    await supabase.from('perfiles').update({ galones_acumulados: nuevoTotal }).eq('id', usuario.id)
    await supabase.from('canjes').insert({
      cliente_id: usuario.id,
      enermonedas: premioSeleccionado.enermonedas,
      descripcion: premioSeleccionado.descripcion,
      estado: 'pendiente',
    })
    await supabase.from('notificaciones').insert({
      usuario_id: usuario.id,
      mensaje: '🎉 Canje exitoso! Solicitaste ' + premioSeleccionado.descripcion + ' por ' + premioSeleccionado.enermonedas + ' EM. Acercate a tu gasolinera para recibir tu cupon.',
    })
    setCanjeando(false)
    setMostrarCanje(false)
    setPremioSeleccionado(null)
    cargarDatos()
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
      ['Enermonedas acumuladas en el periodo', Math.floor(totalGalones)],
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
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(resumen), 'Resumen')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(detalle), 'Mis facturas')
    XLSX.writeFile(wb, `Enerpetrol_MiConsumo_${etiqueta}.xlsx`)
  }

  if (cargando || !perfil) {
    return <div className="px-5 pt-6 text-sm" style={{ color: TEXT_MUTED }}>Cargando tu cuenta...</div>
  }

  const negativa = calificacion === 'malo' || calificacion === 'regular'
  const puedeEnviarCalificacion = calificacion && (!negativa || comentario.trim())
  const enermonedas = Math.floor(perfil.galones_acumulados)
  const siguientePremio = premios.find((p) => p.enermonedas_requeridas > enermonedas)
  const notifNoLeidas = notificaciones.filter((n) => !n.leida)
  const premiosDisponibles = PREMIOS_CANJE.filter((p) => enermonedas >= p.enermonedas)
  const canjesPendientes = canjes.filter((c) => c.estado === 'pendiente')
  const tieneCanjePendiente = canjesPendientes.length > 0

  return (
    <div className="px-5 pt-2 pb-6">

      {/* Notificación vistosa de umbral alcanzado */}
      {notificacionUmbral && (
        <div className="fixed inset-x-4 top-4 z-50 rounded-2xl p-4 text-center"
          style={{
            background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
            boxShadow: '0 8px 32px rgba(255,165,0,0.5)',
            animation: 'slideDown 0.4s ease-out',
          }}>
          <p style={{ fontSize: 36 }}>{notificacionUmbral.emoji}</p>
          <p className="text-white font-bold text-base mt-1">Nuevo premio desbloqueado!</p>
          <p className="text-white/90 text-sm">{notificacionUmbral.descripcion} — {notificacionUmbral.enermonedas} EM</p>
          <button onClick={() => setNotificacionUmbral(null)} className="mt-2 text-white/70 text-xs">Cerrar</button>
          <style>{`
            @keyframes slideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
          `}</style>
        </div>
      )}

      {/* Modal de canje */}
      {mostrarCanje && (
        <div className="fixed inset-0 flex items-end justify-center z-50 px-4 pb-6"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={() => { setMostrarCanje(false); setPremioSeleccionado(null) }}>
          <div className="w-full max-w-sm rounded-2xl overflow-hidden card-3d"
            style={{ background: CARD }}
            onClick={(e) => e.stopPropagation()}>
            <div className="px-5 pt-5 pb-4" style={{ background: 'linear-gradient(135deg, #0F2A4A 0%, #1A3D6B 100%)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-bold text-base">Canjear Enermonedas</p>
                  <p className="text-xs mt-0.5" style={{ color: '#8FCB4D' }}>Tienes {enermonedas} EM disponibles</p>
                </div>
                <button onClick={() => { setMostrarCanje(false); setPremioSeleccionado(null) }}
                  className="w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.15)' }}>
                  <X size={15} className="text-white" />
                </button>
              </div>
            </div>

            <div className="px-5 py-4">
              {tieneCanjePendiente && (
                <div className="rounded-xl p-3 mb-4 text-center" style={{ background: '#FEF9C3', border: '1px solid #FDE047' }}>
                  <p className="text-xs font-semibold" style={{ color: '#854D0E' }}>
                    ⏳ Ya tienes un canje pendiente. Acercate a tu gasolinera para recogerlo.
                  </p>
                </div>
              )}

              {!tieneCanjePendiente && (
                <>
                  <p className="text-xs mb-3" style={{ color: TEXT_MUTED }}>Selecciona el premio que deseas canjear:</p>
                  <div className="space-y-2 mb-4">
                    {PREMIOS_CANJE.map((p) => {
                      const disponible = enermonedas >= p.enermonedas
                      const seleccionado = premioSeleccionado?.enermonedas === p.enermonedas
                      return (
                        <button key={p.enermonedas}
                          onClick={() => disponible && setPremioSeleccionado(p)}
                          disabled={!disponible}
                          className="w-full rounded-xl p-3 flex items-center gap-3 border transition-all btn-3d disabled:opacity-40"
                          style={{
                            borderColor: seleccionado ? GREEN : BORDER,
                            background: seleccionado ? `${GREEN}15` : CARD,
                          }}>
                          <span style={{ fontSize: 24 }}>{p.emoji}</span>
                          <div className="flex-1 text-left">
                            <p className="text-sm font-semibold" style={{ color: disponible ? NAVY : TEXT_MUTED }}>{p.descripcion}</p>
                            <p className="text-xs" style={{ color: disponible ? GREEN : TEXT_MUTED }}>{p.enermonedas} EM requeridas</p>
                          </div>
                          {seleccionado && (
                            <CheckCircle2 size={18} style={{ color: GREEN }} />
                          )}
                          {!disponible && (
                            <span className="text-[10px]" style={{ color: TEXT_MUTED }}>
                              Faltan {p.enermonedas - enermonedas} EM
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>

                  {premioSeleccionado && (
                    <div className="rounded-xl p-3 mb-4" style={{ background: `${GREEN}10`, border: `1px solid ${GREEN}40` }}>
                      <p className="text-xs text-center" style={{ color: '#4A9123' }}>
                        Se descontaran <span className="font-bold">{premioSeleccionado.enermonedas} EM</span> de tu cuenta.
                        Te quedaran <span className="font-bold">{enermonedas - premioSeleccionado.enermonedas} EM</span>.
                      </p>
                    </div>
                  )}

                  <button onClick={confirmarCanje}
                    disabled={!premioSeleccionado || canjeando}
                    className="w-full rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-40 btn-green-3d"
                    style={{ background: GREEN }}>
                    {canjeando ? 'Procesando...' : 'Confirmar canje'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {mostrarCalificacion && (
        <div className="fixed inset-0 flex items-center justify-center z-50 px-6"
          style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="w-full max-w-sm rounded-2xl p-6 card-3d" style={{ background: CARD }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold" style={{ color: NAVY }}>Como fue la atencion?</h3>
              <button onClick={() => setMostrarCalificacion(false)}>
                <X size={18} style={{ color: TEXT_MUTED }} />
              </button>
            </div>
            <p className="text-xs mb-4" style={{ color: TEXT_MUTED }}>Califica la atencion recibida en la gasolinera</p>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {CARAS.map((c) => (
                <button key={c.valor} onClick={() => setCalificacion(c.valor)}
                  className="flex flex-col items-center gap-1 rounded-xl py-3 border transition-all btn-3d"
                  style={{ borderColor: calificacion === c.valor ? c.color : BORDER, background: calificacion === c.valor ? c.color + '18' : '#F7F8FA' }}>
                  <span style={{ fontSize: 28 }}>{c.emoji}</span>
                  <span className="text-[10px] font-semibold" style={{ color: calificacion === c.valor ? c.color : TEXT_MUTED }}>{c.label}</span>
                </button>
              ))}
            </div>
            {negativa && (
              <div className="mb-4">
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: '#EF4444' }}>Cuentanos que paso (obligatorio)</label>
                <textarea value={comentario} onChange={(e) => setComentario(e.target.value)}
                  placeholder="Describe tu experiencia..." rows={3}
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none resize-none"
                  style={{ borderColor: '#EF4444', color: NAVY }} />
              </div>
            )}
            {calificacion && !negativa && (
              <div className="mb-4">
                <label className="text-xs mb-1.5 block" style={{ color: TEXT_MUTED }}>Comentario adicional (opcional)</label>
                <textarea value={comentario} onChange={(e) => setComentario(e.target.value)}
                  placeholder="Algo mas que quieras compartir..." rows={2}
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none resize-none"
                  style={{ borderColor: BORDER, color: NAVY }} />
              </div>
            )}
            <button onClick={enviarCalificacion} disabled={!puedeEnviarCalificacion || enviandoCalificacion}
              className="w-full rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-40 btn-green-3d"
              style={{ background: GREEN }}>
              {enviandoCalificacion ? 'Enviando...' : 'Enviar calificacion'}
            </button>
            <button onClick={() => setMostrarCalificacion(false)}
              className="w-full text-xs text-center mt-3" style={{ color: TEXT_MUTED }}>
              Omitir por ahora
            </button>
          </div>
        </div>
      )}

      <h2 className="text-lg font-semibold mb-4" style={{ color: NAVY }}>Mi cuenta</h2>

      <TarjetaDigital cliente={perfil} />

      {notificaciones.length > 0 && (
        <div className="mt-4 rounded-xl border overflow-hidden card-3d"
          style={{ borderColor: notifNoLeidas.length > 0 ? '#EF4444' : BORDER }}>
          <div className="px-4 py-3 flex items-center justify-between"
            style={{ background: notifNoLeidas.length > 0 ? '#FEF2F2' : '#F7F8FA' }}>
            <div className="flex items-center gap-2">
              <Bell size={14} style={{ color: notifNoLeidas.length > 0 ? '#EF4444' : TEXT_MUTED }} />
              <p className="text-xs font-semibold" style={{ color: notifNoLeidas.length > 0 ? '#EF4444' : NAVY }}>
                Notificaciones {notifNoLeidas.length > 0 ? '(' + notifNoLeidas.length + ' nueva' + (notifNoLeidas.length > 1 ? 's' : '') + ')' : ''}
              </p>
            </div>
            {notifNoLeidas.length > 0 && (
              <button onClick={marcarTodasLeidas} className="text-[10px] font-semibold" style={{ color: TEXT_MUTED }}>
                Marcar todas leidas
              </button>
            )}
          </div>
          <div className="divide-y" style={{ borderColor: BORDER }}>
            {notificaciones.slice(0, 5).map((n) => (
              <div key={n.id} className="px-4 py-3 flex items-start gap-3"
                style={{ background: n.leida ? CARD : '#FFF5F5' }}>
                <div className="flex-1">
                  <p className="text-xs" style={{ color: n.leida ? TEXT_MUTED : NAVY }}>{n.mensaje}</p>
                  <p className="text-[10px] mt-1" style={{ color: '#9AA5AE' }}>
                    {new Date(n.creado_en).toLocaleDateString('es-HN')}
                  </p>
                </div>
                {!n.leida && (
                  <button onClick={() => marcarLeida(n.id)}
                    className="text-[10px] font-semibold flex-shrink-0 px-2 py-1 rounded btn-3d"
                    style={{ background: '#FEE2E2', color: '#EF4444' }}>
                    OK
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {REFERIDOS_ACTIVO() && (
        <div className="mt-4 rounded-xl border p-4 card-3d"
          style={{ borderColor: `${GREEN}50`, background: `${GREEN}0D` }}>
          <p className="text-xs font-bold mb-1" style={{ color: '#4A9123' }}>🎉 Programa de referidos — Vigente hasta el 15 de agosto</p>
          <p className="text-xs mb-3" style={{ color: TEXT_MUTED }}>
            Comparte tu codigo y gana 1 Enermoneda por cada amigo que se una y suba su primera factura.
          </p>
          <div className="flex items-center gap-2 rounded-lg border px-3 py-2.5 elevated"
            style={{ borderColor: GREEN, background: CARD }}>
            <p className="font-mono text-sm font-bold flex-1" style={{ color: NAVY }}>{perfil.numero_tarjeta}</p>
            <button onClick={copiarCodigo}
              className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg btn-3d"
              style={{ background: copiado ? GREEN : `${GREEN}20`, color: copiado ? '#fff' : GREEN }}>
              {copiado ? <><Check size={12} /> Copiado</> : <><Copy size={12} /> Copiar</>}
            </button>
          </div>
        </div>
      )}

      <div className="mt-6 rounded-xl border p-5 neo-circle" style={{ borderColor: BORDER, background: CARD }}>
        <Medidor valor={perfil.galones_acumulados} meta={667} />
        <p className="text-center text-xs mt-3" style={{ color: TEXT_MUTED }}>Consumo acumulado este periodo</p>
      </div>

      <div className="mt-4 rounded-xl border p-4 card-3d flex items-center gap-3"
        style={{ borderColor: `${GREEN}50`, background: `${GREEN}0D` }}>
        <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: GREEN, boxShadow: '0 4px 10px rgba(91,174,47,0.4)' }}>
          <img src={iconoEnermonedas} alt="Enermonedas" style={{ width: 24, height: 24, objectFit: 'contain' }} />
        </div>
        <div className="flex-1">
          <p className="text-[10px] uppercase tracking-widest" style={{ color: '#4A9123' }}>Enermonedas</p>
          <p className="text-2xl font-bold tabular-nums" style={{ color: NAVY }}>{enermonedas} EM</p>
        </div>
        <p className="text-xs text-right" style={{ color: TEXT_MUTED, maxWidth: 90 }}>1 Enermoneda<br />por galon</p>
      </div>

      {premiosDisponibles.length > 0 && (
        <button onClick={() => setMostrarCanje(true)}
          className="mt-4 w-full rounded-xl p-4 flex items-center gap-3 btn-green-3d"
          style={{ background: 'linear-gradient(135deg, #5BAE2F 0%, #3D7A1F 100%)', boxShadow: '0 6px 20px rgba(91,174,47,0.45), inset 0 1px 0 rgba(255,255,255,0.2)' }}>
          <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.2)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)' }}>
            <PartyPopper size={20} className="text-white" />
          </div>
          <div className="text-left flex-1">
            <p className="text-sm font-bold text-white">Canjear Enermonedas</p>
            <p className="text-xs text-white/85">{premiosDisponibles.length} premio{premiosDisponibles.length > 1 ? 's' : ''} disponible{premiosDisponibles.length > 1 ? 's' : ''} para ti</p>
          </div>
          <Sparkles size={18} className="text-white/80" />
        </button>
      )}

      {tieneCanjePendiente && (
        <div className="mt-3 rounded-xl p-3 flex items-center gap-2"
          style={{ background: '#FEF9C3', border: '1px solid #FDE047' }}>
          <Clock size={14} style={{ color: '#854D0E' }} />
          <p className="text-xs font-semibold" style={{ color: '#854D0E' }}>
            Tienes un canje pendiente: {canjesPendientes[0].descripcion}. Acercate a tu gasolinera.
          </p>
        </div>
      )}

      {siguientePremio && (
        <div className="mt-4 rounded-xl border p-4 card-3d" style={{ borderColor: BORDER, background: CARD }}>
          <div className="flex items-center gap-2 mb-2">
            <Gift size={15} style={{ color: GREEN }} />
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: NAVY }}>Proximo premio</p>
          </div>
          <p className="text-sm font-bold mb-1" style={{ color: NAVY }}>{siguientePremio.descripcion}</p>
          <p className="text-xs mb-2" style={{ color: TEXT_MUTED }}>
            Te faltan <span className="font-bold" style={{ color: GREEN }}>{siguientePremio.enermonedas_requeridas - enermonedas} EM</span> para este premio
          </p>
          <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: '#EDF0F3', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.08)' }}>
            <div className="h-full rounded-full" style={{
              width: `${Math.min((enermonedas / siguientePremio.enermonedas_requeridas) * 100, 100)}%`,
              background: `linear-gradient(90deg, ${GREEN_LIGHT}, ${GREEN})`,
              boxShadow: '0 2px 4px rgba(91,174,47,0.4)'
            }} />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px]" style={{ color: TEXT_MUTED }}>{enermonedas} EM</span>
            <span className="text-[10px]" style={{ color: TEXT_MUTED }}>{siguientePremio.enermonedas_requeridas} EM</span>
          </div>
        </div>
      )}

      <div className="mt-4 rounded-xl border overflow-hidden card-3d" style={{ borderColor: BORDER }}>
        <div className="px-4 py-3 flex items-center gap-2" style={{ background: NAVY, boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.2)' }}>
          <Gift size={15} className="text-white" />
          <p className="text-xs font-bold text-white uppercase tracking-wide">Tabla de premios Enermonedas</p>
        </div>
        {premios.map((p) => {
          const alcanzado = enermonedas >= p.enermonedas_requeridas
          const esSiguiente = siguientePremio?.id === p.id
          return (
            <div key={p.id} className="flex items-center justify-between px-4 py-3 border-b"
              style={{ borderColor: BORDER, background: alcanzado ? `${GREEN}0D` : esSiguiente ? `${NAVY}08` : CARD }}>
              <div className="flex items-center gap-2">
                <span style={{ fontSize: 16 }}>{alcanzado ? '✅' : esSiguiente ? '🎯' : '🔒'}</span>
                <p className="text-sm font-medium" style={{ color: alcanzado ? '#4A9123' : NAVY }}>{p.descripcion}</p>
              </div>
              <span className="text-xs font-bold px-2 py-1 rounded-full" style={{
                background: alcanzado ? GREEN : esSiguiente ? NAVY : '#EDF0F3',
                color: alcanzado || esSiguiente ? '#fff' : TEXT_MUTED,
                boxShadow: alcanzado ? '0 2px 6px rgba(91,174,47,0.4)' : esSiguiente ? '0 2px 6px rgba(15,42,74,0.3)' : 'none'
              }}>
                {p.enermonedas_requeridas} EM
              </span>
            </div>
          )
        })}
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-semibold mb-3" style={{ color: NAVY }}>Subir factura</h3>
        <div className="rounded-xl border border-dashed p-4 card-3d" style={{ borderColor: '#C7CFD6', background: CARD }}>
          <input ref={camaraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleArchivo} />
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleArchivo} />
          <div className="flex gap-2 mb-3">
            <button onClick={() => camaraRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg border py-3 text-sm btn-3d"
              style={{ borderColor: BORDER, background: '#F7F8FA', color: '#274463' }}>
              <Camera size={16} style={{ color: GREEN }} /> Camara
            </button>
            <button onClick={() => fileRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg border py-3 text-sm btn-3d"
              style={{ borderColor: BORDER, background: '#F7F8FA', color: '#274463' }}>
              <Upload size={16} style={{ color: GREEN }} /> Galeria
            </button>
          </div>
          {archivo && <p className="text-xs mb-3 text-center" style={{ color: '#4A9123' }}>{archivo.name}</p>}
          <label className="text-xs mb-1.5 block" style={{ color: TEXT_MUTED }}>Gasolinera donde cargaste</label>
          <select value={estacionSeleccionada} onChange={(e) => setEstacionSeleccionada(e.target.value)}
            className="w-full rounded-lg border px-3 py-2.5 text-sm mb-3 focus:outline-none"
            style={{ borderColor: BORDER, color: estacionSeleccionada ? NAVY : '#9AA5AE', background: '#FFFFFF', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.04)' }}>
            <option value="">Selecciona la gasolinera (opcional)</option>
            {estaciones.map((e) => (
              <option key={e.id} value={e.id}>{e.nombre} — {e.ciudad}</option>
            ))}
          </select>
          <label className="text-xs mb-1.5 block" style={{ color: TEXT_MUTED }}>Galones en la factura</label>
          <input type="number" value={galones} onChange={(e) => setGalones(e.target.value)}
            placeholder="Ej. 20.5" className="w-full rounded-lg border px-3 py-2.5 text-sm mb-3 focus:outline-none"
            style={{ borderColor: BORDER, color: NAVY, background: '#FFFFFF', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.04)' }} />
          <button onClick={handleEnviar} disabled={!archivo || subiendo}
            className="w-full rounded-lg py-2.5 text-sm font-semibold flex items-center justify-center gap-1.5 disabled:opacity-40 text-white btn-green-3d"
            style={{ background: GREEN }}>
            <Upload size={15} /> {subiendo ? 'Subiendo...' : 'Enviar para revision'}
          </button>
          {enviado && <p className="text-xs text-center mt-2.5" style={{ color: '#4A9123' }}>Factura enviada. Sera revisada por el equipo.</p>}
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-semibold mb-3" style={{ color: NAVY }}>Mi reporte de consumo</h3>
        <div className="rounded-xl border p-4 card-3d" style={{ borderColor: BORDER, background: CARD }}>
          <p className="text-xs mb-3" style={{ color: TEXT_MUTED }}>Descarga un resumen de tus facturas y Enermonedas acumuladas</p>
          <div className="flex gap-2">
            <button onClick={() => descargarReporte('semanal')} disabled={generandoReporte}
              className="flex-1 rounded-lg py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 text-white disabled:opacity-50 btn-navy-3d"
              style={{ background: NAVY }}>
              <Download size={13} /> Esta semana
            </button>
            <button onClick={() => descargarReporte('mensual')} disabled={generandoReporte}
              className="flex-1 rounded-lg py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 text-white disabled:opacity-50 btn-green-3d"
              style={{ background: GREEN }}>
              <Download size={13} /> Este mes
            </button>
          </div>
        </div>
      </div>

      {canjes.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold mb-3" style={{ color: NAVY }}>Mis canjes</h3>
          <div className="space-y-2">
            {canjes.map((c) => (
              <div key={c.id} className="rounded-lg border p-3 card-3d flex items-center justify-between"
                style={{ borderColor: BORDER, background: CARD }}>
                <div>
                  <p className="text-sm font-medium" style={{ color: NAVY }}>{c.descripcion}</p>
                  <p className="text-xs" style={{ color: TEXT_MUTED }}>{new Date(c.creado_en).toLocaleDateString('es-HN')} — {c.enermonedas} EM</p>
                </div>
                <span className="text-[10px] font-bold px-2 py-1 rounded-full"
                  style={{
                    background: c.estado === 'pendiente' ? '#FEF9C3' : `${GREEN}18`,
                    color: c.estado === 'pendiente' ? '#854D0E' : '#4A9123'
                  }}>
                  {c.estado === 'pendiente' ? '⏳ Pendiente' : '✅ Entregado'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6">
        <h3 className="text-sm font-semibold mb-3" style={{ color: NAVY }}>Mis facturas</h3>
        <div className="space-y-2">
          {facturas.length === 0 && <p className="text-sm" style={{ color: '#9AA5AE' }}>Aun no has subido facturas.</p>}
          {facturas.map((f) => {
            const s = ESTADO_STYLES[f.estado]
            const Icon = s.icon
            return (
              <div key={f.id} className="rounded-lg border p-3 card-3d"
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
                  <div className="mt-2 rounded-lg px-3 py-2" style={{ background: '#FEF2F2', boxShadow: 'inset 0 2px 4px rgba(239,68,68,0.08)' }}>
                    <p className="text-[10px] font-semibold mb-0.5" style={{ color: '#EF4444' }}>Razon del rechazo:</p>
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
