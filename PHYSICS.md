# Physics & Mathematics

This document details all the physical models and mathematical equations used in the Galaxy Genesis simulator.

## Table of Contents
1. [Gravitational Forces](#gravitational-forces)
2. [Barnes-Hut Algorithm](#barnes-hut-algorithm)
3. [Numerical Integration](#numerical-integration)
4. [Compression and Heating](#compression-and-heating)
5. [Stellar Evolution](#stellar-evolution)
6. [Collision Physics](#collision-physics)
7. [Orbital Mechanics](#orbital-mechanics)
8. [Black Hole Physics](#black-hole-physics)
9. [Constants and Units](#constants-and-units)

---

## Gravitational Forces

### Newton's Law of Universal Gravitation

Every particle attracts every other particle with a force:

```
F = G * (m₁ * m₂) / r²
```

Where:
- `F` = gravitational force (Newtons)
- `G` = gravitational constant = 6.674 × 10⁻¹¹ m³ kg⁻¹ s⁻²
- `m₁, m₂` = masses of the two particles (kg)
- `r` = distance between particles (meters)

### Vector Form

For 3D simulation, we calculate the force as a vector:

```
F⃗ = G * (m₁ * m₂) / r³ * r⃗
```

Where `r⃗` is the vector from particle 1 to particle 2.

### Acceleration

From Newton's second law (`F = ma`), the acceleration of particle 1 due to particle 2:

```
a⃗₁ = G * m₂ / r³ * r⃗
```

The acceleration is independent of the particle's own mass (equivalence principle).

### Softening Parameter

To prevent numerical instability when particles get very close (r → 0 would cause infinite force), we add a **softening parameter** ε:

```
a⃗ = G * m / (r² + ε²)^(3/2) * r⃗
```

Typical value: `ε = 0.1` to `1.0` in simulation units

This prevents:
- Division by zero
- Unrealistic high-speed ejections
- Numerical overflow

### Total Acceleration

For particle `i`, the total acceleration from all N particles:

```
a⃗ᵢ = Σⱼ≠ᵢ [G * mⱼ / (rᵢⱼ² + ε²)^(3/2) * r⃗ᵢⱼ]
```

**Complexity**: O(n²) - must compare every particle to every other particle

This is where the Barnes-Hut algorithm provides optimization.

---

## Barnes-Hut Algorithm

To simulate 10,000+ particles, we use the **Barnes-Hut algorithm** to approximate distant forces.

### Octree Structure

1. **Divide space** into a cubic region containing all particles
2. **Recursively subdivide** each cube into 8 smaller cubes (octants)
3. **Stop subdividing** when a cube contains ≤1 particle
4. **Store** the total mass and center of mass for each cube

### Approximation Criterion

For particle `i` and cube node `n`:

```
if (s / d) < θ:
    treat all particles in cube as single mass at center of mass
else:
    recurse into child cubes
```

Where:
- `s` = width of the cube
- `d` = distance from particle to cube's center of mass
- `θ` = threshold parameter (typically 0.5)

**Lower θ** = more accurate but slower
**Higher θ** = faster but less accurate

### Center of Mass Calculation

For a cube containing particles with masses `m₁, m₂, ..., mₙ`:

```
M = Σmᵢ  (total mass)
r⃗_cm = (Σmᵢ * r⃗ᵢ) / M  (center of mass)
```

### Complexity Reduction

- **Brute force**: O(n²) ≈ 100,000,000 comparisons for 10,000 particles
- **Barnes-Hut**: O(n log n) ≈ 130,000 comparisons for 10,000 particles

**~700x speedup** for large particle counts!

---

## Numerical Integration

To update particle positions over time, we solve the equations of motion.

### Verlet Integration (Velocity Verlet)

**Why Verlet**: More stable than Euler integration, conserves energy better

**Algorithm**:

```
1. Calculate acceleration: a⃗(t) = F⃗(t) / m
2. Update position: r⃗(t + Δt) = r⃗(t) + v⃗(t) * Δt + 0.5 * a⃗(t) * Δt²
3. Calculate new acceleration: a⃗(t + Δt)
4. Update velocity: v⃗(t + Δt) = v⃗(t) + 0.5 * [a⃗(t) + a⃗(t + Δt)] * Δt
```

### Timestep Selection

The timestep `Δt` must be small enough to maintain stability:

```
Δt < 0.1 * √(ε / a_max)
```

Where `a_max` is the maximum acceleration in the system.

For user-controlled time scaling:
```
Δt_actual = Δt_base * time_scale
```

We may need adaptive timestepping for extreme time scales.

### Symplectic Integration

Verlet is a **symplectic integrator**, meaning:
- Energy is approximately conserved
- No artificial damping
- Stable over long simulations

---

## Compression and Heating

When particles cluster, gravitational compression generates heat.

### Density Calculation

For particle `i`, estimate local density by counting nearby particles:

```
ρᵢ = Σⱼ (mⱼ / Vⱼ)
```

Where `Vⱼ` is the volume of a sphere containing the k-nearest neighbors.

Simplified approach:
```
ρᵢ = (number of particles within radius R) / (4/3 * π * R³)
```

### Heating from Compression

Using the **ideal gas law** `PV = nRT`:

For compression of gas, temperature rises:

```
T ∝ ρ^(γ-1)
```

Where `γ` is the adiabatic index (≈ 5/3 for monatomic gas).

**Simplified model**:
```
T = T₀ + k * ρ²
```

Where:
- `T₀` = background temperature (≈ 3 K cosmic microwave background)
- `k` = heating coefficient (tunable)
- `ρ²` dependence because compression work ∝ pressure × compression

### Gravitational Binding Energy

Energy released by gravitational collapse:

```
E_binding ≈ G * M² / R
```

For a cloud of mass `M` and radius `R`.

This energy is converted to heat:
```
E_thermal = (3/2) * N * k_B * T
```

Equating and solving for temperature:
```
T ≈ (2/3) * (G * M * m_particle) / (k_B * R)
```

Where `k_B` is Boltzmann's constant.

---

## Stellar Evolution

### Fusion Threshold

Stars form when gravitational compression heats the core enough for nuclear fusion.

**Minimum mass for hydrogen fusion**:
```
M_min ≈ 0.08 M☉
```

Where `M☉ = 1.989 × 10³⁰ kg` (solar mass).

**Core temperature requirement**:
```
T_core > 10⁷ K
```

For deuterium fusion (easier):
```
T_core > 10⁶ K
M_min ≈ 0.013 M☉ (brown dwarf)
```

### Stellar Classification

Based on mass and temperature:

| Type | Mass (M☉) | Temperature (K) | Color | Lifetime |
|------|-----------|-----------------|-------|----------|
| Brown Dwarf | 0.01-0.08 | 1,000-3,000 | Red/Brown | Trillion years |
| Red Dwarf | 0.08-0.4 | 3,000-4,000 | Red | Trillion years |
| Yellow Dwarf | 0.8-1.2 | 5,000-6,000 | Yellow | 10 billion years |
| Blue Giant | >10 | 20,000-50,000 | Blue | Million years |

### Mass-Luminosity Relationship

Energy output scales with mass:

```
L ∝ M^3.5
```

Massive stars burn much brighter and die much faster.

### Stellar Death

**Low mass** (M < 8 M☉):
1. Expands to red giant
2. Ejects outer layers (planetary nebula)
3. Core collapses to **white dwarf**
4. Gradually cools over billions of years

**High mass** (M > 8 M☉):
1. Expands to red supergiant
2. Core collapses catastrophically
3. **Supernova explosion**
4. Remnant:
   - If M < 20 M☉: **Neutron star**
   - If M > 20 M☉: **Black hole**

### Chandrasekhar Limit

Maximum mass for a white dwarf:
```
M_Ch = 1.4 M☉
```

Above this limit, electron degeneracy pressure cannot support the star → collapses to neutron star.

---

## Collision Physics

### Collision Detection

Particles collide when:
```
|r⃗₁ - r⃗₂| < (R₁ + R₂)
```

Where `Rᵢ` is the effective radius (can be based on mass or fixed).

For performance, we only check collisions within octree leaf nodes.

### Inelastic Collision

When two particles collide, they **merge** into one particle.

**Mass conservation**:
```
m_new = m₁ + m₂
```

**Momentum conservation**:
```
v⃗_new = (m₁ * v⃗₁ + m₂ * v⃗₂) / (m₁ + m₂)
```

**Position**:
```
r⃗_new = (m₁ * r⃗₁ + m₂ * r⃗₂) / (m₁ + m₂)  (center of mass)
```

### Heat Generation from Collision

Kinetic energy lost in inelastic collision is converted to heat:

```
ΔE = 0.5 * μ * v_rel²
```

Where:
- `μ = (m₁ * m₂) / (m₁ + m₂)` (reduced mass)
- `v_rel = |v⃗₁ - v⃗₂|` (relative velocity)

Temperature increase:
```
ΔT = ΔE / (m_new * c_p)
```

Where `c_p` is specific heat capacity.

### Fragmentation (Optional Advanced Feature)

For very high-energy collisions:
```
if v_rel > v_threshold:
    break apart into multiple smaller particles
```

---

## Orbital Mechanics

### Circular Orbit Velocity

For a particle orbiting a mass `M` at radius `r`:

```
v_orbit = √(G * M / r)
```

This is the velocity needed for a stable circular orbit.

### Elliptical Orbits

Real orbits are elliptical with eccentricity `e`:

```
e = 0: perfect circle
0 < e < 1: ellipse
e = 1: parabola (escape trajectory)
e > 1: hyperbola (unbound)
```

Eccentricity determined by:
```
e = √(1 + (2 * E * L²) / (G² * M² * m³))
```

Where:
- `E` = orbital energy
- `L` = angular momentum

### Escape Velocity

Velocity needed to escape gravitational pull:

```
v_escape = √(2 * G * M / r)
```

Exactly √2 times the circular orbit velocity.

### Roche Limit

Minimum distance before tidal forces tear apart a satellite:

```
d = 2.46 * R_primary * (ρ_primary / ρ_satellite)^(1/3)
```

Particles that orbit too close will be disrupted.

---

## Black Hole Physics

### Event Horizon (Schwarzschild Radius)

The radius where escape velocity equals light speed:

```
R_s = (2 * G * M) / c²
```

For a solar-mass black hole:
```
R_s ≈ 3 km
```

In our simulation, we'll scale this appropriately.

### Accretion Disk

Matter falling into a black hole forms a disk due to conservation of angular momentum.

Particles within the disk:
- Orbit at near-light speeds
- Heat up due to friction → emit X-rays
- Gradually spiral inward

**Visual representation**:
- Bright, hot disk perpendicular to angular momentum axis
- Inner edge at ~3 R_s (innermost stable circular orbit)

### Gravitational Lensing (Visual Effect)

Light (and our camera view) bends near massive objects:

```
θ = (4 * G * M) / (c² * d)
```

This creates visual distortion around black holes—a nice effect to add in shaders.

### Hawking Radiation (Optional)

Very small black holes can evaporate:
```
T_Hawking = (ℏ * c³) / (8π * G * M * k_B)
```

For stellar-mass black holes, this is negligible (10⁻⁷ K).

---

## Constants and Units

### Physical Constants (SI Units)

| Constant | Symbol | Value |
|----------|--------|-------|
| Gravitational constant | G | 6.674 × 10⁻¹¹ m³ kg⁻¹ s⁻² |
| Speed of light | c | 2.998 × 10⁸ m/s |
| Boltzmann constant | k_B | 1.381 × 10⁻²³ J/K |
| Solar mass | M☉ | 1.989 × 10³⁰ kg |
| Astronomical unit | AU | 1.496 × 10¹¹ m |
| Parsec | pc | 3.086 × 10¹⁶ m |

### Simulation Units (Normalized)

For numerical stability, we normalize to "simulation units":

| Quantity | Simulation Unit |
|----------|-----------------|
| Mass | M☉ (solar masses) |
| Distance | parsec (pc) |
| Time | 10⁶ years |

Then:
```
G_sim = 4.49 × 10⁻³ pc³ M☉⁻¹ (10⁶ yr)⁻²
```

This keeps numbers in a reasonable range (0.001-1000) for floating-point precision.

### Unit Conversions

From simulation to display:
```
distance_AU = distance_pc × 206,265
distance_km = distance_pc × 3.086 × 10¹³
```

From real time to simulation time:
```
time_years = time_seconds × time_scale / (365.25 × 24 × 3600)
```

### Particle Properties

Typical ranges in simulation units:

| Property | Dust | Planet | Star | Black Hole |
|----------|------|--------|------|------------|
| Mass | 10⁻⁶ M☉ | 10⁻³ M☉ | 0.1-100 M☉ | 1-1000 M☉ |
| Temperature | 10-100 K | 100-1000 K | 10,000-50,000 K | 10⁶ K (disk) |
| Radius | 10⁻⁶ pc | 10⁻⁵ pc | 10⁻³ pc | 10⁻⁵ pc |

---

## Performance Considerations

### Floating Point Precision

- Use **32-bit floats** for rendering (GPU memory)
- Use **64-bit floats** for physics calculations (CPU/WebWorker)
- Watch for catastrophic cancellation in force calculations

### Stability Checks

- Monitor total energy (should be conserved)
- Check for particles with extreme velocities (cap at 0.1c)
- Detect and handle numerical overflow/underflow

### Accuracy vs Speed Tradeoffs

| Aspect | Fast | Accurate |
|--------|------|----------|
| Gravity | Barnes-Hut (θ=1.0) | Brute force or θ=0.3 |
| Integration | Euler | Verlet or RK4 |
| Timestep | Large Δt | Adaptive small Δt |
| Collisions | Spatial hash | Full pairwise check |

For this project, we prioritize **real-time performance** with reasonable accuracy.

---

## Summary

This physics model provides:
- **Realistic gravity** with Barnes-Hut optimization
- **Stable numerical integration** via Verlet method
- **Emergent behavior** from simple rules
- **Physically motivated** stellar evolution
- **Computational feasibility** for browser-based real-time simulation

The math is simplified but captures the essence of real astrophysics.
