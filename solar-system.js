// Solar System 3D Simulation with Three.js - Enhanced Version
class SolarSystem {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.clock = new THREE.Clock();
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        
        // Solar system objects
        this.sun = null;
        this.planets = [];
        this.planetData = [];
        this.planetMeshes = []; // For raycasting
        
        // Animation and control variables
        this.animationId = null;
        this.speedMultipliers = {};
        this.isPaused = false;
        this.isLightMode = false;
        
        // Tooltip and interaction
        this.tooltip = document.getElementById('planet-tooltip');
        this.hoveredPlanet = null;
        
        this.init();
        this.setupControls();
        this.setupEventListeners();
        this.animate();
    }
    
    init() {
        // Create scene
        this.scene = new THREE.Scene();
        this.updateSceneBackground();
        
        // Create camera
        this.camera = new THREE.PerspectiveCamera(
            75, 
            window.innerWidth / window.innerHeight, 
            0.1, 
            10000
        );
        this.camera.position.set(0, 50, 100);
        
        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: true 
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Add renderer to DOM
        document.getElementById('canvas-container').appendChild(this.renderer.domElement);
        
        // Setup orbit controls
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 20;
        this.controls.maxDistance = 500;
        
        // Create lighting
        this.setupLighting();
        
        // Create solar system
        this.createSolarSystem();
        
        // Add stars background (enhanced)
        this.createStarField();
        
        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());
        
        // Store reference globally
        window.solarSystem = this;
    }
    
    updateSceneBackground() {
        if (this.isLightMode) {
            this.scene.background = new THREE.Color(0x87ceeb); // Sky blue for light mode
        } else {
            this.scene.background = new THREE.Color(0x000011); // Dark space
        }
    }
    
    setupLighting() {
        // Clear existing lights
        const lights = this.scene.children.filter(child => child.isLight);
        lights.forEach(light => this.scene.remove(light));
        
        // Ambient light for general illumination
        const ambientIntensity = this.isLightMode ? 0.3 : 0.1;
        const ambientLight = new THREE.AmbientLight(0x404040, ambientIntensity);
        this.scene.add(ambientLight);
        
        // Point light from the sun
        const sunLightIntensity = this.isLightMode ? 1.5 : 2;
        const sunLight = new THREE.PointLight(0xffffff, sunLightIntensity, 1000);
        sunLight.position.set(0, 0, 0);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        this.scene.add(sunLight);
    }
    
    createSolarSystem() {
        // Enhanced planet data with real information
        this.planetData = [
            {
                name: 'mercury',
                radius: 0.8,
                distance: 15,
                speed: 0.047,
                color: 0x8c7853,
                rotationSpeed: 0.01,
                realDistance: 0.39, // AU
                realPeriod: 88, // days
                realRadius: 2439 // km
            },
            {
                name: 'venus',
                radius: 1.2,
                distance: 22,
                speed: 0.035,
                color: 0xffc649,
                rotationSpeed: 0.008,
                realDistance: 0.72,
                realPeriod: 225,
                realRadius: 6052
            },
            {
                name: 'earth',
                radius: 1.3,
                distance: 30,
                speed: 0.03,
                color: 0x6b93d6,
                rotationSpeed: 0.02,
                realDistance: 1.0,
                realPeriod: 365,
                realRadius: 6371
            },
            {
                name: 'mars',
                radius: 1.0,
                distance: 40,
                speed: 0.024,
                color: 0xc1440e,
                rotationSpeed: 0.018,
                realDistance: 1.52,
                realPeriod: 687,
                realRadius: 3390
            },
            {
                name: 'jupiter',
                radius: 4.0,
                distance: 65,
                speed: 0.013,
                color: 0xd8ca9d,
                rotationSpeed: 0.04,
                realDistance: 5.2,
                realPeriod: 4333,
                realRadius: 69911
            },
            {
                name: 'saturn',
                radius: 3.5,
                distance: 85,
                speed: 0.009,
                color: 0xfad5a5,
                rotationSpeed: 0.038,
                realDistance: 9.5,
                realPeriod: 10759,
                realRadius: 58232
            },
            {
                name: 'uranus',
                radius: 2.5,
                distance: 105,
                speed: 0.005,
                color: 0x4fd0e7,
                rotationSpeed: 0.03,
                realDistance: 19.2,
                realPeriod: 30687,
                realRadius: 25362
            },
            {
                name: 'neptune',
                radius: 2.4,
                distance: 125,
                speed: 0.005,
                color: 0x4b70dd,
                rotationSpeed: 0.032,
                realDistance: 30.1,
                realPeriod: 60190,
                realRadius: 24622
            }
        ];
        
        // Create the Sun
        this.createSun();
        
        // Create planets
        this.planetData.forEach((data, index) => {
            this.createPlanet(data, index);
        });
        
        // Initialize speed multipliers
        this.planetData.forEach(planet => {
            this.speedMultipliers[planet.name] = 1.0;
        });
    }
    
    createSun() {
        const sunGeometry = new THREE.SphereGeometry(5, 32, 32);
        const sunMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xffff00,
            emissive: 0xffaa00,
            emissiveIntensity: 0.3
        });
        
        this.sun = new THREE.Mesh(sunGeometry, sunMaterial);
        this.sun.position.set(0, 0, 0);
        this.sun.userData = {
            name: 'sun',
            realRadius: 695700,
            info: 'The Sun - Our solar system\'s star'
        };
        this.scene.add(this.sun);
        
        // Add sun glow effect
        const glowGeometry = new THREE.SphereGeometry(7, 32, 32);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xffaa00,
            transparent: true,
            opacity: 0.3
        });
        const sunGlow = new THREE.Mesh(glowGeometry, glowMaterial);
        this.sun.add(sunGlow);
        
        // Add sun to clickable objects
        this.planetMeshes.push(this.sun);
    }
    
    createPlanet(data, index) {
        // Create planet geometry and material
        const planetGeometry = new THREE.SphereGeometry(data.radius, 352, 352);
        const planetMaterial = new THREE.MeshLambertMaterial({ 
            color: data.color 
        });
        
        const planet = new THREE.Mesh(planetGeometry, planetMaterial);
        planet.castShadow = true;
        planet.receiveShadow = true;
        
        // Create orbit group for rotation around sun
        const orbitGroup = new THREE.Group();
        orbitGroup.add(planet);
        
        // Position planet at its orbital distance
        planet.position.x = data.distance;
        
        // Store references and real data
        planet.userData = {
            name: data.name,
            orbitSpeed: data.speed,
            rotationSpeed: data.rotationSpeed,
            distance: data.distance,
            angle: Math.random() * Math.PI * 2, // Random starting position
            realDistance: data.realDistance,
            realPeriod: data.realPeriod,
            realRadius: data.realRadius,
            displayName: data.name.charAt(0).toUpperCase() + data.name.slice(1)
        };
        
        orbitGroup.userData = {
            planet: planet,
            name: data.name
        };
        
        this.scene.add(orbitGroup);
        this.planets.push(orbitGroup);
        this.planetMeshes.push(planet);
        
        // Create orbital path visualization
        this.createOrbitPath(data.distance);
        
        // Add special features for certain planets
        if (data.name === 'saturn') {
            this.addSaturnRings(planet);
        }
        
        if (data.name === 'earth') {
            this.addEarthMoon(orbitGroup);
        }
    }
    
    createOrbitPath(distance) {
        const orbitGeometry = new THREE.RingGeometry(distance - 0.1, distance + 0.1, 64);
        const orbitMaterial = new THREE.MeshBasicMaterial({
            color: this.isLightMode ? 0x888888 : 0x444444,
            transparent: true,
            opacity: this.isLightMode ? 0.2 : 0.1,
            side: THREE.DoubleSide
        });
        
        const orbitRing = new THREE.Mesh(orbitGeometry, orbitMaterial);
        orbitRing.rotation.x = Math.PI / 2;
        this.scene.add(orbitRing);
    }
    
    addSaturnRings(planet) {
        const ringGeometry = new THREE.RingGeometry(4.5, 7, 32);
        const ringMaterial = new THREE.MeshLambertMaterial({
            color: 0xaaaaaa,
            transparent: true,
            opacity: 0.6,
            side: THREE.DoubleSide
        });
        
        const rings = new THREE.Mesh(ringGeometry, ringMaterial);
        rings.rotation.x = Math.PI / 2;
        planet.add(rings);
    }
    
    addEarthMoon(earthOrbit) {
        const moonGeometry = new THREE.SphereGeometry(0.3, 16, 16);
        const moonMaterial = new THREE.MeshLambertMaterial({ color: 0xcccccc });
        const moon = new THREE.Mesh(moonGeometry, moonMaterial);
        
        const moonOrbit = new THREE.Group();
        moonOrbit.add(moon);
        moon.position.x = 3;
        
        moon.userData = {
            name: 'moon',
            orbitSpeed: 0.1,
            angle: 0,
            displayName: 'Moon',
            realRadius: 1737,
            realDistance: 0.00257 // AU from Earth
        };
        
        earthOrbit.add(moonOrbit);
        earthOrbit.userData.moon = moonOrbit;
        this.planetMeshes.push(moon);
    }
    
    createStarField() {
        const starGeometry = new THREE.BufferGeometry();
        const starCount = this.isLightMode ? 5000 : 15000; // Fewer stars in light mode
        const positions = new Float32Array(starCount * 3);
        
        for (let i = 0; i < starCount * 3; i += 3) {
            positions[i] = (Math.random() - 0.5) * 2000;
            positions[i + 1] = (Math.random() - 0.5) * 2000;
            positions[i + 2] = (Math.random() - 0.5) * 2000;
        }
        
        starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const starMaterial = new THREE.PointsMaterial({
            color: this.isLightMode ? 0x666666 : 0xffffff,
            size: this.isLightMode ? 1 : 2,
            sizeAttenuation: false
        });
        
        // Remove existing stars
        const existingStars = this.scene.children.find(child => child.isPoints);
        if (existingStars) {
            this.scene.remove(existingStars);
        }
        
        const stars = new THREE.Points(starGeometry, starMaterial);
        this.scene.add(stars);
    }
    
    setupControls() {
        // Setup speed control sliders
        this.planetData.forEach(planet => {
            const slider = document.getElementById(`${planet.name}-speed`);
            const valueDisplay = document.getElementById(`${planet.name}-value`);
            
            slider.addEventListener('input', (e) => {
                const speed = parseFloat(e.target.value);
                this.speedMultipliers[planet.name] = speed;
                valueDisplay.textContent = `Speed: ${speed.toFixed(1)}x`;
            });
        });
        
        // Reset button
        document.getElementById('reset-speeds').addEventListener('click', () => {
            this.resetAllSpeeds();
        });
        
        // Pause/Resume button
        const pauseBtn = document.getElementById('pause-resume-btn');
        const pauseIcon = document.getElementById('pause-icon');
        const pauseText = document.getElementById('pause-text');
        
        pauseBtn.addEventListener('click', () => {
            this.isPaused = !this.isPaused;
            if (this.isPaused) {
                pauseIcon.textContent = '▶️';
                pauseText.textContent = 'Resume';
                pauseBtn.classList.add('active');
            } else {
                pauseIcon.textContent = '⏸️';
                pauseText.textContent = 'Pause';
                pauseBtn.classList.remove('active');
            }
        });
        
        // Theme toggle button
        const themeBtn = document.getElementById('theme-toggle');
        const themeIcon = document.getElementById('theme-icon');
        const themeText = document.getElementById('theme-text');
        
        themeBtn.addEventListener('click', () => {
            this.isLightMode = !this.isLightMode;
            document.body.setAttribute('data-theme', this.isLightMode ? 'light' : 'dark');
            
            if (this.isLightMode) {
                themeIcon.textContent = '☀️';
                themeText.textContent = 'Light Mode';
            } else {
                themeIcon.textContent = '🌙';
                themeText.textContent = 'Dark Mode';
            }
            
            // Update scene elements for new theme
            this.updateSceneBackground();
            this.setupLighting();
            this.createStarField();
        });
        
        // Planet label click handlers
        this.planetData.forEach(planet => {
            const label = document.querySelector(`[data-planet="${planet.name}"]`);
            if (label) {
                label.addEventListener('click', () => {
                    this.focusOnPlanet(planet.name);
                });
            }
        });
    }
    
    setupEventListeners() {
        // Mouse move for tooltip
        this.renderer.domElement.addEventListener('mousemove', (event) => {
            this.onMouseMove(event);
        });
        
        // Click for planet focus
        this.renderer.domElement.addEventListener('click', (event) => {
            this.onMouseClick(event);
        });
        
        // Hide tooltip when mouse leaves canvas
        this.renderer.domElement.addEventListener('mouseleave', () => {
            this.hideTooltip();
        });
    }
    
    onMouseMove(event) {
        // Calculate mouse position in normalized device coordinates
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        // Update raycaster
        this.raycaster.setFromCamera(this.mouse, this.camera);
        
        // Check for intersections
        const intersects = this.raycaster.intersectObjects(this.planetMeshes);
        
        if (intersects.length > 0) {
            const planet = intersects[0].object;
            if (planet !== this.hoveredPlanet) {
                this.hoveredPlanet = planet;
                this.showTooltip(planet, event.clientX, event.clientY);
            }
            this.updateTooltipPosition(event.clientX, event.clientY);
        } else {
            if (this.hoveredPlanet) {
                this.hoveredPlanet = null;
                this.hideTooltip();
            }
        }
    }
    
    onMouseClick(event) {
        // Calculate mouse position in normalized device coordinates
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        // Update raycaster
        this.raycaster.setFromCamera(this.mouse, this.camera);
        
        // Check for intersections
        const intersects = this.raycaster.intersectObjects(this.planetMeshes);
        
        if (intersects.length > 0) {
            const planet = intersects[0].object;
            const planetName = planet.userData.name;
            this.focusOnPlanet(planetName);
        }
    }
    
    showTooltip(planet, x, y) {
        const data = planet.userData;
        
        document.getElementById('tooltip-title').textContent = data.displayName || data.name;
        document.getElementById('tooltip-distance').textContent = 
            `Distance from Sun: ${data.realDistance || 'N/A'} AU`;
        document.getElementById('tooltip-period').textContent = 
            `Orbital Period: ${data.realPeriod || 'N/A'} days`;
        document.getElementById('tooltip-radius').textContent = 
            `Radius: ${data.realRadius ? data.realRadius.toLocaleString() : 'N/A'} km`;
        
        this.tooltip.classList.add('visible');
        this.updateTooltipPosition(x, y);
    }
    
    updateTooltipPosition(x, y) {
        const tooltipRect = this.tooltip.getBoundingClientRect();
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        let left = x + 15;
        let top = y - tooltipRect.height / 2;
        
        // Keep tooltip within viewport
        if (left + tooltipRect.width > windowWidth) {
            left = x - tooltipRect.width - 15;
        }
        if (top < 0) {
            top = 10;
        }
        if (top + tooltipRect.height > windowHeight) {
            top = windowHeight - tooltipRect.height - 10;
        }
        
        this.tooltip.style.left = `${left}px`;
        this.tooltip.style.top = `${top}px`;
    }
    
    hideTooltip() {
        this.tooltip.classList.remove('visible');
    }
    
    focusOnPlanet(planetName) {
        let targetObject = null;
        let distance = 50;
        
        if (planetName === 'sun') {
            targetObject = this.sun;
            distance = 30;
        } else {
            const planetGroup = this.planets.find(p => p.userData.name === planetName);
            if (planetGroup) {
                targetObject = planetGroup.userData.planet;
                distance = targetObject.userData.distance + 10;
            }
        }
        
        if (targetObject) {
            // Smooth camera transition
            const targetPosition = targetObject.getWorldPosition(new THREE.Vector3());
            const cameraOffset = new THREE.Vector3(distance, distance * 0.5, distance);
            const newCameraPosition = targetPosition.clone().add(cameraOffset);
            
            // Animate camera movement
            this.animateCamera(newCameraPosition, targetPosition);
        }
    }
    
    animateCamera(targetPosition, lookAtPosition) {
        const startPosition = this.camera.position.clone();
        const startLookAt = this.controls.target.clone();
        const duration = 2000; // 2 seconds
        const startTime = Date.now();
        
        const animateStep = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Smooth easing function
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            
            // Interpolate camera position
            this.camera.position.lerpVectors(startPosition, targetPosition, easeProgress);
            
            // Interpolate look-at target
            this.controls.target.lerpVectors(startLookAt, lookAtPosition, easeProgress);
            this.controls.update();
            
            if (progress < 1) {
                requestAnimationFrame(animateStep);
            }
        };
        
        animateStep();
    }
    
    resetAllSpeeds() {
        this.planetData.forEach(planet => {
            const slider = document.getElementById(`${planet.name}-speed`);
            const valueDisplay = document.getElementById(`${planet.name}-value`);
            
            slider.value = 1.0;
            this.speedMultipliers[planet.name] = 1.0;
            valueDisplay.textContent = 'Speed: 1.0x';
        });
    }
    
    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());
        
        if (!this.isPaused) {
            const deltaTime = this.clock.getDelta();
            
            // Rotate the sun
            if (this.sun) {
                this.sun.rotation.y += 0.005;
            }
            
            // Animate planets
            this.planets.forEach(orbitGroup => {
                const planet = orbitGroup.userData.planet;
                const planetName = orbitGroup.userData.name;
                const speedMultiplier = this.speedMultipliers[planetName] || 1.0;
                
                // Update orbital position
                planet.userData.angle += planet.userData.orbitSpeed * speedMultiplier * deltaTime;
                
                // Calculate new position
                const x = Math.cos(planet.userData.angle) * planet.userData.distance;
                const z = Math.sin(planet.userData.angle) * planet.userData.distance;
                
                planet.position.x = x;
                planet.position.z = z;
                
                // Rotate planet on its axis
                planet.rotation.y += planet.userData.rotationSpeed * deltaTime;
                
                // Animate Earth's moon
                if (planetName === 'earth' && orbitGroup.userData.moon) {
                    const moonOrbit = orbitGroup.userData.moon;
                    const moon = moonOrbit.children[0];
                    
                    moon.userData.angle += moon.userData.orbitSpeed * speedMultiplier * deltaTime;
                    
                    const moonX = Math.cos(moon.userData.angle) * 3;
                    const moonZ = Math.sin(moon.userData.angle) * 3;
                    
                    moon.position.x = moonX;
                    moon.position.z = moonZ;
                    moon.rotation.y += 0.01 * deltaTime;
                }
            });
        }
        
        // Update controls
        this.controls.update();
        
        // Render the scene
        this.renderer.render(this.scene, this.camera);
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        if (this.renderer) {
            this.renderer.dispose();
        }
        
        window.removeEventListener('resize', this.onWindowResize);
    }
}

