var context = new webkitAudioContext();

var FFT = 512;

var songs = [
  "song1.mp3"
];

var clock, renderer, scene, cubes = [];

function pickSong() {
  return songs[Math.floor(Math.random()*songs.length)];
}

function loadSound() {
  var request = new XMLHttpRequest();
  request.open("GET", pickSong());
  request.responseType = "arraybuffer";
  request.addEventListener("load", function() {
    context.decodeAudioData(request.response, function(buffer) {
      playSound(buffer);
    });
  });
  request.send();
}

var node, analyser, source;

function playSound(buffer) {
  node = context.createJavaScriptNode(2048, 1, 1);
  node.connect(context.destination);
  node.onaudioprocess = visualize;

  analyser = context.createAnalyser();
  analyser.smoothingTimeConstant = 0.3;
  analyser.fftSize = FFT;

  analyser.connect(node);

  source = context.createBufferSource();
  source.connect(analyser);
  source.connect(context.destination);
  source.buffer = buffer;
  source.noteOn(0);
}

function visualize() {
  var array = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(array);
  drawSpectrum3D(array);
}

function init() {
  loadSound();

  clock = new THREE.Clock();

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  camera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, 0.1, 10000);

  scene = new THREE.Scene();
  scene.add(camera);

  var geometry = new THREE.CubeGeometry(1, 1, 1);
  var material = new THREE.MeshNormalMaterial();
  
  for (var i = 0; i < FFT/2; ++i) {
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(-100 + i, 0, 0);
    cubes.push(mesh);
    scene.add(mesh);
  }

  var pointLight = new THREE.SpotLight( 0xFFFFFF );
  pointLight.castShadow = true;
  pointLight.position.x = 0;
  pointLight.position.y = 40;
  pointLight.position.z = 160;
  scene.add(pointLight);

  var backLight = new THREE.DirectionalLight( 0xFFFFFF, 0.5 );
  backLight.position.x = 10;
  backLight.position.y = 50;
  backLight.position.z = -130;
  scene.add(backLight);

  animate();
}

function drawSpectrum3D(array) {
  for (var i = 0; i < array.length; ++i) {
    var value = array[i];
    if (i % 2 == 0) {
      cubes[i].scale.y = value/2;
    } else {
      cubes[i].scale.z = value/2;
    }
  }
}

function animate() {
  requestAnimationFrame(animate);
  var time = clock.getElapsedTime();
  camera.position.x = Math.cos(time*0.1)*100;
  camera.position.z = Math.sin(time*0.5)*400;
  camera.position.y = 10;
  camera.lookAt(scene.position);

  renderer.render(scene, camera);
}

init();
