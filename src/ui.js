import { VEHICLE_SPECS } from './vehicles.js';
import { MAP_SPECS } from './environment.js';

export class UIManager {
  constructor(engine) {
    this.engine = engine;

    // Tachometer Canvas
    this.canvas = document.getElementById('tacho-canvas');
    this.ctx = this.canvas.getContext('2d');

    // DOM Elements
    this.speedValEl = document.getElementById('speed-val');
    this.gearValEl = document.getElementById('gear-val');
    this.speedUnitEl = document.getElementById('speed-unit');

    // Aux Gauges
    this.boostFillEl = document.getElementById('boost-fill');
    this.boostReadoutEl = document.getElementById('boost-readout');
    this.tempFillEl = document.getElementById('temp-fill');
    this.tempReadoutEl = document.getElementById('temp-readout');
    this.gforceFillEl = document.getElementById('gforce-fill');
    this.gforceReadoutEl = document.getElementById('gforce-readout');

    // Powertrain Badges
    this.badgeEsc = document.getElementById('badge-esc');
    this.badgeTcs = document.getElementById('badge-tcs');
    this.badgeAbs = document.getElementById('badge-abs');
    this.badgeHandbrake = document.getElementById('badge-handbrake');
    this.badgeDiff = document.getElementById('badge-diff');
    this.badgeDriveMode = document.getElementById('badge-drive-mode');
    this.badgeLights = document.getElementById('badge-lights');
    this.badgeHazard = document.getElementById('badge-hazard');
    this.badgeHorn = document.getElementById('badge-horn');

    // Top Bar Stats
    this.topCarNameEl = document.getElementById('top-car-name');
    this.topMapNameEl = document.getElementById('top-map-name');
    this.topCamNameEl = document.getElementById('top-cam-name');
    this.slowmoTextEl = document.getElementById('slowmo-text');
    this.slowmoPillEl = document.getElementById('slowmo-pill');
    this.simStateTextEl = document.getElementById('sim-state-text');
    this.fpsValEl = document.getElementById('fps-val');
    this.substepValEl = document.getElementById('substep-val');
    this.skeletonStatusEl = document.getElementById('skeleton-status');

    // Damage App
    this.overallDmgPctEl = document.getElementById('overall-damage-pct');
    this.statEngineHealthEl = document.getElementById('stat-engine-health');
    this.statRadStatusEl = document.getElementById('stat-rad-status');
    this.statSuspHealthEl = document.getElementById('stat-susp-health');
    this.statTirePressEl = document.getElementById('stat-tire-press');
    this.statFrameStrainEl = document.getElementById('stat-frame-strain');
    this.statBrokenBeamsEl = document.getElementById('stat-broken-beams');

    // Damage SVG parts
    this.svgEngine = document.getElementById('dmg-engine');
    this.svgBumperF = document.getElementById('dmg-bumper-f');
    this.svgBumperR = document.getElementById('dmg-bumper-r');
    this.svgWheelFL = document.getElementById('dmg-wheel-fl');
    this.svgWheelFR = document.getElementById('dmg-wheel-fr');
    this.svgWheelRL = document.getElementById('dmg-wheel-rl');
    this.svgWheelRR = document.getElementById('dmg-wheel-rr');

    // Modals
    this.pauseModal = document.getElementById('pause-modal');
    this.vehicleModal = document.getElementById('vehicle-modal');
    this.partsModal = document.getElementById('parts-modal');
    this.mapModal = document.getElementById('map-modal');
    this.settingsModal = document.getElementById('settings-modal');
    this.toastEl = document.getElementById('notification-toast');
    this.controlsDrawer = document.getElementById('controls-drawer');

    this.unit = 'MPH'; // 'MPH' or 'KM/H'
    this.slowMoLevels = [1.0, 0.5, 0.25, 0.125, 0.05, 0.01];
    this.slowMoIndex = 0;

    this.initEventListeners();
    this.populateVehicleModal();
    this.populateMapModal();
  }

