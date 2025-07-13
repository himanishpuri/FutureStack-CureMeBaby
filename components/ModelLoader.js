import { useLoader } from '@react-three/fiber'
import { MTLLoader, OBJLoader } from 'three-stdlib'

export default function ModelLoader({ modelPath, mtlPath, position, rotation, scale = 1 }) {
  const materials = useLoader(MTLLoader, mtlPath)
  const obj = useLoader(OBJLoader, modelPath, (loader) => {
    materials.preload()
    loader.setMaterials(materials)
  })

  return (
    <primitive 
      object={obj} 
      position={position}
      rotation={rotation}
      scale={scale}
    />
  )
} 