/*global require*/
require({
            baseUrl : '.',
            paths : {
                domReady : 'Cesium/ThirdParty/requirejs-2.1.9/domReady',
                Cesium : 'Cesium/Source'
            }
        }, [
            'Cesium/Core/BoxGeometry',
            'Cesium/Core/Cartesian3',
            'Cesium/Core/Cartographic',
            'Cesium/Core/Color',
            'Cesium/Core/ColorGeometryInstanceAttribute',
            'Cesium/Core/EllipsoidGeometry',
            'Cesium/Core/Extent',
            'Cesium/Core/ExtentGeometry',
            'Cesium/Core/GeometryInstance',
            'Cesium/Core/Matrix4',
            'Cesium/Core/Transforms',
            'Cesium/Scene/PerInstanceColorAppearance',
            'Cesium/Scene/Primitive',
            'Cesium/Widgets/CesiumWidget/CesiumWidget'
        ], function(
            BoxGeometry,
            Cartesian3,
            Cartographic,
            Color,
            ColorGeometryInstanceAttribute,
            EllipsoidGeometry,
            Extent,
            ExtentGeometry,
            GeometryInstance,
            Matrix4,
            Transforms,
            PerInstanceColorAppearance,
            Primitive,
            CesiumWidget
) {
    var widget = new CesiumWidget('cesiumContainer');
    var scene = widget.scene;
    scene.debugShowFramesPerSecond = true;

    var primitives = scene.primitives;
    var ellipsoid = widget.centralBody.ellipsoid;

    var geometry = [];

    function createPrimitives(batch) {
        primitives.removeAll();
        geometry.length = 0;

        var modelMatrix = Matrix4.multiplyByTranslation(
            Transforms.eastNorthUpToFixedFrame(ellipsoid.cartographicToCartesian(Cartographic.fromDegrees(-68.0, 40.0))),
            new Cartesian3(0.0, 0.0, 500000.0));

        var outerEllipsoidInstance = new GeometryInstance({
            geometry : new EllipsoidGeometry({
                vertexFormat : PerInstanceColorAppearance.VERTEX_FORMAT,
                radii : new Cartesian3(500000.0, 500000.0, 500000.0)
            }),
            modelMatrix : modelMatrix,
            attributes : {
                color : ColorGeometryInstanceAttribute.fromColor(new Color(0.0, 1.0, 0.0, 0.5))
            }
        });

        var innerEllipsoidInstance = new GeometryInstance({
            geometry : new EllipsoidGeometry({
                vertexFormat : PerInstanceColorAppearance.VERTEX_FORMAT,
                radii : new Cartesian3(250000.0, 250000.0, 250000.0)
            }),
            modelMatrix : modelMatrix,
            attributes : {
                color : ColorGeometryInstanceAttribute.fromColor(new Color(1.0, 0.0, 0.0, 0.5))
            }
        });

        var boxGeometryInstance = new GeometryInstance({
            geometry : BoxGeometry.fromDimensions({
                                                      vertexFormat : PerInstanceColorAppearance.VERTEX_FORMAT,
                                                      dimensions : new Cartesian3(750000.0, 750000.0, 750000.0)
                                                  }),
            modelMatrix : modelMatrix,
            attributes : {
                color : ColorGeometryInstanceAttribute.fromColor(new Color(1.0, 0.0, 0.0, 0.5))
            }
        });

        var appearance = new PerInstanceColorAppearance({
            translucent : true,
            closed : true
        });

        if (batch) {
            geometry.push(primitives.add(new Primitive({
                geometryInstances : [boxGeometryInstance, outerEllipsoidInstance],
                appearance : appearance
            })));
        } else {
            geometry.push(
                primitives.add(new Primitive({
                    geometryInstances : [boxGeometryInstance],
                    appearance : appearance
                })),
                primitives.add(new Primitive({
                    geometryInstances : [outerEllipsoidInstance],
                    appearance : appearance
                }))
            );
        }

        var redExtentInstance = new GeometryInstance({
            geometry : new ExtentGeometry({
                extent : Extent.fromDegrees(-95.0, 20.0, -85.0, 30.0),
                vertexFormat : PerInstanceColorAppearance.VERTEX_FORMAT
            }),
            attributes : {
                color : ColorGeometryInstanceAttribute.fromColor(new Color(1.0, 0.0, 0.0, 0.5))
            }
        });

        var yellowExtentInstance = new GeometryInstance({
            geometry : new ExtentGeometry({
                extent : Extent.fromDegrees(-90.0, 25.0, -80.0, 35.0),
                vertexFormat : PerInstanceColorAppearance.VERTEX_FORMAT,
                height : 100000.0
            }),
            attributes : {
                color : ColorGeometryInstanceAttribute.fromColor(new Color(1.0, 1.0, 0.0, 0.5))
            }
        });

        var blueExtentInstance = new GeometryInstance({
            geometry : new ExtentGeometry({
                extent : Extent.fromDegrees(-85.0, 30.0, -75.0, 40.0),
                vertexFormat : PerInstanceColorAppearance.VERTEX_FORMAT,
                height : 200000.0
            }),
            attributes : {
                color : ColorGeometryInstanceAttribute.fromColor(new Color(0.0, 0.0, 1.0, 0.5))
            }
        });

        appearance = new PerInstanceColorAppearance({
            translucent : true
        });

        if (batch) {
            geometry.push(primitives.add(new Primitive({
                geometryInstances : [redExtentInstance, yellowExtentInstance, blueExtentInstance],
                appearance : appearance
            })));
        } else {
            geometry.push(
                primitives.add(new Primitive({
                    geometryInstances : redExtentInstance,
                    appearance : appearance
                })),
                primitives.add(new Primitive({
                    geometryInstances : yellowExtentInstance,
                    appearance : appearance
                })),
                primitives.add(new Primitive({
                    geometryInstances : blueExtentInstance,
                    appearance : appearance
                }))
            );
        }

        var maxLat = 50.0;
        var minLat = 30.0;
        var latIncrement = 2.0;

        var maxLon = -125.0;
        var minLon = -95.0;
        var lonIncrement = 2.0;

        var gap = 1.0;

        var minHeight = 100000.0;
        var maxHeight = 500000.0;

        var instances = [];

        for (var lon = maxLon; lon < minLon; lon += lonIncrement + gap) {
            for (var lat = maxLat; lat > minLat; lat -= latIncrement + gap) {
                var color = new Color(Math.random(), Math.random(), Math.random(), 0.5);

                instances.push(new GeometryInstance({
                    geometry : new ExtentGeometry({
                        extent : Extent.fromDegrees(lon, lat - latIncrement, lon + lonIncrement, lat),
                        vertexFormat : PerInstanceColorAppearance.VERTEX_FORMAT,
                        height : Math.random() * (maxHeight - minHeight) + minHeight,
                        extrudedHeight : 0.0
                    }),
                    attributes : {
                        color : ColorGeometryInstanceAttribute.fromColor(color)
                    }
                }));
            }
        }

        if (batch) {
            geometry.push(primitives.add(new Primitive({
                geometryInstances : instances,
                appearance : appearance
            })));
        } else {
            for (var j = 0; j < instances.length; ++j) {
                geometry.push(primitives.add(new Primitive({
                    geometryInstances : instances[j],
                    appearance : appearance
                })));
            }
        }
    }

    function showBoundingSpheres(show) {
        for (var i = 0; i < geometry.length; ++i) {
            geometry[i].debugShowBoundingVolume = show;
        }
    }

    function selectMenuOption(menu, options) {
        options[menu.selectedIndex].onselect();
    }

    function addToolbarMenu(options, onchange) {
        var menu = document.createElement('select');
        menu.className = 'cesium-button';
        menu.onchange = onchange;
        document.getElementById('toolbar').appendChild(menu);

        for (var i = 0, len = options.length; i < len; ++i) {
            var option = document.createElement('option');
            option.textContent = options[i].text;
            option.value = options[i].value;
            menu.appendChild(option);
        }
    }

    (function(scene) {
        var toggleOITMethod = [];

        // render one frame to check for MRT support
        scene.initializeFrame();
        scene.render();

        if (scene._oitResources._translucentMRTSupport) {
            toggleOITMethod.push({
                                     text : 'OIT with Multiple Render Targets',
                                     onselect : function() {
                                         scene._oitResources._translucentMRTSupport = true;
                                         scene._oitResources._translucentMultipassSupport = false;
                                     }
                                 });
        }

        // render another frame with MRT disabled to check for multipass support
        scene._oitResources._translucentMRTSupport = false;
        scene._oitResources._translucentMultipassSupport = true;
        scene.initializeFrame();
        scene.render();

        if (scene._oitResources._translucentMultipassSupport) {
            toggleOITMethod.push({
                                     text : 'OIT with Multiple Passes',
                                     onselect : function() {
                                         scene._oitResources._translucentMRTSupport = false;
                                         scene._oitResources._translucentMultipassSupport = true;
                                     }
                                 });
        }

        // bounding volume sorting is always supported
        toggleOITMethod.push({
                                 text : 'Alpha Blending',
                                 onselect : function() {
                                     scene._oitResources._translucentMRTSupport = false;
                                     scene._oitResources._translucentMultipassSupport = false;
                                 }
                             });

        // reset to best method
        toggleOITMethod[0].onselect();

        addToolbarMenu(toggleOITMethod, function() {
            selectMenuOption(this, toggleOITMethod);
        });

        var toggleFXAAOptions = [{
            text : 'FXAA Enabled',
            onselect : function() {
                scene.fxaaOrderIndependentTranslucency = true;
            }
        }, {
            text : 'FXAA Disabled',
            onselect : function() {
                scene.fxaaOrderIndependentTranslucency = false;
            }
        }];

        addToolbarMenu(toggleFXAAOptions, function() {
            selectMenuOption(this, toggleFXAAOptions);
        });

        var batched = document.createElement('input');
        batched.type = 'checkbox';
        batched.checked = true;
        document.getElementById('toolbar').appendChild(batched);
        document.getElementById('toolbar').appendChild(document.createTextNode('Batch Geometry'));

        var showBV = document.createElement('input');
        showBV.type = 'checkbox';
        showBV.checked = false;
        showBV.onchange = function() {
            showBoundingSpheres(this.checked);
        };
        document.getElementById('toolbar').appendChild(showBV);
        document.getElementById('toolbar').appendChild(document.createTextNode('Show Bounding Spheres'));

        batched.onchange = function() {
            createPrimitives(this.checked);
            showBoundingSpheres(showBV.checked);
        };
        batched.onchange();

        var text = document.createElement('input');
        text.type = 'text';
        text.value = scene._oitResources.weightFunction;
        text.setAttribute('spellcheck', 'false');
        text.style.cssText = 'background: rgba(30,30,30,0.7); color: #eee; padding: 2px 5px; border-radius: 4px; border: 1px solid #555; width: 95%;';
        document.getElementById('toolbar').appendChild(text);

        var errorElement = document.createElement('div');
        errorElement.style.cssText = 'color: #f00; font-weight: bold; margin: 0 2px; background: rgba(100,0,0,0.55); padding: 2px 5px; display: block; width: 95%;';
        errorElement.style.display = 'none';
        document.getElementById('toolbar').appendChild(errorElement);

        scene._oitResources.onError.addEventListener(function(message) {
            errorElement.style.display = 'block';
            errorElement.textContent = message;
        });

        text.addEventListener('keydown', function(e) {
            if (e.keyCode === 13) {
                scene._oitResources.weightFunction = text.value;
                errorElement.style.display = 'none';
            }
        });

        var instructions = document.createElement('div');
        instructions.style.cssText = 'width: 95%; color: #ffffff';
        document.getElementById('toolbar').appendChild(instructions);

        instructions.appendChild(document.createElement('br'));
        instructions.appendChild(document.createTextNode('Pan - left mouse drag'));
        instructions.appendChild(document.createElement('br'));
        instructions.appendChild(document.createTextNode('Tilt - middle mouse drag'));
        instructions.appendChild(document.createElement('br'));
        instructions.appendChild(document.createTextNode('Zoom - right mouse drag'));
    })(scene);

    loadingIndicator.style.display = 'none';
});