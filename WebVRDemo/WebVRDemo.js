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
           'Cesium/Core/Math',
           'Cesium/Core/Matrix3',
           'Cesium/Core/Matrix4',
           'Cesium/Core/Transforms',
           'Cesium/Widgets/FullscreenButton/FullscreenButton',
           'Cesium/Widgets/Viewer/Viewer',
           'domReady!'
       ], function(
    Cartesian3,
    CesiumTerrainProvider,
    defaultValue,
    CesiumMath,
    Matrix3,
    Matrix4,
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

    window.addEventListener('deviceorientation', function(e) {
        //console.log('alpha: ' + e.alpha + ', beta: ' + e.beta + ', gamma: ' + e.gamma);

        var alpha = CesiumMath.toRadians(defaultValue(e.alpha, 0.0));
        var beta = CesiumMath.toRadians(defaultValue(e.beta, 0.0));
        var gamma = CesiumMath.toRadians(defaultValue(e.gamma, 0.0));

        var aMat = Matrix3.fromRotationX(alpha);
        var bMat = Matrix3.fromRotationY(beta);
        var gMat = Matrix3.fromRotationZ(-gamma);

        var rotation = new Matrix3();
        Matrix3.multiply(aMat, gMat, rotation);
        Matrix3.multiply(bMat, rotation, rotation);

        var transform = Transforms.eastNorthUpToFixedFrame(camera.position);
        camera.lookAtTransform(transform);

        Matrix3.transpose(rotation, rotation);
        Matrix3.getColumn(rotation, 0, camera.right);
        Matrix3.getColumn(rotation, 1, camera.up);
        Matrix3.getColumn(rotation, 2, camera.direction);

        camera.lookAtTransform(Matrix4.IDENTITY);
    }, false);

    loadingIndicator.style.display = 'none';
});