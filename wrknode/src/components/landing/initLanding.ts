// Ported near-verbatim from the original static Index.html so the live
// wrknode.com marketing page keeps its exact look/behavior once served from
// this Next.js app. Assumes window.THREE and window.gsap (+ ScrollTrigger)
// are already loaded — see LandingPage.tsx.
export function initLanding() {
  const w = window as any;
  const THREE = w.THREE;
  const gsap = w.gsap;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canvas = document.getElementById("scene-canvas") as HTMLCanvasElement | null;
  const flash = document.getElementById("warp-flash");
  const shockwave = document.getElementById("warp-shockwave");

  if (typeof THREE === "undefined" || typeof gsap === "undefined" || !canvas || !flash || !shockwave) {
    return () => {};
  }

  gsap.registerPlugin(w.ScrollTrigger);

  const cursorEnabled = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  let cursorDot: HTMLDivElement | null = null;
  let cursorRing: HTMLDivElement | null = null;
  let ringX = window.innerWidth / 2;
  let ringY = window.innerHeight / 2;
  let mouseClientX = window.innerWidth / 2;
  let mouseClientY = window.innerHeight / 2;

  if (cursorEnabled) {
    cursorDot = document.createElement("div");
    cursorDot.className = "cursor-dot";
    cursorRing = document.createElement("div");
    cursorRing.className = "cursor-ring";
    document.body.appendChild(cursorDot);
    document.body.appendChild(cursorRing);
    document.querySelectorAll("#landing-root .btn, #landing-root a").forEach((el) => {
      el.addEventListener("mouseenter", () => cursorRing!.classList.add("hover"));
      el.addEventListener("mouseleave", () => cursorRing!.classList.remove("hover"));
    });
    document.querySelectorAll("#landing-root .btn").forEach((btn) => {
      btn.addEventListener("mousemove", (e: Event) => {
        const me = e as MouseEvent;
        const r = (btn as HTMLElement).getBoundingClientRect();
        const mx = me.clientX - r.left - r.width / 2;
        const my = me.clientY - r.top - r.height / 2;
        gsap.to(btn, { x: mx * 0.3, y: my * 0.3, duration: 0.3, ease: "power2.out" });
      });
      btn.addEventListener("mouseleave", () => {
        gsap.to(btn, { x: 0, y: 0, duration: 0.5, ease: "elastic.out(1,0.4)" });
      });
    });
  }

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0b0f1e, 0.02);

  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 300);
  camera.position.set(0, 0, prefersReducedMotion ? -10 : 55);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  scene.add(new THREE.AmbientLight(0x404868, 0.7));
  const brassLight = new THREE.PointLight(0xc9a24b, 2.4, 140);
  brassLight.position.set(0, 6, -72);
  scene.add(brassLight);
  const rimLight = new THREE.PointLight(0x9ba0bc, 0.7, 60);
  rimLight.position.set(12, 10, 8);
  scene.add(rimLight);

  function makeGlowTexture(hex: string) {
    const size = 128;
    const c = document.createElement("canvas");
    c.width = c.height = size;
    const ctx = c.getContext("2d")!;
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.35, hex);
    g.addColorStop(1, "rgba(228,206,147,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    return new THREE.CanvasTexture(c);
  }
  const glowTex = makeGlowTexture("rgba(228,206,147,0.75)");
  function makeGlowSprite(scale: number) {
    const mat = new THREE.SpriteMaterial({
      map: glowTex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.9,
    });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(scale, scale, 1);
    return sprite;
  }

  const cardField = new THREE.Group();
  const cardGeo = new THREE.PlaneGeometry(1.1, 0.7);
  for (let i = 0; i < 46; i++) {
    const isStale = Math.random() < 0.18;
    const mat = new THREE.MeshStandardMaterial({
      color: isStale ? 0xb8453d : 0xe9e2d0,
      side: THREE.DoubleSide,
      roughness: 0.85,
      metalness: 0.05,
      transparent: true,
      opacity: 0.8,
    });
    const card = new THREE.Mesh(cardGeo, mat);
    card.position.set((Math.random() - 0.5) * 24, (Math.random() - 0.5) * 15, 10 - Math.random() * 24);
    card.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    card.userData.spin = (Math.random() - 0.5) * 0.18;
    card.userData.pulsePhase = Math.random() * Math.PI * 2;
    card.userData.pulseSpeed = 0.6 + Math.random() * 0.8;
    card.userData.baseOpacity = 0.8;
    cardField.add(card);
  }
  scene.add(cardField);

  const nodeCluster = new THREE.Group();
  const coreGeo = new THREE.IcosahedronGeometry(3.4, 1);
  const coreMat = new THREE.MeshStandardMaterial({
    color: 0xc9a24b,
    emissive: 0xc9a24b,
    emissiveIntensity: 0.45,
    flatShading: true,
    metalness: 0.3,
    roughness: 0.35,
  });
  const core = new THREE.Mesh(coreGeo, coreMat);
  core.add(makeGlowSprite(16));
  nodeCluster.add(core);

  const ring1 = new THREE.Mesh(
    new THREE.TorusGeometry(6.4, 0.05, 8, 64),
    new THREE.MeshBasicMaterial({ color: 0xc9a24b, transparent: true, opacity: 0.4 })
  );
  ring1.rotation.x = Math.PI / 2.3;
  const ring2 = new THREE.Mesh(
    new THREE.TorusGeometry(8.2, 0.04, 8, 64),
    new THREE.MeshBasicMaterial({ color: 0xe4ce93, transparent: true, opacity: 0.25 })
  );
  ring2.rotation.x = Math.PI / 1.8;
  ring2.rotation.y = 0.4;
  nodeCluster.add(ring1);
  nodeCluster.add(ring2);

  const orbiterGeo = new THREE.IcosahedronGeometry(0.42, 0);
  const orbiterMat = new THREE.MeshStandardMaterial({
    color: 0xe4ce93,
    emissive: 0xe4ce93,
    emissiveIntensity: 0.35,
    flatShading: true,
  });
  const lineMat = new THREE.LineBasicMaterial({ color: 0xc9a24b, transparent: true, opacity: 0.32 });
  const orbiterPivots: any[] = [];
  for (let j = 0; j < 12; j++) {
    const pivot = new THREE.Object3D();
    pivot.rotation.x = Math.random() * Math.PI;
    pivot.rotation.z = Math.random() * Math.PI;
    const radius = 6 + Math.random() * 4.5;
    const orbiter = new THREE.Mesh(orbiterGeo, orbiterMat);
    orbiter.position.x = radius;
    pivot.add(orbiter);
    const lineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(radius, 0, 0),
    ]);
    pivot.add(new THREE.Line(lineGeo, lineMat));
    pivot.userData.speed = 0.35 + Math.random() * 0.5;
    nodeCluster.add(pivot);
    orbiterPivots.push(pivot);
  }
  nodeCluster.position.z = -78;
  scene.add(nodeCluster);

  function makeAgentCurve() {
    const startPos = new THREE.Vector3((Math.random() - 0.5) * 22, (Math.random() - 0.5) * 13, 6 - Math.random() * 20);
    const midPos = new THREE.Vector3((Math.random() - 0.5) * 12, (Math.random() - 0.5) * 9, -38 - Math.random() * 18);
    const endPos = new THREE.Vector3((Math.random() - 0.5) * 7, (Math.random() - 0.5) * 7, -76 - Math.random() * 6);
    return new THREE.CatmullRomCurve3([startPos, midPos, endPos]);
  }
  const agents: any[] = [];
  const agentGeo = new THREE.IcosahedronGeometry(0.22, 0);
  const agentMat = new THREE.MeshBasicMaterial({ color: 0xe4ce93 });
  const agentCount = prefersReducedMotion ? 3 : 9;
  for (let a = 0; a < agentCount; a++) {
    const mesh = new THREE.Mesh(agentGeo, agentMat);
    mesh.add(makeGlowSprite(1.7));
    scene.add(mesh);
    agents.push({ mesh, curve: makeAgentCurve(), progress: Math.random(), speed: 0.035 + Math.random() * 0.03 });
  }

  const particleCount = prefersReducedMotion ? 300 : 1100;
  const positions = new Float32Array(particleCount * 3);
  for (let k = 0; k < particleCount; k++) {
    positions[k * 3] = (Math.random() - 0.5) * 90;
    positions[k * 3 + 1] = (Math.random() - 0.5) * 60;
    positions[k * 3 + 2] = 15 - Math.random() * 135;
  }
  const particleGeo = new THREE.BufferGeometry();
  particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const particleMat = new THREE.PointsMaterial({ color: 0xadb4cc, size: 0.13, transparent: true, opacity: 0.55 });
  scene.add(new THREE.Points(particleGeo, particleMat));

  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  window.addEventListener("resize", onResize);

  let pointerX = 0;
  let pointerY = 0;
  function onPointerMove(e: PointerEvent) {
    pointerX = e.clientX / window.innerWidth - 0.5;
    pointerY = e.clientY / window.innerHeight - 0.5;
    mouseClientX = e.clientX;
    mouseClientY = e.clientY;
    if (cursorEnabled && cursorDot) {
      cursorDot.style.left = mouseClientX + "px";
      cursorDot.style.top = mouseClientY + "px";
    }
  }
  window.addEventListener("pointermove", onPointerMove);

  let scrollProgress = 0;
  const clock = new THREE.Clock();
  let rafId = 0;

  function animate() {
    rafId = requestAnimationFrame(animate);
    const delta = Math.min(clock.getDelta(), 0.05);
    const elapsed = clock.getElapsedTime();

    const targetZ = THREE.MathUtils.lerp(16, -96, scrollProgress);
    camera.position.z += (targetZ - camera.position.z) * 0.055;

    if (!prefersReducedMotion) {
      const targetX = Math.sin(elapsed * 0.05) * 0.6 + pointerX * 1.6;
      const targetY = Math.cos(elapsed * 0.04) * 0.4 - pointerY * 1.1;
      camera.position.x += (targetX - camera.position.x) * 0.04;
      camera.position.y += (targetY - camera.position.y) * 0.04;
    }
    camera.lookAt(0, 0, camera.position.z - 40);

    cardField.children.forEach((c: any) => {
      c.rotation.x += c.userData.spin * delta;
      c.rotation.z += c.userData.spin * 0.6 * delta;
      c.material.opacity = c.userData.baseOpacity + Math.sin(elapsed * c.userData.pulseSpeed + c.userData.pulsePhase) * 0.15;
    });

    orbiterPivots.forEach((p) => {
      p.rotation.y += p.userData.speed * delta;
    });
    nodeCluster.rotation.y += 0.03 * delta;
    ring1.rotation.z += 0.15 * delta;
    ring2.rotation.z -= 0.11 * delta;
    coreMat.emissiveIntensity = 0.45 + Math.sin(elapsed * 1.2) * 0.15;
    core.scale.setScalar(1 + Math.sin(elapsed * 1.2) * 0.03);

    agents.forEach((ag) => {
      ag.progress += ag.speed * delta;
      if (ag.progress >= 1) {
        ag.progress = 0;
        ag.curve = makeAgentCurve();
      }
      ag.mesh.position.copy(ag.curve.getPointAt(ag.progress));
    });

    if (cursorEnabled && cursorRing) {
      ringX += (mouseClientX - ringX) * 0.15;
      ringY += (mouseClientY - ringY) * 0.15;
      cursorRing.style.left = ringX + "px";
      cursorRing.style.top = ringY + "px";
    }

    renderer.render(scene, camera);
  }
  animate();

  const scrollTriggers: any[] = [];
  scrollTriggers.push(
    w.ScrollTrigger.create({
      trigger: document.body,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      onUpdate: (self: any) => {
        scrollProgress = self.progress;
      },
    })
  );

  function warpBurst() {
    gsap.set(shockwave, { scale: 0, opacity: 0.9 });
    gsap.to(shockwave, { scale: 26, opacity: 0, duration: 0.8, ease: "power2.out" });
    if (prefersReducedMotion) {
      gsap.to(flash, { opacity: 0.35, duration: 0.18, yoyo: true, repeat: 1 });
      return;
    }
    const tl = gsap.timeline();
    tl.to(flash, { opacity: 0.85, duration: 0.14, ease: "power2.in" })
      .to(
        camera,
        {
          fov: 98,
          duration: 0.14,
          onUpdate: () => camera.updateProjectionMatrix(),
        },
        "<"
      )
      .to(flash, { opacity: 0, duration: 0.55, ease: "power2.out" })
      .to(
        camera,
        {
          fov: 60,
          duration: 0.55,
          onUpdate: () => camera.updateProjectionMatrix(),
        },
        "<"
      );
  }

  scrollTriggers.push(
    w.ScrollTrigger.create({ trigger: "#problem", start: "top 80%", onEnter: warpBurst, onEnterBack: warpBurst })
  );
  scrollTriggers.push(
    w.ScrollTrigger.create({ trigger: "#how", start: "top 75%", onEnter: warpBurst, onEnterBack: warpBurst })
  );
  scrollTriggers.push(
    w.ScrollTrigger.create({ trigger: "#access", start: "top 75%", onEnter: warpBurst, onEnterBack: warpBurst })
  );

  gsap.to("#floatingMessage", {
    opacity: 1,
    y: -20,
    duration: 0.9,
    ease: "power2.out",
    scrollTrigger: { trigger: "#how", start: "top 65%", toggleActions: "play none none reverse" },
  });

  const counterEl = document.getElementById("counterSeconds");
  if (counterEl) {
    const counterObj = { val: 0 };
    gsap.to(counterObj, {
      val: 12,
      duration: 1.1,
      ease: "power2.out",
      onUpdate: () => {
        counterEl.textContent = String(Math.round(counterObj.val));
      },
      scrollTrigger: { trigger: "#how", start: "top 65%", toggleActions: "play none none reverse" },
    });
  }

  const cycleEl = document.getElementById("cycleWord");
  let cycleInterval: ReturnType<typeof setInterval> | null = null;
  if (cycleEl && !prefersReducedMotion) {
    const cyclePhrases = ["your website", "Zillow", "a Facebook ad", "a contact form", "a missed call", "your booking page"];
    let cycleIndex = 0;
    cycleInterval = setInterval(() => {
      cycleIndex = (cycleIndex + 1) % cyclePhrases.length;
      gsap.to(cycleEl, {
        opacity: 0,
        y: -8,
        duration: 0.25,
        ease: "power1.in",
        onComplete: () => {
          cycleEl.textContent = cyclePhrases[cycleIndex];
          gsap.fromTo(cycleEl, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.3, ease: "power1.out" });
        },
      });
    }, 2200);
  }

  gsap.from(".who .panel", {
    opacity: 0,
    y: 40,
    duration: 0.9,
    ease: "power2.out",
    scrollTrigger: { trigger: ".who", start: "top 70%", toggleActions: "play none none reverse" },
  });
  gsap.from(".who-item", {
    opacity: 0,
    y: 30,
    duration: 0.6,
    stagger: 0.12,
    ease: "power2.out",
    scrollTrigger: { trigger: ".who-grid", start: "top 78%", toggleActions: "play none none reverse" },
  });
  gsap.from(".faq .panel", {
    opacity: 0,
    y: 40,
    duration: 0.9,
    ease: "power2.out",
    scrollTrigger: { trigger: ".faq", start: "top 70%", toggleActions: "play none none reverse" },
  });
  gsap.from(".faq-item", {
    opacity: 0,
    y: 24,
    duration: 0.6,
    stagger: 0.1,
    ease: "power2.out",
    scrollTrigger: { trigger: ".faq-list", start: "top 78%", toggleActions: "play none none reverse" },
  });
  gsap.from(".pricing .panel", {
    opacity: 0,
    y: 40,
    duration: 0.9,
    ease: "power2.out",
    scrollTrigger: { trigger: ".pricing", start: "top 70%", toggleActions: "play none none reverse" },
  });

  gsap.from(".bento-card", {
    opacity: 0,
    y: 30,
    scale: 0.96,
    duration: 0.7,
    stagger: 0.1,
    ease: "power2.out",
    scrollTrigger: { trigger: ".bento", start: "top 80%", toggleActions: "play none none reverse" },
  });

  gsap.from(".problem .panel", {
    opacity: 0,
    y: 40,
    duration: 0.9,
    ease: "power2.out",
    scrollTrigger: { trigger: ".problem", start: "top 70%", toggleActions: "play none none reverse" },
  });
  gsap.from(".step", {
    opacity: 0,
    y: 34,
    scale: 0.95,
    duration: 0.7,
    stagger: 0.15,
    ease: "back.out(1.6)",
    scrollTrigger: { trigger: ".steps", start: "top 78%", toggleActions: "play none none reverse" },
  });
  gsap.from(".cta .panel", {
    opacity: 0,
    y: 40,
    duration: 0.9,
    ease: "power2.out",
    scrollTrigger: { trigger: ".cta", start: "top 75%", toggleActions: "play none none reverse" },
  });

  function onLoad() {
    w.ScrollTrigger.refresh();
    if (prefersReducedMotion) return;
    const introTl = gsap.timeline({ delay: 0.1 });
    introTl
      .to(camera.position, { z: 16, duration: 1.9, ease: "power3.out" })
      .to(flash, { opacity: 0.55, duration: 0.1 }, 0.15)
      .to(flash, { opacity: 0, duration: 0.7 }, 0.25)
      .from(".kw", { opacity: 0, y: 30, rotateX: -50, duration: 0.7, stagger: 0.05, ease: "power3.out" }, 0.9)
      .from(".hero .sub, .hero-ctas, .scroll-cue", { opacity: 0, y: 20, duration: 0.7, stagger: 0.08, ease: "power2.out" }, 1.3);
  }
  if (document.readyState === "complete") {
    onLoad();
  } else {
    window.addEventListener("load", onLoad);
  }

  // --- Currency toggle + early-access form (second inline script) ---
  document.querySelectorAll(".currency-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".currency-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const region = (btn as HTMLElement).dataset.region;
      const indiaCard = document.querySelector(".region-india") as HTMLElement | null;
      const intlCard = document.querySelector(".region-intl") as HTMLElement | null;
      if (indiaCard) indiaCard.style.display = region === "india" ? "block" : "none";
      if (intlCard) intlCard.style.display = region === "intl" ? "block" : "none";
    });
  });

  const form = document.getElementById("signupForm") as HTMLFormElement | null;
  const errorEl = document.getElementById("formError");
  const submitBtn = document.getElementById("submitBtn") as HTMLButtonElement | null;
  const successState = document.getElementById("successState");
  const LEADS_URL = "/api/leads";

  function onSubmit(e: Event) {
    e.preventDefault();
    const name = (document.getElementById("name") as HTMLInputElement).value.trim();
    const email = (document.getElementById("email") as HTMLInputElement).value.trim();
    const message = (document.getElementById("message") as HTMLTextAreaElement).value.trim();
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (!name || !emailOk) {
      if (errorEl) {
        errorEl.textContent = "Please enter your name and a valid email.";
        (errorEl as HTMLElement).style.display = "block";
      }
      return;
    }
    if (errorEl) (errorEl as HTMLElement).style.display = "none";
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Submitting...";
    }

    fetch(LEADS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, message }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Something went wrong — please try again.");
        }
        if (form) form.style.display = "none";
        if (successState) successState.classList.add("show");
      })
      .catch((err) => {
        console.error("Submit error:", err);
        if (errorEl) {
          errorEl.textContent = err instanceof Error ? err.message : "Something went wrong — please try again.";
          (errorEl as HTMLElement).style.display = "block";
        }
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = "Get Early Access";
        }
      });
  }
  form?.addEventListener("submit", onSubmit);

  return function cleanup() {
    cancelAnimationFrame(rafId);
    window.removeEventListener("resize", onResize);
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("load", onLoad);
    if (cycleInterval) clearInterval(cycleInterval);
    scrollTriggers.forEach((t) => t.kill());
    form?.removeEventListener("submit", onSubmit);
    cursorDot?.remove();
    cursorRing?.remove();
    renderer.dispose();
  };
}
