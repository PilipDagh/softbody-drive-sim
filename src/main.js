import * as THREE from 'three';
import { SoftBodyPhysicsEngine } from './physics.js';
import { Vehicle, VEHICLE_SPECS } from './vehicles.js';
import { EnvironmentManager } from './environment.js';
import { SoundEngine } from './audio.js';
import { ParticleSystem } from './particles.js';
import { UIManager } from './ui.js';

class BeamNGSimulationEngine {
  constructor() {
    this.container = document.getElementById('canvas-container');

    // 1. Three.js WebGL2 Setup
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 1500);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.0));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.container.appendChild(this.renderer.domElement);

    // 2. Subsystems
    this.physics = new SoftBodyPhysicsEngine(this.scene);
    this.sound = new SoundEngine();
    this.particles = new ParticleSystem(this.scene);
    this.environment = new EnvironmentManager(this.scene, this.physics, this.particles);

    // 3. Vehicles
    this.vehicles = [];
    this.activeVehicleIndex = 0;

    // 4. Cameras
    this.cameraModes = ['chase', 'cockpit', 'hood', 'bumper', 'orbit', 'cinematic', 'free'];
    this.cameraModeIndex = 0;
    this.freeCam = {
      pos: new THREE.Vector3(0, 5, 12),
      pitch: 0,
      yaw: 0,
      speed: 18.0
    };
    this.orbitAngles = { yaw: 0, pitch: 0.35, dist: 7.5 };

    // 5. Input System
    this.keys = {};
    this.mouse = { x: 0, y: 0, down: false, isDragging: false };
    this.isCtrlDown = false;
    this.raycaster = new THREE.Raycaster();
    this.grabPlane = new THREE.Plane();
    this.grabPlaneIntersect = new THREE.Vector3();

    // 6. Physics Callbacks to Particles & Audio
    this.physics.onBeamBreak = (beam, pos) => {
      this.sound.playMetalCrunch(1.5);
      this.particles.emitSparks(pos, null, 14);
      if (beam.tag === 'window' || beam.tag === 'windshield') {
        this.sound.playGlassShatter();
        this.particles.emitGlassShards(pos, 25);
      }
    };
    this.physics.onDeform = (beam, strain) => {
      if (strain > 0.15) {
        this.sound.playMetalCrunch(strain * 1.8);
      }
    };
    this.physics.onSparkScrape = (pos, vel) => {
      this.particles.emitSparks(pos, vel, 6);
    };

    // 7. UI Manager
    this.ui = new UIManager(this);

    // 8. Lifecycle
    this.clock = new THREE.Clock();
    this.fpsCounter = 60;
    this.framesThisSecond = 0;
    this.lastFpsUpdate = performance.now();

    this.initInputs();
    this.initResize();

    // Spawn default vehicle and map
    this.environment.loadMap('proving_grounds');
    this.spawnDefaultVehicle('hirochi_apex');

    // Start Simulation Loop
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  get activeVehicle() {
    return this.vehicles[this.activeVehicleIndex] || null;
  }

  spawnDefaultVehicle(specId) {
    const car = new Vehicle(specId, this.scene, this.physics, { x: 0, y: 0.55, z: 0, rotY: 0 });
    this.vehicles.push(car);
    this.physics.addVehicle(car);
    this.activeVehicleIndex = 0;
    this.sound.setEngineConfig(car.spec.cylinders, car.spec.isHybrid);
    this.ui.updateSubstepLabel();
  }

  replaceActiveVehicle(specId) {
    const active = this.activeVehicle;
    let spawnTransform = { x: 0, y: 0.55, z: 0, rotY: 0 };

    if (active) {
      const com = active.getCenterOfMass();
      spawnTransform = { x: com.x, y: com.y + 0.3, z: com.z, rotY: 0 };
      this.physics.removeVehicle(active);
      active.destroy();
      this.vehicles.splice(this.activeVehicleIndex, 1);
    }

    const newCar = new Vehicle(specId, this.scene, this.physics, spawnTransform);
    this.vehicles.splice(this.activeVehicleIndex, 0, newCar);
    this.physics.addVehicle(newCar);
    this.sound.setEngineConfig(newCar.spec.cylinders, newCar.spec.isHybrid);
  }

  spawnVehicleBeside(specId) {
    const active = this.activeVehicle;
    let spawnX = 3.8;
    let spawnZ = 0;
    let spawnY = 0.55;

    if (active) {
      const com = active.getCenterOfMass();
      const right = active.getRightVector();
      spawnX = com.x + right.x * 3.8;
      spawnZ = com.z + right.z * 3.8;
      spawnY = com.y + 0.2;
    }

    const chosenId = specId || (active ? active.spec.id : 'bruckell_venom');
    const newCar = new Vehicle(chosenId, this.scene, this.physics, { x: spawnX, y: spawnY, z: spawnZ, rotY: 0 });
    this.vehicles.push(newCar);
    this.physics.addVehicle(newCar);
    this.activeVehicleIndex = this.vehicles.length - 1;
    this.sound.setEngineConfig(newCar.spec.cylinders, newCar.spec.isHybrid);
  }

  switchVehicle() {
    if (this.vehicles.length <= 1) return;
    this.activeVehicleIndex = (this.activeVehicleIndex + 1) % this.vehicles.length;
    const car = this.activeVehicle;
    this.sound.setEngineConfig(car.spec.cylinders, car.spec.isHybrid);
    this.ui.showToast(`Switched to: ${car.spec.name}`);
  }

  resetActiveVehicle() {
    if (this.activeVehicle) {
      this.activeVehicle.resetToHome();
      this.ui.showToast('Vehicle reset to home position');
    }
  }

  recoverActiveVehicle() {
    const car = this.activeVehicle;
    if (!car) return;
    const com = car.getCenterOfMass();
    // Lift car 1.0m up and level orientation
    for (const node of car.nodes) {
      if (node.localRef) {
        node.pos.set(com.x + node.localRef.x, Math.max(0.6, com.y + 0.8) + node.localRef.y, com.z + node.localRef.z);
        node.vel.set(0, 0, 0);
        node.forces.set(0, 0, 0);
      }
    }
    this.ui.showToast('Vehicle recovered');
  }

  loadMap(mapId) {
    this.environment.loadMap(mapId);
    this.resetActiveVehicle();
  }

  toggleDebugSkeleton() {
    const car = this.activeVehicle;
    if (car && car.skeletonLines) {
      const cur = car.skeletonLines.visible;
      car.setDebugSkeletonVisible(!cur);
      this.ui.showToast(`Debug Skeleton: ${!cur ? 'ON' : 'OFF'}`);
    }
  }

  cycleCamera() {
    this.cameraModeIndex = (this.cameraModeIndex + 1) % (this.cameraModes.length - 1); // exclude free cam in normal cycle
    const mode = this.cameraModes[this.cameraModeIndex];
    document.getElementById('top-cam-name').innerText = `${mode.toUpperCase()} CAM`;
    this.ui.showToast(`Camera: ${mode.toUpperCase()}`);
  }

  applyPreset(preset) {
    switch (preset) {
      case 'low':
        this.physics.substepFreq = 500;
        this.renderer.shadowMap.enabled = false;
        break;
      case 'medium':
        this.physics.substepFreq = 1000;
        this.renderer.shadowMap.enabled = true;
        this.environment.sunLight.shadow.mapSize.width = 1024;
        this.environment.sunLight.shadow.mapSize.height = 1024;
        break;
      case 'high':
        this.physics.substepFreq = 1000;
        this.renderer.shadowMap.enabled = true;
        this.environment.sunLight.shadow.mapSize.width = 2048;
        this.environment.sunLight.shadow.mapSize.height = 2048;
        break;
      case 'ultra':
        this.physics.substepFreq = 2000;
        this.renderer.shadowMap.enabled = true;
        this.environment.sunLight.shadow.mapSize.width = 4096;
        this.environment.sunLight.shadow.mapSize.height = 4096;
        break;
    }
    this.ui.updateSubstepLabel();
    this.ui.showToast(`Applied preset: ${preset.toUpperCase()}`);
  }

  // --- Input Matrix (BeamNG 1:1 Keybindings) ---
  initInputs() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;

      if (e.key === 'Control') {
        this.isCtrlDown = true;
        document.body.classList.add('ctrl-active');
        document.getElementById('node-reticle').style.display = 'block';
      }

      // BeamNG Single Key Actions
      if (e.code === 'KeyR' && !e.ctrlKey) {
        this.resetActiveVehicle();
      } else if (e.code === 'KeyI' && !e.ctrlKey) {
        this.resetActiveVehicle();
      } else if (e.code === 'Insert') {
        this.recoverActiveVehicle();
      } else if (e.code === 'KeyJ') {
        this.physics.isPaused = !this.physics.isPaused;
        document.getElementById('sim-state-text').innerText = this.physics.isPaused ? 'Paused' : 'Running';
        this.ui.showToast(this.physics.isPaused ? 'Simulation Paused' : 'Simulation Resumed');
      } else if (e.code === 'KeyP') {
        if (this.activeVehicle) {
          this.activeVehicle.handbrake = !this.activeVehicle.handbrake;
          this.ui.showToast(`Parking Brake: ${this.activeVehicle.handbrake ? 'ON' : 'OFF'}`);
        }
      } else if (e.code === 'KeyQ' && !e.ctrlKey) {
        if (this.activeVehicle) {
          this.activeVehicle.gearboxMode = this.activeVehicle.gearboxMode === 'automatic' ? 'manual' : 'automatic';
          this.ui.showToast(`Gearbox: ${this.activeVehicle.gearboxMode.toUpperCase()}`);
        }
      } else if (e.code === 'KeyX') {
        if (this.activeVehicle && this.activeVehicle.gear < 6) {
          this.activeVehicle.gear++;
          this.ui.showToast(`Gear: ${this.activeVehicle.gear}`);
        }
      } else if (e.code === 'KeyZ') {
        if (this.activeVehicle && this.activeVehicle.gear > -1) {
          this.activeVehicle.gear--;
          this.ui.showToast(`Gear: ${this.activeVehicle.gear === -1 ? 'R' : this.activeVehicle.gear === 0 ? 'N' : this.activeVehicle.gear}`);
        }
      } else if (e.code === 'KeyN' && !e.altKey) {
        if (this.activeVehicle) {
          this.activeVehicle.headlightsOn = !this.activeVehicle.headlightsOn;
          this.ui.showToast(`Headlights: ${this.activeVehicle.headlightsOn ? 'ON' : 'OFF'}`);
        }
      } else if (e.code === 'Slash') {
        if (this.activeVehicle) {
          this.activeVehicle.hazardsOn = !this.activeVehicle.hazardsOn;
          this.ui.showToast(`Hazard Lights: ${this.activeVehicle.hazardsOn ? 'ON' : 'OFF'}`);
        }
      } else if (e.code === 'Tab') {
        e.preventDefault();
        this.switchVehicle();
      } else if (e.code === 'KeyC' && !e.shiftKey) {
        this.cycleCamera();
      } else if (e.code === 'KeyC' && e.shiftKey) {
        // Shift + C: Toggle Free Camera
        this.cameraModeIndex = this.cameraModes.indexOf('free');
        document.getElementById('top-cam-name').innerText = 'FREE CAM';
        this.ui.showToast('Free Camera Mode (WASD to fly)');
      } else if (e.code === 'F7') {
        // F7: Teleport vehicle to free camera
        if (this.activeVehicle) {
          const target = this.camera.position.clone();
          target.y = Math.max(0.6, target.y);
          for (const node of this.activeVehicle.nodes) {
            if (node.localRef) {
              node.pos.set(target.x + node.localRef.x, target.y + node.localRef.y, target.z + node.localRef.z);
              node.vel.set(0, 0, 0);
            }
          }
          this.ui.showToast('Teleported vehicle to camera position');
        }
      } else if (e.code === 'Escape') {
        this.ui.togglePauseMenu();
      }

      // Modifier Combos
      if (e.ctrlKey && e.code === 'KeyE') {
        e.preventDefault();
        this.ui.openModal(this.ui.vehicleModal);
      } else if (e.ctrlKey && e.code === 'KeyW') {
        e.preventDefault();
        this.ui.openModal(this.ui.partsModal);
      } else if (e.ctrlKey && e.code === 'KeyB') {
        e.preventDefault();
        this.toggleDebugSkeleton();
      } else if (e.ctrlKey && e.code === 'KeyQ') {
        e.preventDefault();
        if (this.activeVehicle) {
          this.activeVehicle.escEnabled = !this.activeVehicle.escEnabled;
          this.ui.showToast(`ESC / Traction Control: ${this.activeVehicle.escEnabled ? 'ENABLED' : 'DISABLED'}`);
        }
      } else if (e.altKey && e.code === 'KeyD') {
        e.preventDefault();
        if (this.activeVehicle) {
          this.activeVehicle.diffLock = !this.activeVehicle.diffLock;
          this.ui.showToast(`Differential Lock: ${this.activeVehicle.diffLock ? 'LOCKED' : 'OPEN'}`);
        }
      } else if (e.altKey && e.code === 'KeyS') {
        e.preventDefault();
        if (this.activeVehicle) {
          this.activeVehicle.transfer4WD = !this.activeVehicle.transfer4WD;
          this.ui.showToast(`Transfer Case: ${this.activeVehicle.transfer4WD ? '4WD HIGH' : '2WD'}`);
        }
      } else if (e.altKey && e.code === 'ArrowDown') {
        e.preventDefault();
        this.ui.adjustSlowMotion(-1);
      } else if (e.altKey && e.code === 'ArrowUp') {
        e.preventDefault();
        this.ui.adjustSlowMotion(1);
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;

      if (e.key === 'Control') {
        this.isCtrlDown = false;
        document.body.classList.remove('ctrl-active');
        document.getElementById('node-reticle').style.display = 'none';
        this.physics.releaseGrab();
      }
    });

    // Mouse & Node Grabber Events
    window.addEventListener('mousemove', (e) => {
      this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

      // Update reticle position
      const reticle = document.getElementById('node-reticle');
      if (this.isCtrlDown) {
        reticle.style.left = `${e.clientX}px`;
        reticle.style.top = `${e.clientY}px`;
      }

      if (this.physics.grabbedNode) {
        this.raycaster.setFromCamera(this.mouse, this.camera);
        if (this.raycaster.ray.intersectPlane(this.grabPlane, this.grabPlaneIntersect)) {
          this.physics.updateGrab(this.grabPlaneIntersect);
        }
      }

      // Free Cam / Orbit Cam Rotation
      if (this.mouse.down && !this.isCtrlDown) {
        const dx = e.movementX;
        const dy = e.movementY;
        if (this.cameraModes[this.cameraModeIndex] === 'free') {
          this.freeCam.yaw -= dx * 0.003;
          this.freeCam.pitch = Math.max(-1.4, Math.min(1.4, this.freeCam.pitch - dy * 0.003));
        } else if (this.cameraModes[this.cameraModeIndex] === 'orbit') {
          this.orbitAngles.yaw -= dx * 0.006;
          this.orbitAngles.pitch = Math.max(0.05, Math.min(1.4, this.orbitAngles.pitch + dy * 0.006));
        }
      }
    });

    window.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        this.mouse.down = true;

        // Node Grabber Trigger
        if (this.isCtrlDown && this.activeVehicle) {
          this.raycaster.setFromCamera(this.mouse, this.camera);

          // Find closest node to ray
          let closestNode = null;
          let closestDist = 0.8;

          for (const vehicle of this.physics.vehicles) {
            for (const node of vehicle.nodes) {
              const rayDist = this.raycaster.ray.distanceToPoint(node.pos);
              if (rayDist < closestDist) {
                closestDist = rayDist;
                closestNode = node;
              }
            }
          }

          if (closestNode) {
            // Setup dragging plane perpendicular to camera direction through grabbed node
            const camDir = new THREE.Vector3();
            this.camera.getWorldDirection(camDir);
            this.grabPlane.setFromNormalAndCoplanarPoint(camDir.negate(), closestNode.pos);

            this.raycaster.ray.intersectPlane(this.grabPlane, this.grabPlaneIntersect);
            this.physics.startGrab(closestNode, this.grabPlaneIntersect);
          }
        }
      }
    });

    window.addEventListener('mouseup', () => {
      this.mouse.down = false;
      this.physics.releaseGrab();
    });

    // Orbit camera zoom
    window.addEventListener('wheel', (e) => {
      if (this.cameraModes[this.cameraModeIndex] === 'orbit') {
        this.orbitAngles.dist = Math.max(3.0, Math.min(25.0, this.orbitAngles.dist + e.deltaY * 0.01));
      }
    });
  }

  initResize() {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  // --- Process Driving Inputs to Active Vehicle ---
  processDrivingInputs(dt) {
    const car = this.activeVehicle;
    if (!car) return;

    // Throttle & Brake
    const throttleKey = this.keys['KeyW'] || this.keys['ArrowUp'];
    const brakeKey = this.keys['KeyS'] || this.keys['ArrowDown'];
    const steerLeft = this.keys['KeyA'] || this.keys['ArrowLeft'];
    const steerRight = this.keys['KeyD'] || this.keys['ArrowRight'];
    const handbrakeKey = this.keys['Space'];

    // Smooth inputs
    const targetThrottle = throttleKey ? 1.0 : 0;
    const targetBrake = brakeKey ? 1.0 : 0;

    car.throttle += (targetThrottle - car.throttle) * dt * 8;
    car.brake += (targetBrake - car.brake) * dt * 10;

    let targetSteer = 0;
    if (steerLeft) targetSteer += 1.0;
    if (steerRight) targetSteer -= 1.0;
    car.steering += (targetSteer - car.steering) * dt * 7;

    // Handbrake hold
    if (handbrakeKey) car.handbrake = true;
    else if (!this.keys['KeyP']) {
      if (throttleKey) car.handbrake = false; // auto release handbrake when driving
    }

    // Horn
    car.hornActive = Boolean(this.keys['KeyH']);

    // Clutch
    car.clutch = this.keys['ShiftLeft'] ? 1.0 : 0;

    // Automatic Gear Shift Logic
    if (car.gearboxMode === 'automatic') {
      if (brakeKey && car.speedKph < 2.0 && car.gear !== -1) {
        car.gear = -1; // Reverse
      } else if (throttleKey && car.gear <= 0) {
        car.gear = 1; // Drive
      } else if (car.gear > 0) {
        if (car.rpm > car.spec.redline * 0.82 && car.gear < 6) {
          car.gear++;
        } else if (car.rpm < car.spec.idleRpm * 1.8 && car.gear > 1) {
          car.gear--;
        }
      }
    }
  }

  // --- Camera Controller ---
  updateCamera(dt) {
    const car = this.activeVehicle;
    const mode = this.cameraModes[this.cameraModeIndex];

    if (mode === 'free') {
      // WASD + QE for free camera flight
      const move = new THREE.Vector3();
      if (this.keys['KeyW']) move.z -= 1;
      if (this.keys['KeyS']) move.z += 1;
      if (this.keys['KeyA']) move.x -= 1;
      if (this.keys['KeyD']) move.x += 1;
      if (this.keys['KeyE']) move.y += 1;
      if (this.keys['KeyQ']) move.y -= 1;
      move.normalize();

      const rot = new THREE.Euler(this.freeCam.pitch, this.freeCam.yaw, 0, 'YXZ');
      move.applyEuler(rot);
      this.freeCam.pos.addScaledVector(move, this.freeCam.speed * dt);

      this.camera.position.copy(this.freeCam.pos);
      this.camera.quaternion.setFromEuler(rot);
      return;
    }

    if (!car) return;
    const com = car.getCenterOfMass();
    const forward = car.getForwardVector();
    const right = car.getRightVector();

    switch (mode) {
      case 'chase': {
        const targetPos = com.clone().addScaledVector(forward, -6.5).add(new THREE.Vector3(0, 2.4, 0));
        this.camera.position.lerp(targetPos, 0.12);
        this.camera.lookAt(com.clone().add(new THREE.Vector3(0, 0.8, 0)));
        break;
      }
      case 'cockpit': {
        // Driver eye position (Left hand drive, inside cabin)
        const eyePos = com.clone().addScaledVector(right, 0.38).addScaledVector(forward, 0.1).add(new THREE.Vector3(0, 0.65, 0));
        this.camera.position.copy(eyePos);
        const lookTarget = eyePos.clone().addScaledVector(forward, 15).add(new THREE.Vector3(0, -0.2, 0));
        this.camera.lookAt(lookTarget);
        break;
      }
      case 'hood': {
        const hoodPos = com.clone().addScaledVector(forward, car.spec.dimensions.length * 0.28).add(new THREE.Vector3(0, 0.72, 0));
        this.camera.position.copy(hoodPos);
        this.camera.lookAt(hoodPos.clone().addScaledVector(forward, 18));
        break;
      }
      case 'bumper': {
        const bumperPos = com.clone().addScaledVector(forward, car.spec.dimensions.length * 0.48).add(new THREE.Vector3(0, 0.32, 0));
        this.camera.position.copy(bumperPos);
        this.camera.lookAt(bumperPos.clone().addScaledVector(forward, 18));
        break;
      }
      case 'orbit': {
        const ox = Math.cos(this.orbitAngles.yaw) * Math.cos(this.orbitAngles.pitch) * this.orbitAngles.dist;
        const oy = Math.sin(this.orbitAngles.pitch) * this.orbitAngles.dist;
        const oz = Math.sin(this.orbitAngles.yaw) * Math.cos(this.orbitAngles.pitch) * this.orbitAngles.dist;
        this.camera.position.set(com.x + ox, com.y + oy, com.z + oz);
        this.camera.lookAt(com);
        break;
      }
      case 'cinematic': {
        // Stationary tracking flyby camera
        if (!this._cinematicStation) {
          this._cinematicStation = com.clone().add(new THREE.Vector3(14, 4, 14));
        }
        if (com.distanceTo(this._cinematicStation) > 40) {
          this._cinematicStation = com.clone().add(new THREE.Vector3(12 + Math.random() * 8, 3, 12 + Math.random() * 8));
        }
        this.camera.position.lerp(this._cinematicStation, 0.05);
        this.camera.lookAt(com);
        break;
      }
    }
  }

  // --- Master Render Loop ---
  animate() {
    requestAnimationFrame(this.animate);

    const dt = this.clock.getDelta();

    // 1. Process User Inputs
    this.processDrivingInputs(dt);

    // 2. Step Soft-Body Physics Solver
    this.physics.update(dt);

    // 3. Update Visual Meshes & Flexbody Vertex Skinning
    for (const car of this.vehicles) {
      car.updateVisuals();
    }

    // 4. Update Particle Systems
    this.particles.update(dt);

    // 5. Update Procedural Sound Engine
    const activeCar = this.activeVehicle;
    if (activeCar) {
      this.sound.update({
        rpm: activeCar.rpm,
        throttle: activeCar.throttle,
        speed: activeCar.speedKph / 3.6,
        boost: activeCar.boostPsi / 20.0,
        tireSlip: activeCar.tireSlip,
        scrapeIntensity: activeCar.speedKph > 5 ? 0.3 : 0,
        horn: activeCar.hornActive,
        ignition: !activeCar.isSeized
      });
    }

    // 6. Update Camera System
    this.updateCamera(dt);

    // 7. Render Three.js Scene
    this.renderer.render(this.scene, this.camera);

    // 8. Update FPS & HUD
    this.framesThisSecond++;
    const now = performance.now();
    if (now - this.lastFpsUpdate >= 1000) {
      this.fpsCounter = (this.framesThisSecond * 1000) / (now - this.lastFpsUpdate);
      this.framesThisSecond = 0;
      this.lastFpsUpdate = now;
    }

    this.ui.update(activeCar, this.fpsCounter);
  }
}

// Instantiate Engine on DOM load
window.addEventListener('DOMContentLoaded', () => {
  window.simEngine = new BeamNGSimulationEngine();
});
