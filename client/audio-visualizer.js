const THREE = require('three')
const CANNON = require('cannon')
let OrbitControls = require('three-orbit-controls')(THREE)

const SPHERE_AMOUNT = 1

/*     SCENE      */
const renderVisualizer = () => {
  let scene = new THREE.Scene()

  //   PHYSICS SETUP
  let world = new CANNON.World()
  world.gravity.set(0, 0, -9.82)

  let sphereBodyArray = []
  for (let i = 0; i < SPHERE_AMOUNT; i++) {
    sphereBodyArray.push(
      new CANNON.Body({
        mass: 5,
        position: new CANNON.Vec3(
          Math.random() * 20,
          Math.random() * 20,
          40 + Math.random() * 50
        ),
        shape: new CANNON.Sphere(2)
      })
    )
    sphereBodyArray[i].linearDamping = 0.05
    world.addBody(sphereBodyArray[i])
  }

  let material1 = new CANNON.Material()
  let groundBody = new CANNON.Body({
    mass: 0, // mass == 0 makes the body static
    material: material1
  })
  let groundShape = new CANNON.Plane()
  groundBody.addShape(groundShape)
  world.addBody(groundBody)

  let fixedTimeStep = 1.0 / 60.0 // seconds

  /*    CAMERA     */
  let camera = new THREE.PerspectiveCamera(
    70, // Field of view
    window.innerWidth / window.innerHeight, // Aspect ratio
    0.1, // Near clipping pane
    2000 // Far clipping pane
  )

  camera.position.set(0, -60, 60)
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
    side: THREE.DoubleSide
  })
  let plane = new THREE.Mesh(planeGeometry1, planeMaterial)
  plane.position.set(0, 0, -5)
  scene.add(plane)

  let groundMaterial = new CANNON.Material()
  let ground = new CANNON.ContactMaterial(groundMaterial, planeMaterial, {
    friction: 0.0,
    restitution: 0.7
  })
  world.addContactMaterial(ground)

  /*    GEOMETRY    */

  let sphereMeshArray = []
  for (let i = 0; i < SPHERE_AMOUNT; i++) {
    var geometry = new THREE.SphereGeometry(5, 32, 32)
    var material = new THREE.MeshBasicMaterial({color: 0xffff00})
    sphereMeshArray.push(new THREE.Mesh(geometry, material))
    sphereMeshArray[i].castShadow = true
    scene.add(sphereMeshArray[i])
  }

  /*     KEY CONTROLS      */
  document.body.addEventListener('keydown', keyPressed)
  function keyPressed(e) {
    switch (e.keyCode) {
      case 87:
        sphereBodyArray[0].position.y += 1
        break
      case 83:
        sphereBodyArray[0].position.y -= 1
        break
      case 65:
        sphereBodyArray[0].position.x -= 1
        break
      case 68:
        sphereBodyArray[0].position.x += 1
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
    world.step(fixedTimeStep)

    for (let i = 0; i < SPHERE_AMOUNT; i++) {
      sphereMeshArray[i].position.x = sphereBodyArray[i].position.x
      sphereMeshArray[i].position.y = sphereBodyArray[i].position.y
      sphereMeshArray[i].position.z = sphereBodyArray[i].position.z
      sphereMeshArray[i].quaternion.x = sphereBodyArray[i].quaternion.x
      sphereMeshArray[i].quaternion.y = sphereBodyArray[i].quaternion.y
      sphereMeshArray[i].quaternion.z = sphereBodyArray[i].quaternion.z
      sphereMeshArray[i].quaternion.w = sphereBodyArray[i].quaternion.w
    }

    /*    Collision Detection     */
    // for (let i = 0; i < sphereMeshArray[0].geometry.vertices.length; i++) {
    //   let localVertex = sphereMeshArray[0].geometry.vertices[i].clone()
    //   let globalVertex = localVertex.applyMatrix4(sphereMeshArray[0].matrix)
    //   let directionVector = globalVertex.sub(sphereMeshArray[0].position)

    //   let ray = new THREE.Raycaster(
    //     sphereMeshArray[0].position,
    //     directionVector.clone().normalize()
    //   )
    //   let collisionResults = ray.intersectObjects(scene.children)
    //   if (
    //     collisionResults.length > 0 &&
    //     collisionResults[0].distance < directionVector.length()
    //   ) {
    //     console.log('-------COLLISION------')
    //   }
    // }

    /*      Plane Music Transformations     */
    let vertices
    let prevHigh = 0
    mountainVertices.forEach(index => {
      vertices = plane.geometry.vertices
      if (
        frequencyData > 80 &&
        frequencyData >= prevHigh &&
        vertices[index].z < 130
      ) {
        vertices[index].z += frequencyData * 0.05
      } else if (frequencyData > 40 && frequencyData >= prevHigh) {
        vertices[index].z -= frequencyData * 0.03
      } else if (vertices[index].z > 0) {
        vertices[index].z -= frequencyData * 0.1
      }
      prevHigh = frequencyData
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
