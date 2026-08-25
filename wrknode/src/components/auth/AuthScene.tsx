"use client";

import { useEffect, useRef } from "react";
import { loadScript } from "@/lib/loadScript";

const THREE_SRC = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";

// A self-contained, idly-rotating version of the landing page's node-cluster
// scene (icosahedron core, orbiters, particle field) — no scroll-driven
// camera moves here, just ambient motion behind the auth forms.
export default function AuthScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let cancelled = false;
    let cleanup: (() => void) | undefined;

    (async () => {
      await loadScript(THREE_SRC);
      if (cancelled || !containerRef.current || !canvasRef.current) return;

      const w = window as any;
      const THREE = w.THREE;
      const container = containerRef.current;
      const canvas = canvasRef.current;
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x0b0f1e, 0.035);

      const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 200);
      camera.position.set(0, 0, 20);

      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      scene.add(new THREE.AmbientLight(0x404868, 0.8));
      const brassLight = new THREE.PointLight(0xc9a24b, 2.2, 100);
      brassLight.position.set(4, 6, 10);
      scene.add(brassLight);
      const rimLight = new THREE.PointLight(0x9ba0bc, 0.6, 60);
      rimLight.position.set(-8, -4, 6);
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

      const cluster = new THREE.Group();

      const coreGeo = new THREE.IcosahedronGeometry(3.1, 1);
      const coreMat = new THREE.MeshStandardMaterial({
        color: 0xc9a24b,
        emissive: 0xc9a24b,
        emissiveIntensity: 0.45,
        flatShading: true,
        metalness: 0.3,
        roughness: 0.35,
      });
      const core = new THREE.Mesh(coreGeo, coreMat);
      core.add(makeGlowSprite(15));
      cluster.add(core);

      const ring1 = new THREE.Mesh(
        new THREE.TorusGeometry(5.8, 0.045, 8, 64),
        new THREE.MeshBasicMaterial({ color: 0xc9a24b, transparent: true, opacity: 0.4 })
      );
      ring1.rotation.x = Math.PI / 2.3;
      const ring2 = new THREE.Mesh(
        new THREE.TorusGeometry(7.4, 0.035, 8, 64),
        new THREE.MeshBasicMaterial({ color: 0xe4ce93, transparent: true, opacity: 0.25 })
      );
      ring2.rotation.x = Math.PI / 1.8;
      ring2.rotation.y = 0.4;
      cluster.add(ring1, ring2);

      const orbiterGeo = new THREE.IcosahedronGeometry(0.36, 0);
      const orbiterMat = new THREE.MeshStandardMaterial({
        color: 0xe4ce93,
        emissive: 0xe4ce93,
        emissiveIntensity: 0.35,
        flatShading: true,
      });
      const lineMat = new THREE.LineBasicMaterial({ color: 0xc9a24b, transparent: true, opacity: 0.32 });
      const pivots: any[] = [];
      const orbiterCount = prefersReducedMotion ? 4 : 10;
      for (let i = 0; i < orbiterCount; i++) {
        const pivot = new THREE.Object3D();
        pivot.rotation.x = Math.random() * Math.PI;
        pivot.rotation.z = Math.random() * Math.PI;
        const radius = 5.4 + Math.random() * 4;
        const orbiter = new THREE.Mesh(orbiterGeo, orbiterMat);
        orbiter.position.x = radius;
        pivot.add(orbiter);
        const lineGeo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(radius, 0, 0),
        ]);
        pivot.add(new THREE.Line(lineGeo, lineMat));
        pivot.userData.speed = 0.25 + Math.random() * 0.4;
        cluster.add(pivot);
        pivots.push(pivot);
      }
      scene.add(cluster);

      const particleCount = prefersReducedMotion ? 150 : 500;
      const positions = new Float32Array(particleCount * 3);
      for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 50;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 40;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 50 - 10;
      }
      const particleGeo = new THREE.BufferGeometry();
      particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      const particleMat = new THREE.PointsMaterial({ color: 0xadb4cc, size: 0.1, transparent: true, opacity: 0.5 });
      scene.add(new THREE.Points(particleGeo, particleMat));

      function resize() {
        const { width, height } = container.getBoundingClientRect();
        if (width === 0 || height === 0) return;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
      }
      resize();
      const resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(container);

      let pointerX = 0;
      let pointerY = 0;
      function onPointerMove(e: PointerEvent) {
        const rect = container.getBoundingClientRect();
        pointerX = (e.clientX - rect.left) / rect.width - 0.5;
        pointerY = (e.clientY - rect.top) / rect.height - 0.5;
      }
      window.addEventListener("pointermove", onPointerMove);

      const clock = new THREE.Clock();
      let rafId = 0;
      function animate() {
        rafId = requestAnimationFrame(animate);
        const delta = Math.min(clock.getDelta(), 0.05);
        const elapsed = clock.getElapsedTime();

        cluster.rotation.y += 0.06 * delta;
        cluster.rotation.x = Math.sin(elapsed * 0.15) * 0.08;
        ring1.rotation.z += 0.16 * delta;
        ring2.rotation.z -= 0.12 * delta;
        coreMat.emissiveIntensity = 0.45 + Math.sin(elapsed * 1.1) * 0.15;
        core.scale.setScalar(1 + Math.sin(elapsed * 1.1) * 0.04);
        pivots.forEach((p) => (p.rotation.y += p.userData.speed * delta));

        if (!prefersReducedMotion) {
          camera.position.x += (pointerX * 4 - camera.position.x) * 0.03;
          camera.position.y += (-pointerY * 3 - camera.position.y) * 0.03;
        }
        camera.lookAt(0, 0, 0);

        renderer.render(scene, camera);
      }
      animate();

      cleanup = () => {
        cancelAnimationFrame(rafId);
        resizeObserver.disconnect();
        window.removeEventListener("pointermove", onPointerMove);
        renderer.dispose();
      };
    })();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0">
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
