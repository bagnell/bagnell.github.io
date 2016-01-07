/*global define*/
define([
           '../../Core/defaultValue',
           '../../Core/defined',
           '../../Core/defineProperties',
           '../../Core/destroyObject',
           '../../Core/DeveloperError',
           '../../Core/Fullscreen',
           '../../ThirdParty/knockout',
           '../../ThirdParty/NoSleep',
           '../createCommand',
           '../getElement'
       ], function(
    defaultValue,
    defined,
    defineProperties,
    destroyObject,
    DeveloperError,
    Fullscreen,
    knockout,
    NoSleep,
    createCommand,
    getElement) {
    "use strict";

    function VRButtonViewModel(vrElement, scene) {
        var that = this;

        var tmpIsFullscreen = knockout.observable(Fullscreen.fullscreen);
        var tmpIsEnabled = knockout.observable(Fullscreen.enabled);

        /**
         * Gets whether or not VR mode is active.  This property is observable.
         *
         * @type {Boolean}
         */
        this.isVRMode = undefined;
        knockout.defineProperty(this, 'isVRMode', {
            get : function() {
                return tmpIsFullscreen();
            }
        });

        /**
         * Gets or sets whether or not VR functionality should be enabled.  This property is observable.
         *
         * @type {Boolean}
         * @see Fullscreen.enabled
         */
        this.isVREnabled = undefined;
        knockout.defineProperty(this, 'isVREnabled', {
            get : function() {
                return tmpIsEnabled();
            },
            set : function(value) {
                tmpIsEnabled(value && Fullscreen.enabled);
            }
        });

        /**
         * Gets the tooltip.  This property is observable.
         *
         * @type {String}
         */
        this.tooltip = undefined;
        knockout.defineProperty(this, 'tooltip', function() {
            if (!this.isFullscreenEnabled) {
                return 'VR mode is unavailable';
            }
            return tmpIsFullscreen() ? 'Exit VR mode' : 'Enter VR mode';
        });

        this._locked = false;
        this._lockOrientation = undefined;
        this._unlockOrientation = undefined;

        var screen = window.screen;
        if (defined(screen)) {
            this._lockOrientation = screen.lockOrientation || screen.mozLockOrientation || screen.msLockOrientation || (screen.orientation && screen.orientation.lock);
            this._unlockOrientation = screen.unlockOrientation || screen.mozUnlockOrientation || screen.msUnlockOrientation || (screen.orientation && screen.orientation.unlock);
        }

        this._noSleep = new NoSleep();

        this._command = createCommand(function() {
            if (Fullscreen.fullscreen) {
                scene.useWebVR = false;
                if (that._locked) {
                    that._unlockOrientation();
                }
                that._noSleep.disable();
                Fullscreen.exitFullscreen();
            } else {
                Fullscreen.requestFullscreen(that._vrElement);
                that._noSleep.enable();
                if (defined(that._lockOrientation) && !that._locked) {
                    //that._locked = that._lockOrientation('landscape');
                }
                scene.useWebVR = true;
            }
        }, knockout.getObservable(this, 'isVREnabled'));

        this._vrElement = defaultValue(getElement(vrElement), document.body);
    }

    defineProperties(VRButtonViewModel.prototype, {
        /**
         * Gets or sets the HTML element to place into VR mode when the
         * corresponding button is pressed.
         * @memberof VRButtonViewModel.prototype
         *
         * @type {Element}
         */
        vrElement : {
            //TODO:@exception {DeveloperError} value must be a valid HTML Element.
            get : function() {
                return this._vrElement;
            },
            set : function(value) {
                //>>includeStart('debug', pragmas.debug);
                if (!(value instanceof Element)) {
                    throw new DeveloperError('value must be a valid Element.');
                }
                //>>includeEnd('debug');

                this._vrElement = value;
            }
        },

        /**
         * Gets the Command to toggle VR mode.
         * @memberof VRButtonViewModel.prototype
         *
         * @type {Command}
         */
        command : {
            get : function() {
                return this._command;
            }
        }
    });

    /**
     * @returns {Boolean} true if the object has been destroyed, false otherwise.
     */
    VRButtonViewModel.prototype.isDestroyed = function() {
        return false;
    };

    /**
     * Destroys the view model.  Should be called to
     * properly clean up the view model when it is no longer needed.
     */
    VRButtonViewModel.prototype.destroy = function() {
        destroyObject(this);
    };

    return VRButtonViewModel;
});