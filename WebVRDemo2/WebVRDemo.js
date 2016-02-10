require({
            baseUrl : '.',
            paths : {
                domReady : 'Cesium/ThirdParty/requirejs-2.1.20/domReady',
                Cesium : 'Cesium/Source'
            }
        }, [
           'Cesium/Core/Cartesian3',
           'Cesium/Core/CesiumTerrainProvider',
           'Cesium/Core/ClockRange',
           'Cesium/Core/Color',
           'Cesium/Core/Ellipsoid',
           'Cesium/Core/HermitePolynomialApproximation',
           'Cesium/Core/JulianDate',
           'Cesium/Core/Math',
           'Cesium/Core/Matrix3',
           'Cesium/Core/Matrix4',
           'Cesium/Core/TimeInterval',
           'Cesium/Core/TimeIntervalCollection',
           'Cesium/DataSources/PolylineGlowMaterialProperty',
           'Cesium/DataSources/SampledPositionProperty',
           'Cesium/DataSources/VelocityOrientationProperty',
           'Cesium/Scene/SceneMode',
           'Cesium/ThirdParty/when',
           'Cesium/Widgets/Viewer/Viewer',
           'domReady!'
       ], function(
    Cartesian3,
    CesiumTerrainProvider,
    ClockRange,
    Color,
    Ellipsoid,
    HermitePolynomialApproximation,
    JulianDate,
    CesiumMath,
    Matrix3,
    Matrix4,
    TimeInterval,
    TimeIntervalCollection,
    PolylineGlowMaterialProperty,
    SampledPositionProperty,
    VelocityOrientationProperty,
    SceneMode,
    when,
    Viewer) {
    "use strict";

    var loadingIndicator = document.getElementById('loadingIndicator');

    var viewer = new Viewer('cesiumContainer', {
        vrButton : true
    });
// Click the VR button in the bottom right of the screen to switch to VR mode.

    viewer.scene.globe.enableLighting = true;

    viewer.terrainProvider = new CesiumTerrainProvider({
        url : '//assets.agi.com/stk-terrain/world',
        requestVertexNormals : true
    });

    viewer.scene.globe.depthTestAgainstTerrain = true;

// Follow the path of a plane. See the interpolation Sandcastle example.
    CesiumMath.setRandomNumberSeed(3);

    var start = JulianDate.fromDate(new Date(2015, 2, 25, 16));
    var stop = JulianDate.addSeconds(start, 360, new JulianDate());

    viewer.clock.startTime = start.clone();
    viewer.clock.stopTime = stop.clone();
    viewer.clock.currentTime = start.clone();
    viewer.clock.clockRange = ClockRange.LOOP_STOP;
    viewer.clock.multiplier = 1.0;

    function computeCirclularFlight(lon, lat, radius) {
        var property = new SampledPositionProperty();
        for (var i = 0; i <= 360; i += 45) {
            var radians = CesiumMath.toRadians(i);
            var time = JulianDate.addSeconds(start, i, new JulianDate());
            var position = Cartesian3.fromDegrees(lon + (radius * 1.5 * Math.cos(radians)), lat + (radius * Math.sin(radians)), CesiumMath.nextRandomNumber() * 500 + 1750);
            property.addSample(time, position);
        }
        return property;
    }

    var position = computeCirclularFlight(-112.110693, 36.0994841, 0.03);

    var entity = viewer.entities.add({
                                         availability : new TimeIntervalCollection([new TimeInterval({
                                             start : start,
                                             stop : stop
                                         })]),
                                         position : position,
                                         model : {
                                             uri : './Model/CesiumBalloon.glb',
                                             minimumPixelSize : 64
                                         }
                                     });

    entity.position.setInterpolationOptions({
                                                interpolationDegree : 2,
                                                interpolationAlgorithm : HermitePolynomialApproximation
                                            });

    var camera = viewer.camera;

    function updateCameraOnLoad() {
        var model;

        var primitives = viewer.scene.primitives;
        var length = primitives.length;
        for (var i = 0; i < length; ++i) {
            var prim = primitives.get(i);
            if (prim.id === entity) {
                model = prim;
                break;
            }
        }

        when(model.readyPromise).then(function() {
            camera.position = new Cartesian3(0.5, 0.0, 0.0);
            camera.direction = new Cartesian3(1.0, 0.0, 0.0);
            camera.up = new Cartesian3(0.0, 0.0, 1.0);
            camera.right = new Cartesian3(0.0, -1.0, 0.0);

            viewer.scene.preRender.addEventListener(function() {
                var offset = Cartesian3.clone(camera.position);
                var direction = Cartesian3.clone(camera.direction);
                var up = Cartesian3.clone(camera.up);

                camera.lookAtTransform(model.modelMatrix);

                Cartesian3.clone(offset, camera.position);
                Cartesian3.clone(direction, camera.direction);
                Cartesian3.clone(up, camera.up);
                Cartesian3.cross(direction, up, camera.right);
            });
        });
    }

    var removeEventListener = viewer.scene.postRender.addEventListener(function() {
        updateCameraOnLoad();
        removeEventListener();
    });

    loadingIndicator.style.display = 'none';
});