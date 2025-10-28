// AGING & TEMPERATURE SHADER
// Updates particle velocity.w (Age/Temperature)
// - Cools hot gas
// - Ages stars
// - Heats gas near black holes

uniform sampler2D positionTexture;
uniform sampler2D velocityTexture;
uniform sampler2D massTexture; // For locating black holes

uniform float time;
uniform float delta;
uniform float agingRate;   // STELLAR_AGING_RATE
uniform float coolingRate; // GAS_COOLING_RATE

// For black hole accretion heating
uniform float gridSize;
uniform float worldSize;
uniform float massTextureSize;
uniform float blackHoleAccretionRadius;
uniform float blackHoleAccretionHeating;

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
  float ageOrTemp = vel.w; // This value is Temperature for Gas, Age for Stars

  // --- 1. GAS COOLING ---
  // Primordial gas (Type 1.0) starts hot (0.8-0.95) and must cool
  // to reach star formation range (0.1-0.4)
  if (type == 1.0) {
    float cooling = coolingRate * delta;
    // Cool down, but don't go below 0
    ageOrTemp = max(0.0, ageOrTemp - cooling);

    // --- 1b. BLACK HOLE ACCRETION HEATING ---
    // Sample mass grid to find nearby black holes
    vec3 gridPos = worldToGrid(pos.xyz, gridSize, worldSize);
    vec2 massUv = grid3DTo2D(gridPos, gridSize, massTextureSize);
    vec4 massCell = texture2D(massTexture, massUv);
    
    float cellMass = massCell.w;
    
    // Check if cell contains a black hole (Type 5.0)
    // We check mass, as type isn't stored in mass grid. 
    // High mass (BH_GRAVITY_MULTIPLIER) is a proxy.
    if (cellMass > 2.0) { 
      float distToBH = distance(pos.xyz, massCell.xyz);
      if (distToBH < blackHoleAccretionRadius) {
        // Heat up gas in the accretion disk
        float heating = blackHoleAccretionHeating * delta * (1.0 - (distToBH / blackHoleAccretionRadius));
        ageOrTemp += heating;
      }
    }
  }

  // --- 2. STELLAR AGING ---
  // We must age ALL non-compact stars and giants
  // `floor(type) == 2.0` correctly ages:
  // 2.0 (Main Sequence)
  // 2.002 (Massive Main Sequence)
  // 2.5 (Red Giant)
  // 2.502 (Massive Red Giant)
  if (floor(type) == 2.0) {
    ageOrTemp += agingRate * delta;
  }

  // Output: vel.xyz is unchanged, vel.w is updated age/temp
  gl_FragColor = vec4(vel.xyz, ageOrTemp);
}