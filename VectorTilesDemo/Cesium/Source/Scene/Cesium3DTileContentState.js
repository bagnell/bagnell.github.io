/*global define*/
define([
        '../Core/freezeObject'
    ], function(
        freezeObject) {
    'use strict';

    /**
     * @private
     */
    var Cesium3DTileContentState = {
        UNLOADED : 0,   // Has never been requested
        LOADING : 1,    // Is waiting on a pending request
        PROCESSING : 2, // Request received.  Contents are being processed for rendering.  Depending on the content, it might make its own requests for external data.
        READY : 3,      // Ready to render.
        FAILED : 4      // Request failed.
    };

    return freezeObject(Cesium3DTileContentState);
});