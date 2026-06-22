import { useState } from 'react'

export const TUTORIAL_KEY = 'axisAlign3d:tutorialSeen'

export function isTutorialSeen() {
  try { return !!localStorage.getItem(TUTORIAL_KEY) } catch { return false }
}

const STEPS = [
  {
    abbr: 'AX',
    bg: '#0f172a',
    title: 'Bienvenido a AxisAlign 3D',
    body: 'Herramienta para calcular correcciones de alineación bomba-motor con el método Rim & Face. Ingresa las lecturas de tus relojes y obtén los calzos exactos para cada pata.',
  },
  {
    abbr: 'RLJ',
    bg: '#2563eb',
    title: 'Lecturas del reloj comparador',
    body: 'Registra las lecturas en las 4 posiciones del reloj (12h, 3h, 6h, 9h) para los relojes axial y radial. La app calcula el TIR y detecta incoherencias geométricas automáticamente.',
  },
  {
    abbr: 'GEO',
    bg: '#7c3aed',
    title: 'Geometría del equipo (opcional)',
    body: 'Ingresa el diámetro del acople (Ø) y las distancias cara-patas delanteras y traseras para obtener correcciones axiales precisas basadas en la geometría real del equipo.',
  },
  {
    abbr: '3D',
    bg: '#0284c7',
    title: 'Vista 3D interactiva',
    body: 'El canvas 3D muestra las flechas de corrección sobre el modelo del equipo. Rota con un dedo y haz zoom con dos dedos. En mobile la cámara enfoca el motor automáticamente.',
  },
  {
    abbr: '+/-',
    bg: '#16a34a',
    title: 'Pasos de corrección',
    body: 'Al presionar Calcular aparecen los pasos agrupados por pata y magnitud. (+) agrega calzas, (-) quita calzas. Rojo = crítico, amarillo = alerta, cian = informativo.',
  },
] as const

interface TutorialProps {
  onClose: () => void
}

export function Tutorial({ onClose }: TutorialProps) {
  const [step, setStep] = useState(0)
  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  function dismiss() {
    try { localStorage.setItem(TUTORIAL_KEY, '1') } catch {}
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      style={{ backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) dismiss() }}
    >
      <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 pt-4">
          <span className="font-mono text-[11px] text-slate-400">{step + 1} / {STEPS.length}</span>
          <button
            onClick={dismiss}
            className="text-xs text-slate-400 transition hover:text-slate-700"
          >
            Saltar
          </button>
        </div>

        {/* Icon + content */}
        <div className="flex flex-col items-center px-6 py-5 text-center">
          <div
            className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-sm font-bold tracking-wider text-white"
            style={{ backgroundColor: current.bg }}
          >
            {current.abbr}
          </div>
          <h3 className="mb-2 text-base font-bold text-slate-800">{current.title}</h3>
          <p className="text-sm leading-relaxed text-slate-500">{current.body}</p>
        </div>

        {/* Step dots */}
        <div className="flex justify-center gap-1.5 pb-2">
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`h-1.5 rounded-full transition-all ${i === step ? 'w-5 bg-slate-800' : 'w-1.5 bg-slate-200 hover:bg-slate-400'}`}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="flex gap-2 p-4">
          {step > 0 ? (
            <button
              onClick={() => setStep(s => s - 1)}
              className="flex-1 rounded-lg border border-slate-200 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              Atras
            </button>
          ) : (
            <div className="flex-1" />
          )}
          <button
            onClick={isLast ? dismiss : () => setStep(s => s + 1)}
            className="flex-1 rounded-lg bg-slate-800 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 active:bg-slate-900"
          >
            {isLast ? 'Comenzar' : 'Siguiente'}
          </button>
        </div>
      </div>
    </div>
  )
}
