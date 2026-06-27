export const NAVY = '#0F2A4A'
export const NAVY_SOFT = '#274463'
export const GREEN = '#5BAE2F'
export const GREEN_LIGHT = '#8FCB4D'
export const BG = '#F7F8FA'
export const CARD = '#FFFFFF'
export const BORDER = '#E3E7EB'
export const TEXT_MUTED = '#6B7785'

// Meta de negocio: ganancia de L 1 por galón consumido en la red
export const META_GALONES_MENSUAL = 100000
export const GANANCIA_POR_GALON = 1

// Código fijo, igual en todas las tarjetas, para solicitar descuento en gasolinera
export const CODIGO_DESCUENTO_FIJO = '0801-1978-104704'

// Umbral de puntos para activar la alerta de canje disponible.
// Cambia este número cuando decidas la regla definitiva de tu programa de puntos.
export const UMBRAL_PUNTOS_CANJE = 100

// Valor en Lempiras de cada punto al momento de canjear.
// Se calcula como el 15% de la ganancia de L 1 por galón (L 0.15 por punto).
export const VALOR_POR_PUNTO = 0.15

// Programa de puntos: el negocio destina un % de su ganancia por galón al valor de canje.
// Ganancia por galón: L 1.00. Porcentaje destinado a puntos: 15% => L 0.15 por punto.
export const PORCENTAJE_VALOR_PUNTOS = 0.15
export const VALOR_POR_PUNTO = GANANCIA_POR_GALON * PORCENTAJE_VALOR_PUNTOS

// Lista centralizada de ciudades donde opera la red Enerpetrol.
// Agregar una ciudad nueva aquí la habilita automáticamente en registro,
// mapa de estaciones, y panel de administrador.
export const CIUDADES = [
  'Tegucigalpa',
  'San Pedro Sula',
  'Puerto Cortes',
  'Choloma',
  'La Ceiba',
  'Yoro',
  'La Esperanza',
  'Choluteca',
  'Danli',
  'El Paraiso',
  'San Marcos de Colon',
  'Trojes',
  'Patuca',
]
