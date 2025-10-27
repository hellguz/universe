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

    // Boundary wrapping to keep particles in simulation volume
    // Wrap around world boundaries (periodic boundary conditions)
    float halfWorld = worldSize * 0.5;

    if (position.x > halfWorld) position.x -= worldSize;
    if (position.x < -halfWorld) position.x += worldSize;
    if (position.y > halfWorld) position.y -= worldSize;
    if (position.y < -halfWorld) position.y += worldSize;
    if (position.z > halfWorld) position.z -= worldSize;
    if (position.z < -halfWorld) position.z += worldSize;

    // Output updated position (preserve particle type)
    gl_FragColor = vec4(position, particleType);
}
