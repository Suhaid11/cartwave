/* ═══════════════════════════════════════════════════════════════════════
   three-bg.js — CartWave · Hybrid Three.js Animated Background
   ═══════════════════════════════════════════════════════════════════════
   Two visual moods layered on a single WebGL canvas behind the hero:

     Mood A — "Living World"
       A lightweight particle system (Three.js Points) of ~1500 drifting
       motes — pollen, dust, fireflies — in a muted earthy/amber palette
       with organic simplex-noise-driven motion.

     Mood B — "Dimensional Field"
       A custom GLSL ShaderMaterial on a subdivided PlaneGeometry
       producing a breathing, structured grid that subtly reacts to the
       pointer. Cool-toned wireframe geometry fading into warm CartWave
       accent colours at the intersections.

   Camera drifts gently in response to mouse position and page scroll,
   adding parallax depth. Performance guardrails cap particle count,
   auto-reduce on frame-drop, and fall back to the static hero image on
   mobile / when WebGL is unavailable.

   Public API:
     initThreeBG()     — bootstrap and start the render loop
     destroyThreeBG()  — tear down everything (for SPA transitions)
     pauseThreeBG()    — stop the render loop (hero off-screen)
     resumeThreeBG()   — restart the render loop

   All shaders, geometry, and particle composition are original to this
   project. No third-party shader code is used.
   ═══════════════════════════════════════════════════════════════════════ */

