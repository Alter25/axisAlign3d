import type { ReadingData, AlignmentCorrection, PataLocation, RunoutReadings } from '../types/alignment'
import { ISO_10816_THRESHOLDS, RUNOUT_THRESHOLDS, TEMP_THRESHOLDS } from './constants'

const PATAS: PataLocation[] = ['front-left', 'front-right', 'back-left', 'back-right']

const PATA_LABELS: Record<PataLocation, string> = {
  'front-left':  'pata delantera izquierda',
  'front-right': 'pata delantera derecha',
  'back-left':   'pata trasera izquierda',
  'back-right':  'pata trasera derecha',
}

function toRad(deg: number) { return (deg * Math.PI) / 180 }

function getPriority(v: number): 1 | 2 | 3 | null {
  if (v > ISO_10816_THRESHOLDS.zone_d) return 1
  if (v > ISO_10816_THRESHOLDS.zone_c) return 2
  if (v > ISO_10816_THRESHOLDS.zone_b) return 3
  return null
}

export function calculateCorrections(reading: ReadingData): AlignmentCorrection[] {
  const corrections: AlignmentCorrection[] = []

  // ── Vibración vertical → shimming (Y) en las 4 patas ──────────────────────
  // La fase determina qué par de patas necesita más corrección.
  // vAdjY > 0: motor desplazado hacia arriba → patas deben bajar (agregar shims → side: bottom)
  // vAdjY < 0: motor desplazado hacia abajo → patas deben subir (quitar shims → side: top)
  // vAdjX > 0: desplazamiento mayor en patas frontales; < 0: en patas traseras
  if (reading.verticalVibration !== undefined) {
    const vPhaseRad = toRad(reading.verticalPhase ?? 0)
    const vAdjY = Math.cos(vPhaseRad) * reading.verticalVibration
    const vAdjX = Math.sin(vPhaseRad) * reading.verticalVibration
    const priority = getPriority(reading.verticalVibration)
    if (priority !== null) {
      const side = vAdjY > 0 ? 'bottom' : 'top'
      const sideLabel = side === 'bottom' ? 'agregar shims' : 'quitar shims'
      const urgency = priority === 1 ? 'CRÍTICO' : priority === 2 ? 'advertencia' : 'revisión'

      // Patas más afectadas según fase
      const primaryPatas: PataLocation[] = vAdjX > 0
        ? ['front-left', 'front-right']
        : ['back-left', 'back-right']

      primaryPatas.forEach(loc => {
        corrections.push({
          id: `v-${loc}`, location: loc, direction: 'vertical', side,
          magnitude: Math.abs(reading.verticalVibration!), unit: 'mm/s', priority,
          description: `${urgency.toUpperCase()} — ${PATA_LABELS[loc]}: ${sideLabel} (${Math.abs(reading.verticalVibration!).toFixed(1)} mm/s)`,
        })
      })

      const secondaryPriority = Math.min(priority + 1, 3) as 1 | 2 | 3
      const secondaryPatas: PataLocation[] = vAdjX > 0
        ? ['back-left', 'back-right']
        : ['front-left', 'front-right']

      secondaryPatas.forEach(loc => {
        corrections.push({
          id: `v-sec-${loc}`, location: loc, direction: 'vertical', side,
          magnitude: Math.abs(reading.verticalVibration!) * 0.6, unit: 'mm/s', priority: secondaryPriority,
          description: `Verificar ${PATA_LABELS[loc]}: ${sideLabel}`,
        })
      })
    }
  }

  // ── Vibración horizontal → desplazamiento lateral (X) en las 4 patas ──────
  // hAdjY > 0: motor desplazado hacia la derecha → patas deben ir a la izquierda (side: left)
  // hAdjY < 0: motor desplazado hacia la izquierda → patas deben ir a la derecha (side: right)
  if (reading.horizontalVibration !== undefined) {
    const hPhaseRad = toRad(reading.horizontalPhase ?? 0)
    const hAdjY = Math.cos(hPhaseRad) * reading.horizontalVibration
    const priority = getPriority(reading.horizontalVibration)
    if (priority !== null) {
      const side = hAdjY > 0 ? 'left' : 'right'
      const sideLabel = side === 'left' ? 'izquierda' : 'derecha'
      const urgency = priority === 1 ? 'CRÍTICO' : priority === 2 ? 'advertencia' : 'revisión'

      PATAS.forEach(loc => {
        corrections.push({
          id: `h-${loc}`, location: loc, direction: 'horizontal', side,
          magnitude: Math.abs(reading.horizontalVibration!), unit: 'mm/s', priority,
          description: `${urgency.toUpperCase()} — ${PATA_LABELS[loc]}: mover hacia ${sideLabel} (${Math.abs(reading.horizontalVibration!).toFixed(1)} mm/s)`,
        })
      })
    }
  }

  // ── Runout axial (cara del acople) ────────────────────────────────────────
  // La cara del acople es una superficie plana → las 4 lecturas del reloj determinan
  // el plano de error angular. Con 12h=0 de referencia:
  //   • Error angular vertical:    r6  (skill paso 5: positivo → calzar patas traseras)
  //   • Error angular horizontal:  r9 - r3  (skill paso 7: positivo → mover patas traseras a la derecha)
  const tirAxial = reading.runoutAxial
  if (tirAxial > RUNOUT_THRESHOLDS.axial_warning) {
    const pAxial: 1 | 2 = tirAxial > RUNOUT_THRESHOLDS.axial_critical ? 1 : 2
    const urgencyAxial = pAxial === 1 ? 'CRÍTICO' : 'elevado'

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
  if (tirRadial > RUNOUT_THRESHOLDS.radial_warning) {
    const pRadial: 1 | 2 = tirRadial > RUNOUT_THRESHOLDS.radial_critical ? 1 : 2
    const urgencyRadial = pRadial === 1 ? 'CRÍTICO' : 'elevado'

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

  // ── Temperatura de rodamientos ─────────────────────────────────────────────
  if (reading.bearingTemperature !== undefined) {
    if (reading.bearingTemperature > TEMP_THRESHOLDS.critical) {
      corrections.push({
        id: 'temp-critical', location: 'shaft', direction: 'vertical', side: 'top',
        magnitude: reading.bearingTemperature, unit: '°C', priority: 1,
        description: `Temperatura CRÍTICA: ${reading.bearingTemperature}°C — parar equipo inmediatamente.`,
      })
    } else if (reading.bearingTemperature > TEMP_THRESHOLDS.warning) {
      corrections.push({
        id: 'temp-warning', location: 'shaft', direction: 'vertical', side: 'top',
        magnitude: reading.bearingTemperature, unit: '°C', priority: 2,
        description: `Temperatura elevada: ${reading.bearingTemperature}°C — programar revisión.`,
      })
    }
  }

  return corrections.sort((a, b) => a.priority - b.priority)
}
