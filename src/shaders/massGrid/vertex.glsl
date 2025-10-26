// Mass Grid Vertex Shader
// Renders each particle as a point at its grid cell location
// Used to build the spatial mass distribution texture

uniform sampler2D positionTexture;
uniform float gridSize; // 64.0
uniform float worldSize; // 200.0
uniform float textureSize; // 512.0 (mass texture size)
uniform float particleTextureSize; // 1024.0 (particle texture size)

attribute vec2 particleUv;

varying vec3 vWorldPos;
varying float vMass;

// Convert world position to grid coordinates
vec3 worldToGrid(vec3 worldPos) {
  vec3 centered = worldPos + vec3(worldSize * 0.5);
  vec3 gridPos = (centered / worldSize) * gridSize;
  return clamp(gridPos, vec3(0.0), vec3(gridSize - 1.0));
}

// Convert 3D grid coordinates to 2D texture coordinates
vec2 grid3DTo2D(vec3 gridPos) {
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

void main() {
  // Read particle position from FBO texture
  vec4 posData = texture2D(positionTexture, particleUv);
  vec3 worldPos = posData.xyz;

  vWorldPos = worldPos;
  vMass = 1.0; // All particles have mass = 1 for now

  // Convert world position to grid cell coordinates
  vec3 gridPos = worldToGrid(worldPos);

  // Convert grid coordinates to 2D texture coordinates
  vec2 uv = grid3DTo2D(gridPos);

  // Convert UV to clip space [-1, 1]
  vec2 clipPos = uv * 2.0 - 1.0;

  // Output position in clip space
  gl_Position = vec4(clipPos, 0.0, 1.0);

  // Render as small point (will accumulate via additive blending)
  gl_PointSize = 1.0;
}
