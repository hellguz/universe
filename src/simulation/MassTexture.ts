import * as THREE from 'three'
import { MASS_GRID_SIZE, MASS_GRID_TEXTURE_SIZE, MASS_GRID_WORLD_SIZE } from '../utils/constants'
import massGridVertexShader from '../shaders/massGrid/vertex.glsl'
import massGridFragmentShader from '../shaders/massGrid/fragment.glsl'
import massGridNormalizeShader from '../shaders/massGrid/normalize.glsl'
import simulationVertexShader from '../shaders/simulation/vertex.glsl'

/**
 * Utility for managing the mass distribution texture for Barnes-Hut approximation
 *
 * The 3D mass grid (64³) is flattened into a 2D texture (512x512):
 * - 64 Z-layers of 64x64 each
 * - Arranged in an 8x8 grid of layers
 * - Each cell stores: vec4(centerOfMass.xyz, totalMass)
 */

/**
 * Convert 3D grid coordinates to 2D texture coordinates
 * @param x Grid X coordinate (0-63)
 * @param y Grid Y coordinate (0-63)
 * @param z Grid Z coordinate (0-63)
 * @returns UV coordinates for sampling the 2D mass texture
 */
export function grid3DTo2D(x: number, y: number, z: number): { u: number; v: number } {
  const gridSize = MASS_GRID_SIZE
  const layersPerRow = MASS_GRID_TEXTURE_SIZE / gridSize // 512 / 64 = 8

  // Determine which layer (0-63) and position within layer
  const layerX = Math.floor(z % layersPerRow)
  const layerY = Math.floor(z / layersPerRow)

  // Position within the layer
  const pixelX = layerX * gridSize + x
  const pixelY = layerY * gridSize + y

  return {
    u: (pixelX + 0.5) / MASS_GRID_TEXTURE_SIZE,
    v: (pixelY + 0.5) / MASS_GRID_TEXTURE_SIZE
  }
}

/**
 * GLSL function to convert 3D world position to 3D grid coordinates
 * This will be injected into shaders
 */
export const glslWorldToGrid = `
// Convert world position to grid coordinates
vec3 worldToGrid(vec3 worldPos, float gridSize, float worldSize) {
  // Center the grid around origin
  vec3 centered = worldPos + vec3(worldSize * 0.5);

  // Normalize to [0, gridSize]
  vec3 gridPos = (centered / worldSize) * gridSize;

  // Clamp to valid range
  return clamp(gridPos, vec3(0.0), vec3(gridSize - 1.0));
}

// Convert 3D grid coordinates to 2D texture UV
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

// Sample mass grid at world position
vec4 sampleMassGrid(sampler2D massTexture, vec3 worldPos, float gridSize, float worldSize, float textureSize) {
  vec3 gridPos = worldToGrid(worldPos, gridSize, worldSize);
  vec2 uv = grid3DTo2D(gridPos, gridSize, textureSize);
  return texture2D(massTexture, uv);
}
`

/**
 * Create render targets for mass distribution
 */
export function createMassRenderTargets(): {
  massRT: THREE.WebGLRenderTarget
} {
  const rtOptions = {
    minFilter: THREE.LinearMipmapLinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBAFormat,
    type: THREE.FloatType,
    stencilBuffer: false,
    depthBuffer: false,
    generateMipmaps: true // Enable mipmaps for hierarchical sampling
  }

  const massRT = new THREE.WebGLRenderTarget(
    MASS_GRID_TEXTURE_SIZE,
    MASS_GRID_TEXTURE_SIZE,
    rtOptions
  )

  return { massRT }
}

/**
 * Create materials for building the mass distribution
 */
export function createMassGridMaterial(
  positionTexture: THREE.Texture,
  particleTextureSize: number
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      positionTexture: { value: positionTexture },
      textureSize: { value: MASS_GRID_TEXTURE_SIZE },
      gridSize: { value: MASS_GRID_SIZE },
      worldSize: { value: MASS_GRID_WORLD_SIZE },
      particleTextureSize: { value: particleTextureSize }
    },
    vertexShader: massGridVertexShader,
    fragmentShader: massGridFragmentShader,
    blending: THREE.AdditiveBlending, // Accumulate mass contributions
    transparent: true,
    depthTest: false,
    depthWrite: false
  })
}

export function createMassNormalizeMaterial(
  accumulatedMassTexture: THREE.Texture
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      accumulatedMass: { value: accumulatedMassTexture }
    },
    vertexShader: simulationVertexShader,
    fragmentShader: massGridNormalizeShader,
    depthTest: false,
    depthWrite: false
  })
}
