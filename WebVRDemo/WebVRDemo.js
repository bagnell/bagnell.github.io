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
           'Cesium/Core/ClockRange',
           'Cesium/Core/Color',
           'Cesium/Core/HermitePolynomialApproximation',
           'Cesium/Core/JulianDate',
           'Cesium/Core/Math',
           'Cesium/Core/Matrix4',
           'Cesium/Core/TimeInterval',
           'Cesium/Core/TimeIntervalCollection',
           'Cesium/DataSources/PolylineGlowMaterialProperty',
           'Cesium/DataSources/SampledPositionProperty',
           'Cesium/DataSources/VelocityOrientationProperty',
           'Cesium/Widgets/Viewer/Viewer',
           'domReady!'
       ], function(
    Cartesian3,
    CesiumTerrainProvider,
    ClockRange,
    Color,
    HermitePolynomialApproximation,
    JulianDate,
    CesiumMath,
    Matrix4,
    TimeInterval,
    TimeIntervalCollection,
    PolylineGlowMaterialProperty,
    SampledPositionProperty,
    VelocityOrientationProperty,
    Viewer) {
    "use strict";

    var loadingIndicator = document.getElementById('loadingIndicator');

    var viewer = new Viewer('cesiumContainer', {
        terrainProviderViewModels : [], //Disable terrain changing
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

    //Enable lighting based on sun/moon positions
    viewer.scene.globe.enableLighting = true;

    //Use STK World Terrain
    viewer.terrainProvider = new CesiumTerrainProvider({
        url : '//assets.agi.com/stk-terrain/world',
        requestVertexNormals : true
    });

    //Enable depth testing so things behind the terrain disappear.
    viewer.scene.globe.depthTestAgainstTerrain = true;

    //Set the random number seed for consistent results.
    CesiumMath.setRandomNumberSeed(3);

    //Set bounds of our simulation time
    var start = JulianDate.fromDate(new Date(2015, 2, 25, 16));
    var stop = JulianDate.addSeconds(start, 360, new JulianDate());

    //Make sure viewer is at the desired time.
    viewer.clock.startTime = start.clone();
    viewer.clock.stopTime = stop.clone();
    viewer.clock.currentTime = start.clone();
    viewer.clock.clockRange = ClockRange.LOOP_STOP; //Loop at the end
    viewer.clock.multiplier = 10;

    //Generate a random circular pattern with varying heights.
    function computeCirclularFlight(lon, lat, radius) {
        var property = new SampledPositionProperty();
        for (var i = 0; i <= 360; i += 45) {
            var radians = CesiumMath.toRadians(i);
            var time = JulianDate.addSeconds(start, i, new JulianDate());
            var position = Cartesian3.fromDegrees(lon + (radius * 1.5 * Math.cos(radians)), lat + (radius * Math.sin(radians)), CesiumMath.nextRandomNumber() * 500 + 1750);
            property.addSample(time, position);

            //Also create a point for each sample we generate.
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

    //Compute the entity position property.
    var position = computeCirclularFlight(-112.110693, 36.0994841, 0.03);

    //Actually create the entity
    var entity = viewer.entities.add({
        //Set the entity availability to the same interval as the simulation time.
        availability : new TimeIntervalCollection([new TimeInterval({
            start : start,
            stop : stop
        })]),
        //Use our computed positions
        position : position,
        //Automatically compute orientation based on position movement.
        orientation : new VelocityOrientationProperty(position),
        //Load the Cesium plane model to represent the entity
        model : {
            uri : './Model/Cesium_Air.gltf',
            minimumPixelSize : 64
        },
        //Show the path as a pink line sampled in 1 second increments.
        path : {
            resolution : 1,
            material : new PolylineGlowMaterialProperty({
                glowPower : 0.1,
                color : Color.YELLOW
            }),
            width : 10
        }
    });

    viewer.trackedEntity = entity;

    entity.position.setInterpolationOptions({
        interpolationDegree : 2,
        interpolationAlgorithm : HermitePolynomialApproximation
    });

    /*
     var camera = viewer.camera;
     var target = new Cartesian3(300770.50872389384, 5634912.131394585, 2978152.2865545116);
     var offset = new Cartesian3(6344.974098678562, -793.3419798081741, 2499.9508860763162);
     camera.lookAt(target, offset);
     camera.lookAtTransform(Matrix4.IDENTITY);
     */

    loadingIndicator.style.display = 'none';
});