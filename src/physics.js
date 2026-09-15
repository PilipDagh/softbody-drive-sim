import * as THREE from 'three';

export class SoftBodyNode {
  constructor(x, y, z, mass = 15, tag = 'chassis') {
    this.pos = new THREE.Vector3(x, y, z);
    this.oldPos = new THREE.Vector3(x, y, z);
    this.vel = new THREE.Vector3(0, 0, 0);
    this.forces = new THREE.Vector3(0, 0, 0);
    this.mass = mass;
    this.invMass = mass > 0 ? 1.0 / mass : 0;
    this.radius = 0.08;
    this.friction = 0.8;
    this.restitution = 0.1;
    this.tag = tag; // e.g. 'chassis', 'bumper_f', 'engine', 'wheel_fl', etc.
    this.pinned = false;
    this.groundContact = false;
  }
}

export class SoftBodyBeam {
  constructor(nodeA, nodeB, k = 450000, c = 1200, yieldStrain = 0.12, breakStrain = 0.45, tag = 'structural') {
    this.nodeA = nodeA;
    this.nodeB = nodeB;
    this.restLength = nodeA.pos.distanceTo(nodeB.pos);
    this.initialRestLength = this.restLength;
    this.k = k; // Spring stiffness (N/m)
    this.c = c; // Damping (N*s/m)
    this.yieldStrain = yieldStrain; // Plastic yield limit
    this.breakStrain = breakStrain; // Snapping limit
    this.plasticHardening = 0.08; // Rate of plastic shift
    this.isBroken = false;
    this.strain = 0;
    this.tag = tag;
  }
}

export class SoftBodyPhysicsEngine {
  constructor(scene) {
    this.scene = scene;
    this.vehicles = [];
    this.staticColliders = [];
    this.dynamicColliders = [];

    // Solver configuration
    this.substepFreq = 1000; // Hz
    this.gravity = new THREE.Vector3(0, -9.81, 0);
    this.timeScale = 1.0;
    this.isPaused = false;
    this.enableDeformation = true;

    // Node Grabber state
    this.grabbedNode = null;
    this.grabTargetPos = new THREE.Vector3();
    this.grabSpringK = 180000;
    this.grabSpringDamping = 1200;
    this.grabLine = null;
    this.initGrabLine();

    // Event callbacks
    this.onBeamBreak = null;
    this.onDeform = null;
    this.onSparkScrape = null;

    // Reusable vectors for performance
    this._diff = new THREE.Vector3();
    this._relVel = new THREE.Vector3();
  }

