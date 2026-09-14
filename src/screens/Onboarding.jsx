import { useState, useRef } from 'react'
import { UserPlus, MapPin, CreditCard, Camera, Coins } from 'lucide-react'
import { LogoMark } from '../components/Logo'
import { GREEN, GREEN_LIGHT } from '../theme'

// Onboarding.jsx
// Pantalla de bienvenida para usuarios nuevos — se muestra una sola vez.
// App.jsx decide cuándo montarla (según localStorage('enp_onboarding'))
// y le pasa `onComplete`, que se llama al terminar o al saltar.
// Sin dependencias nuevas: usa lucide-react y theme.js, igual que el resto de la app.

const PASOS = [
  { icon: UserPlus,   titulo: 'Crea tu cuenta',                   texto: 'Regístrate en segundos y activa tu tarjeta digital de descuentos.' },
  { icon: MapPin,     titulo: 'Localiza tu estación más cercana', texto: 'Encuentra en el mapa la estación Enerpetrol más cercana a ti.' },
  { icon: CreditCard, titulo: 'Presenta tu tarjeta digital',      texto: 'Muestra tu tarjeta digital al bombero al momento de cargar combustible.' },
  { icon: Camera,     titulo: 'Sube tu factura',                  texto: 'Tómale foto a tu factura con la cámara de la app y súbela.' },
  { icon: Coins,      titulo: 'Gana Enermonedas',                 texto: 'Acumula Enermonedas con cada carga y canjéalas por premios.' },
]

export default function Onboarding({ onComplete }) {
  const [paso, setPaso] = useState(0)
  const touchStartX = useRef(null)
  const esUltimo = paso === PASOS.length - 1

  const siguiente = () => (esUltimo ? onComplete?.() : setPaso((p) => p + 1))
  const anterior  = () => paso > 0 && setPaso((p) => p - 1)
  const omitir    = () => onComplete?.()

  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX }
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return
    const deltaX = e.changedTouches[0].clientX - touchStartX.current
    if (deltaX < -40) siguiente()
    else if (deltaX > 40) anterior()
    touchStartX.current = null
  }

  const { icon: Icon, titulo, texto } = PASOS[paso]

  return (
    <div
      style={{
        minHeight: '100dvh', width: '100%', display: 'flex', flexDirection: 'column',
        background: 'linear-gradient(155deg, #0A1620 0%, #0F2A4A 50%, #1A3D6B 100%)',
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Omitir */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '20px 20px 0' }}>
        {!esUltimo && (
          <button
            onClick={omitir}
            style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.55)', background: 'none', border: 'none', cursor: 'pointer', padding: '8px 4px' }}>
            Omitir
          </button>
        )}
      </div>

      {/* Contenido */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 32px', textAlign: 'center' }}>
        <LogoMark size={40} />
        <div
          key={paso}
          style={{
            width: 108, height: 108, borderRadius: '50%', display: 'flex',
            alignItems: 'center', justifyContent: 'center', marginTop: 28, marginBottom: 24,
            background: 'rgba(255,255,255,0.08)', border: `2px solid ${GREEN}`,
            animation: 'epFadeInOnboarding 0.35s ease both',
          }}>
          <Icon size={44} color={GREEN_LIGHT} />
        </div>
        <h2 style={{ fontSize: 19, fontWeight: 700, color: '#fff', marginBottom: 10 }}>{titulo}</h2>
        <p style={{ fontSize: 14, lineHeight: 1.6, color: 'rgba(255,255,255,0.65)', maxWidth: 280 }}>{texto}</p>
      </div>

      {/* Puntos de progreso */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, paddingBottom: 20 }}>
        {PASOS.map((_, i) => (
          <button
            key={i}
            onClick={() => setPaso(i)}
            aria-label={`Ir al paso ${i + 1}`}
            style={{
              height: 6, width: i === paso ? 22 : 6, borderRadius: 99, border: 'none', cursor: 'pointer',
              background: i === paso ? GREEN : 'rgba(255,255,255,0.25)', transition: 'all 0.3s ease', padding: 0,
            }}
          />
        ))}
      </div>

      {/* Botones */}
      <div style={{ display: 'flex', gap: 10, padding: '0 24px 32px' }}>
        {paso > 0 && (
          <button
            onClick={anterior}
            style={{
              flex: 1, borderRadius: 14, padding: '14px', fontSize: 14, fontWeight: 600,
              border: '1px solid rgba(255,255,255,0.2)', background: 'none', color: 'rgba(255,255,255,0.8)', cursor: 'pointer',
            }}>
            Atrás
          </button>
        )}
        <button
          onClick={siguiente}
          style={{
            flex: 2, borderRadius: 14, padding: '14px', fontSize: 14, fontWeight: 700,
            border: 'none', background: GREEN, color: '#fff', cursor: 'pointer',
            boxShadow: '0 4px 18px rgba(91,174,47,0.45)',
          }}>
          {esUltimo ? '¡Empezar a ahorrar!' : 'Siguiente'}
        </button>
      </div>

      <style>{`@keyframes epFadeInOnboarding{from{opacity:0;transform:scale(0.9)}to{opacity:1;transform:scale(1)}}`}</style>
    </div>
  )
}
