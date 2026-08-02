import React, { useState, useEffect, useRef } from 'react'
import { PartyPopper, ChevronRight, CheckCircle2, X } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { GREEN, GREEN_LIGHT, NAVY, BORDER, TEXT_MUTED } from '../theme'
import iconoEnermonedas from '../assets/icono-enermoneda.png'

const PREMIOS_CANJE = [
  { enermonedas: 67, descripcion: 'L 10 descuento', emoji: '🎁' },
  { enermonedas: 134, descripcion: 'L 20 descuento', emoji: '🎁' },
  { enermonedas: 267, descripcion: 'Recarga L 40', emoji: '⚡' },
  { enermonedas: 334, descripcion: 'L 50 descuento', emoji: '🎁' },
  { enermonedas: 667, descripcion: 'Premio L 100', emoji: '🏆' },
]

function MonedaAnimada() {
  const [offset, setOffset] = useState(0)
  const [angulo, setAngulo] = useState(0)
  const rafRef = useRef(null)
  const startRef = useRef(null)

  useEffect(() => {
    function animar(ts) {
      if (!startRef.current) startRef.current = ts
      const t = (ts - startRef.current) / 1000
      setOffset(Math.sin(t * 1.2) * 5)
      setAngulo(Math.sin(t * 0.4) * 12)
      rafRef.current = requestAnimationFrame(animar)
    }
    rafRef.current = requestAnimationFrame(animar)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  return (
    <div style={{
      transform: `translateY(${offset}px) perspective(400px) rotateY(${angulo}deg)`,
      transition: 'transform 0.05s linear',
      display: 'inline-block',
    }}>
      <div style={{
        width: 96, height: 96,
        borderRadius: '50%',
        background: 'linear-gradient(145deg, #FFD700 0%, #FFA500 40%, #FFD700 60%, #B8860B 100%)',
        boxShadow: '0 8px 32px rgba(255,165,0,0.4), inset 0 2px 4px rgba(255,255,255,0.6), inset 0 -2px 4px rgba(0,0,0,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Reflejo metálico */}
        <div style={{
          position: 'absolute', top: 0, left: '-50%', width: '60%', height: '100%',
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)',
          transform: `translateX(${(angulo + 12) * 8}px)`,
          pointerEvents: 'none',
        }} />
        {/* Borde dorado */}
        <div style={{
          position: 'absolute', inset: 4,
          borderRadius: '50%',
          background: 'linear-gradient(145deg, #5BAE2F 0%, #3D7A1F 100%)',
          boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <img src={iconoEnermonedas} alt="EM" style={{ width: 48, height: 48, objectFit: 'contain', filter: 'brightness(1.2)' }} />
        </div>
      </div>
    </div>
  )
}

export default function VistaEnermonedas({ usuario }) {
  const [perfil, setPerfil] = useState(null)
  const [premios, setPremios] = useState([])
  const [canjes, setCanjes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [mostrarCanje, setMostrarCanje] = useState(false)
  const [premioSeleccionado, setPremioSeleccionado] = useState(null)
  const [canjeando, setCanjeando] = useState(false)
  const [canjeExitoso, setCanjeExitoso] = useState(false)

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
      mensaje: '🎉 Canje exitoso! Solicitaste ' + premioSeleccionado.descripcion + ' por ' + premioSeleccionado.enermonedas + ' EM.',
    })
    setCanjeando(false)
    setCanjeExitoso(true)
    setTimeout(() => {
      setMostrarCanje(false)
      setPremioSeleccionado(null)
      setCanjeExitoso(false)
      cargarDatos()
    }, 2000)
  }

  if (cargando || !perfil) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: GREEN, borderTopColor: 'transparent' }} />
      </div>
    )
  }

  const enermonedas = Math.floor(perfil.galones_acumulados)
  const siguientePremio = PREMIOS_CANJE.find((p) => p.enermonedas > enermonedas)
  const mejorPremioDisponible = [...PREMIOS_CANJE].reverse().find((p) => enermonedas >= p.enermonedas)
  const pct = siguientePremio ? Math.min((enermonedas / siguientePremio.enermonedas) * 100, 100) : 100
  const canjesPendientes = canjes.filter((c) => c.estado === 'pendiente')
  const totalAhorrado = canjes.filter((c) => c.estado !== 'pendiente').length * 10
  const ultimoCanje = canjes[0]

  return (
    <div style={{ background: '#F7F9FC', minHeight: '100%', paddingBottom: 32 }}>

      {/* Modal de canje */}
      {mostrarCanje && (
        <div className="fixed inset-0 flex items-end justify-center z-50 px-4 pb-8"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => { if (!canjeExitoso) { setMostrarCanje(false); setPremioSeleccionado(null) } }}>
          <div className="w-full max-w-sm rounded-3xl overflow-hidden"
            style={{ background: '#fff', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}
            onClick={(e) => e.stopPropagation()}>
            <div className="px-6 pt-6 pb-4">
              <div className="flex items-center justify-between mb-5">
                <p className="text-base font-bold" style={{ color: NAVY }}>Canjear Enermonedas</p>
                {!canjeExitoso && (
                  <button onClick={() => { setMostrarCanje(false); setPremioSeleccionado(null) }}
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: '#F0F2F5' }}>
                    <X size={15} style={{ color: TEXT_MUTED }} />
                  </button>
                )}
              </div>

              {canjeExitoso ? (
                <div className="text-center py-6">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{ background: GREEN + '15' }}>
                    <CheckCircle2 size={32} style={{ color: GREEN }} />
                  </div>
                  <p className="text-base font-bold mb-1" style={{ color: NAVY }}>Canje exitoso</p>
                  <p className="text-sm" style={{ color: TEXT_MUTED }}>Acercate a tu gasolinera para recibir tu beneficio</p>
                </div>
              ) : (
                <>
                  <p className="text-xs mb-4 font-medium" style={{ color: TEXT_MUTED }}>Selecciona el premio</p>
                  <div className="space-y-2 mb-5">
                    {PREMIOS_CANJE.map((p) => {
                      const disponible = enermonedas >= p.enermonedas
                      const seleccionado = premioSeleccionado?.enermonedas === p.enermonedas
                      return (
                        <button key={p.enermonedas}
                          onClick={() => disponible && setPremioSeleccionado(p)}
                          disabled={!disponible}
                          className="w-full rounded-2xl p-3.5 flex items-center gap-3 transition-all"
                          style={{
                            border: '1.5px solid ' + (seleccionado ? GREEN : '#E8EDF2'),
                            background: seleccionado ? GREEN + '08' : '#fff',
                            opacity: disponible ? 1 : 0.4,
                          }}>
                          <span style={{ fontSize: 22 }}>{p.emoji}</span>
                          <div className="flex-1 text-left">
                            <p className="text-sm font-semibold" style={{ color: NAVY }}>{p.descripcion}</p>
                            <p className="text-xs" style={{ color: disponible ? GREEN : TEXT_MUTED }}>{p.enermonedas} EM</p>
                          </div>
                          {seleccionado && <CheckCircle2 size={18} style={{ color: GREEN }} />}
                          {!disponible && <span className="text-xs" style={{ color: '#C0C8D0' }}>Faltan {p.enermonedas - enermonedas}</span>}
                        </button>
                      )
                    })}
                  </div>
                  <button onClick={confirmarCanje} disabled={!premioSeleccionado || canjeando}
                    className="w-full rounded-2xl py-3.5 text-sm font-bold text-white disabled:opacity-40"
                    style={{ background: GREEN }}>
                    {canjeando ? 'Procesando...' : premioSeleccionado ? 'Canjear ' + premioSeleccionado.descripcion : 'Selecciona un premio'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="px-5 pt-4">

        {/* Tarjeta principal */}
        <div className="rounded-3xl p-6 mb-4"
          style={{
            background: 'linear-gradient(145deg, #0F2A4A 0%, #1A3D6B 60%, #0F2A4A 100%)',
            boxShadow: '0 8px 32px rgba(15,42,74,0.25)',
          }}>
          <div className="flex flex-col items-center text-center mb-5">
            <MonedaAnimada />
            <p className="text-xs uppercase tracking-widest mt-4 mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>Tus Enermonedas</p>
            <p className="text-5xl font-black text-white tabular-nums">{enermonedas}</p>
            <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>Sigue acumulando y disfruta mas beneficios</p>
          </div>

          {siguientePremio && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  Faltan <span className="font-bold" style={{ color: GREEN_LIGHT }}>{siguientePremio.enermonedas - enermonedas} EM</span> para {siguientePremio.descripcion}
                </p>
                <p className="text-xs font-bold" style={{ color: GREEN_LIGHT }}>{pct.toFixed(0)}%</p>
              </div>
              <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                <div className="h-full rounded-full" style={{
                  width: pct + '%',
                  background: 'linear-gradient(90deg, ' + GREEN + ', ' + GREEN_LIGHT + ')',
                  transition: 'width 0.8s ease',
                }} />
              </div>
              <div className="flex justify-between mt-1.5">
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{enermonedas} EM</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{siguientePremio.enermonedas} EM</p>
              </div>
            </div>
          )}
          {!siguientePremio && (
            <p className="text-center text-xs font-semibold" style={{ color: GREEN_LIGHT }}>🏆 Alcanzaste el premio maximo</p>
          )}
        </div>

        {/* Premio disponible */}
        {mejorPremioDisponible && canjesPendientes.length === 0 && (
          <div className="rounded-3xl p-5 mb-4 flex items-center gap-4"
            style={{
              background: 'linear-gradient(135deg, #3D7A1F 0%, #5BAE2F 100%)',
              boxShadow: '0 6px 24px rgba(91,174,47,0.35)',
            }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(255,255,255,0.2)' }}>
              <span style={{ fontSize: 24 }}>🎁</span>
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-white/70 uppercase tracking-wider mb-0.5">Tienes un premio listo</p>
              <p className="text-base font-black text-white">{mejorPremioDisponible.descripcion}</p>
            </div>
            <button onClick={() => setMostrarCanje(true)}
              className="rounded-2xl px-4 py-2.5 text-xs font-bold flex-shrink-0"
              style={{ background: '#fff', color: '#3D7A1F' }}>
              Canjear
            </button>
          </div>
        )}

        {/* Canje pendiente */}
        {canjesPendientes.length > 0 && (
          <div className="rounded-3xl p-4 mb-4 flex items-center gap-3"
            style={{ background: '#FEF9C3', border: '1px solid #FDE047' }}>
            <span style={{ fontSize: 20 }}>⏳</span>
            <div className="flex-1">
              <p className="text-xs font-semibold" style={{ color: '#854D0E' }}>Canje pendiente</p>
              <p className="text-xs" style={{ color: '#A16207' }}>{canjesPendientes[0].descripcion} — Acercate a tu gasolinera</p>
            </div>
          </div>
        )}

        {/* Catálogo horizontal */}
        <div className="mb-4">
          <p className="text-sm font-bold mb-3" style={{ color: NAVY }}>Catalogo de premios</p>
          <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
            {PREMIOS_CANJE.map((p) => {
              const alcanzado = enermonedas >= p.enermonedas
              return (
                <div key={p.enermonedas}
                  className="flex-shrink-0 rounded-2xl p-4 flex flex-col items-center text-center"
                  style={{
                    width: 100,
                    background: alcanzado ? GREEN + '08' : '#fff',
                    border: '1.5px solid ' + (alcanzado ? GREEN + '40' : '#E8EDF2'),
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  }}>
                  <span style={{ fontSize: 26, marginBottom: 6 }}>{p.emoji}</span>
                  <p className="text-xs font-bold leading-tight mb-1" style={{ color: alcanzado ? '#3D7A1F' : NAVY }}>{p.descripcion}</p>
                  <p className="text-xs font-semibold" style={{ color: alcanzado ? GREEN : TEXT_MUTED }}>{p.enermonedas} EM</p>
                  {alcanzado && <span className="text-xs mt-1.5 font-bold" style={{ color: GREEN }}>✓ Listo</span>}
                  {!alcanzado && <span className="text-xs mt-1.5" style={{ color: '#C0C8D0' }}>Faltan {p.enermonedas - enermonedas}</span>}
                </div>
              )
            })}
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="rounded-2xl p-4" style={{ background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #E8EDF2' }}>
            <p className="text-xs mb-1" style={{ color: TEXT_MUTED }}>Has ahorrado</p>
            <p className="text-xl font-black" style={{ color: GREEN }}>L {totalAhorrado > 0 ? totalAhorrado : '—'}</p>
          </div>
          <div className="rounded-2xl p-4" style={{ background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #E8EDF2' }}>
            <p className="text-xs mb-1" style={{ color: TEXT_MUTED }}>Premios canjeados</p>
            <p className="text-xl font-black" style={{ color: NAVY }}>{canjes.filter((c) => c.estado !== 'pendiente').length}</p>
          </div>
        </div>

        {/* Actividad reciente */}
        {canjes.length > 0 && (
          <div className="rounded-2xl p-4 mb-4" style={{ background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #E8EDF2' }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold" style={{ color: NAVY }}>Actividad reciente</p>
              {canjes.length > 1 && (
                <button className="flex items-center gap-1 text-xs font-semibold" style={{ color: GREEN }}
                  onClick={() => setMostrarCanje(true)}>
                  Ver historial <ChevronRight size={14} />
                </button>
              )}
            </div>
            {canjes.slice(0, 3).map((c) => (
              <div key={c.id} className="flex items-center gap-3 py-2.5 border-b last:border-0" style={{ borderColor: '#F0F2F5' }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: c.estado === 'pendiente' ? '#FEF9C3' : GREEN + '12' }}>
                  <span style={{ fontSize: 16 }}>🎁</span>
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold" style={{ color: NAVY }}>{c.descripcion}</p>
                  <p className="text-xs" style={{ color: TEXT_MUTED }}>{new Date(c.creado_en).toLocaleDateString('es-HN')}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold" style={{ color: c.estado === 'pendiente' ? '#854D0E' : GREEN }}>
                    -{c.enermonedas} EM
                  </p>
                  <p className="text-xs" style={{ color: c.estado === 'pendiente' ? '#A16207' : TEXT_MUTED }}>
                    {c.estado === 'pendiente' ? 'Pendiente' : 'Entregado'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Boton canjear si no hay premio disponible pero sí canjes anteriores */}
        {!mejorPremioDisponible && (
          <button onClick={() => setMostrarCanje(true)}
            className="w-full rounded-2xl py-3.5 text-sm font-bold"
            style={{ background: '#fff', color: NAVY, border: '1.5px solid #E8EDF2', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            Ver catalogo de premios
          </button>
        )}
      </div>
    </div>
  )
}
