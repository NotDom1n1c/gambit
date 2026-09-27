/* GAMBIT — the hero's 3D chess piece (three.js).
   Pieces are modelled in code: turned profiles (LatheGeometry) for the round
   pieces, an extruded outline for the knight's head. Listens for the
   "gambit:piece" event from site.js and morphs to the requested piece. */
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const canvas = document.getElementById("piece3d");
const stage = document.getElementById("stage");
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
} catch (e) {
  throw new Error("WebGL unavailable");      // site.js shows the 2D fallback
}
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;
scene.environmentIntensity = 0.55;

const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
camera.position.set(0, 2.6, 10.5);
camera.lookAt(0, 1.55, 0);

// lights: warm key, red rim (the page's signal colour), cool fill
const key = new THREE.DirectionalLight(0xfff1dc, 2.4);
key.position.set(3.5, 6, 4);
key.castShadow = true;
key.shadow.mapSize.set(1024, 1024);
key.shadow.camera.left = -3; key.shadow.camera.right = 3; key.shadow.camera.top = 3; key.shadow.camera.bottom = -3;
key.shadow.radius = 6;
scene.add(key);
const rim = new THREE.DirectionalLight(0xff4a30, 3.2);
rim.position.set(-4, 3, -4);
scene.add(rim);
const rim2 = new THREE.DirectionalLight(0xffb49a, 1.2);
rim2.position.set(4, 2.5, -3);
scene.add(rim2);
scene.add(new THREE.HemisphereLight(0x9fb4c8, 0x1a1208, 0.35));

// plinth + soft contact shadow
const plinth = new THREE.Mesh(
  new THREE.CylinderGeometry(1.75, 1.85, 0.12, 96),
  new THREE.MeshPhysicalMaterial({ color: 0x0a0b09, roughness: 0.8, metalness: 0, clearcoat: 0.25, clearcoatRoughness: 0.5, envMapIntensity: 0.15 })
);
plinth.position.y = -0.06;
plinth.receiveShadow = true;
scene.add(plinth);
const ring = new THREE.Mesh(new THREE.TorusGeometry(1.8, 0.012, 8, 128), new THREE.MeshBasicMaterial({ color: 0xd8412a }));
ring.rotation.x = Math.PI / 2; ring.position.y = 0.005;
scene.add(ring);
const shadowPlane = new THREE.Mesh(new THREE.CircleGeometry(1.7, 64), new THREE.ShadowMaterial({ opacity: 0.45 }));
shadowPlane.rotation.x = -Math.PI / 2; shadowPlane.position.y = 0.002;
shadowPlane.receiveShadow = true;
scene.add(shadowPlane);

// ---------- materials ----------
const IVORY = new THREE.MeshPhysicalMaterial({ color: 0xece2cc, roughness: 0.34, clearcoat: 0.9, clearcoatRoughness: 0.18, sheen: 0.4, sheenColor: 0xffffff });
const EBONY = new THREE.MeshPhysicalMaterial({ color: 0x141311, roughness: 0.26, clearcoat: 1, clearcoatRoughness: 0.08 });

// ---------- modelling helpers ----------
const V = (x, y) => new THREE.Vector2(x, y);
const BASE = [[0, 0], [1.0, 0], [1.02, 0.08], [0.98, 0.16], [0.92, 0.2], [0.95, 0.27], [0.86, 0.34], [0.72, 0.4], [0.64, 0.47]];
function lathe(points) {
  const g = new THREE.LatheGeometry(points.map(([x, y]) => V(x, y)), 96);
  g.computeVertexNormals();
  return g;
}
function mesh(geo, mat) {
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}
function sphere(r, y, mat, x = 0, z = 0) {
  const m = mesh(new THREE.SphereGeometry(r, 48, 32), mat);
  m.position.set(x, y, z);
  return m;
}
function box(w, h, d, y, mat) {
  const g = new THREE.BoxGeometry(w, h, d, 2, 2, 2);
  const m = mesh(g, mat); m.position.y = y;
  return m;
}

