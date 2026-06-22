import { useState, useEffect } from 'react'
import { useAlignmentCalculations } from '@/shared/hooks/useAlignmentCalculations'
import { Scene } from './3d/Scene'
import { ReadingForm } from './ui/ReadingForm'
import { CorrectionSteps } from './ui/CorrectionSteps'
import { UsageInstructions } from './ui/UsageInstructions'
import { DEV_CORRECTIONS } from '../dev/devCorrections'
import { ArrowEditor, INITIAL_EDITOR_STATE } from '../dev/ArrowEditor'
import type { ArrowEditorState } from '../dev/ArrowEditor'
import type { ViewPreset } from '../dev/AxisMarkers'
import type { AlignmentCorrection } from '@/shared/types/alignment'
import { PATA_POSITIONS, DIRECTION_OFFSETS, PRIORITY_COLORS } from '@/shared/lib/constants'

const IS_DEV = import.meta.env.DEV
const DEV_STORAGE_KEY = 'axisAlign3d:devEditor'

function loadEditorState(): ArrowEditorState {
  try {
    const raw = localStorage.getItem(DEV_STORAGE_KEY)
    if (raw) {
      const saved = JSON.parse(raw) as Partial<ArrowEditorState>
      return {
        ...INITIAL_EDITOR_STATE,
        ...saved,
        positions: { ...INITIAL_EDITOR_STATE.positions, ...saved.positions },
        offsets:   { ...INITIAL_EDITOR_STATE.offsets,   ...saved.offsets   },
        axisPoints: { ...INITIAL_EDITOR_STATE.axisPoints, ...saved.axisPoints },
      }
    }
  } catch {}
  return INITIAL_EDITOR_STATE
}

// ── Overlay 2D de labels (esquina superior izquierda) ─────────────────────

interface DevLabelsOverlayProps {
  corrections: AlignmentCorrection[]
  positionsOverride?: Partial<Record<keyof typeof PATA_POSITIONS, [number, number, number]>>
  offsetsOverride?: Partial<typeof DIRECTION_OFFSETS>
}

const MARKER_COLORS: Record<keyof typeof PATA_POSITIONS, string> = {
  'front-left':  '#f59e0b',
  'front-right': '#3b82f6',
  'back-left':   '#10b981',
  'back-right':  '#ef4444',
}

function DevLabelsOverlay({ corrections, positionsOverride, offsetsOverride }: DevLabelsOverlayProps) {
  const positions = { ...PATA_POSITIONS, ...positionsOverride }
  const offsets   = { ...DIRECTION_OFFSETS, ...offsetsOverride }

  const visible = corrections.filter(c => c.visible !== false)

  return (
    <div className="pointer-events-none absolute left-3 top-3 z-10 rounded-lg border border-slate-600 bg-black/80 p-2 text-[10px] font-mono">
      {/* Leyenda de colores de marcadores */}
      <p className="mb-1.5 text-[9px] font-bold uppercase tracking-widest text-slate-500">Marcadores</p>
      <div className="mb-3 grid grid-cols-2 gap-x-4 gap-y-0.5">
        {(Object.keys(PATA_POSITIONS) as (keyof typeof PATA_POSITIONS)[]).map(key => (
          <div key={key} className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: MARKER_COLORS[key] }} />
            <span className="text-slate-300">{key.replace('front-','F-').replace('back-','B-')}</span>
          </div>
        ))}
      </div>

      {/* Posiciones actuales */}
      {visible.length > 0 && (
        <>
          <p className="mb-1.5 text-[9px] font-bold uppercase tracking-widest text-slate-500">Posiciones</p>
          {visible.map(c => {
            const base   = positions[c.location as keyof typeof PATA_POSITIONS] ?? [0, 0, 0]
            const offset = offsets[c.direction as keyof typeof DIRECTION_OFFSETS] ?? [0, 0, 0]
            const pos    = [base[0]+offset[0], base[1]+offset[1], base[2]+offset[2]]
            const color  = PRIORITY_COLORS[c.priority]
            const label  = `${c.location.replace('front-','F-').replace('back-','B-')}·${c.direction.slice(0,1).toUpperCase()}`
            return (
              <div key={c.id} className="flex items-baseline gap-2 leading-5">
                <span className="w-12 shrink-0 font-bold" style={{ color }}>{label}</span>
                <span className="text-slate-400">[{pos.map(v => v.toFixed(2)).join(', ')}]</span>
              </div>
            )
          })}
        </>
      )}
    </div>
  )
}

// ── Dashboard ─────────────────────────────────────────────────────────────

