import { useState } from 'react'
import type { ReadingData } from '@/shared/types/alignment'
import { DialIndicator, computeTIR, tirToMicrons, getReadingsInMicrons, EMPTY_DIAL_READINGS } from './DialIndicator'
import type { DialReadings, DialUnit, DialPosition } from './DialIndicator'

interface ReadingFormProps {
  onSubmit: (data: ReadingData) => void
}

// Descripciones técnicas para cada campo
const FIELD_INFO: Record<string, string> = {
  verticalVibration:
    'Velocidad de vibración en dirección vertical, medida sobre la carcasa del rodamiento con vibrómetro o analizador. Zonas ISO 10816: A < 2.3 | B < 4.5 | C < 7.1 | D > 11 mm/s.',
  horizontalVibration:
    'Velocidad de vibración en dirección horizontal (90° de la vertical), mismo punto de medición. Valores altos respecto a la vertical pueden indicar resonancia o desalineación angular.',
  verticalPhase:
    'Ángulo de fase obtenido con estroboscopio o sensor de fase/tacómetro en dirección vertical. Indica la posición del vector de vibración en el ciclo rotacional (0-360°).',
  horizontalPhase:
    'Ángulo de fase en dirección horizontal. La diferencia entre fase vertical y horizontal ayuda a discriminar entre desbalance (≈0° diferencia) y desalineación (≈90° o 180°).',
  bearingTemperature:
    'Temperatura superficial de la carcasa del rodamiento, medida con termómetro infrarrojo. Normal: < 80°C. Alarma: > 80°C. Paro: > 95°C. Indica sobrecarga, falta de lubricación o daño incipiente.',
}

function FieldTooltip({ fieldKey }: { fieldKey: string }) {
  const info = FIELD_INFO[fieldKey]
  if (!info) return null
  return (
    <details className="mt-1">
      <summary className="w-fit cursor-pointer list-none text-xs text-slate-400 hover:text-slate-600 select-none">
        <span className="inline-flex items-center gap-1">
          <span className="rounded-full border border-slate-300 px-1.5 text-[10px] font-bold leading-tight">?</span>
          ¿Qué mido aquí?
        </span>
      </summary>
      <p className="mt-1.5 rounded-md bg-slate-50 p-2.5 text-xs leading-relaxed text-slate-600">
        {info}
      </p>
    </details>
  )
}

interface FieldState {
  dialAxial: DialReadings
  dialRadial: DialReadings
  verticalVibration: string
  horizontalVibration: string
  verticalPhase: string
  horizontalPhase: string
  bearingTemperature: string
}

interface FormErrors {
  dialAxial?: string
  dialRadial?: string
  verticalVibration?: string
  horizontalVibration?: string
  verticalPhase?: string
  horizontalPhase?: string
  bearingTemperature?: string
}

const empty: FieldState = {
  dialAxial: EMPTY_DIAL_READINGS,
  dialRadial: EMPTY_DIAL_READINGS,
  verticalVibration: '',
  horizontalVibration: '',
  verticalPhase: '',
  horizontalPhase: '',
  bearingTemperature: '',
}

function parseOptional(v: string): number | undefined {
  if (v.trim() === '') return undefined
  const n = Number(v)
  return isNaN(n) ? undefined : n
}

