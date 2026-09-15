import * as THREE from 'three';

export class ParticleSystem {
  constructor(scene) {
    this.scene = scene;

    // --- Sparks Particle Pool ---
    this.maxSparks = 800;
    this.sparkPositions = new Float32Array(this.maxSparks * 3);
    this.sparkVelocities = new Float32Array(this.maxSparks * 3);
    this.sparkAges = new Float32Array(this.maxSparks);
    this.sparkLifetimes = new Float32Array(this.maxSparks);
    this.sparkCount = 0;

    this.sparkGeo = new THREE.BufferGeometry();
    this.sparkGeo.setAttribute('position', new THREE.BufferAttribute(this.sparkPositions, 3));

    this.sparkMat = new THREE.PointsMaterial({
      color: 0xffaa33,
      size: 0.14,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.sparkPoints = new THREE.Points(this.sparkGeo, this.sparkMat);
    this.sparkPoints.frustumCulled = false;
    this.scene.add(this.sparkPoints);

    // --- Smoke / Steam Particle Pool ---
    this.maxSmoke = 600;
    this.smokePositions = new Float32Array(this.maxSmoke * 3);
    this.smokeVelocities = new Float32Array(this.maxSmoke * 3);
    this.smokeAges = new Float32Array(this.maxSmoke);
    this.smokeLifetimes = new Float32Array(this.maxSmoke);
    this.smokeColors = new Float32Array(this.maxSmoke * 3); // for white steam vs grey smoke vs orange fire

    this.smokeGeo = new THREE.BufferGeometry();
    this.smokeGeo.setAttribute('position', new THREE.BufferAttribute(this.smokePositions, 3));
    this.smokeGeo.setAttribute('color', new THREE.BufferAttribute(this.smokeColors, 3));

    this.smokeMat = new THREE.PointsMaterial({
      vertexColors: true,
      size: 0.65,
      transparent: true,
      opacity: 0.45,
      depthWrite: false
    });
    this.smokePoints = new THREE.Points(this.smokeGeo, this.smokeMat);
    this.smokePoints.frustumCulled = false;
    this.scene.add(this.smokePoints);

    // --- Glass Shards Particle Pool ---
    this.maxShards = 400;
    this.shardPositions = new Float32Array(this.maxShards * 3);
    this.shardVelocities = new Float32Array(this.maxShards * 3);
    this.shardAges = new Float32Array(this.maxShards);
    this.shardLifetimes = new Float32Array(this.maxShards);

    this.shardGeo = new THREE.BufferGeometry();
    this.shardGeo.setAttribute('position', new THREE.BufferAttribute(this.shardPositions, 3));

    this.shardMat = new THREE.PointsMaterial({
      color: 0x99ddff,
      size: 0.08,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.shardPoints = new THREE.Points(this.shardGeo, this.shardMat);
    this.shardPoints.frustumCulled = false;
    this.scene.add(this.shardPoints);

    // Initialize all off-screen
    for (let i = 0; i < this.maxSparks * 3; i += 3) this.sparkPositions[i + 1] = -1000;
    for (let i = 0; i < this.maxSmoke * 3; i += 3) this.smokePositions[i + 1] = -1000;
    for (let i = 0; i < this.maxShards * 3; i += 3) this.shardPositions[i + 1] = -1000;
  }

  emitSparks(origin, velocity, count = 12) {
    for (let k = 0; k < count; k++) {
      const idx = Math.floor(Math.random() * this.maxSparks);
      const i3 = idx * 3;
      this.sparkPositions[i3] = origin.x + (Math.random() - 0.5) * 0.1;
      this.sparkPositions[i3 + 1] = origin.y + 0.05;
      this.sparkPositions[i3 + 2] = origin.z + (Math.random() - 0.5) * 0.1;

      this.sparkVelocities[i3] = (velocity ? velocity.x * 0.3 : 0) + (Math.random() - 0.5) * 7;
      this.sparkVelocities[i3 + 1] = Math.random() * 4 + 1.5;
      this.sparkVelocities[i3 + 2] = (velocity ? velocity.z * 0.3 : 0) + (Math.random() - 0.5) * 7;

      this.sparkAges[idx] = 0;
      this.sparkLifetimes[idx] = 0.3 + Math.random() * 0.4;
    }
    this.sparkGeo.attributes.position.needsUpdate = true;
  }

  emitSmoke(origin, velocity, count = 4, type = 'tire') {
    for (let k = 0; k < count; k++) {
      const idx = Math.floor(Math.random() * this.maxSmoke);
      const i3 = idx * 3;
      this.smokePositions[i3] = origin.x + (Math.random() - 0.5) * 0.2;
      this.smokePositions[i3 + 1] = origin.y + 0.1;
      this.smokePositions[i3 + 2] = origin.z + (Math.random() - 0.5) * 0.2;

      this.smokeVelocities[i3] = (velocity ? velocity.x * 0.15 : 0) + (Math.random() - 0.5) * 1.5;
      this.smokeVelocities[i3 + 1] = Math.random() * 1.8 + 0.8;
      this.smokeVelocities[i3 + 2] = (velocity ? velocity.z * 0.15 : 0) + (Math.random() - 0.5) * 1.5;

      this.smokeAges[idx] = 0;
      this.smokeLifetimes[idx] = 0.8 + Math.random() * 1.2;

      if (type === 'tire') {
        this.smokeColors[i3] = 0.85;
        this.smokeColors[i3 + 1] = 0.85;
        this.smokeColors[i3 + 2] = 0.88;
      } else if (type === 'steam') {
        this.smokeColors[i3] = 0.95;
        this.smokeColors[i3 + 1] = 0.95;
        this.smokeColors[i3 + 2] = 1.0;
      } else if (type === 'fire') {
        this.smokeColors[i3] = 1.0;
        this.smokeColors[i3 + 1] = 0.4 + Math.random() * 0.3;
        this.smokeColors[i3 + 2] = 0.05;
      }
    }
    this.smokeGeo.attributes.position.needsUpdate = true;
    this.smokeGeo.attributes.color.needsUpdate = true;
  }

  emitGlassShards(origin, count = 30) {
    for (let k = 0; k < count; k++) {
      const idx = Math.floor(Math.random() * this.maxShards);
      const i3 = idx * 3;
      this.shardPositions[i3] = origin.x + (Math.random() - 0.5) * 0.6;
      this.shardPositions[i3 + 1] = origin.y + (Math.random() - 0.5) * 0.4;
      this.shardPositions[i3 + 2] = origin.z + (Math.random() - 0.5) * 0.6;

      this.shardVelocities[i3] = (Math.random() - 0.5) * 6;
      this.shardVelocities[i3 + 1] = Math.random() * 3.5 + 0.5;
      this.shardVelocities[i3 + 2] = (Math.random() - 0.5) * 6;

      this.shardAges[idx] = 0;
      this.shardLifetimes[idx] = 1.2 + Math.random() * 0.8;
    }
    this.shardGeo.attributes.position.needsUpdate = true;
  }

  update(dt) {
    const gravity = -9.81;

    // 1. Update Sparks
    let sparksChanged = false;
    for (let i = 0; i < this.maxSparks; i++) {
      if (this.sparkAges[i] < this.sparkLifetimes[i]) {
        this.sparkAges[i] += dt;
        const i3 = i * 3;
        this.sparkVelocities[i3 + 1] += gravity * dt;
        this.sparkPositions[i3] += this.sparkVelocities[i3] * dt;
        this.sparkPositions[i3 + 1] += this.sparkVelocities[i3 + 1] * dt;
        this.sparkPositions[i3 + 2] += this.sparkVelocities[i3 + 2] * dt;

        // Ground bounce
        if (this.sparkPositions[i3 + 1] < 0.02) {
          this.sparkPositions[i3 + 1] = 0.02;
          this.sparkVelocities[i3 + 1] = -this.sparkVelocities[i3 + 1] * 0.35;
          this.sparkVelocities[i3] *= 0.7;
          this.sparkVelocities[i3 + 2] *= 0.7;
        }

        if (this.sparkAges[i] >= this.sparkLifetimes[i]) {
          this.sparkPositions[i3 + 1] = -1000;
        }
        sparksChanged = true;
      }
    }
    if (sparksChanged) this.sparkGeo.attributes.position.needsUpdate = true;

    // 2. Update Smoke / Steam / Fire
    let smokeChanged = false;
    for (let i = 0; i < this.maxSmoke; i++) {
      if (this.smokeAges[i] < this.smokeLifetimes[i]) {
        this.smokeAges[i] += dt;
        const i3 = i * 3;
        this.smokePositions[i3] += this.smokeVelocities[i3] * dt;
        this.smokePositions[i3 + 1] += this.smokeVelocities[i3 + 1] * dt;
        this.smokePositions[i3 + 2] += this.smokeVelocities[i3 + 2] * dt;
        this.smokeVelocities[i3] *= 0.98;
        this.smokeVelocities[i3 + 2] *= 0.98;

        if (this.smokeAges[i] >= this.smokeLifetimes[i]) {
          this.smokePositions[i3 + 1] = -1000;
        }
        smokeChanged = true;
      }
    }
    if (smokeChanged) this.smokeGeo.attributes.position.needsUpdate = true;

    // 3. Update Glass Shards
    let shardsChanged = false;
    for (let i = 0; i < this.maxShards; i++) {
      if (this.shardAges[i] < this.shardLifetimes[i]) {
        this.shardAges[i] += dt;
        const i3 = i * 3;
        this.shardVelocities[i3 + 1] += gravity * dt;
        this.shardPositions[i3] += this.shardVelocities[i3] * dt;
        this.shardPositions[i3 + 1] += this.shardVelocities[i3 + 1] * dt;
        this.shardPositions[i3 + 2] += this.shardVelocities[i3 + 2] * dt;

        if (this.shardPositions[i3 + 1] < 0.01) {
          this.shardPositions[i3 + 1] = 0.01;
          this.shardVelocities[i3 + 1] = -this.shardVelocities[i3 + 1] * 0.2;
          this.shardVelocities[i3] *= 0.6;
          this.shardVelocities[i3 + 2] *= 0.6;
        }

        if (this.shardAges[i] >= this.shardLifetimes[i]) {
          this.shardPositions[i3 + 1] = -1000;
        }
        shardsChanged = true;
      }
    }
    if (shardsChanged) this.shardGeo.attributes.position.needsUpdate = true;
  }
}
