import * as THREE from 'three';
import { SoftBodyNode, SoftBodyBeam } from './physics.js';

export const VEHICLE_SPECS = [
  {
    id: 'hirochi_apex',
    name: 'Hirochi Apex NS-98',
    subtitle: 'Classic Japanese Mid-Engine Supercar',
    badge: 'MR V6 3.2L',
    layout: 'MR',
    driveType: 'RWD',
    engineType: 'V6',
    cylinders: 6,
    isHybrid: false,
    hp: 290,
    torque: 224, // lb-ft
    redline: 8200,
    idleRpm: 850,
    weightKg: 1370,
    dimensions: { length: 4.42, width: 1.81, height: 1.17, wheelbase: 2.53 },
    color: 0xcc1122, // Formula Red
    trims: ['Factory Spec (290hp)', 'Track Edition (340hp)', 'Twin-Turbo Spec (480hp)'],
    description: 'Pop-up headlights, low-slung widebody, glass rear hatch, driver cockpit, 5-spoke alloy wheels, and lightweight aluminum monocoque frame.'
  },
  {
    id: 'bruckell_venom',
    name: 'Bruckell Venom VX-10',
    subtitle: 'Aggressive American Front-Mid V10 Supercar',
    badge: 'FR V10 8.4L',
    layout: 'FR',
    driveType: 'RWD',
    engineType: 'V10',
    cylinders: 10,
    isHybrid: false,
    hp: 645,
    torque: 600,
    redline: 6500,
    idleRpm: 750,
    weightKg: 1530,
    dimensions: { length: 4.46, width: 1.94, height: 1.24, wheelbase: 2.51 },
    color: 0x1d4ed8, // GTS Blue with white stripes
    trims: ['GT Spec (645hp)', 'ACR Track Package (680hp)', 'Drag Strip Special (850hp)'],
    description: 'Elongated clamshell hood with deep heat extractors, side-exit dual pipes, double-bubble roof line, and massive rear steam-roller tires.'
  },
  {
    id: 'solis_ecowagon',
    name: 'Solis EcoWagon V',
    subtitle: 'Aerodynamic 5-Door Hybrid Wagon',
    badge: 'FF HYBRID 1.8L',
    layout: 'FF',
    driveType: 'FWD',
    engineType: 'I4',
    cylinders: 4,
    isHybrid: true,
    hp: 134,
    torque: 153,
    redline: 5500,
    idleRpm: 600,
    weightKg: 1485,
    dimensions: { length: 4.61, width: 1.77, height: 1.57, wheelbase: 2.78 },
    color: 0x0ea5e9, // Sky Blue Eco Metallic
    trims: ['Eco Base (134hp)', 'Touring Comfort (145hp)', 'Taxi Fleet Spec (134hp)'],
    description: 'Extended roofline, vertical LED taillights, eco aero wheel covers, center-mounted digital dash, and deep crumple zones.'
  },
  {
    id: 'hirochi_crossstar',
    name: 'Hirochi CrossStar HV',
    subtitle: 'Modern Crossover Hybrid SUV',
    badge: 'e-AWD 2.5L',
    layout: 'FR',
    driveType: 'AWD',
    engineType: 'I4',
    cylinders: 4,
    isHybrid: true,
    hp: 219,
    torque: 163,
    redline: 6000,
    idleRpm: 700,
    weightKg: 1760,
    dimensions: { length: 4.74, width: 1.85, height: 1.67, wheelbase: 2.69 },
    color: 0xf8fafc, // Pearl White
    trims: ['LE Base (219hp)', 'XLE Sport (235hp)', 'Limited Luxe (250hp)'],
    description: 'Bold chrome grille, sharp LED eyebrow lights, sloping coupe roofline, full-width rear light bar, and dual exhaust outlets.'
  },
  {
    id: 'bruckell_executive',
    name: 'Bruckell Executive V8',
    subtitle: 'Late-1980s American Full-Size Luxury Sedan',
    badge: 'FR V8 5.0L',
    layout: 'FR',
    driveType: 'RWD',
    engineType: 'V8',
    cylinders: 8,
    isHybrid: false,
    hp: 180,
    torque: 270,
    redline: 4800,
    idleRpm: 650,
    weightKg: 1850,
    dimensions: { length: 5.38, width: 1.98, height: 1.45, wheelbase: 2.98 },
    color: 0x334155, // Midnight Charcoal
    trims: ['Luxury V8 (180hp)', 'Fleet Taxi (160hp)', 'Police Interceptor (240hp)'],
    description: 'Heavy steel body-on-frame, plush interior, wire wheel covers, chrome box bumpers, and quad rectangular headlights.'
  },
  {
    id: 'hirochi_surge',
    name: 'Hirochi Surge Turbo Rally',
    subtitle: 'Late-1990s Japanese 3-Door Rally Hatch',
    badge: 'AWD TURBO 2.0L',
    layout: 'FF',
    driveType: 'AWD',
    engineType: 'I4',
    cylinders: 4,
    isHybrid: false,
    hp: 276,
    torque: 260,
    redline: 7800,
    idleRpm: 900,
    weightKg: 1220,
    dimensions: { length: 3.98, width: 1.74, height: 1.38, wheelbase: 2.44 },
    color: 0xf59e0b, // Championship Sunburst Yellow
    trims: ['1.5L Base (115hp)', 'GT-Turbo (220hp)', 'Group A Rally Spec (276hp)'],
    description: 'Wide rally fender flares, functional roof scoop, circular fog lights, high rear wing, mud flaps, and close-ratio 5-speed.'
  },
  {
    id: 'scintilla_velocita',
    name: 'Scintilla Velocita V12',
    subtitle: 'Modern European Exotic Hypercar',
    badge: 'MR V12 6.5L',
    layout: 'MR',
    driveType: 'RWD',
    engineType: 'V12',
    cylinders: 12,
    isHybrid: false,
    hp: 780,
    torque: 531,
    redline: 8700,
    idleRpm: 950,
    weightKg: 1420,
    dimensions: { length: 4.78, width: 2.03, height: 1.13, wheelbase: 2.70 },
    color: 0x10b981, // Verde Mantis Neon Green
    trims: ['Stradale (780hp)', 'Corse Track Edition (830hp)', 'Speed Record Spec (950hp)'],
    description: 'Active hydraulic aero rear wing, scissor doors, carbon diffuser, quad center exhaust, and rigid carbon-fiber monocoque.'
  },
  {
    id: 'gavril_d15',
    name: 'Gavril D15 Heavy-Duty',
    subtitle: 'Modern Full-Size 4x4 Crew-Cab Pickup',
    badge: '4x4 DIESEL 6.7L',
    layout: 'FR',
    driveType: '4WD',
    engineType: 'V8',
    cylinders: 8,
    isHybrid: false,
    hp: 475,
    torque: 1050,
    redline: 4200,
    idleRpm: 600,
    weightKg: 3400,
    dimensions: { length: 6.35, width: 2.42, height: 2.02, wheelbase: 4.02 },
    color: 0x94a3b8, // Billet Silver
    trims: ['Work Truck (400hp)', 'Off-Road Adventure (475hp)', 'Dually Towing Spec (475hp)'],
    description: 'Boxed ladder frame, raised suspension, massive chrome front fascia, dually rear wheels, bed liner, and high-low transfer case.'
  },
  {
    id: 'gavril_barricade',
    name: 'Gavril Barricade 429',
    subtitle: 'Classic 1970 American Big-Block Muscle Car',
    badge: 'FR V8 7.0L',
    layout: 'FR',
    driveType: 'RWD',
    engineType: 'V8',
    cylinders: 8,
    isHybrid: false,
    hp: 375,
    torque: 450,
    redline: 6200,
    idleRpm: 800,
    weightKg: 1610,
    dimensions: { length: 4.88, width: 1.88, height: 1.32, wheelbase: 2.74 },
    color: 0xe11d48, // Candy Apple Red
    trims: ['302 Commuter (210hp)', '429 Cobra Jet (375hp)', 'Trans-Am Race Car (460hp)'],
    description: 'Fastback roofline, shaker hood scoop, front chin spoiler, wide rear tires, dual chrome exhaust, and roaring big-block rumble.'
  },
  {
    id: 'etk_856',
    name: 'ETK 856 tdb SportWagon',
    subtitle: 'German Luxury High-Performance Touring Estate',
    badge: 'AWD I6 3.0L TWIN-TURBO',
    layout: 'FR',
    driveType: 'AWD',
    engineType: 'I6',
    cylinders: 6,
    isHybrid: false,
    hp: 503,
    torque: 479,
    redline: 7200,
    idleRpm: 750,
    weightKg: 1820,
    dimensions: { length: 4.79, width: 1.90, height: 1.44, wheelbase: 2.85 },
    color: 0x1e293b, // Tanzanite Blue Metallic
    trims: ['854d Diesel (286hp)', '856i Sport (382hp)', 'tdb TrackWagon (503hp)'],
    description: 'Matrix LED headlights, panoramic glass roof, quad trapezoidal exhausts, 20-inch turbine wheels, and intelligent AWD.'
  }
];

