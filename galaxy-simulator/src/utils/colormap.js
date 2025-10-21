export function updateColors(particles) {
  for (let i = 0; i < particles.count; i++) {
    const temp = particles.temperatures[i];
    const color = temperatureToColor(temp);

    particles.colors[i * 3 + 0] = color[0];
    particles.colors[i * 3 + 1] = color[1];
    particles.colors[i * 3 + 2] = color[2];
  }
}

function temperatureToColor(temp) {
  if (temp < 100) {
    // Cold: dark brown/gray
    return [0.3, 0.2, 0.15];
  } else if (temp < 1000) {
    // Warm: brown/orange
    const t = (temp - 100) / 900;
    return [0.6 + t * 0.4, 0.3 + t * 0.3, 0.1];
  } else if (temp < 5000) {
    // Hot: orange/yellow
    const t = (temp - 1000) / 4000;
    return [1.0, 0.6 + t * 0.4, t * 0.3];
  } else if (temp < 10000) {
    // Very hot: yellow/white
    const t = (temp - 5000) / 5000;
    return [1.0, 1.0, 0.5 + t * 0.5];
  } else {
    // Fusion: white/blue
    const t = Math.min((temp - 10000) / 40000, 1);
    return [1.0 - t * 0.2, 1.0 - t * 0.1, 1.0];
  }
}
