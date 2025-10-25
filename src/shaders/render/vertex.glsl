// Render vertex shader - positions particles in 3D space

uniform sampler2D positionTexture;
uniform float particleSize;

attribute vec2 particleUv; // UV for sampling FBO texture

varying vec3 vPosition;
varying float vMass;

void main() {
    // Sample position from FBO texture
    vec4 posData = texture2D(positionTexture, particleUv);
    vec3 pos = posData.xyz;
    float mass = posData.w;

    vPosition = pos;
    vMass = mass;

    // Transform to clip space
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // Particle size based on distance (perspective scaling)
    float distanceScale = 1.0 / -mvPosition.z;
    gl_PointSize = particleSize * distanceScale * 100.0;
}
