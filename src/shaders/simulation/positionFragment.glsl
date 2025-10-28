// Position update shader - updates positions based on velocity

uniform sampler2D positionTexture;
uniform sampler2D velocityTexture;
uniform float delta;
uniform float worldSize; // World boundary size (300)

varying vec2 vUv;

void main() {
    // Read current particle state
    vec4 posData = texture2D(positionTexture, vUv);
    vec4 velData = texture2D(velocityTexture, vUv);

    vec3 position = posData.xyz;
    float particleType = posData.w; // Particle type (0=dark matter, 1=gas, 2=stars)
    vec3 velocity = velData.xyz;

    // Integrate position
    position += velocity * delta;

    // Soft spherical boundary confinement (no hard cube edges!)
    // Gently push particles toward center if they drift too far
    float dist = length(position);
    float maxRadius = worldSize * 0.45; // Use 90% of half-world size

    if (dist > maxRadius) {
        // Calculate soft restoring force toward center
        vec3 pushDir = -normalize(position); // Direction toward origin
        float overshoot = dist - maxRadius;

        // Apply gentle push (increases with distance beyond boundary)
        // This creates a soft "pressure" that keeps particles contained
        float pushStrength = overshoot * 0.01; // Gentle, progressive force
        velocity += pushDir * pushStrength;
    }

    // Output updated position (preserve particle type)
    gl_FragColor = vec4(position, particleType);
}
