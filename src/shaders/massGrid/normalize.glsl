// Mass Grid Normalization Fragment Shader
// Converts accumulated (position * mass, mass) to (centerOfMass, mass)
// Input: vec4(sum(pos.xyz * mass), sum(mass))
// Output: vec4(centerOfMass.xyz, totalMass)

uniform sampler2D accumulatedMass;

varying vec2 vUv;

void main() {
  vec4 accumulated = texture2D(accumulatedMass, vUv);

  vec3 weightedPos = accumulated.xyz;
  float totalMass = accumulated.w;

  // Avoid division by zero
  if (totalMass < 0.0001) {
    // Empty cell
    gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
  } else {
    // Compute center of mass
    vec3 centerOfMass = weightedPos / totalMass;
    gl_FragColor = vec4(centerOfMass, totalMass);
  }
}
