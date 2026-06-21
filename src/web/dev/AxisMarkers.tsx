import { useRef, useEffect, useCallback } from 'react'
import { useThree } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import type { AxisPoints } from './ArrowEditor'

type Vec3 = [number, number, number]
export type ViewPreset = 'free' | 'top' | 'side' | 'front'

// ── Drag marker genérico ──────────────────────────────────────────────────────

interface DragMarkerProps {
  position: Vec3
  color: string
  shape: 'box' | 'octahedron' | 'sphere'
  label: string
  size?: number
  onChange: (pos: Vec3) => void
}

export function DragMarker({ position, color, shape, label, size = 24, onChange }: DragMarkerProps) {
  const groupRef  = useRef<THREE.Group>(null)
  const { camera, controls, gl } = useThree()
  const isDragging = useRef(false)
  const currentPos = useRef<Vec3>([...position])
  const dragPlane  = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), -position[1]))
  const raycaster  = useRef(new THREE.Raycaster())
  const hitPoint   = useRef(new THREE.Vector3())

  const [px, py, pz] = position
  useEffect(() => {
    dragPlane.current.set(new THREE.Vector3(0, 1, 0), -py)
    currentPos.current = [px, py, pz]
    if (!isDragging.current && groupRef.current) groupRef.current.position.set(px, py, pz)
  }, [px, py, pz])

  const onPointerMove = useCallback((e: PointerEvent) => {
    if (!isDragging.current || !groupRef.current) return
    const rect = gl.domElement.getBoundingClientRect()
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1
    const ny = -((e.clientY - rect.top) / rect.height) * 2 + 1
    raycaster.current.setFromCamera(new THREE.Vector2(nx, ny), camera)
    if (raycaster.current.ray.intersectPlane(dragPlane.current, hitPoint.current)) {
      const next: Vec3 = [hitPoint.current.x, currentPos.current[1], hitPoint.current.z]
      currentPos.current = next
      groupRef.current.position.set(next[0], next[1], next[2])
    }
  }, [camera, gl])

  const onPointerUp = useCallback(() => {
    if (!isDragging.current) return
    isDragging.current = false
    if (controls) (controls as any).enabled = true
    document.body.style.cursor = ''
    onChange([...currentPos.current])
  }, [controls, onChange])

  useEffect(() => {
    const el = gl.domElement
    el.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    return () => {
      el.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
    }
  }, [gl, onPointerMove, onPointerUp])

  const mat = <meshBasicMaterial color={color} depthTest={false} transparent opacity={0.9} />

  return (
    <group ref={groupRef} position={position} renderOrder={998}>
      <mesh
        renderOrder={998}
        onPointerDown={(e) => {
          e.stopPropagation()
          isDragging.current = true
          currentPos.current = [...position]
          dragPlane.current.set(new THREE.Vector3(0, 1, 0), -position[1])
          if (controls) (controls as any).enabled = false
          document.body.style.cursor = 'grabbing'
        }}
        onPointerEnter={() => { if (!isDragging.current) document.body.style.cursor = 'grab' }}
        onPointerLeave={() => { if (!isDragging.current) document.body.style.cursor = '' }}
      >
        {shape === 'box'
          ? <boxGeometry args={[size, size, size]} />
          : shape === 'sphere'
            ? <sphereGeometry args={[size * 0.6, 12, 8]} />
            : <octahedronGeometry args={[size * 0.7]} />
        }
        {mat}
      </mesh>

      <Html
        center
        distanceFactor={12}
        position={[0, size + 1, 0]}
        style={{ pointerEvents: 'none' }}
      >
        <span style={{
          color,
          fontSize: '13px',
          fontWeight: 900,
          fontFamily: 'monospace',
          textShadow: '0 0 6px #000, 0 0 3px #000',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          userSelect: 'none',
        }}>
          {label}
        </span>
      </Html>
    </group>
  )
}

// ── Línea auxiliar (depthTest=false) ────────────────────────────────────────

function DevLine({ from, to, color, opacity = 0.8 }: { from: Vec3; to: Vec3; color: string; opacity?: number }) {
  return (
    <lineSegments renderOrder={997}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[new Float32Array([...from, ...to]), 3]}
        />
      </bufferGeometry>
      <lineBasicMaterial color={color} depthTest={false} transparent opacity={opacity} />
    </lineSegments>
  )
}

// ── Ejes computados desde los 3 puntos ──────────────────────────────────────

