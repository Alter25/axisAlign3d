import type { ReadingData, AlignmentCorrection, PataLocation, RunoutReadings } from '../types/alignment'
import { RUNOUT_THRESHOLDS } from './constants'

function runoutPriority(tir: number, warning: number, critical: number): 1 | 2 | 3 | null {
  if (tir <= 0) return null
  if (tir > critical) return 1
  if (tir > warning)  return 2
  return 3
}

export function calculateCorrections(reading: ReadingData): AlignmentCorrection[] {
  const corrections: AlignmentCorrection[] = []

  // ── Runout axial (cara del acople) ────────────────────────────────────────
  // La cara del acople es una superficie plana → las 4 lecturas del reloj determinan
  // el plano de error angular. Con 12h=0 de referencia:
  //   • Error angular vertical:    r6  (skill paso 5: positivo → calzar patas traseras)
  //   • Error angular horizontal:  r9 - r3  (skill paso 7: positivo → mover patas traseras a la derecha)
  const tirAxial = reading.runoutAxial
  const pAxial = runoutPriority(tirAxial, RUNOUT_THRESHOLDS.axial_warning, RUNOUT_THRESHOLDS.axial_critical)
  if (pAxial !== null) {
    const urgencyAxial = pAxial === 1 ? 'CRÍTICO' : pAxial === 2 ? 'elevado' : 'leve'

    if (reading.runoutAxialReadings) {
      const { r6, r3, r9 } = reading.runoutAxialReadings as RunoutReadings
      const DEAD_BAND = 5  // µm — ignorar errores menores al ruido de medición

      // ── Error angular en plano vertical (12h / 6h) ──
      if (Math.abs(r6) > DEAD_BAND) {
        const patas: PataLocation[] = r6 > 0
          ? ['back-left', 'back-right']    // r6 > 0: cara cierra abajo → calzar patas traseras
          : ['front-left', 'front-right']  // r6 < 0: cara cierra arriba → calzar patas delanteras
        const shimLabel = r6 > 0 ? 'patas traseras' : 'patas delanteras'
        patas.forEach(loc => corrections.push({
          id: `axial-v-${loc}`, location: loc, direction: 'vertical', side: 'bottom',
          magnitude: Math.abs(r6), unit: 'µm', priority: pAxial,
          description: `Runout axial ${urgencyAxial}: calzar ${shimLabel} — error angular vertical ${r6.toFixed(0)} µm (cara acople)`,
        }))
      }

      // ── Error angular en plano horizontal (3h / 9h) ──
      const hError = r9 - r3  // skill paso 7: positivo → parte trasera del motor a la derecha
      if (Math.abs(hError) > DEAD_BAND) {
        const hSide = hError > 0 ? 'right' : 'left'
        const hLabel = hSide === 'right' ? 'derecha' : 'izquierda';
        (['back-left', 'back-right'] as PataLocation[]).forEach(loc => corrections.push({
          id: `axial-h-${loc}`, location: loc, direction: 'horizontal', side: hSide,
          magnitude: Math.abs(hError), unit: 'µm', priority: pAxial,
          description: `Runout axial ${urgencyAxial}: desplazar patas traseras a la ${hLabel} — error angular horizontal ${Math.abs(hError).toFixed(0)} µm`,
        }))
      }

      // Si ambos planos son despreciables pero el TIR supera umbral: mostrar flecha axial genérica
      if (Math.abs(r6) <= DEAD_BAND && Math.abs(r9 - r3) <= DEAD_BAND) {
        corrections.push({
          id: 'axial-generic', location: 'shaft', direction: 'axial', side: 'front',
          magnitude: tirAxial, unit: 'µm', priority: pAxial,
          description: `Runout axial ${urgencyAxial}: ${tirAxial.toFixed(0)} µm — revisar montaje del reloj y cara del acople.`,
        })
      }
    } else {
      // Sin lecturas individuales: flecha genérica en el acople
      corrections.push({
        id: 'axial-generic', location: 'shaft', direction: 'axial', side: 'front',
        magnitude: tirAxial, unit: 'µm', priority: pAxial,
        description: `Runout axial ${urgencyAxial}: ${tirAxial.toFixed(0)} µm — revisar cara del acople y fijación axial.`,
      })
    }
  }

  // ── Runout radial (diámetro del acople) ───────────────────────────────────
  // La excentricidad radial es sinusoidal. Con 12h=0:
  //   • r6 < 0 → centro del acople desplazado hacia 12h (arriba) → excentricidad vertical
  //   • r3 / r9 → componente lateral de excentricidad
  const tirRadial = reading.runoutRadial
  const pRadial = runoutPriority(tirRadial, RUNOUT_THRESHOLDS.radial_warning, RUNOUT_THRESHOLDS.radial_critical)
  if (pRadial !== null) {
    const urgencyRadial = pRadial === 1 ? 'CRÍTICO' : pRadial === 2 ? 'elevado' : 'leve'

    if (reading.runoutRadialReadings) {
      const { r6, r3, r9 } = reading.runoutRadialReadings as RunoutReadings
      // Componente vertical: r6 negativo → centro desplazado hacia arriba → flecha hacia arriba
      const vComp = -r6  // si r6 < 0, vComp > 0 → flecha top (hacia donde está el centro)
      const hComp = r3 - r9  // positivo → centro hacia 3h → flecha derecha

      const side = Math.abs(vComp) >= Math.abs(hComp)
        ? (vComp >= 0 ? 'top' : 'bottom')
        : (hComp >= 0 ? 'right' : 'left')

      corrections.push({
        id: 'radial-ecc', location: 'shaft', direction: 'vertical', side,
        magnitude: tirRadial, unit: 'µm', priority: pRadial,
        description: `Runout radial ${urgencyRadial}: ${tirRadial.toFixed(0)} µm — excentricidad del acople. Verificar concentricidad en el eje.`,
      })
    } else {
      corrections.push({
        id: 'radial-generic', location: 'shaft', direction: 'vertical', side: 'top',
        magnitude: tirRadial, unit: 'µm', priority: pRadial,
        description: `Runout radial ${urgencyRadial}: ${tirRadial.toFixed(0)} µm — verificar concentricidad del acople.`,
      })
    }
  }

  return corrections.sort((a, b) => a.priority - b.priority)
}
