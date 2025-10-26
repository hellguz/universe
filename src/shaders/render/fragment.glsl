// Render fragment shader - particle appearance

varying vec3 vPosition;
varying float vType; // Particle type: 0=dark matter, 1=gas, 2=stars
varying float vTemperature; // Temperature: 0.0-1.0

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

    // Color based on particle type with temperature variation
    vec3 color;
    float baseAlpha = alpha;

    if (vType < 0.5) {
        // Dark Matter (type = 0) - ~60%
        // Faint purple - represents invisible dark matter scaffolding
        color = vec3(0.4, 0.2, 0.6);
        baseAlpha *= 0.4; // Dim but visible
        // Dark matter has no temperature variation
    } else if (vType < 1.5) {
        // Gas (type = 1) - ~35%
        // Temperature-based color: cool (blue/cyan) to warm (yellow/orange)
        float temp = vTemperature;
        if (temp < 0.5) {
            // Cool gas: blue to cyan
            color = mix(
                vec3(0.1, 0.3, 0.8), // Deep blue (cool)
                vec3(0.2, 0.6, 1.0), // Bright cyan (moderate)
                temp * 2.0
            );
        } else {
            // Warm gas: cyan to yellow
            color = mix(
                vec3(0.2, 0.6, 1.0), // Cyan
                vec3(1.0, 0.7, 0.3), // Yellow/orange (hot)
                (temp - 0.5) * 2.0
            );
        }
        baseAlpha *= 0.9; // Bright
    } else {
        // Stars (type = 2) - ~5%
        // Temperature-based stellar colors: cool red giants to hot blue stars
        float temp = vTemperature;
        if (temp < 0.6) {
            // Cool stars: orange to yellow
            color = mix(
                vec3(1.0, 0.5, 0.2), // Orange (cool)
                vec3(1.0, 0.95, 0.7), // Yellow (warm)
                temp / 0.6
            );
        } else {
            // Hot stars: yellow-white to blue-white
            color = mix(
                vec3(1.0, 0.95, 0.7), // Yellow-white
                vec3(0.7, 0.8, 1.0),  // Blue-white (hot)
                (temp - 0.6) / 0.4
            );
        }
        baseAlpha *= 1.0; // Full brightness
    }

    // Output with type-specific alpha
    gl_FragColor = vec4(color, baseAlpha);
}
