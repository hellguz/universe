// Velocity update shader - Barnes-Hut hierarchical approximation
// Uses mass distribution grid with mipmaps for O(N log N) gravity calculation
// WebGL 2.0 compatible

uniform sampler2D positionTexture;
uniform sampler2D velocityTexture;
uniform sampler2D massTexture; // Hierarchical mass distribution with mipmaps
uniform float time;
uniform float delta;
uniform float G; // Gravitational constant
uniform float textureSize; // Particle texture size (1024)
uniform float gridSize; // Mass grid size (64)
uniform float worldSize; // World space size (200)
uniform float massTextureSize; // Mass texture size (512)

// Barnes-Hut parameters
uniform float theta; // Opening angle criterion (0.5)
uniform float nearFieldDist; // Use individual particles (20.0)
uniform float midFieldDist; // Use fine mipmaps (50.0)
uniform float farFieldDist; // Use coarse mipmaps (100.0)
uniform float softeningLength; // Prevent force singularities

// Supernova parameters
uniform float supernovaRadius; // Explosion blast radius
uniform float supernovaVelocityBoost; // Ejecta speed multiplier

varying vec2 vUv;

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

// Sample mass grid at specific LOD level (WebGL 2.0)
vec4 sampleMassGridLOD(vec3 worldPos, float lod) {
  vec3 gridPos = worldToGrid(worldPos);
  vec2 uv = grid3DTo2D(gridPos);
  return textureLod(massTexture, uv, lod);
}

void main() {
    // Read current particle state
    vec4 posData = texture2D(positionTexture, vUv);
    vec4 velData = texture2D(velocityTexture, vUv);

    vec3 position = posData.xyz;
    float particleType = posData.w;
    vec3 velocity = velData.xyz;

    vec3 acceleration = vec3(0.0);

    // Strategy: Multi-level Barnes-Hut approximation
    // Near field: sample individual particles for accuracy
    // Mid field: use fine mipmap levels (small clusters)
    // Far field: use coarse mipmap levels (large clusters)

    // ===== NEAR FIELD: Individual particle sampling =====
    // Sample a subset of nearby particles directly from position texture
    float texelSize = 1.0 / textureSize;
    int nearSamples = 64; // Reduced from 128 since we have hierarchical far-field
    float nearStride = textureSize / sqrt(float(nearSamples));

    for (float y = 0.0; y < textureSize; y += nearStride) {
        for (float x = 0.0; x < textureSize; x += nearStride) {
            vec2 otherUv = vec2((x + 0.5) * texelSize, (y + 0.5) * texelSize);

            if (distance(otherUv, vUv) < texelSize * 2.0) continue; // Skip self

            vec4 otherPosData = texture2D(positionTexture, otherUv);
            vec4 otherVelData = texture2D(velocityTexture, otherUv);
            vec3 otherPos = otherPosData.xyz;
            float otherType = otherPosData.w;
            float otherTempOrAge = otherVelData.w;

            vec3 diff = otherPos - position;
            float dist = length(diff);

            // Only process near particles here
            if (dist > nearFieldDist) continue;

            // Avoid singularity with softening
            dist = max(dist, softeningLength);

            // Direct gravity calculation
            float representedMass = nearStride * nearStride; // Each sample represents stride² particles
            float forceMag = G * representedMass / (dist * dist);

            acceleration += normalize(diff) * forceMag;

            // ===== SUPERNOVA EXPLOSIVE VELOCITY =====
            // Detect fresh compact objects (neutron stars or black holes just formed)
            bool isSupernovaFlash = (otherType >= 4.0 && otherType < 6.0) && otherTempOrAge > 0.98;

            if (isSupernovaFlash && dist < supernovaRadius) {
                // Apply radial outward velocity boost
                // Stronger closer to supernova (inverse distance)
                vec3 explosionDir = normalize(position - otherPos); // Away from supernova
                float distanceFactor = 1.0 - (dist / supernovaRadius); // 1.0 at center, 0.0 at edge
                distanceFactor = pow(distanceFactor, 0.5); // Square root for more gentle falloff

                // MASSIVE explosion force! Scale with represented mass for dramatic effect
                float explosionStrength = supernovaVelocityBoost * distanceFactor * representedMass * 2.0;

                velocity += explosionDir * explosionStrength;
            }
        }
    }

    // ===== HIERARCHICAL FAR FIELD: Mass grid sampling =====
    // Sample mass grid at different LOD levels based on distance
    // The mass grid is 64³ cells covering worldSize (200 units)
    float cellSize = worldSize / gridSize; // ~3.125 units per cell

    // Iterate through grid cells at different LOD levels
    int gridSamples = 27; // Sample 3x3x3 cells around particle
    float gridStride = gridSize / 3.0; // ~21 cells stride

    for (float gz = 0.0; gz < gridSize; gz += gridStride) {
        for (float gy = 0.0; gy < gridSize; gy += gridStride) {
            for (float gx = 0.0; gx < gridSize; gx += gridStride) {
                vec3 gridPos = vec3(gx, gy, gz);
                vec2 uv = grid3DTo2D(gridPos);

                // Determine LOD based on distance to this cell
                // First, get cell center in world space
                vec3 gridFrac = gridPos / gridSize; // [0, 1]
                vec3 cellCenter = (gridFrac * worldSize) - vec3(worldSize * 0.5);

                vec3 diff = cellCenter - position;
                float dist = length(diff);

                // Skip if too close (handled by near field)
                if (dist < nearFieldDist) continue;

                // Determine LOD level based on Barnes-Hut theta criterion
                // theta = cellSize / distance
                // Higher distance = coarser LOD
                float lod = 0.0;
                if (dist > farFieldDist) {
                    lod = 4.0; // Very coarse (level 4)
                } else if (dist > midFieldDist) {
                    lod = 2.0; // Coarse (level 2)
                } else {
                    lod = 1.0; // Fine (level 1)
                }

                // Sample mass grid at computed LOD (WebGL 2.0)
                vec4 massData = textureLod(massTexture, uv, lod);
                vec3 centerOfMass = massData.xyz;
                float totalMass = massData.w;

                // Skip empty cells
                if (totalMass < 0.0001) continue;

                // Calculate gravity from this cluster
                vec3 clusterDiff = centerOfMass - position;
                float clusterDist = length(clusterDiff);

                // Avoid singularity (use max of cell size or softening)
                clusterDist = max(clusterDist, max(cellSize, softeningLength));

                // Gravity from cluster
                float clusterForceMag = G * totalMass / (clusterDist * clusterDist);

                acceleration += normalize(clusterDiff) * clusterForceMag;
            }
        }
    }

    // Integrate velocity (Euler method)
    velocity += acceleration * delta;

    // Damping for stability (stronger for more particles)
    velocity *= 0.999;

    // Output updated velocity
    gl_FragColor = vec4(velocity, velData.w);
}
