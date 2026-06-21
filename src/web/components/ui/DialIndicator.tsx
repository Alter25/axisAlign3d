import { useState } from 'react'

export type DialPosition = '12h' | '3h' | '6h' | '9h'
export type DialReadings = Record<DialPosition, string>
export type DialUnit = 'centesimas' | 'miles'

export const EMPTY_DIAL_READINGS: DialReadings = { '12h': '', '3h': '', '6h': '', '9h': '' }

// Campos vacíos se tratan como 0 (12h es referencia = 0 en campo)
export function computeTIR(readings: DialReadings): number {
  const vals = (['12h', '3h', '6h', '9h'] as DialPosition[])
    .map(p => { const n = parseFloat(readings[p].trim()); return isNaN(n) ? 0 : n })
  return Math.max(...vals) - Math.min(...vals)
}

// Convert TIR (in display units) to µm for the calculation engine
export function tirToMicrons(tir: number, unit: DialUnit): number {
  return unit === 'centesimas' ? tir * 10 : tir * 25.4
}

// Returns the 4 readings normalized to 12h=0, converted to µm.
// Empty fields default to 0 (12h=0 is the reference in field practice).
export function getReadingsInMicrons(
  readings: DialReadings,
  unit: DialUnit
): { r12: number; r3: number; r6: number; r9: number } {
  const toMicrons = unit === 'centesimas' ? 10 : 25.4
  const parse = (v: string) => { const n = parseFloat(v.trim()); return isNaN(n) ? 0 : n }
  const r12 = parse(readings['12h'])
  const r3  = parse(readings['3h'])
  const r6  = parse(readings['6h'])
  const r9  = parse(readings['9h'])
  return {
    r12: 0,
    r3:  (r3 - r12) * toMicrons,
    r6:  (r6 - r12) * toMicrons,
    r9:  (r9 - r12) * toMicrons,
  }
}

// Geometric constraint for a flat plane or concentric cylinder:
// 12h + 6h = 3h + 9h  →  deviation should be 0
function planeConsistencyDeviation(readings: DialReadings): number | null {
  const parse = (v: string) => { const n = parseFloat(v); return isNaN(n) ? null : n }
  const r12 = parse(readings['12h'])
  const r3  = parse(readings['3h'])
  const r6  = parse(readings['6h'])
  const r9  = parse(readings['9h'])
  if (r12 === null || r3 === null || r6 === null || r9 === null) return null
  return Math.abs((r12 + r6) - (r3 + r9))
}

const UNIT_LABEL: Record<DialUnit, string> = {
  centesimas: '¢',    // centésimas de mm (0.01 mm)
  miles:      'mil',  // milésimas de pulgada (0.001")
}

const UNIT_DECIMALS: Record<DialUnit, number> = {
  centesimas: 1,
  miles:      2,
}

// Thresholds in each display unit
// Axial: 50 µm = 5 ¢mm | ≈ 2.0 mil  /  100 µm = 10 ¢mm | ≈ 4.0 mil
// Radial: 30 µm = 3 ¢mm | ≈ 1.2 mil  /   75 µm = 7.5 ¢mm | ≈ 3.0 mil
const THRESHOLDS: Record<'axial' | 'radial', Record<DialUnit, { warn: number; crit: number }>> = {
  axial: {
    centesimas: { warn: 5,   crit: 10  },
    miles:      { warn: 2.0, crit: 4.0 },
  },
  radial: {
    centesimas: { warn: 3,   crit: 7.5 },
    miles:      { warn: 1.2, crit: 3.0 },
  },
}

const POS_COLORS: Record<DialPosition, string> = {
  '12h': '#3b82f6',
  '3h':  '#10b981',
  '6h':  '#f59e0b',
  '9h':  '#a855f7',
}

const POS_DOT_DEG: Record<DialPosition, number> = { '12h': 0, '3h': 90, '6h': 180, '9h': 270 }

const CX = 90, CY = 90

interface DialIndicatorProps {
  label: string
  type: 'axial' | 'radial'
  unit: DialUnit
  readings: DialReadings
  onChange: (pos: DialPosition, val: string) => void
  error?: string
}

