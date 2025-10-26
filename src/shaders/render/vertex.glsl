// Render vertex shader - positions particles in 3D space

uniform sampler2D positionTexture;
uniform sampler2D velocityTexture;
uniform float particleSize;

attribute vec2 particleUv; // UV for sampling FBO texture

varying vec3 vPosition;
varying float vType; // Particle type: 0=dark matter, 1=gas, 2=stars
varying float vTemperature; // Temperature: 0.0-1.0

void main() {
    // Sample position and velocity from FBO textures
    vec4 posData = texture2D(positionTexture, particleUv);
    vec4 velData = texture2D(velocityTexture, particleUv);
    vec3 pos = posData.xyz;
    float particleType = posData.w;
    float temperature = velData.w;

    vPosition = pos;
    vType = particleType; // Read particle type from texture (4th channel)
    vTemperature = temperature; // Read temperature from velocity texture (4th channel)

    // Transform to clip space
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // Particle size variation based on type
    float typeScale = 1.0;
    if (particleType < 0.5) {
        typeScale = 0.7; // Dark matter: smaller, dimmer
    } else if (particleType < 1.5) {
        typeScale = 1.0; // Gas: standard size
    } else {
        typeScale = 1.8; // Stars: larger, brighter points
    }

    // Particle size based on distance (perspective scaling)
    float distanceScale = 1.0 / -mvPosition.z;
    gl_PointSize = particleSize * typeScale * distanceScale * 100.0;
}