export class Vehicle {
  constructor(specId, scene, physicsEngine, spawnTransform = { x: 0, y: 0.6, z: 0, rotY: 0 }) {
    this.scene = scene;
    this.physics = physicsEngine;
    this.spec = VEHICLE_SPECS.find(s => s.id === specId) || VEHICLE_SPECS[0];

    // Mechanical Health States
    this.engineHealth = 1.0;
    this.radiatorHealth = 1.0;
    this.radiatorLeaking = false;
    this.engineTemp = 90.0; // Celsius
    this.isOverheating = false;
    this.isSeized = false;
    this.tirePressures = [32.0, 32.0, 32.0, 32.0]; // FL, FR, RL, RR in PSI
    this.tirePunctured = [false, false, false, false];
    this.suspensionHealth = 1.0;
    this.glassShattered = false;
    this.doorsDetached = { driver: false, passenger: false, hood: false, trunk: false };

    // Drivetrain & Powertrain State
    this.rpm = this.spec.idleRpm;
    this.gear = 1; // -1: R, 0: N, 1-6: Forward
    this.gearboxMode = 'automatic'; // 'automatic' | 'manual'
    this.speedKph = 0;
    this.speedMph = 0;
    this.throttle = 0;
    this.brake = 0;
    this.steering = 0; // -1 to 1
    this.handbrake = true;
    this.clutch = 0;
    this.boostPsi = 0;
    this.tireSlip = 0;
    this.gForce = 0;
    this.hornActive = false;
    this.headlightsOn = false;
    this.hazardsOn = false;
    this.escEnabled = true;
    this.tcsActive = false;
    this.absActive = false;
    this.diffLock = false;
    this.transfer4WD = this.spec.driveType === '4WD' || this.spec.driveType === 'AWD';

    // Telemetry tracking
    this.prevVelocity = new THREE.Vector3();
    this.homeTransform = { ...spawnTransform };

    // Visual & Physical Components
    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.nodes = [];
    this.beams = [];
    this.visualMeshes = [];
    this.wheelMeshes = []; // FL, FR, RL, RR
    this.subMeshes = {}; // doors, hood, steering_wheel, etc.
    this.flexSkinBindings = []; // vertex binding to soft-body nodes

    // Build vehicle
    this.buildSoftBodyNetwork(spawnTransform);
    this.buildVisualGeometry();
    this.bindFlexbodyMeshSkinning();
    this.initDebugSkeleton();
  }

