import React from 'react'
import { LogoMark } from '../components/Logo'
import { GREEN, GREEN_LIGHT, NAVY } from '../theme'
import bienvenidaImg from '../assets/bienvenida-enerpetrol.png'

export default function PantallaBienvenida({ onContinuar }) {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-between px-8 py-12 relative overflow-hidden">

      <img
        src={bienvenidaImg}
        alt="Enerpetrol"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ zIndex: 0 }}
      />

      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, rgba(15,42,74,0.55) 0%, rgba(15,42,74,0.35) 50%, rgba(15,42,74,0.85) 100%)',
          zIndex: 1
        }}
      />

      <div className="flex-1 flex flex-col items-center justify-center relative" style={{ zIndex: 2 }}>
        <div className="mb-3" style={{ filter: 'drop-shadow(0 6px 20px rgba(91,174,47,0.35))' }}>
          <LogoMark size={140} />
        </div>
        <span className="text-[34px] font-bold tracking-tight leading-none">
          <span style={{ background: 'linear-gradient(180deg, #FFFFFF 0%, #C8D2D9 55%, #97A7B3 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>ENER</span>
          <span style={{ background: `linear-gradient(180deg, ${GREEN_LIGHT} 0%, ${GREEN} 60%, #3D7A1F 100%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>PETROL</span>
        </span>
        <p className="text-xs uppercase tracking-[0.15em] text-center mt-2" style={{ color: '#A7B4BD' }}>
          Conectamos consumidores. Generamos ahorro.
        </p>

        <div className="mt-9 rounded-2xl px-5 py-4 max-w-xs text-center" style={{ background: 'linear-gradient(145deg, rgba(255,255,255,0.09), rgba(255,255,255,0.03))', border: '1px solid rgba(255,255,255,0.14)' }}>
          <p className="text-sm" style={{ color: '#EEF1F3' }}>Juntos consumimos mas, juntos ahorramos mas.</p>
          <p className="text-xs mt-1.5" style={{ color: GREEN_LIGHT }}>Te gusta la app? Recomendanos a un amigo</p>
        </div>
      </div>

      <div className="w-full max-w-xs relative" style={{ zIndex: 2 }}>
        <button
          onClick={onContinuar}
          className="w-full rounded-xl py-3.5 text-sm font-semibold"
          style={{ background: `linear-gradient(180deg, ${GREEN_LIGHT} 0%, ${GREEN} 55%, #3D7A1F 100%)`, color: '#0B1A12' }}
        >
          Comenzar
        </button>
        <div className="flex justify-center gap-6 mt-4">
          <a href="https://wa.me/50487401299" className="text-xs" style={{ color: '#7C8A93' }}>WhatsApp</a>
          <a href="mailto:ventaspublicalle@gmail.com" className="text-xs" style={{ color: '#7C8A93' }}>Escribenos por correo</a>
        </div>
      </div>
    </div>
  )
}
