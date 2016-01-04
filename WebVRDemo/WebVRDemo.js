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
           'Cesium/Widgets/Viewer/Viewer',
           'domReady!'
       ], function(
    Cartesian3,
    CesiumTerrainProvider,
    Viewer) {
    "use strict";

    var loadingIndicator = document.getElementById('loadingIndicator');
    var viewer = new Viewer('cesiumContainer', {
        animation : false,
        baseLayerPicker : false,
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

    viewer.scene.useWebVR = true;

    /*
    var cesiumTerrainProviderMeshes = new CesiumTerrainProvider({
        url : '//assets.agi.com/stk-terrain/world',
        requestWaterMask : true,
        requestVertexNormals : true
    });
    viewer.terrainProvider = cesiumTerrainProviderMeshes;
    */

    /*
    var camera = viewer.camera;
    var target = new Cartesian3(300770.50872389384, 5634912.131394585, 2978152.2865545116);
    var offset = new Cartesian3(6344.974098678562, -793.3419798081741, 2499.9508860763162);
    camera.lookAt(target, offset);
    camera.lookAtTransform(Matrix4.IDENTITY);
    */

    loadingIndicator.style.display = 'none';
});