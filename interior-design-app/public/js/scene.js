/* global THREE */
'use strict';

(function initScene() {
  const canvas = document.getElementById('bg-canvas');

  // ─── Core ────────────────────────────────────────────────────────────────
  const scene    = new THREE.Scene();
  scene.background = new THREE.Color(0x080818);
  scene.fog = new THREE.Fog(0x080818, 14, 45);

  const camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 3.5, 9);
  camera.lookAt(0, 1, 0);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.85;

  // ─── Materials ───────────────────────────────────────────────────────────
  const M = {
    floor:   new THREE.MeshStandardMaterial({ color: 0x3a2a1e, roughness: 0.85, metalness: 0.05 }),
    wall:    new THREE.MeshStandardMaterial({ color: 0x1e1e30, roughness: 0.92 }),
    sofa:    new THREE.MeshStandardMaterial({ color: 0x4a2e22, roughness: 0.85 }),
    cushion: new THREE.MeshStandardMaterial({ color: 0x7a5a3a, roughness: 0.8 }),
    table:   new THREE.MeshStandardMaterial({ color: 0x2e1e10, roughness: 0.45, metalness: 0.1 }),
    lamp:    new THREE.MeshStandardMaterial({ color: 0xb89060, roughness: 0.35, metalness: 0.5 }),
    bulb:    new THREE.MeshStandardMaterial({ color: 0xffffc0, emissive: 0xffee88, emissiveIntensity: 3 }),
    shelf:   new THREE.MeshStandardMaterial({ color: 0x2e1e10, roughness: 0.7 }),
    leaf:    new THREE.MeshStandardMaterial({ color: 0x1e7a2a, roughness: 0.9 }),
    pot:     new THREE.MeshStandardMaterial({ color: 0x7a4422, roughness: 0.85 }),
    rug:     new THREE.MeshStandardMaterial({ color: 0x7a2a2a, roughness: 1.0 }),
    frame:   new THREE.MeshStandardMaterial({ color: 0x8a6c22, roughness: 0.5, metalness: 0.3 }),
    art:     new THREE.MeshStandardMaterial({ color: 0x1a3a5c, roughness: 0.6 }),
  };

  // ─── Room shell ──────────────────────────────────────────────────────────
  // Floor
  addMesh(new THREE.PlaneGeometry(18, 18), M.floor,
    { rx: -Math.PI / 2, shadow: 'receive' });

  // Back wall
  addMesh(new THREE.PlaneGeometry(18, 10), M.wall,
    { py: 5, pz: -9, shadow: 'receive' });

  // Left wall
  addMesh(new THREE.PlaneGeometry(18, 10), M.wall,
    { px: -9, py: 5, ry: Math.PI / 2, shadow: 'receive' });

  // Rug
  addMesh(new THREE.PlaneGeometry(4.5, 3.2), M.rug,
    { rx: -Math.PI / 2, py: 0.01 });

  // ─── Sofa ────────────────────────────────────────────────────────────────
  const sofaGroup = new THREE.Group();
  sofaGroup.position.set(0, 0, -2.2);
  scene.add(sofaGroup);

  // Seat
  addToGroup(sofaGroup, new THREE.BoxGeometry(3.2, 0.55, 1.3), M.sofa, { py: 0.275 });
  // Back
  addToGroup(sofaGroup, new THREE.BoxGeometry(3.2, 0.65, 0.25), M.sofa, { py: 0.875, pz: -0.525 });
  // Arms
  addToGroup(sofaGroup, new THREE.BoxGeometry(0.28, 0.45, 1.3), M.sofa, { px: -1.56, py: 0.5 });
  addToGroup(sofaGroup, new THREE.BoxGeometry(0.28, 0.45, 1.3), M.sofa, { px:  1.56, py: 0.5 });
  // Cushions
  [-0.95, 0, 0.95].forEach(cx => {
    addToGroup(sofaGroup, new THREE.BoxGeometry(0.9, 0.18, 0.55), M.cushion, { px: cx, py: 0.64, pz: -0.12 });
  });

  // ─── Coffee Table ─────────────────────────────────────────────────────────
  const tableGroup = new THREE.Group();
  tableGroup.position.set(0, 0, 0.5);
  scene.add(tableGroup);
  addToGroup(tableGroup, new THREE.BoxGeometry(1.7, 0.07, 0.9), M.table, { py: 0.42 });
  [[-0.72, -0.38], [-0.72, 0.38], [0.72, -0.38], [0.72, 0.38]].forEach(([x, z]) => {
    addToGroup(tableGroup, new THREE.CylinderGeometry(0.035, 0.035, 0.41, 8), M.table,
      { px: x, py: 0.205, pz: z });
  });

  // ─── Floor Lamp ───────────────────────────────────────────────────────────
  const lampGroup = new THREE.Group();
  lampGroup.position.set(-2.8, 0, -3.0);
  scene.add(lampGroup);
  addToGroup(lampGroup, new THREE.CylinderGeometry(0.16, 0.2, 0.09, 14), M.lamp, { py: 0.045 });
  addToGroup(lampGroup, new THREE.CylinderGeometry(0.04, 0.04, 1.75, 8), M.lamp, { py: 0.92 });
  addToGroup(lampGroup, new THREE.ConeGeometry(0.28, 0.38, 16, 1, true), M.lamp,
    { py: 1.95, rx: Math.PI });
  addToGroup(lampGroup, new THREE.SphereGeometry(0.07, 12, 12), M.bulb, { py: 1.82 });

  // Lamp point light (warm glow)
  const lampLight = new THREE.PointLight(0xffd580, 2.2, 7);
  lampLight.position.set(-2.8, 1.85, -3.0);
  lampLight.castShadow = true;
  scene.add(lampLight);

  // ─── Bookshelf ────────────────────────────────────────────────────────────
  const shelfGroup = new THREE.Group();
  shelfGroup.position.set(3.4, 0, -3.5);
  scene.add(shelfGroup);
  addToGroup(shelfGroup, new THREE.BoxGeometry(0.85, 2.7, 0.38), M.shelf, { py: 1.35 });
  // Books
  const bookColors = [0xc0392b, 0x2980b9, 0x27ae60, 0x8e44ad, 0xe67e22, 0x16a085, 0xf39c12, 0x2c3e50];
  let bi = 0;
  [0.35, 1.2, 2.05].forEach(by => {
    let bx = -0.3;
    while (bx < 0.35) {
      const w = 0.07 + Math.random() * 0.05;
      const bmat = new THREE.MeshStandardMaterial({ color: bookColors[bi++ % 8], roughness: 0.8 });
      const book = new THREE.Mesh(new THREE.BoxGeometry(w, 0.28 + Math.random() * 0.06, 0.3), bmat);
      book.position.set(bx + w / 2, by, 0);
      book.castShadow = true;
      shelfGroup.add(book);
      bx += w + 0.005;
    }
  });

  // ─── Plant ────────────────────────────────────────────────────────────────
  const plantGroup = new THREE.Group();
  plantGroup.position.set(3.8, 0, 0.6);
  scene.add(plantGroup);
  addToGroup(plantGroup, new THREE.CylinderGeometry(0.18, 0.14, 0.3, 12), M.pot, { py: 0.15 });
  addToGroup(plantGroup, new THREE.CylinderGeometry(0.03, 0.03, 0.22, 8), M.leaf, { py: 0.41 });
  addToGroup(plantGroup, new THREE.SphereGeometry(0.38, 14, 14), M.leaf,
    { px: 0, py: 0.75, pz: 0, sy: 1.25 });

  // ─── Wall art (picture frame) ─────────────────────────────────────────────
  const frameGroup = new THREE.Group();
  frameGroup.position.set(-3.2, 2.4, -8.95);
  scene.add(frameGroup);
  addToGroup(frameGroup, new THREE.BoxGeometry(1.8, 1.1, 0.06), M.frame);
  addToGroup(frameGroup, new THREE.PlaneGeometry(1.55, 0.88), M.art, { pz: 0.035 });

  // Second small frame
  const frame2 = new THREE.Group();
  frame2.position.set(1.4, 2.8, -8.95);
  scene.add(frame2);
  addToGroup(frame2, new THREE.BoxGeometry(0.9, 1.1, 0.06), M.frame);
  addToGroup(frame2, new THREE.PlaneGeometry(0.7, 0.9), M.art, { pz: 0.035 });

  // ─── Lighting ─────────────────────────────────────────────────────────────
  scene.add(new THREE.AmbientLight(0x2a2a4a, 0.45));

  // Ceiling light
  const ceilLight = new THREE.PointLight(0xfff0e0, 1.4, 18);
  ceilLight.position.set(0, 6, 0);
  ceilLight.castShadow = true;
  scene.add(ceilLight);

  // Cool window light
  const winLight = new THREE.DirectionalLight(0x8ab4f8, 0.4);
  winLight.position.set(6, 5, -4);
  scene.add(winLight);

  // ─── Floating particles ───────────────────────────────────────────────────
  const PARTICLE_COUNT = 600;
  const pPositions = new Float32Array(PARTICLE_COUNT * 3);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    pPositions[i * 3]     = (Math.random() - 0.5) * 16;
    pPositions[i * 3 + 1] = Math.random() * 7;
    pPositions[i * 3 + 2] = (Math.random() - 0.5) * 16;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
  const particles = new THREE.Points(pGeo,
    new THREE.PointsMaterial({ color: 0xffd580, size: 0.025, transparent: true, opacity: 0.55 }));
  scene.add(particles);

  // ─── Animation ───────────────────────────────────────────────────────────
  let angle = 0;

  function animate() {
    requestAnimationFrame(animate);

    angle += 0.0025;
    camera.position.x = Math.sin(angle) * 7.5;
    camera.position.z = Math.cos(angle) * 7.5 + 1.5;
    camera.position.y = 3.2 + Math.sin(angle * 0.4) * 0.4;
    camera.lookAt(0, 1, -0.5);

    // Drift particles upward
    const pos = particles.geometry.attributes.position.array;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      pos[i * 3 + 1] += 0.004;
      if (pos[i * 3 + 1] > 7) pos[i * 3 + 1] = 0;
    }
    particles.geometry.attributes.position.needsUpdate = true;

    // Lamp flicker
    lampLight.intensity = 2.0 + Math.sin(Date.now() * 0.0018) * 0.22;

    renderer.render(scene, camera);
  }

  animate();

  // ─── Resize ───────────────────────────────────────────────────────────────
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // ─── Helpers ──────────────────────────────────────────────────────────────
  function addMesh(geo, mat, opts = {}) {
    const mesh = new THREE.Mesh(geo, mat);
    applyOpts(mesh, opts);
    scene.add(mesh);
    return mesh;
  }

  function addToGroup(group, geo, mat, opts = {}) {
    const mesh = new THREE.Mesh(geo, mat);
    applyOpts(mesh, opts);
    mesh.castShadow  = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  function applyOpts(mesh, { px = 0, py = 0, pz = 0, rx = 0, ry = 0, rz = 0,
                              sx = 1, sy = 1, sz = 1, shadow } = {}) {
    mesh.position.set(px, py, pz);
    mesh.rotation.set(rx, ry, rz);
    mesh.scale.set(sx, sy, sz);
    if (shadow === 'cast'    || shadow === 'both') mesh.castShadow    = true;
    if (shadow === 'receive' || shadow === 'both') mesh.receiveShadow = true;
  }
}());
