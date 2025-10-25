import { OrbitControls } from '@react-three/drei'

export default function Camera() {

  return (
    <OrbitControls
      enableDamping
      dampingFactor={0.05}
      rotateSpeed={0.5}
      zoomSpeed={0.8}
      panSpeed={0.5}
      minDistance={10}
      maxDistance={500}
      target={[0, 0, 0]}
    />
  )
}
