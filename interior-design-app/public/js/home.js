/* global THREE */
'use strict';

const TOKEN_KEY = 'ds_token';
const USER_KEY  = 'ds_user';

// ─── Planner material handles (shared across functions) ───────────────────────
const PM = {};   // plannerMaterials keyed by name

// ─── Theme presets ────────────────────────────────────────────────────────────
const THEMES = {
  modern:       { wall: 0xf5f5f5, floor: 0x4a4a4a, sofa: 0x222222, table: 0x888888, lampHex: 0xffffff },
  cozy:         { wall: 0xd4a07a, floor: 0x4a3728, sofa: 0x8b3a3a, table: 0x3d2b1a, lampHex: 0xffcc80 },
  scandinavian: { wall: 0xfafafa, floor: 0xd4b896, sofa: 0x90a4ae, table: 0xe8d5b0, lampHex: 0xfff8f0 },
  industrial:   { wall: 0x424242, floor: 0x1a1a1a, sofa: 0x616161, table: 0x9e9e9e, lampHex: 0xffd080 },
};

// ─── Redirect to login ────────────────────────────────────────────────────────
function redirectLogin() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  window.location.href = '/';
}

// ─── Auth check + boot ────────────────────────────────────────────────────────
async function main() {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) { redirectLogin(); return; }

  let user;
  try {
    const res = await fetch('/api/verify', {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!res.ok) { redirectLogin(); return; }
    ({ user } = await res.json());
  } catch {
    redirectLogin();
    return;
  }

  // Update greeting
  const greetEl = document.getElementById('user-greeting');
  if (greetEl) greetEl.textContent = `Welcome, ${user.username} ✦`;

  // Logout
  document.getElementById('logout-btn').addEventListener('click', redirectLogin);

  // Scroll-aware navbar tint
  initNavScroll();

  // Three.js scenes
  initHeroScene();
  initPlannerScene();

  // Interactive controls
  initInteractions();
}

// ─── Navbar scroll tint ───────────────────────────────────────────────────────
function initNavScroll() {
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    navbar.style.background = window.scrollY > 60
      ? 'rgba(13,13,26,0.97)'
      : 'rgba(13,13,26,0.88)';
  }, { passive: true });
}

// ─── Hero Three.js scene ──────────────────────────────────────────────────────
function initHeroScene() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const scene    = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0a18);
  scene.fog = new THREE.Fog(0x0a0a18, 16, 46);

  const camera = new THREE.PerspectiveCamera(56, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
  camera.position.set(0, 4, 10);
  camera.lookAt(0, 1.2, 0);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  setSize(renderer, canvas);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  // Materials – brighter, day-lit palette
  const mat = {
    floor:   new THREE.MeshStandardMaterial({ color: 0xc8b090, roughness: 0.78 }),
    wall:    new THREE.MeshStandardMaterial({ color: 0xf0ece4, roughness: 0.9 }),
    sofa:    new THREE.MeshStandardMaterial({ color: 0x7b9ea6, roughness: 0.8 }),
    cushion: new THREE.MeshStandardMaterial({ color: 0xd4e0e4, roughness: 0.75 }),
    table:   new THREE.MeshStandardMaterial({ color: 0x8a6040, roughness: 0.5, metalness: 0.1 }),
    lamp:    new THREE.MeshStandardMaterial({ color: 0xd4b080, roughness: 0.35, metalness: 0.5 }),
    bulb:    new THREE.MeshStandardMaterial({ color: 0xffffc0, emissive: 0xffee88, emissiveIntensity: 3 }),
    rug:     new THREE.MeshStandardMaterial({ color: 0x4a8a6a, roughness: 1.0 }),
    plant:   new THREE.MeshStandardMaterial({ color: 0x2e8b3a, roughness: 0.9 }),
    pot:     new THREE.MeshStandardMaterial({ color: 0x9a5a3a, roughness: 0.85 }),
  };

  buildRoom(scene, mat, { roomW: 18, roomD: 18 });
  const lampLight = buildFurniture(scene, mat, { x: 0, z: 0 });

  // Lighting
  scene.add(new THREE.AmbientLight(0xfff4e8, 0.75));
  const sun = new THREE.DirectionalLight(0xfff8f0, 1.2);
  sun.position.set(8, 10, 4);
  sun.castShadow = true;
  scene.add(sun);
  scene.add(new THREE.PointLight(0xfff0d8, 0.9, 16)).position.set(0, 6, 0);

  // Particles
  const particles = makeParticles(scene, 500, 0xffd580, 0.028, 14);

  let angle = 0;
  (function tick() {
    requestAnimationFrame(tick);
    angle += 0.0022;
    camera.position.x = Math.sin(angle) * 8;
    camera.position.z = Math.cos(angle) * 8 + 2;
    camera.position.y = 3.8 + Math.sin(angle * 0.45) * 0.35;
    camera.lookAt(0, 1.2, 0);
    driftParticles(particles, 500, 7, 0.004);
    if (lampLight) lampLight.intensity = 2.0 + Math.sin(Date.now() * 0.0018) * 0.2;
    renderer.render(scene, camera);
  }());

  window.addEventListener('resize', () => {
    setSize(renderer, canvas);
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
  }, { passive: true });
}

