var THREE = window.THREE;

var animate = require('./animate.js');

var camera, scene, renderer;

var tube;
var binormal = new THREE.Vector3();
var normal = new THREE.Vector3();

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
}

function render() {

    // Try Animate Camera Along Spline
    var time = Date.now();
    var looptime = 60 * 1000;
    var t = ( time % looptime ) / looptime;

    var pos = tube.parameters.path.getPointAt( t );
    // pos.multiplyScalar( scale );

    // interpolation
    var segments = tube.tangents.length;
    var pickt = t * segments;
    var pick = Math.floor( pickt );
    var pickNext = ( pick + 1 ) % segments;

    binormal.subVectors( tube.binormals[ pickNext ], tube.binormals[ pick ] );
    binormal.multiplyScalar( pickt - pick ).add( tube.binormals[ pick ] );


    var dir = tube.parameters.path.getTangentAt( t );

    normal.copy( binormal ).cross( dir );

    // We move on a offset on its binormal
    // pos.add( normal.clone());

    camera.position.copy( pos );


    // Camera Orientation 1 - default look at
    // splineCamera.lookAt( lookAt );

    // Using arclength for stablization in look ahead.
    var lookAt = tube.parameters.path.getPointAt( ( t + 30 / tube.parameters.path.getLength() ) % 1 );
    // Camera Orientation 2 - up orientation via normal
    lookAt.copy( pos ).add( dir );
    camera.matrix.lookAt(camera.position, lookAt, normal);
    camera.rotation.setFromRotationMatrix( camera.matrix, camera.rotation.order );

    // parent.rotation.y += ( targetRotation - parent.rotation.y ) * 0.05;

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

// function getBinormalAt(t, tube) {
//     return getNormalAt(t, tube, 'binormals');
// }

function lookAt(t, tube, tObject) {
    var tLook = normalizeT(t),
        normalLook = getNormalAt(tLook, tube),
        vectorLook = tube.parameters.path.getTangentAt(tLook)
            .add(tObject.position);

    var m1 = new THREE.Matrix4().copy( tObject.matrix );
    m1.lookAt( vectorLook, tObject.position, normalLook );
    tObject.rotation.setFromRotationMatrix( m1 );
}

function init() {
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.z = 10;

    scene = new THREE.Scene();

    renderer = new THREE.WebGLRenderer({
        antialias: true
    });
    renderer.setClearColor(0x000000);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    //
    var path = new THREE.Curves.CinquefoilKnot();
    var segments = 99;
    var radiusSegments = 12;
    var closed = true;

    tube = new THREE.TubeGeometry(path, segments, 1, radiusSegments, closed);

    var max = 100;
    var geom = createGeometry(3);
    var mat = new THREE.MeshPhongMaterial({
        color: 0xff0000,
        transparent: true,
        opacity: 0.6,
        morphTargets: true,
        emissive: 0xffff00
    });
    var line = new THREE.Mesh(geom, mat);
    // line.rotation.y = 1.5;

    var meshes = [];
    for (var i = max; i > 0; i--) {
        var t = i/max;
        var mesh = line.clone();
        var pos = tube.parameters.path.getPointAt(t);

        mesh.position.copy(pos);
        lookAt(t + 0.001, tube, mesh);
        meshes.push(mesh);
        scene.add(mesh);
        mesh.morphTargetInfluences[0] = 1;
        mesh.morphTargetInfluences[1] = 0;
        mesh.morphTargetInfluences[2] = 0;
        mesh.morphTargetInfluences[3] = 0;
        mesh.morphTargetInfluences[4] = 0;
    }
    //

    window.addEventListener('resize', onWindowResize, false);
    animate(0, function () {
        render();
    });
}

init();
