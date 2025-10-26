// Velocity update shader - OLD SIMPLE METHOD
// Optimized for 4M+ particles using spatial locality and fixed sample budget
// This is the original approach before Barnes-Hut

uniform sampler2D positionTexture;
uniform sampler2D velocityTexture;
uniform float time;
uniform float delta;
uniform float G; // Gravitational constant
uniform float textureSize;
uniform float softeningLength; // Prevent force singularities

varying vec2 vUv;

void main() {
    // Read current particle state
    vec4 posData = texture2D(positionTexture, vUv);
    vec4 velData = texture2D(velocityTexture, vUv);

    vec3 position = posData.xyz;
    float particleType = posData.w;
    vec3 velocity = velData.xyz;

    // Calculate gravitational acceleration with fixed sample budget
    vec3 acceleration = vec3(0.0);

    float texelSize = 1.0 / textureSize;
    float cutoffDistance = 80.0; // Only consider nearby particles
    int samplesPerParticle = 128; // Fixed computational budget

    // Adaptive stride: stride = textureSize / sqrt(samples)
    // This ensures (textureSize/stride)² ≈ samplesPerParticle
    float stride = textureSize / sqrt(float(samplesPerParticle));
    stride = max(stride, 2.0);

    // Sample particles with adaptive stride
    for (float y = 0.0; y < textureSize; y += stride) {
        for (float x = 0.0; x < textureSize; x += stride) {
            vec2 otherUv = vec2((x + 0.5) * texelSize, (y + 0.5) * texelSize);

            // Skip self
            if (distance(otherUv, vUv) < texelSize * 2.0) {
                continue;
            }

            vec4 otherPosData = texture2D(positionTexture, otherUv);
            vec3 otherPos = otherPosData.xyz;
            float otherMass = 1.0;

            // Calculate force vector
            vec3 diff = otherPos - position;
            float dist = length(diff);

            // Distance cutoff - ignore far particles
            if (dist > cutoffDistance) {
                continue;
            }

            // Avoid singularity with softening
            dist = max(dist, softeningLength);

            // Gravity calculation with resolution-independent scaling
            // Each sampled particle represents (stride²) particles
            float representedMass = otherMass * (stride * stride);
            float forceMag = G * representedMass / (dist * dist);

            // Normalize by (textureSize/256)² to keep consistent physics
            // This ensures same behavior at 256, 512, 1024, 2048
            float baseSize = 256.0;
            float resolutionScale = (baseSize / textureSize) * (baseSize / textureSize);
            forceMag *= resolutionScale;

            acceleration += normalize(diff) * forceMag;
        }
    }

    // Integrate velocity (Euler method)
    velocity += acceleration * delta;

    // Damping for stability (stronger for more particles)
    velocity *= 0.999;

    // Output updated velocity
    gl_FragColor = vec4(velocity, velData.w);
}
