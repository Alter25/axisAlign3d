import { Suspense, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Bounds, Environment } from '@react-three/drei'
import { EquipmentModel } from './EquipmentModel'
import { ArrowIndicators } from './ArrowIndicators'
import type { PositionsOverride, OffsetsOverride } from './ArrowIndicators'
import type { AlignmentCorrection } from '@/shared/types/alignment'
import { PataMarkers } from '../../dev/PataMarkers'
import type { PataMarkersProps } from '../../dev/PataMarkers'
import { AxisMarkers, CameraDriver, DragMarker } from '../../dev/AxisMarkers'
import type { AxisMarkersProps, ViewPreset } from '../../dev/AxisMarkers'

// Motor center: midpoint between front patas [-32,-13] and back patas [82,82] in XZ, Y≈30 for body height
const MOTOR_FOCUS: [number, number, number] = [25, 30, 35]
// Camera: same X as motor (centers it horizontally), above and behind in Z
const MOTOR_CAM: [number, number, number] = [25, 180, 250]

function MobileAdjust({ active }: { active: boolean }) {
  const applied = useRef(false)
  useFrame(({ camera, controls }) => {
    if (!active || applied.current || !controls) return
    applied.current = true
    const oc = controls as any
    camera.position.set(...MOTOR_CAM)
    oc.target.set(...MOTOR_FOCUS)
    oc.update()
  })
  return null
}

interface SceneProps {
  corrections: AlignmentCorrection[]
  devMode?: boolean
  positionsOverride?: PositionsOverride
  offsetsOverride?: OffsetsOverride
  arrowScale?: number
  autoRotate?: boolean
  devPositions?: PataMarkersProps['positions']
  onDevPositionChange?: PataMarkersProps['onChange']
  axisPoints?: AxisMarkersProps['points']
  onAxisPointsChange?: AxisMarkersProps['onChange']
  markerSize?: number
  axialPosition?: [number, number, number]
  onAxialPositionChange?: (pos: [number, number, number]) => void
  viewPreset?: ViewPreset
  isMobile?: boolean
}

function FallbackModel() {
  return (
    <group>
      {/* motor placeholder */}
      <mesh position={[-1.5, 0, 0]}>
        <boxGeometry args={[1.2, 0.8, 0.8]} />
        <meshStandardMaterial color="#475569" />
      </mesh>
      {/* bomba placeholder */}
      <mesh position={[1.5, 0, 0]}>
        <cylinderGeometry args={[0.4, 0.4, 0.8, 16]} />
        <meshStandardMaterial color="#334155" />
      </mesh>
      {/* eje placeholder */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.08, 0.08, 2.4, 8]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  )
}

export function Scene({
  corrections, devMode, positionsOverride, offsetsOverride, arrowScale, autoRotate = true,
  devPositions, onDevPositionChange,
  axisPoints, onAxisPointsChange, markerSize,
  axialPosition, onAxialPositionChange,
  viewPreset = 'free', isMobile = false,
}: SceneProps) {
  return (
    <Canvas
      style={{ width: '100%', height: '100%' }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      camera={{ position: [0, 5, 5], fov: 45 }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 10, 5]} intensity={1.2} castShadow />
      <directionalLight position={[-5, -5, -5]} intensity={0.3} />

      <Suspense fallback={<FallbackModel />}>
        {/* margin=1.4 → 40% de espacio libre alrededor del modelo */}
        <Bounds fit={!isMobile} clip margin={1.4}>
          <EquipmentModel />
        </Bounds>
        <Environment preset="city" />
      </Suspense>

      {devMode && (
        <>
          <axesHelper args={[5]} />
          <gridHelper args={[20, 20, '#334155', '#1e293b']} />
          {devPositions && onDevPositionChange && (
            <PataMarkers positions={devPositions} onChange={onDevPositionChange} />
          )}
          {axisPoints && onAxisPointsChange && (
            <AxisMarkers points={axisPoints} onChange={onAxisPointsChange} size={markerSize} />
          )}
          {axialPosition && onAxialPositionChange && (
            <DragMarker
              position={axialPosition}
              color="#f97316"
              shape="sphere"
              label="Axial"
              size={markerSize}
              onChange={onAxialPositionChange}
            />
          )}
          {axisPoints && (
            <CameraDriver preset={viewPreset} axisPoints={axisPoints} />
          )}
        </>
      )}

      <ArrowIndicators
        corrections={corrections}
        devMode={devMode}
        positionsOverride={positionsOverride}
        offsetsOverride={offsetsOverride}
        arrowScale={arrowScale}
        axisPoints={axisPoints}
        axialPosition={axialPosition}
      />

      <OrbitControls makeDefault autoRotate={autoRotate} autoRotateSpeed={0.6} minDistance={0.5} maxDistance={600} />
      <MobileAdjust active={isMobile && !devMode} />
    </Canvas>
  )
}