  // --- 1. Build Mass-Spring-Damper Node-Beam Network ---
  buildSoftBodyNetwork(spawnTransform) {
    const { length, width, height, wheelbase } = this.spec.dimensions;
    const halfL = length * 0.5;
    const halfW = width * 0.5;
    const halfH = height * 0.5;
    const nodeMass = this.spec.weightKg / 70; // 70 primary structural lattice nodes

    const rotY = spawnTransform.rotY || 0;
    const cosR = Math.cos(rotY);
    const sinR = Math.sin(rotY);

    const transformCoord = (lx, ly, lz) => {
      const rx = lx * cosR + lz * sinR;
      const rz = -lx * sinR + lz * cosR;
      return {
        x: spawnTransform.x + rx,
        y: spawnTransform.y + ly,
        z: spawnTransform.z + rz
      };
    };

    // 3D Grid coordinates for soft-body lattice
    // Z-axis: Front (+halfL) to Rear (-halfL)
    // X-axis: Left (+halfW) to Right (-halfW)
    // Y-axis: Lower floor (0.2) to Upper roof (1.2)
    const zSplits = [-halfL, -halfL * 0.6, -wheelbase * 0.5, 0, wheelbase * 0.5, halfL * 0.7, halfL];
    const xSplits = [-halfW, -halfW * 0.35, 0, halfW * 0.35, halfW];
    const ySplits = [0.18, 0.45, 0.85, 1.25];

    // Generate Structural Nodes
    for (let zi = 0; zi < zSplits.length; zi++) {
      const lz = zSplits[zi];
      for (let xi = 0; xi < xSplits.length; xi++) {
        const lx = xSplits[xi];
        for (let yi = 0; yi < ySplits.length; yi++) {
          // Narrow upper roof/cabin inward for aerodynamic car shape
          let effectiveX = lx;
          let effectiveY = ySplits[yi];
          if (yi >= 2) {
            // Cabin zone
            if (lz > halfL * 0.45 || lz < -halfL * 0.55) continue; // no roof on hood/trunk
            effectiveX *= 0.78;
          }

          const worldPos = transformCoord(effectiveX, effectiveY, lz);
          let tag = 'chassis';
          if (zi === zSplits.length - 1 && yi <= 1) tag = 'bumper_f';
          else if (zi === 0 && yi <= 1) tag = 'bumper_r';
          else if (zi >= zSplits.length - 2 && Math.abs(lx) < 0.4 && yi <= 1) tag = 'engine';
          else if (zi === zSplits.length - 2 && Math.abs(lx) < 0.5 && yi === 1) tag = 'radiator';

          const node = new SoftBodyNode(worldPos.x, worldPos.y, worldPos.z, nodeMass, tag);
          node.localRef = new THREE.Vector3(effectiveX, effectiveY, lz);
          this.nodes.push(node);
        }
      }
    }

    // Connect Viscoelastic Beams (Cross-braced structural lattice)
    const kStiff = this.spec.layout === 'MR' ? 520000 : 450000;
    const cDamp = 1400;

    for (let i = 0; i < this.nodes.length; i++) {
      for (let j = i + 1; j < this.nodes.length; j++) {
        const nA = this.nodes[i];
        const nB = this.nodes[j];
        const initialDist = nA.pos.distanceTo(nB.pos);

        // Connect adjacent neighbors and diagonal cross-braces
        if (initialDist < 1.45 && initialDist > 0.15) {
          let yieldStrain = 0.10;
          let breakStrain = 0.42;
          let tag = 'structural';

          if (nA.tag === 'bumper_f' || nB.tag === 'bumper_f') {
            yieldStrain = 0.05; // bumpers crumple easily
            breakStrain = 0.28;
            tag = 'bumper_f';
          } else if (nA.tag === 'radiator' || nB.tag === 'radiator') {
            yieldStrain = 0.04;
            breakStrain = 0.20;
            tag = 'radiator';
          }

          const beam = new SoftBodyBeam(nA, nB, kStiff, cDamp, yieldStrain, breakStrain, tag);
          this.beams.push(beam);
        }
      }
    }

    // Designate Hub & Wheel nodes
    this.findWheelHubNodes();
  }

