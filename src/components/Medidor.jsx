import React, { useEffect, useState } from 'react'
import { NAVY, GREEN, GREEN_LIGHT, TEXT_MUTED } from '../theme'
import iconoEnermonedas from '../assets/icono-enermoneda.png'

export default function Medidor({ valor, meta }) {
  const [valorAnimado, setValorAnimado] = useState(0)
  const pct = Math.min(valorAnimado / meta, 1)
  const circunferencia = 2 * Math.PI * 70
  const offset = circunferencia * (1 - pct)

  useEffect(() => {
    const timer = setTimeout(() => setValorAnimado(valor), 100)
    return () => clearTimeout(timer)
  }, [valor])

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
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)' }}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="mb-1" style={{ animation: 'bounce 2s ease-in-out infinite' }}>
          <img
            src={iconoEnermonedas}
            alt="EM"
            style={{ width: 28, height: 28, objectFit: 'contain' }}
          />
        </div>
        <span className="font-mono text-3xl font-bold tabular-nums" style={{ color: NAVY }}>
          {Math.floor(valorAnimado)}
        </span>
        <span className="text-[10px] uppercase tracking-widest mt-0.5" style={{ color: TEXT_MUTED }}>
          de {meta} EM
        </span>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  )
}
