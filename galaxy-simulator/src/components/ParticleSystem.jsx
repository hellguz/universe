import { useRef, useEffect, useMemo } from 'react';

export function ParticleSystem({ particles }) {
  const pointsRef = useRef();

  const [initialPositions, colors] = useMemo(() => {
    if (!particles) return [null, null];

    const positions = new Float32Array(particles.positions);
    const colors = new Float32Array(particles.colors);

    return [positions, colors];
  }, [particles.count]); // Only recreate when particle count changes

  // Update positions when particles change
  useEffect(() => {
    if (!pointsRef.current || !particles) return;

    const positionAttribute = pointsRef.current.geometry.attributes.position;

    // Copy updated positions from particles
    for (let i = 0; i < particles.count * 3; i++) {
      positionAttribute.array[i] = particles.positions[i];
    }

    positionAttribute.needsUpdate = true;
  }, [particles]);

  if (!particles || !initialPositions || !colors) return null;

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particles.count}
          array={initialPositions}
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
