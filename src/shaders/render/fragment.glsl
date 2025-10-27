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
    float baseAlpha = alpha * 0.08; // Reduced from 0.2 to prevent white saturation when zoomed out

    if (vType < 0.5) {
        // Dark Matter (type = 0) - ~60%
        // Faint purple - represents invisible dark matter scaffolding
        color = vec3(0.4, 0.2, 0.6);
        baseAlpha *= 0.8; // Reduced from 0.5, still dim but visible
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
        baseAlpha *= 2.5; // Increased from 1.5 to compensate for lower base alpha
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
            baseAlpha *= 6.0; // Increased from 3.0 to compensate for lower base
        } else if (age < 0.6) {
            // Mature stars: BLUE → YELLOW (age 0.3-0.6)
            color = mix(
                vec3(0.3, 0.6, 1.0),  // Bright blue (age 0.3)
                vec3(1.0, 1.0, 0.0),  // Pure yellow (age 0.6)
                (age - 0.3) / 0.3
            );
            baseAlpha *= 5.0; // Increased from 2.5
        } else {
            // Old stars: YELLOW → ORANGE-RED (age 0.6-0.7+, approaching red giant phase)
            // Clamp factor to prevent extrapolation beyond red if type transition is delayed
            float factor = clamp((age - 0.6) / 0.1, 0.0, 1.0);
            color = mix(
                vec3(1.0, 1.0, 0.0),  // Pure yellow (age 0.6)
                vec3(1.0, 0.4, 0.0),  // Deep orange (age 0.7+, should be red giant)
                factor
            );
            baseAlpha *= 4.0; // Increased from 2.0
        }
    } else if (vType < 3.0) {
        // Red Giants (type = 2.5) - Expanded, cool evolved stars
        // HUGE size, deep orange-red color, dimmer than main sequence
        float age = vTempOrAge;

        // Red giants continue aging from orange to dark red
        // age 0.7 = orange (matches pre-giant phase), age 0.99+ = dark red
        float giantFactor = clamp((age - 0.7) / 0.29, 0.0, 1.0);
        color = mix(
            vec3(1.0, 0.4, 0.0),  // Deep orange (age 0.7, fresh red giant)
            vec3(0.8, 0.1, 0.0),  // Dark red (age 0.99, ancient red giant)
            giantFactor
        );
        baseAlpha *= 2.5; // Increased from 1.2 (large size + lower base = still visible)
    } else if (vType < 4.0) {
        // White Dwarfs (type = 3.0) - Tiny, hot stellar remnants
        // VERY SMALL size, hot blue-white color, bright
        float cooling = vTempOrAge; // 0.0 = hot (fresh), 0.99 = cool (ancient)

        // White dwarfs cool from blue-white to dim white over time
        color = mix(
            vec3(0.7, 0.85, 1.0),  // Hot blue-white (fresh white dwarf, cooling 0.0)
            vec3(0.95, 0.95, 0.95), // Dim white (cool white dwarf, cooling 0.99)
            cooling
        );
        // Very bright despite small size - concentrated energy
        baseAlpha *= 8.0; // Increased from 4.0 to compensate for tiny size
    } else {
        // Future: Neutron stars (type 4.0) and Black holes (type 5.0)
        color = vec3(1.0, 1.0, 1.0); // Placeholder white
        baseAlpha *= 4.0; // Increased from 2.0
    }

    // Output with type-specific alpha
    gl_FragColor = vec4(color, baseAlpha);
}
