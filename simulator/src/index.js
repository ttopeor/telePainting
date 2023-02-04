import {
  WebGLRenderer,
  PerspectiveCamera,
  Scene,
  Mesh,
  PlaneBufferGeometry,
  ShadowMaterial,
  DirectionalLight,
  PCFSoftShadowMap,
  sRGBEncoding,
  Color,
  AmbientLight,
  Box3,
  LoadingManager,
  MathUtils, MeshBasicMaterial
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import URDFLoader from "urdf-loader";

let scene, camera, renderer, robotCurr, robotDest, controls;

init();


function init() {
  scene = new Scene();
  scene.background = new Color(0x263238);

  camera = new PerspectiveCamera();
  camera.position.set(0.9097706574075907, 0.7064546165382057, -0.8224530427360499);
  camera.rotation.set(-2.431919546602103, 0.6981382326340031, 2.6371129779013565);

  renderer = new WebGLRenderer({ antialias: true });
  renderer.outputEncoding = sRGBEncoding;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFSoftShadowMap;
  document.body.appendChild(renderer.domElement);

  const directionalLight = new DirectionalLight(0xffffff, 1.0);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.setScalar(1024);
  directionalLight.position.set(5, 30, 5);
  scene.add(directionalLight);

  const ambientLight = new AmbientLight(0xffffff, 0.2);
  scene.add(ambientLight);

  const ground = new Mesh(
    new PlaneBufferGeometry(),
    new ShadowMaterial({ opacity: 0.5 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.scale.setScalar(30);
  ground.receiveShadow = true;
  scene.add(ground);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.minDistance = 0.5;
  controls.target.set(-0.14819286234892007, 0.20522549361622577, 0.07191848308807917)
  controls.update();

  // Load robot
  const manager = new LoadingManager();
  const loader = new URDFLoader(manager);
  loader.load("/urdf/ar4/ar4.urdf", (result) => {
    robotCurr = result;
  });

  loader.load("/urdf/ar4/ar4.urdf", (result) => {
    robotDest = result;
  });

  // wait until all the geometry has loaded to add the model to the scene
  manager.onLoad = () => {
    robotCurr.position.set(0, 0, 0)
    robotCurr.rotation.x = - Math.PI / 2;
    robotCurr.traverse((c) => {
      c.castShadow = true;
    });

    for (let i = 1; i <= 6; i++) {
      robotCurr.joints[`J${i}`].setJointValue(MathUtils.degToRad(0));
    }

    robotCurr.updateMatrixWorld(true);

    scene.add(robotCurr);

    const mat = new MeshBasicMaterial({ opacity: 0.5 });
    robotDest.position.set(0, 0, 0)
    robotDest.rotation.x = - Math.PI / 2;
    robotDest.traverse((c) => {
      if (c instanceof Mesh) {
        c.material.color.b = 1
        c.material.color.g = 1
        c.material.color.r = 1
        c.material.opacity = 0.5
        c.material.transparent = true
      }
    });

    for (let i = 1; i <= 6; i++) {
      robotDest.joints[`J${i}`].setJointValue(MathUtils.degToRad(15));
    }

    robotDest.updateMatrixWorld(true);

    scene.add(robotDest);
    render()
  };

  onResize();
  window.addEventListener("resize", onResize);
}

function onResize() {
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}


let currentAngles = [0, 0, 0, 0, 0, 0]
let destinationAngles = [[0.72, -18.15, 6.11, 0, -77.96, -179.27]]
let animationIdx = 0;

window.addEventListener('message', (event) => {
  if (event.data.name === 'ANGLE') {
    currentAngles = event.data.currentAngles;
    destinationAngles = event.data.destinationAngles
    animationIdx = 0;
  }
})


function render() {

  for (let i = 1; i <= 6; i++) {
    robotCurr.joints[`J${i}`].setJointValue(MathUtils.degToRad(currentAngles[i - 1]));
  }

  for (let i = 1; i <= 6; i++) {
    robotDest.joints[`J${i}`].setJointValue(MathUtils.degToRad(destinationAngles[animationIdx][i - 1]));
  }

  const h1 = document.getElementById('current');
  h1.innerText = "CURRENT: " + currentAngles.map(c => c.toFixed(0)).join(",")
  const h2 = document.getElementById('destination');
  h2.innerText = "DEST: " + destinationAngles[animationIdx].map(c => MathUtils.degToRad(c).toFixed(2)).join(",")
  animationIdx += 1
  animationIdx %= destinationAngles.length
  renderer.render(scene, camera);
  requestAnimationFrame(render);
}
