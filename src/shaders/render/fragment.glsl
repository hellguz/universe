// Render fragment shader - particle appearance

varying vec3 vPosition;
varying float vMass;

void main() {
    // Create circular particle with radial gradient
    vec2 center = gl_PointCoord - vec2(0.5);
    float dist = length(center);

    // Discard pixels outside circle
    if (dist > 0.5) {
        discard;
    }

    // Radial gradient for glow effect
    float alpha = 1.0 - (dist * 2.0);
    alpha = pow(alpha, 2.0); // Sharper falloff

    // White color
    vec3 color = vec3(1.0);

    // Output with alpha for glow
    gl_FragColor = vec4(color, alpha);
}