  initEventListeners() {
    // Top Bar clickable pills
    document.getElementById('btn-open-vehicles').onclick = () => this.openModal(this.vehicleModal);
    document.getElementById('btn-open-maps').onclick = () => this.openModal(this.mapModal);
    document.getElementById('btn-cycle-camera').onclick = () => this.engine.cycleCamera();
    document.getElementById('btn-toggle-skeleton').onclick = () => this.engine.toggleDebugSkeleton();

    // Bottom action buttons
    document.getElementById('btn-respawn').onclick = () => this.engine.resetActiveVehicle();
    document.getElementById('btn-recover').onclick = () => this.engine.recoverActiveVehicle();
    document.getElementById('btn-spawn-beside-quick').onclick = () => this.engine.spawnVehicleBeside();
    document.getElementById('btn-switch-car').onclick = () => this.engine.switchVehicle();
    document.getElementById('btn-toggle-controls').onclick = () => {
      this.controlsDrawer.style.display = this.controlsDrawer.style.display === 'none' ? 'grid' : 'none';
    };
    document.getElementById('btn-open-pause').onclick = () => this.togglePauseMenu();

    // Pause Menu items
    document.getElementById('menu-resume').onclick = () => this.closeAllModals();
    document.getElementById('menu-open-vehicles').onclick = () => { this.closeAllModals(); this.openModal(this.vehicleModal); };
    document.getElementById('menu-open-parts').onclick = () => { this.closeAllModals(); this.openModal(this.partsModal); };
    document.getElementById('menu-open-maps').onclick = () => { this.closeAllModals(); this.openModal(this.mapModal); };
    document.getElementById('menu-open-settings').onclick = () => { this.closeAllModals(); this.openModal(this.settingsModal); };
    document.getElementById('menu-reset-car').onclick = () => { this.closeAllModals(); this.engine.resetActiveVehicle(); };

    // Modal Close Buttons
    document.getElementById('close-vehicle-modal').onclick = () => this.closeModal(this.vehicleModal);
    document.getElementById('close-parts-modal').onclick = () => this.closeModal(this.partsModal);
    document.getElementById('close-map-modal').onclick = () => this.closeModal(this.mapModal);
    document.getElementById('close-settings-modal').onclick = () => this.closeModal(this.settingsModal);

    // Speed unit toggle on dial click
    this.canvas.parentElement.onclick = () => {
      this.unit = this.unit === 'MPH' ? 'KM/H' : 'MPH';
      this.speedUnitEl.innerText = this.unit;
      this.showToast(`Speedometer units: ${this.unit}`);
    };

    // Settings listeners
    document.getElementById('setting-preset').onchange = (e) => this.engine.applyPreset(e.target.value);
    document.getElementById('setting-substep').onchange = (e) => {
      this.engine.physics.substepFreq = parseInt(e.target.value);
      this.updateSubstepLabel();
    };
  }

  populateVehicleModal() {
    const container = document.getElementById('vehicle-grid-container');
    container.innerHTML = '';

    VEHICLE_SPECS.forEach(spec => {
      const card = document.createElement('div');
      card.className = 'vehicle-card';
      card.innerHTML = `
        <div class="vehicle-thumbnail">
          <div class="car-badge">${spec.badge}</div>
          <span style="font-size: 42px;">🏎️</span>
        </div>
        <div class="vehicle-card-info">
          <div class="vehicle-name">${spec.name}</div>
          <div style="font-size: 11px; color: var(--text-muted); margin-bottom: 4px;">${spec.subtitle}</div>
          <div class="vehicle-spec-row">
            <span>Layout:</span>
            <span class="vehicle-spec-val">${spec.layout} (${spec.driveType})</span>
          </div>
          <div class="vehicle-spec-row">
            <span>Power:</span>
            <span class="vehicle-spec-val">${spec.hp} hp / ${spec.torque} lb-ft</span>
          </div>
          <div class="vehicle-spec-row">
            <span>Weight:</span>
            <span class="vehicle-spec-val">${spec.weightKg} kg</span>
          </div>
          <div class="vehicle-actions-row">
            <button class="card-btn primary btn-select-car">Replace Car</button>
            <button class="card-btn secondary btn-spawn-beside">+Beside (Crash)</button>
          </div>
        </div>
      `;

      card.querySelector('.btn-select-car').onclick = (e) => {
        e.stopPropagation();
        this.engine.replaceActiveVehicle(spec.id);
        this.closeAllModals();
        this.showToast(`Switched to ${spec.name}`);
      };

      card.querySelector('.btn-spawn-beside').onclick = (e) => {
        e.stopPropagation();
        this.engine.spawnVehicleBeside(spec.id);
        this.closeAllModals();
        this.showToast(`Spawned ${spec.name} beside for crash testing`);
      };

      container.appendChild(card);
    });
  }

