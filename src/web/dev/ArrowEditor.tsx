import { useRef, useState, type ReactNode } from 'react'
import * as THREE from 'three'
import { PATA_POSITIONS, DIRECTION_OFFSETS, PRIORITY_COLORS } from '@/shared/lib/constants'
import { DEV_CORRECTIONS } from './devCorrections'

export type Vec3 = [number, number, number]

export interface AxisPoints {
  x1: Vec3  // primer punto del eje X del equipo
  x2: Vec3  // segundo punto del eje X (dirección X = x2 - x1)
  z:  Vec3  // punto que define el eje Z (desde el centro X1-X2)
}

export interface ArrowEditorState {
  positions: {
    'front-left':  Vec3
    'front-right': Vec3
    'back-left':   Vec3
    'back-right':  Vec3
  }
  offsets: {
    vertical:   Vec3
    horizontal: Vec3
    axial:      Vec3
  }
  arrowScale: number
  markerSize: number
  axialPosition: Vec3
  visibleArrows: Record<string, boolean>
  axisPoints: AxisPoints
}

export const INITIAL_EDITOR_STATE: ArrowEditorState = {
  positions: {
    'front-left':  [...PATA_POSITIONS['front-left']],
    'front-right': [...PATA_POSITIONS['front-right']],
    'back-left':   [...PATA_POSITIONS['back-left']],
    'back-right':  [...PATA_POSITIONS['back-right']],
  },
  offsets: {
    vertical:   [...DIRECTION_OFFSETS.vertical],
    horizontal: [...DIRECTION_OFFSETS.horizontal],
    axial:      [...DIRECTION_OFFSETS.axial],
  },
  arrowScale: 30,
  markerSize: 24,
  axialPosition: [-41.5, 0, -36] as Vec3,  // centro del eje calibrado (midpoint x1-x2)
  visibleArrows: Object.fromEntries(DEV_CORRECTIONS.map(c => [c.id, true])),
  axisPoints: {
    x1: [ 237, 0,  243] as Vec3,
    x2: [-320, 0, -315] as Vec3,
    z:  [ -16, 0,    5] as Vec3,
  },
}

// ── Marco del equipo: transformaciones mundo ↔ local ────────────────────────
// Local: X = a lo largo del eje rojo (shaft), Y = vertical (verde), Z = lateral (azul)

type EquipFrame = { xDir: THREE.Vector3; yDir: THREE.Vector3; zDir: THREE.Vector3; center: THREE.Vector3 }

function getEquipFrame(ap: AxisPoints): EquipFrame {
  const x1     = new THREE.Vector3(...ap.x1)
  const x2     = new THREE.Vector3(...ap.x2)
  const zPt    = new THREE.Vector3(...ap.z)
  const center = new THREE.Vector3().lerpVectors(x1, x2, 0.5)
  const xDir   = new THREE.Vector3().subVectors(x2, x1).normalize()
  const toZ    = new THREE.Vector3().subVectors(zPt, center)
  const zDir   = toZ.clone().sub(xDir.clone().multiplyScalar(toZ.dot(xDir))).normalize()
  const yDir   = new THREE.Vector3().crossVectors(xDir, zDir).normalize()
  return { xDir, yDir, zDir, center }
}

// Posición absoluta mundo → local (relativa al centro del eje)
function worldPtToLocal(w: Vec3, f: EquipFrame): Vec3 {
  const p = new THREE.Vector3(...w).sub(f.center)
  return [+p.dot(f.xDir), +p.dot(f.yDir), +p.dot(f.zDir)]
}

// Posición local → mundo
function localPtToWorld(l: Vec3, f: EquipFrame): Vec3 {
  const r = f.center.clone()
    .addScaledVector(f.xDir, l[0])
    .addScaledVector(f.yDir, l[1])
    .addScaledVector(f.zDir, l[2])
  return [r.x, r.y, r.z]
}

// Vector de desplazamiento (offset) mundo → local (sin traslación)
function worldDirToLocal(w: Vec3, f: EquipFrame): Vec3 {
  const d = new THREE.Vector3(...w)
  return [+d.dot(f.xDir), +d.dot(f.yDir), +d.dot(f.zDir)]
}

// Vector de desplazamiento local → mundo
function localDirToWorld(l: Vec3, f: EquipFrame): Vec3 {
  const r = new THREE.Vector3()
    .addScaledVector(f.xDir, l[0])
    .addScaledVector(f.yDir, l[1])
    .addScaledVector(f.zDir, l[2])
  return [r.x, r.y, r.z]
}

// ── Markdown export ──────────────────────────────────────────────────────────

