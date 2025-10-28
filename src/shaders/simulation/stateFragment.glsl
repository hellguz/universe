// STATE TRANSITION SHADER
// Updates particle position.w (Particle Type)
// - Forms stars from gas
// - Evolves stars (Main Sequence -> Red Giant -> [White Dwarf | Supernova])

uniform sampler2D positionTexture;
uniform sampler2D velocityTexture;
uniform sampler2D massTexture; // Mass density grid

uniform float time;
uniform float delta;

// For grid sampling
uniform float gridSize;
uniform float worldSize;
uniform float massTextureSize;

// Star formation thresholds
uniform float formationDensity;
uniform float formationTempMin;
uniform float formationTempMax;
uniform float formationRate;

// Stellar evolution thresholds
uniform float supernovaAgeThreshold;   // 0.85
uniform float supernovaProbability;    // 1.0 (of massive stars)
uniform float blackHoleProbability;    // 0.1

// (Constants imported from constants.ts)
const float TYPE_DARK_MATTER = 0.0;
const float TYPE_GAS = 1.0;
const float TYPE_STAR = 2.0;
const float TYPE_STAR_MASSIVE = 2.002; // Hack: store "massiveness"
const float TYPE_RED_GIANT = 2.5;
const float TYPE_RED_GIANT_MASSIVE = 2.502;
const float TYPE_WHITE_DWARF = 3.0;
const float TYPE_NEUTRON_STAR = 4.0;
const float TYPE_BLACK_HOLE = 5.0;

const float RED_GIANT_AGE_THRESHOLD = 0.7;
const float WHITE_DWARF_AGE_THRESHOLD = 0.95;

// (Massive star probability)
const float MASSIVE_STAR_PROBABILITY = 0.02; // 2% of new stars are massive

varying vec2 vUv;

// --- HELPER FUNCTIONS (Inlined) ---
// Convert world position to grid coordinates [cite: 132-135]
vec3 worldToGrid(vec3 worldPos, float gridSize, float worldSize) {
  // Center the grid around origin
  vec3 centered = worldPos + vec3(worldSize * 0.5);
  // Normalize to [0, gridSize]
  vec3 gridPos = (centered / worldSize) * gridSize;
  // Clamp to valid range
  return clamp(gridPos, vec3(0.0), vec3(gridSize - 1.0));
}

// Convert 3D grid coordinates to 2D texture UV [cite: 135-139]
vec2 grid3DTo2D(vec3 gridPos, float gridSize, float textureSize) {
  float layersPerRow = textureSize / gridSize; // 8 for 512/64

  float z = gridPos.z;
  float layerX = mod(z, layersPerRow);
  float layerY = floor(z / layersPerRow);
  float pixelX = layerX * gridSize + gridPos.x;
  float pixelY = layerY * gridSize + gridPos.y;
  return vec2(
    (pixelX + 0.5) / textureSize,
    (pixelY + 0.5) / textureSize
  );
}
// --- END HELPER FUNCTIONS ---

// Pseudo-random number generator
float rand(vec2 co){
  return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

void main() {
  vec4 pos = texture2D(positionTexture, vUv);
  vec4 vel = texture2D(velocityTexture, vUv);

  float type = pos.w;
  float ageOrTemp = vel.w;
  
  float newType = type; // Assume no change by default

  // --- 1. STAR FORMATION ---
  if (type == TYPE_GAS) {
    float temp = ageOrTemp;

    // Check if gas is cool enough
    if (temp > formationTempMin && temp < formationTempMax) {
      
      // Sample mass density at this particle's location
      vec3 gridPos = worldToGrid(pos.xyz, gridSize, worldSize);
      vec2 massUv = grid3DTo2D(gridPos, gridSize, massTextureSize);
      vec4 massCell = texture2D(massTexture, massUv);
      float density = massCell.w;

      // Check if density is high enough
      if (density > formationDensity) {
        // Check probability
        if (rand(vUv + time) < (formationRate * delta)) {
          // --- STAR IS BORN ---
          // Decide if it's a massive star or regular star
          if (rand(vUv - time) < MASSIVE_STAR_PROBABILITY) {
            newType = TYPE_STAR_MASSIVE; // 2.002
          } else {
            newType = TYPE_STAR; // 2.0
          }
        }
      }
    }
  }

  // --- 2. STELLAR EVOLUTION (REGULAR STAR) ---
  else if (type == TYPE_STAR) {
    float age = ageOrTemp;
    if (age > RED_GIANT_AGE_THRESHOLD) {
      newType = TYPE_RED_GIANT; // 2.5
    }
  }
  
  // --- 3. RED GIANT EVOLUTION (REGULAR) ---
  else if (type == TYPE_RED_GIANT) {
    float age = ageOrTemp;
    if (age > WHITE_DWARF_AGE_THRESHOLD) {
      newType = TYPE_WHITE_DWARF; // 3.0
    }
  }

  // --- 4. STELLAR EVOLUTION (MASSIVE STAR) ---
  else if (type == TYPE_STAR_MASSIVE) {
    float age = ageOrTemp;
    if (age > RED_GIANT_AGE_THRESHOLD) {
      newType = TYPE_RED_GIANT_MASSIVE; // 2.502
    }
  }
  
  // --- 5. RED GIANT EVOLUTION (MASSIVE) -> SUPERNOVA ---
  else if (type == TYPE_RED_GIANT_MASSIVE) {
    float age = ageOrTemp;
    
    // Massive stars go supernova earlier than white dwarf formation
    if (age > supernovaAgeThreshold) {
      // Check probability (uniform is 1.0, so this always passes)
      if (rand(vUv + time) < supernovaProbability) {
        // --- SUPERNOVA ---
        // Now check if it becomes a Black Hole or Neutron Star
        if (rand(vUv - time) < blackHoleProbability) {
          newType = TYPE_BLACK_HOLE; // 5.0
        } else {
          newType = TYPE_NEUTRON_STAR; // 4.0
        }
      }
    }
  }

  // Output: pos.xyz is unchanged, pos.w is updated type
  gl_FragColor = vec4(pos.xyz, newType);
}