// Initialize the solar system when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const solarSystem = new SolarSystem();
    
    // Handle page unload
    window.addEventListener('beforeunload', () => {
        solarSystem.destroy();
    });
});

// Enhanced keyboard controls
document.addEventListener('keydown', (event) => {
    switch(event.code) {
        case 'Space':
            event.preventDefault();
            // Trigger pause/resume
            document.getElementById('pause-resume-btn').click();
            break;
        case 'KeyR':
            // Reset camera position
            if (window.solarSystem && window.solarSystem.controls) {
                window.solarSystem.controls.reset();
            }
            break;
        case 'KeyT':
            // Toggle theme
            document.getElementById('theme-toggle').click();
            break;
        case 'KeyH':
            // Focus on Sun (Home)
            if (window.solarSystem) {
                window.solarSystem.focusOnPlanet('sun');
            }
            break;
    }
});

// Store reference globally for debugging and external access
window.addEventListener('load', () => {
    setTimeout(() => {
        if (window.solarSystem) {
            console.log('🌟 Enhanced Solar System loaded successfully!');
            console.log('New Features:');
            console.log('• Pause/Resume: Space key or button');
            console.log('• Theme Toggle: T key or button');
            console.log('• Planet Focus: Click on planets');
            console.log('• Tooltips: Hover over planets');
            console.log('• Camera Reset: R key');
            console.log('• Focus Sun: H key');
        }
    }, 1000);
});
