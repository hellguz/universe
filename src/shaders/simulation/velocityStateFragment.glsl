// Velocity state update shader - updates temperature when particle type changes
// Companion to stateFragment.glsl, updates velocity/temperature data

uniform sampler2D positionTexture; // Read updated particle types
uniform sampler2D velocityTexture; // Read current velocity/temperature
uniform float time;

varying vec2 vUv;

// Particle type constants
const float TYPE_DARK_MATTER = 0.0;
const float TYPE_GAS = 1.0;
const float TYPE_STAR = 2.0;

// Simple pseudo-random function
float random(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233)) + time) * 43758.5453123);
}

void main() {
    // Read current state
    vec4 posData = texture2D(positionTexture, vUv);
    vec4 velData = texture2D(velocityTexture, vUv);

    float particleType = posData.w;
    vec3 velocity = velData.xyz;
    float temperature = velData.w;

    // Update temperature based on particle type
    // This ensures newly formed stars get hot temperature
    if (particleType > 1.5) {
        // Star: ensure hot temperature if not already set
        if (temperature < 0.7) {
            // Newly formed star - heat it up!
            temperature = 0.7 + random(vUv) * 0.3; // 0.7-1.0 (hot young star)
        }
    }

    // Output updated velocity and temperature
    gl_FragColor = vec4(velocity, temperature);
}
