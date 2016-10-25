/*global define*/
define([
       '../Core/Color',
       '../Core/defined',
       '../Core/defineProperties'
    ], function(
        Color,
        defined,
        defineProperties) {
    'use strict';

    /**
     * @private
     */
    function Cesium3DTileStyleEngine() {
        this._style = undefined;      // The style provided by the user
        this._styleDirty = false;     // true when the style is reassigned
        this._lastStyleTime = 0;      // The "time" when the last style was assigned
    }

    defineProperties(Cesium3DTileStyleEngine.prototype, {
        style : {
            get : function() {
                return this._style;
            },
            set : function(value) {
                this._style = value;
                this._styleDirty = true;
            }
        }
    });

    Cesium3DTileStyleEngine.prototype.makeDirty = function() {
        this._styleDirty = true;
    };

    Cesium3DTileStyleEngine.prototype.applyStyle = function(tileset, frameState) {
        if (!tileset.ready) {
            return;
        }

        if (defined(this._style) && !this._style.ready) {
            return;
        }

        var styleDirty = this._styleDirty;

        if (frameState.passes.render) {
            // Don't reset until the color pass, e.g., for mouse-over picking
            this._styleDirty = false;
        }

        if (styleDirty) {
            // Increase "time", so the style is applied to all visible tiles
            ++this._lastStyleTime;
        }

        var lastStyleTime = this._lastStyleTime;
        var stats = tileset._statistics;

        // If a new style was assigned, loop through all the visible tiles; otherwise, loop through
        // only the tiles that are newly visible, i.e., they are visible this frame, but were not
        // visible last frame.  In many cases, the newly selected tiles list will be short or empty.
        var tiles = styleDirty ? tileset._selectedTiles : tileset._selectedTilesToStyle;
        // PERFORMANCE_IDEA: does mouse-over picking basically trash this?  We need to style on
        // pick, for example, because a feature's show may be false.

        var length = tiles.length;
        for (var i = 0; i < length; ++i) {
            var tile = tiles[i];
            if (tile.selected) {
                // Apply the style to this tile if it wasn't already applied because:
                //   1) the user assigned a new style to the tileset
                //   2) this tile is now visible, but it wasn't visible when the style was first assigned
                if (tile.lastStyleTime !== lastStyleTime) {
                    tile.lastStyleTime = lastStyleTime;
                    styleCompositeContent(this, tile.content, stats);

                    ++stats.numberOfTilesStyled;
                }
            }
        }
    };

    function styleCompositeContent(styleEngine, content, stats) {
        var innerContents = content.innerContents;
        if (defined(innerContents)) {
            var length = innerContents.length;
            for (var i = 0; i < length; ++i) {
                // Recurse for composites of composites
                styleCompositeContent(styleEngine, innerContents[i], stats);
            }
        } else {
            // Not a composite tile
            styleContent(styleEngine, content, stats);
        }
    }

    var scratchColor = new Color();

    function styleContent(styleEngine, content, stats) {
        var length = content.featuresLength;
        var style = styleEngine._style;

        stats.numberOfFeaturesStyled += length;

        if (!defined(style)) {
            clearStyle(content);
            return;
        }

        // PERFORMANCE_IDEA: we can create a slightly faster internal interface by directly
        // using Cesium3DTileBatchTable.  We might also be able to use less memory
        // by using reusing a batchValues array across tiles.
        for (var i = 0; i < length; ++i) {
            var feature = content.getFeature(i);
            feature.color = style.color.evaluateColor(feature, scratchColor);
            feature.show = style.show.evaluate(feature);
        }
    }

    function clearStyle(content) {
        var length = content.featuresLength;
        for (var i = 0; i < length; ++i) {
            var feature = content.getFeature(i);
            feature.show = true;
            feature.color = Color.WHITE;
        }
    }

    return Cesium3DTileStyleEngine;
});