// each builder returns { group, height }
const BUILD = {
  P(mat) {
    const g = new THREE.Group();
    g.add(mesh(lathe([...BASE, [0.52, 0.58], [0.4, 0.8], [0.33, 1.04], [0.5, 1.1], [0.53, 1.16], [0.5, 1.2], [0.3, 1.25], [0.24, 1.3], [0, 1.32]]), mat));
    g.add(sphere(0.43, 1.66, mat));
    return { group: g, height: 2.1 };
  },
  R(mat) {
    const g = new THREE.Group();
    g.add(mesh(lathe([...BASE, [0.6, 0.58], [0.54, 0.9], [0.52, 1.5], [0.6, 1.62], [0.72, 1.72], [0.72, 1.98], [0.52, 1.98], [0.5, 1.9], [0, 1.9]]), mat));
    // battlements: 6 merlons with gaps between them
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const m = box(0.36, 0.3, 0.22, 2.12, mat);
      m.position.x = Math.cos(a) * 0.6; m.position.z = Math.sin(a) * 0.6;
      m.rotation.y = -a + Math.PI / 2;
      g.add(m);
    }
    return { group: g, height: 2.3 };
  },
  B(mat) {
    const g = new THREE.Group();
    g.add(mesh(lathe([...BASE, [0.5, 0.58], [0.36, 0.92], [0.29, 1.42], [0.46, 1.5], [0.49, 1.56], [0.46, 1.6], [0.28, 1.64],
      [0.36, 1.76], [0.44, 1.94], [0.45, 2.08], [0.4, 2.26], [0.3, 2.42], [0.16, 2.56], [0.07, 2.62], [0, 2.63]]), mat));
    g.add(sphere(0.12, 2.74, mat));
    // the mitre's slit: a thin dark wedge set into the head
    const slit = mesh(new THREE.BoxGeometry(0.05, 0.5, 0.95), mat === IVORY ? EBONY : IVORY);
    slit.position.set(0.1, 2.2, 0); slit.rotation.z = -0.6; slit.scale.set(1, 1, 0.98);
    slit.material = new THREE.MeshStandardMaterial({ color: mat === IVORY ? 0x5a5040 : 0x050505, roughness: 0.8 });
    g.add(slit);
    return { group: g, height: 2.9 };
  },
  Q(mat) {
    const g = new THREE.Group();
    g.add(mesh(lathe([...BASE, [0.54, 0.58], [0.39, 1.0], [0.3, 1.72], [0.47, 1.8], [0.5, 1.86], [0.47, 1.9], [0.3, 1.95],
      [0.35, 2.2], [0.5, 2.52], [0.57, 2.62], [0.52, 2.66], [0.36, 2.66], [0.26, 2.74], [0.14, 2.82], [0, 2.84]]), mat));
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2;
      g.add(sphere(0.085, 2.7, mat, Math.cos(a) * 0.5, Math.sin(a) * 0.5));
    }
    g.add(sphere(0.14, 2.98, mat));
    return { group: g, height: 3.15 };
  },
  K(mat) {
    const g = new THREE.Group();
    g.add(mesh(lathe([...BASE, [0.56, 0.58], [0.41, 1.02], [0.32, 1.82], [0.49, 1.9], [0.52, 1.96], [0.49, 2.0], [0.32, 2.05],
      [0.38, 2.34], [0.5, 2.6], [0.47, 2.72], [0.2, 2.8], [0, 2.82]]), mat));
    g.add(box(0.15, 0.58, 0.15, 3.08, mat));
    g.add(box(0.44, 0.15, 0.15, 3.12, mat));
    return { group: g, height: 3.4 };
  },
  N(mat) {
    const g = new THREE.Group();
    g.add(mesh(lathe([...BASE, [0.58, 0.56], [0.56, 0.66], [0, 0.66]]), mat));
    // horse head outline (facing -x), extruded and bevelled
    const s = new THREE.Shape();
    s.moveTo(0.46, 0.62);
    s.quadraticCurveTo(0.58, 1.1, 0.46, 1.58);
    s.quadraticCurveTo(0.4, 1.98, 0.18, 2.14);
    s.lineTo(0.06, 2.42);                 // ear
    s.lineTo(-0.06, 2.12);
    s.quadraticCurveTo(-0.36, 2.02, -0.56, 1.66);
    s.quadraticCurveTo(-0.72, 1.44, -0.66, 1.34);   // nose
    s.quadraticCurveTo(-0.52, 1.24, -0.34, 1.34);   // mouth
    s.quadraticCurveTo(-0.1, 1.32, -0.06, 1.16);    // jaw
    s.quadraticCurveTo(-0.34, 0.94, -0.46, 0.62);   // chest
    s.lineTo(0.46, 0.62);
    const head = new THREE.ExtrudeGeometry(s, { depth: 0.46, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.08, bevelSegments: 6, curveSegments: 24 });
    head.translate(0, 0, -0.23);
    head.computeVertexNormals();
    g.add(mesh(head, mat));
    // mane ridge + eyes
    const mane = mesh(new THREE.CapsuleGeometry(0.07, 1.0, 6, 16), mat);
    mane.position.set(0.44, 1.5, 0); mane.rotation.z = 0.28;
    g.add(mane);
    const eyeMat = new THREE.MeshStandardMaterial({ color: mat === IVORY ? 0x2a241c : 0x6a5a48, roughness: 0.4 });
    for (const z of [-0.33, 0.33]) g.add(sphere(0.055, 1.82, eyeMat, -0.22, z));
    return { group: g, height: 2.5 };
  }
};