export function ReadingForm({ onSubmit }: ReadingFormProps) {
  const [fields, setFields] = useState<FieldState>(empty)
  const [errors, setErrors] = useState<FormErrors>({})
  const [showVibration, setShowVibration] = useState(false)
  const [unit, setUnit] = useState<DialUnit>('centesimas')

  function set(key: keyof Omit<FieldState, 'dialAxial' | 'dialRadial'>, value: string) {
    setFields(prev => ({ ...prev, [key]: value }))
    setErrors(prev => ({ ...prev, [key]: undefined }))
  }

  function validate(): boolean {
    const next: FormErrors = {}
    const hasFilled = (d: DialReadings) =>
      (['12h', '3h', '6h', '9h'] as DialPosition[]).some(p => d[p].trim() !== '' && !isNaN(Number(d[p])))

    if (!hasFilled(fields.dialAxial))
      next.dialAxial = 'Ingresa al menos una lectura'
    if (!hasFilled(fields.dialRadial))
      next.dialRadial = 'Ingresa al menos una lectura'

    if (showVibration) {
      if (fields.verticalVibration !== '') {
        const v = Number(fields.verticalVibration)
        if (isNaN(v) || v < 0) next.verticalVibration = 'Valor inválido'
      }
      if (fields.horizontalVibration !== '') {
        const v = Number(fields.horizontalVibration)
        if (isNaN(v) || v < 0) next.horizontalVibration = 'Valor inválido'
      }
      if (fields.verticalPhase !== '') {
        const v = Number(fields.verticalPhase)
        if (isNaN(v) || v < 0 || v > 360) next.verticalPhase = '0 – 360°'
      }
      if (fields.horizontalPhase !== '') {
        const v = Number(fields.horizontalPhase)
        if (isNaN(v) || v < 0 || v > 360) next.horizontalPhase = '0 – 360°'
      }
    }

    if (fields.bearingTemperature !== '') {
      const v = Number(fields.bearingTemperature)
      if (isNaN(v) || v < 0 || v > 200) next.bearingTemperature = '0 – 200°C'
    }

    setErrors(next)
    return Object.keys(next).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    const data: ReadingData = {
      runoutAxial:         tirToMicrons(computeTIR(fields.dialAxial),  unit),
      runoutRadial:        tirToMicrons(computeTIR(fields.dialRadial), unit),
      runoutAxialReadings:  getReadingsInMicrons(fields.dialAxial,  unit),
      runoutRadialReadings: getReadingsInMicrons(fields.dialRadial, unit),
      verticalVibration: showVibration ? parseOptional(fields.verticalVibration) : undefined,
      horizontalVibration: showVibration ? parseOptional(fields.horizontalVibration) : undefined,
      verticalPhase: showVibration ? parseOptional(fields.verticalPhase) : undefined,
      horizontalPhase: showVibration ? parseOptional(fields.horizontalPhase) : undefined,
      bearingTemperature: parseOptional(fields.bearingTemperature),
    }
    onSubmit(data)
  }

  function handleReset() {
    setFields(empty)
    setErrors({})
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-4">
      <h2 className="text-base font-semibold text-slate-800">Lecturas de Campo</h2>

      {/* ── RUNOUT (siempre visible) ── */}
      <section className="flex flex-col gap-5">
        {/* Encabezado + toggle de unidades */}
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            Runout — Reloj Comparador
          </p>
          <button
            type="button"
            onClick={() => setUnit(u => u === 'centesimas' ? 'miles' : 'centesimas')}
            className="rounded border border-slate-300 bg-white px-2 py-0.5 text-[10px] font-mono text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
            title={unit === 'centesimas' ? 'Cambiar a milésimas de pulgada' : 'Cambiar a centésimas de mm'}
          >
            {unit === 'centesimas' ? '0.01 mm  →  0.001″' : '0.001″  →  0.01 mm'}
          </button>
        </div>

        <DialIndicator
          label="Axial — cara del acople"
          type="axial"
          unit={unit}
          readings={fields.dialAxial}
          onChange={(pos, val) => {
            setFields(prev => ({ ...prev, dialAxial: { ...prev.dialAxial, [pos]: val } }))
            setErrors(prev => ({ ...prev, dialAxial: undefined }))
          }}
          error={errors.dialAxial}
        />

        <DialIndicator
          label="Radial — diámetro del acople"
          type="radial"
          unit={unit}
          readings={fields.dialRadial}
          onChange={(pos, val) => {
            setFields(prev => ({ ...prev, dialRadial: { ...prev.dialRadial, [pos]: val } }))
            setErrors(prev => ({ ...prev, dialRadial: undefined }))
          }}
          error={errors.dialRadial}
        />
      </section>

      {/* ── VIBRACIÓN (colapsable) ── */}
      <section className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => setShowVibration(v => !v)}
          className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-left transition hover:bg-slate-100"
        >
          <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            Vibración — Analizador
          </span>
          <span className="text-xs text-slate-400">{showVibration ? '▲ ocultar' : '▼ mostrar'}</span>
        </button>

        {showVibration && (
          <div className="flex flex-col gap-3 pl-1">
            <NumberField
              id="verticalVibration"
              label="Vibración Vertical"
              unit="mm/s"
              placeholder="0 – 50"
              value={fields.verticalVibration}
              error={errors.verticalVibration}
              onChange={v => set('verticalVibration', v)}
            />

            <PhaseField
              id="verticalPhase"
              label="Fase Vertical"
              value={fields.verticalPhase}
              error={errors.verticalPhase}
              onChange={v => set('verticalPhase', v)}
            />

            <NumberField
              id="horizontalVibration"
              label="Vibración Horizontal"
              unit="mm/s"
              placeholder="0 – 50"
              value={fields.horizontalVibration}
              error={errors.horizontalVibration}
              onChange={v => set('horizontalVibration', v)}
            />

            <PhaseField
              id="horizontalPhase"
              label="Fase Horizontal"
              value={fields.horizontalPhase}
              error={errors.horizontalPhase}
              onChange={v => set('horizontalPhase', v)}
            />
          </div>
        )}
      </section>

      {/* ── TEMPERATURA (siempre visible, opcional) ── */}
      <section className="flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
          Temperatura — Opcional
        </p>

        <NumberField
          id="bearingTemperature"
          label="Rodamientos"
          unit="°C"
          placeholder="Ej: 65"
          value={fields.bearingTemperature}
          error={errors.bearingTemperature}
          onChange={v => set('bearingTemperature', v)}
          optional
        />
      </section>

      {/* ── BOTONES ── */}
      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          className="flex-1 rounded-md bg-slate-800 px-4 py-2 text-sm font-semibold text-white
            transition hover:bg-slate-700 active:bg-slate-900"
        >
          Calcular
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-600
            transition hover:bg-slate-100"
        >
          Limpiar
        </button>
      </div>
    </form>
  )
}

