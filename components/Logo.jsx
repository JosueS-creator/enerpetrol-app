import React from 'react'
import { NAVY, GREEN } from '../theme'

export function LogoMark({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none">
      <path
        d="M 100 14 A 86 86 0 1 1 27 146"
        stroke={GREEN}
        strokeWidth="13"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 64 56 H 132 L 108 88 H 128 V 102 H 88 V 128 H 132 V 142 H 64 Z"
        fill={NAVY}
      />
      <path
        d="M 128 88 C 140 100 140 118 128 128 C 116 118 116 100 128 88 Z"
        fill={GREEN}
      />
      <g fill={NAVY}>
        <circle cx="60" cy="150" r="9" />
        <path d="M 47 176 a 13 16 0 0 1 26 0 Z" />
        <circle cx="84" cy="144" r="10.5" />
        <path d="M 69 174 a 15 18 0 0 1 30 0 Z" />
        <circle cx="112" cy="144" r="10.5" />
        <path d="M 97 174 a 15 18 0 0 1 30 0 Z" />
        <circle cx="138" cy="150" r="9" />
        <path d="M 125 176 a 13 16 0 0 1 26 0 Z" />
      </g>
    </svg>
  )
}

export function IconoSurtidor({ size = 40, color = '#7C8A93' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.4">
      <rect x="4" y="4" width="9" height="16" rx="1.2" />
      <rect x="6" y="6.5" width="5" height="4" rx="0.4" />
      <line x1="6" y1="14" x2="11" y2="14" />
      <path d="M13 8 h2.2 a1.5 1.5 0 0 1 1.5 1.5 V17 a1.3 1.3 0 0 0 1.3 1.3 a1.3 1.3 0 0 0 1.3 -1.3 v-5.5 l-1.8 -1.8" />
      <circle cx="17.8" cy="9" r="0.9" fill={color} stroke="none" />
      <path d="M5.5 1.5 C 7 3 7 4.5 5.5 6 C 4 4.5 4 3 5.5 1.5 Z" fill={GREEN} stroke="none" />
    </svg>
  )
}