// ---------- scene state ----------
const holder = new THREE.Group();      // hover + tilt
const spinner = new THREE.Group();     // slow turn + morph spin
holder.add(spinner);
scene.add(holder);

let current = null;
function makePiece(code, index) {
  const mat = index % 2 ? EBONY : IVORY;
  const { group, height } = BUILD[code](mat);
  const k = Math.pow(3.0 / height, 0.65);          // big pieces stay a bit bigger than small ones
  group.scale.setScalar(k);
  group.userData.h = height * k;
  return group;
}

const morph = { phase: "idle", t: 0, next: null };
function requestPiece(code, index) {
  if (!current) {
    current = makePiece(code, index); spinner.add(current);
    morph.phase = "in"; morph.t = 0; spinner.scale.setScalar(0.001);
    return;
  }
  morph.next = { code, index };
  if (morph.phase === "idle" || morph.phase === "in") { morph.phase = "out"; morph.t = 0; }
}
window.addEventListener("gambit:piece", e => requestPiece(e.detail.code, e.detail.index));
// pick up the piece that is showing right now
const PIECE_CODES = ["P", "N", "B", "R", "Q", "K"];
requestPiece(PIECE_CODES[window.GAMBIT_PIECE ? window.GAMBIT_PIECE() : 4], window.GAMBIT_PIECE ? window.GAMBIT_PIECE() : 4);

// ---------- interaction ----------
const tilt = { x: 0, y: 0, tx: 0, ty: 0 };
window.addEventListener("pointermove", e => {
  const r = stage.getBoundingClientRect();
  tilt.tx = ((e.clientX - (r.left + r.width / 2)) / r.width) * 0.5;
  tilt.ty = ((e.clientY - (r.top + r.height / 2)) / r.height) * 0.3;
});

function resize() {
  const w = stage.clientWidth, h = stage.clientHeight;
  if (!w || !h) return;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  // keep the whole piece in frame on narrow/tall stages
  camera.fov = w / h < 0.8 ? 36 : 28;
  camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(stage);
resize();

// ---------- loop (paused when the hero is off-screen) ----------
let visible = true, last = performance.now(), time = 0;
new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(stage);
const easeIn = t => t * t * t;
const easeOutBack = t => { const c = 1.6; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };

function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (!visible || document.hidden) return;
  time += dt;

  if (morph.phase === "out") {
    morph.t = Math.min(1, morph.t + dt / 0.42);
    spinner.scale.setScalar(Math.max(0.001, 1 - easeIn(morph.t)));
    spinner.rotation.y += dt * 9 * morph.t;
    if (morph.t >= 1) {
      spinner.remove(current);
      current.traverse(o => { if (o.geometry) o.geometry.dispose(); });
      current = makePiece(morph.next.code, morph.next.index);
      spinner.add(current);
      morph.phase = "in"; morph.t = 0;
    }
  } else if (morph.phase === "in") {
    morph.t = Math.min(1, morph.t + dt / 0.7);
    spinner.scale.setScalar(Math.max(0.001, easeOutBack(morph.t)));
    spinner.rotation.y += dt * 4 * (1 - morph.t);
    if (morph.t >= 1) morph.phase = "idle";
  }
  if (!reduce) spinner.rotation.y += dt * 0.45;

  // hover above the plinth + follow the mouse a little
  holder.position.y = 0.28 + (reduce ? 0 : Math.sin(time * 1.6) * 0.12);
  tilt.x += (tilt.tx - tilt.x) * 0.06; tilt.y += (tilt.ty - tilt.y) * 0.06;
  holder.rotation.z = -tilt.x * 0.35;
  holder.rotation.x = tilt.y * 0.35;
  // the shadow tightens as the piece comes down
  shadowPlane.material.opacity = 0.32 + (0.4 - holder.position.y) * 0.9;

  renderer.render(scene, camera);
}
requestAnimationFrame(frame);
window.__piece3dOK = true;
document.getElementById("stage-fallback").hidden = true;   // 3D is up: never show the 2D stand-in
