const THREE = require('three')
const CANNON = require('cannon')
let OrbitControls = require('three-orbit-controls')(THREE)

const SPHERE_AMOUNT = 1
const GRID_SIZE = 10

/*     SCENE      */
const renderVisualizer = () => {
  let scene = new THREE.Scene()

  //   PHYSICS SETUP
  let world = new CANNON.World()
  //world.broadphase = new CANNON.NaiveBroadphase();
  world.gravity.set(0, 0, -9.82)
  // world.solver.tolerance = 0.001;

  //   world.defaultContactMaterial.contactEquationStiffness = 5e6;
  //   world.defaultContactMaterial.contactEquationRelaxation = 3;

  let cubeBodyArray = []
  let cubeMeshArray = []

  // Create Ground planes
  let material1 = new CANNON.Material()
  let groundBody = new CANNON.Body({
    mass: 0, // mass == 0 makes the body static
    material: material1
  })
  let groundShape = new CANNON.Plane()
  groundBody.addShape(groundShape)
  groundBody.position.set(0, 0, 0)
  world.addBody(groundBody)

  let fixedTimeStep = 1.0 / 60.0 // seconds

  /*    CAMERA     */
  let camera = new THREE.PerspectiveCamera(
    70, // Field of view
    window.innerWidth / window.innerHeight, // Aspect ratio
    0.1, // Near clipping pane
    2000 // Far clipping pane
  )

  camera.position.set(0, -120, 60)
  //camera.rotation.y = Math.PI / 4;
  camera.lookAt(scene.position)

  let controls = new OrbitControls(camera)

  /*      RENDERER      */
  let renderer = new THREE.WebGLRenderer({antialias: true})
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setClearColor(0xfff6e6)

  // Enable shadow mapping
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap

  // Append to the document
  document.body.appendChild(renderer.domElement)

  // Create Buttons
  let playButton = document.createElement('button')
  playButton.innerText = 'Play Music'

  let stopButton = document.createElement('button')
  stopButton.innerText = 'Stop Music'

  let addCube = document.createElement('button')
  addCube.innerText = 'Create Cube'

  document.body.appendChild(playButton)
  document.body.appendChild(stopButton)
  document.body.appendChild(addCube)

  /*     AUDIO LISTENER    */
  // create an AudioListener and add it to the camera
  let listener = new THREE.AudioListener()
  camera.add(listener)

  // create an Audio source
  let sound = new THREE.Audio(listener)

  // load a sound and set it as the Audio object's buffer
  let audioLoader = new THREE.AudioLoader()

  /*      BUTTON LISTENERS     */
  playButton.onclick = () => {
    audioLoader.load('/music/trash_panda.wav', function(buffer) {
      sound.setBuffer(buffer)
      sound.setLoop(true)
      sound.setVolume(0.5)
      sound.play()
    })
  }

  stopButton.onclick = () => {
    sound.stop()
  }

  let tempCube
  addCube.onclick = () => {
    // CREATE the Cannon body of cube
    let shape = new CANNON.Box(new CANNON.Vec3(3, 3, 3))
    let body = new CANNON.Body({mass: 5})
    body.addShape(shape)
    body.position.set(Math.random() * 20 - 10, Math.random() * 10, 80)
    world.addBody(body)
    cubeBodyArray.push(body)

    // CREATE the Three mesh of cube
    let boxGeometry = new THREE.BoxGeometry(3, 3, 3)
    let material = new THREE.MeshBasicMaterial({
      color: 0x0000ff,
      flatShading: true
    })
    tempBox = new THREE.Mesh(boxGeometry, material)
    tempBox.castShadow = true
    tempBox.position.set(Math.random() * 20 - 10, Math.random() * 10, 80)
    scene.add(tempBox)
    cubeMeshArray.push(tempBox)

    // let boxGround = new CANNON.ContactMaterial(groundMaterial, material, {
    //     friction: 0.1,
    //     restitution: 0.7
    // })
    // world.addContactMaterial(boxGround)
  }

  // create an AudioAnalyser, passing in the sound and desired fftSize
  let analyser = new THREE.AudioAnalyser(sound, 32)

  // get the average frequency of the sound
  let frequencyData = analyser.getAverageFrequency()

  /*      LIGHTS     */
  // Add an ambient lights
  let ambientLight = new THREE.AmbientLight(0xffffff, 0.2)
  scene.add(ambientLight)

  // Add a point light that will cast shadows
  let pointLight = new THREE.PointLight(0xffffff, 1)
  pointLight.position.set(25, 50, 25)
  pointLight.castShadow = true
  pointLight.shadow.mapSize.width = 1024
  pointLight.shadow.mapSize.height = 1024
  scene.add(pointLight)

  /*    Plane    */
  // Creating boxes in Cannon and Three to serve as a grid plane
  let boxBodyArray = []
  let boxMeshArray = []
  let material = new THREE.MeshBasicMaterial({color: 0x00ff00})
  let tempBox
  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE; j++) {
      // CREATE the Cannon body of grid boxes
      let boxShape = new CANNON.Box(new CANNON.Vec3(10, 10, 10))
      tempBox = new CANNON.Body({mass: 1})
      tempBox.addShape(boxShape)
      tempBox.position.set(
        (j - GRID_SIZE / 2) * 12,
        (GRID_SIZE / 2 - i) * 12,
        0
      )
      world.addBody(tempBox)
      boxBodyArray.push(tempBox)

      // CREATE the Three mesh of grid boxes

      //material.color += 0x0000aa;
      let boxGeometry = new THREE.BoxGeometry(10, 10, 10)
      tempBox = new THREE.Mesh(boxGeometry, material)
      tempBox.position.set(
        (j - GRID_SIZE / 2) * 12,
        (GRID_SIZE / 2 - i) * 12,
        0
      )
      scene.add(tempBox)
      boxMeshArray.push(tempBox)
    }
  }

  //   let groundMaterial = new CANNON.Material()
  //   let ground = new CANNON.ContactMaterial(groundMaterial, material, {
  //     friction: 0.0,
  //     restitution: 0.7
  //   })
  //   world.addContactMaterial(ground)

  /*     KEY CONTROLS      */
  document.body.addEventListener('keydown', keyPressed)
  function keyPressed(e) {
    switch (e.keyCode) {
      case 87:
        cubeBodyArray[0].position.y += 1
        break
      case 83:
        cubeBodyArray[0].position.y -= 1
        break
      case 65:
        cubeBodyArray[0].position.x -= 1
        break
      case 68:
        cubeBodyArray[0].position.x += 1
        break
    }
    e.preventDefault()
    renderer.render(scene, camera)
  }
  let flag
  // Generate 100 random indexes
  //   let mountainVertices = []
  //   for (let i = 0; i < 100; i++) {
  //     mountainVertices.push(
  //       Math.floor(Math.random() * plane.geometry.vertices.length)
  //     )
  //   }
  //   console.log(mountainVertices)

  /*        ANIMATE        */
  function animate() {
    requestAnimationFrame(animate)
    frequencyData = analyser.getFrequencyData()
    world.step(fixedTimeStep)

    // Update ground to push up objects
    world.bodies[0].position.z = analyser.getAverageFrequency() * 0.15

    for (let i = 0; i < boxBodyArray.length; i++) {
      boxBodyArray[i].position.z =
        frequencyData[Math.floor(16 * i / boxBodyArray.length)] * 0.15
    }

    for (let i = 0; i < boxMeshArray.length; i++) {
      boxMeshArray[i].position.z = boxBodyArray[i].position.z
      boxMeshArray[i].geometry.verticesNeedUpdate = true
      boxMeshArray[i].geometry.normalsNeedUpdate = true
      boxMeshArray[i].geometry.computeVertexNormals()
      boxMeshArray[i].geometry.computeFaceNormals()
    }

    for (let i = 0; i < cubeMeshArray.length; i++) {
      cubeMeshArray[i].position.x = cubeBodyArray[i].position.x
      cubeMeshArray[i].position.y = cubeBodyArray[i].position.y
      cubeMeshArray[i].position.z = cubeBodyArray[i].position.z
      cubeMeshArray[i].quaternion.x = cubeBodyArray[i].quaternion.x
      cubeMeshArray[i].quaternion.y = cubeBodyArray[i].quaternion.y
      cubeMeshArray[i].quaternion.z = cubeBodyArray[i].quaternion.z
      cubeMeshArray[i].quaternion.w = cubeBodyArray[i].quaternion.w

      cubeMeshArray[i].geometry.verticesNeedUpdate = true
      cubeMeshArray[i].geometry.normalsNeedUpdate = true
      cubeMeshArray[i].geometry.computeVertexNormals()
      cubeMeshArray[i].geometry.computeFaceNormals()
    }

    controls.update()
    renderer.render(scene, camera)
  }

  animate()
}

module.exports = renderVisualizer
