// 1. INITIAL SETUP
const canvas = document.getElementById('bg3d');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
// Dark blue fog for depth
renderer.setClearColor(0x000000, 1); 

camera.position.set(0, 20, 60);
camera.lookAt(0, 0, 0);


// 2. CREATE PARTICLES
const particleGeometry = new THREE.BufferGeometry();
const particleCount = 4000;
const positions = new Float32Array(particleCount * 3);
const originalPositions = new Float32Array(particleCount * 3);
const colors = new Float32Array(particleCount * 3);

for (let i = 0; i < particleCount; i++) {
    // Spherical distribution
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;
    const radius = 45 + Math.random() * 30; // Spread them out more

    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.sin(theta);

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    originalPositions[i * 3] = x;
    originalPositions[i * 3 + 1] = y;
    originalPositions[i * 3 + 2] = z;

    // Color gradient based on Y position
    const intensity = (y + radius) / (2 * radius);
    colors[i * 3] = 0.2 + intensity * 0.2; // R (Cyan/Teal tint)
    colors[i * 3 + 1] = 0.7 + intensity * 0.3; // G
    colors[i * 3 + 2] = 0.8 + intensity * 0.2; // B
}

particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

const particleMaterial = new THREE.PointsMaterial({
    size: 0.4,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
});

const particles = new THREE.Points(particleGeometry, particleMaterial);
scene.add(particles);


// 3. INTERACTION & ANIMATION VARIABLES
const mouse = new THREE.Vector2();
const raycaster = new THREE.Raycaster();
const targetPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
let time = 0;
let scrollY = 0;

// Mouse Move Listener
window.addEventListener('mousemove', (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
});

// Scroll Listener (For Parallax)
window.addEventListener('scroll', () => {
    scrollY = window.scrollY;
});

// 4. ANIMATION LOOP
function animate() {
    requestAnimationFrame(animate);
    time += 0.001;

    // Basic constant rotation
    particles.rotation.y += 0.0003;
    
    // SCROLL EFFECT: Tilt the universe based on scroll position
    particles.rotation.x = scrollY * 0.0001; 
    particles.rotation.z = scrollY * 0.00005;

    // Raycaster for mouse repulsion
    raycaster.setFromCamera(mouse, camera);
    const target = new THREE.Vector3();
    raycaster.ray.intersectPlane(targetPlane, target);

    const pos = particleGeometry.attributes.position;

    for (let i = 0; i < particleCount; i++) {
        const px = pos.getX(i);
        const py = pos.getY(i);
        const pz = pos.getZ(i);

        const ox = originalPositions[i * 3];
        const oy = originalPositions[i * 3 + 1];
        const oz = originalPositions[i * 3 + 2];

        // Mouse Repulsion Math
        const dx = px - target.x * 30;
        const dy = py - target.y * 30;
        const distance = Math.sqrt(dx * dx + dy * dy);

        const repelRange = 25;
        const force = 2;

        let tx = ox, ty = oy, tz = oz;

        if (distance < repelRange) {
            const angle = Math.atan2(dy, dx);
            const push = (repelRange - distance) * force;
            tx = ox + Math.cos(angle) * push;
            ty = oy + Math.sin(angle) * push;
            tz = oz - push;
        }

        // Smoothly interpolate current position to target position
        pos.setX(i, px + (tx - px) * 0.1);
        pos.setY(i, py + (ty - py) * 0.1);
        pos.setZ(i, pz + (tz - pz) * 0.1);
    }

    pos.needsUpdate = true;
    renderer.render(scene, camera);
}

animate();


// 5. RESIZE HANDLER
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// 6. SCROLL REVEAL ANIMATION (Intersection Observer)
const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, { threshold: 0.1 });

// Observe all elements with class 'reveal'
document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));