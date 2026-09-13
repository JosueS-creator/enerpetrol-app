import React from 'react'
import { LogoMark, IconoSurtidor } from './Logo'
import { NAVY, GREEN, GREEN_LIGHT, CODIGO_DESCUENTO_FIJO } from '../theme'

const LOGO_IBEX = 'https://toyqwvyzdjvfomfomwdl.supabase.co/storage/v1/object/public/empresas/1785471056595.png'
const C_NAVY = '#082B4C'
const C_NAVY_DARK = '#061F38'
const C_GREEN = '#57B52A'
const C_LIME = '#6BCB32'

// Marca circular de la tarjeta (variante del logo, solo presentación)
function MarcaEnerpetrol({ size = 30 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none" aria-hidden="true" style={{ flex: 'none' }}>
      <circle cx="100" cy="100" r="86" fill="rgba(255,255,255,0.06)" />
      <path d="M 100 14 A 86 86 0 1 1 27 146" stroke={C_LIME} strokeWidth="15" strokeLinecap="round" fill="none" />
      <g transform="translate(100,100) scale(1.3) translate(-100,-100)">
        <path d="M 64 56 H 132 L 108 88 H 128 V 102 H 88 V 128 H 132 V 142 H 64 Z" fill="#FFFFFF" />
        <path d="M 128 88 C 140 100 140 118 128 128 C 116 118 116 100 128 88 Z" fill={C_LIME} />
      </g>
    </svg>
  )
}

