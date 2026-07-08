import React from 'react'
import { GREEN, GREEN_LIGHT, NAVY } from '../theme'
import logoImg from '../assets/logo-enerpetrol.png'

export default function PantallaBienvenida({ onContinuar }) {
  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-between px-8 py-12 relative overflow-hidden"
      style={{
        background: 'linear-gradient(160deg, #C8CDD2 0%, #E8EBEE 20%, #D0D5DA 40%, #BEC4CA 60%, #D8DCE0 80%, #C0C6CC 100%)',
      }}
    >
      {/* Reflejos metálicos */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'linear-gradient(115deg, transparent 25%, rgba(255,255,255,0.18) 40%, rgba(255,255,255,0.32) 50%, rgba(255,255,255,0.18) 60%, transparent 75%)'
      }} />
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'linear-gradient(200deg, rgba(255,255,255,0.12) 0%, transparent 40%, rgba(0,0,0,0.06) 100%)'
      }} />

      {/* Acento verde sutil arriba */}
      <div className="absolute top-0 left-0 right-0 h-1.5" style={{
        background: `linear-gradient(90deg, transparent, ${GREEN}, ${GREEN_LIGHT}, ${GREEN}, transparent)`
      }} />

      {/* Acento navy sutil abajo */}
      <div className="absolute bottom-0 left-0 right-0 h-1" style={{
        background: `linear-gradient(90deg, transparent, ${NAVY}, transparent)`
      }} />

      {/* Círculos decorativos */}
      <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full pointer-events-none" style={{
        background: 'radial-gradient(circle, rgba(255,255,255,0.25) 0%, transparent 70%)'
      }} />
      <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full pointer-events-none" style={{
        background: `radial-gradient(circle, ${GREEN}18 0%, transparent 70%)`
      }} />

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10">

        {/* Logo */}
        <div
          className="mb-8 rounded-2xl p-6"
          style={{
            background: 'linear-gradient(145deg, rgba(255,255,255,0.75), rgba(255,255,255,0.45))',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <img
            src={logoImg}
            alt="Enerpetrol"
            style={{ width: 180, height: 'auto', objectFit: 'contain' }}
          />
        </div>

        {/* Slogan */}
        <p
          className="text-sm uppercase tracking-[0.18em] text-center mb-2 font-semibold"
          style={{ color: NAVY, opacity: 0.75 }}
        >
          Conectamos consumidores
        </p>
        <p
          className="text-sm uppercase tracking-[0.18em] text-center"
          style={{ color: GREEN, opacity: 0.9, fontWeight: 700 }}
        >
          Generamos ahorro
        </p>

        {/* Tarjeta de mensaje */}
        <div
          className="mt-10 rounded-2xl px-5 py-4 max-w-xs text-center"
          style={{
            background: 'linear-gradient(145deg, rgba(255,255,255,0.6), rgba(255,255,255,0.3))',
            border: '1px solid rgba(255,255,255,0.7)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
          }}
        >
          <p className="text-sm font-medium" style={{ color: NAVY }}>
            Juntos consumimos mas, juntos ahorramos mas.
          </p>
          <p className="text-xs mt-1.5" style={{ color: GREEN, fontWeight: 600 }}>
            Te gusta la app? Recomendanos a un amigo
          </p>
        </div>
      </div>

      {/* Botones y links */}
      <div className="w-full max-w-xs relative z-10 space-y-3">
        <button
          onClick={onContinuar}
          className="w-full rounded-xl py-3.5 text-sm font-bold tracking-wide"
          style={{
            background: `linear-gradient(180deg, ${GREEN_LIGHT} 0%, ${GREEN} 55%, #3D7A1F 100%)`,
            color: '#0B1A12',
            boxShadow: `0 4px 16px ${GREEN}55`,
          }}
        >
          Comenzar
        </button>
        <div className="flex justify-center gap-6">
          <a href="https://wa.me/50487401299" className="text-xs font-medium" style={{ color: '#5C6870' }}>
            WhatsApp
          </a>
          href="mailto:supportenerpetrol@gmail.com"
            Escribenos por correo
          </a>
        </div>
      </div>
    </div>
  )
}
