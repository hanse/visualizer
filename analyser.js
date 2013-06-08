var context = new webkitAudioContext()
  , FFT = 512
  , songs = ["song1.mp3"]
  , clock, renderer, scene, cubes = [];

/**
 * Pick a random song from the songs array.
 */
function pickSong() {
  return songs[Math.floor(Math.random()*songs.length)];
}

/**
 * Wrapper around XMLHttpRequest
 */
function request(url, opts, fn) {
  var defaults = {
    method: "GET",
    responseType: "arraybuffer"
  };

  for (prop in defaults) {
    opts[prop] = opts[prop] || defaults[prop];
  }

  var xhr = new XMLHttpRequest();
  xhr.open(opts.method, url);
  xhr.responseType = opts.responseType;
  xhr.addEventListener("load", function() {
    fn(xhr.response);
  });
  xhr.send();
}

/**
 * Load the song data and when loaded, decode the audio data
 * and start the visualization.
 */
function loadSound() {
  request(pickSong(), {}, function(response) {
    context.decodeAudioData(response, function(buffer) {
      playSound(buffer);
    });
  });
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

/**
 * Visualization callback, called when the analyser has new data.
 */
function visualize() {
  var array = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(array);
  drawSpectrum3D(array);
}

/**
 * Initialize the whole she bang: load the music, create the THREE.js world 
 * and start the animation.
 */
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

/**
 * Updates the visuals to reflect new data from the analyser.
 */
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

