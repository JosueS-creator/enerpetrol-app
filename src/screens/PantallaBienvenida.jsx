import React from 'react'
import { LogoMark } from '../components/Logo'
import { NAVY, GREEN, GREEN_LIGHT } from '../theme'

export default function PantallaBienvenida({ onContinuar }) {
  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-between px-8 py-12 relative overflow-hidden"
      style={{ background: `linear-gradient(155deg, #1C2226 0%, ${NAVY} 38%, #2B3B4A 62%, #0A1620 100%)` }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.07) 45%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.07) 55%, transparent 70%)',
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          background:
            'repeating-linear-gradient(100deg, rgba(255,255,255,0.025) 0px, rgba(255,255,255,0.025) 1px, transparent 1px, transparent 6px)',
        }}
      />
      <div className="absolute -right-10 top-16 w-40 h-40 rounded-full" style={{ background: `radial-gradient(circle, ${GREEN_LIGHT}26, transparent 70%)` }} />
      <div className="absolute -left-16 top-1/3 w-56 h-56 rounded-full" style={{ background: 'radial-gradient(circle, #9FB8C826, transparent 70%)' }} />
      <div className="absolute right-6 bottom-24 w-24 h-24 rounded-full" style={{ background: `radial-gradient(circle, ${GREEN}1F, transparent 70%)` }} />

      <div className="flex-1 flex flex-col items-center justify-center relative z-10">
        <div className="mb-3" style={{ filter: 'drop-shadow(0 6px 20px rgba(91,174,47,0.35)) drop-shadow(0 2px 6px rgba(0,0,0,0.4))' }}>
          <LogoMark size={140} />
        </div>
        <div className="text-center">
          <span className="text-[34px] font-bold tracking-tight leading-none">
            <span
              style={{
                background: 'linear-gradient(180deg, #FFFFFF 0%, #C8D2D9 55%, #97A7B3 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              ENER
            </span>
            <span
              style={{
                background: `linear-gradient(180deg, ${GREEN_LIGHT} 0%, ${GREEN} 60%, #3D7A1F 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              PETROL
            </span>
          </span>
        </div>
        <p className="text-xs uppercase tracking-[0.15em] text-center mt-2" style={{ color: '#A7B4BD' }}>
          Conectamos consumidores. Generamos ahorro.
        </p>

        <div
          className="mt-9 rounded-2xl px-5 py-4 max-w-xs text-center"
          style={{
            background: 'linear-gradient(145deg, rgba(255,255,255,0.09), rgba(255,255,255,0.03))',
            border: '1px solid rgba(255,255,255,0.14)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15), 0 4px 12px rgba(0,0,0,0.2)',
          }}
        >
          <p className="text-sm" style={{ color: '#EEF1F3' }}>
            Juntos consumimos más, juntos ahorramos más.
          </p>
          <p className="text-xs mt-1.5" style={{ color: GREEN_LIGHT }}>
            ¿Te gusta la app? Recomiéndanos a un amigo 🚗💚
          </p>
        </div>
      </div>

      <div className="w-full max-w-xs relative z-10 space-y-3">
        <button
          onClick={onContinuar}
          className="w-full rounded-xl py-3.5 text-sm font-semibold"
          style={{
            background: `linear-gradient(180deg, ${GREEN_LIGHT} 0%, ${GREEN} 55%, #3D7A1F 100%)`,
            color: '#0B1A12',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4), 0 4px 14px rgba(91,174,47,0.35)',
          }}
        >
          Comenzar
        </button>
        <div className="flex items-center justify-center gap-4">
          <a
            href="https://wa.me/50487401299"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 py-2 text-xs"
            style={{ color: '#A7B4BD' }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="#25D366">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-1.732-.866-2.866-1.548-4.005-3.512-.302-.52.302-.482.864-1.604.095-.198.048-.371-.05-.52-.099-.148-.644-1.557-.882-2.129-.234-.564-.474-.487-.65-.495-.166-.008-.358-.01-.55-.01-.193 0-.504.073-.77.367-.265.297-1.012 1.014-1.012 2.504 0 1.49 1.005 2.93 1.145 3.13.14.198 1.957 3.1 4.86 4.222 2.408.913 2.906.733 3.435.687.528-.046 1.758-.72 2.005-1.413.247-.694.247-1.288.173-1.413-.075-.124-.273-.198-.57-.347z" />
              <path d="M12.05 0C5.495 0 .16 5.335.16 11.892c0 2.252.628 4.357 1.716 6.155L0 24l6.106-1.84a11.84 11.84 0 0 0 5.944 1.59h.005c6.554 0 11.89-5.336 11.89-11.893S18.604 0 12.05 0zm0 21.62a9.7 9.7 0 0 1-4.964-1.362l-.356-.213-3.7 1.114 1.13-3.604-.232-.37a9.66 9.66 0 0 1-1.495-5.293c0-5.355 4.36-9.715 9.722-9.715 5.36 0 9.72 4.36 9.72 9.715 0 5.356-4.36 9.728-9.825 9.728z" />
            </svg>
            WhatsApp
          </a>
          <span style={{ color: 'rgba(255,255,255,0.15)' }}>|</span>
          <a
            href="mailto:ventaspublicalle@gmail.com?subject=Consulta%20Enerpetrol"
            className="flex items-center gap-1.5 py-2 text-xs"
            style={{ color: '#A7B4BD' }}
          >
            Escríbenos por correo
          </a>
        </div>
      </div>
    </div>
  )
}
