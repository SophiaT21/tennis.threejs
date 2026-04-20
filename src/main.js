import './style.css'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

// SCENE
const scene = new THREE.Scene()
scene.fog = new THREE.Fog(0x1a0a05, 20, 50)

// BACKGROUND GRADIENT
const gradientGeo = new THREE.PlaneGeometry(2, 2)
const gradientMat = new THREE.ShaderMaterial({
  depthWrite: false,
  depthTest: false,
  uniforms: {
    colorTop: { value: new THREE.Color(0x0a0510) },
    colorBottom: { value: new THREE.Color(0xff6a00) },
    gradientStrength: { value: 1.7 }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform vec3 colorTop;
    uniform vec3 colorBottom;
    uniform float gradientStrength;
    varying vec2 vUv;
    void main() {
      float g = pow(vUv.y, gradientStrength);
      vec3 color = mix(colorBottom, colorTop, g);
      gl_FragColor = vec4(color, 1.0);
    }
  `
})
const gradientMesh = new THREE.Mesh(gradientGeo, gradientMat)
gradientMesh.frustumCulled = false
scene.add(gradientMesh)

// STARS
const starCount = 6000
const starGeometry = new THREE.BufferGeometry()
const starPositions = new Float32Array(starCount * 3)
for (let i = 0; i < starCount; i++) {
  const i3 = i * 3

  const radius = 120

  // angle horizontal normal
  const theta = Math.random() * Math.PI * 2

  // biais vers le haut (IMPORTANT)
  const bias = Math.pow(Math.random(), 2.5)

  // limite aux étoiles du ciel uniquement
  const phi = bias * (Math.PI / 2)

  starPositions[i3] =
    radius * Math.sin(phi) * Math.cos(theta)

  starPositions[i3 + 1] =
    radius * Math.cos(phi)

  starPositions[i3 + 2] =
    radius * Math.sin(phi) * Math.sin(theta)
}
starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3))
const starMaterial = new THREE.PointsMaterial({
  color:  0xffffff, 
  size: 0.8, 
  transparent: true, 
  opacity: 1,
  depthWrite: false, 
  blending: THREE.NormalBlending,
  fog: false
})
scene.add(new THREE.Points(starGeometry, starMaterial))

// CAMERA
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000)
camera.position.set(0, 1.5, 10)
camera.lookAt(0, 0, 0)

// RENDERER
const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.outputColorSpace = THREE.SRGBColorSpace
renderer.toneMapping = THREE.NoToneMapping
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
document.body.appendChild(renderer.domElement)

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})

// TERRAIN
const textureLoader = new THREE.TextureLoader()
const colorMap  = textureLoader.load('./textures/Ground054_1K-JPG_Color.jpg')
const normalMap = textureLoader.load('./textures/Ground054_1K-JPG_NormalGL.jpg')
const roughMap  = textureLoader.load('./textures/Ground054_1K-JPG_Roughness.jpg')
;[colorMap, normalMap, roughMap].forEach(t => {
  t.wrapS = THREE.RepeatWrapping
  t.wrapT = THREE.RepeatWrapping
  t.repeat.set(6, 12)
})
const courtMat = new THREE.MeshStandardMaterial({
  map: colorMap, normalMap, normalScale: new THREE.Vector2(1.5, 1.5),
  roughnessMap: roughMap, roughness: 1, metalness: 0, color: 0xc1440e,
})
const court = new THREE.Mesh(new THREE.PlaneGeometry(10.97, 23.77), courtMat)
court.rotation.x = -Math.PI / 2
court.receiveShadow = true
scene.add(court)

// LIGNES
function addLine(x1, z1, x2, z2, width = 0.05) {
  const dx = x2 - x1, dz = z2 - z1
  const length = Math.sqrt(dx * dx + dz * dz)
  const angle = Math.atan2(dx, dz)
  const geo = new THREE.PlaneGeometry(width, length)
  const mat = new THREE.MeshBasicMaterial({ color: 0xffffff })
  const line = new THREE.Mesh(geo, mat)
  line.rotation.x = -Math.PI / 2
  line.rotation.z = angle
  line.position.set((x1 + x2) / 2, 0.011, (z1 + z2) / 2)
  scene.add(line)
}

const W = 10.97 / 2
const L = 23.77 / 2
const SW = 8.23 / 2

addLine(-W, -L, W, -L)
addLine(-W,  L, W,  L)
addLine(-W, -L, -W, L)
addLine( W, -L,  W, L)
addLine(-SW, -L/2, SW, -L/2)
addLine(-SW,  L/2, SW,  L/2)
addLine(0, -L/2, 0, L/2)
addLine(-W, 0, W, 0)
addLine(-SW, -L, -SW, L)
addLine( SW, -L,  SW, L)

// FILET
const netGroup = new THREE.Group()
const poleMat = new THREE.MeshStandardMaterial({ color: 0xcccccc })
const poleGeo = new THREE.CylinderGeometry(0.03, 0.03, 1.07)
const poleL = new THREE.Mesh(poleGeo, poleMat)
poleL.position.set(-W, 0.535, 0)
netGroup.add(poleL)
const poleR = new THREE.Mesh(poleGeo, poleMat)
poleR.position.set(W, 0.535, 0)
netGroup.add(poleR)
const cableGeo = new THREE.CylinderGeometry(0.015, 0.015, W * 2)
const cableMat = new THREE.MeshStandardMaterial({ color: 0xffffff })
const cable = new THREE.Mesh(cableGeo, cableMat)
cable.rotation.z = Math.PI / 2
cable.position.set(0, 1.07, 0)
netGroup.add(cable)
const bandGeo = new THREE.CylinderGeometry(0.012, 0.012, W * 2)
const band = new THREE.Mesh(bandGeo, cableMat)
band.rotation.z = Math.PI / 2
band.position.set(0, 0.05, 0)
netGroup.add(band)
for (let x = -W; x <= W; x += 0.08) {
  const pts = [new THREE.Vector3(x, 0.05, 0), new THREE.Vector3(x, 1.07, 0)]
  const geo = new THREE.BufferGeometry().setFromPoints(pts)
  netGroup.add(new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0x111111, transparent: true, opacity: 0.9 })))
}
for (let y = 0.05; y <= 1.07; y += 0.07) {
  const pts = [new THREE.Vector3(-W, y, 0), new THREE.Vector3(W, y, 0)]
  const geo = new THREE.BufferGeometry().setFromPoints(pts)
  netGroup.add(new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0x111111, transparent: true, opacity: 0.9 })))
}
scene.add(netGroup)

// BALLE BLENDER
const gltfLoader = new GLTFLoader()
let sphere = new THREE.Object3D()
sphere.position.set(6, 3, 15)
scene.add(sphere)

gltfLoader.load('./models/balle.glb', (gltf) => {
  scene.remove(sphere)
  sphere = gltf.scene
  sphere.scale.set(0, 0, 0)
  sphere.position.set(6, 3, 15)
  sphere.castShadow = true
  scene.add(sphere)
  setupScrollAnimation()
})

// OMBRE BALLE
const shadowCircle = new THREE.Mesh(
  new THREE.CircleGeometry(0.06, 32),
  new THREE.MeshBasicMaterial({
    color: 0x000000, transparent: true, opacity: 0,
    polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1
  })
)
shadowCircle.rotation.x = -Math.PI / 2
shadowCircle.position.y = 0.001
scene.add(shadowCircle)

// LUMIERES
scene.add(new THREE.AmbientLight(0xff9060, 0.3))

const dirLight = new THREE.DirectionalLight(0xffb347, 5)
dirLight.position.set(8, 2, -5)
dirLight.castShadow = true
dirLight.shadow.mapSize.set(2048, 2048)
dirLight.shadow.camera.far = 50
scene.add(dirLight)

const sideLight1 = new THREE.PointLight(0xff6a00, 2, 30)
sideLight1.position.set(-8, 3, -5)
scene.add(sideLight1)

const sideLight2 = new THREE.PointLight(0xff6a00, 2, 30)
sideLight2.position.set(8, 3, -5)
scene.add(sideLight2)

// ETAT CAMERA
const camState = {
  x: 0, y: 1.5, z: 10,
  lookX: 0, lookY: 0, lookZ: 0
}

// SCROLL ANIMATION GSAP
function setupScrollAnimation() {
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: 'body',
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1.5,
    }
  })

  // PHASE 1 — balle arrive par derrière à droite
  tl.to(sphere.scale, { x: 0.4, y: 0.4, z: 0.4, duration: 2 }, 0)
  tl.to(sphere.position, { x: 3, y: 2, z: 8, duration: 2 }, 0)

  // PHASE 2 — balle fonce vers le terrain
  tl.to(sphere.scale, { x: 0.1, y: 0.1, z: 0.1, duration: 2 }, 2)
  tl.to(sphere.position, { x: 1.5, y: 0.15, z: 4, duration: 2 }, 2)
  tl.to(shadowCircle.material, { opacity: 0.3, duration: 1 }, 2)

  // PHASE 3 — rebond côté joueur, caméra tourne
  tl.to(sphere.position, { x: 0, y: 1.5, z: 1, duration: 1.5 }, 4)
  tl.to(camState, { x: 4, y: 3, z: 4, lookX: 0, lookY: 0.5, lookZ: 0, duration: 2 }, 4)

  // PHASE 4 — balle traverse le filet
  tl.to(sphere.position, { x: -1, y: 0.15, z: -4, duration: 2 }, 6)
  tl.to(camState, { x: -4, y: 2, z: 2, lookX: 0, lookY: 0.5, lookZ: -4, duration: 2 }, 6)

  // PHASE 5 — orbit autour de la balle
  tl.to(sphere.position, { x: 0, y: 1.2, z: -6, duration: 1.5 }, 8)
  tl.to(camState, { x: 2, y: 2.5, z: -4, lookX: 0, lookY: 1, lookZ: -6, duration: 2 }, 8)
}

// SOURIS
const mouse = { x: 0, y: 0 }
const targetMouse = { x: 0, y: 0 }
window.addEventListener('mousemove', (e) => {
  targetMouse.x = (e.clientX / window.innerWidth - 0.5) * 2
  targetMouse.y = -(e.clientY / window.innerHeight - 0.5) * 2
})

// CLOCK
const clock = new THREE.Clock()

// INTERSECTION OBSERVER 
const sections = document.querySelectorAll('.text-section')
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('visible')
    else entry.target.classList.remove('visible')
  })
}, { threshold: 0.3 })
sections.forEach(s => observer.observe(s))

// ANIMATION 
function animate() {
  requestAnimationFrame(animate)

  // Souris fluide
  mouse.x += (targetMouse.x - mouse.x) * 0.05
  mouse.y += (targetMouse.y - mouse.y) * 0.05

  // Rotation balle
  sphere.rotation.y += 0.02
  sphere.rotation.x += 0.01

  // Ombre suit la balle
  shadowCircle.position.x = sphere.position.x
  shadowCircle.position.z = sphere.position.z

  // Caméra pilotée par camState + légère influence souris
  camera.position.set(
    camState.x + mouse.x * 0.3,
    camState.y + mouse.y * 0.2,
    camState.z
  )
  camera.lookAt(camState.lookX, camState.lookY, camState.lookZ)

  renderer.render(scene, camera)
}

animate()