// Velocity update shader - calculates new velocities based on gravity

uniform sampler2D positionTexture;
uniform sampler2D velocityTexture;
uniform float time;
uniform float delta;
uniform float G; // Gravitational constant
uniform float textureSize;

varying vec2 vUv;

void main() {
    // Read current particle state
    vec4 posData = texture2D(positionTexture, vUv);
    vec4 velData = texture2D(velocityTexture, vUv);

    vec3 position = posData.xyz;
    float particleType = posData.w; // Note: This is particle type, not used in gravity calc
    vec3 velocity = velData.xyz;

    // Calculate gravitational acceleration from subset of particles
    vec3 acceleration = vec3(0.0);

    // Optimized N-body: sample every 4th particle (16x fewer calculations)
    // This approximation works well for large-scale gravitational dynamics
    float texelSize = 1.0 / textureSize;
    float stride = 4.0; // Sample every 4th particle

    for (float y = 0.0; y < textureSize; y += stride) {
        for (float x = 0.0; x < textureSize; x += stride) {
            vec2 otherUv = vec2((x + 0.5) * texelSize, (y + 0.5) * texelSize);

            // Skip self
            if (distance(otherUv, vUv) < texelSize * 0.5) {
                continue;
            }

            vec4 otherPosData = texture2D(positionTexture, otherUv);
            vec3 otherPos = otherPosData.xyz;
            // Note: Using uniform mass=1.0 for all particles (type doesn't affect gravity yet)
            float otherMass = 1.0;

            // Calculate force vector
            vec3 diff = otherPos - position;
            float dist = length(diff);

            // Avoid singularity with softening parameter
            float softening = 1.0;
            dist = max(dist, softening);

            // F = G * m1 * m2 / r²
            // a = F / m1 = G * m2 / r²
            // Multiply by stride² to compensate for sampling
            float forceMag = G * otherMass * (stride * stride) / (dist * dist);

            // Acceleration in direction of force
            acceleration += normalize(diff) * forceMag;
        }
    }

    // Integrate velocity (Euler method)
    velocity += acceleration * delta;

    // Damping (optional, slight energy loss for stability)
    velocity *= 0.9999;

    // Output updated velocity
    gl_FragColor = vec4(velocity, velData.w);
}