export function DialIndicator({ label, type, unit, readings, onChange, error }: DialIndicatorProps) {
  const [selected, setSelected] = useState<DialPosition>('12h')

  const tir = computeTIR(readings)
  const { warn, crit } = THRESHOLDS[type][unit]
  const decimals = UNIT_DECIMALS[unit]
  const unitLabel = UNIT_LABEL[unit]
  const consistency = planeConsistencyDeviation(readings)
  const consistencyTolerance = unit === 'centesimas' ? 1.0 : 0.5
  const anyFilled = (['12h', '3h', '6h', '9h'] as DialPosition[]).some(p => readings[p].trim() !== '')

  let tirLabel = '', tirBg = ''
  if (tir < warn)      { tirLabel = 'BIEN';    tirBg = '#22c55e' }
  else if (tir < crit) { tirLabel = 'ALERTA';  tirBg = '#f59e0b' }
  else                 { tirLabel = 'CRÍTICO'; tirBg = '#ef4444' }

  const selVal = readings[selected].trim()
  const selNum = selVal !== '' && !isNaN(Number(selVal)) ? Number(selVal) : null
  const needleRot = selNum !== null ? ((selNum % 100 + 100) % 100) * 3.6 : null

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">{label}</p>

      {/* SVG Dial */}
      <div className="mx-auto" style={{ width: '100%', maxWidth: 180, aspectRatio: '1/1' }}>
        <svg viewBox="0 0 180 180" className="w-full h-full">
          {/* Bezel */}
          <circle cx={CX} cy={CY} r={88} fill="#1e293b" />
          {/* Face */}
          <circle cx={CX} cy={CY} r={79} fill="#f8fafc" />

          {/* 100 tick marks (3.6° each) */}
          {Array.from({ length: 100 }, (_, i) => {
            const rad = (i * 3.6 - 90) * Math.PI / 180
            const isMajor = i % 10 === 0
            const r1 = 79, r2 = isMajor ? 68 : 74
            return (
              <line
                key={i}
                x1={CX + r1 * Math.cos(rad)} y1={CY + r1 * Math.sin(rad)}
                x2={CX + r2 * Math.cos(rad)} y2={CY + r2 * Math.sin(rad)}
                stroke="#1e293b"
                strokeWidth={isMajor ? 1.5 : 0.75}
              />
            )
          })}

          {/* Number labels at major ticks (0 at top, clockwise) */}
          {Array.from({ length: 10 }, (_, i) => {
            const rad = (i * 36 - 90) * Math.PI / 180
            return (
              <text
                key={i}
                x={CX + 59 * Math.cos(rad)} y={CY + 59 * Math.sin(rad)}
                textAnchor="middle" dominantBaseline="central"
                fontSize="7.5" fontFamily="monospace" fill="#334155"
              >
                {i * 10}
              </text>
            )
          })}

          {/* Position dots — clickable */}
          {(Object.entries(POS_DOT_DEG) as [DialPosition, number][]).map(([pos, deg]) => {
            const rad = (deg - 90) * Math.PI / 180
            const hasVal = readings[pos].trim() !== ''
            const isActive = pos === selected
            return (
              <circle
                key={pos}
                cx={CX + 73 * Math.cos(rad)} cy={CY + 73 * Math.sin(rad)}
                r={isActive ? 4.5 : 3}
                fill={hasVal ? POS_COLORS[pos] : '#94a3b8'}
                stroke={isActive ? 'white' : 'none'}
                strokeWidth={1.5}
                style={{ cursor: 'pointer' }}
                onClick={() => setSelected(pos)}
              />
            )
          })}

          {/* Needle */}
          {needleRot !== null && (
            <g transform={`rotate(${needleRot}, ${CX}, ${CY})`}>
              <line
                x1={CX} y1={CY} x2={CX} y2={CY - 57}
                stroke={POS_COLORS[selected]} strokeWidth={2} strokeLinecap="round"
              />
              <line
                x1={CX} y1={CY} x2={CX} y2={CY + 14}
                stroke={POS_COLORS[selected]} strokeWidth={3.5} strokeLinecap="round"
              />
            </g>
          )}

          {/* Center cap */}
          <circle cx={CX} cy={CY} r={5} fill="#0f172a" />

          {/* Numeric readout */}
          <text
            x={CX} y={CY + 24}
            textAnchor="middle" fontSize="8.5" fontFamily="monospace" fill="#475569"
          >
            {selNum !== null ? `${selNum.toFixed(decimals)} ${unitLabel}` : '– – –'}
          </text>
          <text
            x={CX} y={CY + 34}
            textAnchor="middle" fontSize="7" fontFamily="monospace" fill={POS_COLORS[selected]}
          >
            {selected}
          </text>
        </svg>
      </div>

      {/* 4 position inputs */}
      <div className="grid grid-cols-4 gap-1.5">
        {(['12h', '3h', '6h', '9h'] as DialPosition[]).map(pos => (
          <PositionInput
            key={pos}
            pos={pos}
            value={readings[pos]}
            isSelected={pos === selected}
            onSelect={setSelected}
            onChange={onChange}
          />
        ))}
      </div>

      {/* TIR result bar */}
      <div className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5">
        <span className="text-xs font-semibold text-slate-600">TIR</span>
        {anyFilled ? (
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-slate-800">
              {tir.toFixed(decimals)} {unitLabel}
            </span>
            <span
              className="rounded px-1.5 py-0.5 text-[10px] font-bold text-white"
              style={{ backgroundColor: tirBg }}
            >
              {tirLabel}
            </span>
          </div>
        ) : (
          <span className="text-[11px] text-slate-400">Ingresa lecturas</span>
        )}
      </div>

      {/* Geometric consistency check: 12h + 6h must equal 3h + 9h */}
      {consistency !== null && (
        <div className={`flex items-center gap-1.5 rounded border px-2 py-1 text-[10px] font-mono ${
          consistency <= consistencyTolerance
            ? 'border-green-200 bg-green-50 text-green-700'
            : 'border-amber-200 bg-amber-50 text-amber-700'
        }`}>
          {consistency <= consistencyTolerance
            ? '✓ Plano consistente  (12h + 6h = 3h + 9h)'
            : `⚠ Inconsistencia: ${consistency.toFixed(decimals)} ${unitLabel}  (12h + 6h ≠ 3h + 9h)`
          }
        </div>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

// ── PositionInput ──────────────────────────────────────────────────────────

interface PositionInputProps {
  pos: DialPosition
  value: string
  isSelected: boolean
  onSelect: (p: DialPosition) => void
  onChange: (p: DialPosition, v: string) => void
}

function PositionInput({ pos, value, isSelected, onSelect, onChange }: PositionInputProps) {
  const color = POS_COLORS[pos]
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-[9px] font-bold leading-none" style={{ color }}>{pos}</span>
      <input
        type="number"
        step="any"
        value={value}
        placeholder="0"
        onFocus={() => onSelect(pos)}
        onChange={e => { onSelect(pos); onChange(pos, e.target.value) }}
        className="w-full rounded border bg-white py-1 text-center text-xs font-mono outline-none transition"
        style={{
          borderColor: isSelected ? color : '#d1d5db',
          boxShadow: isSelected ? `0 0 0 1px ${color}40` : undefined,
        }}
      />
    </div>
  )
}
