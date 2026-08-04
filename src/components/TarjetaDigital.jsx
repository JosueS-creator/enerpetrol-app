import React from 'react'
import { LogoMark, IconoSurtidor } from './Logo'
import { NAVY, GREEN, GREEN_LIGHT, CODIGO_DESCUENTO_FIJO } from '../theme'

const LOGO_IBEX = 'https://toyqwvyzdjvfomfomwdl.supabase.co/storage/v1/object/public/empresas/1785471056595.png'

export default function TarjetaDigital({ cliente }) {
  const esEmpresarial = cliente.empresa_id !== null && cliente.empresa_id !== undefined

  if (esEmpresarial) {
    return (
      <div className="relative rounded-3xl overflow-hidden"
        style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)' }}>

        <div className="relative px-6 pt-8 pb-6"
          style={{ background: 'linear-gradient(145deg, #051525 0%, #0A2540 40%, #0F3560 70%, #072035 100%)', minHeight: 280 }}>
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 340 280" preserveAspectRatio="none" fill="none">
            <circle cx="300" cy="30" r="160" stroke={GREEN} strokeWidth="1" opacity="0.08" fill="none" />
            <circle cx="300" cy="30" r="110" stroke={GREEN} strokeWidth="1" opacity="0.1" fill="none" />
            <circle cx="300" cy="30" r="60" stroke={GREEN} strokeWidth="1" opacity="0.15" fill="none" />
            <line x1="0" y1="280" x2="240" y2="0" stroke={GREEN} strokeWidth="0.8" opacity="0.12" />
            <line x1="50" y1="280" x2="290" y2="0" stroke={GREEN} strokeWidth="0.8" opacity="0.08" />
            <line x1="100" y1="280" x2="340" y2="0" stroke={GREEN} strokeWidth="0.8" opacity="0.06" />
          </svg>

          {/* Header */}
          <div className="relative z-10 flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <LogoMark size={64} />
              <span className="text-sm font-bold tracking-widest">
                <span style={{ color: 'rgba(255,255,255,0.7)' }}>ENER</span>
                <span style={{ color: GREEN_LIGHT }}>PETROL</span>
              </span>
            </div>
            <span className="text-[10px] uppercase tracking-widest font-semibold px-3 py-1.5 rounded-full"
              style={{ background: 'rgba(91,174,47,0.15)', color: GREEN_LIGHT, border: '1px solid rgba(91,174,47,0.3)' }}>
              Corporativo
            </span>
          </div>

          {/* Logo Ibex */}
          <div className="relative z-10 flex flex-col items-center justify-center mb-8">
            <img
              src={LOGO_IBEX}
              alt="Ibex"
              style={{ height: 110, maxWidth: 260, objectFit: 'contain', filter: 'brightness(1.1) drop-shadow(0 0 16px rgba(91,174,47,0.4))' }}
            />
            <p className="text-[10px] tracking-[0.3em] uppercase mt-3" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Programa Corporativo
            </p>
          </div>

          {/* Separador */}
          <div className="relative z-10 w-full h-px mb-5"
            style={{ background: 'linear-gradient(90deg, transparent 0%, ' + GREEN + ' 30%, ' + GREEN_LIGHT + ' 50%, ' + GREEN + ' 70%, transparent 100%)' }} />

          {/* Datos */}
          <div className="relative z-10 flex items-end justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>N° Cliente</p>
              <p className="font-mono text-lg font-bold tracking-wider" style={{ color: GREEN_LIGHT }}>
                {cliente.numero_tarjeta}
              </p>
            </div>
            {cliente.numero_empleado && (
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>N° Empleado</p>
                <p className="font-mono text-lg font-bold tracking-wider" style={{ color: 'rgba(255,255,255,0.8)' }}>
                  #{cliente.numero_empleado}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Código descuento */}
        <div className="relative px-6 py-4"
          style={{ background: 'linear-gradient(90deg, #0D1F0D 0%, #152E15 50%, #0D1F0D 100%)', borderTop: '1px solid rgba(91,174,47,0.3)' }}>
          <p className="font-mono text-base font-bold tracking-widest text-center" style={{ color: '#E7EAED' }}>
            {CODIGO_DESCUENTO_FIJO}
          </p>
          <p className="text-[11px] font-bold uppercase tracking-widest mt-1 text-center" style={{ color: GREEN }}>
            ⚡ Código para solicitar descuento
          </p>
        </div>

        {/* Footer */}
        <div className="relative px-6 py-4"
          style={{ background: 'linear-gradient(90deg, #040D14 0%, #071520 100%)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-base font-semibold" style={{ color: '#E7EAED' }}>{cliente.nombre}</p>
              {cliente.ciudad && (
                <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{cliente.ciudad}</p>
              )}
            </div>
            <p className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: GREEN }}>
              Cliente Enerpetrol
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Tarjeta normal — más grande
  return (
    <div className="relative rounded-3xl overflow-hidden"
      style={{ boxShadow: '0 16px 48px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,0.15)' }}>

      {/* Header metálico */}
      <div className="relative px-6 pt-7 pb-5"
        style={{ background: 'linear-gradient(115deg, #C9CFD3 0%, #EDEFF1 22%, #9AA3A8 48%, #DCE0E2 65%, #828B90 100%)' }}>
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 340 130" preserveAspectRatio="none" fill="none">
          <path d="M -10 8 Q 90 8 110 28 T 200 8 L 350 8" stroke={GREEN} strokeWidth="2.5" opacity="0.55" />
          <path d="M -10 22 Q 100 22 120 40 T 230 22 L 350 22" stroke="#FFFFFF" strokeWidth="1.5" opacity="0.5" />
        </svg>
        <div className="flex items-center gap-3 relative z-10">
          <LogoMark size={56} />
          <div>
            <span className="text-2xl font-bold tracking-tight leading-none">
              <span style={{ color: NAVY }}>ENER</span>
              <span style={{ color: '#3D7A1F' }}>PETROL</span>
            </span>
          </div>
        </div>
      </div>

      {/* Banda verde */}
      <div className="relative px-6 py-4 text-center"
        style={{ background: 'linear-gradient(115deg, #4F6354 0%, #2F4A38 35%, #1B3326 70%, #0F2218 100%)' }}>
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 340 70" preserveAspectRatio="none" fill="none">
          <path d="M -10 10 Q 110 10 130 30 T 260 10 L 350 10" stroke="#FFFFFF" strokeWidth="1" opacity="0.18" />
        </svg>
        <p className="relative z-10 text-xl font-extrabold tracking-wide" style={{ color: '#EDEFF1', textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>
          TARJETA DE DESCUENTO
        </p>
      </div>

      {/* Datos */}
      <div className="relative px-6 py-5"
        style={{ background: 'linear-gradient(115deg, #9AA3A8 0%, #DCE0E2 30%, #828B90 55%, #BAC1C5 80%, #8A9398 100%)' }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono text-xl font-bold tracking-wider" style={{ color: '#2A2F33', textShadow: '0 1px 0 rgba(255,255,255,0.4)' }}>
              {cliente.numero_tarjeta}
            </p>
            <p className="text-[10px] uppercase tracking-wide mt-1" style={{ color: '#5C6469' }}>
              Número de cliente
            </p>
          </div>
          <IconoSurtidor size={40} color="#5C6469" />
        </div>
        <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(0,0,0,0.12)' }}>
          <p className="font-mono text-xl font-bold tracking-wider" style={{ color: '#2A2F33', textShadow: '0 1px 0 rgba(255,255,255,0.4)' }}>
            {CODIGO_DESCUENTO_FIJO}
          </p>
          <p className="text-xs font-extrabold uppercase tracking-wide mt-1" style={{ color: NAVY }}>
            ⚡ Código para solicitar descuento
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="relative px-6 py-5" style={{ background: 'linear-gradient(160deg, #16241B 0%, #0E1A12 100%)' }}>
        <p className="text-xs text-center font-semibold tracking-wide" style={{ color: '#C7CFC9' }}>
          CONECTAMOS CONSUMIDORES. GENERAMOS AHORRO.
        </p>
        <div className="flex items-center justify-between mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div>
            <span className="text-base font-semibold" style={{ color: '#E7EAED' }}>{cliente.nombre}</span>
            {cliente.ciudad && (
              <span className="text-xs block mt-0.5" style={{ color: '#8A9690' }}>{cliente.ciudad}</span>
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
