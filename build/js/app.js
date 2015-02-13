/* Made by deemidroll | 2014 | deemidroll@gmail.com */
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

},{"./animate.js":1}]},{},[2])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9EbWl0cnkvcHJvamVjdHMvaGVsaWNvcHRlci90ZWNoL3R1bm5lbC9ub2RlX21vZHVsZXMvd2F0Y2hpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9Vc2Vycy9EbWl0cnkvcHJvamVjdHMvaGVsaWNvcHRlci90ZWNoL3R1bm5lbC9zcmMvanMvYW5pbWF0ZS5qcyIsIi9Vc2Vycy9EbWl0cnkvcHJvamVjdHMvaGVsaWNvcHRlci90ZWNoL3R1bm5lbC9zcmMvanMvbWFpbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIndpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIChcbiAgICAgICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSAgICAgICB8fFxuICAgICAgICB3aW5kb3cud2Via2l0UmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8XG4gICAgICAgIHdpbmRvdy5tb3pSZXF1ZXN0QW5pbWF0aW9uRnJhbWUgICAgfHxcbiAgICAgICAgd2luZG93Lm9SZXF1ZXN0QW5pbWF0aW9uRnJhbWUgICAgICB8fFxuICAgICAgICB3aW5kb3cubXNSZXF1ZXN0QW5pbWF0aW9uRnJhbWUgICAgIHx8XG4gICAgICAgIGZ1bmN0aW9uKC8qIGZ1bmN0aW9uICovIGNhbGxiYWNrKXtcbiAgICAgICAgICAgIHdpbmRvdy5zZXRUaW1lb3V0KGNhbGxiYWNrLCAxMDAwIC8gNjApO1xuICAgICAgICB9XG4gICAgKTtcbn0oKTtcbndpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZSA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gKFxuICAgICAgICB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUgICAgICAgfHxcbiAgICAgICAgd2luZG93LndlYmtpdENhbmNlbEFuaW1hdGlvbkZyYW1lIHx8XG4gICAgICAgIHdpbmRvdy5tb3pDYW5jZWxBbmltYXRpb25GcmFtZSAgICB8fFxuICAgICAgICB3aW5kb3cub0NhbmNlbEFuaW1hdGlvbkZyYW1lICAgICAgfHxcbiAgICAgICAgd2luZG93Lm1zQ2FuY2VsQW5pbWF0aW9uRnJhbWUgICAgIHx8XG4gICAgICAgIGZ1bmN0aW9uKGlkKXtcbiAgICAgICAgICAgIHdpbmRvdy5jbGVhclRpbWVvdXQoaWQpO1xuICAgICAgICB9XG4gICAgKTtcbn0oKTtcblxuZnVuY3Rpb24gYW5pbWF0ZShub3dNc2VjLCBjYWxsYmFjaykge1xuICAgIHZhciBkZWx0YU1zZWM7XG4gICAgbm93TXNlYyA9IG5vd01zZWMgfHwgRGF0ZS5ub3coKTtcbiAgICBhbmltYXRlLmxhc3RUaW1lTXNlYyA9IGFuaW1hdGUubGFzdFRpbWVNc2VjIHx8IG5vd01zZWMgLSAxMDAwIC8gNjA7XG4gICAgZGVsdGFNc2VjID0gTWF0aC5taW4oMTAwLCBub3dNc2VjIC0gYW5pbWF0ZS5sYXN0VGltZU1zZWMpO1xuICAgIC8vIGtlZXAgbG9vcGluZ1xuICAgIGFuaW1hdGUuaWQgPSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKGFuaW1hdGUpO1xuICAgIC8vIGNoYW5nZSBsYXN0IHRpbWVcbiAgICBhbmltYXRlLmxhc3RUaW1lTXNlYyA9IG5vd01zZWM7XG4gICAgLy8gY2FsbCBlYWNoIHVwZGF0ZSBmdW5jdGlvblxuICAgIGlmIChjYWxsYmFjaykgYW5pbWF0ZS5jYWxsYmFjayA9IGNhbGxiYWNrO1xuICAgIGFuaW1hdGUuY2FsbGJhY2soZGVsdGFNc2VjLCBub3dNc2VjLCBhbmltYXRlLmlkKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBhbmltYXRlOyIsInZhciBUSFJFRSA9IHdpbmRvdy5USFJFRTtcblxudmFyIGFuaW1hdGUgPSByZXF1aXJlKCcuL2FuaW1hdGUuanMnKTtcblxudmFyIGNhbWVyYSwgc2NlbmUsIHJlbmRlcmVyO1xuXG52YXIgdHViZTtcbnZhciBiaW5vcm1hbCA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG52YXIgbm9ybWFsID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcblxuZnVuY3Rpb24gb25XaW5kb3dSZXNpemUoKSB7XG4gICAgY2FtZXJhLmFzcGVjdCA9IHdpbmRvdy5pbm5lcldpZHRoIC8gd2luZG93LmlubmVySGVpZ2h0O1xuICAgIGNhbWVyYS51cGRhdGVQcm9qZWN0aW9uTWF0cml4KCk7XG5cbiAgICByZW5kZXJlci5zZXRTaXplKHdpbmRvdy5pbm5lcldpZHRoLCB3aW5kb3cuaW5uZXJIZWlnaHQpO1xufVxuXG5mdW5jdGlvbiByZW5kZXIoKSB7XG5cbiAgICAvLyBUcnkgQW5pbWF0ZSBDYW1lcmEgQWxvbmcgU3BsaW5lXG4gICAgdmFyIHRpbWUgPSBEYXRlLm5vdygpO1xuICAgIHZhciBsb29wdGltZSA9IDYwICogMTAwMDtcbiAgICB2YXIgdCA9ICggdGltZSAlIGxvb3B0aW1lICkgLyBsb29wdGltZTtcblxuICAgIHZhciBwb3MgPSB0dWJlLnBhcmFtZXRlcnMucGF0aC5nZXRQb2ludEF0KCB0ICk7XG4gICAgLy8gcG9zLm11bHRpcGx5U2NhbGFyKCBzY2FsZSApO1xuXG4gICAgLy8gaW50ZXJwb2xhdGlvblxuICAgIHZhciBzZWdtZW50cyA9IHR1YmUudGFuZ2VudHMubGVuZ3RoO1xuICAgIHZhciBwaWNrdCA9IHQgKiBzZWdtZW50cztcbiAgICB2YXIgcGljayA9IE1hdGguZmxvb3IoIHBpY2t0ICk7XG4gICAgdmFyIHBpY2tOZXh0ID0gKCBwaWNrICsgMSApICUgc2VnbWVudHM7XG5cbiAgICBiaW5vcm1hbC5zdWJWZWN0b3JzKCB0dWJlLmJpbm9ybWFsc1sgcGlja05leHQgXSwgdHViZS5iaW5vcm1hbHNbIHBpY2sgXSApO1xuICAgIGJpbm9ybWFsLm11bHRpcGx5U2NhbGFyKCBwaWNrdCAtIHBpY2sgKS5hZGQoIHR1YmUuYmlub3JtYWxzWyBwaWNrIF0gKTtcblxuXG4gICAgdmFyIGRpciA9IHR1YmUucGFyYW1ldGVycy5wYXRoLmdldFRhbmdlbnRBdCggdCApO1xuXG4gICAgbm9ybWFsLmNvcHkoIGJpbm9ybWFsICkuY3Jvc3MoIGRpciApO1xuXG4gICAgLy8gV2UgbW92ZSBvbiBhIG9mZnNldCBvbiBpdHMgYmlub3JtYWxcbiAgICAvLyBwb3MuYWRkKCBub3JtYWwuY2xvbmUoKSk7XG5cbiAgICBjYW1lcmEucG9zaXRpb24uY29weSggcG9zICk7XG5cblxuICAgIC8vIENhbWVyYSBPcmllbnRhdGlvbiAxIC0gZGVmYXVsdCBsb29rIGF0XG4gICAgLy8gc3BsaW5lQ2FtZXJhLmxvb2tBdCggbG9va0F0ICk7XG5cbiAgICAvLyBVc2luZyBhcmNsZW5ndGggZm9yIHN0YWJsaXphdGlvbiBpbiBsb29rIGFoZWFkLlxuICAgIHZhciBsb29rQXQgPSB0dWJlLnBhcmFtZXRlcnMucGF0aC5nZXRQb2ludEF0KCAoIHQgKyAzMCAvIHR1YmUucGFyYW1ldGVycy5wYXRoLmdldExlbmd0aCgpICkgJSAxICk7XG4gICAgLy8gQ2FtZXJhIE9yaWVudGF0aW9uIDIgLSB1cCBvcmllbnRhdGlvbiB2aWEgbm9ybWFsXG4gICAgbG9va0F0LmNvcHkoIHBvcyApLmFkZCggZGlyICk7XG4gICAgY2FtZXJhLm1hdHJpeC5sb29rQXQoY2FtZXJhLnBvc2l0aW9uLCBsb29rQXQsIG5vcm1hbCk7XG4gICAgY2FtZXJhLnJvdGF0aW9uLnNldEZyb21Sb3RhdGlvbk1hdHJpeCggY2FtZXJhLm1hdHJpeCwgY2FtZXJhLnJvdGF0aW9uLm9yZGVyICk7XG5cbiAgICAvLyBwYXJlbnQucm90YXRpb24ueSArPSAoIHRhcmdldFJvdGF0aW9uIC0gcGFyZW50LnJvdGF0aW9uLnkgKSAqIDAuMDU7XG5cbiAgICByZW5kZXJlci5yZW5kZXIoIHNjZW5lLCBjYW1lcmEgKTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlR2VvbWV0cnkoY2lyY3VtcmFkaXVzKSB7XG4gICAgdmFyIGdlb21ldHJ5ID0gbmV3IFRIUkVFLkdlb21ldHJ5KCksXG4gICAgICAgIHgsXG4gICAgICAgIGlubmVycmFkaXVzID0gY2lyY3VtcmFkaXVzICogMC45LFxuICAgICAgICBuID0gNjA7XG5cbiAgICBmdW5jdGlvbiBzZXRNYWluVmVydCAocmFkLCBudW1iKSB7XG4gICAgICAgIHZhciB2ZXJ0ID0gW107XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbnVtYjsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgdmVjMyA9IG5ldyBUSFJFRS5WZWN0b3IzKFxuICAgICAgICAgICAgICAgIHJhZCAqIE1hdGguc2luKChNYXRoLlBJIC8gbnVtYikgKyAoaSAqICgoMiAqIE1hdGguUEkpLyBudW1iKSkpLFxuICAgICAgICAgICAgICAgIHJhZCAqIE1hdGguY29zKChNYXRoLlBJIC8gbnVtYikgKyAoaSAqICgoMiAqIE1hdGguUEkpLyBudW1iKSkpLFxuICAgICAgICAgICAgICAgIDBcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICB2ZXJ0LnB1c2godmVjMyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHZlcnQ7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZmlsbFZlcnQgKHZlcnQpIHtcbiAgICAgICAgdmFyIG5GaWxsZWQsIG5VbmZpbGxlZCwgcmVzdWx0ID0gW107XG5cbiAgICAgICAgbkZpbGxlZCA9IHZlcnQubGVuZ3RoO1xuICAgICAgICBuVW5maWxsZWQgPSBuL25GaWxsZWQ7XG4gICAgICAgIHZlcnQuZm9yRWFjaChmdW5jdGlvbiAoZWwsIGksIGFycikge1xuICAgICAgICAgICAgdmFyIG5leHRJbmQgPSBpID09PSBhcnIubGVuZ3RoIC0gMSA/IDAgOiBpICsgMTtcbiAgICAgICAgICAgIHZhciB2ZWMgPSBlbC5jbG9uZSgpLnN1YihhcnJbbmV4dEluZF0pO1xuICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBuVW5maWxsZWQ7IGorKykge1xuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKHZlYy5jbG9uZSgpLm11bHRpcGx5U2NhbGFyKDEvblVuZmlsbGVkKS5hZGQoZWwpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgLy8gc2V0IG1vcnBoIHRhcmdldHNcbiAgICBbNjAsIDUsIDQsIDMsIDJdLmZvckVhY2goZnVuY3Rpb24gKGVsLCBpKSB7XG4gICAgICAgIHZhciB2ZXJ0LFxuICAgICAgICAgICAgdmVydE91dGVyLFxuICAgICAgICAgICAgdmVydElubmVyO1xuXG4gICAgICAgIHZlcnRPdXRlciA9IGZpbGxWZXJ0KHNldE1haW5WZXJ0KGNpcmN1bXJhZGl1cywgZWwpLnNsaWNlKDApKS5zbGljZSgwKTtcbiAgICAgICAgdmVydElubmVyID0gZmlsbFZlcnQoc2V0TWFpblZlcnQoaW5uZXJyYWRpdXMsIGVsKS5zbGljZSgwKSkuc2xpY2UoMCk7XG5cbiAgICAgICAgdmVydCA9IHZlcnRPdXRlci5jb25jYXQodmVydElubmVyKTtcblxuICAgICAgICBnZW9tZXRyeS5tb3JwaFRhcmdldHMucHVzaCh7bmFtZTogJ3ZlcnQnK2ksIHZlcnRpY2VzOiB2ZXJ0fSk7XG5cbiAgICAgICAgaWYgKGkgPT09IDApIHtcbiAgICAgICAgICAgIGdlb21ldHJ5LnZlcnRpY2VzID0gdmVydC5zbGljZSgwKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gR2VuZXJhdGUgdGhlIGZhY2VzIG9mIHRoZSBuLWdvbi5cbiAgICBmb3IgKHggPSAwOyB4IDwgbjsgeCsrKSB7XG4gICAgICAgIHZhciBuZXh0ID0geCA9PT0gbiAtIDEgPyAwIDogeCArIDE7XG4gICAgICAgIGdlb21ldHJ5LmZhY2VzLnB1c2gobmV3IFRIUkVFLkZhY2UzKHgsIG5leHQsIHggKyBuKSk7XG4gICAgICAgIGdlb21ldHJ5LmZhY2VzLnB1c2gobmV3IFRIUkVFLkZhY2UzKHggKyBuLCBuZXh0LCBuZXh0ICsgbikpO1xuICAgIH1cblxuICAgIHJldHVybiBnZW9tZXRyeTtcbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplVCh0KSB7XG4gICAgdCA9IHQgJSAxO1xuICAgIHQgPSB0IDwgMCA/IDEgKyB0IDogdDtcbiAgICByZXR1cm4gdDtcbn1cblxuZnVuY3Rpb24gZ2V0Tm9ybWFsQXQodCwgdHViZSwgbm9ybWFscykge1xuICAgIG5vcm1hbHMgPSBub3JtYWxzIHx8ICdub3JtYWxzJztcbiAgICB0ID0gbm9ybWFsaXplVCh0KTtcbiAgICB2YXIgbm9ybWFsID0gbmV3IFRIUkVFLlZlY3RvcjMoKSxcbiAgICAgICAgc2VnbWVudHMgPSB0dWJlW25vcm1hbHNdLmxlbmd0aCxcbiAgICAgICAgcGlja3QgPSB0ICogc2VnbWVudHMsXG4gICAgICAgIHBpY2sgPSBNYXRoLmZsb29yKCBwaWNrdCApLFxuICAgICAgICBwaWNrTmV4dCA9ICggcGljayArIDEgKSAlIHNlZ21lbnRzO1xuXG4gICAgaWYgKHBpY2sgPCAwKSBwaWNrID0gMDtcblxuICAgIG5vcm1hbC5zdWJWZWN0b3JzKCB0dWJlW25vcm1hbHNdWyBwaWNrTmV4dCBdLCB0dWJlW25vcm1hbHNdWyBwaWNrIF0gKTtcbiAgICBub3JtYWwubXVsdGlwbHlTY2FsYXIoIHBpY2t0IC0gcGljayApLmFkZCggdHViZVtub3JtYWxzXVsgcGljayBdICk7XG4gICAgcmV0dXJuIG5vcm1hbDtcbn1cblxuLy8gZnVuY3Rpb24gZ2V0Qmlub3JtYWxBdCh0LCB0dWJlKSB7XG4vLyAgICAgcmV0dXJuIGdldE5vcm1hbEF0KHQsIHR1YmUsICdiaW5vcm1hbHMnKTtcbi8vIH1cblxuZnVuY3Rpb24gbG9va0F0KHQsIHR1YmUsIHRPYmplY3QpIHtcbiAgICB2YXIgdExvb2sgPSBub3JtYWxpemVUKHQpLFxuICAgICAgICBub3JtYWxMb29rID0gZ2V0Tm9ybWFsQXQodExvb2ssIHR1YmUpLFxuICAgICAgICB2ZWN0b3JMb29rID0gdHViZS5wYXJhbWV0ZXJzLnBhdGguZ2V0VGFuZ2VudEF0KHRMb29rKVxuICAgICAgICAgICAgLmFkZCh0T2JqZWN0LnBvc2l0aW9uKTtcblxuICAgIHZhciBtMSA9IG5ldyBUSFJFRS5NYXRyaXg0KCkuY29weSggdE9iamVjdC5tYXRyaXggKTtcbiAgICBtMS5sb29rQXQoIHZlY3Rvckxvb2ssIHRPYmplY3QucG9zaXRpb24sIG5vcm1hbExvb2sgKTtcbiAgICB0T2JqZWN0LnJvdGF0aW9uLnNldEZyb21Sb3RhdGlvbk1hdHJpeCggbTEgKTtcbn1cblxuZnVuY3Rpb24gaW5pdCgpIHtcbiAgICBjYW1lcmEgPSBuZXcgVEhSRUUuUGVyc3BlY3RpdmVDYW1lcmEoNzUsIHdpbmRvdy5pbm5lcldpZHRoIC8gd2luZG93LmlubmVySGVpZ2h0LCAxLCAxMDAwKTtcbiAgICBjYW1lcmEucG9zaXRpb24ueiA9IDEwO1xuXG4gICAgc2NlbmUgPSBuZXcgVEhSRUUuU2NlbmUoKTtcblxuICAgIHJlbmRlcmVyID0gbmV3IFRIUkVFLldlYkdMUmVuZGVyZXIoe1xuICAgICAgICBhbnRpYWxpYXM6IHRydWVcbiAgICB9KTtcbiAgICByZW5kZXJlci5zZXRDbGVhckNvbG9yKDB4MDAwMDAwKTtcbiAgICByZW5kZXJlci5zZXRQaXhlbFJhdGlvKHdpbmRvdy5kZXZpY2VQaXhlbFJhdGlvKTtcbiAgICByZW5kZXJlci5zZXRTaXplKHdpbmRvdy5pbm5lcldpZHRoLCB3aW5kb3cuaW5uZXJIZWlnaHQpO1xuICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQocmVuZGVyZXIuZG9tRWxlbWVudCk7XG5cbiAgICAvL1xuICAgIHZhciBwYXRoID0gbmV3IFRIUkVFLkN1cnZlcy5DaW5xdWVmb2lsS25vdCgpO1xuICAgIHZhciBzZWdtZW50cyA9IDk5O1xuICAgIHZhciByYWRpdXNTZWdtZW50cyA9IDEyO1xuICAgIHZhciBjbG9zZWQgPSB0cnVlO1xuXG4gICAgdHViZSA9IG5ldyBUSFJFRS5UdWJlR2VvbWV0cnkocGF0aCwgc2VnbWVudHMsIDEsIHJhZGl1c1NlZ21lbnRzLCBjbG9zZWQpO1xuXG4gICAgdmFyIG1heCA9IDEwMDtcbiAgICB2YXIgZ2VvbSA9IGNyZWF0ZUdlb21ldHJ5KDMpO1xuICAgIHZhciBtYXQgPSBuZXcgVEhSRUUuTWVzaFBob25nTWF0ZXJpYWwoe1xuICAgICAgICBjb2xvcjogMHhmZjAwMDAsXG4gICAgICAgIHRyYW5zcGFyZW50OiB0cnVlLFxuICAgICAgICBvcGFjaXR5OiAwLjYsXG4gICAgICAgIG1vcnBoVGFyZ2V0czogdHJ1ZSxcbiAgICAgICAgZW1pc3NpdmU6IDB4ZmZmZjAwXG4gICAgfSk7XG4gICAgdmFyIGxpbmUgPSBuZXcgVEhSRUUuTWVzaChnZW9tLCBtYXQpO1xuICAgIC8vIGxpbmUucm90YXRpb24ueSA9IDEuNTtcblxuICAgIHZhciBtZXNoZXMgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gbWF4OyBpID4gMDsgaS0tKSB7XG4gICAgICAgIHZhciB0ID0gaS9tYXg7XG4gICAgICAgIHZhciBtZXNoID0gbGluZS5jbG9uZSgpO1xuICAgICAgICB2YXIgcG9zID0gdHViZS5wYXJhbWV0ZXJzLnBhdGguZ2V0UG9pbnRBdCh0KTtcblxuICAgICAgICBtZXNoLnBvc2l0aW9uLmNvcHkocG9zKTtcbiAgICAgICAgbG9va0F0KHQgKyAwLjAwMSwgdHViZSwgbWVzaCk7XG4gICAgICAgIG1lc2hlcy5wdXNoKG1lc2gpO1xuICAgICAgICBzY2VuZS5hZGQobWVzaCk7XG4gICAgICAgIG1lc2gubW9ycGhUYXJnZXRJbmZsdWVuY2VzWzBdID0gMTtcbiAgICAgICAgbWVzaC5tb3JwaFRhcmdldEluZmx1ZW5jZXNbMV0gPSAwO1xuICAgICAgICBtZXNoLm1vcnBoVGFyZ2V0SW5mbHVlbmNlc1syXSA9IDA7XG4gICAgICAgIG1lc2gubW9ycGhUYXJnZXRJbmZsdWVuY2VzWzNdID0gMDtcbiAgICAgICAgbWVzaC5tb3JwaFRhcmdldEluZmx1ZW5jZXNbNF0gPSAwO1xuICAgIH1cbiAgICAvL1xuXG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIG9uV2luZG93UmVzaXplLCBmYWxzZSk7XG4gICAgYW5pbWF0ZSgwLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJlbmRlcigpO1xuICAgIH0pO1xufVxuXG5pbml0KCk7XG4iXX0=
