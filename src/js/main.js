var Detector = window.Detector;
var THREE = window.THREE;

var animate = require('./animate.js');

if (! Detector.webgl) Detector.addGetWebGLMessage();

var camera, scene, renderer;

// var light;

var tube;
var binormal = new THREE.Vector3();
var normal = new THREE.Vector3();

var meshes = [];

var influence = 0;
var influence1 = 0;
var influence2 = 0;

var angle = 0;
var axis = new THREE.Vector3(0, 0, 1);
var PI = Math.PI;
var PI_360 = Math.PI/360;

// var sphere;

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
}

function normalizeT(t) {
    t = t % 1;
    t = t < 0 ? 1 + t : t;
    return t;
}

function getNormalAt(t, tube, normals) {
    normals = normals || 'normals';
    t = normalizeT(t);
    var normal = new THREE.Vector3(),
        segments = tube[normals].length,
        pickt = t * segments,
        pick = Math.floor( pickt ),
        pickNext = ( pick + 1 ) % segments;

    if (pick < 0) pick = 0;

    normal.subVectors( tube[normals][ pickNext ], tube[normals][ pick ] );
    normal.multiplyScalar( pickt - pick ).add( tube[normals][ pick ] );
    return normal;
}

function updMeshes() {
    // console.log(meshes[0].position.distanceTo(pos));
    meshes.forEach(function (mesh) {
        // if (mesh.position.distanceTo(pos) < 10) {
        //     mesh.material.opacity = 0.9;
        // } else {
        //     mesh.material.opacity = 0;
        // }
        // mesh.material.opacity = 1 - mesh.position.distanceTo(pos)/10;
        mesh.morphTargetInfluences[0] = influence;
        mesh.morphTargetInfluences[2] = influence1;
        mesh.morphTargetInfluences[3] = influence2;
    });
    // console.log(meshes[1].position.distanceTo(pos));
    // meshes.forEach(function (mesh) {
    //     if ()
    // });
}

function render() {

    // Try Animate Camera Along Spline
    var time = Date.now();
    var looptime = 60 * 1000;
    var t = ( time % looptime ) / looptime;

    var pos = tube.parameters.path.getPointAt( t );
    // var pos2 = tube.parameters.path.getPointAt( normalizeT(t + 0.01) );
    // pos.multiplyScalar( scale );

    // interpolation
    var segments = tube.tangents.length;
    var pickt = t * segments;
    var pick = Math.floor( pickt );
    var pickNext = ( pick + 1 ) % segments;

    binormal.subVectors( tube.binormals[ pickNext ], tube.binormals[ pick ] );
    binormal.multiplyScalar( pickt - pick ).add( tube.binormals[ pick ] );


    var dir = tube.parameters.path.getTangentAt( t );

    normal.copy( binormal.applyAxisAngle(axis, angle) ).cross( dir );
    angle += PI_360;
    if (angle > 2*PI) angle = 0;

    // We move on a offset on its binormal
    // pos.add( normal.clone());

    camera.position.copy( pos );

    // light.position.copy( pos2 );
    // sphere.position.copy( pos2 );


    // Camera Orientation 1 - default look at
    // splineCamera.lookAt( lookAt );

    // Using arclength for stablization in look ahead.
    var lookAt = tube.parameters.path.getPointAt( ( t + 30 / tube.parameters.path.getLength() ) % 1 );
    // Camera Orientation 2 - up orientation via normal
    lookAt.copy( pos ).add( dir );
    camera.matrix.lookAt(camera.position, lookAt, normal);
    camera.rotation.setFromRotationMatrix( camera.matrix, camera.rotation.order );

    // parent.rotation.y += ( targetRotation - parent.rotation.y ) * 0.05;
    updMeshes();
    renderer.render( scene, camera );
}

function createGeometry(circumradius) {
    var geometry = new THREE.Geometry(),
        x,
        innerradius = circumradius * 0.9,
        n = 60;

    function setMainVert (rad, numb) {
        var vert = [];
        for (var i = 0; i < numb; i++) {
            var vec3 = new THREE.Vector3(
                rad * Math.sin((Math.PI / numb) + (i * ((2 * Math.PI)/ numb))),
                rad * Math.cos((Math.PI / numb) + (i * ((2 * Math.PI)/ numb))),
                0
            );
            vert.push(vec3);
        }
        return vert;
    }

    function fillVert (vert) {
        var nFilled, nUnfilled, result = [];

        nFilled = vert.length;
        nUnfilled = n/nFilled;
        vert.forEach(function (el, i, arr) {
            var nextInd = i === arr.length - 1 ? 0 : i + 1;
            var vec = el.clone().sub(arr[nextInd]);
            for (var j = 0; j < nUnfilled; j++) {
                result.push(vec.clone().multiplyScalar(1/nUnfilled).add(el));
            }
        });
        return result;
    }

    // set morph targets
    [60, 5, 4, 3, 2].forEach(function (el, i) {
        var vert,
            vertOuter,
            vertInner;

        vertOuter = fillVert(setMainVert(circumradius, el).slice(0)).slice(0);
        vertInner = fillVert(setMainVert(innerradius, el).slice(0)).slice(0);

        vert = vertOuter.concat(vertInner);

        geometry.morphTargets.push({name: 'vert'+i, vertices: vert});

        if (i === 0) {
            geometry.vertices = vert.slice(0);
        }
    });

    // Generate the faces of the n-gon.
    for (x = 0; x < n; x++) {
        var next = x === n - 1 ? 0 : x + 1;
        geometry.faces.push(new THREE.Face3(x, next, x + n));
        geometry.faces.push(new THREE.Face3(x + n, next, next + n));
    }

    return geometry;
}

