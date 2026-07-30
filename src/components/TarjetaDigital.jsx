import React from 'react'
import { LogoMark, IconoSurtidor } from './Logo'
import { NAVY, GREEN, GREEN_LIGHT, CODIGO_DESCUENTO_FIJO } from '../theme'

export default function TarjetaDigital({ cliente }) {
  const esEmpresarial = !!cliente.empresa_id

  if (esEmpresarial) {
    return (
      <div className="relative rounded-2xl overflow-hidden"
        style={{ boxShadow: '0 8px 22px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.15)' }}>

        {/* Header Ibex */}
        <div className="relative px-5 pt-5 pb-4"
          style={{ background: 'linear-gradient(135deg, #0F2A4A 0%, #1A3D6B 50%, #0F2A4A 100%)' }}>
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 340 100" preserveAspectRatio="none" fill="none">
            <circle cx="280" cy="-20" r="100" fill={GREEN} opacity="0.08" />
            <circle cx="320" cy="80" r="60" fill={GREEN} opacity="0.06" />
            <path d="M -10 30 Q 80 10 160 40 T 350 20" stroke={GREEN} strokeWidth="1.5" opacity="0.4" />
            <path d="M -10 55 Q 100 35 200 60 T 350 45" stroke="#FFFFFF" strokeWidth="1" opacity="0.12" />
          </svg>
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <LogoMark size={40} />
              <div>
                <span className="text-base font-bold tracking-tight leading-none block">
                  <span style={{ color: '#FFFFFF' }}>ENER</span>
                  <span style={{ color: GREEN_LIGHT }}>PETROL</span>
                </span>
                <span className="text-[10px] tracking-widest" style={{ color: 'rgba(255,255,255,0.5)' }}>CORPORATIVO</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black tracking-widest" style={{ color: '#FFFFFF', textShadow: '0 0 20px rgba(91,174,47,0.5)' }}>IBEX</p>
              <p className="text-[9px] tracking-widest uppercase" style={{ color: GREEN_LIGHT }}>Programa empresarial</p>
            </div>
          </div>
        </div>

        {/* Franja verde */}
        <div className="relative px-5 py-2"
          style={{ background: 'linear-gradient(90deg, #3D7A1F 0%, #5BAE2F 50%, #3D7A1F 100%)' }}>
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 340 32" preserveAspectRatio="none" fill="none">
            <path d="M -10 8 Q 120 0 200 16 T 350 8" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
          </svg>
          <p className="relative z-10 text-center text-xs font-bold tracking-widest text-white uppercase">
            Tarjeta de Descuento Corporativa
          </p>
        </div>

        {/* Datos del empleado */}
        <div className="relative px-5 py-4"
          style={{ background: 'linear-gradient(135deg, #162030 0%, #0F1E2E 100%)' }}>
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 340 90" preserveAspectRatio="none" fill="none">
            <circle cx="60" cy="90" r="70" fill={GREEN} opacity="0.04" />
          </svg>
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-[9px] uppercase tracking-widest mb-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Titular</p>
                <p className="text-sm font-bold" style={{ color: '#E7EAED' }}>{cliente.nombre}</p>
                {cliente.numero_empleado && (
                  <p className="text-[10px] mt-0.5" style={{ color: GREEN_LIGHT }}>
                    Empleado #{cliente.numero_empleado}
                  </p>
                )}
                {cliente.ciudad && (
                  <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>{cliente.ciudad}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-[9px] uppercase tracking-widest mb-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>N° Cliente</p>
                <p className="font-mono text-xs font-bold" style={{ color: GREEN_LIGHT }}>{cliente.numero_tarjeta}</p>
              </div>
            </div>

            <div className="rounded-xl px-4 py-2.5"
              style={{ background: 'rgba(91,174,47,0.1)', border: '1px solid rgba(91,174,47,0.25)' }}>
              <p className="font-mono text-sm font-bold tracking-wider text-center" style={{ color: '#E7EAED' }}>
                {CODIGO_DESCUENTO_FIJO}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-wide mt-0.5 text-center" style={{ color: GREEN_LIGHT }}>
                ⚡ Código para solicitar descuento
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative px-5 py-3"
          style={{ background: 'linear-gradient(90deg, #0A1620 0%, #0F2A4A 50%, #0A1620 100%)', borderTop: '1px solid rgba(91,174,47,0.2)' }}>
          <div className="flex items-center justify-between">
            <p className="text-[9px] uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Conectamos consumidores. Generamos ahorro.
            </p>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full" style={{ background: GREEN, opacity: 0.8 }} />
              <div className="w-3 h-3 rounded-full -ml-1.5" style={{ background: GREEN_LIGHT, opacity: 0.6 }} />
            </div>
          </div>
        </div>
      </div>
    )
  }

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
