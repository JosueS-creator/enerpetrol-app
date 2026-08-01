import React, { useState, useEffect } from 'react'
import { Gift, PartyPopper, Sparkles, Clock, CheckCircle2 } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { NAVY, GREEN, GREEN_LIGHT, BORDER, CARD, TEXT_MUTED, UMBRAL_PUNTOS_CANJE } from '../theme'
import Medidor from '../components/Medidor'
import iconoEnermonedas from '../assets/icono-enermoneda.png'

const PREMIOS_CANJE = [
  { enermonedas: 67, descripcion: 'Descuento L 10', emoji: '🎁' },
  { enermonedas: 134, descripcion: 'Descuento L 20', emoji: '🎁' },
  { enermonedas: 267, descripcion: 'Recarga L 40', emoji: '⚡' },
  { enermonedas: 334, descripcion: 'Descuento L 50', emoji: '🎁' },
  { enermonedas: 667, descripcion: 'Premio L 100', emoji: '🏆' },
]

export default function VistaEnermonedas({ usuario }) {
  const [perfil, setPerfil] = useState(null)
  const [premios, setPremios] = useState([])
  const [canjes, setCanjes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [mostrarCanje, setMostrarCanje] = useState(false)
  const [premioSeleccionado, setPremioSeleccionado] = useState(null)
  const [canjeando, setCanjeando] = useState(false)

  async function cargarDatos() {
    const { data: perfilData } = await supabase.from('perfiles').select('*').eq('id', usuario.id).single()
    setPerfil(perfilData)
    const { data: premiosData } = await supabase.from('premios').select('*').eq('activo', true).order('orden')
    setPremios(premiosData || [])
    const { data: canjesData } = await supabase.from('canjes').select('*').eq('cliente_id', usuario.id).order('creado_en', { ascending: false })
    setCanjes(canjesData || [])
    setCargando(false)
  }

  useEffect(() => { cargarDatos() }, [usuario.id])

  async function confirmarCanje() {
    if (!premioSeleccionado || canjeando) return
    setCanjeando(true)
    const em = Math.floor(perfil.galones_acumulados)
    if (em < premioSeleccionado.enermonedas) { setCanjeando(false); return }
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

  if (cargando || !perfil) {
    return <div className="px-5 pt-6 text-sm" style={{ color: TEXT_MUTED }}>Cargando...</div>
  }

  const enermonedas = Math.floor(perfil.galones_acumulados)
  const siguientePremio = premios.find((p) => p.enermonedas_requeridas > enermonedas)
  const premiosDisponibles = PREMIOS_CANJE.filter((p) => enermonedas >= p.enermonedas)
  const canjesPendientes = canjes.filter((c) => c.estado === 'pendiente')
  const tieneCanjePendiente = canjesPendientes.length > 0

  return (
    <div className="px-5 pt-4 pb-6">

      {mostrarCanje && (
        <div className="fixed inset-0 flex items-end justify-center z-50 px-4 pb-6"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={() => { setMostrarCanje(false); setPremioSeleccionado(null) }}>
          <div className="w-full max-w-sm rounded-2xl overflow-hidden"
            style={{ background: CARD }}
            onClick={(e) => e.stopPropagation()}>
            <div className="px-5 pt-5 pb-4" style={{ background: 'linear-gradient(135deg, #0F2A4A 0%, #1A3D6B 100%)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-bold text-base">Canjear Enermonedas</p>
                  <p className="text-xs mt-0.5" style={{ color: '#8FCB4D' }}>Tienes {enermonedas} EM disponibles</p>
                </div>
              </div>
            </div>
            <div className="px-5 py-4">
              {tieneCanjePendiente ? (
                <div className="rounded-xl p-3 text-center" style={{ background: '#FEF9C3', border: '1px solid #FDE047' }}>
                  <p className="text-xs font-semibold" style={{ color: '#854D0E' }}>
                    Tienes un canje pendiente. Acercate a tu gasolinera.
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-2 mb-4">
                    {PREMIOS_CANJE.map((p) => {
                      const disponible = enermonedas >= p.enermonedas
                      const seleccionado = premioSeleccionado?.enermonedas === p.enermonedas
                      return (
                        <button key={p.enermonedas}
                          onClick={() => disponible && setPremioSeleccionado(p)}
                          disabled={!disponible}
                          className="w-full rounded-xl p-3 flex items-center gap-3 border transition-all disabled:opacity-40"
                          style={{ borderColor: seleccionado ? GREEN : BORDER, background: seleccionado ? GREEN + '15' : CARD }}>
                          <span style={{ fontSize: 24 }}>{p.emoji}</span>
                          <div className="flex-1 text-left">
                            <p className="text-sm font-semibold" style={{ color: disponible ? NAVY : TEXT_MUTED }}>{p.descripcion}</p>
                            <p className="text-xs" style={{ color: disponible ? GREEN : TEXT_MUTED }}>{p.enermonedas} EM</p>
                          </div>
                          {seleccionado && <CheckCircle2 size={18} style={{ color: GREEN }} />}
                          {!disponible && <span className="text-xs" style={{ color: TEXT_MUTED }}>Faltan {p.enermonedas - enermonedas}</span>}
                        </button>
                      )
                    })}
                  </div>
                  {premioSeleccionado && (
                    <div className="rounded-xl p-3 mb-4 text-center" style={{ background: GREEN + '10', border: '1px solid ' + GREEN + '40' }}>
                      <p className="text-xs" style={{ color: '#4A9123' }}>
                        Te quedaran <span className="font-bold">{enermonedas - premioSeleccionado.enermonedas} EM</span>
                      </p>
                    </div>
                  )}
                  <button onClick={confirmarCanje} disabled={!premioSeleccionado || canjeando}
                    className="w-full rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-40"
                    style={{ background: GREEN }}>
                    {canjeando ? 'Procesando...' : 'Confirmar canje'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header Enermonedas */}
      <div className="rounded-2xl p-5 mb-4"
        style={{ background: 'linear-gradient(135deg, #0F2A4A 0%, #1A3D6B 100%)', boxShadow: '0 8px 24px rgba(15,42,74,0.3)' }}>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.1)' }}>
            <img src={iconoEnermonedas} alt="EM" style={{ width: 32, height: 32, objectFit: 'contain' }} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.5)' }}>Tus Enermonedas</p>
            <p className="text-4xl font-black text-white tabular-nums">{enermonedas}</p>
            <p className="text-xs" style={{ color: GREEN_LIGHT }}>EM acumuladas</p>
          </div>
        </div>
        <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
          <div className="h-full rounded-full" style={{
            width: Math.min((enermonedas / 667) * 100, 100) + '%',
            background: 'linear-gradient(90deg, ' + GREEN + ', ' + GREEN_LIGHT + ')',
          }} />
        </div>
        <div className="flex justify-between mt-1.5">
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{enermonedas} EM</p>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Meta: 667 EM</p>
        </div>
      </div>

      {/* Medidor */}
      <div className="rounded-2xl p-5 mb-4 card-3d" style={{ background: CARD, border: '1px solid ' + BORDER }}>
        <Medidor valor={perfil.galones_acumulados} meta={667} />
        <p className="text-center text-xs mt-3" style={{ color: TEXT_MUTED }}>Consumo acumulado este periodo</p>
      </div>

      {/* Botón canjear */}
      {premiosDisponibles.length > 0 && (
        <button onClick={() => setMostrarCanje(true)}
          className="w-full rounded-2xl p-4 flex items-center gap-3 mb-4"
          style={{ background: 'linear-gradient(135deg, #5BAE2F 0%, #3D7A1F 100%)', boxShadow: '0 6px 20px rgba(91,174,47,0.45)' }}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.2)' }}>
            <PartyPopper size={22} className="text-white" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-bold text-white">Canjear Enermonedas</p>
            <p className="text-xs text-white/80">{premiosDisponibles.length} premio{premiosDisponibles.length > 1 ? 's' : ''} disponible{premiosDisponibles.length > 1 ? 's' : ''}</p>
          </div>
          <Sparkles size={20} className="text-white/80" />
        </button>
      )}

      {tieneCanjePendiente && (
        <div className="rounded-2xl p-3 flex items-center gap-3 mb-4"
          style={{ background: '#FEF9C3', border: '1px solid #FDE047' }}>
          <Clock size={16} style={{ color: '#854D0E' }} />
          <p className="text-xs font-semibold" style={{ color: '#854D0E' }}>
            Canje pendiente: {canjesPendientes[0].descripcion} — Acercate a tu gasolinera
          </p>
        </div>
      )}

      {/* Siguiente premio */}
      {siguientePremio && (
        <div className="rounded-2xl p-4 mb-4 card-3d" style={{ background: CARD, border: '1px solid ' + BORDER }}>
          <div className="flex items-center gap-2 mb-3">
            <Gift size={16} style={{ color: GREEN }} />
            <p className="text-sm font-bold" style={{ color: NAVY }}>Proximo premio</p>
          </div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold" style={{ color: NAVY }}>{siguientePremio.descripcion}</p>
            <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ background: NAVY, color: '#fff' }}>
              {siguientePremio.enermonedas_requeridas} EM
            </span>
          </div>
          <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: '#EDF0F3' }}>
            <div className="h-full rounded-full" style={{
              width: Math.min((enermonedas / siguientePremio.enermonedas_requeridas) * 100, 100) + '%',
              background: 'linear-gradient(90deg, ' + GREEN_LIGHT + ', ' + GREEN + ')',
            }} />
          </div>
          <p className="text-xs mt-1.5" style={{ color: TEXT_MUTED }}>
            Faltan <span className="font-bold" style={{ color: GREEN }}>{siguientePremio.enermonedas_requeridas - enermonedas} EM</span>
          </p>
        </div>
      )}

      {/* Tabla de premios */}
      <div className="rounded-2xl overflow-hidden mb-4" style={{ border: '1px solid ' + BORDER }}>
        <div className="px-4 py-3 flex items-center gap-2" style={{ background: NAVY }}>
          <Gift size={15} className="text-white" />
          <p className="text-xs font-bold text-white uppercase tracking-wide">Tabla de premios</p>
        </div>
        {premios.map((p) => {
          const alcanzado = enermonedas >= p.enermonedas_requeridas
          const esSiguiente = siguientePremio?.id === p.id
          return (
            <div key={p.id} className="flex items-center justify-between px-4 py-3 border-b"
              style={{ borderColor: BORDER, background: alcanzado ? GREEN + '0D' : esSiguiente ? NAVY + '08' : CARD }}>
              <div className="flex items-center gap-2">
                <span style={{ fontSize: 16 }}>{alcanzado ? '✅' : esSiguiente ? '🎯' : '🔒'}</span>
                <p className="text-sm font-medium" style={{ color: alcanzado ? '#4A9123' : NAVY }}>{p.descripcion}</p>
              </div>
              <span className="text-xs font-bold px-2 py-1 rounded-full" style={{
                background: alcanzado ? GREEN : esSiguiente ? NAVY : '#EDF0F3',
                color: alcanzado || esSiguiente ? '#fff' : TEXT_MUTED,
              }}>
                {p.enermonedas_requeridas} EM
              </span>
            </div>
          )
        })}
      </div>

      {/* Historial de canjes */}
      {canjes.length > 0 && (
        <div>
          <h3 className="text-sm font-bold mb-3" style={{ color: NAVY }}>Historial de canjes</h3>
          <div className="space-y-2">
            {canjes.map((c) => (
              <div key={c.id} className="rounded-xl p-3 flex items-center justify-between card-3d"
                style={{ background: CARD, border: '1px solid ' + BORDER }}>
                <div>
                  <p className="text-sm font-medium" style={{ color: NAVY }}>{c.descripcion}</p>
                  <p className="text-xs" style={{ color: TEXT_MUTED }}>{new Date(c.creado_en).toLocaleDateString('es-HN')} — {c.enermonedas} EM</p>
                </div>
                <span className="text-xs font-bold px-2 py-1 rounded-full"
                  style={{ background: c.estado === 'pendiente' ? '#FEF9C3' : GREEN + '18', color: c.estado === 'pendiente' ? '#854D0E' : '#4A9123' }}>
                  {c.estado === 'pendiente' ? '⏳ Pendiente' : '✅ Entregado'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
