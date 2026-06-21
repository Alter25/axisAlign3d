import { useState } from 'react'
import { PRIORITY_COLORS } from '@/shared/lib/constants'

// ── Bloque colapsable interno ────────────────────────────────────────────────

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">{title}</p>
      {children}
    </div>
  )
}

// ── Paso numerado ────────────────────────────────────────────────────────────

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-800 text-[10px] font-bold text-white">
        {n}
      </span>
      <div>
        <p className="text-sm font-semibold text-slate-700">{title}</p>
        <div className="mt-0.5 text-xs leading-relaxed text-slate-500">{children}</div>
      </div>
    </div>
  )
}

// ── Componente principal ─────────────────────────────────────────────────────

export function UsageInstructions() {
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className="text-sm font-semibold text-slate-700">Instrucciones de uso</span>
        <span className="text-xs text-slate-400">{open ? '▲ ocultar' : '▼ mostrar'}</span>
      </button>

      {open && (
        <div className="flex flex-col gap-4 border-t border-slate-100 px-4 pb-4 pt-3">

          {/* ── Flujo de trabajo ── */}
          <Block title="Flujo de trabajo">
            <div className="flex flex-col gap-3">
              <Step n={1} title="Medir en campo">
                Con el equipo en marcha, toma lecturas con reloj comparador (runout axial y radial)
                y opcionalmente con vibrómetro o analizador (vibración vertical/horizontal + fase).
                Mide también la temperatura superficial de rodamientos con pirómetro infrarrojo.
              </Step>

              <Step n={2} title="Ingresar datos">
                Ingresa los valores en el formulario de la izquierda. Los campos de vibración son
                opcionales — con solo el runout ya obtienes una evaluación inicial. Pulsa{' '}
                <strong>Calcular</strong>.
              </Step>

              <Step n={3} title="Leer la escena 3D">
                Las flechas indican qué correcciones realizar y en qué pata. Rota la vista con el
                mouse para ver la escena desde distintos ángulos. El color indica la urgencia.
              </Step>

              <Step n={4} title="Aplicar correcciones">
                Sigue los pasos listados abajo en orden de prioridad. Aplica la corrección, vuelve
                a medir y repite hasta que todas las lecturas queden en zona A o B.
              </Step>
            </div>
          </Block>

          {/* ── Colores de prioridad ── */}
          <Block title="Prioridad de correcciones">
            <div className="flex flex-col gap-1.5">
              {([
                [1, 'Crítico — corregir inmediatamente, riesgo de daño'],
                [2, 'Advertencia — programar corrección a corto plazo'],
                [3, 'Revisión — monitorear, no requiere paro inmediato'],
              ] as const).map(([p, desc]) => (
                <div key={p} className="flex items-start gap-2">
                  <span
                    className="mt-0.5 h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: PRIORITY_COLORS[p] }}
                  />
                  <span className="text-xs text-slate-600">{desc}</span>
                </div>
              ))}
            </div>
          </Block>

          {/* ── Tipos de flecha ── */}
          <Block title="Tipos de corrección (flechas 3D)">
            <div className="flex flex-col gap-2">
              <div className="flex items-start gap-2">
                <span className="mt-0.5 text-sm">↑↓</span>
                <div>
                  <p className="text-xs font-semibold text-slate-700">Vertical (shimming)</p>
                  <p className="text-xs text-slate-500">
                    Flecha apunta hacia arriba (quitar shims) o abajo (agregar shims) bajo la pata indicada.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="mt-0.5 text-sm">←→</span>
                <div>
                  <p className="text-xs font-semibold text-slate-700">Horizontal (desplazamiento lateral)</p>
                  <p className="text-xs text-slate-500">
                    Flecha indica la dirección de desplazamiento lateral del motor sobre su base.
                    Perpendicular al eje del shaft.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="mt-0.5 text-sm">⟵⟶</span>
                <div>
                  <p className="text-xs font-semibold text-slate-700">Axial (desplazamiento sobre el eje)</p>
                  <p className="text-xs text-slate-500">
                    Flecha indica movimiento del motor a lo largo del eje del shaft (acercar o alejar
                    de la bomba). Aparece centrada en el equipo.
                  </p>
                </div>
              </div>
            </div>
          </Block>

          {/* ── Zonas ISO 10816 ── */}
          <Block title="Zonas ISO 10816 — Vibración (equipos clase II)">
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              {([
                ['Zona A', '< 2.3 mm/s', 'Máquina nueva — sin restricción'],
                ['Zona B', '< 4.5 mm/s', 'Operación prolongada aceptable'],
                ['Zona C', '< 7.1 mm/s', 'Operación limitada — programar mantenimiento'],
                ['Zona D', '> 7.1 mm/s', 'Zona de daño — detener equipo'],
              ] as const).map(([zona, rango, desc]) => (
                <div key={zona} className="col-span-2 flex items-baseline gap-2 leading-5">
                  <span className="w-14 shrink-0 text-xs font-bold text-slate-700">{zona}</span>
                  <span className="w-20 shrink-0 font-mono text-xs text-slate-500">{rango}</span>
                  <span className="text-xs text-slate-400">{desc}</span>
                </div>
              ))}
            </div>
          </Block>

          {/* ── Runout ── */}
          <Block title="Valores de referencia — Runout">
            <div className="grid grid-cols-2 gap-x-6 gap-y-0.5 text-xs">
              <div className="font-semibold text-slate-600">Runout axial</div>
              <div className="font-semibold text-slate-600">Runout radial</div>
              <div className="text-slate-500">Bueno: &lt; 50 µm</div>
              <div className="text-slate-500">Bueno: &lt; 30 µm</div>
              <div className="text-slate-500">Crítico: &gt; 100 µm</div>
              <div className="text-slate-500">Crítico: &gt; 75 µm</div>
            </div>
          </Block>

        </div>
      )}
    </div>
  )
}
