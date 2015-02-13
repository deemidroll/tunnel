var THREE = window.THREE;

var animate = require('./animate.js');

var camera, scene, renderer;

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
}

function init() {
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.z = 10;

    scene = new THREE.Scene();

    renderer = new THREE.WebGLRenderer({
        antialias: true
    });
    renderer.setClearColor(0xffffff);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    //


    var geometry = new THREE.BoxGeometry(5, 5, 5);
    var material = new THREE.MeshNormalMaterial();

    var mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    //

    window.addEventListener('resize', onWindowResize, false);
    animate(0, function () {
        renderer.render(scene, camera);
        mesh.rotation.x += 0.01;
        mesh.rotation.y += 0.01;
    });
}

init();
