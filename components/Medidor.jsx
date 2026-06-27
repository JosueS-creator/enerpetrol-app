import React from 'react'
import { NAVY, GREEN, GREEN_LIGHT, TEXT_MUTED } from '../theme'

export default function Medidor({ valor, meta }) {
  const pct = Math.min(valor / meta, 1)
  const circunferencia = 2 * Math.PI * 70
  const offset = circunferencia * (1 - pct)

  return (
    <div className="relative w-44 h-44 mx-auto">
      <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90">
        <circle cx="80" cy="80" r="70" fill="none" stroke="#EDF0F3" strokeWidth="12" />
        <defs>
          <linearGradient id="meterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={GREEN_LIGHT} />
            <stop offset="100%" stopColor={GREEN} />
          </linearGradient>
        </defs>
        <circle
          cx="80" cy="80" r="70" fill="none"
          stroke="url(#meterGrad)" strokeWidth="12" strokeLinecap="round"
          strokeDasharray={circunferencia}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-4xl font-bold tabular-nums" style={{ color: NAVY }}>{valor.toFixed(1)}</span>
        <span className="text-xs uppercase tracking-widest mt-1" style={{ color: TEXT_MUTED }}>de {meta} gal</span>
      </div>
    </div>
  )
}
