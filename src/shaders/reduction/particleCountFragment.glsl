// Particle count reduction shader
// Reduces particle counts using parallel GPU reduction
// Each pixel processes a 4x4 block of input, counting particles by type

uniform sampler2D inputTexture;
uniform float inputSize; // Size of input texture
uniform float isFirstPass; // 1.0 if reading from position texture, 0.0 if from reduction texture

varying vec2 vUv;

void main() {
    // This pixel's UV maps to a 4x4 block in the input texture
    // Calculate the top-left corner of the 4x4 block
    vec2 blockOrigin = vUv * (inputSize / 4.0);

    float darkMatterCount = 0.0;
    float gasCount = 0.0;
    float starCount = 0.0;

    // Sample 4x4 block (16 pixels) - unrolled loop for WebGL compatibility
    float inputTexelSize = 1.0 / inputSize;

    // Manually unroll 4x4 loop for WebGL shader compilation
    for (int i = 0; i < 16; i++) {
        float fi = float(i);
        float x = mod(fi, 4.0);
        float y = floor(fi / 4.0);

        vec2 sampleUV = (blockOrigin + vec2(x, y) + 0.5) * inputTexelSize;
        vec4 texel = texture2D(inputTexture, sampleUV);

        if (isFirstPass > 0.5) {
            // First pass: reading from position texture
            // texel.w contains particle type: 0.0=dark matter, 1.0=gas, 2.0=stars
            float particleType = texel.w;

            if (particleType < 0.5) {
                darkMatterCount += 1.0;
            } else if (particleType < 1.5) {
                gasCount += 1.0;
            } else {
                starCount += 1.0;
            }
        } else {
            // Subsequent passes: reading from reduction texture
            // texel already contains counts from previous reduction
            darkMatterCount += texel.r;
            gasCount += texel.g;
            starCount += texel.b;
        }
    }

    // Output counts (r=dark matter, g=gas, b=stars, a=total)
    float total = darkMatterCount + gasCount + starCount;
    gl_FragColor = vec4(darkMatterCount, gasCount, starCount, total);
}
