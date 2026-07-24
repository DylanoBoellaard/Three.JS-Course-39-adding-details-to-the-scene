import './style.css'
import * as dat from 'lil-gui'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import firefliesVertexShader from './shaders/fireflies/vertex.glsl'
import firefliesFragmentShader from './shaders/fireflies/fragment.glsl'
import portalVertexShader from './shaders/portal/vertex.glsl'
import portalFragmentShader from './shaders/portal/fragment.glsl'

/**
 * Base
 */
// Debug
const debugObject = {}
const gui = new dat.GUI({
    width: 400
})

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Loaders
 */
// Texture loader
const textureLoader = new THREE.TextureLoader()

// Draco loader
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('draco/')

// GLTF loader
const gltfLoader = new GLTFLoader()
gltfLoader.setDRACOLoader(dracoLoader)

// Cube texture loader
const cubeTextureLoader = new THREE.CubeTextureLoader()

/**
 * Textures
 */
const bakedTexture = textureLoader.load('baked.jpg')
bakedTexture.flipY = false
bakedTexture.colorSpace = THREE.SRGBColorSpace

/**
 * Environment map
 */
const environmentMap = cubeTextureLoader.load([
    '/textures/environmentMaps/0/px.jpg',
    '/textures/environmentMaps/0/nx.jpg',
    '/textures/environmentMaps/0/py.jpg',
    '/textures/environmentMaps/0/ny.jpg',
    '/textures/environmentMaps/0/pz.jpg',
    '/textures/environmentMaps/0/nz.jpg'
])
scene.background = environmentMap
scene.environment = environmentMap

/**
 * Materials
 */
// Baked material
const bakedMaterial = new THREE.MeshBasicMaterial({ map: bakedTexture })

// Pole light material - Objects: Lamp_Inner_L & Lamp_Inner_R
// const poleLightMaterial = new THREE.MeshBasicMaterial({ color: '#ff7736ff' })
const poleLightMaterial = new THREE.MeshBasicMaterial({ color: '#ffcbb3' })

// Portal light material - Object: Portal_Inner_Circle
debugObject.portalColourStart = '#ae63ce'     // #ae63ce    #3d1259
debugObject.portalColourEnd = '#6b3383'       // #6b3383    #250839

const portalLightMaterial = new THREE.ShaderMaterial({
    uniforms:
    {
        uTime: { value: 0 },
        uColourStart: { value: new THREE.Color(debugObject.portalColourStart) }, // Default: #ae63ce Others: #3d1259
        uColourEnd: { value: new THREE.Color(debugObject.portalColourEnd) }, // Default: #6b3383 Others: #250839
    },
    vertexShader: portalVertexShader,
    fragmentShader: portalFragmentShader,
})

// Debug
gui.portalLightFolder = gui.addFolder('Portal light')
gui.portalLightFolder.addColor(debugObject, 'portalColourStart').name('Inner colour')
    .onChange(() =>
        {
            portalLightMaterial.uniforms.uColourStart.value.set(debugObject.portalColourStart)
        })
gui.portalLightFolder.addColor(debugObject, 'portalColourEnd').name('Outer colour')
    .onChange(() =>
        {
            portalLightMaterial.uniforms.uColourEnd.value.set(debugObject.portalColourEnd)
        })

/**
 * Model
 */
gltfLoader.load(
    'Portal-Scene-final-Without-Materials.glb',
    (gltf) =>
    {
        // Apply baked texture to the materials
        const bakedMesh = gltf.scene.children.find(child => child.name === 'baked')
        bakedMesh.material = bakedMaterial

        // Find the emissive meshes
        const poleLightLMesh = gltf.scene.children.find(child => child.name === 'Lamp_Inner_L')
        const poleLightRMesh = gltf.scene.children.find(child => child.name === 'Lamp_Inner_R')
        const portalLightMesh = gltf.scene.children.find(child => child.name === 'Portal_Inner_Circle')

        // Apply materials to the meshes
        poleLightLMesh.material = poleLightMaterial
        poleLightRMesh.material = poleLightMaterial
        portalLightMesh.material = portalLightMaterial

        scene.add(gltf.scene)
    }
)

/**
 * Fireflies
 */
// Geometry
const firefliesGeometry = new THREE.BufferGeometry()
const firefliesCount = 30
const positionsArray = new Float32Array(firefliesCount * 3)
const scaleArray = new Float32Array(firefliesCount)

for (let i = 0; i < firefliesCount; i++)
{
    positionsArray[i * 3] = (Math.random() - 0.5) * 4
    positionsArray[i * 3 + 1] = Math.random() * 1.5
    positionsArray[i * 3 + 2] = (Math.random() - 0.5) * 4

    scaleArray[i] = Math.random()
}

firefliesGeometry.setAttribute('position', new THREE.BufferAttribute(positionsArray, 3))
firefliesGeometry.setAttribute('aScale', new THREE.BufferAttribute(positionsArray, 1))

// Material
const firefliesMaterial = new THREE.ShaderMaterial({
    uniforms:
    {
        uTime: { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        uSize: { value: 100 },
        uStrength: { value: 0.05 },
    },
    vertexShader: firefliesVertexShader,
    fragmentShader: firefliesFragmentShader,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
})

// Points
const fireflies = new THREE.Points(firefliesGeometry, firefliesMaterial)
scene.add(fireflies)

// Debug
gui.firefliesFolder = gui.addFolder('Fireflies')
gui.firefliesFolder.add(firefliesMaterial.uniforms.uSize, 'value', 0, 200, 1).name('Size')
gui.firefliesFolder.add(firefliesMaterial.uniforms.uStrength, 'value', 0, 1, 0.01).name('Strength')

/**
 * Portal
 */
const portalGeometry = new THREE.BufferGeometry()

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    // Update fireflies
    firefliesMaterial.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio, 2)
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 0.1, 100)
camera.position.x = 4
camera.position.y = 2
camera.position.z = 4
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.outputColorSpace = THREE.SRGBColorSpace

debugObject.clearColour = '#151619'     // #191b1f   #151619   #1f1b19
renderer.setClearColor(debugObject.clearColour)
gui.addColor(debugObject, 'clearColour').onChange(value => renderer.setClearColor(value))

/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()

    // Update materials
    firefliesMaterial.uniforms.uTime.value = elapsedTime
    portalLightMaterial.uniforms.uTime.value = elapsedTime

    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()