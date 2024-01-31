import * as THREE from 'three'
import {
  EffectComposer,
  FBXLoader,
  GLTFLoader,
  OBJLoader,
  OrbitControls,
  RenderPass,
  TransformControls,
  UnrealBloomPass,
  WebGL,
} from 'three/examples/jsm/Addons.js'
import GUI from 'three/examples/jsm/libs/lil-gui.module.min.js'
import Stats from 'three/examples/jsm/libs/stats.module.js'
import './style.css'

// Default
const container = document.querySelector<HTMLDivElement>('#app')
const canvas = document.createElement('canvas')
let WIDTH = window.innerWidth
let HEIGHT = window.innerHeight
let scene: THREE.Scene
let renderer: THREE.WebGLRenderer

// Camera
let currentCamera: THREE.PerspectiveCamera | THREE.OrthographicCamera
let perspCamera: THREE.PerspectiveCamera
let orthoCamera: THREE.OrthographicCamera

// Controls
let orbitControls: OrbitControls
let transformControls: TransformControls

// Light
let light: THREE.DirectionalLight
let lightHelper: THREE.DirectionalLightHelper

// Model
let model: THREE.Object3D<THREE.Object3DEventMap>
let mixer: THREE.AnimationMixer

// Post Processing Variables
let composer: EffectComposer
let bloomPass: UnrealBloomPass
let renderPass: RenderPass
let currentValue: number = 0

// Etc
let stats: Stats
let clock: THREE.Clock

const bodyMaterial: THREE.MeshPhysicalMaterial = new THREE.MeshPhysicalMaterial(
  {
    color: 0xffffff,
    metalness: 1.0,
    roughness: 0.25,
    reflectivity: 0.5,
    ior: 1.5,
    // clearcoat: 1.0,
    // clearcoatRoughness: 0.03,
  }
)

const _setupThreeJs = () => {
  // WebGL이 사용 가능한지 확인
  if (WebGL?.isWebGLAvailable() === false) {
    alert('WebGL is not available')
    return
  }

  // clock 생성
  clock = new THREE.Clock()

  // scene 생성
  scene = new THREE.Scene()
  scene.background = new THREE.Color('#000000')

  // Scene에 GridHelper 추가
  scene.add(new THREE.GridHelper(5, 10, 0x888888, 0x444444))

  // 축생성
  const axes = new THREE.AxesHelper(150)
  scene.add(axes)

  // renderer 생성
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.setSize(WIDTH, HEIGHT)

  container?.appendChild(renderer.domElement)
}

const _setupCamera = () => {
  // PerspectiveCamera 생성
  perspCamera = new THREE.PerspectiveCamera(75, WIDTH / HEIGHT, 0.1, 1000)
  perspCamera.position.set(10, 7, 10)
  currentCamera = perspCamera

  // OrthographicCamera 생성
  orthoCamera = new THREE.OrthographicCamera(
    WIDTH / -2,
    WIDTH / 2,
    HEIGHT / 2,
    HEIGHT / -2,
    1,
    1000
  )
}

const _setupLight = () => {
  // light 생성
  light = new THREE.DirectionalLight(0xffffff, 5)
  light.position.set(10, 10, 0)
  // light.matrixWorldAutoUpdate = true

  scene.add(light)
  scene.add(light.target)

  // light helper 생성
  lightHelper = new THREE.DirectionalLightHelper(light, 5)
  // lightHelper.matrixWorldAutoUpdate = true

  scene.add(lightHelper)
}

const _setupModel = () => {}

const _setupControls = () => {
  // OrbitControls 생성
  orbitControls = new OrbitControls(currentCamera, renderer.domElement)
  orbitControls.minDistance = 0
  orbitControls.maxDistance = 1000
  orbitControls.enableDamping = true

  // transformControls 생성
  transformControls = new TransformControls(currentCamera, renderer.domElement)
  transformControls.addEventListener('change', render)

  transformControls.addEventListener('dragging-changed', function (event) {
    orbitControls.enabled = !event.value
  })

  scene.add(transformControls)
}