// ── Sub-componentes ──────────────────────────────────────────────

interface NumberFieldProps {
  id: string
  label: string
  unit: string
  placeholder: string
  value: string
  error?: string
  optional?: boolean
  onChange: (v: string) => void
}

function NumberField({ id, label, unit, placeholder, value, error, optional, onChange }: NumberFieldProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <label htmlFor={id} className="flex items-center gap-1 text-sm font-medium text-slate-700">
        {label}
        <span className="text-xs font-normal text-slate-400">({unit})</span>
        {optional && <span className="text-xs font-normal text-slate-400">— opcional</span>}
      </label>

      <input
        id={id}
        type="number"
        min={0}
        step="any"
        value={value}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        className={`w-full rounded-md border px-3 py-2 text-sm outline-none transition
          focus:ring-2 focus:ring-slate-400
          ${error ? 'border-red-400 bg-red-50' : 'border-slate-300 bg-white'}`}
      />

      {error && <p className="text-xs text-red-500">{error}</p>}

      <FieldTooltip fieldKey={id} />
    </div>
  )
}

interface PhaseFieldProps {
  id: string
  label: string
  value: string
  error?: string
  onChange: (v: string) => void
}

function PhaseField({ id, label, value, error, onChange }: PhaseFieldProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <label htmlFor={id} className="flex items-center gap-1 text-sm font-medium text-slate-700">
        {label}
        <span className="text-xs font-normal text-slate-400">(0 – 360°)</span>
      </label>

      <div className="flex items-center gap-2">
        <input
          id={id}
          type="number"
          min={0}
          max={360}
          step={1}
          value={value}
          placeholder="0 – 360"
          onChange={e => onChange(e.target.value)}
          className={`w-24 rounded-md border px-3 py-2 text-sm outline-none transition
            focus:ring-2 focus:ring-slate-400
            ${error ? 'border-red-400 bg-red-50' : 'border-slate-300 bg-white'}`}
        />
        <input
          type="range"
          min={0}
          max={360}
          step={1}
          value={value || '0'}
          onChange={e => onChange(e.target.value)}
          className="flex-1 accent-slate-700"
        />
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <FieldTooltip fieldKey={id} />
    </div>
  )
}
