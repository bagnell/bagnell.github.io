/*global define*/
define([
           '../Core/defaultValue',
           '../Core/defined',
           '../Core/destroyObject',
           '../Core/DeveloperError',
           '../Core/Math',
           '../Core/Matrix3',
           '../Core/Quaternion'
       ], function(
           defaultValue,
           defined,
           destroyObject,
           DeveloperError,
           CesiumMath,
           Matrix3,
           Quaternion) {
    "use strict";

    function DeviceOrientationCameraController(scene) {
        //>>includeStart('debug', pragmas.debug);
        if (!defined(scene)) {
            throw new DeveloperError('scene is required.');
        }
        //>>includeEnd('debug');

        this._scene = scene;

        this._lastAlpha = undefined;
        this._lastBeta = undefined;
        this._lastGamma = undefined;

        this._alpha = undefined;
        this._beta = undefined;
        this._gamma = undefined;

        var that = this;
        function callback(e) {
            /*
            var eAlpha = CesiumMath.toRadians(defaultValue(e.alpha, 0.0));
            var eBeta = CesiumMath.toRadians(defaultValue(e.beta, 0.0));
            var eGamma = CesiumMath.toRadians(defaultValue(e.gamma, 0.0));

            if (!defined(that._alpha)) {
                that._alpha = eAlpha;
                that._beta = eBeta;
                that._gamma = eGamma;
            }

            var a = that._alpha - eAlpha;
            var b = that._beta - eBeta;
            var g = that._gamma - eGamma;

            rotate(scene.camera, -a, b, g);

            that._alpha = eAlpha;
            that._beta = eBeta;
            that._gamma = eGamma;
            */

            that._alpha = CesiumMath.toRadians(defaultValue(e.alpha, 0.0));
            that._beta = CesiumMath.toRadians(defaultValue(e.beta, 0.0));
            that._gamma = CesiumMath.toRadians(defaultValue(e.gamma, 0.0));
        }

        window.addEventListener('deviceorientation', callback, false);

        this._removeListener = function() {
            window.removeEventListener('deviceorientation', callback, false);
        };
    }

    var scratchQuaternion1 = new Quaternion();
    var scratchQuaternion2 = new Quaternion();
    var scratchMatrix3 = new Matrix3();

    function rotate(camera, alpha, beta, gamma) {
        var direction = camera.direction;
        var right = camera.right;
        var up = camera.up;

        var bQuat = Quaternion.fromAxisAngle(direction, beta, scratchQuaternion2);
        var gQuat = Quaternion.fromAxisAngle(right, gamma, scratchQuaternion1);

        var rotQuat = Quaternion.multiply(gQuat, bQuat, gQuat);

        var aQuat = Quaternion.fromAxisAngle(up, alpha, scratchQuaternion2);
        Quaternion.multiply(aQuat, rotQuat, rotQuat);

        var matrix = Matrix3.fromQuaternion(rotQuat, scratchMatrix3);
        Matrix3.multiplyByVector(matrix, right, right);
        Matrix3.multiplyByVector(matrix, up, up);
        Matrix3.multiplyByVector(matrix, direction, direction);
    }

    DeviceOrientationCameraController.prototype.update = function() {
        if (!defined(this._lastAlpha)) {
            this._lastAlpha = this._alpha;
            this._lastBeta = this._beta;
            this._lastGamma = this._gamma;
        }

        var a = this._alpha - this._lastAlpha;
        var b = this._beta - this._lastBeta;
        var g = this._gamma - this._lastGamma;

        rotate(this._scene.camera, -a, b, g);

        this._lastAlpha = this._alpha;
        this._lastBeta = this._beta;
        this._lastGamma = this._gamma;
    };

    DeviceOrientationCameraController.prototype.isDestroyed = function() {
        return false;
    };

    DeviceOrientationCameraController.prototype.destroy = function() {
        this._removeListener();
        return destroyObject(this);
    };

    return DeviceOrientationCameraController;
});