  populateMapModal() {
    const container = document.getElementById('env-grid-container');
    container.innerHTML = '';

    MAP_SPECS.forEach(map => {
      const card = document.createElement('div');
      card.className = 'env-card';
      card.innerHTML = `
        <div class="env-thumb">${map.icon}</div>
        <div class="env-info">
          <div class="env-name">${map.name}</div>
          <div class="env-desc">${map.description}</div>
        </div>
      `;
      card.onclick = () => {
        this.engine.loadMap(map.id);
        this.closeAllModals();
        this.showToast(`Loaded map: ${map.name}`);
      };
      container.appendChild(card);
    });
  }

  // Modals Management
  openModal(modal) {
    this.closeAllModals();
    modal.classList.add('active');
    this.engine.physics.isPaused = true;
  }

  closeModal(modal) {
    modal.classList.remove('active');
    if (!this.hasActiveModal()) {
      this.engine.physics.isPaused = false;
    }
  }

  closeAllModals() {
    [this.pauseModal, this.vehicleModal, this.partsModal, this.mapModal, this.settingsModal].forEach(m => m.classList.remove('active'));
    this.engine.physics.isPaused = false;
  }

  hasActiveModal() {
    return document.querySelector('.modal-backdrop.active') !== null;
  }

  togglePauseMenu() {
    if (this.pauseModal.classList.contains('active')) {
      this.closeModal(this.pauseModal);
    } else {
      this.openModal(this.pauseModal);
    }
  }

  // Slow Motion Controls (Alt + Up / Alt + Down)
  adjustSlowMotion(direction) {
    if (direction > 0) {
      this.slowMoIndex = Math.max(0, this.slowMoIndex - 1);
    } else {
      this.slowMoIndex = Math.min(this.slowMoLevels.length - 1, this.slowMoIndex + 1);
    }
    const factor = this.slowMoLevels[this.slowMoIndex];
    this.engine.physics.timeScale = factor;

    if (factor < 1.0) {
      this.slowmoPillEl.classList.add('slowmo-active');
      this.slowmoTextEl.innerText = `${(1.0 / factor).toFixed(0)}x Slow-Mo (${factor.toFixed(2)}x)`;
      this.showToast(`Slow Motion: ${(1.0 / factor).toFixed(0)}x`, 'warning');
    } else {
      this.slowmoPillEl.classList.remove('slowmo-active');
      this.slowmoTextEl.innerText = '1.0x Realtime';
      this.showToast('Realtime Physics (1.0x)');
    }
  }

  showToast(message, type = 'info') {
    this.toastEl.innerText = message;
    this.toastEl.className = 'notification-toast show';
    if (type === 'warning') this.toastEl.classList.add('warning');
    if (type === 'danger') this.toastEl.classList.add('danger');

    clearTimeout(this._toastTimeout);
    this._toastTimeout = setTimeout(() => {
      this.toastEl.classList.remove('show');
    }, 2400);
  }

  updateSubstepLabel() {
    const hz = this.engine.physics.substepFreq;
    const steps = Math.round(hz / 60);
    this.substepValEl.innerText = `${hz} Hz (${steps} steps)`;
  }

  // --- Main Update Loop (Called Every Animation Frame) ---
  update(car, fps) {
    if (!car) return;

    // 1. Digital Speed & Gear
    const speed = this.unit === 'MPH' ? Math.round(car.speedMph) : Math.round(car.speedKph);
    this.speedValEl.innerText = speed;

    let gearStr = 'N';
    if (car.gear === -1) gearStr = 'R';
    else if (car.gear === 0) gearStr = 'N';
    else if (car.handbrake && speed === 0) gearStr = 'P';
    else gearStr = car.gear.toString();
    this.gearValEl.innerText = gearStr;

    // 2. Draw Analog Tachometer Dial
    this.drawTachometer(car.rpm, car.spec.redline);

    // 3. Aux Gauges
    this.boostFillEl.style.width = `${Math.min(100, (car.boostPsi / 20) * 100)}%`;
    this.boostReadoutEl.innerText = `${car.boostPsi.toFixed(1)} PSI`;

    const tempPct = Math.min(100, Math.max(0, ((car.engineTemp - 50) / 90) * 100));
    this.tempFillEl.style.width = `${tempPct}%`;
    this.tempReadoutEl.innerText = `${Math.round(car.engineTemp)}°C`;
    if (car.engineTemp > 115) {
      this.tempFillEl.className = 'gauge-bar-fill critical';
    } else {
      this.tempFillEl.className = 'gauge-bar-fill';
    }

    this.gforceFillEl.style.width = `${Math.min(100, (car.gForce / 3.0) * 100)}%`;
    this.gforceReadoutEl.innerText = `${car.gForce.toFixed(2)} G`;

    // 4. Powertrain Badges
    this.badgeHandbrake.className = car.handbrake ? 'badge-item active' : 'badge-item';
    this.badgeLights.className = car.headlightsOn ? 'badge-item active-cyan' : 'badge-item';
    this.badgeHazard.className = car.hazardsOn ? 'badge-item active-red' : 'badge-item';
    this.badgeHorn.className = car.hornActive ? 'badge-item active' : 'badge-item';
    this.badgeDiff.className = car.diffLock ? 'badge-item active-cyan' : 'badge-item';
    this.badgeDriveMode.innerText = car.transfer4WD ? '4WD' : car.spec.driveType;

    // 5. Update Damage Schematic App
    this.updateDamageSchematic(car);

    // 6. Top Bar Data
    this.fpsValEl.innerText = Math.round(fps);
    this.topCarNameEl.innerText = car.spec.name;
    this.skeletonStatusEl.innerText = car.skeletonLines && car.skeletonLines.visible ? 'ON' : 'OFF';
  }

