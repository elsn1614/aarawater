// ============================================================================
// ALLTOS 3D WATER BOTTLE STUDIO CUSTOMIZER (THREE.JS / WEBGL)
// High-Fidelity OEM Visualizer with Dynamic Proportions, Real-time Texture Canvas,
// Smooth Drag / Touch Controls, Studio Lighting & Automatic Reduced-Motion Support
// ============================================================================

(function () {
  'use strict';

  // Capacity proportions map (height ratio, radius ratio, neck taper, label height)
  const BOTTLE_SPECS = {
    '250 ML': { height: 3.2, radius: 0.95, neckLen: 0.65, labelH: 1.35, capScale: 0.95, volume: '250 ML', desc: 'Mini Pocket Bottle &bull; Ideal for Showrooms, Air Flights &amp; Welcome Hampers' },
    '330 ML': { height: 3.7, radius: 0.98, neckLen: 0.75, labelH: 1.55, capScale: 0.98, volume: '330 ML', desc: 'Compact Dining Bottle &bull; Preferred for Luxury Cafes, Dining &amp; VIP Lounges' },
    '500 ML': { height: 4.4, radius: 1.05, neckLen: 0.90, labelH: 1.85, capScale: 1.00, volume: '500 ML', desc: 'Standard Retail &amp; Event Size &bull; Most Popular for Corporate Summits &amp; Seminars' },
    '750 ML': { height: 5.1, radius: 1.15, neckLen: 1.05, labelH: 2.15, capScale: 1.04, volume: '750 ML', desc: 'Executive Dining Bottle &bull; Elegant Tabletop Presence for Banquets &amp; Galas' },
    '1 L':    { height: 5.8, radius: 1.25, neckLen: 1.15, labelH: 2.45, capScale: 1.08, volume: '1 Litre', desc: 'Full Capacity Bottle &bull; Excellent for Sports Meets, Festivals &amp; Temple Events' },
    '1.5 L':  { height: 6.6, radius: 1.38, neckLen: 1.25, labelH: 2.80, capScale: 1.12, volume: '1.5 Litre', desc: 'Family &amp; Catering Volume &bull; Bulk Dining Hydration &amp; Large Delegations' },
    '2 L':    { height: 7.3, radius: 1.50, neckLen: 1.35, labelH: 3.10, capScale: 1.15, volume: '2 Litre', desc: 'Jumbo Pallet Capacity &bull; Long Duration Sporting &amp; Community Gatherings' }
  };

  let currentCapacityKey = '500 ML';
  let companyBrandText = 'ALLTOS PREMIUM';
  let activePresetColor = '#06233F';
  let activePresetAccent = '#22C55E';
  let activePresetSubtext = 'Alkaline Drinking Water';

  // Three.js instances
  let scene, camera, renderer, bottleGroup, labelMesh, capMesh, bodyMesh, waterMesh;
  let labelCanvas, labelCtx, labelTexture;
  let animFrameId = null;
  let isDragging = false;
  let previousMouseX = 0;
  let userRotationVelocity = 0;
  let targetScaleY = 1.0;
  let currentScaleY = 1.0;
  let targetScaleXZ = 1.0;
  let currentScaleXZ = 1.0;
  let isWebGLAvailable = true;

  // Initialize once DOM is ready with guaranteed fallback safety
  function init3DBottleStudio() {
    const container = document.getElementById('bottle3dContainer');
    const fallbackEl = document.getElementById('bottle3dFallback');
    if (!container) return;

    // Check WebGL support safely
    try {
      const testCanvas = document.createElement('canvas');
      isWebGLAvailable = !!(window.WebGLRenderingContext && (testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl')));
    } catch (e) {
      isWebGLAvailable = false;
    }

    if (!isWebGLAvailable || typeof THREE === 'undefined') {
      if (fallbackEl) fallbackEl.style.display = 'block';
      container.style.display = 'none';
      return;
    }

    try {
      // 1. Setup Scene & Camera
      scene = new THREE.Scene();

      const width = container.clientWidth || 450;
      const height = container.clientHeight || 700;

      // Adjusted FOV and distance to display the entire bottle from cap to base
      camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 100);
      camera.position.set(0, 0.15, 11.2);

      // 2. Setup High-Performance Renderer
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.15;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      // Clear any previous canvas
      container.innerHTML = '';
      container.appendChild(renderer.domElement);

      // Hide fallback once 3D canvas successfully attached
      if (fallbackEl) fallbackEl.style.display = 'none';
    } catch (err) {
      console.warn('WebGL init error, falling back to static visual:', err);
      if (fallbackEl) fallbackEl.style.display = 'block';
      container.style.display = 'none';
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Clear any previous canvas
    const oldCanvas = container.querySelector('canvas');
    if (oldCanvas) oldCanvas.remove();
    container.appendChild(renderer.domElement);

    // 3. Studio Lighting System (DSLR Studio appearance)
    setupStudioLighting();

    // 4. Create Dynamic Label Canvas Texture
    createDynamicLabelTexture();

    // 5. Construct Bottle Geometry & Materials
    bottleGroup = new THREE.Group();
    buildProceduralBottle(BOTTLE_SPECS[currentCapacityKey]);
    scene.add(bottleGroup);

    // 6. Ground Studio Shadow Plane
    const shadowGeo = new THREE.PlaneGeometry(8, 8);
    const shadowMat = new THREE.ShadowMaterial({ opacity: 0.28 });
    const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -2.85;
    shadowPlane.receiveShadow = true;
    scene.add(shadowPlane);

    // 7. Bind Interactive Events (Touch, Mouse, UI buttons)
    bindStudioEvents(container);

    // 8. Animation Render Loop
    startAnimationLoop();

    // 9. Resize Observer
    window.addEventListener('resize', onWindowResize, { passive: true });
  }

  // Lighting configured like a beverage product photography studio
  function setupStudioLighting() {
    // Soft Ambient
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambientLight);

    // Key Light (warm studio fill)
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
    keyLight.position.set(4, 6, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 18;
    keyLight.shadow.bias = -0.001;
    scene.add(keyLight);

    // Rim / Backlight for translucent glass refraction look
    const rimLight = new THREE.DirectionalLight(0x73d9fa, 1.6);
    rimLight.position.set(-5, 4, -4);
    scene.add(rimLight);

    // Subtle Front Fill Light
    const fillLight = new THREE.DirectionalLight(0xfff7e6, 0.6);
    fillLight.position.set(0, -2, 5);
    scene.add(fillLight);

    // Overhead Accent Light
    const topLight = new THREE.PointLight(0xffffff, 0.9, 15);
    topLight.position.set(0, 5, 2);
    scene.add(topLight);
  }

  // Real-time Canvas Label Texture with High Resolution & Crisp Typography
  function createDynamicLabelTexture() {
    labelCanvas = document.createElement('canvas');
    labelCanvas.width = 1024;
    labelCanvas.height = 512;
    labelCtx = labelCanvas.getContext('2d');

    labelTexture = new THREE.CanvasTexture(labelCanvas);
    labelTexture.wrapS = THREE.ClampToEdgeWrapping;
    labelTexture.wrapT = THREE.ClampToEdgeWrapping;
    labelTexture.minFilter = THREE.LinearMipMapLinearFilter;
    labelTexture.magFilter = THREE.LinearFilter;
    labelTexture.generateMipmaps = true;

    updateLabelCanvasContent();
  }

  function updateLabelCanvasContent() {
    if (!labelCtx) return;

    const w = labelCanvas.width;
    const h = labelCanvas.height;

    // Background Gradient based on chosen palette
    const grad = labelCtx.createLinearGradient(0, 0, w, 0);
    grad.addColorStop(0, activePresetColor);
    grad.addColorStop(0.5, lightenDarkenColor(activePresetColor, 25));
    grad.addColorStop(1, activePresetColor);
    labelCtx.fillStyle = grad;
    labelCtx.fillRect(0, 0, w, h);

    // Top & Bottom Metallic Gold/Aqua Accent Borders
    labelCtx.fillStyle = activePresetAccent;
    labelCtx.fillRect(0, 0, w, 14);
    labelCtx.fillRect(0, h - 14, w, 14);

    // Elegant inner border
    labelCtx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    labelCtx.lineWidth = 3;
    labelCtx.strokeRect(30, 24, w - 60, h - 48);

    // Brand Watermark Icon (Water drop / globe representation)
    labelCtx.save();
    labelCtx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    labelCtx.beginPath();
    labelCtx.arc(w / 2, h / 2, 130, 0, Math.PI * 2);
    labelCtx.fill();
    labelCtx.restore();

    // Slogan Top
    labelCtx.font = '600 22px "Figtree", sans-serif';
    labelCtx.fillStyle = activePresetAccent;
    labelCtx.textAlign = 'center';
    labelCtx.textBaseline = 'middle';
    labelCtx.letterSpacing = '5px';
    labelCtx.fillText('ALLTOS OEM BOTTLING • ALL IS WELL', w / 2, 75);

    // Center Client Company Name (Dynamic)
    const displayName = (companyBrandText.trim() || 'YOUR COMPANY BRAND').toUpperCase();
    
    // Auto-scale font size if text is long
    let fontSize = 66;
    if (displayName.length > 18) fontSize = 48;
    if (displayName.length > 25) fontSize = 38;

    labelCtx.font = `800 ${fontSize}px "Bricolage Grotesque", sans-serif`;
    labelCtx.fillStyle = '#FFFFFF';
    labelCtx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    labelCtx.shadowBlur = 12;
    labelCtx.shadowOffsetX = 0;
    labelCtx.shadowOffsetY = 4;
    labelCtx.fillText(displayName, w / 2, h / 2 - 10);
    labelCtx.shadowBlur = 0;

    // Subtitle (Water Type & Chosen Capacity)
    labelCtx.font = '500 28px "Figtree", sans-serif';
    labelCtx.fillStyle = 'rgba(235, 245, 255, 0.92)';
    const capInfo = BOTTLE_SPECS[currentCapacityKey].volume;
    labelCtx.fillText(`${activePresetSubtext}  •  ${capInfo}`, w / 2, h / 2 + 55);

    // Bottom Nutrition & Quality Seal
    labelCtx.font = '600 18px "Figtree", sans-serif';
    labelCtx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    labelCtx.fillText('★ PURE REFRESHING TASTE • CERTIFIED LAB-TESTED QUALITY • SINGAPORE & MALAYSIA ★', w / 2, h - 55);

    if (labelTexture) {
      labelTexture.needsUpdate = true;
    }
  }

  // Helper color adjuster for dynamic gradients
  function lightenDarkenColor(col, amt) {
    let usePound = false;
    if (col[0] === '#') {
      col = col.slice(1);
      usePound = true;
    }
    const num = parseInt(col, 16);
    let r = (num >> 16) + amt;
    let b = ((num >> 8) & 0x00FF) + amt;
    let g = (num & 0x0000FF) + amt;
    r = Math.min(255, Math.max(0, r));
    b = Math.min(255, Math.max(0, b));
    g = Math.min(255, Math.max(0, g));
    return (usePound ? '#' : '') + (g | (b << 8) | (r << 16)).toString(16).padStart(6, '0');
  }

  // Construct Realistic Bottle Meshes (PET Plastic, Inner Water, Label, Ribbed Cap)
  function buildProceduralBottle(spec) {
    // Clear previous children
    while (bottleGroup.children.length > 0) {
      const obj = bottleGroup.children[0];
      if (obj.geometry) obj.geometry.dispose();
      bottleGroup.remove(obj);
    }

    const totalH = spec.height;
    const rad = spec.radius;
    const bodyH = totalH * 0.62;
    const shoulderH = totalH * 0.22;
    const neckH = totalH * 0.16;

    // --- 1. Realistic PET Transparent Plastic Body ---
    // Smooth Lathe profile for authentic ergonomic bottle curves
    const points = [];
    const segments = 48;

    // Bottom base with slight push-up dome (typical PET water bottle)
    points.push(new THREE.Vector2(0, -totalH / 2));
    points.push(new THREE.Vector2(rad * 0.5, -totalH / 2 + 0.08));
    points.push(new THREE.Vector2(rad * 0.9, -totalH / 2 + 0.15));
    points.push(new THREE.Vector2(rad, -totalH / 2 + 0.35));

    // Main Cylindrical Body with subtle ergonomic grip indentations
    points.push(new THREE.Vector2(rad, -totalH / 2 + bodyH * 0.3));
    points.push(new THREE.Vector2(rad * 0.96, -totalH / 2 + bodyH * 0.45));
    points.push(new THREE.Vector2(rad * 0.96, -totalH / 2 + bodyH * 0.65));
    points.push(new THREE.Vector2(rad, -totalH / 2 + bodyH * 0.8));
    points.push(new THREE.Vector2(rad, -totalH / 2 + bodyH));

    // Smooth Shoulder Taper
    points.push(new THREE.Vector2(rad * 0.85, -totalH / 2 + bodyH + shoulderH * 0.4));
    points.push(new THREE.Vector2(rad * 0.55, -totalH / 2 + bodyH + shoulderH * 0.75));
    points.push(new THREE.Vector2(rad * 0.34, -totalH / 2 + bodyH + shoulderH));

    // Neck & Thread Lip
    points.push(new THREE.Vector2(rad * 0.32, totalH / 2 - 0.25));
    points.push(new THREE.Vector2(rad * 0.35, totalH / 2 - 0.20)); // Collar ring
    points.push(new THREE.Vector2(rad * 0.30, totalH / 2 - 0.10));
    points.push(new THREE.Vector2(rad * 0.30, totalH / 2));

    const bottleGeo = new THREE.LatheGeometry(points, segments);
    bottleGeo.computeVertexNormals();

    // High Quality Physical PET Plastic Material (Clear, Refractive, Shiny)
    const plasticMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.94,       // High clarity glass/PET transmission
      opacity: 1.0,
      transparent: true,
      roughness: 0.08,          // Polished high-gloss surface
      metalness: 0.02,
      ior: 1.45,                // PET Index of Refraction
      reflectivity: 0.85,
      clearcoat: 1.0,           // Automotive/product shine
      clearcoatRoughness: 0.04,
      attenuationColor: new THREE.Color(0xd7f4fc),
      attenuationDistance: 4.5,
      side: THREE.DoubleSide
    });

    bodyMesh = new THREE.Mesh(bottleGeo, plasticMaterial);
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    bottleGroup.add(bodyMesh);

    // --- 2. Inner Crystal Clear Water Volume ---
    const waterPoints = points.slice(0, points.length - 2).map(p => new THREE.Vector2(p.x * 0.965, p.y * 0.98));
    const waterGeo = new THREE.LatheGeometry(waterPoints, segments);
    const waterMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x2ecbf0,
      transmission: 0.88,
      transparent: true,
      opacity: 0.75,
      roughness: 0.04,
      ior: 1.333,               // Water IOR
      attenuationColor: new THREE.Color(0x50d4f2),
      attenuationDistance: 2.2
    });
    waterMesh = new THREE.Mesh(waterGeo, waterMaterial);
    waterMesh.position.y = -0.05;
    bottleGroup.add(waterMesh);

    // --- 3. Wrapped Cylindrical Product Label ---
    const labelH = spec.labelH;
    const labelRad = rad * 1.008; // Wrap seamlessly on exterior surface
    const labelGeo = new THREE.CylinderGeometry(labelRad, labelRad, labelH, segments, 1, true, -Math.PI * 0.75, Math.PI * 1.5);
    labelGeo.rotateY(Math.PI / 2); // Center front face towards initial viewpoint

    const labelMaterial = new THREE.MeshStandardMaterial({
      map: labelTexture,
      roughness: 0.35,          // Glossy coated label paper
      metalness: 0.15,
      side: THREE.FrontSide,
      transparent: false
    });

    labelMesh = new THREE.Mesh(labelGeo, labelMaterial);
    // Position label vertically at ergonomic mid-body section
    labelMesh.position.y = -totalH / 2 + bodyH * 0.52;
    bottleGroup.add(labelMesh);

    // --- 4. Premium Ribbed Bottle Cap ---
    const capRad = rad * 0.34;
    const capH = 0.42 * spec.capScale;
    const capGeo = new THREE.CylinderGeometry(capRad, capRad * 1.02, capH, 36);
    const capMaterial = new THREE.MeshStandardMaterial({
      color: 0x063560,
      roughness: 0.32,
      metalness: 0.25
    });

    capMesh = new THREE.Mesh(capGeo, capMaterial);
    capMesh.position.y = totalH / 2 + capH * 0.45;
    capMesh.castShadow = true;
    bottleGroup.add(capMesh);

    // Center whole bottle vertically on viewport
    bottleGroup.position.y = -0.15;
  }

  // Smooth resize transition between capacities
  function setBottleCapacity(sizeKey) {
    if (!BOTTLE_SPECS[sizeKey]) return;
    currentCapacityKey = sizeKey;
    const targetSpec = BOTTLE_SPECS[sizeKey];

    // Smoothly reconstruct and scale
    buildProceduralBottle(targetSpec);
    updateLabelCanvasContent();

    // Update active UI elements
    const sizeButtons = document.querySelectorAll('.size-select-btn');
    sizeButtons.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-size') === sizeKey);
    });

    const readout = document.getElementById('selectedCapacityReadout');
    if (readout) readout.innerHTML = `<strong>${sizeKey}</strong> &bull; ${targetSpec.volume}`;

    const descEl = document.getElementById('selectedSizeDescription');
    if (descEl) descEl.innerHTML = targetSpec.desc;
  }

  // Bind Mouse & Touch Drag Controls for 360° smooth manual inspection
  function bindStudioEvents(container) {
    let lastTime = 0;

    // Mouse Events
    container.addEventListener('mousedown', function (e) {
      isDragging = true;
      previousMouseX = e.clientX;
      userRotationVelocity = 0;
      container.style.cursor = 'grabbing';
    });

    window.addEventListener('mouseup', function () {
      if (isDragging) {
        isDragging = false;
        container.style.cursor = 'grab';
      }
    });

    window.addEventListener('mousemove', function (e) {
      if (!isDragging || !bottleGroup) return;
      const deltaX = e.clientX - previousMouseX;
      previousMouseX = e.clientX;
      bottleGroup.rotation.y += deltaX * 0.012;
      userRotationVelocity = deltaX * 0.003;
    });

    // Mobile Touch Events
    container.addEventListener('touchstart', function (e) {
      if (e.touches.length === 1) {
        isDragging = true;
        previousMouseX = e.touches[0].clientX;
        userRotationVelocity = 0;
      }
    }, { passive: true });

    window.addEventListener('touchend', function () {
      isDragging = false;
    }, { passive: true });

    window.addEventListener('touchmove', function (e) {
      if (!isDragging || !bottleGroup || e.touches.length !== 1) return;
      const deltaX = e.touches[0].clientX - previousMouseX;
      previousMouseX = e.touches[0].clientX;
      bottleGroup.rotation.y += deltaX * 0.014;
      userRotationVelocity = deltaX * 0.003;
    }, { passive: true });

    // Live Company Name Input Customizer
    const nameInput = document.getElementById('customCompanyNameInput');
    if (nameInput) {
      nameInput.addEventListener('input', function () {
        companyBrandText = this.value;
        updateLabelCanvasContent();
      });
    }

    // Size Selection Buttons
    const sizeBtns = document.querySelectorAll('.size-select-btn');
    sizeBtns.forEach(btn => {
      btn.addEventListener('click', function () {
        const size = this.getAttribute('data-size');
        setBottleCapacity(size);
      });
    });

    // Label Theme Preset Chips
    const presetChips = document.querySelectorAll('.label-preset-chip');
    presetChips.forEach(chip => {
      chip.addEventListener('click', function () {
        presetChips.forEach(c => c.classList.remove('active'));
        this.classList.add('active');

        activePresetColor = this.getAttribute('data-color') || '#06233F';
        activePresetAccent = this.getAttribute('data-accent') || '#4FD1E8';
        activePresetSubtext = this.getAttribute('data-sub') || 'Alkaline Drinking Water';

        // Update cap color to match theme
        if (capMesh && capMesh.material) {
          capMesh.material.color.set(activePresetColor);
        }

        updateLabelCanvasContent();
      });
    });

    // Manual Quick Spin Button
    const spinBtn = document.getElementById('quickSpinBtn');
    if (spinBtn) {
      spinBtn.addEventListener('click', function () {
        userRotationVelocity += 0.08;
      });
    }

    // Reset View Button
    const resetBtn = document.getElementById('resetViewBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        if (bottleGroup) {
          bottleGroup.rotation.y = 0;
          userRotationVelocity = 0;
        }
      });
    }
  }

  // Animation Loop with Smooth Slow Y-axis Rotation & Physics Decay
  function startAnimationLoop() {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const baseRotationSpeed = prefersReduced ? 0 : 0.0045; // Gentle, elegant rotation

    function animate() {
      animFrameId = requestAnimationFrame(animate);

      if (bottleGroup) {
        if (!isDragging) {
          // Automatic continuous rotation + decay of manual drag velocity
          bottleGroup.rotation.y += baseRotationSpeed + userRotationVelocity;
          userRotationVelocity *= 0.95; // Smooth friction decay
          if (Math.abs(userRotationVelocity) < 0.0001) userRotationVelocity = 0;
        }
      }

      if (renderer && scene && camera) {
        renderer.render(scene, camera);
      }
    }

    animate();
  }

  // Resize handler
  function onWindowResize() {
    const container = document.getElementById('bottle3dContainer');
    if (!container || !renderer || !camera) return;

    const width = container.clientWidth || 450;
    const height = container.clientHeight || 700;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }

  // IntersectionObserver to only render WebGL when visible (Optimized performance)
  function setupLazyRendering() {
    const container = document.getElementById('bottle3dContainer');
    if (!container) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          if (!renderer) {
            init3DBottleStudio();
          } else if (!animFrameId) {
            startAnimationLoop();
          }
        } else {
          if (animFrameId) {
            cancelAnimationFrame(animFrameId);
            animFrameId = null;
          }
        }
      });
    }, { threshold: 0.1 });

    const studioSection = document.getElementById('bottle-customizer');
    if (studioSection) {
      observer.observe(studioSection);
    } else {
      init3DBottleStudio();
    }
  }

  // Run when document is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupLazyRendering);
  } else {
    setupLazyRendering();
  }
})();
