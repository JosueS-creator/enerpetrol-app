import React, { useState, useEffect, useRef, useCallback } from 'react'
import { CheckCircle2, X, ChevronRight } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { GREEN, GREEN_LIGHT, GREEN_DARK, NAVY, BORDER, TEXT_MUTED, TEXT_FAINT, SHADOW_GREEN } from '../theme'
import iconoEnermonedas from '../assets/icono-enermoneda.png'

// ─── Constantes ─────────────────────────────────────────────
const PREMIOS = [
  { enermonedas: 67,  descripcion: 'L 10 descuento', emoji: '🎁' },
  { enermonedas: 134, descripcion: 'L 20 descuento', emoji: '🎁' },
  { enermonedas: 267, descripcion: 'Recarga L 40',   emoji: '⚡' },
  { enermonedas: 334, descripcion: 'L 50 descuento', emoji: '🎁' },
  { enermonedas: 667, descripcion: 'Premio L 100',   emoji: '🏆' },
]

// ─── Moneda animada con CSS — rotación 360° continua ────────
function MonedaAnimada() {
  return (
    <>
      <style>{`
        @keyframes emSpin {
          0%   { transform: perspective(700px) rotateY(-90deg) translateY(0px); }
          40%  { transform: perspective(700px) rotateY(0deg)   translateY(-8px); }
          50%  { transform: perspective(700px) rotateY(90deg)  translateY(0px); }
          51%  { transform: perspective(700px) rotateY(-90deg) translateY(0px); }
          100% { transform: perspective(700px) rotateY(-90deg) translateY(0px); }
        }
        @keyframes emGlow {
          0%,100% { box-shadow: 0 16px 48px rgba(255,165,0,0.5), 0 0 0 0 rgba(255,200,0,0); }
          50%     { box-shadow: 0 24px 72px rgba(255,165,0,0.8), 0 0 60px 12px rgba(255,200,0,0.25); }
        }
        @keyframes emShine {
          0%   { left: -150%; opacity: 0; }
          15%  { opacity: 1; }
          55%  { left: 160%; opacity: 0; }
          100% { left: 160%; opacity: 0; }
        }
        .em-coin  { animation: emSpin 3.5s cubic-bezier(0.4,0,0.6,1) infinite; display: inline-block; }
        .em-glow  { animation: emGlow 3.5s ease-in-out infinite; }
        .em-shine { animation: emShine 3.5s ease-in-out infinite; }
      `}</style>
      <div className="em-coin">
        <div className="em-glow" style={{
          width: 160, height: 160, borderRadius: '50%',
          background: 'linear-gradient(145deg, #FFE566 0%, #FFB800 35%, #FF8C00 65%, #CC6E00 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative', overflow: 'hidden',
        }}>
          <div className="em-shine" style={{
            position: 'absolute', top: 0, width: '60%', height: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)',
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', inset: 7, borderRadius: '50%',
            background: `linear-gradient(145deg, ${GREEN} 0%, ${GREEN_DARK} 100%)`,
            boxShadow: 'inset 0 4px 8px rgba(255,255,255,0.35), inset 0 -3px 6px rgba(0,0,0,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden',
          }}>
            <img src={iconoEnermonedas} alt="EM"
              style={{ width: 108, height: 108, objectFit: 'contain', filter: 'brightness(1.25) drop-shadow(0 3px 6px rgba(0,0,0,0.25))' }} />
          </div>
        </div>
      </div>
    </>
  )
}

// ─── Tarjeta de premio en catálogo ──────────────────────────
function PremioCard({ premio, enermonedas }) {
  const alcanzado = enermonedas >= premio.enermonedas
  const faltan    = premio.enermonedas - enermonedas
  return (
    <div style={{
      flexShrink: 0, width: 96, borderRadius: 18,
      padding: '14px 10px', display: 'flex', flexDirection: 'column',
      alignItems: 'center', textAlign: 'center',
      background: alcanzado ? 'rgba(91,174,47,0.07)' : '#fff',
      border: `1.5px solid ${alcanzado ? 'rgba(91,174,47,0.35)' : '#E8EDF2'}`,
      transition: 'all 0.2s ease',
    }}>
      <span style={{ fontSize: 24, marginBottom: 8 }}>{premio.emoji}</span>
      <p style={{ fontSize: 11, fontWeight: 700, color: alcanzado ? GREEN_DARK : NAVY, marginBottom: 4, lineHeight: 1.3 }}>
        {premio.descripcion}
      </p>
      <p style={{ fontSize: 11, fontWeight: 600, color: alcanzado ? GREEN : TEXT_MUTED, marginBottom: 4 }}>
        {premio.enermonedas} EM
      </p>
      {alcanzado
        ? <span style={{ fontSize: 10, fontWeight: 700, color: GREEN }}>✓ Listo</span>
        : <span style={{ fontSize: 10, color: TEXT_FAINT }}>Faltan {faltan}</span>
      }
    </div>
  )
}

