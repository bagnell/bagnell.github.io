/*global defineSuite*/
defineSuite([
        'DataSources/PointVisualizer',
        'Core/BoundingSphere',
        'Core/Cartesian3',
        'Core/Color',
        'Core/JulianDate',
        'Core/NearFarScalar',
        'DataSources/BoundingSphereState',
        'DataSources/ConstantProperty',
        'DataSources/EntityCollection',
        'DataSources/PointGraphics',
        'Specs/createScene'
    ], function(
        PointVisualizer,
        BoundingSphere,
        Cartesian3,
        Color,
        JulianDate,
        NearFarScalar,
        BoundingSphereState,
        ConstantProperty,
        EntityCollection,
        PointGraphics,
        createScene) {
    'use strict';

    var scene;
    var visualizer;

    beforeAll(function() {
        scene = createScene();
    });

    afterAll(function() {
        scene.destroyForSpecs();
    });

    afterEach(function() {
        visualizer = visualizer && visualizer.destroy();
    });

    it('constructor throws if no scene is passed.', function() {
        var entityCollection = new EntityCollection();
        expect(function() {
            return new PointVisualizer(undefined, entityCollection);
        }).toThrowDeveloperError();
    });

    it('constructor throws if no entityCollection is passed.', function() {
        expect(function() {
            return new PointVisualizer(scene, undefined);
        }).toThrowDeveloperError();
    });

    it('update throws if no time specified.', function() {
        var entityCollection = new EntityCollection();
        visualizer = new PointVisualizer(scene, entityCollection);
        expect(function() {
            visualizer.update();
        }).toThrowDeveloperError();
    });

    it('isDestroy returns false until destroyed.', function() {
        var entityCollection = new EntityCollection();
        visualizer = new PointVisualizer(scene, entityCollection);
        expect(visualizer.isDestroyed()).toEqual(false);
        visualizer.destroy();
        expect(visualizer.isDestroyed()).toEqual(true);
        visualizer = undefined;
    });

    it('removes the listener from the entity collection when destroyed', function() {
        var entityCollection = new EntityCollection();
        var visualizer = new PointVisualizer(scene, entityCollection);
        expect(entityCollection.collectionChanged.numberOfListeners).toEqual(1);
        visualizer = visualizer.destroy();
        expect(entityCollection.collectionChanged.numberOfListeners).toEqual(0);
    });

    it('object with no point does not create a pointPrimitive.', function() {
        var entityCollection = new EntityCollection();
        visualizer = new PointVisualizer(scene, entityCollection);

        var testObject = entityCollection.getOrCreateEntity('test');
        testObject.position = new ConstantProperty(new Cartesian3(1234, 5678, 9101112));
        visualizer.update(JulianDate.now());
        expect(scene.primitives.length).toEqual(0);
    });

    it('object with no position does not create a pointPrimitive.', function() {
        var entityCollection = new EntityCollection();
        visualizer = new PointVisualizer(scene, entityCollection);

        var testObject = entityCollection.getOrCreateEntity('test');
        var point = testObject.point = new PointGraphics();
        point.show = new ConstantProperty(true);

        visualizer.update(JulianDate.now());
        expect(scene.primitives.length).toEqual(0);
    });

    it('A PointGraphics causes a PointPrimitive to be created and updated.', function() {
        var time = JulianDate.now();

        var entityCollection = new EntityCollection();
        visualizer = new PointVisualizer(scene, entityCollection);

        var entity = entityCollection.add({
            position : new Cartesian3(1234, 5678, 9101112),
            point : {
                show : true,
                color : new Color(0.1, 0.2, 0.3, 0.4),
                outlineColor : new Color(0.5, 0.6, 0.7, 0.8),
                outlineWidth : 9,
                pixelSize : 10,
                scaleByDistance : new NearFarScalar(11, 12, 13, 14)
            }
        });
        var point = entity.point;

        visualizer.update(time);

        var pointPrimitiveCollection = scene.primitives.get(0);
        expect(pointPrimitiveCollection.length).toEqual(1);
        var pointPrimitive = pointPrimitiveCollection.get(0);

        expect(pointPrimitive.show).toEqual(point.show.getValue(time));
        expect(pointPrimitive.position).toEqual(entity.position.getValue(time));
        expect(pointPrimitive.scaleByDistance).toEqual(point.scaleByDistance.getValue(time));
        expect(pointPrimitive.color).toEqual(point.color.getValue(time));
        expect(pointPrimitive.outlineColor).toEqual(point.outlineColor.getValue(time));
        expect(pointPrimitive.outlineWidth).toEqual(point.outlineWidth.getValue(time));

        point.color = new Color(0.15, 0.16, 0.17, 0.18);
        point.outlineColor = new Color(0.19, 0.20, 0.21, 0.22);
        point.pixelSize = 23;
        point.outlineWidth = 24;
        point.scaleByDistance = new NearFarScalar(25, 26, 27, 28);

        visualizer.update(time);

        expect(pointPrimitive.show).toEqual(point.show.getValue(time));
        expect(pointPrimitive.position).toEqual(entity.position.getValue(time));
        expect(pointPrimitive.scaleByDistance).toEqual(point.scaleByDistance.getValue(time));
        expect(pointPrimitive.color).toEqual(point.color.getValue(time));
        expect(pointPrimitive.outlineColor).toEqual(point.outlineColor.getValue(time));
        expect(pointPrimitive.outlineWidth).toEqual(point.outlineWidth.getValue(time));

        point.show = false;
        visualizer.update(time);
        expect(pointPrimitive.show).toEqual(point.show.getValue(time));
    });

    it('Reuses primitives when hiding one and showing another', function() {
        var time = JulianDate.now();
        var entityCollection = new EntityCollection();
        visualizer = new PointVisualizer(scene, entityCollection);

        var testObject = entityCollection.getOrCreateEntity('test');
        testObject.position = new ConstantProperty(new Cartesian3(1234, 5678, 9101112));
        testObject.point = new PointGraphics();
        testObject.point.show = new ConstantProperty(true);

        visualizer.update(time);

        var pointPrimitiveCollection = scene.primitives.get(0);
        expect(pointPrimitiveCollection.length).toEqual(1);

        testObject.point.show = new ConstantProperty(false);

        visualizer.update(time);

        expect(pointPrimitiveCollection.length).toEqual(1);

        var testObject2 = entityCollection.getOrCreateEntity('test2');
        testObject2.position = new ConstantProperty(new Cartesian3(1234, 5678, 9101112));
        testObject2.point = new PointGraphics();
        testObject2.point.show = new ConstantProperty(true);

        visualizer.update(time);
        expect(pointPrimitiveCollection.length).toEqual(1);
    });

    it('clear hides pointPrimitives.', function() {
        var entityCollection = new EntityCollection();
        visualizer = new PointVisualizer(scene, entityCollection);
        var testObject = entityCollection.getOrCreateEntity('test');
        var time = JulianDate.now();

        testObject.position = new ConstantProperty(new Cartesian3(1234, 5678, 9101112));
        var point = testObject.point = new PointGraphics();
        point.show = new ConstantProperty(true);
        visualizer.update(time);

        var pointPrimitiveCollection = scene.primitives.get(0);
        expect(pointPrimitiveCollection.length).toEqual(1);
        var bb = pointPrimitiveCollection.get(0);

        visualizer.update(time);
        //Clearing won't actually remove the pointPrimitive because of the
        //internal cache used by the visualizer, instead it just hides it.
        entityCollection.removeAll();
        expect(bb.show).toEqual(false);
        expect(bb.id).toBeUndefined();
    });

    it('Visualizer sets entity property.', function() {
        var entityCollection = new EntityCollection();
        visualizer = new PointVisualizer(scene, entityCollection);

        var testObject = entityCollection.getOrCreateEntity('test');
        var time = JulianDate.now();
        var point = testObject.point = new PointGraphics();

        testObject.position = new ConstantProperty(new Cartesian3(1234, 5678, 9101112));
        point.show = new ConstantProperty(true);

        visualizer.update(time);

        var pointPrimitiveCollection = scene.primitives.get(0);
        expect(pointPrimitiveCollection.length).toEqual(1);
        var bb = pointPrimitiveCollection.get(0);
        expect(bb.id).toEqual(testObject);
    });

    it('Computes bounding sphere.', function() {
        var entityCollection = new EntityCollection();
        visualizer = new PointVisualizer(scene, entityCollection);

        var testObject = entityCollection.getOrCreateEntity('test');
        var time = JulianDate.now();
        var point = testObject.point = new PointGraphics();

        testObject.position = new ConstantProperty(new Cartesian3(1234, 5678, 9101112));
        point.show = new ConstantProperty(true);

        visualizer.update(time);

        var result = new BoundingSphere();
        var state = visualizer.getBoundingSphere(testObject, result);

        expect(state).toBe(BoundingSphereState.DONE);
        expect(result.center).toEqual(testObject.position.getValue());
        expect(result.radius).toEqual(0);
    });

    it('Fails bounding sphere for entity without pointPrimitive.', function() {
        var entityCollection = new EntityCollection();
        var testObject = entityCollection.getOrCreateEntity('test');
        visualizer = new PointVisualizer(scene, entityCollection);
        visualizer.update(JulianDate.now());
        var result = new BoundingSphere();
        var state = visualizer.getBoundingSphere(testObject, result);
        expect(state).toBe(BoundingSphereState.FAILED);
    });

    it('Compute bounding sphere throws without entity.', function() {
        var entityCollection = new EntityCollection();
        visualizer = new PointVisualizer(scene, entityCollection);
        var result = new BoundingSphere();
        expect(function() {
            visualizer.getBoundingSphere(undefined, result);
        }).toThrowDeveloperError();
    });

    it('Compute bounding sphere throws without result.', function() {
        var entityCollection = new EntityCollection();
        var testObject = entityCollection.getOrCreateEntity('test');
        visualizer = new PointVisualizer(scene, entityCollection);
        expect(function() {
            visualizer.getBoundingSphere(testObject, undefined);
        }).toThrowDeveloperError();
    });
}, 'WebGL');
