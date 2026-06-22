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
  //   • Error angular vertical:    r6  (positivo → calzar patas DELANTERAS)
  //   • Error angular horizontal:  r9 - r3  (positivo → mover patas traseras a la derecha)
  const tirAxial = reading.runoutAxial
  const pAxial = runoutPriority(tirAxial, RUNOUT_THRESHOLDS.axial_warning, RUNOUT_THRESHOLDS.axial_critical)
  if (pAxial !== null) {
    const urgencyAxial = pAxial === 1 ? 'CRÍTICO' : pAxial === 2 ? 'elevado' : 'leve'

    if (reading.runoutAxialReadings) {
      const { r6, r3, r9 } = reading.runoutAxialReadings as RunoutReadings
      const DEAD_BAND = 5  // µm — ignorar errores menores al ruido de medición

      // ── Error angular en plano vertical (12h / 6h) ──
      // Convención (facts.md): r6 < 0 → estrecho/menor distancia en 6h →
      //   calzar patas TRASERAS (preferido) o retirar calzas delanteras.
      // r6 > 0 → mayor distancia en 6h → calzar patas DELANTERAS.
      if (Math.abs(r6) > DEAD_BAND) {
        const patas: PataLocation[] = r6 > 0
          ? ['front-left', 'front-right']  // frente bajo → calzar delanteras
          : ['back-left', 'back-right']    // trasera baja → calzar traseras
        const shimLabel = r6 > 0 ? 'patas delanteras' : 'patas traseras'
        patas.forEach(loc => corrections.push({
          id: `axial-v-${loc}`, location: loc, direction: 'vertical', side: 'top',
          magnitude: Math.abs(r6), unit: 'µm', priority: pAxial,
          description: `Runout axial ${urgencyAxial}: calzar ${shimLabel} — agregar calzas ${Math.abs(r6).toFixed(0)} µm`,
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
  //   • vComp = -r6 → componente vertical de desplazamiento del centro
  //   • hComp = r3 - r9 → componente horizontal
  // Constraint geométrica: para cualquier lectura válida → 12h+6h = 3h+9h.
  // Si vComp≈0 y hComp≈0 pero TIR>0, las lecturas son incoherentes.
  const tirRadial = reading.runoutRadial
  const pRadial = runoutPriority(tirRadial, RUNOUT_THRESHOLDS.radial_warning, RUNOUT_THRESHOLDS.radial_critical)
  if (pRadial !== null) {
    const urgencyRadial = pRadial === 1 ? 'CRÍTICO' : pRadial === 2 ? 'elevado' : 'leve'
    const halfTir = tirRadial / 2
    const DEAD_BAND = 5  // µm

    const { r12 = 0, r6, r3, r9 } = reading.runoutRadialReadings as RunoutReadings
    const vComp = -r6
    const hComp = r3 - r9

    // Verificar coherencia geométrica: 12h+6h debe ser igual a 3h+9h
    const consistency = Math.abs((r12 + r6) - (r3 + r9))
    const isIncoherent = Math.abs(vComp) <= DEAD_BAND && Math.abs(hComp) <= DEAD_BAND

    if (isIncoherent) {
      corrections.push({
        id: 'radial-incoherencia', location: 'shaft', direction: 'axial', side: 'front',
        magnitude: tirRadial, unit: 'µm', priority: pRadial,
        description: `Runout radial ${urgencyRadial}: ⚠ lecturas incoherentes — TIR ${tirRadial.toFixed(0)} µm sin dirección determinable (12h+6h ≠ 3h+9h, Δ=${consistency.toFixed(0)} µm). Verificar colocación del reloj, deformidad del acople o error de medición.`,
      })
    } else {
      const isVertical = Math.abs(vComp) >= Math.abs(hComp)
      const side = isVertical
        ? (vComp >= 0 ? 'top' : 'bottom')
        : (hComp >= 0 ? 'right' : 'left')
      const direction = isVertical ? 'vertical' : 'horizontal'
      const moveLabel: Record<string, string> = { top: 'arriba', bottom: 'abajo', left: 'izquierda', right: 'derecha' }

      const allPatas: PataLocation[] = ['front-left', 'front-right', 'back-left', 'back-right']
      allPatas.forEach(loc => {
        corrections.push({
          id: `radial-${loc}`, location: loc, direction, side,
          magnitude: halfTir, unit: 'µm', priority: pRadial,
          description: `Runout radial ${urgencyRadial}: mover motor hacia ${moveLabel[side]} — ${halfTir.toFixed(0)} µm equitativo en las 4 patas`,
        })
      })
    }
  }

  return corrections.sort((a, b) => a.priority - b.priority)
}
