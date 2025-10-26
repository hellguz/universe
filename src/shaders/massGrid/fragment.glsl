// Mass Grid Fragment Shader
// Accumulates mass and center of mass for each grid cell
// Output format: vec4(centerOfMass.xyz * mass, mass)
// After rendering, divide xyz by w to get actual center of mass

varying vec3 vWorldPos;
varying float vMass;

void main() {
  // Output weighted position and mass
  // This will be accumulated via additive blending
  // Format: (pos.x * mass, pos.y * mass, pos.z * mass, mass)
  gl_FragColor = vec4(vWorldPos * vMass, vMass);
}
