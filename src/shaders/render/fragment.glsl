// Render fragment shader - particle appearance

varying vec3 vPosition;
varying float vType; // Particle type: 0=dark matter, 1=gas, 2=stars

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

    // Color based on particle type
    vec3 color;
    float baseAlpha = alpha;

    if (vType < 0.5) {
        // Dark Matter (type = 0) - ~60%
        // Faint purple - represents invisible dark matter scaffolding
        color = vec3(0.4, 0.2, 0.6);
        baseAlpha *= 0.4; // Dim but visible
    } else if (vType < 1.5) {
        // Gas (type = 1) - ~35%
        // Bright cyan/blue - cool gas clouds
        color = vec3(0.2, 0.6, 1.0);
        baseAlpha *= 0.9; // Bright
    } else {
        // Stars (type = 2) - ~5%
        // Bright yellow/white - stellar light
        color = vec3(1.0, 0.95, 0.7);
        baseAlpha *= 1.0; // Full brightness
    }

    // Output with type-specific alpha
    gl_FragColor = vec4(color, baseAlpha);
}
