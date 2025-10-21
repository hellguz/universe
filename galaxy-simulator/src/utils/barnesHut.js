import { Octree } from './octree';

export function computeBarnesHutGravity(particles, G = 1.0, epsilon = 0.5, theta = 0.5) {
  particles.accelerations.fill(0);

  const octree = new Octree(particles, [0, 0, 0], 200);

  for (let i = 0; i < particles.count; i++) {
    const pos = [
      particles.positions[i * 3 + 0],
      particles.positions[i * 3 + 1],
      particles.positions[i * 3 + 2],
    ];
    const acc = [0, 0, 0];
    computeNodeForce(octree.root, i, pos, acc, theta, G, epsilon, particles);

    particles.accelerations[i * 3 + 0] = acc[0];
    particles.accelerations[i * 3 + 1] = acc[1];
    particles.accelerations[i * 3 + 2] = acc[2];
  }
}

function computeNodeForce(node, idx, pos, acc, theta, G, epsilon, particles) {
  if (node.mass === 0) return;
  if (node.isLeaf() && node.particle === idx) return;

  const dx = node.centerOfMass[0] - pos[0];
  const dy = node.centerOfMass[1] - pos[1];
  const dz = node.centerOfMass[2] - pos[2];
  const distSq = dx * dx + dy * dy + dz * dz;
  const dist = Math.sqrt(distSq);

  const ratio = node.size / dist;

  if (node.isLeaf() || ratio < theta) {
    const force = G * node.mass / (distSq + epsilon * epsilon);
    const forceOverDist = force / dist;

    acc[0] += dx * forceOverDist;
    acc[1] += dy * forceOverDist;
    acc[2] += dz * forceOverDist;
  } else {
    for (const child of node.children) {
      computeNodeForce(child, idx, pos, acc, theta, G, epsilon, particles);
    }
  }
}