const _setupEvent = () => {
  window.addEventListener('keydown', function (event) {
    switch (event.keyCode) {
      case 81: // Q
        transformControls.setSpace(
          transformControls.space === 'local' ? 'world' : 'local'
        )
        break

      case 16: // Shift
        transformControls.setTranslationSnap(100)
        transformControls.setRotationSnap(THREE.MathUtils.degToRad(15))
        transformControls.setScaleSnap(0.25)
        break

      case 87: // W
        transformControls.setMode('translate')
        break

      case 69: // E
        transformControls.setMode('rotate')
        break

      case 82: // R
        transformControls.setMode('scale')
        break

      case 67: // C
        const position = currentCamera.position.clone()

        currentCamera =
          currentCamera === perspCamera ? orthoCamera : perspCamera
        currentCamera.position.copy(position)

        orbitControls.object = currentCamera

        transformControls.camera = currentCamera

        currentCamera.lookAt(
          orbitControls.target.x,
          orbitControls.target.y,
          orbitControls.target.z
        )

        resize()
        break

      case 86: // V
        const randomFoV = Math.random() + 0.1
        const randomZoom = Math.random() + 0.1

        perspCamera.fov = randomFoV * 160
        orthoCamera.bottom = -randomFoV * 500
        orthoCamera.top = randomFoV * 500

        perspCamera.zoom = randomZoom * 5
        orthoCamera.zoom = randomZoom * 5
        resize()
        break

      case 187:
      case 107: // +, =, num+
        transformControls.setSize(transformControls.size + 0.1)
        break

      case 189:
      case 109: // -, _, num-
        transformControls.setSize(Math.max(transformControls.size - 0.1, 0.1))
        break

      case 88: // X
        transformControls.showX = !transformControls.showX
        break

      case 89: // Y
        transformControls.showY = !transformControls.showY
        break

      case 90: // Z
        transformControls.showZ = !transformControls.showZ
        break

      case 32: // Spacebar
        transformControls.enabled = !transformControls.enabled
        break

      case 27: // Esc
        transformControls.reset()
        break
    }
  })
}

function updateMaterial() {
  bodyMaterial.side = Number(bodyMaterial.side) as THREE.Side
  bodyMaterial.needsUpdate = true
}

const _setupGui = () => {
  const gui = new GUI()

  const lightDegrees = {
    x: 0,
    y: 0,
    z: 0,
  }

  const params = {
    backgroundImage: 'none',
    backgroundColor: scene?.background,
    lightColor: light?.color,
    lightDegrees,
    modelColor: bodyMaterial.color,
  }

  const folder1 = gui.addFolder('Scene')
  const folder2 = gui.addFolder('Lighting')
  const folder3 = gui.addFolder('Material')
  const folder4 = gui.addFolder('Texture')
  const folder5 = gui.addFolder('Post Processing')

  // Scene
  folder1
    .addColor(params, 'backgroundColor')
    .onChange(function (val) {
      scene.background = val
    })
    .name('background color')

  // Lighting
  folder2
    .addColor(params, 'lightColor')
    .onChange(function (val) {
      light?.color.set(val)
    })
    .name('color')

  folder2.add(light?.position, 'x', -10, 10, 0.1).name('position x')
  folder2.add(light?.position, 'y', -10, 10, 0.1).name('position y')
  folder2.add(light?.position, 'z', -10, 10, 0.1).name('position z')
  folder2.add(light.rotation, 'x', -180, 180, 0.1).name('rotation x')
  folder2.add(light.rotation, 'y', -180, 180, 0.1).name('rotation y')
  folder2.add(light.rotation, 'z', -180, 180, 0.1).name('rotation z')

  folder2
    .add(light?.target.position, 'x', -10, 10, 0.1)
    .name('target.position x')
  folder2
    .add(light?.target.position, 'y', -10, 10, 0.1)
    .name('target.position y')
  folder2
    .add(light?.target.position, 'z', -10, 10, 0.1)
    .name('target.position z')

  folder2.add(light, 'intensity', -10, 10, 0.1)

  // Material
  folder3.addColor(params, 'modelColor').name('color')
  folder3.add(bodyMaterial, 'flatShading').onChange(() => updateMaterial())

  // Texture
  folder4.add(bodyMaterial, 'ior', 1.0, 2.333)
  folder4.add(bodyMaterial, 'reflectivity', 0, 1)
  folder4.add(bodyMaterial, 'metalness', 0, 1, 0.1)
  folder4.add(bodyMaterial, 'roughness', 0, 1, 0.1)
  folder4.add(bodyMaterial, 'clearcoat', 0, 1, 0.01)
  folder4.add(bodyMaterial, 'clearcoatRoughness', 0, 1, 0.01)
  folder4.add(bodyMaterial, 'transmission', 0, 1, 0.01)
  folder4.add(bodyMaterial, 'thickness', 0, 10)

  folder1.open()
  folder2.open()
  folder3.open()
  folder4.open()
  folder5.open()
}

