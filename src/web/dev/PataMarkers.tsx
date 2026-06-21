import { useRef, useEffect, useCallback } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { PATA_POSITIONS } from '@/shared/lib/constants'

type PataKey = keyof typeof PATA_POSITIONS
type Vec3 = [number, number, number]

const MARKER_COLORS: Record<PataKey, string> = {
  'front-left':  '#f59e0b',
  'front-right': '#3b82f6',
  'back-left':   '#10b981',
  'back-right':  '#ef4444',
}

interface MarkerProps {
  id: PataKey
  position: Vec3
  onChange: (pos: Vec3) => void
}

function Marker({ id, position, onChange }: MarkerProps) {
  const groupRef  = useRef<THREE.Group>(null)
  const { camera, controls, gl } = useThree()
  const isDragging = useRef(false)
  const currentPos = useRef<Vec3>([...position])
  const dragPlane  = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), -position[1]))
  const raycaster  = useRef(new THREE.Raycaster())
  const hitPoint   = useRef(new THREE.Vector3())
  const colorHex   = MARKER_COLORS[id]
  const color      = new THREE.Color(colorHex)

  const [px, py, pz] = position
  useEffect(() => {
    dragPlane.current.set(new THREE.Vector3(0, 1, 0), -py)
    currentPos.current = [px, py, pz]
    if (!isDragging.current && groupRef.current) {
      groupRef.current.position.set(px, py, pz)
    }
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

  return (
    <group ref={groupRef} position={position} renderOrder={999}>
      {/* Esfera principal — depthTest=false para que siempre se vea */}
      <mesh
        renderOrder={999}
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
        <sphereGeometry args={[3, 16, 16]} />
        <meshBasicMaterial color={color} depthTest={false} transparent opacity={0.9} />
      </mesh>

      {/* Anillo horizontal para identificar el plano XZ */}
      <mesh rotation={[Math.PI / 2, 0, 0]} renderOrder={999}>
        <torusGeometry args={[5, 0.3, 8, 40]} />
        <meshBasicMaterial color={color} depthTest={false} transparent opacity={0.7} />
      </mesh>

      {/* Línea vertical (pin) hacia abajo para dar referencia de altura */}
      <lineSegments renderOrder={999}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array([0, 0, 0, 0, -20, 0]), 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color={color} depthTest={false} transparent opacity={0.5} />
      </lineSegments>
    </group>
  )
}

export interface PataMarkersProps {
  positions: Record<PataKey, Vec3>
  onChange: (key: PataKey, pos: Vec3) => void
}

export function PataMarkers({ positions, onChange }: PataMarkersProps) {
  return (
    <>
      {(Object.keys(positions) as PataKey[]).map(id => (
        <Marker
          key={id}
          id={id}
          position={positions[id]}
          onChange={(pos) => onChange(id, pos)}
        />
      ))}
    </>
  )
}
