// Umbrales de runout (micrones)
export const RUNOUT_THRESHOLDS = {
  axial_warning: 50,   // micrones
  axial_critical: 100,
  radial_warning: 30,
  radial_critical: 75,
} as const

// Posición del acople (centro entre ejes motor-bomba) — calibrado en modo DEV
export const AXIAL_ARROW_POSITION: [number, number, number] = [-41.5, 0, -36]

// Eje del equipo — puntos calibrados en modo DEV
export const AXIS_POINTS = {
  x1: [ 237, 0,  243] as [number, number, number],
  x2: [-320, 0, -315] as [number, number, number],
  z:  [ -16, 0,    5] as [number, number, number],
}

// Posiciones de las 4 patas del motor (placeholder — calibrar en modo DEV)
// Eje del eje/acople asumido a lo largo de Z, motor centrado en origen
// front = lado del acople, back = lado trasero
// left/right desde el frente mirando al motor
export const PATA_POSITIONS = {
  'front-left':  [-54.255,  -0.500,  29.311] as [number, number, number],
  'front-right': [ -9.633,  -0.500, -54.944] as [number, number, number],
  'back-left':   [ 38.284,  -0.500, 122.020] as [number, number, number],
  'back-right':  [126.553,  -0.500,  41.481] as [number, number, number],
}

export const DIRECTION_OFFSETS = {
  vertical:   [0, -0.300, 0] as [number, number, number],
  horizontal: [0,  0.000, 0] as [number, number, number],
  axial:      [0,  0.000, 0] as [number, number, number],
}

// Mapa de colores por prioridad
export const PRIORITY_COLORS: Record<1 | 2 | 3, string> = {
  1: '#ef4444', // rojo — crítico
  2: '#eab308', // amarillo — advertencia
  3: '#06b6d4', // cian — info
}
