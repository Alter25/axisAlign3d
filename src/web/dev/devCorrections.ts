import type { AlignmentCorrection } from '@/shared/types/alignment'

// 8 flechas de calibración: 4 patas × 2 direcciones (vertical + horizontal)
// side refleja la dirección de la flecha en 3D:
//   vertical top/bottom = shimming (Y)
//   horizontal left/right = desplazamiento lateral (X)
export const DEV_CORRECTIONS: AlignmentCorrection[] = [
  // Pata delantera izquierda
  { id: 'dev-fl-v', location: 'front-left',  direction: 'vertical',   side: 'bottom', magnitude: 12, priority: 1, description: 'DEV · front-left · vertical' },
  { id: 'dev-fl-h', location: 'front-left',  direction: 'horizontal', side: 'right',  magnitude: 8,  priority: 2, description: 'DEV · front-left · horizontal' },
  // Pata delantera derecha
  { id: 'dev-fr-v', location: 'front-right', direction: 'vertical',   side: 'bottom', magnitude: 12, priority: 1, description: 'DEV · front-right · vertical' },
  { id: 'dev-fr-h', location: 'front-right', direction: 'horizontal', side: 'left',   magnitude: 8,  priority: 2, description: 'DEV · front-right · horizontal' },
  // Pata trasera izquierda
  { id: 'dev-bl-v', location: 'back-left',   direction: 'vertical',   side: 'bottom', magnitude: 5,  priority: 3, description: 'DEV · back-left · vertical' },
  { id: 'dev-bl-h', location: 'back-left',   direction: 'horizontal', side: 'right',  magnitude: 9,  priority: 1, description: 'DEV · back-left · horizontal' },
  // Pata trasera derecha
  { id: 'dev-br-v', location: 'back-right',  direction: 'vertical',   side: 'bottom', magnitude: 5,  priority: 3, description: 'DEV · back-right · vertical' },
  { id: 'dev-br-h', location: 'back-right',  direction: 'horizontal', side: 'left',   magnitude: 9,  priority: 2, description: 'DEV · back-right · horizontal' },
  // Movimiento axial del motor
  { id: 'dev-axial', location: 'shaft', direction: 'axial', side: 'back', magnitude: 3, priority: 2, description: 'DEV · mover motor 3mm hacia atrás' },
]
