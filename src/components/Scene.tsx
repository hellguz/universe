import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import Camera from './Camera'
import ParticleSystem from './ParticleSystem'
import { CAMERA_FOV, CAMERA_NEAR, CAMERA_FAR } from '../utils/constants'

export default function Scene() {
  return (
    <Canvas
      camera={{
        fov: CAMERA_FOV,
        near: CAMERA_NEAR,
        far: CAMERA_FAR,
        position: [0, 50, 100]
      }}
      dpr={[1, 2]}
      gl={{
        antialias: false,
        alpha: false,
        powerPreference: 'high-performance'
      }}
    >
      {/* Black background for maximum color contrast */}
      <color attach="background" args={['#000000']} />

      {/* Camera controls */}
      <Camera />

      {/* Main particle system */}
      <Suspense fallback={null}>
        <ParticleSystem />
      </Suspense>

      {/* Post-processing effects */}
      <EffectComposer>
        <Bloom
          intensity={0.8}
          luminanceThreshold={0.2}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
      </EffectComposer>
    </Canvas>
  )
}
