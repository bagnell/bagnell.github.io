/*global define*/
define([
        './Batched3DModel3DTileContent',
        './Composite3DTileContent',
        './Instanced3DModel3DTileContent',
        './PointCloud3DTileContent',
        './Tileset3DTileContent',
        './Vector3DTileContent'
    ], function(
        Batched3DModel3DTileContent,
        Composite3DTileContent,
        Instanced3DModel3DTileContent,
        PointCloud3DTileContent,
        Tileset3DTileContent,
        Vector3DTileContent) {
    'use strict';

    /**
     * Maps a tile's extension (and a tile's magic field in its header) to a new
     * content object for the tile's payload.
     *
     * @private
     */
    var Cesium3DTileContentFactory = {
        b3dm : function(tileset, tile, url) {
            return new Batched3DModel3DTileContent(tileset, tile, url);
        },
        pnts : function(tileset, tile, url) {
            return new PointCloud3DTileContent(tileset, tile, url);
        },
        i3dm : function(tileset, tile, url) {
            return new Instanced3DModel3DTileContent(tileset, tile, url);
        },
        cmpt : function(tileset, tile, url) {
            // Send in the factory in order to avoid a cyclical dependency
            return new Composite3DTileContent(tileset, tile, url, Cesium3DTileContentFactory);
        },
        vctr : function(tileset, tile, url) {
            return new Vector3DTileContent(tileset, tile, url);
        },
        json : function(tileset, tile, url) {
            return new Tileset3DTileContent(tileset, tile, url);
        }
    };

    return Cesium3DTileContentFactory;
});