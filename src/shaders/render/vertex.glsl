// Render vertex shader - positions particles in 3D space

uniform sampler2D positionTexture;
uniform sampler2D velocityTexture;
uniform float particleSize;

attribute vec2 particleUv; // UV for sampling FBO texture

varying vec3 vPosition;
varying float vType; // Particle type: 0=dark matter, 1=gas, 2=stars
varying float vTempOrAge; // Temperature for gas (0-1), Age for stars (0-1)

void main() {
    // Sample position and velocity from FBO textures
    vec4 posData = texture2D(positionTexture, particleUv);
    vec4 velData = texture2D(velocityTexture, particleUv);
    vec3 pos = posData.xyz;
    float particleType = posData.w;
    float tempOrAge = velData.w; // Dual-purpose: temperature for gas, age for stars

    vPosition = pos;
    vType = particleType; // Read particle type from texture (4th channel)
    vTempOrAge = tempOrAge; // Gas: temperature (0=cold, 1=hot) | Stars: age (0=young, 1=old)

    // Transform to clip space
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // Particle size variation based on type
    float typeScale = 1.0;
    if (particleType < 0.5) {
        typeScale = 0.7; // Dark matter: smaller, dimmer
    } else if (particleType < 1.5) {
        typeScale = 1.0; // Gas: standard size
    } else if (particleType < 2.5) {
        typeScale = 1.8; // Main sequence stars: larger, brighter points
    } else if (particleType < 3.0) {
        typeScale = 4.5; // Red giants: HUGE (4.5x larger than main sequence)
    } else if (particleType < 4.0) {
        typeScale = 0.5; // White dwarfs: TINY (Earth-sized objects, very compact)
    } else {
        typeScale = 0.3; // Neutron stars/black holes: extremely small (future)
    }

    // Particle size based on distance (perspective scaling)
    float distanceScale = 1.0 / -mvPosition.z;
    gl_PointSize = particleSize * typeScale * distanceScale * 100.0;
}
