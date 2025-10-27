// Render fragment shader - particle appearance

varying vec3 vPosition;
varying float vType; // Particle type: 0=dark matter, 1=gas, 2=stars
varying float vTempOrAge; // Temperature for gas (0-1), Age for stars (0-1)

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

    // Color based on particle type with temperature/age variation
    vec3 color;
    float baseAlpha = alpha * 0.2; // Scale down for 4M+ particles

    if (vType < 0.5) {
        // Dark Matter (type = 0) - ~60%
        // Faint purple - represents invisible dark matter scaffolding
        color = vec3(0.4, 0.2, 0.6);
        baseAlpha *= 0.5; // Dim but visible
        // Dark matter has no temperature variation
    } else if (vType < 1.5) {
        // Gas (type = 1) - ~35%
        // Temperature-based color: cool (blue/cyan) to warm (yellow/orange)
        float temp = vTempOrAge; // For gas, this is temperature
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
        baseAlpha *= 1.5; // Bright
    } else if (vType < 2.5) {
        // Main Sequence Stars (type = 2.0) - ~5%
        // Age-based stellar colors with DRAMATIC differences for easy visual tracking
        float age = vTempOrAge; // For stars, this is AGE (0=newborn, 1=ancient)

        if (age < 0.3) {
            // Young stars: DEEP BLUE (age 0.0-0.3)
            color = mix(
                vec3(0.0, 0.3, 1.0),  // Electric blue (newborn, age 0.0)
                vec3(0.3, 0.6, 1.0),  // Bright blue (young, age 0.3)
                age / 0.3
            );
            baseAlpha *= 3.0; // Extra bright to see young stars
        } else if (age < 0.6) {
            // Mature stars: BLUE → YELLOW (age 0.3-0.6)
            color = mix(
                vec3(0.3, 0.6, 1.0),  // Bright blue (age 0.3)
                vec3(1.0, 1.0, 0.0),  // Pure yellow (age 0.6)
                (age - 0.3) / 0.3
            );
            baseAlpha *= 2.5; // Bright
        } else {
            // Old stars: YELLOW → ORANGE-RED (age 0.6-0.7, approaching red giant phase)
            color = mix(
                vec3(1.0, 1.0, 0.0),  // Pure yellow (age 0.6)
                vec3(1.0, 0.4, 0.0),  // Deep orange (age 0.7, ready to expand)
                (age - 0.6) / 0.1
            );
            baseAlpha *= 2.0; // Dimmer as they age
        }
    } else if (vType < 3.0) {
        // Red Giants (type = 2.5) - Expanded, cool evolved stars
        // HUGE size, deep orange-red color, dimmer than main sequence
        float age = vTempOrAge;

        // Red giants continue aging from orange to dark red
        // age 0.7 = orange (matches pre-giant phase), age 0.99 = dark red
        color = mix(
            vec3(1.0, 0.4, 0.0),  // Deep orange (age 0.7, fresh red giant)
            vec3(0.8, 0.1, 0.0),  // Dark red (age 0.99, ancient red giant)
            (age - 0.7) / 0.29
        );
        baseAlpha *= 1.2; // Dimmer than main sequence (but large size compensates)
    } else {
        // Compact objects (type >= 3.0) - white dwarfs, neutron stars, black holes
        color = vec3(1.0, 1.0, 1.0); // Placeholder white
        baseAlpha *= 1.5;
    }

    // Output with type-specific alpha
    gl_FragColor = vec4(color, baseAlpha);
}
