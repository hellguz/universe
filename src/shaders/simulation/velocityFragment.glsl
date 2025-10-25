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
    float mass = posData.w;
    vec3 velocity = velData.xyz;

    // Calculate gravitational acceleration from all other particles
    vec3 acceleration = vec3(0.0);

    // Direct N-body calculation (O(N²) - works for 16K particles)
    float texelSize = 1.0 / textureSize;

    for (float y = 0.0; y < textureSize; y++) {
        for (float x = 0.0; x < textureSize; x++) {
            vec2 otherUv = vec2((x + 0.5) * texelSize, (y + 0.5) * texelSize);

            // Skip self
            if (distance(otherUv, vUv) < texelSize * 0.5) {
                continue;
            }

            vec4 otherPosData = texture2D(positionTexture, otherUv);
            vec3 otherPos = otherPosData.xyz;
            float otherMass = otherPosData.w;

            // Calculate force vector
            vec3 diff = otherPos - position;
            float dist = length(diff);

            // Avoid singularity with softening parameter
            float softening = 1.0;
            dist = max(dist, softening);

            // F = G * m1 * m2 / r²
            // a = F / m1 = G * m2 / r²
            float forceMag = G * otherMass / (dist * dist);

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