// ─── Planner Three.js scene ───────────────────────────────────────────────────
function initPlannerScene() {
  const canvas = document.getElementById('planner-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const scene    = new THREE.Scene();
  scene.background = new THREE.Color(0x08080f);

  // Fixed camera (nice isometric-ish angle)
  const camera = new THREE.PerspectiveCamera(48, 16 / 9, 0.1, 100);
  camera.position.set(5.5, 4.5, 6.5);
  camera.lookAt(0, 0.8, -0.5);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.92;

  // Planner-specific shared materials
  PM.wall  = new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.92 });
  PM.floor = new THREE.MeshStandardMaterial({ color: 0x4a4a4a, roughness: 0.75, metalness: 0.05 });
  PM.sofa  = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.85 });
  PM.table = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.5 });
  PM.lamp  = new THREE.MeshStandardMaterial({ color: 0xb89060, roughness: 0.35, metalness: 0.5 });
  PM.bulb  = new THREE.MeshStandardMaterial({ color: 0xffffc0, emissive: 0xffee88, emissiveIntensity: 3 });
  PM.rug   = new THREE.MeshStandardMaterial({ color: 0x7b5c8b, roughness: 1.0 });
  PM.cushion = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.8 });

  // Room shell
  addFlat(scene, new THREE.PlaneGeometry(12, 10), PM.floor, { rx: -Math.PI / 2 });
  addFlat(scene, new THREE.PlaneGeometry(12, 7),  PM.wall,  { py: 3.5, pz: -5 });
  addFlat(scene, new THREE.PlaneGeometry(10, 7),  PM.wall,  { px: -6,  py: 3.5, ry: Math.PI / 2 });

  // Rug
  const rug = new THREE.Mesh(new THREE.PlaneGeometry(3.8, 2.8), PM.rug);
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(0, 0.005, -0.3);
  scene.add(rug);

  // Sofa
  const sofaGrp = new THREE.Group();
  sofaGrp.position.set(0, 0, -2);
  buildSofa(sofaGrp, PM.sofa, PM.cushion);
  scene.add(sofaGrp);

  // Coffee table
  buildCoffeeTable(scene, PM.table, { x: 0, z: 0.6 });

  // Floor lamp
  const lampGrp = new THREE.Group();
  lampGrp.position.set(-2.5, 0, -2.5);
  buildLamp(lampGrp, PM.lamp, PM.bulb);
  scene.add(lampGrp);

  // Lamp light
  PM.lampLight = new THREE.PointLight(0xffd580, 1.8, 6);
  PM.lampLight.position.set(-2.5, 1.75, -2.5);
  PM.lampLight.castShadow = true;
  scene.add(PM.lampLight);

  // Lighting
  scene.add(new THREE.AmbientLight(0x2a2a4a, 0.45));
  const ceil = new THREE.PointLight(0xfff0e0, 1.6, 18);
  ceil.position.set(0, 6, 0);
  ceil.castShadow = true;
  scene.add(ceil);
  const fill = new THREE.DirectionalLight(0x8ab4f8, 0.4);
  fill.position.set(5, 5, 5);
  scene.add(fill);

  // Resize to canvas element size
  const resizePlanner = () => {
    const w = canvas.clientWidth  || 800;
    const h = canvas.clientHeight || 450;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  resizePlanner();

  const ro = new ResizeObserver(resizePlanner);
  ro.observe(canvas.parentElement);

  (function tick() {
    requestAnimationFrame(tick);
    PM.lampLight.intensity = 1.6 + Math.sin(Date.now() * 0.0016) * 0.22;
    renderer.render(scene, camera);
  }());
}

