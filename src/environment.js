import * as THREE from 'three';

export const MAP_SPECS = [
  {
    id: 'proving_grounds',
    name: 'Physics Proving Grounds & Crusher',
    subtitle: 'Flat Test Map with Crusher & 100m Drop Tower',
    icon: '🏗️',
    description: '4km grid equipped with 100m drop tower, 15°/30°/45° launch ramps, crash barriers, steel poles, step-bumps, friction tracks, and active hydraulic car crusher press.'
  },
  {
    id: 'metro_city',
    name: 'Metro City Center',
    subtitle: 'Urban Avenues, Tunnels & Elevated Overpasses',
    icon: '🏙️',
    description: 'Multi-lane avenues, elevated highway overpass, subterranean illuminated tunnel, sidewalk curbs, breakable street lamps, and burstable fire hydrants.'
  },
  {
    id: 'highland_mud',
    name: 'Highland Trails & Mud Proving Ground',
    subtitle: 'Mountainous Off-Road & Suspension Bridge',
    icon: '🌲',
    description: 'Rolling mountain terrain with dynamic mud trenches, rocky paths, river basin, and a physical flexing wooden suspension bridge.'
  },
  {
    id: 'akina_touge',
    name: 'Mount Akina Touge Pass',
    subtitle: 'Winding Mountain Drift Pass & Gutters',
    icon: '⛰️',
    description: 'Narrow 2-lane mountain pass featuring hairpin turns, steep elevation drops, drainage gutters, and deformable steel guardrails.'
  },
  {
    id: 'industrial_harbor',
    name: 'Industrial Container Harbor',
    subtitle: 'Docks, Crane Tracks & Deep Ocean Hazards',
    icon: '🚢',
    description: 'Seaport with stacked shipping containers, warehouses, gantry tracks, open loading bays, and deep water hazards causing engine hydrolock.'
  }
];

export class EnvironmentManager {
  constructor(scene, physicsEngine, particleSystem) {
    this.scene = scene;
    this.physics = physicsEngine;
    this.particles = particleSystem;

    this.currentMapId = null;
    this.mapGroup = new THREE.Group();
    this.scene.add(this.mapGroup);

    // Sky & Lighting
    this.initSkyAndLighting();
  }

  initSkyAndLighting() {
    // Ambient Light
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    this.scene.add(this.ambientLight);

    // Directional Sun Light with High-Res Shadows
    this.sunLight = new THREE.DirectionalLight(0xfffaed, 1.85);
    this.sunLight.position.set(120, 220, 100);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 600;
    this.sunLight.shadow.camera.left = -90;
    this.sunLight.shadow.camera.right = 90;
    this.sunLight.shadow.camera.top = 90;
    this.sunLight.shadow.camera.bottom = -90;
    this.sunLight.shadow.bias = -0.0003;
    this.scene.add(this.sunLight);

    // Sky Dome
    const skyGeo = new THREE.SphereGeometry(800, 32, 16);
    const skyMat = new THREE.MeshBasicMaterial({
      color: 0x60a5fa,
      side: THREE.BackSide
    });
    this.skyMesh = new THREE.Mesh(skyGeo, skyMat);
    this.scene.add(this.skyMesh);

    // Ground Fog
    this.scene.fog = new THREE.FogExp2(0xcfd8dc, 0.0018);
  }

  loadMap(mapId) {
    // Clean up previous map
    this.clearMap();
    this.currentMapId = mapId;

    switch (mapId) {
      case 'metro_city':
        this.buildMetroCity();
        break;
      case 'highland_mud':
        this.buildHighlandTrails();
        break;
      case 'akina_touge':
        this.buildMountAkina();
        break;
      case 'industrial_harbor':
        this.buildIndustrialHarbor();
        break;
      case 'proving_grounds':
      default:
        this.buildProvingGrounds();
        break;
    }
  }

