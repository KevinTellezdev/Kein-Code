/* =============================================
   KEIN CODE — script.js v2.0
   ============================================= */

// ── 2. SCROLL PROGRESS BAR ───────────────────
const progressBar = document.getElementById('scroll-progress');
window.addEventListener('scroll', () => {
  const scrolled = window.scrollY;
  const total    = document.body.scrollHeight - window.innerHeight;
  progressBar.style.width = (scrolled / total * 100) + '%';
}, { passive: true });


// ── 3. PARTÍCULAS REACTIVAS CON MOUSE ────────
const canvas = document.getElementById('particles');
const ctx    = canvas.getContext('2d');
let W, H, dots = [];
let mx = -999, my = -999; // posición del mouse en canvas

function resize() {
  W = canvas.width  = window.innerWidth;
  H = canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', resize, { passive: true });
window.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; }, { passive: true });

// Explosión en click
let explosions = [];
window.addEventListener('click', e => {
  for (let i = 0; i < 18; i++) {
    const angle = (Math.PI * 2 / 18) * i;
    const speed = Math.random() * 3 + 1.5;
    explosions.push({
      x: e.clientX, y: e.clientY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1, r: Math.random() * 2 + 1,
    });
  }
});

// Generar partículas
const PARTICLE_COUNT = window.innerWidth < 600 ? 90 : 165; // menos en mobile, para no sobrecargar
for (let i = 0; i < PARTICLE_COUNT; i++) {
  dots.push({
    x:  Math.random() * window.innerWidth,
    y:  Math.random() * window.innerHeight,
    r:  Math.random() * 1.6 + 0.3,
    vx: (Math.random() - 0.5) * 0.35,
    vy: (Math.random() - 0.5) * 0.35,
    ovx: 0, ovy: 0, // velocidad de repulsión
    o:  Math.random() * 0.5 + 0.1,
  });
}

