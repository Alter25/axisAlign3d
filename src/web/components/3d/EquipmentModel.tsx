import { useGLTF } from '@react-three/drei'

const MODEL_PATH = '/src/assets/models/pump-motor-assembly.glb'

export function EquipmentModel() {
  const { scene } = useGLTF(MODEL_PATH)

  return (
    <primitive
      object={scene}
      scale={1}
      position={[0, 0, 0]}
      rotation={[0, Math.PI / 4, 0]}
    />
  )
}

useGLTF.preload(MODEL_PATH)