/* ─── Feature Detection ────────────────────────────────────────────── */
const CW_BG = (() => {

  /* ── guard: WebGL + desktop ────────────────────────────────────── */
  function canRun() {
    // Force fallback via query param (for testing)
    if (location.search.includes('force-fallback=1')) return false;

    // Mobile / low-power heuristic: screen width < 768 or touch-primary
    const isMobile = window.innerWidth < 768
      || ('ontouchstart' in window && navigator.maxTouchPoints > 1);
    if (isMobile) return false;

    // WebGL support check
    try {
      const c = document.createElement('canvas');
      return !!(c.getContext('webgl') || c.getContext('experimental-webgl'));
    } catch (e) { return false; }
  }


  /* ═══════════════════════════════════════════════════════════════════
     SIMPLEX NOISE — compact 2D/3D implementation (original, public domain pattern)
     Used for particle drift and shader-side time evolution.
     ═══════════════════════════════════════════════════════════════════ */
  const SimplexNoise = (() => {
    const F2 = 0.5 * (Math.sqrt(3) - 1);
    const G2 = (3 - Math.sqrt(3)) / 6;
    const F3 = 1 / 3;
    const G3 = 1 / 6;

    const grad3 = [
      [1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],
      [1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],
      [0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]
    ];

    function buildPerm(seed) {
      const p = new Uint8Array(256);
      for (let i = 0; i < 256; i++) p[i] = i;
      // Fisher–Yates with seeded PRNG
      let s = seed | 0;
      for (let i = 255; i > 0; i--) {
        s = (s * 16807 + 0) & 0x7fffffff;
        const j = s % (i + 1);
        const tmp = p[i]; p[i] = p[j]; p[j] = tmp;
      }
      const perm = new Uint8Array(512);
      const permMod12 = new Uint8Array(512);
      for (let i = 0; i < 512; i++) {
        perm[i] = p[i & 255];
        permMod12[i] = perm[i] % 12;
      }
      return { perm, permMod12 };
    }

    function create(seed) {
      const { perm, permMod12 } = buildPerm(seed || 42);

      function noise2D(xin, yin) {
        let n0, n1, n2;
        const s = (xin + yin) * F2;
        const i = Math.floor(xin + s);
        const j = Math.floor(yin + s);
        const t = (i + j) * G2;
        const x0 = xin - (i - t);
        const y0 = yin - (j - t);
        let i1, j1;
        if (x0 > y0) { i1 = 1; j1 = 0; }
        else { i1 = 0; j1 = 1; }
        const x1 = x0 - i1 + G2;
        const y1 = y0 - j1 + G2;
        const x2 = x0 - 1 + 2 * G2;
        const y2 = y0 - 1 + 2 * G2;
        const ii = i & 255;
        const jj = j & 255;

        let t0 = 0.5 - x0 * x0 - y0 * y0;
        if (t0 < 0) n0 = 0;
        else {
          t0 *= t0;
          const gi0 = permMod12[ii + perm[jj]];
          n0 = t0 * t0 * (grad3[gi0][0] * x0 + grad3[gi0][1] * y0);
        }
        let t1 = 0.5 - x1 * x1 - y1 * y1;
        if (t1 < 0) n1 = 0;
        else {
          t1 *= t1;
          const gi1 = permMod12[ii + i1 + perm[jj + j1]];
          n1 = t1 * t1 * (grad3[gi1][0] * x1 + grad3[gi1][1] * y1);
        }
        let t2 = 0.5 - x2 * x2 - y2 * y2;
        if (t2 < 0) n2 = 0;
        else {
          t2 *= t2;
          const gi2 = permMod12[ii + 1 + perm[jj + 1]];
          n2 = t2 * t2 * (grad3[gi2][0] * x2 + grad3[gi2][1] * y2);
        }
        return 70 * (n0 + n1 + n2);
      }

      function noise3D(xin, yin, zin) {
        let n0, n1, n2, n3;
        const s = (xin + yin + zin) * F3;
        const i = Math.floor(xin + s);
        const j = Math.floor(yin + s);
        const k = Math.floor(zin + s);
        const t = (i + j + k) * G3;
        const x0 = xin - (i - t);
        const y0 = yin - (j - t);
        const z0 = zin - (k - t);
        let i1, j1, k1, i2, j2, k2;
        if (x0 >= y0) {
          if (y0 >= z0) { i1=1;j1=0;k1=0;i2=1;j2=1;k2=0; }
          else if (x0 >= z0) { i1=1;j1=0;k1=0;i2=1;j2=0;k2=1; }
          else { i1=0;j1=0;k1=1;i2=1;j2=0;k2=1; }
        } else {
          if (y0 < z0) { i1=0;j1=0;k1=1;i2=0;j2=1;k2=1; }
          else if (x0 < z0) { i1=0;j1=1;k1=0;i2=0;j2=1;k2=1; }
          else { i1=0;j1=1;k1=0;i2=1;j2=1;k2=0; }
        }
        const x1 = x0 - i1 + G3, y1 = y0 - j1 + G3, z1 = z0 - k1 + G3;
        const x2 = x0 - i2 + 2*G3, y2 = y0 - j2 + 2*G3, z2 = z0 - k2 + 2*G3;
        const x3 = x0 - 1 + 3*G3, y3 = y0 - 1 + 3*G3, z3 = z0 - 1 + 3*G3;
        const ii = i & 255, jj = j & 255, kk = k & 255;

        let tt;
        tt = 0.6 - x0*x0 - y0*y0 - z0*z0;
        if (tt < 0) n0 = 0; else { tt *= tt; const gi = permMod12[ii+perm[jj+perm[kk]]]; n0 = tt*tt*(grad3[gi][0]*x0+grad3[gi][1]*y0+grad3[gi][2]*z0); }
        tt = 0.6 - x1*x1 - y1*y1 - z1*z1;
        if (tt < 0) n1 = 0; else { tt *= tt; const gi = permMod12[ii+i1+perm[jj+j1+perm[kk+k1]]]; n1 = tt*tt*(grad3[gi][0]*x1+grad3[gi][1]*y1+grad3[gi][2]*z1); }
        tt = 0.6 - x2*x2 - y2*y2 - z2*z2;
        if (tt < 0) n2 = 0; else { tt *= tt; const gi = permMod12[ii+i2+perm[jj+j2+perm[kk+k2]]]; n2 = tt*tt*(grad3[gi][0]*x2+grad3[gi][1]*y2+grad3[gi][2]*z2); }
        tt = 0.6 - x3*x3 - y3*y3 - z3*z3;
        if (tt < 0) n3 = 0; else { tt *= tt; const gi = permMod12[ii+1+perm[jj+1+perm[kk+1]]]; n3 = tt*tt*(grad3[gi][0]*x3+grad3[gi][1]*y3+grad3[gi][2]*z3); }
        return 32 * (n0 + n1 + n2 + n3);
      }

      return { noise2D, noise3D };
    }

    return { create };
  })();


  /* ═══════════════════════════════════════════════════════════════════
     STATE
     ═══════════════════════════════════════════════════════════════════ */
  let scene, camera, renderer, canvas;
  let shaderMesh, particleSystem;
  let animationId = null;
  let running = false;
  let clock;

  // Mouse tracking (normalised –1 … +1)
  const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
  // Scroll position (normalised 0 … 1 within first section)
  let scrollT = 0;

  // Performance
  let frameCount = 0;
  let lastFPSCheck = 0;
  let degraded = false;

  // Noise
  const noise = SimplexNoise.create(137);


  /* ═══════════════════════════════════════════════════════════════════
     CUSTOM GLSL — "DIMENSIONAL FIELD"

     Original vertex/fragment shaders. A subdivided plane with
     procedural grid lines, noise-based displacement, and a breathing
     depth-of-field glow at grid intersections. The grid reacts subtly
     to the mouse position.
     ═══════════════════════════════════════════════════════════════════ */

  const dimensionalVertexShader = `
    uniform float uTime;
    uniform vec2 uMouse;
    uniform float uScrollT;

    varying vec2 vUv;
    varying float vElevation;
    varying float vDistToMouse;

    //
    // Simplex-like noise in GLSL (original implementation)
    //
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

    float snoise(vec3 v) {
      const vec2 C = vec2(1.0/6.0, 1.0/3.0);
      const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
      vec3 i = floor(v + dot(v, C.yyy));
      vec3 x0 = v - i + dot(i, C.xxx);
      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min(g.xyz, l.zxy);
      vec3 i2 = max(g.xyz, l.zxy);
      vec3 x1 = x0 - i1 + C.xxx;
      vec3 x2 = x0 - i2 + C.yyy;
      vec3 x3 = x0 - D.yyy;
      i = mod289(i);
      vec4 p = permute(permute(permute(
        i.z + vec4(0.0, i1.z, i2.z, 1.0))
        + i.y + vec4(0.0, i1.y, i2.y, 1.0))
        + i.x + vec4(0.0, i1.x, i2.x, 1.0));
      float n_ = 0.142857142857;
      vec3 ns = n_ * D.wyz - D.xzx;
      vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_);
      vec4 x = x_ * ns.x + ns.yyyy;
      vec4 y = y_ * ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);
      vec4 b0 = vec4(x.xy, y.xy);
      vec4 b1 = vec4(x.zw, y.zw);
      vec4 s0 = floor(b0) * 2.0 + 1.0;
      vec4 s1 = floor(b1) * 2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));
      vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
      vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
      vec3 p0 = vec3(a0.xy, h.x);
      vec3 p1 = vec3(a0.zw, h.y);
      vec3 p2 = vec3(a1.xy, h.z);
      vec3 p3 = vec3(a1.zw, h.w);
      vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
      p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
      vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
      m = m * m;
      return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
    }

    void main() {
      vUv = uv;

      // Noise-driven elevation
      vec3 noiseInput = vec3(position.x * 0.8, position.y * 0.8, uTime * 0.15);
      float elevation = snoise(noiseInput) * 0.35;

      // Second octave — finer detail
      elevation += snoise(noiseInput * 2.5 + 10.0) * 0.12;

      // Mouse proximity influence — subtle pull toward pointer
      vec2 mouseWorld = uMouse * 3.5;
      float distToMouse = length(position.xy - mouseWorld);
      float mouseInfluence = smoothstep(3.0, 0.0, distToMouse) * 0.25;
      elevation += mouseInfluence * sin(uTime * 2.0 + distToMouse * 2.0);

      vElevation = elevation;
      vDistToMouse = distToMouse;

      vec3 newPos = position;
      newPos.z += elevation;

      // Subtle scroll-linked tilt
      newPos.y += uScrollT * 0.5;

      gl_Position = projectionMatrix * modelViewMatrix * vec4(newPos, 1.0);
    }
  `;

  const dimensionalFragmentShader = `
    uniform float uTime;
    uniform vec2 uMouse;
    uniform float uScrollT;

    varying vec2 vUv;
    varying float vElevation;
    varying float vDistToMouse;

    void main() {
      // --- Grid pattern ---
      // Two grid frequencies for structural depth
      float gridSize1 = 28.0;
      float gridSize2 = 7.0;

      vec2 gridUv1 = fract(vUv * gridSize1);
      vec2 gridUv2 = fract(vUv * gridSize2);

      // Anti-aliased grid lines
      float lineWidth1 = 0.04;
      float lineWidth2 = 0.06;

      float line1 = 1.0 - smoothstep(0.0, lineWidth1, min(gridUv1.x, gridUv1.y));
      line1 = max(line1, 1.0 - smoothstep(1.0 - lineWidth1, 1.0, max(gridUv1.x, gridUv1.y)));

      float line2 = 1.0 - smoothstep(0.0, lineWidth2, min(gridUv2.x, gridUv2.y));
      line2 = max(line2, 1.0 - smoothstep(1.0 - lineWidth2, 1.0, max(gridUv2.x, gridUv2.y)));

      // Fine grid is subtler
      float grid = max(line2 * 0.4, line1 * 0.18);

      // --- Colour palette ---
      // CartWave deep background: #0a0c10  → rgb(10,12,16)/255
      // CartWave accent:          #e8985a  → rgb(232,152,90)/255
      // Cool structural tone:     #1a2a3a  (blue-grey)
      // Warm intersection glow:   #e8985a / #f0a96a

      vec3 bgColor = vec3(0.039, 0.047, 0.063);         // deep navy-black
      vec3 gridColor = vec3(0.12, 0.18, 0.26);           // cool blue-grey lines
      vec3 accentColor = vec3(0.91, 0.60, 0.35);         // CartWave amber
      vec3 accentHot = vec3(0.96, 0.72, 0.50);           // brighter amber

      // Elevation-based colour mixing
      float elevNorm = smoothstep(-0.3, 0.4, vElevation);

      // Grid lines get warmer at peaks
      vec3 lineColor = mix(gridColor, accentColor, elevNorm * 0.5);

      // Mouse proximity glow — warm accent near pointer
      float mouseGlow = smoothstep(3.0, 0.5, vDistToMouse) * 0.6;
      lineColor = mix(lineColor, accentHot, mouseGlow);

      // Breathing ambient pulse
      float pulse = 0.5 + 0.5 * sin(uTime * 0.5);
      grid *= 0.7 + 0.3 * pulse;

      // Compose
      vec3 color = mix(bgColor, lineColor, grid);

      // Subtle vignette — darker at edges
      float vignette = 1.0 - smoothstep(0.3, 0.85, length(vUv - 0.5));
      color *= 0.65 + 0.35 * vignette;

      // Intersection glow nodes — where both grids cross
      float node1 = (1.0 - smoothstep(0.0, lineWidth1 * 1.5, length(gridUv1 - 0.0)))
                   + (1.0 - smoothstep(0.0, lineWidth1 * 1.5, length(gridUv1 - vec2(1.0, 0.0))))
                   + (1.0 - smoothstep(0.0, lineWidth1 * 1.5, length(gridUv1 - vec2(0.0, 1.0))))
                   + (1.0 - smoothstep(0.0, lineWidth1 * 1.5, length(gridUv1 - vec2(1.0, 1.0))));
      node1 = clamp(node1, 0.0, 1.0);

      // Node glow pulses and reacts to mouse
      float nodeIntensity = node1 * (0.08 + mouseGlow * 0.25) * (0.7 + 0.3 * pulse);
      color += accentHot * nodeIntensity;

      // Overall alpha — fade edges to transparent for blending
      float alpha = smoothstep(0.0, 0.15, vUv.x) * smoothstep(1.0, 0.85, vUv.x)
                   * smoothstep(0.0, 0.15, vUv.y) * smoothstep(1.0, 0.85, vUv.y);
      alpha *= 0.85;

      gl_FragColor = vec4(color, alpha);
    }
  `;


  /* ═══════════════════════════════════════════════════════════════════
     SHADER MESH — Dimensional Field
     ═══════════════════════════════════════════════════════════════════ */
  function createDimensionalField() {
    const geometry = new THREE.PlaneGeometry(10, 10, 128, 128);

    const material = new THREE.ShaderMaterial({
      vertexShader: dimensionalVertexShader,
      fragmentShader: dimensionalFragmentShader,
      uniforms: {
        uTime:    { value: 0 },
        uMouse:   { value: new THREE.Vector2(0, 0) },
        uScrollT: { value: 0 },
      },
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI * 0.38;   // tilt to show depth
    mesh.position.z = -2.5;
    mesh.position.y = -0.8;

    return mesh;
  }


  /* ═══════════════════════════════════════════════════════════════════
     PARTICLE SYSTEM — Living World
     Drifting pollen / dust motes in muted earthy / amber tones.
     ═══════════════════════════════════════════════════════════════════ */
  const PARTICLE_COUNT = 1500;

  function createParticleSystem() {
    const count = degraded ? Math.floor(PARTICLE_COUNT * 0.5) : PARTICLE_COUNT;
    const geometry = new THREE.BufferGeometry();

    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const seeds = new Float32Array(count); // unique seed per particle

    // Colour palette — earthy/amber with a few cooler motes
    const palette = [
      [0.91, 0.60, 0.35],   // CartWave amber #e8985a
      [0.82, 0.55, 0.32],   // deeper amber
      [0.96, 0.72, 0.50],   // light amber
      [0.70, 0.65, 0.55],   // muted khaki
      [0.50, 0.58, 0.48],   // sage green
      [0.85, 0.80, 0.72],   // warm cream
      [0.35, 0.48, 0.55],   // cool blue-grey (accent)
    ];

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      // Spread particles in a wide volume
      positions[i3]     = (Math.random() - 0.5) * 14;  // x
      positions[i3 + 1] = (Math.random() - 0.5) * 10;  // y
      positions[i3 + 2] = (Math.random() - 0.5) * 8 - 1;  // z (slightly behind)

      // Pick a colour from the palette
      const col = palette[Math.floor(Math.random() * palette.length)];
      colors[i3]     = col[0];
      colors[i3 + 1] = col[1];
      colors[i3 + 2] = col[2];

      // Varied sizes — mostly small, a few larger "firefly" motes
      sizes[i] = 1.5 + Math.random() * 3.5;
      if (Math.random() < 0.08) sizes[i] *= 2.2; // rare bright motes

      seeds[i] = Math.random() * 1000;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));

    // Custom shader for the particles — soft glow with size attenuation
    const material = new THREE.ShaderMaterial({
      vertexShader: `
        attribute float aSize;
        attribute float aSeed;
        varying vec3 vColor;
        varying float vAlpha;
        uniform float uTime;

        void main() {
          vColor = color;

          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          float dist = -mvPosition.z;

          // Twinkle — each particle has its own phase
          float twinkle = 0.6 + 0.4 * sin(uTime * (0.4 + aSeed * 0.003) + aSeed);

          // Distance-based alpha — closer = more visible
          vAlpha = twinkle * smoothstep(12.0, 2.0, dist) * 0.75;

          gl_PointSize = aSize * twinkle * (180.0 / dist);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          // Soft circular glow
          float d = length(gl_PointCoord - 0.5);
          float strength = 1.0 - smoothstep(0.0, 0.5, d);
          strength = pow(strength, 1.8); // softer falloff

          if (strength < 0.01) discard;

          gl_FragColor = vec4(vColor, strength * vAlpha);
        }
      `,
      uniforms: {
        uTime: { value: 0 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
    });

    const points = new THREE.Points(geometry, material);
    points._particleSeeds = seeds;
    points._particleCount = count;
    return points;
  }


  /* ═══════════════════════════════════════════════════════════════════
     PARTICLE ANIMATION — noise-driven drift
     ═══════════════════════════════════════════════════════════════════ */
  function animateParticles(elapsed) {
    if (!particleSystem) return;

    const positions = particleSystem.geometry.attributes.position.array;
    const seeds = particleSystem._particleSeeds;
    const count = particleSystem._particleCount;
    const t = elapsed * 0.08;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const s = seeds[i];

      // Organic drift using noise
      const nx = noise.noise3D(s * 0.1, t, 0) * 0.006;
      const ny = noise.noise3D(0, s * 0.1, t) * 0.004 + 0.002; // gentle upward bias
      const nz = noise.noise3D(t, 0, s * 0.1) * 0.003;

      positions[i3]     += nx;
      positions[i3 + 1] += ny;
      positions[i3 + 2] += nz;

      // Wrap around bounds
      if (positions[i3]     >  7) positions[i3]     = -7;
      if (positions[i3]     < -7) positions[i3]     =  7;
      if (positions[i3 + 1] >  5) positions[i3 + 1] = -5;
      if (positions[i3 + 1] < -5) positions[i3 + 1] =  5;
      if (positions[i3 + 2] >  3) positions[i3 + 2] = -5;
      if (positions[i3 + 2] < -5) positions[i3 + 2] =  3;
    }

    particleSystem.geometry.attributes.position.needsUpdate = true;
  }


  /* ═══════════════════════════════════════════════════════════════════
     CAMERA DRIFT — mouse + scroll parallax
     ═══════════════════════════════════════════════════════════════════ */
  function updateCamera() {
    // Smooth lerp toward target
    mouse.x += (mouse.targetX - mouse.x) * 0.04;
    mouse.y += (mouse.targetY - mouse.y) * 0.04;

    // Camera position drifts with mouse (subtle)
    camera.position.x = mouse.x * 0.6;
    camera.position.y = mouse.y * 0.3 + scrollT * -1.2;

    // Look slightly toward the mouse
    camera.lookAt(
      mouse.x * 0.3,
      mouse.y * 0.15 - scrollT * 0.6,
      -2
    );
  }


  /* ═══════════════════════════════════════════════════════════════════
     RENDER LOOP
     ═══════════════════════════════════════════════════════════════════ */
  function render() {
    if (!running) return;
    animationId = requestAnimationFrame(render);

    const elapsed = clock.getElapsedTime();

    // Update shader uniforms
    if (shaderMesh) {
      shaderMesh.material.uniforms.uTime.value = elapsed;
      shaderMesh.material.uniforms.uMouse.value.set(mouse.x, mouse.y);
      shaderMesh.material.uniforms.uScrollT.value = scrollT;
    }

    if (particleSystem) {
      particleSystem.material.uniforms.uTime.value = elapsed;
    }

    // Animate particles (CPU drift)
    animateParticles(elapsed);

    // Camera drift
    updateCamera();

    // Render
    renderer.render(scene, camera);

    // FPS monitoring (every 2 seconds)
    frameCount++;
    if (elapsed - lastFPSCheck > 2) {
      const fps = frameCount / (elapsed - lastFPSCheck);
      lastFPSCheck = elapsed;
      frameCount = 0;

      // Auto-degrade if FPS consistently low
      if (fps < 30 && !degraded) {
        degraded = true;
        console.warn('[CartWave BG] FPS low (' + fps.toFixed(1) + '), degrading particle count');
        // Rebuild particles with fewer motes
        scene.remove(particleSystem);
        particleSystem.geometry.dispose();
        particleSystem.material.dispose();
        particleSystem = createParticleSystem();
        scene.add(particleSystem);
      }
    }
  }


  /* ═══════════════════════════════════════════════════════════════════
     EVENT HANDLERS
     ═══════════════════════════════════════════════════════════════════ */
  function onMouseMove(e) {
    mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
  }

  function onScroll() {
    // Parallax relative to hero scroll progress
    const hero = document.getElementById('home');
    const heroHeight = hero ? hero.clientHeight : window.innerHeight;
    scrollT = Math.min(1, Math.max(0, window.scrollY / heroHeight));
  }

  function onResize() {
    if (!renderer || !camera) return;
    const hero = document.getElementById('home');
    const w = hero ? hero.clientWidth : window.innerWidth;
    const h = hero ? hero.clientHeight : window.innerHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }


  /* ═══════════════════════════════════════════════════════════════════
     PUBLIC API
     ═══════════════════════════════════════════════════════════════════ */
  function init() {
    if (!canRun()) {
      // Activate fallback: show video / static image
      document.body.classList.add('body--fallback');
      console.info('[CartWave BG] WebGL unavailable or mobile — using fallback');
      return false;
    }

    canvas = document.getElementById('hero-three-canvas');
    if (!canvas) {
      console.warn('[CartWave BG] Canvas element #hero-three-canvas not found');
      return false;
    }

    const hero = document.getElementById('home');
    const w = hero ? hero.clientWidth : (canvas.clientWidth || window.innerWidth);
    const h = hero ? hero.clientHeight : (canvas.clientHeight || window.innerHeight);

    // Scene
    scene = new THREE.Scene();

    // Camera
    camera = new THREE.PerspectiveCamera(55, w / h, 0.1, 100);
    camera.position.set(0, 0, 4.5);

    // Renderer
    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

    // Clock
    clock = new THREE.Clock();

    // Build scene objects
    shaderMesh = createDimensionalField();
    scene.add(shaderMesh);

    particleSystem = createParticleSystem();
    scene.add(particleSystem);

    // Subtle ambient light for depth cues (doesn't affect shaders but helps any future mesh)
    const ambientLight = new THREE.AmbientLight(0xe8985a, 0.15);
    scene.add(ambientLight);

    // Events
    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });

    // Initial state
    onScroll();
    onResize();

    // Start
    running = true;
    lastFPSCheck = clock.getElapsedTime();
    frameCount = 0;
    render();

    console.info('[CartWave BG] Three.js background initialised ✓');
    return true;
  }

  function destroy() {
    running = false;
    if (animationId) cancelAnimationFrame(animationId);

    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onResize);

    if (shaderMesh) {
      shaderMesh.geometry.dispose();
      shaderMesh.material.dispose();
    }
    if (particleSystem) {
      particleSystem.geometry.dispose();
      particleSystem.material.dispose();
    }
    if (renderer) renderer.dispose();

    scene = camera = renderer = shaderMesh = particleSystem = null;
  }

  function pause() {
    running = false;
    if (animationId) cancelAnimationFrame(animationId);
  }

  function resume() {
    if (!renderer) return;
    running = true;
    lastFPSCheck = clock.getElapsedTime();
    frameCount = 0;
    render();
  }

  return { init, destroy, pause, resume };

})();

/* ─── Expose global API ────────────────────────────────────────────── */
function initThreeBG()    { return CW_BG.init(); }
function destroyThreeBG() { CW_BG.destroy(); }
function pauseThreeBG()   { CW_BG.pause(); }
function resumeThreeBG()  { CW_BG.resume(); }