// ─── Interactions ─────────────────────────────────────────────────────────────
function initInteractions() {
  // Category cards
  document.querySelectorAll('.category-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.category-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
    });
  });

  // Style cards
  document.querySelectorAll('.style-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.style-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
    });
  });

  // Theme buttons
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      applyTheme(btn.dataset.theme);
    });
  });

  // Wall colour swatches
  document.querySelectorAll('.wall-swatch').forEach(sw => {
    sw.addEventListener('click', () => {
      document.querySelectorAll('.wall-swatch').forEach(s => s.classList.remove('selected'));
      sw.classList.add('selected');
      if (PM.wall) PM.wall.color.setStyle(sw.dataset.color);
    });
  });

  // Floor style buttons
  const floorColors = { wood: 0x4a3728, marble: 0xe8e8e8, carpet: 0x6b5757, concrete: 0x888888 };
  document.querySelectorAll('.floor-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.floor-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      if (PM.floor) PM.floor.color.setHex(floorColors[btn.dataset.floor] ?? 0x888888);
    });
  });

  // Save design (demo feedback)
  const saveBtn = document.getElementById('save-design-btn');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      saveBtn.textContent = '✓ Design Saved!';
      saveBtn.classList.add('saved');
      setTimeout(() => {
        saveBtn.textContent = '💾 Save Design';
        saveBtn.classList.remove('saved');
      }, 2200);
    });
  }
}

// ─── Apply planner theme ──────────────────────────────────────────────────────
function applyTheme(name) {
  const t = THEMES[name];
  if (!t) return;
  if (PM.wall)  PM.wall.color.setHex(t.wall);
  if (PM.floor) PM.floor.color.setHex(t.floor);
  if (PM.sofa)  PM.sofa.color.setHex(t.sofa);
  if (PM.table) PM.table.color.setHex(t.table);
  if (PM.lampLight) PM.lampLight.color.setHex(t.lampHex);
  // Also reset swatch / floor button UI to match theme
  document.querySelectorAll('.wall-swatch').forEach(s => s.classList.remove('selected'));
  document.querySelectorAll('.floor-btn').forEach(b => b.classList.remove('active'));
  const firstFloor = document.querySelector('.floor-btn');
  if (firstFloor) firstFloor.classList.add('active');
}

// ─── Shared scene builders ────────────────────────────────────────────────────
function buildRoom(scene, mat, { roomW = 18, roomD = 18 } = {}) {
  addFlat(scene, new THREE.PlaneGeometry(roomW, roomD), mat.floor, { rx: -Math.PI / 2 });
  addFlat(scene, new THREE.PlaneGeometry(roomW, 10),   mat.wall,  { py: 5, pz: -(roomD / 2) });
  addFlat(scene, new THREE.PlaneGeometry(roomD, 10),   mat.wall,  { px: -(roomW / 2), py: 5, ry: Math.PI / 2 });
  // Rug
  const rug = new THREE.Mesh(new THREE.PlaneGeometry(5, 3.5), mat.rug);
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(0, 0.01, 0);
  scene.add(rug);
}

function buildFurniture(scene, mat, { x = 0, z = 0 } = {}) {
  // Sofa group
  const sg = new THREE.Group();
  sg.position.set(x, 0, z - 2.2);
  buildSofa(sg, mat.sofa, mat.cushion);
  scene.add(sg);

  // Coffee table
  buildCoffeeTable(scene, mat.table, { x, z: z + 0.4 });

  // Lamp
  const lg = new THREE.Group();
  lg.position.set(x - 2.8, 0, z - 3.2);
  buildLamp(lg, mat.lamp, mat.bulb);
  scene.add(lg);

  // Plant
  const pg = new THREE.Group();
  pg.position.set(x + 3.6, 0, z + 0.8);
  buildPlant(pg, mat.plant, mat.pot);
  scene.add(pg);

  // Lamp light
  const ll = new THREE.PointLight(0xffd580, 2.2, 7);
  ll.position.set(x - 2.8, 1.85, z - 3.2);
  ll.castShadow = true;
  scene.add(ll);
  return ll;
}