const _setupStats = () => {
  // 상태창 생성
  stats = new Stats()
  container?.appendChild(stats.dom)
}

const render = () => {
  composer.render()
}

const resize = () => {
  WIDTH = window.innerWidth
  HEIGHT = window.innerHeight

  if (currentCamera === perspCamera) {
    currentCamera.aspect = WIDTH / HEIGHT
    currentCamera.updateProjectionMatrix()
  }

  if (renderer) {
    renderer.setSize(WIDTH, HEIGHT)
    composer.setSize(WIDTH, HEIGHT)
  }
}

const _setupPostProcess = () => {
  renderPass = new RenderPass(scene, currentCamera)
  bloomPass = new UnrealBloomPass(new THREE.Vector2(WIDTH, HEIGHT), 0, 0.1, 0.1)
  composer = new EffectComposer(renderer)

  composer.addPass(renderPass)
  composer.addPass(bloomPass)
}

const update = () => {
  const delta = clock.getDelta()
  currentValue += delta
  const sin = Math.abs(Math.sin(currentValue))
  if (sin < 0.1) {
    currentValue = 0
  }

  bloomPass.strength = sin * 0.5

  if (mixer) {
    mixer.update(delta)
  }

  render()
  lightHelper.update()
  orbitControls.update()
  stats.update()

  requestAnimationFrame(update)
}

const run = () => {
  try {
    _setupThreeJs()
    _setupCamera()
    _setupLight()
    _setupModel()
    _setupPostProcess()
    _setupControls()
    _setupEvent()
    _setupGui()
    _setupStats()
    update()
    window.addEventListener('resize', resize)
  } catch (error) {
    if (error instanceof ErrorEvent) {
      alert(error.message)
    }
    console.error(error)
  }
}

// 파일 업로드 부
const getFileExtension = (filename: string) => {
  return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2)
}

document
  .querySelector('#file')
  ?.addEventListener('change', async (event: Event) => {
    run()

    const uploadFile = (event.target as HTMLInputElement).files?.[0]

    if (!uploadFile) {
      alert('파일을 선택해주세요')
      return
    }

    const extension = getFileExtension(uploadFile.name)
    const url = URL.createObjectURL(new Blob([uploadFile], { type: extension }))

    console.log(uploadFile, url, extension)

    switch (extension) {
      case 'fbx':
        const reader = new FileReader()

        reader.addEventListener('load', (event) => {
          const arrayBuffer = event?.target?.result

          if (arrayBuffer) {
            const loader = new FBXLoader()
            const fbx = loader.parse(arrayBuffer, '')
            fbx.traverse(function (child) {
              if (child instanceof THREE.Mesh) {
                child.material = bodyMaterial
              }
            })
            scene.add(fbx)
          }
        })

        reader.readAsArrayBuffer(uploadFile)
        return
      case 'obj':
        const objLoader = new OBJLoader()
        objLoader.load(
          url,
          function (obj) {
            obj.traverse((child) => {
              if (child instanceof THREE.Mesh) {
                child.material = bodyMaterial
                child.castShadow = true
                child.receiveShadow = true
              }
            })

            scene.add(obj)
            transformControls.attach(obj)
            URL.revokeObjectURL(url)
          },
          function () {},
          function (error) {
            console.error('error ===>', error)
            URL.revokeObjectURL(url)
          }
        )
        return
      case 'gltf':
      case 'glb':
        new GLTFLoader().load(
          url,
          function (gltf) {
            gltf.scene.traverse((child) => {
              if (child instanceof THREE.Mesh) {
                child.material = bodyMaterial
                child.castShadow = true
                child.receiveShadow = true
              }
            })
            gltf.scene.position.set(0, 0, 0)
            model = gltf.scene
            transformControls.attach(gltf.scene)
            scene?.add(model)
            URL.revokeObjectURL(url)
          },
          function () {},
          function (error) {
            console.error('error ===>', error)
            URL.revokeObjectURL(url)
          }
        )
        return
    }
  })
