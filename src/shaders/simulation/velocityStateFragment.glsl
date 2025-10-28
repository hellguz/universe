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
uniform float blackHoleAccretionRadius; // Gas heating zone around black holes
uniform float blackHoleAccretionHeating; // Heating rate in accretion zone

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
        // Newly formed stars inherit gas temperature (0.1-0.4) - need to initialize to age 0.0
        // Use marker value 0.995 to indicate "needs initialization" to avoid reset loop

        if (tempOrAge >= 0.1 && tempOrAge <= 0.4) {
            // Newly formed star (just converted from gas, has formation temp range)
            // Mark for initialization next frame (avoids reset loop when stars age to 0.1+)
            tempOrAge = 0.995; // Marker value
        } else if (tempOrAge > 0.99) {
            // Marked for initialization, reset to age 0.0 and start aging
            tempOrAge = 0.0;
        } else {
            // Existing star - age normally (cap at 0.98 to avoid marker value)
            tempOrAge = min(tempOrAge + agingRate * delta, 0.98);
        }
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
    // ===== NEUTRON STAR FORMATION =====
    else if (particleType >= 4.0 && particleType < 5.0) {
        // Neutron star (type 4.0): Supernova remnant
        // velocity.w stores cooling/age since formation
        if (tempOrAge >= 0.84 && tempOrAge < 0.87) {
            // Newly formed from supernova (inherited parent age ~0.85) - trigger bright flash ONCE!
            // Set to high value for flash, but will immediately cool to 0.8 next frame
            tempOrAge = 0.99; // Maximum brightness for visual flash
        } else if (tempOrAge > 0.98) {
            // Just finished flashing - cool down quickly to exit trigger range
            tempOrAge = 0.8; // Drop below trigger threshold to prevent re-flash
        } else {
            // Normal cooling - neutron stars cool over time
            tempOrAge = max(tempOrAge - agingRate * delta * 1.0, 0.1); // Cool down from 0.8 → 0.1
        }
    }
    // ===== BLACK HOLE FORMATION & ACCRETION =====
    else if (particleType >= 5.0 && particleType < 6.0) {
        // Black hole (type 5.0): Supernova remnant with extreme gravity
        // velocity.w stores "activity" level (accretion state)
        if (tempOrAge >= 0.84 && tempOrAge < 0.87) {
            // Newly formed from supernova (inherited parent age ~0.85) - trigger bright flash ONCE!
            // Set to high value for flash, but will immediately cool to 0.83 next frame
            tempOrAge = 0.99; // Maximum brightness for visual flash
        } else if (tempOrAge > 0.98) {
            // Just finished flashing - cool down quickly to exit trigger range
            tempOrAge = 0.83; // Drop below trigger threshold to prevent re-flash, but keep high
        } else {
            // Black holes maintain high activity from accretion
            // Cool slowly from initial flash, but maintain minimum glow
            tempOrAge = max(tempOrAge - agingRate * delta * 0.2, 0.75); // Slow cooling, high floor for glow
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
