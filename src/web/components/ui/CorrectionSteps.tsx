import type { AlignmentCorrection } from '@/shared/types/alignment'
import { PRIORITY_COLORS } from '@/shared/lib/constants'

interface CorrectionStepsProps {
  corrections: AlignmentCorrection[]
}

const PRIORITY_LABELS: Record<1 | 2 | 3, string> = {
  1: 'CRÍTICO',
  2: 'ADVERTENCIA',
  3: 'REVISIÓN',
}

const LOCATION_LABELS: Record<string, string> = {
  'front-left':  'Pata Del. Izq.',
  'front-right': 'Pata Del. Der.',
  'back-left':   'Pata Tras. Izq.',
  'back-right':  'Pata Tras. Der.',
  shaft:         'Eje / Acople',
}

const DIRECTION_LABELS: Record<string, string> = {
  vertical:   'Corrección vertical',
  horizontal: 'Corrección lateral',
  axial:      'Corrección axial',
}

const SIDE_LABELS: Record<string, string> = {
  top:    '↑ Subir — agregar shims',
  bottom: '↓ Bajar — quitar shims',
  left:   '← Mover a la izquierda',
  right:  '→ Mover a la derecha',
  front:  '⟵ Acercar al acople',
  back:   '⟶ Alejar del acople',
}

// ── Agrupación ────────────────────────────────────────────────────────────────

interface GroupedCorrection {
  representative: AlignmentCorrection
  locations: string[]
}

function groupCorrections(corrections: AlignmentCorrection[]): GroupedCorrection[] {
  const groups = new Map<string, AlignmentCorrection[]>()
  for (const c of corrections) {
    const key = `${c.direction}|${c.side}|${c.magnitude.toFixed(1)}|${c.priority}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(c)
  }
  return Array.from(groups.values()).map(group => ({
    representative: group[0],
    locations: group.map(c => c.location),
  }))
}

function locationLabel(locations: string[]): string {
  const set = new Set(locations)
  const all4 = ['front-left', 'front-right', 'back-left', 'back-right']
  if (set.size === 4 && all4.every(l => set.has(l))) return 'Las 4 Patas'
  if (set.size === 2 && set.has('front-left') && set.has('front-right')) return 'Patas Delanteras'
  if (set.size === 2 && set.has('back-left')  && set.has('back-right'))  return 'Patas Traseras'
  return locations.map(l => LOCATION_LABELS[l] ?? l).join(' + ')
}

// ── StepCard ──────────────────────────────────────────────────────────────────

interface StepCardProps {
  group: GroupedCorrection
  step: number
}

function StepCard({ group, step }: StepCardProps) {
  const { representative: c, locations } = group
  const color = PRIORITY_COLORS[c.priority]
  const unit  = c.unit ?? ''

  return (
    <div
      className="rounded-lg border-l-4 bg-white p-4 shadow-sm"
      style={{ borderLeftColor: color }}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-bold tracking-widest" style={{ color }}>
          PASO {step} — {PRIORITY_LABELS[c.priority]}
        </span>
        <span className="rounded-full px-2 py-0.5 text-xs font-semibold text-white" style={{ backgroundColor: color }}>
          {locationLabel(locations)}
        </span>
      </div>

      <p className="text-sm font-semibold text-slate-800">
        {DIRECTION_LABELS[c.direction] ?? c.direction}
        {' — '}
        {SIDE_LABELS[c.side] ?? c.side}
      </p>

      <p className="mt-0.5 text-sm text-slate-600">
        Magnitud: <span className="font-mono font-semibold">{c.magnitude.toFixed(1)} {unit}</span>
      </p>

      <p className="mt-2 text-sm text-slate-500">{c.description}</p>
    </div>
  )
}

// ── CorrectionSteps ───────────────────────────────────────────────────────────

export function CorrectionSteps({ corrections }: CorrectionStepsProps) {
  if (corrections.length === 0) return null

  const grouped = groupCorrections(corrections)

  return (
    <div className="flex flex-col gap-3 p-4">
      <h2 className="text-lg font-semibold text-slate-800">
        Pasos de Corrección
        <span className="ml-2 text-sm font-normal text-slate-500">
          ({grouped.length} {grouped.length === 1 ? 'corrección' : 'correcciones'})
        </span>
      </h2>

      {grouped.map((g, i) => (
        <StepCard key={g.representative.id} group={g} step={i + 1} />
      ))}
    </div>
  )
}