function drawParticles() {
  ctx.clearRect(0, 0, W, H);

  // Partículas principales
  dots.forEach(d => {
    // Repulsión del mouse
    const dx   = d.x - mx;
    const dy   = d.y - my;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const repelRadius = 90;

    if (dist < repelRadius && dist > 0) {
      const force = (repelRadius - dist) / repelRadius;
      d.ovx += (dx / dist) * force * 0.8;
      d.ovy += (dy / dist) * force * 0.8;
    }

    // Fricción en repulsión
    d.ovx *= 0.88;
    d.ovy *= 0.88;

    d.x += d.vx + d.ovx;
    d.y += d.vy + d.ovy;

    if (d.x < 0 || d.x > W) d.vx *= -1;
    if (d.y < 0 || d.y > H) d.vy *= -1;
    d.x = Math.max(0, Math.min(W, d.x));
    d.y = Math.max(0, Math.min(H, d.y));

    ctx.beginPath();
    ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 0, 51, ${d.o})`;
    ctx.fill();
  });

  // Líneas de conexión
  for (let i = 0; i < dots.length; i++) {
    for (let j = i + 1; j < dots.length; j++) {
      const dx   = dots[i].x - dots[j].x;
      const dy   = dots[i].y - dots[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 155) {
        ctx.beginPath();
        ctx.moveTo(dots[i].x, dots[i].y);
        ctx.lineTo(dots[j].x, dots[j].y);
        ctx.strokeStyle = `rgba(255, 0, 51, ${0.12 * (1 - dist / 155)})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    }
  }

  // Explosiones
  explosions = explosions.filter(p => p.life > 0);
  explosions.forEach(p => {
    p.x    += p.vx;
    p.y    += p.vy;
    p.vx   *= 0.93;
    p.vy   *= 0.93;
    p.life -= 0.035;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 0, 51, ${p.life})`;
    ctx.fill();
  });

  requestAnimationFrame(drawParticles);
}
drawParticles();


// ── 4. PARALLAX EN EL HERO ───────────────────
window.addEventListener('scroll', () => {
  const sy = window.scrollY;
  canvas.style.transform = `translateY(${sy * 0.3}px)`;
  const heroText  = document.querySelector('.hero-text');
  const heroVisual = document.querySelector('.hero-visual');
  if (heroText)   heroText.style.transform   = `translateY(${sy * 0.15}px)`;
  if (heroVisual) heroVisual.style.transform = `translateY(${sy * 0.25}px)`;
}, { passive: true });

// (sección de órbita/Saturno removida — reemplazada por el avatar)

// ── 6. TYPING EFFECT ─────────────────────────
const phrases = [
  "Páginas web que convierten visitas en clientes.",
  "Diseño moderno, código limpio y resultados reales.",
  "Tu negocio merece presencia digital profesional.",
];
let pi = 0, ci = 0, deleting = false;
const typingEl = document.getElementById('typing-text');

function type() {
  const current = phrases[pi];
  if (!deleting) {
    typingEl.textContent = current.slice(0, ci + 1);
    ci++;
    if (ci === current.length) { deleting = true; setTimeout(type, 1800); return; }
  } else {
    typingEl.textContent = current.slice(0, ci - 1);
    ci--;
    if (ci === 0) { deleting = false; pi = (pi + 1) % phrases.length; }
  }
  setTimeout(type, deleting ? 35 : 55);
}
type();


// ── 7. GLITCH EN EL TÍTULO ───────────────────
const glitchTarget = document.querySelector('.glitch-target');
if (glitchTarget) {
  setInterval(() => {
    glitchTarget.classList.add('glitch-active');
    setTimeout(() => glitchTarget.classList.remove('glitch-active'), 400);
  }, 8000);
}


// ── 8. NAV SCROLL ────────────────────────────
window.addEventListener('scroll', () => {
  const nav = document.getElementById('navbar');
  nav.classList.toggle('scrolled', window.scrollY > 50);

  const sections = ['home', 'metrics', 'about', 'projects', 'process', 'contact'];
  const links    = document.querySelectorAll('.nav-links a');
  let current    = 'home';

  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el && window.scrollY >= el.offsetTop - 130) current = id;
  });

  links.forEach(a => {
    const href = (a.getAttribute('href') || '').replace('#', '') || 'home';
    a.classList.toggle('active', href === current);
  });
}, { passive: true });


// ── 9. INTERSECTION OBSERVER GENERAL ─────────
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      revealObserver.unobserve(e.target);
    }
  });
}, { threshold: 0.05 });

document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach(r => revealObserver.observe(r));

// Fallback: mostrar todo después de 2s por si el observer no dispara
setTimeout(() => {
  document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach(r => r.classList.add('visible'));
  document.querySelectorAll('.about-card').forEach(c => c.classList.add('visible'));
  document.querySelectorAll('.process-step').forEach(s => s.classList.add('visible'));
}, 2000);


// ── 10. MÉTRICAS — COUNTER UP ────────────────
function countUp(el, target, duration = 1400) {
  let start = 0;
  const step = timestamp => {
    if (!start) start = timestamp;
    const progress = Math.min((timestamp - start) / duration, 1);
    // easing out
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.floor(eased * target);
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = target;
  };
  requestAnimationFrame(step);
}

const metricsSection = document.getElementById('metrics');
let metricsAnimated  = false;

const metricsObserver = new IntersectionObserver(entries => {
  if (entries[0].isIntersecting && !metricsAnimated) {
    metricsAnimated = true;
    metricsSection.classList.add('animated');

    document.querySelectorAll('.metric-item').forEach((item, i) => {
      setTimeout(() => {
        item.classList.add('visible');
        const numEl  = item.querySelector('.metric-number');
        const target = parseInt(numEl.dataset.target);
        countUp(numEl, target);
      }, i * 150);
    });
  }
}, { threshold: 0.3 });

if (metricsSection) metricsObserver.observe(metricsSection);


// ── 11. ABOUT — SKILL BARS ───────────────────
const skillsSection = document.querySelector('.skills-section');
let   skillsAnimated = false;

const skillsObserver = new IntersectionObserver(entries => {
  if (entries[0].isIntersecting && !skillsAnimated) {
    skillsAnimated = true;
    document.querySelectorAll('.skill-bar-fill').forEach((bar, i) => {
      const w = bar.dataset.width;
      setTimeout(() => { bar.style.width = w + '%'; }, i * 120);
    });
  }
}, { threshold: 0.3 });

if (skillsSection) skillsObserver.observe(skillsSection);


// ── 12. ABOUT CARDS — CLIP PATH REVEAL ───────
document.querySelectorAll('.about-card').forEach(card => revealObserver.observe(card));


// ── 13. PROYECTOS — STAGGER REVEAL ───────────
const projectCards = document.querySelectorAll('.project-card');

// Animación de entrada con stagger
function revealCards() {
  const visibleCards = document.querySelectorAll('.projects-grid .project-card:not(.project-hidden)');
  visibleCards.forEach((c, i) => {
    setTimeout(() => {
      c.style.opacity   = '1';
      c.style.transform = 'translateY(0)';
    }, i * 100);
  });
}

// Inicializar cards
projectCards.forEach(card => {
  if (!card.classList.contains('project-hidden')) {
    card.style.opacity    = '0';
    card.style.transform  = 'translateY(20px)';
  }
  card.style.transition = 'opacity 0.5s ease, transform 0.5s ease, border-color 0.3s, box-shadow 0.3s, background 0.3s';
  card.classList.remove('reveal');
});

// Usar observer si está disponible, sino mostrar directo
const grid = document.querySelector('.projects-grid');
if (grid) {
  const cardObserver = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) {
      revealCards();
      cardObserver.disconnect();
    }
  }, { threshold: 0.05 });
  cardObserver.observe(grid);

  // Fallback: si en 1.5s no se activa el observer, mostrar igual
  setTimeout(revealCards, 1500);
}


// ── 14. FILTROS DE PROYECTOS ─────────────────
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const filter = btn.dataset.filter;
    projectCards.forEach(card => {
      const tags = card.dataset.tags || 'all';
      const show = filter === 'all' || tags.includes(filter);
      card.classList.toggle('hidden', !show);
    });
  });
});


// ── 15. PROCESO — SVG PATH DRAW ──────────────
const processSection = document.querySelector('#process .process-timeline');
let   processAnimated = false;

const processObserver = new IntersectionObserver(entries => {
  if (entries[0].isIntersecting && !processAnimated) {
    processAnimated = true;

    // Animar la línea SVG
    const line = document.getElementById('process-line');
    if (line) {
      setTimeout(() => { line.style.strokeDashoffset = '0'; }, 100);
    }

    // Animar los pasos en cascada
    document.querySelectorAll('.process-step').forEach(step => {
      step.classList.add('visible');
    });
  }
}, { threshold: 0.2 });

if (processSection) processObserver.observe(processSection);


// ── 16. CONTACT — REVEAL LATERAL ─────────────
const contactSection = document.getElementById('contact');
let   contactAnimated = false;

const contactObserver = new IntersectionObserver(entries => {
  if (entries[0].isIntersecting && !contactAnimated) {
    contactAnimated = true;
    const left  = document.querySelector('.contact-left');
    const right = document.querySelector('.contact-form');
    if (left)  left.classList.add('visible');
    if (right) right.classList.add('visible');
  }
}, { threshold: 0.2 });

if (contactSection) contactObserver.observe(contactSection);


// ── 17. GLOW EN PROJECT CARDS AL HOVER ───────
projectCards.forEach(card => {
  card.addEventListener('mousemove', e => {
    const r = card.getBoundingClientRect();
    card.style.background = `radial-gradient(circle at ${e.clientX - r.left}px ${e.clientY - r.top}px, rgba(255,0,51,0.07), rgba(17,17,17,0.9) 60%)`;
  });
  card.addEventListener('mouseleave', () => { card.style.background = 'var(--card-bg)'; });
});


// ── 18. WHATSAPP — FIX FORM COMPLETO ─────────
function sendWA() {
  const name    = document.getElementById('form-name').value.trim();
  const email   = document.getElementById('form-email').value.trim();
  const subject = document.getElementById('form-subject').value.trim();
  const msg     = document.getElementById('form-msg').value.trim();

  let text = `Hola Kein Code! Soy ${name || 'un visitante'}.`;
  if (email)   text += ` Mi correo es ${email}.`;
  if (subject) text += ` Asunto: ${subject}.`;
  text += ` ${msg || 'Quiero una página web.'}`;

  window.open(`https://wa.me/573243965891?text=${encodeURIComponent(text)}`, '_blank');
}


