const THREE = require('three')
const CANNON = require('cannon')
let OrbitControls = require('three-orbit-controls')(THREE)

const GRID_SIZE = 18

const songs = [
  '/music/big_changes.mp3',
  '/music/trash_panda.mp3',
  '/music/moon.mp3',
  '/music/kronk',
  '/music/that_way.mp3'
]

const colors = [
  0xff3333,
  0xff3380,
  0xff4463,
  0xff4593,
  0xff5633,
  0xff5733,
  0xff6833,
  0xff6933,
  0xff7433,
  0xff7733,
  0xff8333,
  0xff8933,
  0xff9433,
  0xff9755,
  0xffa563,
  0xffa973,
  0xffb333,
  0xffc863,
  0xffd563,
  0xffe397,
  0xffe397,
  0xfff197,
  0xfff327,
  0xfff697,
  0xfff997
]

/*     SCENE      */
const renderVisualizer = () => {
  let scene = new THREE.Scene()

  //   PHYSICS SETUP
  let world = new CANNON.World()
  world.gravity.set(0, 0, -10)

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
    400 // Far clipping pane
  )
  camera.position.set(0, -140, 60)
  //camera.rotation.y = Math.PI / 4;
  camera.lookAt(scene.position)

  let controls = new OrbitControls(camera)

  /*      RENDERER      */
  let renderer = new THREE.WebGLRenderer({antialias: true})
  renderer.setSize(window.innerWidth - 200, window.innerHeight - 100)
  renderer.setClearColor(0xfff6e6)

  // Enable shadow mapping
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap

  // Append to the document
  document.body.appendChild(renderer.domElement)

  // Create Buttons
  let playButton = document.createElement('button')
  playButton.className = 'main'
  playButton.innerText = 'Play Music'

  let stopButton = document.createElement('button')
  stopButton.className = 'main'
  stopButton.innerText = 'Stop Music'

  let addCube = document.createElement('button')
  addCube.className = 'main'
  addCube.innerText = 'Create Cube'

  let nextSong = document.createElement('button')
  nextSong.className = 'main'
  nextSong.innerText = 'Next Song'

  document.body.appendChild(playButton)
  document.body.appendChild(stopButton)
  document.body.appendChild(nextSong)
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
  let trackId = 0
  playButton.onclick = () => {
    audioLoader.load(songs[trackId], function(buffer) {
      sound.setBuffer(buffer)
      sound.setLoop(true)
      sound.setVolume(0.5)
      sound.play()
    })
  }

  stopButton.onclick = () => {
    sound.stop()
  }

  nextSong.onclick = () => {
    sound.stop()
    if (trackId === songs.length - 1) {
      trackId = 0
    } else {
      trackId++
    }

    audioLoader.load(songs[trackId], function(buffer) {
      sound.setBuffer(buffer)
      sound.setLoop(true)
      sound.setVolume(0.5)
      sound.play()
    })
  }

  addCube.onclick = () => {
    // CREATE the Cannon body of cube
    let shape = new CANNON.Box(new CANNON.Vec3(8, 8, 8))
    let body = new CANNON.Body({mass: 100})
    body.addShape(shape)
    body.position.set(
      Math.random() * 40 - 20,
      Math.random() * 20,
      80 + Math.random() * 200
    )
    world.addBody(body)
    cubeBodyArray.push(body)

    // CREATE the Three mesh of cube
    let boxGeometry = new THREE.BoxGeometry(8, 8, 8)
    let material = new THREE.MeshLambertMaterial({
      color: 0x88ffdc,
      flatShading: true
    })
    tempBox = new THREE.Mesh(boxGeometry, material)
    tempBox.castShadow = true
    tempBox.position.set(
      Math.random() * 40 - 20,
      Math.random() * 20,
      80 + Math.random() * 200
    )
    scene.add(tempBox)
    cubeMeshArray.push(tempBox)
  }

  // create an AudioAnalyser, passing in the sound and desired fftSize
  let analyser = new THREE.AudioAnalyser(sound, 32)

  // get the average frequency of the sound
  let frequencyData = analyser.getAverageFrequency()

  /*      LIGHTS     */
  // Add an ambient lights
  // let ambientLight = new THREE.AmbientLight(0xffffff, 0.4)
  // scene.add(ambientLight)

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
  let tempBox
  for (let i = 0; i < GRID_SIZE; i++) {
    //console.log(colors[i])
    let material = new THREE.MeshLambertMaterial({color: colors[i]})
    for (let j = 0; j < GRID_SIZE; j++) {
      // CREATE the Cannon body of grid boxes
      let boxShape = new CANNON.Box(new CANNON.Vec3(10, 10, 10))
      tempBox = new CANNON.Body({mass: 1})
      tempBox.addShape(boxShape)
      tempBox.position.set(
        (j - GRID_SIZE / 2) * 13,
        (GRID_SIZE / 2 - i) * 13,
        0
      )
      world.addBody(tempBox)
      boxBodyArray.push(tempBox)

      // CREATE the Three mesh of grid boxes

      let boxGeometry = new THREE.BoxGeometry(10, 10, 10)
      tempBox = new THREE.Mesh(boxGeometry, material)
      tempBox.position.set(
        (j - GRID_SIZE / 2) * 13,
        (GRID_SIZE / 2 - i) * 13,
        0
      )
      scene.add(tempBox)
      boxMeshArray.push(tempBox)
    }
  }

  /*        ANIMATE        */
  function animate() {
    requestAnimationFrame(animate)
    frequencyData = analyser.getFrequencyData()
    world.step(fixedTimeStep)

    // Update ground to push up objects
    world.bodies[0].position.z = analyser.getAverageFrequency() * 0.24

    for (let i = 0; i < boxBodyArray.length; i++) {
      boxBodyArray[i].position.z =
        frequencyData[Math.floor(12 * i / boxBodyArray.length)] * 0.2
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
