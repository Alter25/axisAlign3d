import { useState } from 'react'
import type { ReadingData } from '@/shared/types/alignment'
import { DialIndicator, computeTIR, tirToMicrons, getReadingsInMicrons, EMPTY_DIAL_READINGS } from './DialIndicator'
import type { DialReadings, DialUnit, DialPosition } from './DialIndicator'

interface ReadingFormProps {
  onSubmit: (data: ReadingData) => void
}

interface FieldState {
  dialAxial: DialReadings
  dialRadial: DialReadings
}

interface FormErrors {
  dialAxial?: string
  dialRadial?: string
}

const empty: FieldState = {
  dialAxial: EMPTY_DIAL_READINGS,
  dialRadial: EMPTY_DIAL_READINGS,
}

export function ReadingForm({ onSubmit }: ReadingFormProps) {
  const [fields, setFields] = useState<FieldState>(empty)
  const [errors, setErrors] = useState<FormErrors>({})
  const [unit, setUnit] = useState<DialUnit>('centesimas')

  function validate(): boolean {
    const next: FormErrors = {}
    const hasFilled = (d: DialReadings) =>
      (['12h', '3h', '6h', '9h'] as DialPosition[]).some(p => d[p].trim() !== '' && !isNaN(Number(d[p])))

    const axialFilled  = hasFilled(fields.dialAxial)
    const radialFilled = hasFilled(fields.dialRadial)

    if (!axialFilled && !radialFilled) {
      next.dialAxial  = 'Ingresa lecturas en al menos uno de los dos relojes'
      next.dialRadial = 'Ingresa lecturas en al menos uno de los dos relojes'
    }

    setErrors(next)
    return Object.keys(next).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    const data: ReadingData = {
      runoutAxial:          tirToMicrons(computeTIR(fields.dialAxial),  unit),
      runoutRadial:         tirToMicrons(computeTIR(fields.dialRadial), unit),
      runoutAxialReadings:  getReadingsInMicrons(fields.dialAxial,  unit),
      runoutRadialReadings: getReadingsInMicrons(fields.dialRadial, unit),
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
