import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { Group } from 'three'
import type { AlignmentCorrection } from '@/shared/types/alignment'
import { PATA_POSITIONS, DIRECTION_OFFSETS, PRIORITY_COLORS, AXIS_POINTS, AXIAL_ARROW_POSITION } from '@/shared/lib/constants'
import type { AxisPoints } from '../../dev/ArrowEditor'

const PATA_KEYS = new Set(Object.keys(PATA_POSITIONS))

export type PositionsOverride = Partial<Record<keyof typeof PATA_POSITIONS, [number, number, number]>>
export type OffsetsOverride   = Partial<typeof DIRECTION_OFFSETS>

export interface ArrowIndicatorsProps {
  corrections: AlignmentCorrection[]
  devMode?: boolean
  positionsOverride?: PositionsOverride
  offsetsOverride?: OffsetsOverride
  arrowScale?: number
  axisPoints?: AxisPoints
  axialPosition?: [number, number, number]
}

interface Arrow3DProps {
  correction: AlignmentCorrection
  positionsOverride?: PositionsOverride
  offsetsOverride?: OffsetsOverride
  arrowScale?: number
  axisPoints: AxisPoints
  axialPosition?: [number, number, number]
}

// Calcula xDir (rojo, shaft), yDir (verde, vertical), zDir (azul, lateral) y centro
function computeAxisVectors(ap: AxisPoints) {
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

const _up = new THREE.Vector3(0, 1, 0)

function sideQuaternion(side: string, xDir: THREE.Vector3, yDir: THREE.Vector3, zDir: THREE.Vector3): THREE.Quaternion {
  let target: THREE.Vector3
  switch (side) {
    case 'bottom': target = yDir.clone().negate(); break
    case 'right':  target = zDir.clone(); break
    case 'left':   target = zDir.clone().negate(); break
    case 'front':  target = xDir.clone(); break
    case 'back':   target = xDir.clone().negate(); break
    default:       target = yDir.clone()           // 'top'
  }
  return new THREE.Quaternion().setFromUnitVectors(_up, target.normalize())
}

function Arrow3D({ correction, positionsOverride, offsetsOverride, arrowScale = 15, axisPoints, axialPosition }: Arrow3DProps) {
  const groupRef = useRef<Group>(null)
  const color    = PRIORITY_COLORS[correction.priority]

  const positions = { ...PATA_POSITIONS, ...positionsOverride }
  const offsets   = { ...DIRECTION_OFFSETS, ...offsetsOverride }
  const offset    = offsets[correction.direction as keyof typeof DIRECTION_OFFSETS] ?? [0, 0, 0]

  const { xDir, yDir, zDir, center } = useMemo(() => computeAxisVectors(axisPoints), [axisPoints])

  const position: [number, number, number] = useMemo(() => {
    const couplingCenter: [number, number, number] = axialPosition ?? AXIAL_ARROW_POSITION
    const base = (correction.direction === 'axial' || correction.location === 'shaft')
      ? couplingCenter
      : (positions[correction.location as keyof typeof PATA_POSITIONS] ?? [0, 0, 0])
    return [base[0] + offset[0], base[1] + offset[1], base[2] + offset[2]]
  }, [correction.location, correction.direction, axialPosition, center, offset, positions])

  const quaternion = useMemo(() => {
    return sideQuaternion(correction.side, xDir, yDir, zDir)
  }, [correction.side, xDir, yDir, zDir])

  const emissive = correction.priority === 1 ? 0.6 : 0.2

  useFrame(() => {
    if (correction.priority !== 1 || !groupRef.current) return
    groupRef.current.scale.setScalar(arrowScale * (1 + Math.sin(Date.now() / 400) * 0.12))
  })

  return (
    <group ref={groupRef} position={position} scale={arrowScale} renderOrder={10}>
      <group quaternion={quaternion}>
        <mesh renderOrder={10}>
          <cylinderGeometry args={[0.04, 0.04, 0.5, 8]} />
          <meshStandardMaterial
            color={color} emissive={color} emissiveIntensity={emissive}
            depthTest={false} depthWrite={false} transparent
          />
        </mesh>
        <mesh position={[0, 0.375, 0]} renderOrder={10}>
          <coneGeometry args={[0.1, 0.25, 8]} />
          <meshStandardMaterial
            color={color} emissive={color} emissiveIntensity={emissive}
            depthTest={false} depthWrite={false} transparent
          />
        </mesh>
      </group>
    </group>
  )
}

export function ArrowIndicators({ corrections, positionsOverride, offsetsOverride, arrowScale, axisPoints, axialPosition }: ArrowIndicatorsProps) {
  const resolvedAxis = axisPoints ?? AXIS_POINTS
  const visible = corrections.filter(c =>
    c.visible !== false && (PATA_KEYS.has(c.location) || c.direction === 'axial' || c.location === 'shaft')
  )
  if (import.meta.env.DEV) {
    console.log('[ArrowIndicators] corrections:', corrections.length, '| visible:', visible.length, visible.map(c => `${c.id}@${c.location}`))
  }
  return (
    <>
      {visible.map(c => (
        <Arrow3D
          key={c.id}
          correction={c}
          positionsOverride={positionsOverride}
          offsetsOverride={offsetsOverride}
          arrowScale={arrowScale}
          axisPoints={resolvedAxis}
          axialPosition={axialPosition}
        />
      ))}
    </>
  )
}
