require({
	baseUrl : '.',
	paths : {
		domReady : 'Cesium/ThirdParty/requirejs-2.1.20/domReady',
		Cesium : 'Cesium/Source'
	}
}, [
   'Cesium/Core/Color',
   'Cesium/Core/CesiumTerrainProvider',
   'Cesium/Core/defined',
   'Cesium/Core/HeadingPitchRange',
   'Cesium/Core/Matrix4',
   'Cesium/Core/ScreenSpaceEventHandler',
   'Cesium/Core/ScreenSpaceEventType',
   'Cesium/Scene/Cesium3DTileset',
   'Cesium/Widgets/Viewer/Viewer',
   'domReady!'
], function(
    Color,
    CesiumTerrainProvider,
	defined,
	HeadingPitchRange,
	Matrix4,
	ScreenSpaceEventHandler,
	ScreenSpaceEventType,
	Cesium3DTileset,
    Viewer) {
    "use strict";
	
	var viewer = new Viewer('cesiumContainer', {
	    scene3DOnly : true
	});

	var scene = viewer.scene;
	scene.fog.enabled = false;
	scene.debugShowFramesPerSecond = true;

    var cesiumTerrainProviderMeshes = new CesiumTerrainProvider({
        url : 'https://assets.agi.com/stk-terrain/world',
        requestWaterMask : true,
        requestVertexNormals : true
    });
    viewer.terrainProvider = cesiumTerrainProviderMeshes;

    viewer.scene.globe.depthTestAgainstTerrain = true;

	var tileset = scene.primitives.add(new Cesium3DTileset({
		url : 'tilesets/Polygons/'
	}));
	tileset.debugColorizeTiles = true;

	tileset.readyPromise.then(function(tileset) {
		var boundingSphere = tileset.boundingSphere;
		viewer.camera.viewBoundingSphere(boundingSphere, new HeadingPitchRange(0, -2.0, 0));
		viewer.camera.lookAtTransform(Matrix4.IDENTITY);
	});

	var handler = new ScreenSpaceEventHandler(viewer.canvas);
	var flags = {
		leftDown : false,
		middleDown : false,
		rightDown : false
	};

	handler.setInputAction(function(movement) {
		flags.leftDown = true;
	}, ScreenSpaceEventType.LEFT_DOWN);

	handler.setInputAction(function(movement) {
		flags.middleDown = true;
	}, ScreenSpaceEventType.MIDDLE_DOWN);

	handler.setInputAction(function(movement) {
		flags.rightDown = true;
	}, ScreenSpaceEventType.RIGHT_DOWN);

	handler.setInputAction(function(movement) {
		flags.leftDown = false;
	}, ScreenSpaceEventType.LEFT_UP);

	handler.setInputAction(function(movement) {
		flags.middleDown = false;
	}, ScreenSpaceEventType.MIDDLE_UP);

	handler.setInputAction(function(movement) {
		flags.rightDown = false;
	}, ScreenSpaceEventType.RIGHT_UP);

	var current = {
		feature : undefined,
		originalColor : new Color()
	};

	var HIGHLIGHT_COLOR = new Color(1.0, 1.0, 0.0, 0.4);

	// Highlight feature on mouse over
	handler.setInputAction(function(movement) {
		if (flags.leftDown || flags.middleDown || flags.rightDown) {
			// Don't highlight when panning and zooming
			return;
		}

		var pickedFeature = scene.pick(movement.endPosition);

		if (defined(current.feature) && (current.feature !== pickedFeature)) {
			// Restore original color to feature that is no longer selected

			// This assignment is neces	sary to work with the set property
			current.feature.color = Color.clone(current.originalColor, current.feature.color);
			current.feature = undefined;
		}

		if (defined(pickedFeature) && (pickedFeature !== current.feature)) {
		// For testing re-evaluating a style when a property changes
		//      pickedFeature.setProperty('id', 1);

			current.feature = pickedFeature;
			Color.clone(pickedFeature.color, current.originalColor);

			// Highlight newly selected feature
			pickedFeature.color = Color.clone(HIGHLIGHT_COLOR, pickedFeature.color);
		}
	}, ScreenSpaceEventType.MOUSE_MOVE);

	var loadingIndicator = document.getElementById('loadingIndicator');
    loadingIndicator.style.display = 'none';
});