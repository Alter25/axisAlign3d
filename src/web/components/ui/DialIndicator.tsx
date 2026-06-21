import { useState } from 'react'

export type DialPosition = '12h' | '3h' | '6h' | '9h'
export type DialReadings = Record<DialPosition, string>

export const EMPTY_DIAL_READINGS: DialReadings = { '12h': '', '3h': '', '6h': '', '9h': '' }

export function computeTIR(readings: DialReadings): number | null {
  const vals = (['12h', '3h', '6h', '9h'] as DialPosition[])
    .map(p => readings[p].trim())
    .filter(v => v !== '' && !isNaN(Number(v)))
    .map(Number)
  if (vals.length < 2) return null
  return Math.max(...vals) - Math.min(...vals)
}

const THRESHOLDS = {
  axial:  { warn: 50,  crit: 100 },
  radial: { warn: 30,  crit: 75  },
}

const POS_COLORS: Record<DialPosition, string> = {
  '12h': '#3b82f6',
  '3h':  '#10b981',
  '6h':  '#f59e0b',
  '9h':  '#a855f7',
}

// degrees from top (clockwise) for each clock position
const POS_DOT_DEG: Record<DialPosition, number> = { '12h': 0, '3h': 90, '6h': 180, '9h': 270 }

const CX = 90, CY = 90

interface DialIndicatorProps {
  label: string
  type: 'axial' | 'radial'
  readings: DialReadings
  onChange: (pos: DialPosition, val: string) => void
  error?: string
}

export function DialIndicator({ label, type, readings, onChange, error }: DialIndicatorProps) {
  const [selected, setSelected] = useState<DialPosition>('12h')

  const tir = computeTIR(readings)
  const { warn, crit } = THRESHOLDS[type]

  let tirLabel = '', tirBg = ''
  if (tir !== null) {
    if (tir < warn)      { tirLabel = 'BIEN';    tirBg = '#22c55e' }
    else if (tir < crit) { tirLabel = 'ALERTA';  tirBg = '#f59e0b' }
    else                 { tirLabel = 'CRÍTICO'; tirBg = '#ef4444' }
  }

  const selVal = readings[selected].trim()
  const selNum = selVal !== '' && !isNaN(Number(selVal)) ? Number(selVal) : null
  // one full revolution = 100 units; value maps to 0-360° rotation from 12h
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

          {/* Position dots — clickable, show which positions have readings */}
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

          {/* Needle — rotated around center */}
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

          {/* Numeric readout — shown in the lower-center zone of the face */}
          <text
            x={CX} y={CY + 24}
            textAnchor="middle" fontSize="8.5" fontFamily="monospace" fill="#475569"
          >
            {selNum !== null ? `${selNum.toFixed(1)} µm` : '– – –'}
          </text>
          <text
            x={CX} y={CY + 34}
            textAnchor="middle" fontSize="7" fontFamily="monospace" fill={POS_COLORS[selected]}
          >
            {selected}
          </text>
        </svg>
      </div>

      {/* 4 position inputs in a row */}
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
        {tir !== null ? (
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-slate-800">{tir.toFixed(0)} µm</span>
            <span
              className="rounded px-1.5 py-0.5 text-[10px] font-bold text-white"
              style={{ backgroundColor: tirBg }}
            >
              {tirLabel}
            </span>
          </div>
        ) : (
          <span className="text-[11px] text-slate-400">2+ lecturas para calcular</span>
        )}
      </div>

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
