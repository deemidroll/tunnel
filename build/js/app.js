/* Made by deemidroll | 2015 | deemidroll@gmail.com */
(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
window.requestAnimationFrame = function () {
    return (
        window.requestAnimationFrame       ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame    ||
        window.oRequestAnimationFrame      ||
        window.msRequestAnimationFrame     ||
        function(/* function */ callback){
            window.setTimeout(callback, 1000 / 60);
        }
    );
}();
window.cancelAnimationFrame = function () {
    return (
        window.cancelAnimationFrame       ||
        window.webkitCancelAnimationFrame ||
        window.mozCancelAnimationFrame    ||
        window.oCancelAnimationFrame      ||
        window.msCancelAnimationFrame     ||
        function(id){
            window.clearTimeout(id);
        }
    );
}();

function animate(nowMsec, callback) {
    var deltaMsec;
    nowMsec = nowMsec || Date.now();
    animate.lastTimeMsec = animate.lastTimeMsec || nowMsec - 1000 / 60;
    deltaMsec = Math.min(100, nowMsec - animate.lastTimeMsec);
    // keep looping
    animate.id = window.requestAnimationFrame(animate);
    // change last time
    animate.lastTimeMsec = nowMsec;
    // call each update function
    if (callback) animate.callback = callback;
    animate.callback(deltaMsec, nowMsec, animate.id);
}

module.exports = animate;
},{}],2:[function(require,module,exports){
var THREE = window.THREE;

var animate = require('./animate.js');

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

},{"./animate.js":1}]},{},[2])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9EbWl0cnkvcHJvamVjdHMvaGVsaWNvcHRlci90ZWNoL3R1bm5lbC9ub2RlX21vZHVsZXMvd2F0Y2hpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9Vc2Vycy9EbWl0cnkvcHJvamVjdHMvaGVsaWNvcHRlci90ZWNoL3R1bm5lbC9zcmMvanMvYW5pbWF0ZS5qcyIsIi9Vc2Vycy9EbWl0cnkvcHJvamVjdHMvaGVsaWNvcHRlci90ZWNoL3R1bm5lbC9zcmMvanMvbWFpbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIndpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIChcbiAgICAgICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSAgICAgICB8fFxuICAgICAgICB3aW5kb3cud2Via2l0UmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8XG4gICAgICAgIHdpbmRvdy5tb3pSZXF1ZXN0QW5pbWF0aW9uRnJhbWUgICAgfHxcbiAgICAgICAgd2luZG93Lm9SZXF1ZXN0QW5pbWF0aW9uRnJhbWUgICAgICB8fFxuICAgICAgICB3aW5kb3cubXNSZXF1ZXN0QW5pbWF0aW9uRnJhbWUgICAgIHx8XG4gICAgICAgIGZ1bmN0aW9uKC8qIGZ1bmN0aW9uICovIGNhbGxiYWNrKXtcbiAgICAgICAgICAgIHdpbmRvdy5zZXRUaW1lb3V0KGNhbGxiYWNrLCAxMDAwIC8gNjApO1xuICAgICAgICB9XG4gICAgKTtcbn0oKTtcbndpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZSA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gKFxuICAgICAgICB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUgICAgICAgfHxcbiAgICAgICAgd2luZG93LndlYmtpdENhbmNlbEFuaW1hdGlvbkZyYW1lIHx8XG4gICAgICAgIHdpbmRvdy5tb3pDYW5jZWxBbmltYXRpb25GcmFtZSAgICB8fFxuICAgICAgICB3aW5kb3cub0NhbmNlbEFuaW1hdGlvbkZyYW1lICAgICAgfHxcbiAgICAgICAgd2luZG93Lm1zQ2FuY2VsQW5pbWF0aW9uRnJhbWUgICAgIHx8XG4gICAgICAgIGZ1bmN0aW9uKGlkKXtcbiAgICAgICAgICAgIHdpbmRvdy5jbGVhclRpbWVvdXQoaWQpO1xuICAgICAgICB9XG4gICAgKTtcbn0oKTtcblxuZnVuY3Rpb24gYW5pbWF0ZShub3dNc2VjLCBjYWxsYmFjaykge1xuICAgIHZhciBkZWx0YU1zZWM7XG4gICAgbm93TXNlYyA9IG5vd01zZWMgfHwgRGF0ZS5ub3coKTtcbiAgICBhbmltYXRlLmxhc3RUaW1lTXNlYyA9IGFuaW1hdGUubGFzdFRpbWVNc2VjIHx8IG5vd01zZWMgLSAxMDAwIC8gNjA7XG4gICAgZGVsdGFNc2VjID0gTWF0aC5taW4oMTAwLCBub3dNc2VjIC0gYW5pbWF0ZS5sYXN0VGltZU1zZWMpO1xuICAgIC8vIGtlZXAgbG9vcGluZ1xuICAgIGFuaW1hdGUuaWQgPSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKGFuaW1hdGUpO1xuICAgIC8vIGNoYW5nZSBsYXN0IHRpbWVcbiAgICBhbmltYXRlLmxhc3RUaW1lTXNlYyA9IG5vd01zZWM7XG4gICAgLy8gY2FsbCBlYWNoIHVwZGF0ZSBmdW5jdGlvblxuICAgIGlmIChjYWxsYmFjaykgYW5pbWF0ZS5jYWxsYmFjayA9IGNhbGxiYWNrO1xuICAgIGFuaW1hdGUuY2FsbGJhY2soZGVsdGFNc2VjLCBub3dNc2VjLCBhbmltYXRlLmlkKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBhbmltYXRlOyIsInZhciBUSFJFRSA9IHdpbmRvdy5USFJFRTtcblxudmFyIGFuaW1hdGUgPSByZXF1aXJlKCcuL2FuaW1hdGUuanMnKTtcblxudmFyIGNhbWVyYSwgc2NlbmUsIHJlbmRlcmVyO1xuXG4vLyB2YXIgbGlnaHQ7XG5cbnZhciB0dWJlO1xudmFyIGJpbm9ybWFsID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcbnZhciBub3JtYWwgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuXG52YXIgbWVzaGVzID0gW107XG5cbnZhciBpbmZsdWVuY2UgPSAwO1xudmFyIGluZmx1ZW5jZTEgPSAwO1xudmFyIGluZmx1ZW5jZTIgPSAwO1xuXG52YXIgYW5nbGUgPSAwO1xudmFyIGF4aXMgPSBuZXcgVEhSRUUuVmVjdG9yMygwLCAwLCAxKTtcbnZhciBQSSA9IE1hdGguUEk7XG52YXIgUElfMzYwID0gTWF0aC5QSS8zNjA7XG5cbi8vIHZhciBzcGhlcmU7XG5cbmZ1bmN0aW9uIG9uV2luZG93UmVzaXplKCkge1xuICAgIGNhbWVyYS5hc3BlY3QgPSB3aW5kb3cuaW5uZXJXaWR0aCAvIHdpbmRvdy5pbm5lckhlaWdodDtcbiAgICBjYW1lcmEudXBkYXRlUHJvamVjdGlvbk1hdHJpeCgpO1xuXG4gICAgcmVuZGVyZXIuc2V0U2l6ZSh3aW5kb3cuaW5uZXJXaWR0aCwgd2luZG93LmlubmVySGVpZ2h0KTtcbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplVCh0KSB7XG4gICAgdCA9IHQgJSAxO1xuICAgIHQgPSB0IDwgMCA/IDEgKyB0IDogdDtcbiAgICByZXR1cm4gdDtcbn1cblxuZnVuY3Rpb24gZ2V0Tm9ybWFsQXQodCwgdHViZSwgbm9ybWFscykge1xuICAgIG5vcm1hbHMgPSBub3JtYWxzIHx8ICdub3JtYWxzJztcbiAgICB0ID0gbm9ybWFsaXplVCh0KTtcbiAgICB2YXIgbm9ybWFsID0gbmV3IFRIUkVFLlZlY3RvcjMoKSxcbiAgICAgICAgc2VnbWVudHMgPSB0dWJlW25vcm1hbHNdLmxlbmd0aCxcbiAgICAgICAgcGlja3QgPSB0ICogc2VnbWVudHMsXG4gICAgICAgIHBpY2sgPSBNYXRoLmZsb29yKCBwaWNrdCApLFxuICAgICAgICBwaWNrTmV4dCA9ICggcGljayArIDEgKSAlIHNlZ21lbnRzO1xuXG4gICAgaWYgKHBpY2sgPCAwKSBwaWNrID0gMDtcblxuICAgIG5vcm1hbC5zdWJWZWN0b3JzKCB0dWJlW25vcm1hbHNdWyBwaWNrTmV4dCBdLCB0dWJlW25vcm1hbHNdWyBwaWNrIF0gKTtcbiAgICBub3JtYWwubXVsdGlwbHlTY2FsYXIoIHBpY2t0IC0gcGljayApLmFkZCggdHViZVtub3JtYWxzXVsgcGljayBdICk7XG4gICAgcmV0dXJuIG5vcm1hbDtcbn1cblxuZnVuY3Rpb24gdXBkTWVzaGVzKCkge1xuICAgIC8vIGNvbnNvbGUubG9nKG1lc2hlc1swXS5wb3NpdGlvbi5kaXN0YW5jZVRvKHBvcykpO1xuICAgIG1lc2hlcy5mb3JFYWNoKGZ1bmN0aW9uIChtZXNoKSB7XG4gICAgICAgIC8vIGlmIChtZXNoLnBvc2l0aW9uLmRpc3RhbmNlVG8ocG9zKSA8IDEwKSB7XG4gICAgICAgIC8vICAgICBtZXNoLm1hdGVyaWFsLm9wYWNpdHkgPSAwLjk7XG4gICAgICAgIC8vIH0gZWxzZSB7XG4gICAgICAgIC8vICAgICBtZXNoLm1hdGVyaWFsLm9wYWNpdHkgPSAwO1xuICAgICAgICAvLyB9XG4gICAgICAgIC8vIG1lc2gubWF0ZXJpYWwub3BhY2l0eSA9IDEgLSBtZXNoLnBvc2l0aW9uLmRpc3RhbmNlVG8ocG9zKS8xMDtcbiAgICAgICAgbWVzaC5tb3JwaFRhcmdldEluZmx1ZW5jZXNbMF0gPSBpbmZsdWVuY2U7XG4gICAgICAgIG1lc2gubW9ycGhUYXJnZXRJbmZsdWVuY2VzWzJdID0gaW5mbHVlbmNlMTtcbiAgICAgICAgbWVzaC5tb3JwaFRhcmdldEluZmx1ZW5jZXNbM10gPSBpbmZsdWVuY2UyO1xuICAgIH0pO1xuICAgIC8vIGNvbnNvbGUubG9nKG1lc2hlc1sxXS5wb3NpdGlvbi5kaXN0YW5jZVRvKHBvcykpO1xuICAgIC8vIG1lc2hlcy5mb3JFYWNoKGZ1bmN0aW9uIChtZXNoKSB7XG4gICAgLy8gICAgIGlmICgpXG4gICAgLy8gfSk7XG59XG5cbmZ1bmN0aW9uIHJlbmRlcigpIHtcblxuICAgIC8vIFRyeSBBbmltYXRlIENhbWVyYSBBbG9uZyBTcGxpbmVcbiAgICB2YXIgdGltZSA9IERhdGUubm93KCk7XG4gICAgdmFyIGxvb3B0aW1lID0gNjAgKiAxMDAwO1xuICAgIHZhciB0ID0gKCB0aW1lICUgbG9vcHRpbWUgKSAvIGxvb3B0aW1lO1xuXG4gICAgdmFyIHBvcyA9IHR1YmUucGFyYW1ldGVycy5wYXRoLmdldFBvaW50QXQoIHQgKTtcbiAgICAvLyB2YXIgcG9zMiA9IHR1YmUucGFyYW1ldGVycy5wYXRoLmdldFBvaW50QXQoIG5vcm1hbGl6ZVQodCArIDAuMDEpICk7XG4gICAgLy8gcG9zLm11bHRpcGx5U2NhbGFyKCBzY2FsZSApO1xuXG4gICAgLy8gaW50ZXJwb2xhdGlvblxuICAgIHZhciBzZWdtZW50cyA9IHR1YmUudGFuZ2VudHMubGVuZ3RoO1xuICAgIHZhciBwaWNrdCA9IHQgKiBzZWdtZW50cztcbiAgICB2YXIgcGljayA9IE1hdGguZmxvb3IoIHBpY2t0ICk7XG4gICAgdmFyIHBpY2tOZXh0ID0gKCBwaWNrICsgMSApICUgc2VnbWVudHM7XG5cbiAgICBiaW5vcm1hbC5zdWJWZWN0b3JzKCB0dWJlLmJpbm9ybWFsc1sgcGlja05leHQgXSwgdHViZS5iaW5vcm1hbHNbIHBpY2sgXSApO1xuICAgIGJpbm9ybWFsLm11bHRpcGx5U2NhbGFyKCBwaWNrdCAtIHBpY2sgKS5hZGQoIHR1YmUuYmlub3JtYWxzWyBwaWNrIF0gKTtcblxuXG4gICAgdmFyIGRpciA9IHR1YmUucGFyYW1ldGVycy5wYXRoLmdldFRhbmdlbnRBdCggdCApO1xuXG4gICAgbm9ybWFsLmNvcHkoIGJpbm9ybWFsLmFwcGx5QXhpc0FuZ2xlKGF4aXMsIGFuZ2xlKSApLmNyb3NzKCBkaXIgKTtcbiAgICBhbmdsZSArPSBQSV8zNjA7XG4gICAgaWYgKGFuZ2xlID4gMipQSSkgYW5nbGUgPSAwO1xuXG4gICAgLy8gV2UgbW92ZSBvbiBhIG9mZnNldCBvbiBpdHMgYmlub3JtYWxcbiAgICAvLyBwb3MuYWRkKCBub3JtYWwuY2xvbmUoKSk7XG5cbiAgICBjYW1lcmEucG9zaXRpb24uY29weSggcG9zICk7XG5cbiAgICAvLyBsaWdodC5wb3NpdGlvbi5jb3B5KCBwb3MyICk7XG4gICAgLy8gc3BoZXJlLnBvc2l0aW9uLmNvcHkoIHBvczIgKTtcblxuXG4gICAgLy8gQ2FtZXJhIE9yaWVudGF0aW9uIDEgLSBkZWZhdWx0IGxvb2sgYXRcbiAgICAvLyBzcGxpbmVDYW1lcmEubG9va0F0KCBsb29rQXQgKTtcblxuICAgIC8vIFVzaW5nIGFyY2xlbmd0aCBmb3Igc3RhYmxpemF0aW9uIGluIGxvb2sgYWhlYWQuXG4gICAgdmFyIGxvb2tBdCA9IHR1YmUucGFyYW1ldGVycy5wYXRoLmdldFBvaW50QXQoICggdCArIDMwIC8gdHViZS5wYXJhbWV0ZXJzLnBhdGguZ2V0TGVuZ3RoKCkgKSAlIDEgKTtcbiAgICAvLyBDYW1lcmEgT3JpZW50YXRpb24gMiAtIHVwIG9yaWVudGF0aW9uIHZpYSBub3JtYWxcbiAgICBsb29rQXQuY29weSggcG9zICkuYWRkKCBkaXIgKTtcbiAgICBjYW1lcmEubWF0cml4Lmxvb2tBdChjYW1lcmEucG9zaXRpb24sIGxvb2tBdCwgbm9ybWFsKTtcbiAgICBjYW1lcmEucm90YXRpb24uc2V0RnJvbVJvdGF0aW9uTWF0cml4KCBjYW1lcmEubWF0cml4LCBjYW1lcmEucm90YXRpb24ub3JkZXIgKTtcblxuICAgIC8vIHBhcmVudC5yb3RhdGlvbi55ICs9ICggdGFyZ2V0Um90YXRpb24gLSBwYXJlbnQucm90YXRpb24ueSApICogMC4wNTtcbiAgICB1cGRNZXNoZXMoKTtcbiAgICByZW5kZXJlci5yZW5kZXIoIHNjZW5lLCBjYW1lcmEgKTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlR2VvbWV0cnkoY2lyY3VtcmFkaXVzKSB7XG4gICAgdmFyIGdlb21ldHJ5ID0gbmV3IFRIUkVFLkdlb21ldHJ5KCksXG4gICAgICAgIHgsXG4gICAgICAgIGlubmVycmFkaXVzID0gY2lyY3VtcmFkaXVzICogMC45LFxuICAgICAgICBuID0gNjA7XG5cbiAgICBmdW5jdGlvbiBzZXRNYWluVmVydCAocmFkLCBudW1iKSB7XG4gICAgICAgIHZhciB2ZXJ0ID0gW107XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbnVtYjsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgdmVjMyA9IG5ldyBUSFJFRS5WZWN0b3IzKFxuICAgICAgICAgICAgICAgIHJhZCAqIE1hdGguc2luKChNYXRoLlBJIC8gbnVtYikgKyAoaSAqICgoMiAqIE1hdGguUEkpLyBudW1iKSkpLFxuICAgICAgICAgICAgICAgIHJhZCAqIE1hdGguY29zKChNYXRoLlBJIC8gbnVtYikgKyAoaSAqICgoMiAqIE1hdGguUEkpLyBudW1iKSkpLFxuICAgICAgICAgICAgICAgIDBcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICB2ZXJ0LnB1c2godmVjMyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHZlcnQ7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZmlsbFZlcnQgKHZlcnQpIHtcbiAgICAgICAgdmFyIG5GaWxsZWQsIG5VbmZpbGxlZCwgcmVzdWx0ID0gW107XG5cbiAgICAgICAgbkZpbGxlZCA9IHZlcnQubGVuZ3RoO1xuICAgICAgICBuVW5maWxsZWQgPSBuL25GaWxsZWQ7XG4gICAgICAgIHZlcnQuZm9yRWFjaChmdW5jdGlvbiAoZWwsIGksIGFycikge1xuICAgICAgICAgICAgdmFyIG5leHRJbmQgPSBpID09PSBhcnIubGVuZ3RoIC0gMSA/IDAgOiBpICsgMTtcbiAgICAgICAgICAgIHZhciB2ZWMgPSBlbC5jbG9uZSgpLnN1YihhcnJbbmV4dEluZF0pO1xuICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBuVW5maWxsZWQ7IGorKykge1xuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKHZlYy5jbG9uZSgpLm11bHRpcGx5U2NhbGFyKDEvblVuZmlsbGVkKS5hZGQoZWwpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgLy8gc2V0IG1vcnBoIHRhcmdldHNcbiAgICBbNjAsIDUsIDQsIDMsIDJdLmZvckVhY2goZnVuY3Rpb24gKGVsLCBpKSB7XG4gICAgICAgIHZhciB2ZXJ0LFxuICAgICAgICAgICAgdmVydE91dGVyLFxuICAgICAgICAgICAgdmVydElubmVyO1xuXG4gICAgICAgIHZlcnRPdXRlciA9IGZpbGxWZXJ0KHNldE1haW5WZXJ0KGNpcmN1bXJhZGl1cywgZWwpLnNsaWNlKDApKS5zbGljZSgwKTtcbiAgICAgICAgdmVydElubmVyID0gZmlsbFZlcnQoc2V0TWFpblZlcnQoaW5uZXJyYWRpdXMsIGVsKS5zbGljZSgwKSkuc2xpY2UoMCk7XG5cbiAgICAgICAgdmVydCA9IHZlcnRPdXRlci5jb25jYXQodmVydElubmVyKTtcblxuICAgICAgICBnZW9tZXRyeS5tb3JwaFRhcmdldHMucHVzaCh7bmFtZTogJ3ZlcnQnK2ksIHZlcnRpY2VzOiB2ZXJ0fSk7XG5cbiAgICAgICAgaWYgKGkgPT09IDApIHtcbiAgICAgICAgICAgIGdlb21ldHJ5LnZlcnRpY2VzID0gdmVydC5zbGljZSgwKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gR2VuZXJhdGUgdGhlIGZhY2VzIG9mIHRoZSBuLWdvbi5cbiAgICBmb3IgKHggPSAwOyB4IDwgbjsgeCsrKSB7XG4gICAgICAgIHZhciBuZXh0ID0geCA9PT0gbiAtIDEgPyAwIDogeCArIDE7XG4gICAgICAgIGdlb21ldHJ5LmZhY2VzLnB1c2gobmV3IFRIUkVFLkZhY2UzKHgsIG5leHQsIHggKyBuKSk7XG4gICAgICAgIGdlb21ldHJ5LmZhY2VzLnB1c2gobmV3IFRIUkVFLkZhY2UzKHggKyBuLCBuZXh0LCBuZXh0ICsgbikpO1xuICAgIH1cblxuICAgIHJldHVybiBnZW9tZXRyeTtcbn1cblxudmFyIGNvbG9yMSA9IHtyOiA4MywgZzogMjQ2LCBiOiAyMDB9O1xudmFyIGNvbG9yMiA9IHtyOiAzNiwgZzogMTQxLCBiOiAxODd9O1xudmFyIGNvbG9yQyA9IHtyOiA4MywgZzogMjQ2LCBiOiAyMDB9O1xuZnVuY3Rpb24gc2V0Q29sb3IoZCkge1xuICAgIFsncicsICdnJywgJ2InXS5mb3JFYWNoKGZ1bmN0aW9uIChjaGFubmVsKSB7XG4gICAgICAgIGNvbG9yQ1tjaGFubmVsXSA9IGNvbG9yMVtjaGFubmVsXSArIChjb2xvcjJbY2hhbm5lbF0gLSBjb2xvcjFbY2hhbm5lbF0pICogZDtcbiAgICB9KTtcbiAgICByZW5kZXJlci5zZXRDbGVhckNvbG9yKG5ldyBUSFJFRS5Db2xvcihjb2xvckMuci8yNTUsIGNvbG9yQy5nLzI1NSwgY29sb3JDLmIvMjU1KSk7XG59XG5cbi8vIGZ1bmN0aW9uIGdldEJpbm9ybWFsQXQodCwgdHViZSkge1xuLy8gICAgIHJldHVybiBnZXROb3JtYWxBdCh0LCB0dWJlLCAnYmlub3JtYWxzJyk7XG4vLyB9XG5cbmZ1bmN0aW9uIG1vdXNlbW92ZShlKSB7XG4gICAgdmFyIGR4ID0gZS5wYWdlWCAvIHdpbmRvdy5pbm5lcldpZHRoO1xuICAgIHZhciBkeSA9IGUucGFnZVkgLyB3aW5kb3cuaW5uZXJIZWlnaHQ7XG4gICAgaWYgKGR4IDwgMC41KSB7XG4gICAgICAgIGluZmx1ZW5jZSA9IGR4ICogMjtcbiAgICAgICAgaW5mbHVlbmNlMSA9IDEgLSBpbmZsdWVuY2U7XG4gICAgICAgIGluZmx1ZW5jZTIgPSAwO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGluZmx1ZW5jZSA9ICgxIC0gZHgpICogMjtcbiAgICAgICAgaW5mbHVlbmNlMiA9IDEgLSBpbmZsdWVuY2U7XG4gICAgICAgIGluZmx1ZW5jZTEgPSAwO1xuICAgIH1cbiAgICBzZXRDb2xvcihkeSk7XG59XG5cbmZ1bmN0aW9uIGxvb2tBdCh0LCB0dWJlLCB0T2JqZWN0LCBmbGFnKSB7XG4gICAgdmFyIHRMb29rID0gbm9ybWFsaXplVCh0KSxcbiAgICAgICAgbm9ybWFsTG9vayA9IGdldE5vcm1hbEF0KHRMb29rLCB0dWJlKSxcbiAgICAgICAgdmVjdG9yTG9vayA9IHR1YmUucGFyYW1ldGVycy5wYXRoLmdldFRhbmdlbnRBdCh0TG9vaylcbiAgICAgICAgICAgIC5hZGQodE9iamVjdC5wb3NpdGlvbik7XG5cbiAgICBub3JtYWxMb29rID0gZmxhZyA/IG5vcm1hbExvb2suYXBwbHlBeGlzQW5nbGUoYXhpcywgUEkvNCkgOiBub3JtYWxMb29rO1xuXG4gICAgdmFyIG0xID0gbmV3IFRIUkVFLk1hdHJpeDQoKS5jb3B5KCB0T2JqZWN0Lm1hdHJpeCApO1xuICAgIG0xLmxvb2tBdCggdmVjdG9yTG9vaywgdE9iamVjdC5wb3NpdGlvbiwgbm9ybWFsTG9vayApO1xuICAgIHRPYmplY3Qucm90YXRpb24uc2V0RnJvbVJvdGF0aW9uTWF0cml4KCBtMSApO1xufVxuXG5mdW5jdGlvbiBpbml0KCkge1xuICAgIGNhbWVyYSA9IG5ldyBUSFJFRS5QZXJzcGVjdGl2ZUNhbWVyYSg3NSwgd2luZG93LmlubmVyV2lkdGggLyB3aW5kb3cuaW5uZXJIZWlnaHQsIDEsIDEwMDApO1xuXG4gICAgc2NlbmUgPSBuZXcgVEhSRUUuU2NlbmUoKTtcblxuICAgIHJlbmRlcmVyID0gbmV3IFRIUkVFLldlYkdMUmVuZGVyZXIoe1xuICAgICAgICBhbnRpYWxpYXM6IHRydWVcbiAgICB9KTtcbiAgICByZW5kZXJlci5zZXRDbGVhckNvbG9yKG5ldyBUSFJFRS5Db2xvcihjb2xvckMuci8yNTUsIGNvbG9yQy5nLzI1NSwgY29sb3JDLmIvMjU1KSk7XG4gICAgLy8gcmVuZGVyZXIuc2V0Q2xlYXJDb2xvcigweGZmZmZmZik7XG4gICAgcmVuZGVyZXIuc2V0UGl4ZWxSYXRpbyh3aW5kb3cuZGV2aWNlUGl4ZWxSYXRpbyk7XG4gICAgcmVuZGVyZXIuc2V0U2l6ZSh3aW5kb3cuaW5uZXJXaWR0aCwgd2luZG93LmlubmVySGVpZ2h0KTtcbiAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHJlbmRlcmVyLmRvbUVsZW1lbnQpO1xuXG4gICAgLy8gbGlnaHQgPSBuZXcgVEhSRUUuUG9pbnRMaWdodCgweGZmZmZmZiwgMC4xLCAxMDApO1xuICAgIC8vIHNjZW5lLmFkZChsaWdodCk7XG4gICAgLy8gY2FtZXJhLmFkZChsaWdodCk7XG5cbiAgICB2YXIgcGF0aCA9IG5ldyBUSFJFRS5DdXJ2ZXMuQ2lucXVlZm9pbEtub3QoKTtcbiAgICAvLyB2YXIgcGF0aCA9IG5ldyBUSFJFRS5DdXJ2ZXMuRGVjb3JhdGVkVG9ydXNLbm90NWEoKTtcbiAgICB2YXIgc2VnbWVudHMgPSA5OTtcbiAgICB2YXIgcmFkaXVzU2VnbWVudHMgPSAzNjtcbiAgICB2YXIgY2xvc2VkID0gdHJ1ZTtcblxuICAgIHR1YmUgPSBuZXcgVEhSRUUuVHViZUdlb21ldHJ5KHBhdGgsIHNlZ21lbnRzLCAzLjIsIHJhZGl1c1NlZ21lbnRzLCBjbG9zZWQpO1xuXG4gICAgLy8gdmFyIGdlb21ldHJ5ID0gbmV3IFRIUkVFLlNwaGVyZUdlb21ldHJ5KCAwLjUsIDMyLCAzMiApO1xuICAgIC8vIHZhciBtYXRlcmlhbCA9IG5ldyBUSFJFRS5NZXNoQmFzaWNNYXRlcmlhbCgge2NvbG9yOiAweGZmZmYwMH0gKTtcbiAgICAvLyBzcGhlcmUgPSBuZXcgVEhSRUUuTWVzaCggZ2VvbWV0cnksIG1hdGVyaWFsICk7XG4gICAgLy8gc2NlbmUuYWRkKCBzcGhlcmUgKTtcblxuICAgIHZhciBtYXggPSAyMDA7XG4gICAgdmFyIGdlb20gPSBjcmVhdGVHZW9tZXRyeSgzKTtcbiAgICB2YXIgbWF0ID0gbmV3IFRIUkVFLk1lc2hCYXNpY01hdGVyaWFsKHtcbiAgICAgICAgdHJhbnNwYXJlbnQ6IHRydWUsXG4gICAgICAgIG9wYWNpdHk6IDAuOSxcbiAgICAgICAgbW9ycGhUYXJnZXRzOiB0cnVlLFxuICAgICAgICBjb2xvcjogMHhmZmZmZmYsXG4gICAgICAgIC8vIGFtYmllbnQ6IDB4MTExMTExLFxuICAgICAgICAvLyB2ZXJ0ZXhDb2xvcnM6IFRIUkVFLkZhY2VDb2xvcnMsXG4gICAgICAgIC8vIGVtaXNzaXZlOiAweDMzZmY2NixcbiAgICAgICAgLy8gc3BlY3VsYXI6IDB4ZmZmZmZmLFxuICAgICAgICAvLyBtZXRhbDogdHJ1ZSxcbiAgICB9KTtcbiAgICB2YXIgbGluZSA9IG5ldyBUSFJFRS5NZXNoKGdlb20sIG1hdCk7XG4gICAgLy8gbGluZS5yb3RhdGlvbi55ID0gMS41O1xuXG4gICAgZm9yICh2YXIgaSA9IG1heDsgaSA+IDA7IGktLSkge1xuICAgICAgICB2YXIgdCA9IGkvbWF4O1xuICAgICAgICAvLyB2YXIgbWF0ID0gbmV3IFRIUkVFLk1lc2hCYXNpY01hdGVyaWFsKHtcbiAgICAgICAgLy8gICAgIHRyYW5zcGFyZW50OiB0cnVlLFxuICAgICAgICAvLyAgICAgb3BhY2l0eTogMC45LFxuICAgICAgICAvLyAgICAgbW9ycGhUYXJnZXRzOiB0cnVlLFxuICAgICAgICAvLyAgICAgY29sb3I6IDB4ZmZmZmZmLFxuICAgICAgICAvLyAgICAgLy8gYW1iaWVudDogMHgxMTExMTEsXG4gICAgICAgIC8vICAgICAvLyB2ZXJ0ZXhDb2xvcnM6IFRIUkVFLkZhY2VDb2xvcnMsXG4gICAgICAgIC8vICAgICAvLyBlbWlzc2l2ZTogMHgzM2ZmNjYsXG4gICAgICAgIC8vICAgICBzcGVjdWxhcjogMHhmZmZmZmYsXG4gICAgICAgIC8vICAgICAvLyBtZXRhbDogdHJ1ZSxcbiAgICAgICAgLy8gfSk7XG4gICAgICAgIC8vIHZhciBtZXNoID0gbmV3IFRIUkVFLk1lc2goZ2VvbSwgbWF0KTtcbiAgICAgICAgdmFyIG1lc2ggPSBsaW5lLmNsb25lKCk7XG4gICAgICAgIHZhciBwb3MgPSB0dWJlLnBhcmFtZXRlcnMucGF0aC5nZXRQb2ludEF0KHQpO1xuXG4gICAgICAgIG1lc2gucG9zaXRpb24uY29weShwb3MpO1xuICAgICAgICBsb29rQXQodCArIDAuMDAxLCB0dWJlLCBtZXNoKTtcbiAgICAgICAgbWVzaGVzLnB1c2gobWVzaCk7XG4gICAgICAgIHNjZW5lLmFkZChtZXNoKTtcbiAgICB9XG4gICAgLy9cblxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdyZXNpemUnLCBvbldpbmRvd1Jlc2l6ZSwgZmFsc2UpO1xuICAgIGFuaW1hdGUoMCwgZnVuY3Rpb24gKCkge1xuICAgICAgICByZW5kZXIoKTtcbiAgICB9KTtcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCBtb3VzZW1vdmUsIGZhbHNlICk7XG59XG5cbmluaXQoKTtcbiJdfQ==