  drawTachometer(rpm, redline = 8000) {
    const ctx = this.ctx;
    const w = 230;
    const h = 230;
    const cx = w * 0.5;
    const cy = h * 0.5;
    const radius = 95;

    ctx.clearRect(0, 0, w, h);

    const startAngle = Math.PI * 0.75; // 135 deg
    const endAngle = Math.PI * 2.25;   // 405 deg
    const totalAngle = endAngle - startAngle;

    // Background track
    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, endAngle, false);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 10;
    ctx.stroke();

    // Redline arc (last 25% of RPM)
    const redlineStart = startAngle + totalAngle * 0.78;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, redlineStart, endAngle, false);
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
    ctx.lineWidth = 10;
    ctx.stroke();

    // Active RPM Arc
    const rpmFrac = Math.min(1.0, Math.max(0, rpm / redline));
    const activeAngle = startAngle + totalAngle * rpmFrac;

    const grad = ctx.createLinearGradient(0, h, w, 0);
    grad.addColorStop(0, '#38bdf8');
    grad.addColorStop(0.7, '#f59e0b');
    grad.addColorStop(1, '#ef4444');

    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, activeAngle, false);
    ctx.strokeStyle = grad;
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Tick Marks & Numbers (0 to max)
    const maxDigits = Math.round(redline / 1000);
    for (let i = 0; i <= maxDigits; i++) {
      const angle = startAngle + (totalAngle * (i / maxDigits));
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);

      const x1 = cx + cosA * (radius - 12);
      const y1 = cy + sinA * (radius - 12);
      const x2 = cx + cosA * (radius - 20);
      const y2 = cy + sinA * (radius - 20);

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = i >= maxDigits * 0.78 ? '#ef4444' : 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  updateDamageSchematic(car) {
    let brokenCount = 0;
    let maxStrain = 0;
    for (const b of car.beams) {
      if (b.isBroken) brokenCount++;
      if (b.strain > maxStrain) maxStrain = b.strain;
    }

    const engHealth = car.engineHealth;
    const radHealth = car.radiatorHealth;

    // Component Readouts
    this.statEngineHealthEl.innerText = `${Math.round(engHealth * 100)}%`;
    this.statEngineHealthEl.className = engHealth < 0.3 ? 'stat-val critical' : engHealth < 0.7 ? 'stat-val warning' : 'stat-val';

    this.statRadStatusEl.innerText = car.radiatorLeaking ? 'LEAKING' : 'OK';
    this.statRadStatusEl.className = car.radiatorLeaking ? 'stat-val critical' : 'stat-val';

    this.statBrokenBeamsEl.innerText = brokenCount.toString();
    this.statFrameStrainEl.innerText = `${(maxStrain * 100).toFixed(1)}%`;

    const overall = Math.max(0, Math.round((engHealth * 0.4 + radHealth * 0.2 + (1.0 - Math.min(1.0, brokenCount / 20)) * 0.4) * 100));
    this.overallDmgPctEl.innerText = `${overall}%`;

    // SVG Color Mapping (Green -> Yellow -> Red)
    const getColor = (val) => {
      if (val > 0.8) return '#22c55e';
      if (val > 0.4) return '#f59e0b';
      return '#ef4444';
    };

    this.svgEngine.setAttribute('fill', getColor(engHealth));
    this.svgBumperF.setAttribute('fill', car.radiatorLeaking ? '#ef4444' : '#22c55e');
  }
}