function fmt(v: number) { return v.toFixed(3) }
function row(label: string, v: Vec3) {
  return `| ${label.padEnd(14)} | ${fmt(v[0]).padStart(7)} | ${fmt(v[1]).padStart(7)} | ${fmt(v[2]).padStart(7)} |`
}

function generateMarkdown(state: ArrowEditorState): string {
  const { positions: p, offsets: o, arrowScale, axisPoints: ax, axialPosition: ap } = state
  const now = new Date().toISOString().slice(0, 10)

  const posTs = (Object.entries(p) as [string, Vec3][])
    .map(([k, v]) => `  '${k}': [${v.map(fmt).join(', ')}] as [number, number, number],`)
    .join('\n')

  const offTs = (Object.entries(o) as [string, Vec3][])
    .map(([k, v]) => `  ${k.padEnd(12)}: [${v.map(fmt).join(', ')}] as [number, number, number],`)
    .join('\n')

  const computed = (Object.entries(p) as [string, Vec3][]).flatMap(([loc, base]) =>
    (Object.entries(o) as [string, Vec3][]).map(([dir, off]) => {
      const final: Vec3 = [base[0]+off[0], base[1]+off[1], base[2]+off[2]]
      return `| ${`${loc}·${dir}`.padEnd(22)} | ${fmt(final[0]).padStart(7)} | ${fmt(final[1]).padStart(7)} | ${fmt(final[2]).padStart(7)} |`
    })
  ).join('\n')

  return `# Configuración de Posiciones de Flechas

> Generado: ${now}
> Copiar constantes en \`src/shared/lib/constants.ts\`

---

## Eje del Equipo (axisPoints)

| Punto |       X |       Y |       Z |
|:------|--------:|--------:|--------:|
${row('x1', ax.x1)}
${row('x2', ax.x2)}
${row('z',  ax.z)}

## Posiciones de Patas (PATA_POSITIONS)

| Pata           |       X |       Y |       Z |
|:---------------|--------:|--------:|--------:|
${row('front-left', p['front-left'])}
${row('front-right', p['front-right'])}
${row('back-left', p['back-left'])}
${row('back-right', p['back-right'])}

## Offsets por Dirección (DIRECTION_OFFSETS)

| Dirección      |       X |       Y |       Z |
|:---------------|--------:|--------:|--------:|
${row('vertical', o.vertical)}
${row('horizontal', o.horizontal)}

## Posiciones Finales (pata + offset)

| Flecha                  |       X |       Y |       Z |
|:------------------------|--------:|--------:|--------:|
${computed}

## Posición Flecha Axial

| Punto  |       X |       Y |       Z |
|:-------|--------:|--------:|--------:|
${row('axialPosition', ap)}

## Tamaños

\`arrowScale: ${arrowScale}\`  \`markerSize: ${state.markerSize}\`

---

## Constantes TypeScript (copiar a constants.ts)

\`\`\`typescript
export const AXIS_POINTS = {
  x1: [${ax.x1.map(fmt).join(', ')}] as [number, number, number],
  x2: [${ax.x2.map(fmt).join(', ')}] as [number, number, number],
  z:  [${ax.z.map(fmt).join(', ')}]  as [number, number, number],
}

export const AXIAL_ARROW_POSITION = [${ap.map(fmt).join(', ')}] as [number, number, number]

export const PATA_POSITIONS = {
${posTs}
}

export const DIRECTION_OFFSETS = {
${offTs}
}

export const ARROW_SCALE = ${arrowScale}
\`\`\`
`
}

