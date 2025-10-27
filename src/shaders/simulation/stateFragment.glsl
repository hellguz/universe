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
        // 1. High density (compressed gas cloud)
        // 2. Appropriate temperature (not too cold, not too hot)
        // 3. Stochastic element (probability-based)

        bool highDensity = localDensity > formationDensity;
        bool rightTemperature = temperature >= formationTempMin && temperature <= formationTempMax;

        if (highDensity && rightTemperature) {
            // Stochastic star formation (probability per frame)
            float rand = random(vUv);

            if (rand < formationRate) {
                // Transform gas → star!
                particleType = TYPE_STAR;

                // Note: temperature/age transition handled in velocityStateFragment
                // Stars start with age 0.0 (newborn), not high temperature
                // This will be set properly in the next velocity state pass
            }
        }
    }

    // ===== STELLAR EVOLUTION: MAIN SEQUENCE → RED GIANT =====
    // Check if this is a main sequence star that's old enough to become a red giant
    if (particleType > 1.5 && particleType < 2.5) {
        // Main sequence star (type 2.0)
        // Check age (stored in velocity.w)
        float age = temperature; // Actually age for stars

        // Red giant threshold: age > 0.7
        if (age > 0.7) {
            // Transition to red giant!
            particleType = 2.5; // Red giant type
        }
    }

    // ===== FUTURE: MORE EVOLUTION =====
    // TODO: Red Giant → White Dwarf transitions
    // TODO: Massive star → Supernova → Neutron Star/Black Hole
    // TODO: Supernova explosions with shockwaves

    // Output updated state
    gl_FragColor = vec4(position, particleType);
}
