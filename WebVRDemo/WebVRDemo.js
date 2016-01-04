/*global require*/
require({
            baseUrl : '.',
            paths : {
                domReady : 'Cesium/ThirdParty/requirejs-2.1.20/domReady',
                Cesium : 'Cesium/Source'
            }
        }, [
           'Cesium/Core/Cartesian3',
           'Cesium/Core/CesiumTerrainProvider',
           'Cesium/Core/defaultValue',
           'Cesium/Core/defined',
           'Cesium/Core/Math',
           'Cesium/Core/Matrix3',
           'Cesium/Core/Matrix4',
           'Cesium/Core/Quaternion',
           'Cesium/Scene/DeviceOrientationCameraController',
           'Cesium/Widgets/FullscreenButton/FullscreenButton',
           'Cesium/Widgets/Viewer/Viewer',
           'domReady!'
       ], function(
    Cartesian3,
    CesiumTerrainProvider,
    defaultValue,
    defined,
    CesiumMath,
    Matrix3,
    Matrix4,
    Quaternion,
    DeviceOrientationCameraController,
    FullscreenButton,
    Viewer) {
    "use strict";

    var loadingIndicator = document.getElementById('loadingIndicator');
    var viewer = new Viewer('cesiumContainer', {
        animation : false,
        baseLayerPicker : false,
        //fullscreenButton : false,
        fullscreenButton : true,
        geocoder : false,
        homeButton : false,
        infoBox : false,
        sceneModePicker : false,
        selectionIndicator : false,
        timeline : false,
        navigationHelpButton : false,
        navigationInstructionsInitiallyVisible : false,
        scene3DOnly : true
    });

    /*
    var cesiumTerrainProviderMeshes = new CesiumTerrainProvider({
        url : '//assets.agi.com/stk-terrain/world',
        requestWaterMask : true,
        requestVertexNormals : true
    });
    viewer.terrainProvider = cesiumTerrainProviderMeshes;
    */

    viewer.scene.screenSpaceCameraController.enableInputs = false;

    /*
    var docc = new DeviceOrientationCameraController(viewer.scene);
    viewer.scene.postRender.addEventListener(function() {
        docc.update(viewer.scene.frameState);
    });
    */

    //var camera = viewer.camera;

    /*
    var target = new Cartesian3(300770.50872389384, 5634912.131394585, 2978152.2865545116);
    var offset = new Cartesian3(6344.974098678562, -793.3419798081741, 2499.9508860763162);
    camera.lookAt(target, offset);
    camera.lookAtTransform(Matrix4.IDENTITY);
    */

    /*
    var alpha;
    var beta;
    var gamma;

    window.addEventListener('deviceorientation', function(e) {
        var eAlpha = CesiumMath.toRadians(defaultValue(e.alpha, 0.0));
        var eBeta = CesiumMath.toRadians(defaultValue(e.beta, 0.0));
        var eGamma = CesiumMath.toRadians(defaultValue(e.gamma, 0.0));

        if (!defined(alpha)) {
            alpha = eAlpha;
            beta = eBeta;
            gamma = eGamma;
        }

        var a = alpha - eAlpha;
        var b = beta - eBeta;
        var g = gamma - eGamma;

        var aQuat = Quaternion.fromAxisAngle(camera.up, -a);
        var bQuat = Quaternion.fromAxisAngle(camera.direction, b);
        var gQuat = Quaternion.fromAxisAngle(camera.right, g);

        var rotQuat = new Quaternion();
        Quaternion.multiply(gQuat, bQuat, rotQuat);
        Quaternion.multiply(aQuat, rotQuat, rotQuat);
        var matrix = Matrix3.fromQuaternion(rotQuat);

        Matrix3.multiplyByVector(matrix, camera.right, camera.right);
        Matrix3.multiplyByVector(matrix, camera.up, camera.up);
        Matrix3.multiplyByVector(matrix, camera.direction, camera.direction);

        alpha = eAlpha;
        beta = eBeta;
        gamma = eGamma;
    }, false);
    */

    loadingIndicator.style.display = 'none';
});