// ── 19. VER MÁS PROYECTOS ────────────────────
let projectsExpanded = false;

function toggleProjects() {
  projectsExpanded = !projectsExpanded;
  const btn     = document.getElementById('ver-mas-btn');
  const btnText = document.getElementById('ver-mas-text');
  const hidden  = document.querySelectorAll('.project-card.project-hidden');

  if (projectsExpanded) {
    hidden.forEach(card => card.classList.add('show'));
    btnText.textContent = 'Ver menos';
    btn.classList.add('open');
  } else {
    hidden.forEach(card => card.classList.remove('show'));
    btnText.textContent = 'Ver más proyectos';
    btn.classList.remove('open');
    // Scroll suave de vuelta al inicio de proyectos
    document.getElementById('projects').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// (theme toggle removido — el sitio queda solo en modo oscuro)

// ── TILT 3D EN TARJETAS DE PROYECTO ──────────
(function () {
  const cards = document.querySelectorAll('.project-card');
  const MAX_TILT = 8; // grados

  cards.forEach(card => {
    card.style.transformStyle = 'preserve-3d';
    card.style.willChange = 'transform';

    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;  // 0 → 1
      const y = (e.clientY - rect.top) / rect.height;  // 0 → 1
      const rotateY = (x - 0.5) * MAX_TILT * 2;
      const rotateX = (0.5 - y) * MAX_TILT * 2;
      card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-5px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
})();

// (parallax de avatar removido a pedido del usuario — la imagen queda quieta)
