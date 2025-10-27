// Velocity state update shader - updates temperature/age when particle type changes
// Companion to stateFragment.glsl, updates velocity/temperature/age data

uniform sampler2D positionTexture; // Read updated particle types
uniform sampler2D velocityTexture; // Read current velocity/temperature/age
uniform sampler2D massTexture; // Hierarchical mass distribution for stellar feedback
uniform float time;
uniform float delta;
uniform float agingRate; // Stellar aging rate per frame
uniform float coolingRate; // Gas cooling rate per frame
uniform float gridSize; // Mass grid size (64)
uniform float worldSize; // World space size (300)
uniform float massTextureSize; // Mass texture size (512)

varying vec2 vUv;

// Particle type constants
const float TYPE_DARK_MATTER = 0.0;
const float TYPE_GAS = 1.0;
const float TYPE_STAR = 2.0;

// Simple pseudo-random function
float random(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233)) + time) * 43758.5453123);
}

// Convert world position to grid coordinates
vec3 worldToGrid(vec3 worldPos) {
  vec3 centered = worldPos + vec3(worldSize * 0.5);
  vec3 gridPos = (centered / worldSize) * gridSize;
  return clamp(gridPos, vec3(0.0), vec3(gridSize - 1.0));
}

// Convert 3D grid coordinates to 2D texture UV
vec2 grid3DTo2D(vec3 gridPos) {
  float layersPerRow = massTextureSize / gridSize; // 8 for 512/64

  float z = gridPos.z;
  float layerX = mod(z, layersPerRow);
  float layerY = floor(z / layersPerRow);

  float pixelX = layerX * gridSize + gridPos.x;
  float pixelY = layerY * gridSize + gridPos.y;

  return vec2(
    (pixelX + 0.5) / massTextureSize,
    (pixelY + 0.5) / massTextureSize
  );
}

void main() {
    // Read current state
    vec4 posData = texture2D(positionTexture, vUv);
    vec4 velData = texture2D(velocityTexture, vUv);

    float particleType = posData.w;
    vec3 velocity = velData.xyz;
    float tempOrAge = velData.w; // Temperature for gas, age for stars

    // ===== STAR AGING =====
    if (particleType > 1.5 && particleType < 3.0) {
        // Stars (main sequence and red giants): velocity.w stores AGE (0.0 = newborn, 1.0 = ancient)
        // Stars now form from cold gas (temp 0.1-0.4), so they inherit reasonable starting ages
        // No reset needed - just age normally!
        tempOrAge = min(tempOrAge + agingRate * delta, 0.99);
    }
    // ===== WHITE DWARF AGING =====
    else if (particleType >= 3.0 && particleType < 4.0) {
        // White dwarf (type 3.0): velocity.w stores cooling time
        // Newly formed white dwarfs have age ~0.95 from red giant phase
        // Reset to 0.0 to represent fresh, hot white dwarf that cools over time
        if (tempOrAge > 0.9) {
            // Newly formed white dwarf - reset to hot state
            tempOrAge = 0.0; // 0.0 = hot blue-white, 1.0 = cool dim white dwarf
        } else {
            // White dwarfs cool slowly over time
            tempOrAge = min(tempOrAge + agingRate * delta * 0.1, 0.99); // Cool 10x slower than stars age
        }
    }
    // ===== GAS COOLING & STELLAR FEEDBACK HEATING =====
    else if (particleType > 0.5 && particleType < 1.5) {
        // Gas: velocity.w stores TEMPERATURE (0.0 = cold, 1.0 = hot)

        // Check local density from mass grid
        vec3 position = posData.xyz;
        vec3 gridPos = worldToGrid(position);
        vec2 uv = grid3DTo2D(gridPos);
        vec4 massData = texture2D(massTexture, uv);
        float localDensity = massData.w; // Total mass in this cell

        // STELLAR FEEDBACK: Gas in high-density regions (star-forming/stellar zones) gets heated
        // High density indicates presence of stars or star formation
        float heatingThreshold = 2.0; // Higher than star formation threshold (0.8) to allow cooling first
        if (localDensity > heatingThreshold) {
            // Heat up gas in stellar neighborhoods
            // More density = more heating (young star clusters are hot!)
            float heatingAmount = 0.001 * (localDensity - heatingThreshold);
            tempOrAge = min(tempOrAge + heatingAmount * delta, 0.95); // Heat up, cap at 0.95
        } else {
            // Gradually cool down gas in low-density regions
            tempOrAge = max(tempOrAge - coolingRate * delta, 0.1); // Min temperature 0.1
        }
    }
    // Dark matter: no temperature or age

    // Output updated velocity and temperature/age
    gl_FragColor = vec4(velocity, tempOrAge);
}
