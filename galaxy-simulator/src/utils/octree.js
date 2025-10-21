export class OctreeNode {
  constructor(center, size) {
    this.center = center;
    this.size = size;
    this.mass = 0;
    this.centerOfMass = [0, 0, 0];
    this.children = null;
    this.particle = -1;
  }

  isLeaf() {
    return this.children === null;
  }

  subdivide() {
    const halfSize = this.size / 2;
    const quarterSize = this.size / 4;
    this.children = [];

    for (let i = 0; i < 8; i++) {
      const offsetX = (i & 1) ? quarterSize : -quarterSize;
      const offsetY = (i & 2) ? quarterSize : -quarterSize;
      const offsetZ = (i & 4) ? quarterSize : -quarterSize;

      this.children.push(new OctreeNode(
        [
          this.center[0] + offsetX,
          this.center[1] + offsetY,
          this.center[2] + offsetZ,
        ],
        halfSize
      ));
    }
  }

  getOctant(pos) {
    let octant = 0;
    if (pos[0] > this.center[0]) octant |= 1;
    if (pos[1] > this.center[1]) octant |= 2;
    if (pos[2] > this.center[2]) octant |= 4;
    return octant;
  }
}

export class Octree {
  constructor(particles, center, size) {
    this.root = new OctreeNode(center, size);
    this.particles = particles;
    this.build();
  }

  build() {
    for (let i = 0; i < this.particles.count; i++) {
      const pos = [
        this.particles.positions[i * 3 + 0],
        this.particles.positions[i * 3 + 1],
        this.particles.positions[i * 3 + 2],
      ];
      this.insert(this.root, i, pos);
    }
    this.computeMass(this.root);
  }

  insert(node, idx, pos) {
    if (node.particle === -1 && node.isLeaf()) {
      node.particle = idx;
      return;
    }

    if (node.isLeaf()) {
      node.subdivide();
      const oldIdx = node.particle;
      const oldPos = [
        this.particles.positions[oldIdx * 3 + 0],
        this.particles.positions[oldIdx * 3 + 1],
        this.particles.positions[oldIdx * 3 + 2],
      ];
      this.insert(node.children[node.getOctant(oldPos)], oldIdx, oldPos);
      node.particle = -1;
    }

    this.insert(node.children[node.getOctant(pos)], idx, pos);
  }

  computeMass(node) {
    if (node.isLeaf()) {
      if (node.particle !== -1) {
        node.mass = this.particles.masses[node.particle];
        node.centerOfMass = [
          this.particles.positions[node.particle * 3 + 0],
          this.particles.positions[node.particle * 3 + 1],
          this.particles.positions[node.particle * 3 + 2],
        ];
      }
      return;
    }

    let totalMass = 0;
    let cm = [0, 0, 0];

    for (const child of node.children) {
      this.computeMass(child);
      totalMass += child.mass;
      cm[0] += child.centerOfMass[0] * child.mass;
      cm[1] += child.centerOfMass[1] * child.mass;
      cm[2] += child.centerOfMass[2] * child.mass;
    }

    node.mass = totalMass;
    if (totalMass > 0) {
      node.centerOfMass = [
        cm[0] / totalMass,
        cm[1] / totalMass,
        cm[2] / totalMass,
      ];
    }
  }
}
