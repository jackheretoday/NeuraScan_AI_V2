import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export function BrainCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const container = containerRef.current;
    const canvas = canvasRef.current;

    // 1. Initialize Scene, Camera, and Renderer
    const scene = new THREE.Scene();
    
    const width = container.clientWidth;
    const height = container.clientHeight;
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = 3.5;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true, // transparent background
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Create a group to hold all brain objects for easy rotation
    const brainGroup = new THREE.Group();
    scene.add(brainGroup);

    // 2. Procedural Brain Particle Generation
    const points: number[] = [];
    const colors: number[] = [];

    // Generate Cerebrum (Left and Right Hemispheres)
    const cerebrumCount = 2800;
    for (let i = 0; i < cerebrumCount; i++) {
      const isLeft = Math.random() > 0.5;
      const side = isLeft ? 1 : -1;

      // Spherical coordinates
      const u = Math.random() * Math.PI; // latitude
      const v = Math.random() * Math.PI * 2; // longitude

      // Base ellipsoid dimensions for a hemisphere
      const rx = 0.58;
      const ry = 0.68;
      const rz = 0.88;

      // Wrinkles (sulci and gyri) using sine/cosine combinations
      const wrinkle = 1.0 
        + 0.12 * Math.sin(7 * u) * Math.cos(7 * v) 
        + 0.04 * Math.sin(20 * u) * Math.cos(20 * v);

      // Coordinates
      let x = rx * Math.sin(u) * Math.cos(v) * wrinkle;
      let y = ry * Math.sin(u) * Math.sin(v) * wrinkle;
      let z = rz * Math.cos(u) * wrinkle;

      // Create a gap (longitudinal fissure) and shift hemispheres slightly outward
      x += side * 0.12;

      // Elongate and refine frontal/occipital shape
      // Front of brain (positive z) is slightly narrower, back (negative z) is wider
      const taper = 1.0 - 0.15 * z; // narrow at front, wider at back
      x *= taper;
      y *= (1.0 - 0.05 * z);

      points.push(x, y, z);

      // Gradient color based on position
      const zNorm = (z + 0.9) / 1.8; // 0 to 1
      const yNorm = (y + 0.7) / 1.4; // 0 to 1

      // Brand colors: Indigo (0.39, 0.40, 0.94), Cyan (0.02, 0.71, 0.84), Magenta/Purple (0.66, 0.33, 0.95)
      let r = 0.39, g = 0.40, b = 0.94;
      if (z > 0) {
        // Front is cyan-tinted
        const mix = zNorm; 
        r = r * (1 - mix) + 0.02 * mix;
        g = g * (1 - mix) + 0.71 * mix;
        b = b * (1 - mix) + 0.84 * mix;
      } else {
        // Back is magenta-tinted
        const mix = Math.abs(zNorm - 0.5) * 2;
        r = r * (1 - mix) + 0.66 * mix;
        g = g * (1 - mix) + 0.33 * mix;
        b = b * (1 - mix) + 0.95 * mix;
      }

      // Add bright cyan highlights on the top curves
      if (yNorm > 0.75) {
        const topMix = (yNorm - 0.75) / 0.25;
        r = r * (1 - topMix) + 0.05 * topMix;
        g = g * (1 - topMix) + 0.92 * topMix;
        b = b * (1 - topMix) + 0.95 * topMix;
      }

      // Make colors slightly darker (0.65) to look mysterious and high-tech
      const darkness = 0.65;
      colors.push(r * darkness, g * darkness, b * darkness);
    }

    // Generate Cerebellum (Lower back)
    const cerebellumCount = 700;
    for (let i = 0; i < cerebellumCount; i++) {
      const isLeft = Math.random() > 0.5;
      const side = isLeft ? 1 : -1;

      const u = Math.random() * Math.PI;
      const v = Math.random() * Math.PI * 2;

      // Sits underneath the occipital lobe (z < 0, y < 0)
      const rx = 0.32;
      const ry = 0.20;
      const rz = 0.30;

      // Cerebellum has very tight horizontal folds
      const fold = 1.0 + 0.06 * Math.sin(30 * u);

      let x = rx * Math.sin(u) * Math.cos(v) * fold;
      let y = ry * Math.sin(u) * Math.sin(v) * fold;
      let z = rz * Math.cos(u) * fold;

      // Position: bottom back
      x += side * 0.16;
      y += -0.42;
      z += -0.45;

      points.push(x, y, z);

      // Cerebellum is colored deep purple/indigo (darkened by 0.65)
      const darkness = 0.65;
      colors.push(0.48 * darkness, 0.24 * darkness, 0.88 * darkness);
    }

    // Generate Brainstem (Central bottom cylinder)
    const brainstemCount = 350;
    for (let i = 0; i < brainstemCount; i++) {
      const h = -0.40 - Math.random() * 0.35; // height extending downwards
      const theta = Math.random() * Math.PI * 2;
      
      // Brainstem cylinder radius (tapering down)
      const baseRadius = 0.11;
      const taper = 1.0 + (h + 0.40) * 0.4;
      const r = baseRadius * taper;

      const x = r * Math.cos(theta) + (Math.random() - 0.5) * 0.02;
      const y = h;
      const z = -0.15 + r * Math.sin(theta) + (Math.random() - 0.5) * 0.02;

      points.push(x, y, z);

      // Deep blue-indigo base color (darkened by 0.65)
      const darkness = 0.65;
      colors.push(0.25 * darkness, 0.30 * darkness, 0.78 * darkness);
    }

    // 3. Create Points Geometry & Material
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    // Custom glowing particle canvas texture
    const createParticleTexture = () => {
      const pCanvas = document.createElement('canvas');
      pCanvas.width = 16;
      pCanvas.height = 16;
      const ctx = pCanvas.getContext('2d');
      if (ctx) {
        const grad = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
        grad.addColorStop(0, 'rgba(255,255,255,1)');
        grad.addColorStop(0.3, 'rgba(255,255,255,0.8)');
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 16, 16);
      }
      const texture = new THREE.CanvasTexture(pCanvas);
      return texture;
    };

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.030, // slightly smaller particles
      vertexColors: true,
      transparent: true,
      opacity: 0.65, // darker/more transparent for volume look
      map: createParticleTexture(),
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particles = new THREE.Points(geometry, particleMaterial);
    brainGroup.add(particles);

    // 4. Generate Neural Lines Connecting Nearby Particles
    const linePositions: number[] = [];
    const lineColors: number[] = [];
    const maxLines = 800;
    let lineCount = 0;

    // Fast O(N) neighbor-linking using index proximity (spatial clustering as generated)
    const totalPoints = points.length / 3;
    for (let i = 0; i < totalPoints && lineCount < maxLines; i += 2) {
      const px = points[i * 3];
      const py = points[i * 3 + 1];
      const pz = points[i * 3 + 2];

      // Check nearby indices (since generated in spatial sequence, indices close together are close in space)
      const lookAhead = i < cerebrumCount ? 20 : 10;
      for (let j = i + 1; j < Math.min(i + lookAhead, totalPoints) && lineCount < maxLines; j++) {
        const qx = points[j * 3];
        const qy = points[j * 3 + 1];
        const qz = points[j * 3 + 2];

        const dx = px - qx;
        const dy = py - qy;
        const dz = pz - qz;
        const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);

        // Connect if close enough
        if (dist < 0.16) {
          linePositions.push(px, py, pz);
          linePositions.push(qx, qy, qz);

          // Get colors from original points
          lineColors.push(colors[i * 3], colors[i * 3 + 1], colors[i * 3 + 2]);
          lineColors.push(colors[j * 3], colors[j * 3 + 1], colors[j * 3 + 2]);

          lineCount++;
        }
      }
    }

    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
    lineGeometry.setAttribute('color', new THREE.Float32BufferAttribute(lineColors, 3));

    const lineMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.12, // dimmer connection lines
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
    brainGroup.add(lines);

    // 5. Interactive Mouse / Touch Drag Rotation
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let dragRotationSpeed = 0.005;

    // Handle mouse drag
    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      brainGroup.rotation.y += deltaX * dragRotationSpeed;
      brainGroup.rotation.x += deltaY * dragRotationSpeed;

      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    // Handle touch drag
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      isDragging = true;
      previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging || e.touches.length !== 1) return;
      const deltaX = e.touches[0].clientX - previousMousePosition.x;
      const deltaY = e.touches[0].clientY - previousMousePosition.y;

      brainGroup.rotation.y += deltaX * dragRotationSpeed;
      brainGroup.rotation.x += deltaY * dragRotationSpeed;

      previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };

    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    canvas.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onMouseUp);

    // 6. Animation Loop
    let animationFrameId = 0;
    
    // Slow continuous rotation
    const animate = () => {
      if (!isDragging) {
        brainGroup.rotation.y += 0.003;
      }
      
      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    // 7. Handle Resize
    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(container);

    // 8. Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();

      canvas.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);

      canvas.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onMouseUp);

      geometry.dispose();
      lineGeometry.dispose();
      particleMaterial.dispose();
      lineMaterial.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full relative select-none">
      <canvas ref={canvasRef} className="w-full h-full cursor-grab active:cursor-grabbing block" />
    </div>
  );
}