var color1 = {r: 83, g: 246, b: 200};
var color2 = {r: 36, g: 141, b: 187};
var colorC = {r: 83, g: 246, b: 200};
function setColor(d) {
    ['r', 'g', 'b'].forEach(function (channel) {
        colorC[channel] = color1[channel] + (color2[channel] - color1[channel]) * d;
    });
    renderer.setClearColor(new THREE.Color(colorC.r/255, colorC.g/255, colorC.b/255));
}

// function getBinormalAt(t, tube) {
//     return getNormalAt(t, tube, 'binormals');
// }

function mousemove(e) {
    var dx = e.pageX / window.innerWidth;
    var dy = e.pageY / window.innerHeight;
    if (dx < 0.5) {
        influence = dx * 2;
        influence1 = 1 - influence;
        influence2 = 0;
    } else {
        influence = (1 - dx) * 2;
        influence2 = 1 - influence;
        influence1 = 0;
    }
    setColor(dy);
}

function lookAt(t, tube, tObject, flag) {
    var tLook = normalizeT(t),
        normalLook = getNormalAt(tLook, tube),
        vectorLook = tube.parameters.path.getTangentAt(tLook)
            .add(tObject.position);

    normalLook = flag ? normalLook.applyAxisAngle(axis, PI/4) : normalLook;

    var m1 = new THREE.Matrix4().copy( tObject.matrix );
    m1.lookAt( vectorLook, tObject.position, normalLook );
    tObject.rotation.setFromRotationMatrix( m1 );
}

function init() {
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);

    scene = new THREE.Scene();

    renderer = new THREE.WebGLRenderer({
        antialias: true
    });
    renderer.setClearColor(new THREE.Color(colorC.r/255, colorC.g/255, colorC.b/255));
    // renderer.setClearColor(0xffffff);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // light = new THREE.PointLight(0xffffff, 0.1, 100);
    // scene.add(light);
    // camera.add(light);

    var path = new THREE.Curves.CinquefoilKnot();
    // var path = new THREE.Curves.DecoratedTorusKnot5a();
    var segments = 99;
    var radiusSegments = 36;
    var closed = true;

    tube = new THREE.TubeGeometry(path, segments, 3.2, radiusSegments, closed);

    // var geometry = new THREE.SphereGeometry( 0.5, 32, 32 );
    // var material = new THREE.MeshBasicMaterial( {color: 0xffff00} );
    // sphere = new THREE.Mesh( geometry, material );
    // scene.add( sphere );

    var max = 200;
    var geom = createGeometry(3);
    var mat = new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0.9,
        morphTargets: true,
        color: 0xffffff,
        // ambient: 0x111111,
        // vertexColors: THREE.FaceColors,
        // emissive: 0x33ff66,
        // specular: 0xffffff,
        // metal: true,
    });
    var line = new THREE.Mesh(geom, mat);
    // line.rotation.y = 1.5;

    for (var i = max; i > 0; i--) {
        var t = i/max;
        // var mat = new THREE.MeshBasicMaterial({
        //     transparent: true,
        //     opacity: 0.9,
        //     morphTargets: true,
        //     color: 0xffffff,
        //     // ambient: 0x111111,
        //     // vertexColors: THREE.FaceColors,
        //     // emissive: 0x33ff66,
        //     specular: 0xffffff,
        //     // metal: true,
        // });
        // var mesh = new THREE.Mesh(geom, mat);
        var mesh = line.clone();
        var pos = tube.parameters.path.getPointAt(t);

        mesh.position.copy(pos);
        lookAt(t + 0.001, tube, mesh);
        meshes.push(mesh);
        scene.add(mesh);
    }
    //

    window.addEventListener('resize', onWindowResize, false);
    animate(0, function () {
        render();
    });
    document.addEventListener('mousemove', mousemove, false );
}

init();
