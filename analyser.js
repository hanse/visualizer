
var audioContext = new webkitAudioContext()
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

function SoundAnalyzer(audioContext) {
  this.node = audioContext.createJavaScriptNode(2048, 1, 1);
  this.analyzer = audioContext.createAnalyser();
  this.source = audioContext.createBufferSource();
  this.FFT = 512;
};

SoundAnalyzer.prototype = {
  load: function(url) {
    var self = this;
    request(url, {}, function(response) {
      audioContext.decodeAudioData(response, function(buffer) {
        self.play(buffer);
      });
    });
  },

  play: function(buffer) {
    this.node.connect(audioContext.destination);
    this.node.onaudioprocess = this.visualize.bind(this);

    this.analyzer.smoothingTimeConstant = 0.3;
    this.analyzer.fftSize = this.FFT;
    this.analyzer.connect(this.node);

    this.source.connect(this.analyzer);
    this.source.connect(audioContext.destination);
    this.source.buffer = buffer;
    this.source.noteOn(0);
  },

  visualize: function() {
    var array = new Uint8Array(this.analyzer.frequencyBinCount);
    this.analyzer.getByteFrequencyData(array);
    drawSpectrum3D(array);
  }
};

/**
 * Initialize the whole she bang: load the music, create the THREE.js world 
 * and start the animation.
 */
function init() {
  var sound = new SoundAnalyzer(audioContext);
  sound.load(pickSong());

  clock = new THREE.Clock();

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  camera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, 0.1, 10000);

  scene = new THREE.Scene();
  scene.add(camera);

  var geometry = new THREE.CubeGeometry(1, 1, 1);
  var material = new THREE.MeshNormalMaterial();
  
  for (var i = 0; i < sound.FFT/2; ++i) {
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
 * Updates the visuals to reflect new data from the analyzer.
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

