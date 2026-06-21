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
  'front-left':  'Pata Delantera Izq.',
  'front-right': 'Pata Delantera Der.',
  'back-left':   'Pata Trasera Izq.',
  'back-right':  'Pata Trasera Der.',
  shaft:         'Eje / Acople',
}

const DIRECTION_LABELS: Record<string, string> = {
  vertical:   'Shimming vertical',
  horizontal: 'Desplazamiento lateral',
}

const SIDE_LABELS: Record<string, string> = {
  top:    '↑ Subir (quitar shims)',
  bottom: '↓ Bajar (agregar shims)',
  left:   '← Mover a la izquierda',
  right:  '→ Mover a la derecha',
}

const DIRECTION_UNITS: Record<string, string> = {
  vertical:   'mm/s',
  horizontal: 'mm/s',
}

interface StepCardProps {
  correction: AlignmentCorrection
  step: number
}

function StepCard({ correction, step }: StepCardProps) {
  const color = PRIORITY_COLORS[correction.priority]
  const unit = DIRECTION_UNITS[correction.direction] ?? ''

  return (
    <div
      className="rounded-lg border-l-4 bg-white p-4 shadow-sm"
      style={{ borderLeftColor: color }}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-bold tracking-widest" style={{ color }}>
          PASO {step} — {PRIORITY_LABELS[correction.priority]}
        </span>
        <span className="rounded-full px-2 py-0.5 text-xs font-semibold text-white" style={{ backgroundColor: color }}>
          {LOCATION_LABELS[correction.location] ?? correction.location}
        </span>
      </div>

      <p className="text-sm font-semibold text-slate-800">
        {DIRECTION_LABELS[correction.direction] ?? correction.direction}
        {' — '}
        {SIDE_LABELS[correction.side] ?? correction.side}
      </p>

      <p className="mt-0.5 text-sm text-slate-600">
        Magnitud: <span className="font-mono font-semibold">{correction.magnitude.toFixed(1)} {unit}</span>
      </p>

      <p className="mt-2 text-sm text-slate-500">{correction.description}</p>
    </div>
  )
}

export function CorrectionSteps({ corrections }: CorrectionStepsProps) {
  if (corrections.length === 0) return null

  return (
    <div className="flex flex-col gap-3 p-4">
      <h2 className="text-lg font-semibold text-slate-800">
        Pasos de Corrección
        <span className="ml-2 text-sm font-normal text-slate-500">
          ({corrections.length} {corrections.length === 1 ? 'corrección' : 'correcciones'})
        </span>
      </h2>

      {corrections.map((c, i) => (
        <StepCard key={c.id} correction={c} step={i + 1} />
      ))}
    </div>
  )
}
