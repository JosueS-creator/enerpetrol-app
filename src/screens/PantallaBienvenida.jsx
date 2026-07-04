import React from 'react'
import { LogoMark } from '../components/Logo'
import { GREEN, GREEN_LIGHT, NAVY } from '../theme'

export default function PantallaBienvenida({ onContinuar }) {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-between px-8 py-12 relative overflow-hidden"
      style={{ background: `linear-gradient(155deg, #1C2226 0%, ${NAVY} 38%, #2B3B4A 62%, #0A1620 100%)` }}>

      <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.07) 45%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.07) 55%, transparent 70%)' }} />
      <div className="absolute -right-10 top-16 w-40 h-40 rounded-full" style={{ background: `radial-gradient(circle, ${GREEN_LIGHT}26, transparent 70%)` }} />
      <div className="absolute -left-16 top-1/3 w-56 h-56 rounded-full" style={{ background: 'radial-gradient(circle, #9FB8C826, transparent 70%)' }} />

      <div className="flex-1 flex flex-col items-center justify-center relative z-10">
        <div className="mb-3" style={{ filter: 'drop-shadow(0 6px 20px rgba(91,174,47,0.35))' }}>
          <LogoMark size={140} />
        </div>
        <span className="text-[34px] font-bold tracking-tight leading-none">
          <span style={{ background: 'linear-gradient(180deg, #FFFFFF 0%, #C8D2D9 55%, #97A7B3 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>ENER</span>
          <span style={{ background: `linear-gradient(180deg, ${GREEN_LIGHT} 0%, ${GREEN} 60%, #3D7A1F 100%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>PETROL</span>
        </span>
        <p className="text-xs uppercase tracking-[0.15em] text-center mt-2" style={{ color: '#A7B4BD' }}>Conectamos consumidores. Generamos ahorro.</p>

        <div className="mt-9 rounded-2xl px-5 py-4 max-w-xs text-center" style={{ background: 'linear-gradient(145deg, rgba(255,255,255,0.09), rgba(255,255,255,0.03))', border: '1px solid rgba(255,255,255,0.14)' }}>
          <p className="text-sm" style={{ color: '#EEF1F3' }}>Juntos consumimos mas, juntos ahorramos mas.</p>
          <p className="text-xs mt-1.5" style={{ color: GREEN_LIGHT }}>Te gusta la app? Recomendanos a un amigo</p>
        </div>
      </div>

      <div className="w-full max-w-xs relative z-10 space-y-3">
        <button
          onClick={onContinuar}
          className="w-full rounded-xl py-3.5 text-sm font-semibold"
          style={{ background: `linear-gradient(180deg, ${GREEN_LIGHT} 0%, ${GREEN} 55%, #3D7A1F 100%)`, color: '#0B1A12' }}
        >
          Comenzar
        </button>
        <div className="flex justify-center gap-6">
          <a href="https://wa.me/50487401299" className="text-xs" style={{ color: '#7C8A93' }}>WhatsApp</a>
          <a href="mailto:ventaspublicalle@gmail.com" className="text-xs" style={{ color: '#7C8A93' }}>Escribenos por correo</a>
        </div>
      </div>
    </div>
  )
}
