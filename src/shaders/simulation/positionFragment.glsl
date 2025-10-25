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
    float mass = posData.w;
    vec3 velocity = velData.xyz;

    // Integrate position
    position += velocity * delta;

    // Output updated position
    gl_FragColor = vec4(position, mass);
}
