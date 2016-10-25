require({
            baseUrl : '.',
            paths : {
                domReady : 'Cesium/ThirdParty/requirejs-2.1.20/domReady',
                Cesium : 'Cesium/Source'
            }
        }, [
           'Cesium/Core/CesiumTerrainProvider',
		   'Cesium/Core/HeadingPitchRange',
		   'Cesium/Core/Matrix4',
		   'Cesium/Scene/Cesium3DTileset',
           'Cesium/Widgets/Viewer/Viewer',
           'domReady!'
       ], function(
    CesiumTerrainProvider,
	HeadingPitchRange,
	Matrix4,
	Cesium3DTileset,
    Viewer) {
    "use strict";

    var loadingIndicator = document.getElementById('loadingIndicator');
	
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


/*
var canvas = viewer.canvas;
canvas.setAttribute('tabindex', '0'); // needed to put focus on the canvas
canvas.onclick = function() {
    // To get key events
    canvas.focus();
};

var handler = new Cesium.ScreenSpaceEventHandler(canvas);

var pickingEnabled = true;
var flags = {
    // Mouse
    leftDown : false,
    middleDown : false,
    rightDown : false,

    annotate : false
};

handler.setInputAction(function(movement) {
    flags.leftDown = true;
}, Cesium.ScreenSpaceEventType.LEFT_DOWN);

handler.setInputAction(function(movement) {
    flags.middleDown = true;
}, Cesium.ScreenSpaceEventType.MIDDLE_DOWN);

handler.setInputAction(function(movement) {
    flags.rightDown = true;
}, Cesium.ScreenSpaceEventType.RIGHT_DOWN);

handler.setInputAction(function(movement) {
    flags.leftDown = false;
}, Cesium.ScreenSpaceEventType.LEFT_UP);

handler.setInputAction(function(movement) {
    flags.middleDown = false;
}, Cesium.ScreenSpaceEventType.MIDDLE_UP);

handler.setInputAction(function(movement) {
    flags.rightDown = false;
}, Cesium.ScreenSpaceEventType.RIGHT_UP);

document.addEventListener('keyup', function(e) {
    if (e.keyCode === 'W'.charCodeAt(0)) {
        flags.annotate = !flags.annotate;
    }
}, false);

var current = {
    feature : undefined,
    originalColor : new Cesium.Color()
};

var HIGHLIGHT_COLOR = new Cesium.Color(1.0, 1.0, 0.0, 0.4);

// Highlight feature on mouse over
handler.setInputAction(function(movement) {
    if (!pickingEnabled) {
        return;
    }

    if (flags.leftDown || flags.middleDown || flags.rightDown) {
        // Don't highlight when panning and zooming
        return;
    }

    var pickedFeature = scene.pick(movement.endPosition);

    if (Cesium.defined(current.feature) && (current.feature !== pickedFeature)) {
        // Restore original color to feature that is no longer selected

        // This assignment is necessary to work with the set property
        current.feature.color = Cesium.Color.clone(current.originalColor, current.feature.color);
        current.feature = undefined;
    }

    if (Cesium.defined(pickedFeature) && (pickedFeature !== current.feature)) {
// For testing re-evaluating a style when a property changes
//      pickedFeature.setProperty('id', 1);

        current.feature = pickedFeature;
        Cesium.Color.clone(pickedFeature.color, current.originalColor);

        // Highlight newly selected feature
        pickedFeature.color = Cesium.Color.clone(HIGHLIGHT_COLOR, pickedFeature.color);
    }
}, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

var annotations = scene.primitives.add(new Cesium.LabelCollection());

handler.setInputAction(function(movement) {
    if (!pickingEnabled) {
        return;
    }

    var feature = current.feature;
    if (Cesium.defined(feature)) {
        if (feature.getProperty('clicked')) {
            console.log('already clicked');
        } else {
            var properties = feature.primitive.properties; // get properties from tileset
            if (Cesium.defined(properties)) {
                for (var name in properties) {
                    if (properties.hasOwnProperty(name)) {
                        console.log(name + ': ' + feature.getProperty(name));
                    }
                }
            }

            // evaluate feature description
            if (Cesium.defined(tileset.style.meta.description)) {
                console.log("Description : " + tileset.style.meta.description.evaluate(feature));
            }

            feature.setProperty('clicked', true);
        }
    }
}, Cesium.ScreenSpaceEventType.LEFT_CLICK);

handler.setInputAction(function(movement) {
    if (!pickingEnabled) {
        return;
    }

    if (flags.annotate) {
        // Add annotation showing the height at the click location
        annotate(movement);
    } else {
        // When a feature is double clicked, zoom to it
        zoom(movement);
    }
}, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);

function annotate(movement) {
    if (Cesium.defined(current.feature) && scene.pickPositionSupported) {
        var cartesian = scene.pickPosition(movement.position);
        var cartographic = Cesium.Cartographic.fromCartesian(cartesian);
        var height = cartographic.height.toFixed(2) + ' m';

        annotations.add({
            position : cartesian,
            text : height,
            horizontalOrigin : Cesium.HorizontalOrigin.LEFT,
            verticalOrigin : Cesium.VerticalOrigin.BOTTOM,
            eyeOffset : new Cesium.Cartesian3(0.0, 0.0, -1.0)
        });
    }
}

function offsetFromHeadingPitchRange(heading, pitch, range) {
    pitch = Cesium.Math.clamp(pitch, -Cesium.Math.PI_OVER_TWO, Cesium.Math.PI_OVER_TWO);
    heading = Cesium.Math.zeroToTwoPi(heading) - Cesium.Math.PI_OVER_TWO;

    var pitchQuat = Cesium.Quaternion.fromAxisAngle(Cesium.Cartesian3.UNIT_Y, -pitch);
    var headingQuat = Cesium.Quaternion.fromAxisAngle(Cesium.Cartesian3.UNIT_Z, -heading);
    var rotQuat = Cesium.Quaternion.multiply(headingQuat, pitchQuat, headingQuat);
    var rotMatrix = Cesium.Matrix3.fromQuaternion(rotQuat);

    var offset = Cesium.Cartesian3.clone(Cesium.Cartesian3.UNIT_X);
    Cesium.Matrix3.multiplyByVector(rotMatrix, offset, offset);
    Cesium.Cartesian3.negate(offset, offset);
    Cesium.Cartesian3.multiplyByScalar(offset, range, offset);
    return offset;
}

function zoom(movement) {
    var feature = current.feature;
    if (Cesium.defined(feature)) {
        var longitude = feature.getProperty('Longitude');
        var latitude = feature.getProperty('Latitude');
        var height = feature.getProperty('Height');

        if (!Cesium.defined(longitude) || !Cesium.defined(latitude) || !Cesium.defined(height)) {
            return;
        }

        var positionCartographic = new Cesium.Cartographic(longitude, latitude, height * 0.5);
        var position = scene.globe.ellipsoid.cartographicToCartesian(positionCartographic);

        var camera = scene.camera;
        var heading = camera.heading;
        var pitch = camera.pitch;

        var offset = offsetFromHeadingPitchRange(heading, pitch, height * 2.0);

        var transform = Cesium.Transforms.eastNorthUpToFixedFrame(position);
        Cesium.Matrix4.multiplyByPoint(transform, offset, position);

        camera.flyTo({
            destination : position,
            orientation : {
                heading : heading,
                pitch : pitch
            },
            easingFunction : Cesium.EasingFunction.QUADRATIC_OUT
        });
    }
}
*/

    loadingIndicator.style.display = 'none';
});