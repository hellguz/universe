import { useRef, useMemo } from 'react';
import * as THREE from 'three';

export function ParticleSystem({ particles }) {
  const pointsRef = useRef();

  const [positions, colors] = useMemo(() => {
    if (!particles) return [null, null];

    const positions = new Float32Array(particles.positions);
    const colors = new Float32Array(particles.colors);

    return [positions, colors];
  }, [particles]);

  if (!particles || !positions || !colors) return null;

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particles.count}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={particles.count}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.8}
        vertexColors
        sizeAttenuation={true}
        transparent={false}
        toneMapped={false}
      />
    </points>
  );
}