function downloadMd(state: ArrowEditorState) {
  const blob = new Blob([generateMarkdown(state)], { type: 'text/markdown' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = 'arrow-positions.md'; a.click()
  URL.revokeObjectURL(url)
}

// ── Componente ───────────────────────────────────────────────────────────────

interface ArrowEditorProps {
  state: ArrowEditorState
  onChange: (next: ArrowEditorState) => void
}

// Arrastra izquierda/derecha en el label del eje para cambiar el valor (8px = 1 unidad)
function ScrubLabel({ axis, value, onChange }: { axis: string; value: number; onChange: (v: number) => void }) {
  const startX   = useRef(0)
  const startVal = useRef(0)
  return (
    <span
      className="cursor-ew-resize select-none px-0.5 text-[10px] font-bold text-slate-500 transition-colors hover:text-amber-400"
      title="Arrastra para cambiar"
      onPointerDown={(e) => {
        startX.current   = e.clientX
        startVal.current = value
        e.currentTarget.setPointerCapture(e.pointerId)
        document.body.style.cursor = 'ew-resize'
      }}
      onPointerMove={(e) => {
        if (!(e.buttons & 1)) return
        const delta = e.clientX - startX.current
        onChange(Math.round(startVal.current + delta / 8))
      }}
      onPointerUp={() => { document.body.style.cursor = '' }}
    >
      {axis}
    </span>
  )
}

function Vec3Input({ label, value, onChange }: { label: ReactNode; value: Vec3; onChange: (v: Vec3) => void }) {
  function setAxis(i: 0 | 1 | 2, n: number) {
    const next: Vec3 = [...value]; next[i] = n; onChange(next)
  }
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-28 shrink-0 text-right text-xs text-slate-400">{label}</span>
      {(['X', 'Y', 'Z'] as const).map((axis, i) => (
        <label key={axis} className="flex items-center gap-0.5">
          <ScrubLabel axis={axis} value={value[i]} onChange={v => setAxis(i as 0 | 1 | 2, v)} />
          <input
            type="number" step={1} value={value[i]}
            onChange={e => { const n = parseFloat(e.target.value); if (!isNaN(n)) setAxis(i as 0 | 1 | 2, n) }}
            className="w-16 rounded border border-slate-600 bg-slate-800 px-1.5 py-0.5 text-right text-xs text-slate-100
              outline-none focus:border-amber-400"
          />
        </label>
      ))}
    </div>
  )
}

function Section({ title, defaultOpen = true, extra, children }: {
  title: string
  defaultOpen?: boolean
  extra?: ReactNode
  children: ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="mb-3 rounded-lg border border-slate-700 bg-slate-800/50">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex w-full items-center justify-between px-3 py-2 text-left"
      >
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{title}</span>
        <div className="flex items-center gap-2">
          {extra}
          <span className="text-slate-600 text-[10px]">{open ? '▲' : '▼'}</span>
        </div>
      </button>
      {open && <div className="px-3 pb-3">{children}</div>}
    </div>
  )
}

export function ArrowEditor({ state, onChange }: ArrowEditorProps) {
  type PosKey = keyof ArrowEditorState['positions']
  type OffKey = keyof ArrowEditorState['offsets']

  const frame = getEquipFrame(state.axisPoints)

  function setPosition(key: PosKey, v: Vec3) { onChange({ ...state, positions: { ...state.positions, [key]: v } }) }
  function setOffset(key: OffKey, v: Vec3)   { onChange({ ...state, offsets:   { ...state.offsets,   [key]: v } }) }
  function setPositionLocal(key: PosKey, local: Vec3) { setPosition(key, localPtToWorld(local, frame)) }
  function setOffsetLocal(key: OffKey, local: Vec3)   { setOffset(key,   localDirToWorld(local, frame)) }
  function setScale(v: number)                { onChange({ ...state, arrowScale: v }) }
  function setMarkerSize(v: number)           { onChange({ ...state, markerSize: v }) }
  function setAxisPoint(key: keyof AxisPoints, v: Vec3) {
    onChange({ ...state, axisPoints: { ...state.axisPoints, [key]: v } })
  }
  function toggleArrow(id: string) {
    onChange({ ...state, visibleArrows: { ...state.visibleArrows, [id]: !state.visibleArrows[id] } })
  }
  function showAll() { onChange({ ...state, visibleArrows: Object.fromEntries(DEV_CORRECTIONS.map(c => [c.id, true])) }) }
  function hideAll() { onChange({ ...state, visibleArrows: Object.fromEntries(DEV_CORRECTIONS.map(c => [c.id, false])) }) }
  function reset()   { onChange(INITIAL_EDITOR_STATE) }

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900 p-4 text-slate-300">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-widest text-amber-400">Editor de Flechas</span>
        <div className="flex gap-2">
          <button onClick={reset} className="rounded border border-slate-700 px-2.5 py-1 text-xs text-slate-400 hover:border-slate-500 hover:text-slate-200">Reset</button>
          <button onClick={() => downloadMd(state)} className="rounded bg-amber-500 px-3 py-1 text-xs font-semibold text-slate-900 hover:bg-amber-400">Descargar .md</button>
        </div>
      </div>

      <Section
        title="Flechas visibles"
        extra={
          <div className="flex gap-2" onClick={e => e.stopPropagation()}>
            <button onClick={showAll} className="text-[10px] text-slate-400 underline hover:text-slate-200">todas</button>
            <button onClick={hideAll} className="text-[10px] text-slate-400 underline hover:text-slate-200">ninguna</button>
          </div>
        }
      >
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
          {DEV_CORRECTIONS.map(c => (
            <label key={c.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-slate-700/50">
              <input type="checkbox" checked={state.visibleArrows[c.id] !== false} onChange={() => toggleArrow(c.id)} className="accent-amber-400" />
              <span className="font-mono text-xs" style={{ color: PRIORITY_COLORS[c.priority] }}>
                {c.location.replace('front-', 'F-').replace('back-', 'B-')}·{c.direction.slice(0, 1).toUpperCase()}
              </span>
            </label>
          ))}
        </div>
      </Section>

      <Section title="Tamaño de flechas">
        <div className="flex items-center gap-3">
          <input type="range" min={0.5} max={30} step={0.5} value={state.arrowScale}
            onChange={e => setScale(parseFloat(e.target.value))} className="flex-1 accent-amber-400" />
          <input type="number" min={0.5} max={30} step={0.5} value={state.arrowScale}
            onChange={e => { const n = parseFloat(e.target.value); if (!isNaN(n)) setScale(n) }}
            className="w-16 rounded border border-slate-600 bg-slate-800 px-1.5 py-0.5 text-right text-xs text-slate-100 outline-none focus:border-amber-400" />
        </div>
      </Section>

      <Section title="Marcadores de eje">
        <div className="flex flex-col gap-2 mb-3">
          <Vec3Input label={<><span className="inline-block w-2 h-2 rounded-sm bg-[#ff4444] mr-1.5" />X₁</>} value={state.axisPoints.x1} onChange={v => setAxisPoint('x1', v)} />
          <Vec3Input label={<><span className="inline-block w-2 h-2 rounded-sm bg-[#ff4444] mr-1.5" />X₂</>} value={state.axisPoints.x2} onChange={v => setAxisPoint('x2', v)} />
          <Vec3Input label={<><span className="inline-block w-2 h-2 rounded-full bg-[#dd44ff] mr-1.5" />Z</>}  value={state.axisPoints.z}  onChange={v => setAxisPoint('z',  v)} />
          <div className="my-1 border-t border-slate-700" />
          <p className="text-[9px] text-slate-600">X = eje shaft · Y = vertical · Z = lateral</p>
          <Vec3Input
            label={<><span className="inline-block w-2 h-2 rounded-full bg-[#f97316] mr-1.5" />Acople</>}
            value={worldPtToLocal(state.axialPosition, frame)}
            onChange={v => onChange({ ...state, axialPosition: localPtToWorld(v, frame) })}
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="w-28 shrink-0 text-right text-xs text-slate-400">Tamaño marcadores</span>
          <input type="range" min={1} max={80} step={1} value={state.markerSize}
            onChange={e => setMarkerSize(parseFloat(e.target.value))} className="flex-1 accent-purple-400" />
          <input type="number" min={1} max={80} step={1} value={state.markerSize}
            onChange={e => { const n = parseFloat(e.target.value); if (!isNaN(n)) setMarkerSize(n) }}
            className="w-16 rounded border border-slate-600 bg-slate-800 px-1.5 py-0.5 text-right text-xs text-slate-100 outline-none focus:border-purple-400" />
        </div>
      </Section>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Section title="Posiciones de patas  [marco del equipo]" defaultOpen={false}>
          <p className="mb-2 text-[9px] text-slate-600">X = eje shaft · Y = vertical · Z = lateral</p>
          <div className="flex flex-col gap-2">
            <Vec3Input label="front-left"  value={worldPtToLocal(state.positions['front-left'],  frame)} onChange={v => setPositionLocal('front-left',  v)} />
            <Vec3Input label="front-right" value={worldPtToLocal(state.positions['front-right'], frame)} onChange={v => setPositionLocal('front-right', v)} />
            <Vec3Input label="back-left"   value={worldPtToLocal(state.positions['back-left'],   frame)} onChange={v => setPositionLocal('back-left',   v)} />
            <Vec3Input label="back-right"  value={worldPtToLocal(state.positions['back-right'],  frame)} onChange={v => setPositionLocal('back-right',  v)} />
          </div>
        </Section>

        <Section title="Offsets por dirección  [marco del equipo]" defaultOpen={false}>
          <p className="mb-2 text-[9px] text-slate-600">X = eje shaft · Y = vertical · Z = lateral</p>
          <div className="flex flex-col gap-2">
            <Vec3Input label="vertical"   value={worldDirToLocal(state.offsets.vertical,   frame)} onChange={v => setOffsetLocal('vertical',   v)} />
            <Vec3Input label="horizontal" value={worldDirToLocal(state.offsets.horizontal, frame)} onChange={v => setOffsetLocal('horizontal', v)} />
            <Vec3Input label="axial"      value={worldDirToLocal(state.offsets.axial,      frame)} onChange={v => setOffsetLocal('axial',      v)} />
          </div>
        </Section>
      </div>
    </div>
  )
}