export default function TarjetaDigital({ cliente, modoBombero = false }) {
  const esEmpresarial = cliente.empresa_id !== null && cliente.empresa_id !== undefined

  if (esEmpresarial) {
    return (
      <div
        style={{
          containerType: 'inline-size',
          position: 'relative',
          width: '100%',
          overflow: 'hidden',
          borderRadius: 24,
          background: `linear-gradient(158deg, #0A3358 0%, ${C_NAVY} 46%, ${C_NAVY_DARK} 100%)`,
          border: '1px solid rgba(255,255,255,0.09)',
          boxShadow:
            '0 18px 40px -14px rgba(6,31,56,0.65), 0 2px 6px rgba(6,31,56,0.35), inset 0 1px 0 rgba(255,255,255,0.07)',
          color: '#FFFFFF',
        }}
      >
        {/* Grafismo de fondo: arcos del logo + hairlines diagonales */}
        <svg
          viewBox="0 0 400 260"
          preserveAspectRatio="xMaxYMid slice"
          aria-hidden="true"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
        >
          <defs>
            <linearGradient id="enpSwoosh" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0" stopColor="#2E7D25" />
              <stop offset="1" stopColor="#6BCB32" />
            </linearGradient>
            <linearGradient id="enpBand" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0" stopColor="#0B3A24" />
              <stop offset="1" stopColor="#1F6B2A" />
            </linearGradient>
          </defs>
          <text x="330" y="176" fontFamily="ui-sans-serif, system-ui, sans-serif" fontSize="200" fontWeight="800" fill="#FFFFFF" opacity="0.05">E</text>
          <circle cx="470" cy="300" r="212" fill="none" stroke="url(#enpBand)" strokeWidth="74" opacity="0.75" />
          <circle cx="470" cy="300" r="168" fill="none" stroke="url(#enpSwoosh)" strokeWidth="9" opacity="0.5" />
          <circle cx="470" cy="300" r="258" fill="none" stroke="url(#enpSwoosh)" strokeWidth="3.5" opacity="0.3" />
          <path d="M 300 -20 L 402 -20 L 402 58 Z" fill="#FFFFFF" opacity="0.035" />
        </svg>

        {/* Velo superior para el header */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            background: 'linear-gradient(180deg, rgba(6,31,56,0.55) 0%, rgba(6,31,56,0) 34%)',
          }}
        />

        <div
          style={{
            position: 'relative',
            padding: 'clamp(18px, 5.3cqw, 24px)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'clamp(14px, 4cqw, 18px)',
          }}
        >
          {/* Header: Enerpetrol | Ibex con peso visual equivalente */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'clamp(10px, 3cqw, 16px)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <MarcaEnerpetrol size={30} />
              <span style={{ fontSize: 'clamp(17px, 5cqw, 20px)', fontWeight: 800, letterSpacing: '0.01em', lineHeight: 1, whiteSpace: 'nowrap' }}>
                <span style={{ color: '#FFFFFF' }}>ENER</span>
                <span style={{ color: C_LIME }}>PETROL</span>
              </span>
            </div>

            <div
              style={{
                width: 1,
                alignSelf: 'stretch',
                flex: 'none',
                background: 'linear-gradient(180deg, rgba(255,255,255,0), rgba(255,255,255,0.22), rgba(255,255,255,0))',
              }}
            />

            <img
              src={LOGO_IBEX}
              alt="Ibex"
              style={{
                height: 'clamp(44px, 12cqw, 52px)',
                width: 'auto',
                flex: 'none',
                objectFit: 'contain',
                marginRight: 28,
              }}
            />
          </div>

          {!modoBombero && (
            <div
              style={{
                textAlign: 'center',
                fontSize: 'clamp(9px, 2.6cqw, 10px)',
                fontWeight: 600,
                letterSpacing: 'clamp(0.07em, 0.5cqw, 0.2em)',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.66)',
              }}
            >
              Programa corporativo <span style={{ whiteSpace: 'nowrap' }}>Enerpetrol × Ibex</span>
            </div>
          )}

          <div style={{ height: 1, background: 'linear-gradient(90deg, rgba(255,255,255,0.04), rgba(107,203,50,0.45) 45%, rgba(255,255,255,0.06))' }} />

          {/* N.º Cliente */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.64)', marginBottom: 4 }}>
              N.º Cliente
            </div>
            <div
              style={{
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                fontSize: 'clamp(22px, 6.6cqw, 28px)',
                fontWeight: 700,
                letterSpacing: '0.04em',
                lineHeight: 1.05,
                overflowWrap: 'anywhere',
              }}
            >
              {cliente.numero_tarjeta}
            </div>
          </div>

          {/* Código para solicitar descuento */}
          <div
            style={{
              borderRadius: 16,
              border: '1px solid rgba(107,203,50,0.45)',
              background: modoBombero
                ? 'linear-gradient(180deg, rgba(87,181,42,0.24), rgba(87,181,42,0.12))'
                : 'linear-gradient(180deg, rgba(87,181,42,0.16), rgba(87,181,42,0.07))',
              padding: 'clamp(13px, 3.8cqw, 17px)',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#8FE05A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: 'none' }}>
                <path d="M7.5 7.5h.01" />
                <path d="m21 12-8.586-8.586a2 2 0 0 0-1.414-.586H4a1 1 0 0 0-1 1v7a2 2 0 0 0 .586 1.414L12.172 21a2 2 0 0 0 2.828 0l6-6a2 2 0 0 0 0-2.828z" />
              </svg>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#A9E783' }}>
                Código para solicitar descuento
              </span>
            </div>
            <div
              style={{
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                fontSize: modoBombero ? 'clamp(24px, 7.4cqw, 32px)' : 'clamp(20px, 6.2cqw, 27px)',
                fontWeight: 700,
                letterSpacing: '0.05em',
                lineHeight: 1.1,
                overflowWrap: 'anywhere',
              }}
            >
              {CODIGO_DESCUENTO_FIJO}
            </div>
          </div>

          {/* Titular */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 'clamp(23px, 7cqw, 30px)', fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.12, textWrap: 'pretty', overflowWrap: 'break-word' }}>
              {cliente.nombre}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10, rowGap: 8 }}>
              {cliente.ciudad && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'rgba(255,255,255,0.74)', fontSize: 'clamp(13px, 3.9cqw, 15px)' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: 'none' }}>
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <span>{cliente.ciudad}</span>
                </div>
              )}
              {!modoBombero && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    marginLeft: 'auto',
                    padding: '5px 10px',
                    borderRadius: 999,
                    border: '1px solid rgba(107,203,50,0.38)',
                    background: 'rgba(255,255,255,0.06)',
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: '#BDE8A0',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: 'none' }}>
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  Cliente Enerpetrol
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }


  // Tarjeta normal — sin cambios
    return (
    <div className="relative rounded-2xl overflow-hidden"
      style={{ boxShadow: '0 8px 22px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.15)' }}>
      <div className="relative px-5 pt-5 pb-4"
        style={{ background: 'linear-gradient(115deg, #C9CFD3 0%, #EDEFF1 22%, #9AA3A8 48%, #DCE0E2 65%, #828B90 100%)' }}>
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 340 110" preserveAspectRatio="none" fill="none">
          <path d="M -10 8 Q 90 8 110 28 T 200 8 L 350 8" stroke={GREEN} strokeWidth="2.5" opacity="0.55" />
          <path d="M -10 22 Q 100 22 120 40 T 230 22 L 350 22" stroke="#FFFFFF" strokeWidth="1.5" opacity="0.5" />
        </svg>
        <div className="flex items-center gap-3 relative z-10">
          <LogoMark size={46} />
          <div>
            <span className="text-xl font-bold tracking-tight leading-none">
              <span style={{ color: NAVY }}>ENER</span>
              <span style={{ color: '#3D7A1F' }}>PETROL</span>
            </span>
          </div>
        </div>
      </div>
      <div className="relative px-5 py-3 text-center"
        style={{ background: 'linear-gradient(115deg, #4F6354 0%, #2F4A38 35%, #1B3326 70%, #0F2218 100%)' }}>
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 340 70" preserveAspectRatio="none" fill="none">
          <path d="M -10 10 Q 110 10 130 30 T 260 10 L 350 10" stroke="#FFFFFF" strokeWidth="1" opacity="0.18" />
        </svg>
        <p className="relative z-10 text-lg font-extrabold tracking-wide" style={{ color: '#EDEFF1', textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>
          TARJETA DE DESCUENTO
        </p>
      </div>
      <div className="relative px-5 py-4"
        style={{ background: 'linear-gradient(115deg, #9AA3A8 0%, #DCE0E2 30%, #828B90 55%, #BAC1C5 80%, #8A9398 100%)' }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono text-lg font-bold tracking-wider" style={{ color: '#2A2F33', textShadow: '0 1px 0 rgba(255,255,255,0.4)' }}>
              {cliente.numero_tarjeta}
            </p>
            <p className="text-[9px] uppercase tracking-wide mt-0.5" style={{ color: '#5C6469' }}>
              Número de cliente
            </p>
          </div>
          <IconoSurtidor size={34} color="#5C6469" />
        </div>
        <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(0,0,0,0.12)' }}>
          <p className="font-mono text-lg font-bold tracking-wider" style={{ color: '#2A2F33', textShadow: '0 1px 0 rgba(255,255,255,0.4)' }}>
            {CODIGO_DESCUENTO_FIJO}
          </p>
          <p className="text-[11px] font-extrabold uppercase tracking-wide mt-1" style={{ color: NAVY }}>
            ⚡ Código para solicitar descuento
          </p>
        </div>
      </div>
      <div className="relative px-5 py-4" style={{ background: 'linear-gradient(160deg, #16241B 0%, #0E1A12 100%)' }}>
        <p className="text-[11px] text-center font-semibold tracking-wide" style={{ color: '#C7CFC9' }}>
          CONECTAMOS CONSUMIDORES. GENERAMOS AHORRO.
        </p>
        <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div>
            <span className="text-sm" style={{ color: '#E7EAED' }}>{cliente.nombre}</span>
            {cliente.ciudad && (
              <span className="text-[10px] block" style={{ color: '#8A9690' }}>{cliente.ciudad}</span>
            )}
          </div>
          <span className="text-[10px] uppercase tracking-widest font-semibold"
            style={{
              background: 'linear-gradient(180deg, ' + GREEN_LIGHT + ', ' + GREEN + ')',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
            Cliente Enerpetrol
          </span>
        </div>
      </div>
    </div>
  )
}