function buildSofa(group, sofaMat, cushionMat) {
  // Seat
  addBox(group, [3.2, 0.55, 1.3], sofaMat,   { py: 0.275 });
  // Back rest
  addBox(group, [3.2, 0.65, 0.25], sofaMat,  { py: 0.875, pz: -0.525 });
  // Arms
  addBox(group, [0.28, 0.45, 1.3], sofaMat,  { px: -1.56, py: 0.5 });
  addBox(group, [0.28, 0.45, 1.3], sofaMat,  { px:  1.56, py: 0.5 });
  // Legs
  [[-1.4, -0.5], [-1.4, 0.5], [1.4, -0.5], [1.4, 0.5]].forEach(([lx, lz]) => {
    addBox(group, [0.1, 0.12, 0.1], sofaMat, { px: lx, py: 0, pz: lz });
  });
  // Cushions
  [-0.95, 0, 0.95].forEach(cx => {
    addBox(group, [0.9, 0.18, 0.58], cushionMat, { px: cx, py: 0.64, pz: -0.1 });
  });
}

function buildCoffeeTable(scene, mat, { x = 0, z = 0 } = {}) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  // Top
  addBox(g, [1.7, 0.07, 0.95], mat, { py: 0.43 });
  // Legs
  [[-0.72, -0.4], [-0.72, 0.4], [0.72, -0.4], [0.72, 0.4]].forEach(([lx, lz]) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.42, 8), mat);
    leg.position.set(lx, 0.21, lz);
    leg.castShadow = true;
    g.add(leg);
  });
  scene.add(g);
}

function buildLamp(group, lampMat, bulbMat) {
  addCyl(group, [0.16, 0.2,  0.09, 14], lampMat, { py: 0.045 });   // base
  addCyl(group, [0.04, 0.04, 1.75, 8],  lampMat, { py: 0.92 });    // pole
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.38, 16, 1, true), lampMat);
  shade.rotation.x = Math.PI;
  shade.position.set(0, 1.96, 0);
  shade.castShadow = true;
  group.add(shade);
  addSphere(group, [0.07, 12, 12], bulbMat, { py: 1.82 });          // bulb
}

function buildPlant(group, leafMat, potMat) {
  addCyl(group, [0.18, 0.14, 0.3,  12], potMat,  { py: 0.15 });
  addCyl(group, [0.03, 0.03, 0.22, 8],  leafMat, { py: 0.42 });
  const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.38, 14, 14), leafMat);
  sphere.scale.y = 1.28;
  sphere.position.set(0, 0.76, 0);
  sphere.castShadow = true;
  group.add(sphere);
}

// ─── Particle helpers ──────────────────────────────────────────────────────────
function makeParticles(scene, count, color, size, spread) {
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    pos[i * 3]     = (Math.random() - 0.5) * spread;
    pos[i * 3 + 1] = Math.random() * 7;
    pos[i * 3 + 2] = (Math.random() - 0.5) * spread;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color, size, transparent: true, opacity: 0.5 }));
  scene.add(pts);
  return pts;
}

function driftParticles(pts, count, maxY, speed) {
  const pos = pts.geometry.attributes.position.array;
  for (let i = 0; i < count; i++) {
    pos[i * 3 + 1] += speed;
    if (pos[i * 3 + 1] > maxY) pos[i * 3 + 1] = 0;
  }
  pts.geometry.attributes.position.needsUpdate = true;
}

// ─── Geometry helpers ──────────────────────────────────────────────────────────
function addFlat(scene, geo, mat, { rx = 0, ry = 0, py = 0, pz = 0, px = 0 } = {}) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(px, py, pz);
  m.rotation.set(rx, ry, 0);
  m.receiveShadow = true;
  scene.add(m);
  return m;
}

function addBox(parent, [w, h, d], mat, { px = 0, py = 0, pz = 0 } = {}) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(px, py, pz);
  m.castShadow = m.receiveShadow = true;
  parent.add(m);
  return m;
}

function addCyl(parent, [rt, rb, h, seg], mat, { px = 0, py = 0, pz = 0 } = {}) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
  m.position.set(px, py, pz);
  m.castShadow = m.receiveShadow = true;
  parent.add(m);
  return m;
}

function addSphere(parent, [r, ws, hs], mat, { px = 0, py = 0, pz = 0 } = {}) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, ws, hs), mat);
  m.position.set(px, py, pz);
  m.castShadow = true;
  parent.add(m);
  return m;
}

function setSize(renderer, canvas) {
  renderer.setSize(canvas.clientWidth || window.innerWidth,
                   canvas.clientHeight || window.innerHeight, false);
}

// ─── Boot ─────────────────────────────────────────────────────────────────────
main();
