import type { ReadingData, AlignmentCorrection, PataLocation } from '../types/alignment'
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
          id: `v-${loc}`,
          location: loc,
          direction: 'vertical',
          side,
          magnitude: Math.abs(reading.verticalVibration!),
          priority,
          description: `${urgency.toUpperCase()} — ${PATA_LABELS[loc]}: ${sideLabel} (${Math.abs(reading.verticalVibration!).toFixed(1)} mm/s)`,
        })
      })

      // Patas secundarias (prioridad reducida 1 nivel)
      const secondaryPriority = Math.min(priority + 1, 3) as 1 | 2 | 3
      const secondaryPatas: PataLocation[] = vAdjX > 0
        ? ['back-left', 'back-right']
        : ['front-left', 'front-right']

      secondaryPatas.forEach(loc => {
        corrections.push({
          id: `v-sec-${loc}`,
          location: loc,
          direction: 'vertical',
          side,
          magnitude: Math.abs(reading.verticalVibration!) * 0.6,
          priority: secondaryPriority,
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
          id: `h-${loc}`,
          location: loc,
          direction: 'horizontal',
          side,
          magnitude: Math.abs(reading.horizontalVibration!),
          priority,
          description: `${urgency.toUpperCase()} — ${PATA_LABELS[loc]}: mover hacia ${sideLabel} (${Math.abs(reading.horizontalVibration!).toFixed(1)} mm/s)`,
        })
      })
    }
  }

  // ── Runout axial — solo texto, sin flecha 3D (location: shaft) ────────────
  if (reading.runoutAxial > RUNOUT_THRESHOLDS.axial_critical) {
    corrections.push({
      id: 'axial-critical', location: 'shaft', direction: 'vertical', side: 'top',
      magnitude: reading.runoutAxial, priority: 1,
      description: `Runout axial CRÍTICO: ${reading.runoutAxial} µm — revisar cara del acople y fijación axial.`,
    })
  } else if (reading.runoutAxial > RUNOUT_THRESHOLDS.axial_warning) {
    corrections.push({
      id: 'axial-warning', location: 'shaft', direction: 'vertical', side: 'top',
      magnitude: reading.runoutAxial, priority: 2,
      description: `Runout axial elevado: ${reading.runoutAxial} µm — verificar paralelismo del acople.`,
    })
  }

  // ── Runout radial — solo texto ─────────────────────────────────────────────
  if (reading.runoutRadial > RUNOUT_THRESHOLDS.radial_critical) {
    corrections.push({
      id: 'radial-critical', location: 'shaft', direction: 'horizontal', side: 'right',
      magnitude: reading.runoutRadial, priority: 1,
      description: `Runout radial CRÍTICO: ${reading.runoutRadial} µm — verificar excentricidad del eje.`,
    })
  } else if (reading.runoutRadial > RUNOUT_THRESHOLDS.radial_warning) {
    corrections.push({
      id: 'radial-warning', location: 'shaft', direction: 'horizontal', side: 'right',
      magnitude: reading.runoutRadial, priority: 2,
      description: `Runout radial elevado: ${reading.runoutRadial} µm — verificar concentricidad del acople.`,
    })
  }

  // ── Temperatura de rodamientos — solo texto ────────────────────────────────
  if (reading.bearingTemperature !== undefined) {
    if (reading.bearingTemperature > TEMP_THRESHOLDS.critical) {
      corrections.push({
        id: 'temp-critical', location: 'shaft', direction: 'vertical', side: 'top',
        magnitude: reading.bearingTemperature, priority: 1,
        description: `Temperatura CRÍTICA: ${reading.bearingTemperature}°C — parar equipo inmediatamente.`,
      })
    } else if (reading.bearingTemperature > TEMP_THRESHOLDS.warning) {
      corrections.push({
        id: 'temp-warning', location: 'shaft', direction: 'vertical', side: 'top',
        magnitude: reading.bearingTemperature, priority: 2,
        description: `Temperatura elevada: ${reading.bearingTemperature}°C — programar revisión.`,
      })
    }
  }

  return corrections.sort((a, b) => a.priority - b.priority)
}