export function Dashboard() {
  const { corrections, compute } = useAlignmentCalculations()
  const [devMode, setDevMode]         = useState(false)
  const [autoRotate, setAutoRotate]   = useState(true)
  const [viewPreset, setViewPreset]   = useState<ViewPreset>('free')
  const [editorState, setEditorState] = useState<ArrowEditorState>(loadEditorState)
  const [isMobile, setIsMobile]       = useState(() => window.matchMedia('(max-width: 1023px)').matches)

  useEffect(() => {
    try { localStorage.setItem(DEV_STORAGE_KEY, JSON.stringify(editorState)) } catch {}
  }, [editorState])

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)')
    setIsMobile(mq.matches)
    const h = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', h)
    return () => mq.removeEventListener('change', h)
  }, [])

  const activeCorrections = devMode
    ? DEV_CORRECTIONS.filter(c => editorState.visibleArrows[c.id] !== false)
    : corrections

  const positionsOverride = editorState.positions            // always use calibrated positions from localStorage
  const offsetsOverride   = devMode ? editorState.offsets : undefined

  function handlePataMove(key: keyof typeof PATA_POSITIONS, pos: [number, number, number]) {
    setEditorState(s => ({ ...s, positions: { ...s.positions, [key]: pos } }))
  }

  function handleAxisChange(pts: ArrowEditorState['axisPoints']) {
    setEditorState(s => ({ ...s, axisPoints: pts }))
  }

  function handleAxialPositionChange(pos: [number, number, number]) {
    setEditorState(s => ({ ...s, axialPosition: pos }))
  }

  function togglePreset(p: ViewPreset) {
    setViewPreset(cur => cur === p ? 'free' : p)
  }

  return (
    <div className="flex flex-col gap-4 p-4 lg:grid lg:grid-cols-3">
      {/* Escena 3D */}
      <div
        className="relative order-1 h-[420px] overflow-hidden rounded-xl border border-slate-200 bg-slate-900 shadow-sm lg:order-2 lg:col-span-2 lg:h-auto lg:min-h-[420px]"
      >
        <Scene
          corrections={activeCorrections}
          devMode={devMode}
          positionsOverride={positionsOverride}
          offsetsOverride={offsetsOverride}
          arrowScale={devMode ? editorState.arrowScale : 22.5}
          autoRotate={autoRotate}
          devPositions={devMode ? editorState.positions : undefined}
          onDevPositionChange={devMode ? handlePataMove : undefined}
          axisPoints={editorState.axisPoints}
          onAxisPointsChange={devMode ? handleAxisChange : undefined}
          markerSize={devMode ? editorState.markerSize : undefined}
          axialPosition={editorState.axialPosition}
          onAxialPositionChange={devMode ? handleAxialPositionChange : undefined}
          viewPreset={viewPreset}
          isMobile={isMobile}
        />

        {/* Labels 2D — esquina superior izquierda */}
        {devMode && (
          <DevLabelsOverlay
            corrections={activeCorrections}
            positionsOverride={positionsOverride}
            offsetsOverride={offsetsOverride}
          />
        )}

        {/* Botones de vista (solo DEV) */}
        {devMode && (
          <div className="absolute bottom-3 left-3 flex gap-1.5">
            {(['top', 'side', 'front'] as const).map(p => {
              const labels: Record<string, string> = { top: 'Planta', side: 'Lateral', front: 'Frontal' }
              const active = viewPreset === p
              return (
                <button
                  key={p}
                  onClick={() => togglePreset(p)}
                  className={`rounded px-2.5 py-1 text-[11px] font-bold transition
                    ${active
                      ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30'
                      : 'bg-slate-700/80 text-slate-400 hover:bg-slate-600 hover:text-slate-200'
                    }`}
                >
                  {labels[p]}
                </button>
              )
            })}
          </div>
        )}

        {/* Botón rotación */}
        <button
          onClick={() => setAutoRotate(v => !v)}
          title={autoRotate ? 'Detener rotación' : 'Reanudar rotación'}
          className={`absolute bottom-3 right-3 rounded px-2.5 py-1 text-xs font-bold transition
            ${autoRotate
              ? 'bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-slate-200'
              : 'bg-slate-600 text-slate-200'
            }`}
        >
          {autoRotate ? '⏸' : '▶'}
        </button>

        {/* Botón DEV */}
        {IS_DEV && (
          <button
            onClick={() => setDevMode(v => !v)}
            className={`absolute right-3 top-3 rounded px-2.5 py-1 text-xs font-bold tracking-widest transition
              ${devMode
                ? 'bg-amber-400 text-slate-900 shadow-lg shadow-amber-400/30'
                : 'bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-slate-200'
              }`}
          >
            DEV
          </button>
        )}
      </div>

      {/* Formulario */}
      <div className="order-2 rounded-xl border border-slate-200 bg-white shadow-sm lg:order-1 lg:col-span-1">
        <ReadingForm onSubmit={compute} />
      </div>

      {/* Editor de flechas */}
      {IS_DEV && devMode && (
        <div className="order-3 lg:col-span-3">
          <ArrowEditor state={editorState} onChange={setEditorState} />
        </div>
      )}

      {/* Pasos de corrección */}
      {!devMode && activeCorrections.length > 0 && (
        <div className="order-4 lg:col-span-3">
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <CorrectionSteps corrections={activeCorrections} />
          </div>
        </div>
      )}

      {/* Instrucciones de uso */}
      {!devMode && (
        <div className="order-5 lg:col-span-3">
          <UsageInstructions />
        </div>
      )}
    </div>
  )
}