  findWheelHubNodes() {
    const { wheelbase, width } = this.spec.dimensions;
    const halfW = width * 0.45;
    const frontZ = wheelbase * 0.5;
    const rearZ = -wheelbase * 0.5;

    // Closest nodes to each wheel position
    this.wheelHubs = {
      fl: this.getClosestNodeToLocal(halfW, 0.35, frontZ),
      fr: this.getClosestNodeToLocal(-halfW, 0.35, frontZ),
      rl: this.getClosestNodeToLocal(halfW, 0.35, rearZ),
      rr: this.getClosestNodeToLocal(-halfW, 0.35, rearZ)
    };
  }

  getClosestNodeToLocal(lx, ly, lz) {
    let bestNode = this.nodes[0];
    let bestDist = Infinity;
    const target = new THREE.Vector3(lx, ly, lz);

    for (const node of this.nodes) {
      if (node.localRef) {
        const d = node.localRef.distanceTo(target);
        if (d < bestDist) {
          bestDist = d;
          bestNode = node;
        }
      }
    }
    return bestNode;
  }

  // --- 2. Procedural High-Fidelity Geometry & Sub-Meshes ---
  buildVisualGeometry() {
    const { length, width, height } = this.spec.dimensions;

    // PBR Paint Material
    this.paintMaterial = new THREE.MeshStandardMaterial({
      color: this.spec.color,
      roughness: 0.18,
      metalness: 0.72,
      envMapIntensity: 1.2
    });

    // Glass Material
    this.glassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.35,
      roughness: 0.05,
      metalness: 0.1,
      transmission: 0.85,
      ior: 1.5,
      thickness: 0.2
    });

    // Trim / Carbon / Plastic Material
    this.trimMaterial = new THREE.MeshStandardMaterial({
      color: 0x181a20,
      roughness: 0.65,
      metalness: 0.2
    });

    // Wheel Material
    this.rimMaterial = new THREE.MeshStandardMaterial({
      color: 0xd8e0ea,
      roughness: 0.25,
      metalness: 0.85
    });
    this.tireMaterial = new THREE.MeshStandardMaterial({
      color: 0x111317,
      roughness: 0.85,
      metalness: 0.05
    });

    // 1. Car Body Flexbody (Deformable Surface Mesh)
    const bodyGeo = this.createCarBodyGeometry();
    this.bodyMesh = new THREE.Mesh(bodyGeo, this.paintMaterial);
    this.bodyMesh.castShadow = true;
    this.bodyMesh.receiveShadow = true;
    this.group.add(this.bodyMesh);
    this.visualMeshes.push(this.bodyMesh);

    // 2. Glass Windows Mesh
    const glassGeo = this.createWindowsGeometry();
    this.glassMesh = new THREE.Mesh(glassGeo, this.glassMaterial);
    this.glassMesh.castShadow = true;
    this.group.add(this.glassMesh);
    this.visualMeshes.push(this.glassMesh);

    // 3. Sub-Meshes: Four Rotating Wheels
    this.buildWheelMeshes();

    // 4. Cockpit Interior & Functional Steering Wheel
    this.buildInteriorSubmeshes();

    // 5. Headlights & Taillights
    this.buildLights();
  }

  createCarBodyGeometry() {
    const { length, width, height } = this.spec.dimensions;
    const geo = new THREE.BoxGeometry(width, height * 0.55, length, 12, 6, 20);

    // Sculpt car profile (taper nose, slope cabin, wheel wells)
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      let x = pos.getX(i);
      let y = pos.getY(i);
      let z = pos.getZ(i);

      // Raise body off ground
      y += height * 0.35;

      // Nose taper
      if (z > length * 0.2) {
        const taper = 1.0 - (z - length * 0.2) / (length * 0.32) * 0.25;
        x *= taper;
        y *= taper;
      }
      // Rear taper
      if (z < -length * 0.25) {
        const taper = 1.0 - (-z - length * 0.25) / (length * 0.3) * 0.15;
        x *= taper;
      }

      pos.setXYZ(i, x, y, z);
    }
    geo.computeVertexNormals();
    return geo;
  }

  createWindowsGeometry() {
    const { length, width, height } = this.spec.dimensions;
    const geo = new THREE.BoxGeometry(width * 0.76, height * 0.38, length * 0.42, 6, 4, 8);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      let y = pos.getY(i) + height * 0.72;
      let z = pos.getZ(i) - length * 0.05;
      pos.setY(i, y);
      pos.setZ(i, z);
    }
    geo.computeVertexNormals();
    return geo;
  }

  buildWheelMeshes() {
    const tireRadius = 0.34;
    const tireWidth = 0.24;

    const createWheel = (isFront, isLeft) => {
      const wheelGroup = new THREE.Group();

      // Rim
      const rimGeo = new THREE.CylinderGeometry(tireRadius * 0.65, tireRadius * 0.65, tireWidth * 0.95, 24);
      rimGeo.rotateZ(Math.PI / 2);
      const rimMesh = new THREE.Mesh(rimGeo, this.rimMaterial);
      rimMesh.castShadow = true;
      wheelGroup.add(rimMesh);

      // Tire Tread
      const tireGeo = new THREE.TorusGeometry(tireRadius * 0.72, tireRadius * 0.32, 16, 32);
      tireGeo.rotateY(Math.PI / 2);
      const tireMesh = new THREE.Mesh(tireGeo, this.tireMaterial);
      tireMesh.castShadow = true;
      wheelGroup.add(tireMesh);

      // Brake Disc & Caliper
      const brakeGeo = new THREE.CylinderGeometry(tireRadius * 0.45, tireRadius * 0.45, 0.04, 16);
      brakeGeo.rotateZ(Math.PI / 2);
      const brakeMesh = new THREE.Mesh(brakeGeo, this.trimMaterial);
      wheelGroup.add(brakeMesh);

      this.group.add(wheelGroup);
      return { group: wheelGroup, isFront, isLeft, spinAngle: 0, steerAngle: 0 };
    };

    this.wheelMeshes = [
      createWheel(true, true),   // FL
      createWheel(true, false),  // FR
      createWheel(false, true),  // RL
      createWheel(false, false)  // RR
    ];
  }

  buildInteriorSubmeshes() {
    // Cockpit Dashboard
    const dashGeo = new THREE.BoxGeometry(1.2, 0.28, 0.45);
    const dashMesh = new THREE.Mesh(dashGeo, this.trimMaterial);
    dashMesh.position.set(0, 0.72, 0.3);
    this.group.add(dashMesh);
    this.visualMeshes.push(dashMesh);

    // Functional Rotating Steering Wheel
    const steerGroup = new THREE.Group();
    steerGroup.position.set(0.38, 0.76, 0.42); // Left hand drive
    steerGroup.rotation.x = -Math.PI * 0.12;

    const ringGeo = new THREE.TorusGeometry(0.18, 0.022, 12, 24);
    const ringMesh = new THREE.Mesh(ringGeo, this.trimMaterial);
    steerGroup.add(ringMesh);

    const spokeGeo = new THREE.BoxGeometry(0.34, 0.03, 0.02);
    const spokeMesh = new THREE.Mesh(spokeGeo, this.rimMaterial);
    steerGroup.add(spokeMesh);

    this.group.add(steerGroup);
    this.subMeshes.steeringWheel = steerGroup;
  }

  buildLights() {
    const { length, width } = this.spec.dimensions;

    // Headlights (Emissive)
    const headGeo = new THREE.BoxGeometry(0.24, 0.08, 0.06);
    this.headMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const headL = new THREE.Mesh(headGeo, this.headMat);
    const headR = new THREE.Mesh(headGeo, this.headMat);
    headL.position.set(width * 0.36, 0.52, length * 0.49);
    headR.position.set(-width * 0.36, 0.52, length * 0.49);
    this.group.add(headL);
    this.group.add(headR);

    // Taillights
    const tailGeo = new THREE.BoxGeometry(0.28, 0.08, 0.06);
    this.tailMat = new THREE.MeshBasicMaterial({ color: 0xff1122 });
    const tailL = new THREE.Mesh(tailGeo, this.tailMat);
    const tailR = new THREE.Mesh(tailGeo, this.tailMat);
    tailL.position.set(width * 0.36, 0.58, -length * 0.49);
    tailR.position.set(-width * 0.36, 0.58, -length * 0.49);
    this.group.add(tailL);
    this.group.add(tailR);
  }

  // --- 3. Flexbody Vertex Binding to Soft-Body Nodes ---
  bindFlexbodyMeshSkinning() {
    for (const mesh of this.visualMeshes) {
      const geo = mesh.geometry;
      const posAttr = geo.attributes.position;
      const bindings = [];

      for (let i = 0; i < posAttr.count; i++) {
        const vPos = new THREE.Vector3(posAttr.getX(i), posAttr.getY(i), posAttr.getZ(i));

        // Find 3 closest structural nodes to skin vertex
        const neighbors = [];
        for (let nIdx = 0; nIdx < this.nodes.length; nIdx++) {
          const node = this.nodes[nIdx];
          if (node.localRef) {
            const d = vPos.distanceTo(node.localRef);
            neighbors.push({ index: nIdx, dist: d });
          }
        }
        neighbors.sort((a, b) => a.dist - b.dist);

        const top3 = neighbors.slice(0, 3);
        const invSum = top3.reduce((sum, item) => sum + 1.0 / (item.dist + 0.01), 0);
        const weights = top3.map(item => (1.0 / (item.dist + 0.01)) / invSum);

        bindings.push({
          vertexIndex: i,
          nodes: top3.map(t => t.index),
          weights,
          localOffset: vPos.clone()
        });
      }
      this.flexSkinBindings.push({ mesh, bindings });
    }
  }

  // --- 4. Debug Skeleton Overlay (Ctrl + B) ---
  initDebugSkeleton() {
    const lineGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(this.beams.length * 6);
    const colors = new Float32Array(this.beams.length * 6);

    lineGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    lineGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const lineMat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      depthTest: false
    });
    this.skeletonLines = new THREE.LineSegments(lineGeo, lineMat);
    this.skeletonLines.visible = false;
    this.skeletonLines.frustumCulled = false;
    this.scene.add(this.skeletonLines);
  }

  setDebugSkeletonVisible(visible) {
    if (this.skeletonLines) {
      this.skeletonLines.visible = visible;
    }
  }

  // --- 5. Real-Time Telemetry, Drivetrain & Aerodynamics ---
  applyDrivetrainAndAero(dt) {
    if (this.isSeized) {
      this.throttle = 0;
      this.rpm = 0;
    }

    // Engine RPM & Torque Calculation
    const idle = this.spec.idleRpm;
    const redline = this.spec.redline;
    const targetRpm = Math.max(idle, idle + this.throttle * (redline - idle) * (this.gear === 0 ? 0.95 : 0.65) + Math.abs(this.speedKph) * 45);
    this.rpm += (targetRpm - this.rpm) * dt * 10;

    // Turbo boost pressure (PSI)
    if (this.spec.subtitle.includes('Turbo') || this.spec.badge.includes('TURBO')) {
      const maxBoost = 18.5;
      const targetBoost = this.throttle > 0.3 ? (this.rpm / redline) * maxBoost * this.throttle : 0;
      this.boostPsi += (targetBoost - this.boostPsi) * dt * 8;
    } else {
      this.boostPsi = 0;
    }

    // Engine & Radiator Thermal Simulation
    if (this.radiatorLeaking) {
      this.engineTemp += dt * 8.5; // fast thermal runaway
      if (this.engineTemp > 135) {
        this.engineHealth = Math.max(0, this.engineHealth - dt * 0.15);
        if (this.engineHealth <= 0) {
          this.isSeized = true; // engine hydrolock / seizure
        }
      }
    } else {
      // Normal operating temperature stabilization
      const nominalTemp = 90 + this.throttle * 15;
      this.engineTemp += (nominalTemp - this.engineTemp) * dt * 0.2;
    }

    // Drive force calculation
    let driveRatio = 1.0;
    if (this.gear === 1) driveRatio = 3.6;
    else if (this.gear === 2) driveRatio = 2.2;
    else if (this.gear === 3) driveRatio = 1.5;
    else if (this.gear === 4) driveRatio = 1.1;
    else if (this.gear === 5) driveRatio = 0.85;
    else if (this.gear === 6) driveRatio = 0.70;
    else if (this.gear === -1) driveRatio = -3.2;
    else driveRatio = 0;

    const baseForce = (this.spec.hp * 14.5 * driveRatio * this.throttle) * (this.engineHealth);
    const brakeForce = this.brake * 28000;
    const handbrakeForce = this.handbrake ? 38000 : 0;

    // Distribute Drive Forces to Hubs based on Drivetrain Layout
    const hubs = this.wheelHubs;
    const forwardVec = this.getForwardVector();
    const rightVec = this.getRightVector();

    // Wheel Steering
    const steerAngle = this.steering * 0.58; // radians (approx 33 degrees)
    const steerVec = forwardVec.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), -steerAngle);

    // Front Wheels (FL, FR)
    if (hubs.fl && hubs.fr) {
      const frontDrive = (this.spec.driveType === 'FWD' || this.spec.driveType === 'AWD' || (this.spec.driveType === '4WD' && this.transfer4WD)) ? baseForce * 0.5 : 0;
      hubs.fl.forces.addScaledVector(steerVec, frontDrive - brakeForce);
      hubs.fr.forces.addScaledVector(steerVec, frontDrive - brakeForce);
    }

    // Rear Wheels (RL, RR)
    if (hubs.rl && hubs.rr) {
      const rearDrive = (this.spec.driveType === 'RWD' || this.spec.driveType === 'AWD' || this.spec.driveType === '4WD') ? baseForce * 0.5 : 0;
      hubs.rl.forces.addScaledVector(forwardVec, rearDrive - brakeForce - handbrakeForce);
      hubs.rr.forces.addScaledVector(forwardVec, rearDrive - brakeForce - handbrakeForce);
    }

    // Aerodynamic Downforce & Drag
    const com = this.getCenterOfMass();
    const vel = this.getAverageVelocity();
    const speed = vel.length();
    this.speedKph = speed * 3.6;
    this.speedMph = speed * 2.23694;

    const dragForce = forwardVec.clone().multiplyScalar(-0.5 * 1.225 * speed * speed * 0.34);
    const downforce = new THREE.Vector3(0, -0.5 * 1.225 * speed * speed * 0.65, 0);

    for (const node of this.nodes) {
      node.forces.addScaledVector(dragForce, 1.0 / this.nodes.length);
      node.forces.addScaledVector(downforce, 1.0 / this.nodes.length);
    }

    // Calculate G-Force
    const accel = vel.clone().sub(this.prevVelocity).divideScalar(Math.max(0.001, dt));
    this.gForce = accel.length() / 9.81;
    this.prevVelocity.copy(vel);

    // Calculate Tire Lateral Slip
    const lateralVel = vel.dot(rightVec);
    this.tireSlip = Math.min(1.0, Math.abs(lateralVel) / (speed + 1.0));
  }

  // --- 6. Visual Update Every Render Frame ---
  updateVisuals() {
    // 1. Update Flexbody Mesh Vertex Positions based on Soft-Body Nodes
    for (const item of this.flexSkinBindings) {
      const geo = item.mesh.geometry;
      const posAttr = geo.attributes.position;

      for (const b of item.bindings) {
        let x = 0, y = 0, z = 0;
        for (let k = 0; k < b.nodes.length; k++) {
          const node = this.nodes[b.nodes[k]];
          const w = b.weights[k];
          x += node.pos.x * w;
          y += node.pos.y * w;
          z += node.pos.z * w;
        }
        posAttr.setXYZ(b.vertexIndex, x, y, z);
      }
      posAttr.needsUpdate = true;
      geo.computeVertexNormals();
    }

    // 2. Update Wheels Position & Steering/Spin
    const hubs = [this.wheelHubs.fl, this.wheelHubs.fr, this.wheelHubs.rl, this.wheelHubs.rr];
    for (let i = 0; i < this.wheelMeshes.length; i++) {
      const wheel = this.wheelMeshes[i];
      const hubNode = hubs[i];
      if (!hubNode) continue;

      wheel.group.position.copy(hubNode.pos);

      // Spin rotation
      wheel.spinAngle += (this.speedKph / 3.6 / 0.34) * 0.016;
      wheel.group.rotation.x = wheel.spinAngle;

      // Steering angle on front wheels
      if (wheel.isFront) {
        wheel.group.rotation.y = -this.steering * 0.58;
      }
    }

    // 3. Functional Interior Steering Wheel Rotation (1:1 with steering inputs)
    if (this.subMeshes.steeringWheel) {
      this.subMeshes.steeringWheel.rotation.z = -this.steering * 2.8;
    }

    // 4. Update Debug Skeleton Overlay
    if (this.skeletonLines && this.skeletonLines.visible) {
      const posAttr = this.skeletonLines.geometry.attributes.position;
      const colAttr = this.skeletonLines.geometry.attributes.color;
      let idx = 0;

      for (const beam of this.beams) {
        posAttr.setXYZ(idx, beam.nodeA.pos.x, beam.nodeA.pos.y, beam.nodeA.pos.z);
        posAttr.setXYZ(idx + 1, beam.nodeB.pos.x, beam.nodeB.pos.y, beam.nodeB.pos.z);

        if (beam.isBroken) {
          colAttr.setXYZ(idx, 0.8, 0.1, 0.1);
          colAttr.setXYZ(idx + 1, 0.8, 0.1, 0.1);
        } else {
          // Strain color: Green (neutral) -> Yellow -> Orange -> Red
          const s = Math.min(1.0, beam.strain * 4.0);
          colAttr.setXYZ(idx, s, 1.0 - s * 0.7, 0.1);
          colAttr.setXYZ(idx + 1, s, 1.0 - s * 0.7, 0.1);
        }
        idx += 2;
      }
      posAttr.needsUpdate = true;
      colAttr.needsUpdate = true;
    }

    // 5. Check Structural Damage for Component Status
    this.evaluateMechanicalDamage();
  }

  evaluateMechanicalDamage() {
    let brokenCount = 0;
    let radiatorStrainSum = 0;
    let radiatorBeamsCount = 0;

    for (const beam of this.beams) {
      if (beam.isBroken) brokenCount++;
      if (beam.tag === 'radiator') {
        radiatorStrainSum += beam.strain;
        radiatorBeamsCount++;
      }
    }

    if (radiatorBeamsCount > 0 && (radiatorStrainSum / radiatorBeamsCount > 0.08 || brokenCount > 5)) {
      this.radiatorLeaking = true;
      this.radiatorHealth = Math.max(0, 1.0 - brokenCount * 0.05);
    }
  }

  // --- Reset & Recovery Methods ---
  resetToHome() {
    const { x, y, z, rotY } = this.homeTransform;
    const cosR = Math.cos(rotY || 0);
    const sinR = Math.sin(rotY || 0);

    for (const node of this.nodes) {
      if (node.localRef) {
        const rx = node.localRef.x * cosR + node.localRef.z * sinR;
        const rz = -node.localRef.x * sinR + node.localRef.z * cosR;
        node.pos.set(x + rx, y + node.localRef.y, z + rz);
        node.oldPos.copy(node.pos);
        node.vel.set(0, 0, 0);
        node.forces.set(0, 0, 0);
      }
    }

    // Reset Beams
    for (const beam of this.beams) {
      beam.isBroken = false;
      beam.restLength = beam.initialRestLength;
      beam.strain = 0;
    }

    // Reset Mechanical Health
    this.engineHealth = 1.0;
    this.radiatorHealth = 1.0;
    this.radiatorLeaking = false;
    this.engineTemp = 90.0;
    this.isSeized = false;
    this.rpm = this.spec.idleRpm;
    this.gear = 1;
    this.speedKph = 0;
    this.speedMph = 0;
    this.handbrake = true;
  }

  // Spatial queries
  getCenterOfMass() {
    const sum = new THREE.Vector3();
    for (const node of this.nodes) {
      sum.add(node.pos);
    }
    return sum.divideScalar(this.nodes.length);
  }

  getAverageVelocity() {
    const sum = new THREE.Vector3();
    for (const node of this.nodes) {
      sum.add(node.vel);
    }
    return sum.divideScalar(this.nodes.length);
  }

  getForwardVector() {
    const front = this.wheelHubs.fl ? this.wheelHubs.fl.pos : this.nodes[this.nodes.length - 1].pos;
    const rear = this.wheelHubs.rl ? this.wheelHubs.rl.pos : this.nodes[0].pos;
    return new THREE.Vector3().subVectors(front, rear).setY(0).normalize();
  }

  getRightVector() {
    return this.getForwardVector().applyAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI / 2);
  }

  destroy() {
    if (this.group) this.scene.remove(this.group);
    if (this.skeletonLines) this.scene.remove(this.skeletonLines);
  }
}
