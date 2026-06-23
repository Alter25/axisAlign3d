import { useGLTF } from '@react-three/drei'
import modelUrl from '@/assets/models/pump-motor-assembly.glb'

export function EquipmentModel() {
  const { scene } = useGLTF(modelUrl)

  return (
    <primitive
      object={scene}
      scale={1}
      position={[0, 0, 0]}
      rotation={[0, Math.PI / 4, 0]}
    />
  )
}

useGLTF.preload(modelUrl)
