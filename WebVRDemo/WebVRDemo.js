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
           'Cesium/Core/Transforms',
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
    Transforms,
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

    var cesiumTerrainProviderMeshes = new CesiumTerrainProvider({
        url : '//assets.agi.com/stk-terrain/world',
        requestWaterMask : true,
        requestVertexNormals : true
    });
    viewer.terrainProvider = cesiumTerrainProviderMeshes;

    var camera = viewer.camera;

    var target = new Cartesian3(300770.50872389384, 5634912.131394585, 2978152.2865545116);
    var offset = new Cartesian3(6344.974098678562, -793.3419798081741, 2499.9508860763162);
    camera.lookAt(target, offset);
    camera.lookAtTransform(Matrix4.IDENTITY);

    /*
    var vrHMD;
    var vrSensor;

    function EnumerateVRDevice(devices) {
        for (var i = 0; i < devices.length; ++i) {
            if (devices[i] instanceof HMDVRDevice) {
                vrHMD = devices[i];

                if ('getEyeParameters' in vrHMD) {
                    var leftEye = vrHMD.getEyeParameters("left");
                    var rightEye = vrHMD.getEyeParameters("right");

                    var e = leftEye.eyeTranslation;
                    vrEyeLeft = [e.x, e.y, e.z];
                    e = rightEye.eyeTranslation;
                    vrEyeRight = [e.x, e.y, e.z];

                    vrFovLeft = leftEye.recommendedFieldOfView;
                    vrFovRight = rightEye.recommendedFieldOfView;
                } else {
                    var e = vrHMD.getEyeTranslation("left");
                    vrEyeLeft = [e.x, e.y, e.z];
                    e = vrHMD.getEyeTranslation("right");
                    vrEyeRight = [e.x, e.y, e.z];

                    vrFovLeft = vrHMD.getRecommendedEyeFieldOfView("left");
                    vrFovRight = vrHMD.getRecommendedEyeFieldOfView("right");
                }

                break;
            }
        }

        for (var i = 0; i < devices.length; ++i) {
            if (devices[i] instanceof PositionSensorVRDevice) {
                // If we have an HMD, make sure to get the associated sensor
                if (vrHMD == null || vrHMD.hardwareUnitId == devices[i].hardwareUnitId) {
                    vrSensor = devices[i];
                    break;
                }
            }
        }

        var fullscreenContainer = document.createElement('div');
        fullscreenContainer.className = 'cesium-viewer-fullscreenContainer';
        document.getElementsByClassName('cesium-viewer')[0].appendChild(fullscreenContainer);
        var fullscreenButton = new FullscreenButton(fullscreenContainer, viewer.canvas, vrHMD);
    }

    if (navigator.getVRDevices) {
        navigator.getVRDevices().then(EnumerateVRDevice);
    } else if (navigator.mozGetVRDevices) {
        navigator.mozGetVRDevices(EnumerateVRDevice);
    }
    */

    var alpha;
    var beta;
    var gamma;

    window.addEventListener('deviceorientation', function(e) {
        //console.log('alpha: ' + e.alpha + ', beta: ' + e.beta + ', gamma: ' + e.gamma);

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

        alpha = eAlpha;
        beta = eBeta;
        gamma = eGamma;

        var gQuat = Quaternion.fromAxisAngle(camera.right, g);

        var matrix = Matrix3.fromQuaternion(gQuat);

        Matrix3.getColumn(matrix, 0, camera.right);
        Matrix3.getColumn(matrix, 1, camera.up);
        Matrix3.getColumn(matrix, 2, camera.direction);
    }, false);

    loadingIndicator.style.display = 'none';
});