function ComputedAxes({ pts }: { pts: AxisPoints }) {
  const x1 = new THREE.Vector3(...pts.x1)
  const x2 = new THREE.Vector3(...pts.x2)
  const zPt = new THREE.Vector3(...pts.z)

  const center = new THREE.Vector3().lerpVectors(x1, x2, 0.5)
  const xDir = new THREE.Vector3().subVectors(x2, x1).normalize()
  const toZ = new THREE.Vector3().subVectors(zPt, center)
  const zDir = toZ.clone().sub(xDir.clone().multiplyScalar(toZ.dot(xDir))).normalize()
  const yDir = new THREE.Vector3().crossVectors(xDir, zDir).normalize()

  const axisLen = Math.max(x1.distanceTo(x2) * 0.6, 3)
  const c = [center.x, center.y, center.z] as Vec3
  const xEnd: Vec3 = [center.x + xDir.x * axisLen, center.y + xDir.y * axisLen, center.z + xDir.z * axisLen]
  const yEnd: Vec3 = [center.x + yDir.x * axisLen, center.y + yDir.y * axisLen, center.z + yDir.z * axisLen]
  const zEnd: Vec3 = [center.x + zDir.x * axisLen, center.y + zDir.y * axisLen, center.z + zDir.z * axisLen]

  return (
    <>
      {/* X eje del equipo: X1 → X2 completo + flecha desde centro */}
      <DevLine from={pts.x1} to={pts.x2} color="#ff4444" opacity={0.5} />
      <DevLine from={c} to={xEnd} color="#ff4444" />
      {/* Y (calculado) */}
      <DevLine from={c} to={yEnd} color="#44ff44" />
      {/* Z */}
      <DevLine from={c} to={zEnd} color="#4488ff" />
    </>
  )
}

// ── Componente principal ─────────────────────────────────────────────────────

export interface AxisMarkersProps {
  points: AxisPoints
  onChange: (p: AxisPoints) => void
  size?: number
}

export function AxisMarkers({ points, onChange, size }: AxisMarkersProps) {
  return (
    <>
      <ComputedAxes pts={points} />

      {/* X1: cubo rojo */}
      <DragMarker
        position={points.x1}
        color="#ff4444"
        shape="box"
        label="X₁"
        size={size}
        onChange={pos => onChange({ ...points, x1: pos })}
      />
      {/* X2: cubo rojo */}
      <DragMarker
        position={points.x2}
        color="#ff4444"
        shape="box"
        label="X₂"
        size={size}
        onChange={pos => onChange({ ...points, x2: pos })}
      />
      {/* Z: octaedro magenta */}
      <DragMarker
        position={points.z}
        color="#dd44ff"
        shape="octahedron"
        label="Z"
        size={size}
        onChange={pos => onChange({ ...points, z: pos })}
      />
    </>
  )
}

// ── Camera Driver ────────────────────────────────────────────────────────────
// Componente interno del Canvas; mueve la cámara al preset indicado.
// Usa ref para axisPoints → solo reacciona al cambio de preset, no a cada drag.

interface CameraDriverProps {
  preset: ViewPreset
  axisPoints: AxisPoints
}

export function CameraDriver({ preset, axisPoints }: CameraDriverProps) {
  const { camera, controls } = useThree()
  const axisRef = useRef(axisPoints)
  axisRef.current = axisPoints

  useEffect(() => {
    if (preset === 'free') return
    const { x1, x2, z: zPt } = axisRef.current

    const vX1    = new THREE.Vector3(...x1)
    const vX2    = new THREE.Vector3(...x2)
    const vZ     = new THREE.Vector3(...zPt)
    const center = new THREE.Vector3().lerpVectors(vX1, vX2, 0.5)
    const xDir   = new THREE.Vector3().subVectors(vX2, vX1).normalize()

    const toZ  = new THREE.Vector3().subVectors(vZ, center)
    const zDir = toZ.clone().sub(xDir.clone().multiplyScalar(toZ.dot(xDir))).normalize()
    const yDir = new THREE.Vector3().crossVectors(xDir, zDir).normalize()

    const dist = Math.max(vX1.distanceTo(vX2) * 3, 8)

    const pos = center.clone()
    const up  = new THREE.Vector3()

    if (preset === 'top') {
      // Vista de planta: cámara arriba, mirando hacia abajo; X del equipo apunta a la derecha
      pos.addScaledVector(yDir, dist)
      up.copy(xDir)
    } else if (preset === 'side') {
      // Vista lateral: desde el lado Z, Y del equipo apunta arriba
      pos.addScaledVector(zDir, dist)
      up.copy(yDir)
    } else if (preset === 'front') {
      // Vista frontal: desde el eje X, Y apunta arriba
      pos.addScaledVector(xDir, dist)
      up.copy(yDir)
    }

    camera.position.copy(pos)
    camera.up.copy(up)
    camera.lookAt(center)
    camera.updateProjectionMatrix()

    if (controls) {
      const ctrl = controls as any
      ctrl.target.copy(center)
      ctrl.update()
    }
  }, [preset]) // solo dispara cuando cambia el preset

  return null
}