  clearMap() {
    // Remove objects from mapGroup
    while (this.mapGroup.children.length > 0) {
      const obj = this.mapGroup.children[0];
      this.mapGroup.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
        else obj.material.dispose();
      }
    }
    this.physics.clearColliders();
  }

  // --- MAP 1: Physics Proving Grounds & Hydraulic Crusher ---
  buildProvingGrounds() {
    // 1. Concrete Grid Floor (4000m x 4000m)
    const floorGeo = new THREE.PlaneGeometry(1000, 1000, 40, 40);
    floorGeo.rotateX(-Math.PI / 2);

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#2b3342';
    ctx.fillRect(0, 0, 512, 512);
    ctx.strokeStyle = '#3e4a5f';
    ctx.lineWidth = 4;
    ctx.strokeRect(0, 0, 512, 512);
    ctx.fillStyle = '#475569';
    ctx.fillRect(250, 0, 12, 512);
    ctx.fillRect(0, 250, 512, 12);

    const gridTexture = new THREE.CanvasTexture(canvas);
    gridTexture.wrapS = THREE.RepeatWrapping;
    gridTexture.wrapT = THREE.RepeatWrapping;
    gridTexture.repeat.set(100, 100);

    const floorMat = new THREE.MeshStandardMaterial({
      map: gridTexture,
      roughness: 0.85,
      metalness: 0.1
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.receiveShadow = true;
    this.mapGroup.add(floorMesh);

    // 2. Launch Ramps: 15°, 30°, 45°
    this.addRamp(0, 0, 35, 12, 3.5, 14, 0.26); // 15 deg
    this.addRamp(25, 0, 35, 12, 6.0, 14, 0.52); // 30 deg
    this.addRamp(-25, 0, 35, 12, 9.5, 14, 0.78); // 45 deg

    // 3. Rigid Concrete Crash Wall
    this.addCrashBarrier(0, 0, 85, 30, 4.0, 4.0);

    // 4. Steel Poles Slalom
    for (let i = -4; i <= 4; i++) {
      this.addSteelPole(i * 7, 0, 120 + Math.abs(i) * 3, 0.45, 6.0);
    }

    // 5. Suspension Step-Bumps
    for (let i = 0; i < 16; i++) {
      this.addStepBump(0, 0, -30 - i * 3.5, 16, 0.22, 1.2);
    }

    // 6. 100m Drop Tower Structure
    this.addDropTower(60, 0, -60);

    // 7. Active Hydraulic Car Crusher Press!
    this.addHydraulicCarCrusher(-50, 0, 0);
  }

  // --- MAP 2: Metro City Center ---
  buildMetroCity() {
    // Asphalt Grid Floor
    const floorGeo = new THREE.PlaneGeometry(1200, 1200);
    floorGeo.rotateX(-Math.PI / 2);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x1f242d, roughness: 0.9 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.receiveShadow = true;
    this.mapGroup.add(floor);

    // Skyscrapers & Commercial Blocks
    const buildingMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4, metalness: 0.6 });
    for (let x = -3; x <= 3; x++) {
      for (let z = -3; z <= 3; z++) {
        if (x === 0 || z === 0) continue; // roads in center
        const bx = x * 65;
        const bz = z * 65;
        const bHeight = 40 + Math.random() * 90;
        const bWidth = 42;

        const bGeo = new THREE.BoxGeometry(bWidth, bHeight, bWidth);
        const bMesh = new THREE.Mesh(bGeo, buildingMat);
        bMesh.position.set(bx, bHeight * 0.5, bz);
        bMesh.castShadow = true;
        bMesh.receiveShadow = true;
        this.mapGroup.add(bMesh);

        this.addBoxCollider(bx, bHeight * 0.5, bz, bWidth * 0.5, bHeight * 0.5, bWidth * 0.5);
      }
    }

    // Elevated Highway Overpass
    const overpassGeo = new THREE.BoxGeometry(24, 1.5, 240);
    const overpassMesh = new THREE.Mesh(overpassGeo, buildingMat);
    overpassMesh.position.set(0, 10, 0);
    overpassMesh.castShadow = true;
    overpassMesh.receiveShadow = true;
    this.mapGroup.add(overpassMesh);

    this.addBoxCollider(0, 10, 0, 12, 0.75, 120);

    // Breakable Fire Hydrants
    this.addFireHydrant(14, 0, 20);
    this.addFireHydrant(-14, 0, 20);
    this.addFireHydrant(14, 0, -20);
  }

  // --- MAP 3: Highland Trails & Mud Proving Ground ---
  buildHighlandTrails() {
    // Rolling Mountain Terrain Heightfield
    const terrainGeo = new THREE.PlaneGeometry(800, 800, 60, 60);
    terrainGeo.rotateX(-Math.PI / 2);
    const pos = terrainGeo.attributes.position;

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      // Sinusoidal hills
      const h = Math.sin(x * 0.015) * Math.cos(z * 0.015) * 14 + Math.sin(x * 0.04) * 4;
      pos.setY(i, Math.max(0, h));
    }
    terrainGeo.computeVertexNormals();

    const terrainMat = new THREE.MeshStandardMaterial({ color: 0x3f5236, roughness: 0.95 });
    const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    terrainMesh.receiveShadow = true;
    this.mapGroup.add(terrainMesh);

    // Mud Trench (High Viscous Drag Area)
    const mudGeo = new THREE.BoxGeometry(22, 0.2, 50);
    const mudMat = new THREE.MeshStandardMaterial({ color: 0x4a3728, roughness: 0.3 });
    const mudMesh = new THREE.Mesh(mudGeo, mudMat);
    mudMesh.position.set(0, 0.05, 30);
    this.mapGroup.add(mudMesh);

    // Flexing Wooden Suspension Bridge
    this.buildSuspensionBridge(0, 6.5, -45);
  }

  buildSuspensionBridge(x, y, z) {
    const bridgeMat = new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.9 });
    const bridgeGeo = new THREE.BoxGeometry(8, 0.5, 45);
    const bridgeMesh = new THREE.Mesh(bridgeGeo, bridgeMat);
    bridgeMesh.position.set(x, y, z);
    bridgeMesh.castShadow = true;
    this.mapGroup.add(bridgeMesh);

    this.addBoxCollider(x, y, z, 4, 0.25, 22.5);
  }

  // --- MAP 4: Mount Akina Touge Pass ---
  buildMountAkina() {
    // Mountain Touge Winding Asphalt Road
    const roadMat = new THREE.MeshStandardMaterial({ color: 0x22262e, roughness: 0.85 });
    const curvePoints = [];
    for (let i = 0; i <= 30; i++) {
      const t = i / 30;
      const angle = t * Math.PI * 4;
      const r = 40 + t * 45;
      const px = Math.cos(angle) * r;
      const pz = Math.sin(angle) * r;
      const py = (1.0 - t) * 35; // steep descent
      curvePoints.push(new THREE.Vector3(px, py, pz));
    }

    const curve = new THREE.CatmullRomCurve3(curvePoints);
    const roadGeo = new THREE.TubeGeometry(curve, 120, 5.5, 8, false);
    const roadMesh = new THREE.Mesh(roadGeo, roadMat);
    roadMesh.receiveShadow = true;
    this.mapGroup.add(roadMesh);

    // Deformable Steel Guardrails
    for (let i = 0; i < curvePoints.length - 1; i += 2) {
      const p = curvePoints[i];
      this.addCrashBarrier(p.x + 4, p.y + 0.6, p.z, 2.5, 0.9, 0.8);
    }
  }

  // --- MAP 5: Industrial Container Harbor ---
  buildIndustrialHarbor() {
    // Concrete Piers
    const pierMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.9 });
    const pierGeo = new THREE.BoxGeometry(220, 4, 220);
    const pierMesh = new THREE.Mesh(pierGeo, pierMat);
    pierMesh.position.set(0, 2, 0);
    pierMesh.receiveShadow = true;
    this.mapGroup.add(pierMesh);

    this.addBoxCollider(0, 2, 0, 110, 2, 110);

    // Deep Harbor Water Plane
    const waterGeo = new THREE.PlaneGeometry(800, 800);
    waterGeo.rotateX(-Math.PI / 2);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x0369a1,
      roughness: 0.1,
      metalness: 0.8,
      transparent: true,
      opacity: 0.82
    });
    const waterMesh = new THREE.Mesh(waterGeo, waterMat);
    waterMesh.position.set(0, 1.2, 0);
    this.mapGroup.add(waterMesh);

    // Stacked Shipping Containers
    const containerColors = [0xdc2626, 0x2563eb, 0x16a34a, 0xeab308];
    for (let i = 0; i < 28; i++) {
      const cx = (Math.random() - 0.5) * 160;
      const cz = (Math.random() - 0.5) * 160;
      if (Math.abs(cx) < 20 && Math.abs(cz) < 20) continue; // keep spawn area open

      const cColor = containerColors[i % containerColors.length];
      const cMat = new THREE.MeshStandardMaterial({ color: cColor, roughness: 0.5, metalness: 0.3 });
      const cGeo = new THREE.BoxGeometry(6.0, 2.6, 12.2);
      const cMesh = new THREE.Mesh(cGeo, cMat);
      cMesh.position.set(cx, 4 + 1.3, cz);
      cMesh.castShadow = true;
      cMesh.receiveShadow = true;
      this.mapGroup.add(cMesh);

      this.addBoxCollider(cx, 4 + 1.3, cz, 3.0, 1.3, 6.1);
    }
  }

  // --- Procedural Objects & Colliders Helpers ---

  addRamp(x, y, z, width, height, length, angleRad) {
    const rampGroup = new THREE.Group();
    rampGroup.position.set(x, y, z);
    rampGroup.rotation.x = angleRad;

    const rampMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.6, metalness: 0.4 });
    const rampGeo = new THREE.BoxGeometry(width, 0.4, length);
    const rampMesh = new THREE.Mesh(rampGeo, rampMat);
    rampMesh.position.set(0, 0.2, length * 0.5);
    rampMesh.castShadow = true;
    rampMesh.receiveShadow = true;
    rampGroup.add(rampMesh);

    this.mapGroup.add(rampGroup);

    // Ramp Collision Evaluator
    this.physics.addStaticCollider({
      type: 'ramp',
      resolve: (node, dt) => {
        const localX = node.pos.x - x;
        const localZ = node.pos.z - z;
        if (Math.abs(localX) < width * 0.5 && localZ > 0 && localZ < length * Math.cos(angleRad)) {
          const rampY = localZ * Math.tan(angleRad);
          if (node.pos.y < rampY + node.radius) {
            node.pos.y = rampY + node.radius;
            if (node.vel.y < 0) node.vel.y *= -0.2;
            node.groundContact = true;
          }
        }
      }
    });
  }

  addCrashBarrier(x, y, z, width, height, depth) {
    const barrierMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.85 });
    const barrierGeo = new THREE.BoxGeometry(width, height, depth);
    const barrierMesh = new THREE.Mesh(barrierGeo, barrierMat);
    barrierMesh.position.set(x, y + height * 0.5, z);
    barrierMesh.castShadow = true;
    barrierMesh.receiveShadow = true;
    this.mapGroup.add(barrierMesh);

    this.addBoxCollider(x, y + height * 0.5, z, width * 0.5, height * 0.5, depth * 0.5);
  }

  addSteelPole(x, y, z, radius, height) {
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.3, metalness: 0.8 });
    const poleGeo = new THREE.CylinderGeometry(radius, radius, height, 16);
    const poleMesh = new THREE.Mesh(poleGeo, poleMat);
    poleMesh.position.set(x, y + height * 0.5, z);
    poleMesh.castShadow = true;
    poleMesh.receiveShadow = true;
    this.mapGroup.add(poleMesh);

    // Cylinder Collision Evaluator
    this.physics.addStaticCollider({
      type: 'cylinder',
      resolve: (node, dt, engine) => {
        const dx = node.pos.x - x;
        const dz = node.pos.z - z;
        const distSq = dx * dx + dz * dz;
        const minDist = radius + node.radius;

        if (distSq < minDist * minDist && node.pos.y < y + height && node.pos.y > y) {
          const dist = Math.sqrt(distSq);
          const nx = dx / (dist || 1);
          const nz = dz / (dist || 1);
          node.pos.x = x + nx * minDist;
          node.pos.z = z + nz * minDist;

          // Rebound impulse
          const normVel = node.vel.x * nx + node.vel.z * nz;
          if (normVel < 0) {
            node.vel.x -= (1.0 + node.restitution) * normVel * nx;
            node.vel.z -= (1.0 + node.restitution) * normVel * nz;
          }
        }
      }
    });
  }

  addStepBump(x, y, z, width, height, depth) {
    const bumpMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.7 });
    const bumpGeo = new THREE.BoxGeometry(width, height, depth);
    const bumpMesh = new THREE.Mesh(bumpGeo, bumpMat);
    bumpMesh.position.set(x, y + height * 0.5, z);
    this.mapGroup.add(bumpMesh);

    this.addBoxCollider(x, y + height * 0.5, z, width * 0.5, height * 0.5, depth * 0.5);
  }

  addBoxCollider(cx, cy, cz, hx, hy, hz) {
    this.physics.addStaticCollider({
      type: 'box',
      resolve: (node, dt, engine) => {
        const dx = node.pos.x - cx;
        const dy = node.pos.y - cy;
        const dz = node.pos.z - cz;

        const penX = (hx + node.radius) - Math.abs(dx);
        const penY = (hy + node.radius) - Math.abs(dy);
        const penZ = (hz + node.radius) - Math.abs(dz);

        if (penX > 0 && penY > 0 && penZ > 0) {
          // Find minimal penetration axis
          if (penY < penX && penY < penZ) {
            node.pos.y = cy + Math.sign(dy) * (hy + node.radius);
            if (Math.sign(dy) * node.vel.y < 0) node.vel.y *= -node.restitution;
            node.groundContact = true;
          } else if (penX < penZ) {
            node.pos.x = cx + Math.sign(dx) * (hx + node.radius);
            if (Math.sign(dx) * node.vel.x < 0) node.vel.x *= -node.restitution;
          } else {
            node.pos.z = cz + Math.sign(dz) * (hz + node.radius);
            if (Math.sign(dz) * node.vel.z < 0) node.vel.z *= -node.restitution;
          }
        }
      }
    });
  }

  addDropTower(x, y, z) {
    const towerMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.6, metalness: 0.5 });
    const legGeo = new THREE.CylinderGeometry(0.8, 0.8, 100, 8);
    for (let i = 0; i < 4; i++) {
      const lx = x + (i % 2 === 0 ? -6 : 6);
      const lz = z + (i < 2 ? -6 : 6);
      const leg = new THREE.Mesh(legGeo, towerMat);
      leg.position.set(lx, y + 50, lz);
      this.mapGroup.add(leg);
    }
    const platformGeo = new THREE.BoxGeometry(16, 2, 16);
    const platform = new THREE.Mesh(platformGeo, towerMat);
    platform.position.set(x, y + 100, z);
    this.mapGroup.add(platform);
  }

  // --- Dynamic Hydraulic Car Crusher Press ---
  addHydraulicCarCrusher(x, y, z) {
    const frameMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.4, metalness: 0.6 });
    const frameGeo = new THREE.BoxGeometry(8, 12, 12);
    const frameMesh = new THREE.Mesh(frameGeo, frameMat);
    frameMesh.position.set(x, y + 6, z);
    this.mapGroup.add(frameMesh);

    // Moving Crusher Plate
    const plateMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.2, metalness: 0.9 });
    const plateGeo = new THREE.BoxGeometry(6.5, 1.2, 9.0);
    const plateMesh = new THREE.Mesh(plateGeo, plateMat);
    plateMesh.position.set(x, y + 4.5, z);
    plateMesh.castShadow = true;
    this.mapGroup.add(plateMesh);

    // Dynamic collider object in physics engine
    let crusherTime = 0;
    const crusher = {
      update: (dt) => {
        crusherTime += dt * 1.5;
        // Cyclical hydraulic crush motion: lower plate presses down to 0.4m, then rises to 5.0m
        const targetY = 2.7 + Math.sin(crusherTime) * 2.3;
        plateMesh.position.y = targetY;
        crusher.currentPlateY = targetY;
      },
      resolve: (node, dt, engine) => {
        const dx = node.pos.x - x;
        const dz = node.pos.z - z;
        if (Math.abs(dx) < 3.2 && Math.abs(dz) < 4.4) {
          const plateBottom = crusher.currentPlateY - 0.6;
          if (node.pos.y > plateBottom - 0.2 && node.pos.y < crusher.currentPlateY + 0.6) {
            // Crush node down towards ground
            node.pos.y = plateBottom - node.radius;
            node.vel.y = -8.0; // heavy downward crushing momentum
          }
        }
      }
    };
    this.physics.addDynamicCollider(crusher);
  }

  addFireHydrant(x, y, z) {
    const hydrantMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.5 });
    const hydrantGeo = new THREE.CylinderGeometry(0.3, 0.35, 1.1, 12);
    const hydrantMesh = new THREE.Mesh(hydrantGeo, hydrantMat);
    hydrantMesh.position.set(x, y + 0.55, z);
    this.mapGroup.add(hydrantMesh);

    let isBroken = false;
    this.physics.addStaticCollider({
      type: 'hydrant',
      resolve: (node, dt) => {
        const dx = node.pos.x - x;
        const dz = node.pos.z - z;
        const d = Math.sqrt(dx * dx + dz * dz);
        if (d < 0.45 + node.radius && node.pos.y < y + 1.1) {
          if (!isBroken && node.vel.length() > 5.0) {
            isBroken = true;
            hydrantMesh.rotation.z = Math.PI * 0.45; // knock over
            // Burst water geyser particles!
            if (this.particles) {
              this.particles.emitSmoke(new THREE.Vector3(x, y + 0.3, z), new THREE.Vector3(0, 18, 0), 25, 'steam');
            }
          }
        }
      }
    });
  }
}