// ─── Modal canje ─────────────────────────────────────────────
function ModalCanje({ enermonedas, onCerrar, onExito }) {
  const [seleccionado, setSeleccionado] = useState(null)
  const [canjeando, setCanjeando]       = useState(false)
  const [exitoso, setExitoso]           = useState(false)

  async function confirmar() {
    if (!seleccionado || canjeando) return
    setCanjeando(true)
    // La lógica real se pasa desde el padre
    await onExito(seleccionado)
    setCanjeando(false)
    setExitoso(true)
    setTimeout(() => { setExitoso(false); onCerrar() }, 2000)
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        padding: '0 0 8px', background: 'rgba(0,0,0,0.45)',
      }}
      onClick={() => !exitoso && onCerrar()}>
      <div
        style={{
          width: '100%', maxWidth: 440, borderRadius: '24px 24px 0 0',
          background: '#fff', padding: '0 20px 32px',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.15)',
          animation: 'slideUp 0.35s cubic-bezier(0.23,1,0.32,1) both',
        }}
        onClick={(e) => e.stopPropagation()}>
        <style>{`@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>

        {/* Handle */}
        <div style={{ width: 36, height: 4, borderRadius: 2, background: '#E0E4E8', margin: '14px auto 20px' }} />

        {exitoso ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%', margin: '0 auto 16px',
              background: 'rgba(91,174,47,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <CheckCircle2 size={32} color={GREEN} />
            </div>
            <p style={{ fontSize: 16, fontWeight: 700, color: NAVY, marginBottom: 6 }}>¡Canje exitoso!</p>
            <p style={{ fontSize: 13, color: TEXT_MUTED }}>Acércate a tu gasolinera para recibir tu beneficio</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <p style={{ fontSize: 16, fontWeight: 700, color: NAVY }}>Canjear Enermonedas</p>
              <button
                onClick={onCerrar}
                style={{
                  width: 32, height: 32, borderRadius: '50%', border: 'none',
                  background: '#F0F2F5', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                }}>
                <X size={15} color={TEXT_MUTED} />
              </button>
            </div>

            <p style={{ fontSize: 12, color: TEXT_MUTED, marginBottom: 12 }}>Selecciona un premio</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              {PREMIOS.map((p) => {
                const disponible  = enermonedas >= p.enermonedas
                const esSel       = seleccionado?.enermonedas === p.enermonedas
                return (
                  <button
                    key={p.enermonedas}
                    disabled={!disponible}
                    onClick={() => setSeleccionado(p)}
                    style={{
                      width: '100%', borderRadius: 14, padding: '13px 14px',
                      display: 'flex', alignItems: 'center', gap: 12, border: 'none',
                      border: `1.5px solid ${esSel ? GREEN : '#E8EDF2'}`,
                      background: esSel ? 'rgba(91,174,47,0.06)' : '#fff',
                      opacity: disponible ? 1 : 0.45, cursor: disponible ? 'pointer' : 'not-allowed',
                      transition: 'all 0.15s ease', textAlign: 'left',
                    }}>
                    <span style={{ fontSize: 20 }}>{p.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: NAVY, marginBottom: 2 }}>{p.descripcion}</p>
                      <p style={{ fontSize: 11, color: disponible ? GREEN : TEXT_MUTED }}>{p.enermonedas} EM</p>
                    </div>
                    {esSel && <CheckCircle2 size={18} color={GREEN} />}
                    {!disponible && <span style={{ fontSize: 11, color: TEXT_FAINT }}>Faltan {p.enermonedas - enermonedas}</span>}
                  </button>
                )
              })}
            </div>

            <button
              onClick={confirmar}
              disabled={!seleccionado || canjeando}
              style={{
                width: '100%', borderRadius: 14, padding: '14px',
                fontSize: 14, fontWeight: 700, border: 'none',
                background: GREEN, color: '#fff', cursor: 'pointer',
                opacity: !seleccionado || canjeando ? 0.45 : 1,
              }}>
              {canjeando ? 'Procesando...' : seleccionado ? `Canjear ${seleccionado.descripcion}` : 'Selecciona un premio'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Vista principal ─────────────────────────────────────────
export default function VistaEnermonedas({ usuario }) {
  const [perfil,   setPerfil]   = useState(null)
  const [canjes,   setCanjes]   = useState([])
  const [cargando, setCargando] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)

  const cargarDatos = useCallback(async () => {
    const [{ data: p }, { data: c }] = await Promise.all([
      supabase.from('perfiles').select('*').eq('id', usuario.id).single(),
      supabase.from('canjes').select('*').eq('cliente_id', usuario.id).order('creado_en', { ascending: false }),
    ])
    setPerfil(p)
    setCanjes(c || [])
    setCargando(false)
  }, [usuario.id])

  useEffect(() => { cargarDatos() }, [cargarDatos])

  async function handleCanje(premio) {
    const nuevoTotal = perfil.galones_acumulados - premio.enermonedas
    await supabase.from('perfiles').update({ galones_acumulados: nuevoTotal }).eq('id', usuario.id)
    await supabase.from('canjes').insert({
      cliente_id: usuario.id,
      enermonedas: premio.enermonedas,
      descripcion: premio.descripcion,
      estado: 'pendiente',
    })
    await supabase.from('notificaciones').insert({
      usuario_id: usuario.id,
      mensaje: `🎉 Canje exitoso! Solicitaste ${premio.descripcion} por ${premio.enermonedas} EM.`,
    })
    await cargarDatos()
  }

  if (cargando || !perfil) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 160 }}>
        <div style={{
          width: 24, height: 24, borderRadius: '50%',
          border: `2px solid ${GREEN}`, borderTopColor: 'transparent',
          animation: 'spin 0.7s linear infinite',
        }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    )
  }

  const enermonedas        = Math.floor(perfil.galones_acumulados)
  const siguientePremio    = PREMIOS.find((p) => p.enermonedas > enermonedas)
  const mejorDisponible    = [...PREMIOS].reverse().find((p) => enermonedas >= p.enermonedas)
  const pct                = siguientePremio ? Math.min((enermonedas / siguientePremio.enermonedas) * 100, 100) : 100
  const canjesPendientes   = canjes.filter((c) => c.estado === 'pendiente')
  const canjesCompletados  = canjes.filter((c) => c.estado !== 'pendiente')

  return (
    <div style={{ background: '#F5F7FA', minHeight: '100%', paddingBottom: 32 }}>

      {/* Modal canje */}
      {modalOpen && (
        <ModalCanje
          enermonedas={enermonedas}
          onCerrar={() => setModalOpen(false)}
          onExito={handleCanje}
        />
      )}

      <div style={{ padding: '16px 16px 0' }}>

        {/* ── Tarjeta principal ── */}
        <div style={{
          borderRadius: 24, padding: '24px 20px 20px', marginBottom: 12,
          background: `linear-gradient(145deg, ${NAVY} 0%, #1A3D6B 60%, ${NAVY} 100%)`,
          boxShadow: '0 8px 32px rgba(15,42,74,0.22)',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: 20 }}>
            <MonedaAnimada />
            <p style={{ fontSize: 10, letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', marginTop: 16, marginBottom: 6 }}>
              Tus Enermonedas
            </p>
            <p style={{ fontSize: 48, fontWeight: 900, color: '#fff', lineHeight: 1, letterSpacing: '-1px' }}>
              {enermonedas}
            </p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>
              Sigue acumulando y disfruta más beneficios
            </p>
          </div>

          {siguientePremio ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
                  Faltan <strong style={{ color: GREEN_LIGHT }}>{siguientePremio.enermonedas - enermonedas} EM</strong> para {siguientePremio.descripcion}
                </p>
                <p style={{ fontSize: 11, fontWeight: 700, color: GREEN_LIGHT }}>{pct.toFixed(0)}%</p>
              </div>
              <div style={{ width: '100%', height: 6, borderRadius: 99, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 99, width: pct + '%',
                  background: `linear-gradient(90deg, ${GREEN}, ${GREEN_LIGHT})`,
                  transition: 'width 0.9s ease',
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{enermonedas} EM</span>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{siguientePremio.enermonedas} EM</span>
              </div>
            </div>
          ) : (
            <p style={{ textAlign: 'center', fontSize: 12, fontWeight: 600, color: GREEN_LIGHT }}>
              🏆 Alcanzaste el premio máximo
            </p>
          )}
        </div>

        {/* ── Premio disponible ── */}
        {mejorDisponible && canjesPendientes.length === 0 && (
          <div style={{
            borderRadius: 20, padding: '16px', marginBottom: 12,
            display: 'flex', alignItems: 'center', gap: 14,
            background: `linear-gradient(135deg, ${GREEN_DARK} 0%, ${GREEN} 100%)`,
            boxShadow: SHADOW_GREEN,
          }}>
            <div style={{
              width: 46, height: 46, borderRadius: 14, flexShrink: 0,
              background: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22,
            }}>🎁</div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 3 }}>
                Tienes un premio listo
              </p>
              <p style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>{mejorDisponible.descripcion}</p>
            </div>
            <button
              onClick={() => setModalOpen(true)}
              style={{
                flexShrink: 0, padding: '9px 16px', borderRadius: 12, border: 'none',
                background: '#fff', color: GREEN_DARK, fontSize: 12, fontWeight: 700, cursor: 'pointer',
              }}>
              Canjear
            </button>
          </div>
        )}

        {/* ── Canje pendiente ── */}
        {canjesPendientes.length > 0 && (
          <div style={{
            borderRadius: 16, padding: '14px', marginBottom: 12,
            display: 'flex', alignItems: 'center', gap: 12,
            background: '#FEF9C3', border: '1px solid #FDE047',
          }}>
            <span style={{ fontSize: 18 }}>⏳</span>
            <div>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#854D0E', marginBottom: 2 }}>Canje pendiente</p>
              <p style={{ fontSize: 12, color: '#A16207' }}>{canjesPendientes[0].descripcion} — Acércate a tu gasolinera</p>
            </div>
          </div>
        )}

        {/* ── Catálogo de premios ── */}
        <div style={{ marginBottom: 12 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: NAVY, marginBottom: 12 }}>Catálogo de premios</p>
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4, paddingRight: 16, scrollbarWidth: 'none' }}>
            {PREMIOS.map((p) => (
              <PremioCard key={p.enermonedas} premio={p} enermonedas={enermonedas} />
            ))}
          </div>
        </div>

        {/* ── Estadísticas ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
          {[
            { label: 'Has ahorrado', value: `L ${canjesCompletados.length * 10 || '—'}`, color: GREEN },
            { label: 'Premios canjeados', value: canjesCompletados.length, color: NAVY },
          ].map(({ label, value, color }) => (
            <div key={label} style={{
              borderRadius: 16, padding: '14px',
              background: '#fff', border: '1px solid #E8EDF2',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}>
              <p style={{ fontSize: 11, color: TEXT_MUTED, marginBottom: 6 }}>{label}</p>
              <p style={{ fontSize: 22, fontWeight: 800, color }}>{value}</p>
            </div>
          ))}
        </div>

        {/* ── Actividad reciente ── */}
        {canjes.length > 0 && (
          <div style={{
            borderRadius: 18, padding: '16px', marginBottom: 12,
            background: '#fff', border: '1px solid #E8EDF2',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: NAVY }}>Actividad reciente</p>
              {canjes.length > 3 && (
                <button
                  onClick={() => setModalOpen(true)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 2,
                    fontSize: 12, fontWeight: 600, color: GREEN,
                    background: 'none', border: 'none', cursor: 'pointer',
                  }}>
                  Ver más <ChevronRight size={14} />
                </button>
              )}
            </div>
            {canjes.slice(0, 3).map((c, i) => (
              <div key={c.id} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 0',
                borderBottom: i < Math.min(canjes.length, 3) - 1 ? '1px solid #F0F2F5' : 'none',
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 11, flexShrink: 0,
                  background: c.estado === 'pendiente' ? '#FEF9C3' : 'rgba(91,174,47,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
                }}>🎁</div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: NAVY, marginBottom: 2 }}>{c.descripcion}</p>
                  <p style={{ fontSize: 11, color: TEXT_MUTED }}>{new Date(c.creado_en).toLocaleDateString('es-HN')}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: c.estado === 'pendiente' ? '#854D0E' : GREEN }}>
                    -{c.enermonedas} EM
                  </p>
                  <p style={{ fontSize: 11, color: c.estado === 'pendiente' ? '#A16207' : TEXT_MUTED }}>
                    {c.estado === 'pendiente' ? 'Pendiente' : 'Entregado'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── CTA catálogo si no hay premio disponible ── */}
        {!mejorDisponible && (
          <button
            onClick={() => setModalOpen(true)}
            style={{
              width: '100%', borderRadius: 16, padding: '14px',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              background: '#fff', color: NAVY,
              border: '1.5px solid #E8EDF2',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}>
            Ver catálogo de premios
          </button>
        )}
      </div>
    </div>
  )
}
