import { useState, useRef } from 'react';

// Onboarding.jsx
// Pantalla de bienvenida para usuarios nuevos — se muestra una sola vez.
// App.jsx controla cuándo se monta (según localStorage('enp_onboarding'))
// y le pasa la prop `onComplete`, que se llama al terminar o al saltar.
//
// No usa dependencias nuevas: solo React + Tailwind.

const PASOS = [
  {
    numero: 1,
    icono: '👤',
    titulo: 'Crea tu cuenta',
    texto: 'Regístrate en segundos y activa tu tarjeta digital de descuentos.',
  },
  {
    numero: 2,
    icono: '📍',
    titulo: 'Localiza tu estación más cercana',
    texto: 'Encuentra en el mapa la estación Enerpetrol más cercana a ti.',
  },
  {
    numero: 3,
    icono: '🪪',
    titulo: 'Presenta tu tarjeta digital',
    texto: 'Muestra tu tarjeta digital al bombero al momento de cargar combustible.',
  },
  {
    numero: 4,
    icono: '📸',
    titulo: 'Sube tu factura',
    texto: 'Tómale foto a tu factura con la cámara de la app y súbela.',
  },
  {
    numero: 5,
    icono: '🪙',
    titulo: 'Gana Enermonedas',
    texto: 'Acumula Enermonedas con cada carga y canjéalas por premios.',
  },
];

export default function Onboarding({ onComplete }) {
  const [paso, setPaso] = useState(0);
  const touchStartX = useRef(null);

  const esUltimo = paso === PASOS.length - 1;

  const siguiente = () => {
    if (esUltimo) {
      onComplete?.();
    } else {
      setPaso((p) => p + 1);
    }
  };

  const anterior = () => {
    if (paso > 0) setPaso((p) => p - 1);
  };

  const omitir = () => {
    onComplete?.();
  };

  // Swipe táctil simple, sin dependencias
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const UMBRAL = 40;
    if (deltaX < -UMBRAL) siguiente();
    else if (deltaX > UMBRAL) anterior();
    touchStartX.current = null;
  };

  const actual = PASOS[paso];

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-[#0F2A4A]"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Botón Omitir */}
      <div className="flex justify-end px-5 pt-5">
        {!esUltimo && (
          <button
            onClick={omitir}
            className="text-sm font-medium text-white/70 hover:text-white transition-colors"
          >
            Omitir
          </button>
        )}
      </div>

      {/* Contenido central */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <div className="mb-2 text-xs font-bold tracking-widest text-[#8FCB4D]">
          ENERPETROL
        </div>

        <div
          key={actual.numero}
          className="flex h-28 w-28 items-center justify-center rounded-full bg-white/10 border-2 border-[#5BAE2F] text-5xl mb-6 animate-[fadeIn_0.3s_ease]"
        >
          {actual.icono}
        </div>

        <div className="flex items-center gap-2 mb-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#5BAE2F] text-sm font-bold text-white">
            {actual.numero}
          </span>
          <h2 className="text-xl font-bold text-white">{actual.titulo}</h2>
        </div>

        <p className="max-w-xs text-sm leading-relaxed text-white/80">
          {actual.texto}
        </p>
      </div>

      {/* Indicador de progreso (puntos) */}
      <div className="flex justify-center gap-2 pb-6">
        {PASOS.map((p, i) => (
          <button
            key={p.numero}
            onClick={() => setPaso(i)}
            aria-label={`Ir al paso ${i + 1}`}
            className={`h-2 rounded-full transition-all ${
              i === paso ? 'w-6 bg-[#5BAE2F]' : 'w-2 bg-white/30'
            }`}
          />
        ))}
      </div>

      {/* Botones inferiores */}
      <div className="flex items-center gap-3 px-6 pb-8">
        {paso > 0 && (
          <button
            onClick={anterior}
            className="flex-1 rounded-xl border border-white/20 py-3 text-sm font-semibold text-white/80 active:scale-95 transition-transform"
          >
            Atrás
          </button>
        )}
        <button
          onClick={siguiente}
          className="flex-[2] rounded-xl bg-[#5BAE2F] py-3 text-sm font-bold text-white shadow-lg active:scale-95 transition-transform"
        >
          {esUltimo ? '¡Empezar a ahorrar!' : 'Siguiente'}
        </button>
      </div>
    </div>
  );
}
