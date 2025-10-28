// State update shader - handles particle type transitions
// Gas → Star formation based on density and temperature

uniform sampler2D positionTexture;
uniform sampler2D velocityTexture;
uniform sampler2D massTexture; // Hierarchical mass distribution for density lookup
uniform float time;
uniform float delta;
uniform float gridSize; // Mass grid size (64)
uniform float worldSize; // World space size (300)
uniform float massTextureSize; // Mass texture size (512)

// Star formation parameters
uniform float formationDensity; // Density threshold for star formation
uniform float formationTempMin; // Minimum temperature for star formation
uniform float formationTempMax; // Maximum temperature for star formation
uniform float formationRate; // Probability per frame

// Supernova parameters
uniform float supernovaAgeThreshold; // Age at which stars can go supernova
uniform float supernovaProbability; // Chance a star goes supernova vs red giant
uniform float blackHoleProbability; // Chance supernova creates black hole vs neutron star

varying vec2 vUv;

// Particle type constants
const float TYPE_DARK_MATTER = 0.0;
const float TYPE_GAS = 1.0;
const float TYPE_STAR = 2.0;

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

// Simple pseudo-random function based on position
float random(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233)) + time) * 43758.5453123);
}

void main() {
    // Read current particle state
    vec4 posData = texture2D(positionTexture, vUv);
    vec4 velData = texture2D(velocityTexture, vUv);

    vec3 position = posData.xyz;
    float particleType = posData.w;
    float temperature = velData.w;

    // Calculate local density from mass grid
    vec3 gridPos = worldToGrid(position);
    vec2 uv = grid3DTo2D(gridPos);
    vec4 massData = texture2D(massTexture, uv); // Sample at LOD 0 (finest detail)
    float localDensity = massData.w; // Total mass in this cell

    // ===== GAS → STAR FORMATION =====
    // Check if gas particle meets star formation criteria
    if (particleType > 0.5 && particleType < 1.5) { // TYPE_GAS
        // Criteria:
        // 1. Universe age > 100 Myr (first stars form after dark ages)
        // 2. High density (compressed gas cloud)
        // 3. Appropriate temperature (not too cold, not too hot)
        // 4. Stochastic element (probability-based)

        // First stars form at ~100 Myr = 4.35 sim seconds (time scale: 23 Myr/sec)
        bool afterDarkAges = time > 4.35;
        bool highDensity = localDensity > formationDensity;
        bool rightTemperature = temperature >= formationTempMin && temperature <= formationTempMax;

        if (afterDarkAges && highDensity && rightTemperature) {
            // Stochastic star formation (probability per frame)
            float rand = random(vUv);

            if (rand < formationRate) {
                // Transform gas → newly formed star!
                // Use 2.001 marker to indicate "needs age initialization"
                particleType = 2.001;

                // Note: temperature/age transition handled in velocityStateFragment
                // Stars start with age 0.0 (newborn), not high temperature
                // This will be set properly in the next velocity state pass
            }
        }
    }

    // ===== NEWLY FORMED STAR → MAIN SEQUENCE =====
    // Transition newly formed stars (2.001) to normal main sequence (2.0)
    // This happens one frame after formation, after age initialization
    if (particleType > 2.0 && particleType < 2.01) {
        // Newly formed star marker detected - transition to main sequence
        particleType = 2.0; // Now a normal main sequence star
    }

    // ===== STELLAR EVOLUTION: MAIN SEQUENCE → RED GIANT =====
    // Check if this is a main sequence star that's old enough to evolve
    if (particleType >= 2.0 && particleType < 2.5) {
        // Main sequence star (type 2.0)
        // Check age (stored in velocity.w)
        float age = temperature; // Actually age for stars

        // Red giant threshold: age >= 0.7
        if (age >= 0.7) {
            // Transition to red giant!
            particleType = 2.5; // Red giant type
        }
    }

    // ===== STELLAR EVOLUTION: RED GIANT → SUPERNOVA OR WHITE DWARF =====
    // Check if this is a red giant old enough to shed its outer layers
    else if (particleType >= 2.5 && particleType < 3.0) {
        // Red giant (type 2.5)
        float age = temperature; // Actually age for stars

        // Supernova check: Some massive red giants explode at age 0.85
        if (age >= supernovaAgeThreshold && age < 0.86) {
            // Only check once when crossing threshold (0.85-0.86 range)
            float rand1 = random(vUv + vec2(0.123, 0.456));

            if (rand1 < supernovaProbability) {
                // This star goes SUPERNOVA!
                // Determine compact object type
                float rand2 = random(vUv + vec2(0.789, 0.321));

                if (rand2 < blackHoleProbability) {
                    particleType = 5.0; // Black hole!
                } else {
                    particleType = 4.0; // Neutron star!
                }
                // Note: velocity.w will be reset to 0.99 in velocityStateFragment to trigger flash
            }
        }

        // White dwarf threshold: age >= 0.95 (very ancient, didn't go supernova)
        if (age >= 0.95 && particleType >= 2.5 && particleType < 3.0) {
            // Shed outer layers and become white dwarf! (only if didn't just go supernova)
            particleType = 3.0; // White dwarf (compact object)
            // Note: Age will be reset to 0.0 in velocityStateFragment to represent fresh white dwarf
        }
    }

    // ===== FUTURE: MORE EVOLUTION =====
    // ✅ Supernova explosions → Neutron Stars/Black Holes (implemented!)
    // TODO: Supernova shockwave propagation through gas
    // TODO: White dwarf accretion and nova events
    // TODO: Binary systems and mergers

    // Output updated state
    gl_FragColor = vec4(position, particleType);
}
