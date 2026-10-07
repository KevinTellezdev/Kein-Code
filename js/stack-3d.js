/* ============================================
   MI STACK — Esferas 3D con física propia
   (sin librerías de física externas, hecho a mano)
   ============================================ */
(function () {
  const wrap = document.getElementById('stack-3d-wrap');
  const canvas = document.getElementById('stack-canvas');
  if (!wrap || !canvas || typeof THREE === 'undefined') return;

  // ── Tecnologías: logo OFICIAL real de cada una (vía CDN público de íconos) ──
  const TECHS = [
    { name: 'HTML5',     slug: 'html5' },
    { name: 'CSS3',      slug: 'css3' },
    { name: 'JavaScript',slug: 'javascript' },
    { name: 'TypeScript',slug: 'typescript' },
    { name: 'React',     slug: 'react' },
    { name: 'Node.js',   slug: 'nodedotjs' },
    { name: 'Laravel',   slug: 'laravel' },
    { name: 'MySQL',     slug: 'mysql' },
    { name: 'MongoDB',   slug: 'mongodb' },
    { name: 'GitHub',    slug: 'github' },
    { name: 'Python',    slug: 'python' },
    { name: 'Tailwind',  slug: 'tailwindcss' },
    { name: 'PHP',       slug: 'php' },
    { name: 'Docker',    slug: 'docker' },
    { name: 'Figma',     slug: 'figma' },
    { name: 'Vue.js',    slug: 'vuedotjs' },
    { name: 'Sass',      slug: 'sass' },
    { name: 'Bootstrap', slug: 'bootstrap' },
    { name: 'VS Code',   slug: 'visualstudiocode' },
    { name: 'C#',        slug: 'csharp' },
  ];

  // Pelota blanca con el logo OFICIAL cargado desde cdn.simpleicons.org
  // (misma fuente de íconos que usan la mayoría de portafolios para esto).
  // Se dibuja primero en blanco, y cuando el logo carga se actualiza la textura.
  function makeSphereTexture(t) {
    const w = 1024, h = 512, mid = h / 2; // más ancho y HD — espacio para repetir el logo
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);

    const tex = new THREE.CanvasTexture(c);
    tex.anisotropy = 16;
    tex.needsUpdate = true;

    function drawTextFallback() {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
      ctx.font = `800 70px Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#2a2a2a';
      [1 / 6, 1 / 2, 5 / 6].forEach((frac) => {
        ctx.fillText(t.name, w * frac, mid);
      });
      tex.needsUpdate = true;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
      // el logo se repite 3 veces alrededor del ecuador de la pelota, así
      // sin importar hacia dónde haya girado, siempre hay uno mirando a cámara
      const logoSize = w * 0.26;
      [1 / 6, 1 / 2, 5 / 6].forEach((frac) => {
        ctx.drawImage(img, w * frac - logoSize / 2, mid - logoSize / 2, logoSize, logoSize);
      });
      tex.needsUpdate = true;
    };
    // si el logo no carga (slug roto, sin internet, etc.) nunca queda en blanco
    img.onerror = drawTextFallback;
    img.src = `https://cdn.simpleicons.org/${t.slug}`;

    return tex;
  }

  let width = wrap.clientWidth, height = wrap.clientHeight;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
  camera.position.set(0, 0, 15);

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(width, height);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  if ('outputColorSpace' in renderer) renderer.outputColorSpace = THREE.SRGBColorSpace;

  scene.add(new THREE.AmbientLight(0xffffff, 0.85));
  const key = new THREE.PointLight(0xffffff, 0.9, 50);
  key.position.set(5, 7, 9);
  scene.add(key);
  const rim = new THREE.PointLight(0xff3355, 0.55, 50);
  rim.position.set(-6, -3, 6);
  scene.add(rim);
  const fill = new THREE.PointLight(0xffffff, 0.45, 50);
  fill.position.set(-5, 4, 7);
  scene.add(fill);
  const topGlow = new THREE.PointLight(0xffffff, 0.4, 30);
  topGlow.position.set(0, 8, 4);
  scene.add(topGlow);

  // ── Límites del "contenedor" invisible (en unidades de mundo) ──
  // límites muy amplios — solo existen como red de seguridad, no se sienten
  // como una "caja"; el resorte es el que realmente mantiene todo junto
  const BOUNDS = { xMin: -30, xMax: 30, yMin: -20, yMax: 20, zMin: -12, zMax: 12 };
  const RADIUS = 1.0;
  const SPRING = 26;         // qué tan fuerte "jala" cada esfera hacia su punto medio
  const SPRING_DAMP = 0.80;  // amortiguación del resorte (evita que oscilen para siempre)
  const FRICTION = 0.94;
  const MAX_SPEED = 27;       // tope de velocidad para que no salgan disparadas fuera de cuadro

  const spheres = [];
  // más segmentos = esfera más redonda y highlights más suaves (calidad "pro")
  const geo = new THREE.SphereGeometry(RADIUS, 64, 64);

  // Acomoda las esferas en un racimo cerca del centro (su "punto medio" al que vuelven).
  // Separación suficiente para que se SOBREPONGAN entre sí sin quedar
  // todas exactamente en el mismo punto (eso era lo que se veía "fusionado").
  const cols = 4;
  const totalRows = Math.ceil(TECHS.length / cols);
  TECHS.forEach((t, i) => {
    const tex = makeSphereTexture(t);
    const mat = new THREE.MeshPhysicalMaterial({
      map: tex,
      roughness: 0.42,
      metalness: 0.0,
      clearcoat: 0.5,
      clearcoatRoughness: 0.45,
      reflectivity: 0.3,
      envMapIntensity: 0.6,
    });
    const mesh = new THREE.Mesh(geo, mat);

    // tamaño aleatorio por esfera — unas más grandes, otras más chicas
    const scale = 0.68 + Math.random() * 0.68;
    mesh.scale.setScalar(scale);
    const radius = RADIUS * scale;

    const col = i % cols;
    const row = Math.floor(i / cols);
    const home = new THREE.Vector3(
      (col - (cols - 1) / 2) * 1.4,
      (row - (totalRows - 1) / 2) * 1.4,
      (Math.random() - 0.5) * 1.5
    );
    mesh.position.copy(home).add(new THREE.Vector3(
      (Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.5, 0
    ));
    // arranca mirando a la cámara, y gira despacio — siempre vuelve a mostrar el nombre
    mesh.lookAt(0, 0, 100);
    scene.add(mesh);

    spheres.push({
      mesh,
      home,
      radius,
      vel: new THREE.Vector3(0, 0, 0),
      spinAxis: new THREE.Vector3(Math.random() - 0.5, 1, (Math.random() - 0.5) * 0.4).normalize(),
    });
  });

  // ── Mouse → punto 3D en el plano z=0 ──
  const raycaster = new THREE.Raycaster();
  const mouseNDC = new THREE.Vector2(999, 999);
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const mousePoint = new THREE.Vector3();
  let mouseActive = false;

  function updateMouseFromEvent(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    mouseNDC.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    mouseNDC.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouseNDC, camera);
    raycaster.ray.intersectPlane(plane, mousePoint);
    mouseActive = true;
  }
  canvas.addEventListener('mousemove', (e) => updateMouseFromEvent(e.clientX, e.clientY));
  canvas.addEventListener('mouseleave', () => { mouseActive = false; });
  canvas.addEventListener('touchmove', (e) => {
    if (e.touches[0]) updateMouseFromEvent(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });
  canvas.addEventListener('touchend', () => { mouseActive = false; });

  // ── CLIC = SALTO ──────────────────────────────
  const meshList = spheres.map(s => s.mesh);
  function bounceAt(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    mouseNDC.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    mouseNDC.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouseNDC, camera);
    const hits = raycaster.intersectObjects(meshList);
    if (hits.length > 0) {
      const hitMesh = hits[0].object;
      const s = spheres.find(sp => sp.mesh === hitMesh);
      if (s) {
        s.vel.y += 7 + Math.random() * 2;
        s.vel.x += (Math.random() - 0.5) * 4;
        s.vel.z += (Math.random() - 0.5) * 2;
      }
    }
  }
  canvas.addEventListener('click', (e) => bounceAt(e.clientX, e.clientY));
  canvas.addEventListener('touchstart', (e) => {
    if (e.touches[0]) bounceAt(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });

  function onResize() {
    width = wrap.clientWidth; height = wrap.clientHeight;
    if (!width || !height) return;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }
  window.addEventListener('resize', onResize);

  let visible = true;
  const io = new IntersectionObserver((entries) => { visible = entries[0].isIntersecting; }, { threshold: 0.05 });
  io.observe(wrap);

  const clock = new THREE.Clock();

  function step(dt) {
    dt = Math.min(dt, 1 / 30); // evita saltos grandes si la pestaña estuvo en background

    spheres.forEach((s) => {
      // resorte: siempre está "jalando" la esfera de vuelta a su punto medio
      const toHome = s.home.clone().sub(s.mesh.position);
      s.vel.addScaledVector(toHome, SPRING * dt);
      s.vel.multiplyScalar(SPRING_DAMP);

      // repulsión del mouse — MUY sensible: basta con pasar cerca para que salgan disparadas
      if (mouseActive) {
        const d = s.mesh.position.clone().sub(mousePoint);
        const dist = d.length();
        const influence = 18;
        if (dist < influence && dist > 0.001) {
          const force = (1 - dist / influence) * 260;
          d.normalize().multiplyScalar(force * dt);
          s.vel.add(d);
        }
      }

      s.vel.multiplyScalar(FRICTION);
      if (s.vel.length() > MAX_SPEED) s.vel.setLength(MAX_SPEED);
      s.mesh.position.addScaledVector(s.vel, dt);

      // paredes del contenedor, por seguridad (que no se salgan de la caja)
      const p = s.mesh.position;
      const r = s.radius;
      if (p.x - r < BOUNDS.xMin) { p.x = BOUNDS.xMin + r; s.vel.x *= -0.5; }
      if (p.x + r > BOUNDS.xMax) { p.x = BOUNDS.xMax - r; s.vel.x *= -0.5; }
      if (p.y - r < BOUNDS.yMin) { p.y = BOUNDS.yMin + r; s.vel.y *= -0.5; }
      if (p.y + r > BOUNDS.yMax) { p.y = BOUNDS.yMax - r; s.vel.y *= -0.5; }
      if (p.z - r < BOUNDS.zMin) { p.z = BOUNDS.zMin + r; s.vel.z *= -0.5; }
      if (p.z + r > BOUNDS.zMax) { p.z = BOUNDS.zMax - r; s.vel.z *= -0.5; }

      // SOLO gira mientras se está moviendo (empujada por el mouse).
      // Quieta y en reposo = sin girar, para que el logo quede siempre de frente.
      const speed = s.vel.length();
      if (speed > 0.05) {
        s.mesh.rotateOnAxis(s.spinAxis, speed * dt * 0.6);
      }
    });
  }

  function animate() {
    requestAnimationFrame(animate);
    if (!visible) return;
    const dt = clock.getDelta();
    step(dt);
    renderer.render(scene, camera);
  }

  onResize();
  animate();
})();
