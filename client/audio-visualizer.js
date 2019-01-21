const THREE = require('three')
let OrbitControls = require('three-orbit-controls')(THREE)

/*     SCENE      */
const renderVisualizer = () => {
  let scene = new THREE.Scene()

  /*    CAMERA     */
  let camera = new THREE.PerspectiveCamera(
    70, // Field of view
    window.innerWidth / window.innerHeight, // Aspect ratio
    0.1, // Near clipping pane
    2000 // Far clipping pane
  )

  camera.position.set(0, 60, 60)
  camera.lookAt(new THREE.Vector3(0, 15, 0))

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

  let playButton = document.createElement('button')
  playButton.innerText = 'Play Music'

  let stopButton = document.createElement('button')
  stopButton.innerText = 'Stop Music'

  document.body.appendChild(playButton)
  document.body.appendChild(stopButton)

  /*     AUDIO LISTENER    */
  // create an AudioListener and add it to the camera
  var listener = new THREE.AudioListener()
  camera.add(listener)

  // create an Audio source
  var sound = new THREE.Audio(listener)

  // load a sound and set it as the Audio object's buffer
  var audioLoader = new THREE.AudioLoader()

  playButton.onclick = () => {
    audioLoader.load('/music/purged.wav', function(buffer) {
      sound.setBuffer(buffer)
      sound.setLoop(true)
      sound.setVolume(0.5)
      sound.play()
    })
  }

  stopButton.onclick = () => {
    sound.stop()
  }

  // create an AudioAnalyser, passing in the sound and desired fftSize
  var analyser = new THREE.AudioAnalyser(sound, 32)

  // get the average frequency of the sound
  var frequencyData = analyser.getAverageFrequency()

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
  // A basic material that shows the geometry wireframe.
  let planeGeometry1 = new THREE.PlaneGeometry(1000, 1000, 20, 20)
  let planeMaterial = new THREE.MeshLambertMaterial({
    color: 0xff5d00,
    side: THREE.DoubleSide,
    wireframe: true
  })
  let plane = new THREE.Mesh(planeGeometry1, planeMaterial)
  plane.rotation.x = -0.5 * Math.PI
  plane.position.set(0, 5, -10)
  scene.add(plane)

  /*    GEOMETRY    */
  // A simple cone mesh
  let shapeOne = new THREE.Mesh(
    new THREE.ConeGeometry(10, 30, 60),
    new THREE.MeshStandardMaterial({
      color: 0xff0051,
      metalness: 0,
      roughness: 0.8
    })
  )
  shapeOne.position.y += 40
  shapeOne.rotateZ(Math.PI / 3)
  shapeOne.castShadow = true
  scene.add(shapeOne)

  // Add a second shape
  let shapeTwo = new THREE.Mesh(
    new THREE.OctahedronGeometry(5, 1),
    new THREE.MeshStandardMaterial({
      color: 0x47689b,
      metalness: 0,
      roughness: 0.8,
      wireframe: true
    })
  )
  shapeTwo.position.y += 15
  shapeTwo.position.x += 35
  shapeTwo.rotateZ(Math.PI / 5)
  shapeTwo.castShadow = true
  scene.add(shapeTwo)

  // Add a third shape
  let shapeThree = new THREE.Mesh(
    new THREE.BoxGeometry(10, 10, 12),
    new THREE.MeshStandardMaterial({
      color: 0x87281c,
      metalness: 0,
      roughness: 0.8
    })
  )
  shapeThree.position.y += 15
  shapeThree.position.x += -35
  shapeThree.castShadow = true
  scene.add(shapeThree)

  /*     KEY CONTROLS      */
  document.body.addEventListener('keydown', keyPressed)
  function keyPressed(e) {
    switch (e.keyCode) {
      case 87:
        shapeOne.position.y += 1
        break
      case 83:
        shapeOne.position.y -= 1
        break
      case 65:
        shapeOne.position.x -= 1
        break
      case 68:
        shapeOne.position.x += 1
        break
    }
    e.preventDefault()
    renderer.render(scene, camera)
  }

  // Generate 100 random indexes
  let mountainVertices = []
  for (let i = 0; i < 100; i++) {
    mountainVertices.push(
      Math.floor(Math.random() * plane.geometry.vertices.length)
    )
  }
  console.log(mountainVertices)

  /*        ANIMATE        */
  function animate() {
    requestAnimationFrame(animate)
    frequencyData = analyser.getAverageFrequency()

    /*    Collision Detection     */
    for (let i = 0; i < shapeOne.geometry.vertices.length; i++) {
      let localVertex = shapeOne.geometry.vertices[i].clone()
      let globalVertex = localVertex.applyMatrix4(shapeOne.matrix)
      let directionVector = globalVertex.sub(shapeOne.position)

      let ray = new THREE.Raycaster(
        shapeOne.position,
        directionVector.clone().normalize()
      )
      let collisionResults = ray.intersectObjects(scene.children)
      if (
        collisionResults.length > 0 &&
        collisionResults[0].distance < directionVector.length()
      ) {
        console.log('-------COLLISION------')
      }
    }

    /*      Plane Music Transformations     */
    let vertices
    mountainVertices.forEach(index => {
      vertices = plane.geometry.vertices
      if (frequencyData > 80) {
        vertices[index].z += frequencyData * 0.08
      } else if (frequencyData > 40) {
        vertices[index].z += frequencyData * 0.04
      } else if (vertices[index].z > -20) {
        vertices[index].z -= frequencyData * 0.2
      }
    })
    //console.log(mountainVertices);
    plane.geometry.verticesNeedUpdate = true
    plane.geometry.normalsNeedUpdate = true
    plane.geometry.computeVertexNormals()
    plane.geometry.computeFaceNormals()

    // console.log('Frequency Data');
    // console.log(frequencyData);
    controls.update()
    renderer.render(scene, camera)
  }

  animate()
}

module.exports = renderVisualizer