  initGrabLine() {
    const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
    const mat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      linewidth: 3,
      transparent: true,
      opacity: 0.85
    });
    this.grabLine = new THREE.Line(geo, mat);
    this.grabLine.visible = false;
    this.grabLine.frustumCulled = false;
    this.scene.add(this.grabLine);
  }

  addVehicle(vehicle) {
    this.vehicles.push(vehicle);
  }

  removeVehicle(vehicle) {
    const idx = this.vehicles.indexOf(vehicle);
    if (idx !== -1) {
      this.vehicles.splice(idx, 1);
    }
  }

  addStaticCollider(collider) {
    // collider: { type: 'box'|'plane'|'cylinder'|'ramp', checkCollision: fn }
    this.staticColliders.push(collider);
  }

  addDynamicCollider(collider) {
    // e.g. Hydraulic Car Crusher Press
    this.dynamicColliders.push(collider);
  }

  clearColliders() {
    this.staticColliders = [];
    this.dynamicColliders = [];
  }

  // Node Grabber Controls
  startGrab(node, initialTargetPos) {
    this.grabbedNode = node;
    this.grabTargetPos.copy(initialTargetPos);
    this.grabLine.visible = true;
  }

  updateGrab(targetPos) {
    if (this.grabbedNode) {
      this.grabTargetPos.copy(targetPos);
    }
  }

  releaseGrab() {
    this.grabbedNode = null;
    if (this.grabLine) {
      this.grabLine.visible = false;
    }
  }

  // Main Physics Step (Fixed Timestep Sub-stepping)
  update(dt) {
    if (this.isPaused || dt <= 0) return;

    // Cap delta time to prevent spiral of death
    const clampedDt = Math.min(0.06, dt) * this.timeScale;
    if (clampedDt <= 0.0001) return;

    // Determine sub-steps needed for target frequency
    const targetSubstepDt = 1.0 / this.substepFreq;
    const numSubsteps = Math.max(4, Math.min(32, Math.round(clampedDt / targetSubstepDt)));
    const subDt = clampedDt / numSubsteps;

    // Update dynamic machinery colliders (like hydraulic crusher)
    for (const dyn of this.dynamicColliders) {
      if (dyn.update) dyn.update(clampedDt);
    }

    for (let step = 0; step < numSubsteps; step++) {
      this.subStep(subDt);
    }

    // Update Node Grabber Visual Line
    if (this.grabbedNode && this.grabLine.visible) {
      const posAttr = this.grabLine.geometry.attributes.position;
      posAttr.setXYZ(0, this.grabbedNode.pos.x, this.grabbedNode.pos.y, this.grabbedNode.pos.z);
      posAttr.setXYZ(1, this.grabTargetPos.x, this.grabTargetPos.y, this.grabTargetPos.z);
      posAttr.needsUpdate = true;
    }
  }

  subStep(dt) {
    // 1. Accumulate External Forces (Gravity, Aerodynamics, Engine Drive/Brakes, Node Grabber)
    for (const vehicle of this.vehicles) {
      vehicle.applyDrivetrainAndAero(dt);

      for (const node of vehicle.nodes) {
        if (node.pinned) continue;
        // Gravity
        node.forces.copy(this.gravity).multiplyScalar(node.mass);

        // Ground damping / air resistance
        node.forces.addScaledVector(node.vel, -0.15 * node.mass);
      }
    }

    // Apply Node Grabber Spring Force
    if (this.grabbedNode && !this.grabbedNode.pinned) {
      this._diff.subVectors(this.grabTargetPos, this.grabbedNode.pos);
      const dist = this._diff.length();
      if (dist > 0.001) {
        const springMag = dist * this.grabSpringK;
        this._diff.normalize();
        this.grabbedNode.forces.addScaledVector(this._diff, springMag);
        this.grabbedNode.forces.addScaledVector(this.grabbedNode.vel, -this.grabSpringDamping);
      }
    }

    // 2. Solve Soft-Body Structural Beams (Hooke's Law + Viscoelastic Damping + Plasticity + Break limits)
    for (const vehicle of this.vehicles) {
      const beams = vehicle.beams;
      for (let i = 0; i < beams.length; i++) {
        const beam = beams[i];
        if (beam.isBroken) continue;

        const nodeA = beam.nodeA;
        const nodeB = beam.nodeB;

        this._diff.subVectors(nodeB.pos, nodeA.pos);
        const dist = this._diff.length();
        if (dist <= 0.0001) continue;

        const delta = dist - beam.restLength;
        const strain = Math.abs(delta) / beam.initialRestLength;
        beam.strain = strain;

        // Snapping / Breaking
        if (this.enableDeformation && strain > beam.breakStrain) {
          beam.isBroken = true;
          if (this.onBeamBreak) {
            this.onBeamBreak(beam, nodeA.pos);
          }
          continue;
        }

        // Plastic Yielding (Permanent Warping)
        if (this.enableDeformation && strain > beam.yieldStrain) {
          const plasticShift = (delta - Math.sign(delta) * beam.yieldStrain * beam.initialRestLength) * beam.plasticHardening;
          beam.restLength += plasticShift;
          if (this.onDeform && Math.random() < 0.05) {
            this.onDeform(beam, strain);
          }
        }

        // Viscoelastic Spring Force Calculation
        const normal = this._diff.divideScalar(dist);
        this._relVel.subVectors(nodeB.vel, nodeA.vel);
        const dampingForce = this._relVel.dot(normal) * beam.c;
        const totalForceMag = delta * beam.k + dampingForce;

        const fx = normal.x * totalForceMag;
        const fy = normal.y * totalForceMag;
        const fz = normal.z * totalForceMag;

        if (!nodeA.pinned) {
          nodeA.forces.x += fx;
          nodeA.forces.y += fy;
          nodeA.forces.z += fz;
        }
        if (!nodeB.pinned) {
          nodeB.forces.x -= fx;
          nodeB.forces.y -= fy;
          nodeB.forces.z -= fz;
        }
      }
    }

    // 3. Integrate Equations of Motion (Verlet / Velocity Verlet for extreme numerical stability)
    for (const vehicle of this.vehicles) {
      for (const node of vehicle.nodes) {
        if (node.pinned) continue;

        // a = F / m
        const ax = node.forces.x * node.invMass;
        const ay = node.forces.y * node.invMass;
        const az = node.forces.z * node.invMass;

        // v += a * dt
        node.vel.x += ax * dt;
        node.vel.y += ay * dt;
        node.vel.z += az * dt;

        // x += v * dt
        node.pos.x += node.vel.x * dt;
        node.pos.y += node.vel.y * dt;
        node.pos.z += node.vel.z * dt;

        // Reset forces for next substep
        node.forces.set(0, 0, 0);
      }
    }

    // 4. Resolve Collisions (Ground, Obstacles, Ramps, Crusher, Vehicle-to-Vehicle)
    this.resolveCollisions(dt);
  }

  resolveCollisions(dt) {
    for (let vIdx = 0; vIdx < this.vehicles.length; vIdx++) {
      const vehicle = this.vehicles[vIdx];

      for (const node of vehicle.nodes) {
        node.groundContact = false;

        // Ground Plane (y = 0)
        const groundHeight = 0.0;
        const penetration = (groundHeight + node.radius) - node.pos.y;

        if (penetration > 0) {
          node.pos.y = groundHeight + node.radius;
          node.groundContact = true;

          // Normal impulse restitution
          if (node.vel.y < 0) {
            node.vel.y = -node.vel.y * node.restitution;
          }

          // Coulomb surface friction
          const frictionFactor = Math.max(0, 1.0 - node.friction * dt * 45);
          node.vel.x *= frictionFactor;
          node.vel.z *= frictionFactor;

          // Rim / Undercarriage sparks if velocity is high and node is chassis
          if (node.tag !== 'tire' && (Math.abs(node.vel.x) + Math.abs(node.vel.z) > 4.0)) {
            if (this.onSparkScrape && Math.random() < 0.12) {
              this.onSparkScrape(node.pos, node.vel);
            }
          }
        }

        // Static Environment Colliders (Ramps, Poles, Barriers, Buildings)
        for (const col of this.staticColliders) {
          col.resolve(node, dt, this);
        }

        // Dynamic Machinery Colliders (Hydraulic Car Crusher Press)
        for (const dyn of this.dynamicColliders) {
          dyn.resolve(node, dt, this);
        }
      }

      // 5. Inter-Vehicle Soft-Body Collision (Crash Testing)
      for (let otherIdx = vIdx + 1; otherIdx < this.vehicles.length; otherIdx++) {
        const otherVehicle = this.vehicles[otherIdx];
        this.resolveVehicleToVehicle(vehicle, otherVehicle, dt);
      }
    }
  }

  resolveVehicleToVehicle(carA, carB, dt) {
    // Quick Bounding Sphere rejection
    const centerA = carA.getCenterOfMass();
    const centerB = carB.getCenterOfMass();
    const carDist = centerA.distanceTo(centerB);
    if (carDist > 6.5) return; // cars are too far to touch

    // Penalty spring contact resolution between perimeter soft-body nodes
    const nodesA = carA.nodes;
    const nodesB = carB.nodes;

    for (let i = 0; i < nodesA.length; i += 2) {
      const nA = nodesA[i];
      for (let j = 0; j < nodesB.length; j += 2) {
        const nB = nodesB[j];

        this._diff.subVectors(nB.pos, nA.pos);
        const distSq = this._diff.lengthSq();
        const minDist = nA.radius + nB.radius + 0.18;

        if (distSq < minDist * minDist && distSq > 0.00001) {
          const dist = Math.sqrt(distSq);
          const overlap = minDist - dist;
          const normal = this._diff.divideScalar(dist);

          // Relative velocity
          this._relVel.subVectors(nB.vel, nA.vel);
          const sepVel = this._relVel.dot(normal);

          // Contact impulse
          const contactK = 450000;
          const contactDamp = 1800;
          const impulse = (overlap * contactK - sepVel * contactDamp) * dt;

          if (impulse > 0) {
            nA.vel.addScaledVector(normal, -impulse * nA.invMass);
            nB.vel.addScaledVector(normal, impulse * nB.invMass);

            // Positional correction
            nA.pos.addScaledVector(normal, -overlap * 0.5);
            nB.pos.addScaledVector(normal, overlap * 0.5);

            // High-energy collision triggers crunch audio & sparks
            if (sepVel < -5.0 && this.onDeform) {
              this.onDeform(null, Math.abs(sepVel) * 0.1);
            }
            if (this.onSparkScrape && Math.random() < 0.25) {
              this.onSparkScrape(nA.pos, nA.vel);
            }
          }
        }
      }
    }
  }
}
