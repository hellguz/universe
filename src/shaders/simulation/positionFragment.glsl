// Position update shader - updates positions based on velocity

uniform sampler2D positionTexture;
uniform sampler2D velocityTexture;
uniform float delta;

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

    // Output updated position (preserve particle type)
    gl_FragColor = vec4(position, particleType);
}
