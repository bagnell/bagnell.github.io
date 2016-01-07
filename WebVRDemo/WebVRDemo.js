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
    Viewer) {
    "use strict";

    var loadingIndicator = document.getElementById('loadingIndicator');

    var viewer = new Viewer('cesiumContainer', {
        terrainProviderViewModels : [], //Disable terrain changing
        animation : false,
        baseLayerPicker : false,
        fullscreenButton : false,//true,
        vrButton : true,
        geocoder : false,
        homeButton : false,
        infoBox : false,
        //sceneModePicker : false,
        selectionIndicator : false,
        timeline : false,
        navigationHelpButton : false,
        navigationInstructionsInitiallyVisible : false//,
        //scene3DOnly : true
    });

    /*
    var viewer = new Cesium.Viewer('cesiumContainer', {
        vrButton : true,
        fullscreenButton : false,
        timeline : false,
        animation : false
    });
    */

    //viewer.scene.useWebVR = true;
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
            viewer.entities.add({
                                    position : position,
                                    point : {
                                        pixelSize : 8,
                                        color : Color.TRANSPARENT,
                                        outlineColor : Color.YELLOW,
                                        outlineWidth : 3
                                    }
                                });
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
        orientation : new VelocityOrientationProperty(position),
        model : {
            uri : './Model/Cesium_Air.gltf',
            minimumPixelSize : 64
        },
        path : {
            resolution : 1,
            material : new PolylineGlowMaterialProperty({
                glowPower : 0.1,
                color : Color.YELLOW
            }),
            width : 10
        }
    });

    entity.position.setInterpolationOptions({
        interpolationDegree : 2,
        interpolationAlgorithm : HermitePolynomialApproximation
    });

    var camera = viewer.camera;

    function setCameraPosition(time) {
        if (viewer.scene.mode === SceneMode.MORPHING) {
            return;
        }

        // set the camera to be in VVLY of the plane, and use the original camera
        // position and orientation. the position is a constant offset from the origin.
        // the orientation will be set from the device orientation event.
        var deltaTime = JulianDate.addSeconds(time, 0.001, new JulianDate());

        var startPosition = position.getValue(time);
        var endPosition = position.getValue(deltaTime);

        var xAxis = Cartesian3.subtract(endPosition, startPosition, new Cartesian3());
        Cartesian3.normalize(xAxis, xAxis);
        var zAxis = Ellipsoid.WGS84.geodeticSurfaceNormal(startPosition);
        var yAxis = Cartesian3.cross(zAxis, xAxis, new Cartesian3());
        Cartesian3.normalize(yAxis, yAxis);
        Cartesian3.cross(xAxis, yAxis, zAxis);
        Cartesian3.normalize(zAxis, zAxis);

        var basis = new Matrix3();
        Matrix3.setColumn(basis, 0, xAxis, basis);
        Matrix3.setColumn(basis, 1, yAxis, basis);
        Matrix3.setColumn(basis, 2, zAxis, basis);

        var transform = Matrix4.fromRotationTranslation(basis, startPosition);

        var offset = Cartesian3.clone(camera.position);
        var direction = Cartesian3.clone(camera.direction);
        var up = Cartesian3.clone(camera.up);

        camera.lookAtTransform(transform);

        Cartesian3.clone(offset, camera.position);
        Cartesian3.clone(direction, camera.direction);
        Cartesian3.clone(up, camera.up);
        Cartesian3.cross(direction, up, camera.right);
    }

    // set the initial camera position and orientation as if it was in the
    // aircraft's reference frame.
    var cameraPosition = new Cartesian3(-1.0, 0.0, 1.0);
    Cartesian3.normalize(cameraPosition, cameraPosition);
    Cartesian3.multiplyByScalar(cameraPosition, 40.0, cameraPosition);
    Cartesian3.clone(cameraPosition, camera.position);

    Cartesian3.clone(camera.position, camera.direction);
    Cartesian3.negate(camera.direction, camera.direction);
    Cartesian3.normalize(camera.direction, camera.direction);
    Cartesian3.cross(camera.direction, Cartesian3.UNIT_Z, camera.right);
    Cartesian3.cross(camera.right, camera.direction, camera.up);
    Cartesian3.cross(camera.direction, camera.up, camera.right);

    viewer.scene.preRender.addEventListener(function(scene, time) {
        // update the camera after all normal input, but before rendering.
        setCameraPosition(time);
    });

    loadingIndicator.style.display = 'none';
});