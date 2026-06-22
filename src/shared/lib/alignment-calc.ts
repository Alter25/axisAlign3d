import type { ReadingData, AlignmentCorrection, PataLocation, RunoutReadings } from '../types/alignment'
import { RUNOUT_THRESHOLDS } from './constants'

const DEAD = 5  // µm — ignorar ruido de medición

function runoutPriority(tir: number, warning: number, critical: number): 1 | 2 | 3 | null {
  if (tir <= 0) return null
  if (tir > critical) return 1
  if (tir > warning)  return 2
  return 3
}

function maxPriority(a: 1 | 2 | 3 | null, b: 1 | 2 | 3 | null): 1 | 2 | 3 {
  const vals = [a, b].filter((v): v is 1 | 2 | 3 => v !== null)
  if (vals.length === 0) return 3
  return Math.min(...vals) as 1 | 2 | 3
}

function urgency(p: 1 | 2 | 3): string {
  return p === 1 ? 'CRITICO' : p === 2 ? 'elevado' : 'leve'
}

export function calculateCorrections(reading: ReadingData): AlignmentCorrection[] {
  const corrections: AlignmentCorrection[] = []

  // ── Lecturas axiales ──────────────────────────────────────────────────────
  const tirAxial = reading.runoutAxial
  const pAxial   = runoutPriority(tirAxial, RUNOUT_THRESHOLDS.axial_warning, RUNOUT_THRESHOLDS.axial_critical)
  const axR      = reading.runoutAxialReadings as RunoutReadings | undefined
  // r6 > 0 => mayor distancia en 6h => calzar patas DELANTERAS (raise front)
  const ax_r6    = axR ? (axR.r6  ?? 0) : 0
  // ax_hErr = r9 - r3 > 0 => patas traseras a la derecha
  const ax_hErr  = axR ? ((axR.r9 ?? 0) - (axR.r3 ?? 0)) : 0

  // ── Lecturas radiales ─────────────────────────────────────────────────────
  const tirRadial = reading.runoutRadial
  const pRadial   = runoutPriority(tirRadial, RUNOUT_THRESHOLDS.radial_warning, RUNOUT_THRESHOLDS.radial_critical)
  const rdR       = reading.runoutRadialReadings as RunoutReadings | undefined

  // vComp = -r6 > 0 => necesita subir motor; hComp = r3-r9 > 0 => mover a la derecha
  const rd_vComp  = rdR ? -rdR.r6 : 0
  const rd_hComp  = rdR ? ((rdR.r3 ?? 0) - (rdR.r9 ?? 0)) : 0
  const rdIncoherent = rdR
    ? (Math.abs(rd_vComp) <= DEAD && Math.abs(rd_hComp) <= DEAD)
    : false

  // ── Caso: radial incoherente ───────────────────────────────────────────────
  if (pRadial !== null && rdR && rdIncoherent) {
    const r12 = rdR.r12 ?? 0
    const consistency = Math.abs((r12 + rdR.r6) - ((rdR.r3 ?? 0) + (rdR.r9 ?? 0)))
    corrections.push({
      id: 'radial-incoherencia', location: 'shaft', direction: 'axial', side: 'front',
      magnitude: tirRadial, unit: 'µm', priority: pRadial,
      description: `Runout radial ${urgency(pRadial)}: lecturas incoherentes — TIR ${tirRadial.toFixed(0)} um sin direction determinable (12h+6h != 3h+9h, D=${consistency.toFixed(0)} um). Verificar colocacion del reloj, deformidad del acople o error de medicion.`,
    })
  }

  // ── Caso: axial sin lecturas individuales ─────────────────────────────────
  if (pAxial !== null && !axR) {
    corrections.push({
      id: 'axial-generic', location: 'shaft', direction: 'axial', side: 'front',
      magnitude: tirAxial, unit: 'µm', priority: pAxial,
      description: `Runout axial ${urgency(pAxial)}: ${tirAxial.toFixed(0)} um — revisar cara del acople y fijacion axial.`,
    })
  }

  // ── Factores de geometria ─────────────────────────────────────────────────
  // Correccion axial exacta (Rim & Face):
  //   C_front = radV + ax_r6 * dF/D
  //   C_back  = radV + ax_r6 * dB/D
  //
  // Ambos pares reciben la componente angular, proporcional a su distancia al acople.
  // Sin geometria: aproximacion — solo un par recibe la correccion axial.
  const geo = reading.geometry
  const hasGeo = !!(geo && geo.D > 0 && geo.dF > 0 && geo.dB > geo.dF)
  const factorF = hasGeo ? geo!.dF / geo!.D : null   // dF/D
  const factorB = hasGeo ? geo!.dB / geo!.D : null   // dB/D

  // ── Correcciones verticales combinadas ────────────────────────────────────
  const hasRadialV = pRadial !== null && rdR && !rdIncoherent && Math.abs(rd_vComp) > DEAD
  const hasAxialV  = pAxial  !== null && axR  && Math.abs(ax_r6)   > DEAD

  if (hasRadialV || hasAxialV) {
    const radV = hasRadialV ? rd_vComp / 2 : 0

    // Contribucion axial a cada par segun geometria
    let axFrontV: number, axBackV: number
    if (hasAxialV && hasGeo) {
      axFrontV = ax_r6 * factorF!   // escalado por dF/D
      axBackV  = ax_r6 * factorB!   // escalado por dB/D
    } else if (hasAxialV) {
      axFrontV = ax_r6 > 0 ? ax_r6 : 0   // aprox: solo el par que sube
      axBackV  = ax_r6 < 0 ? -ax_r6 : 0
    } else {
      axFrontV = 0; axBackV = 0
    }

    const frontNet = radV + axFrontV
    const backNet  = radV + axBackV
    const pV       = maxPriority(hasRadialV ? pRadial : null, hasAxialV ? pAxial : null)

    const emitVertical = (net: number, locs: PataLocation[], isFront: boolean) => {
      if (Math.abs(net) <= DEAD) return
      const side   = net > 0 ? 'top' as const : 'bottom' as const
      const action = net > 0 ? 'agregar calzas' : 'quitar calzas'
      const label  = isFront ? 'patas delanteras' : 'patas traseras'
      const axPart = isFront ? axFrontV : axBackV
      const factor = isFront ? factorF : factorB

      let src: string
      if (hasRadialV && hasAxialV) {
        if (Math.abs(axPart) > DEAD) {
          const signR = radV >= 0 ? 'up' : 'down'
          const signA = axPart >= 0 ? 'up' : 'down'
          const factorStr = hasGeo ? ` (factor ${factor!.toFixed(2)})` : ' (aprox.)'
          src = ` — radial ${signR} ${Math.abs(radV).toFixed(0)} + axial ${signA} ${Math.abs(axPart).toFixed(0)} um${factorStr}`
        } else {
          src = ` — solo radial; axial compensado en este par`
        }
      } else if (hasAxialV) {
        src = hasGeo
          ? ` — axial angular (dF/D=${factorF!.toFixed(2)}, dB/D=${factorB!.toFixed(2)})`
          : ` — correccion axial angular (sin geometria: aprox.)`
      } else {
        src = ` — correccion radial`
      }

      locs.forEach(loc => corrections.push({
        id: `v-${loc}`, location: loc, direction: 'vertical', side,
        magnitude: Math.abs(net), unit: 'µm', priority: pV,
        description: `Correccion vertical ${urgency(pV)}: ${action} ${Math.abs(net).toFixed(0)} um en ${label}${src}`,
      }))
    }

    emitVertical(frontNet, ['front-left', 'front-right'], true)
    emitVertical(backNet,  ['back-left',  'back-right'],  false)
  }

  // ── Correcciones horizontales combinadas ──────────────────────────────────
  const hasRadialH = pRadial !== null && rdR && !rdIncoherent && Math.abs(rd_hComp) > DEAD
  const hasAxialH  = pAxial  !== null && axR  && Math.abs(ax_hErr)  > DEAD

  if (hasRadialH || hasAxialH) {
    const radH = hasRadialH ? rd_hComp / 2 : 0

    let axFrontH: number, axBackH: number
    if (hasAxialH && hasGeo) {
      axFrontH = ax_hErr * factorF!
      axBackH  = ax_hErr * factorB!
    } else if (hasAxialH) {
      axFrontH = 0
      axBackH  = ax_hErr
    } else {
      axFrontH = 0; axBackH = 0
    }

    const frontNet = radH + axFrontH
    const backNet  = radH + axBackH
    const pH       = maxPriority(hasRadialH ? pRadial : null, hasAxialH ? pAxial : null)

    const emitHorizontal = (net: number, locs: PataLocation[], isFront: boolean) => {
      if (Math.abs(net) <= DEAD) return
      const side   = net > 0 ? 'right' as const : 'left' as const
      const action = net > 0 ? 'mover a la derecha' : 'mover a la izquierda'
      const label  = isFront ? 'patas delanteras' : 'patas traseras'
      const axPart = isFront ? axFrontH : axBackH
      const factor = isFront ? factorF : factorB

      let src: string
      if (hasRadialH && hasAxialH) {
        if (Math.abs(axPart) > DEAD) {
          const factorStr = hasGeo ? ` (factor ${factor!.toFixed(2)})` : ' (aprox.)'
          src = ` — radial ${Math.abs(radH).toFixed(0)} + axial ${Math.abs(axPart).toFixed(0)} um${factorStr}`
        } else {
          src = ` — solo radial; axial compensado en este par`
        }
      } else if (hasAxialH) {
        src = hasGeo
          ? ` — axial angular (factor ${factor!.toFixed(2)})`
          : ` — correccion axial angular (sin geometria: aprox.)`
      } else {
        src = ` — correccion radial`
      }

      locs.forEach(loc => corrections.push({
        id: `h-${loc}`, location: loc, direction: 'horizontal', side,
        magnitude: Math.abs(net), unit: 'µm', priority: pH,
        description: `Correccion horizontal ${urgency(pH)}: ${action} ${Math.abs(net).toFixed(0)} um — ${label}${src}`,
      }))
    }

    emitHorizontal(frontNet, ['front-left', 'front-right'], true)
    emitHorizontal(backNet,  ['back-left',  'back-right'],  false)
  }

  // ── Axial: ambos planos en banda muerta pero TIR supera umbral ────────────
  if (pAxial !== null && axR && Math.abs(ax_r6) <= DEAD && Math.abs(ax_hErr) <= DEAD) {
    corrections.push({
      id: 'axial-generic', location: 'shaft', direction: 'axial', side: 'front',
      magnitude: tirAxial, unit: 'µm', priority: pAxial,
      description: `Runout axial ${urgency(pAxial)}: ${tirAxial.toFixed(0)} um — revisar montaje del reloj y cara del acople.`,
    })
  }

  return corrections.sort((a, b) => a.priority - b.priority)
}
