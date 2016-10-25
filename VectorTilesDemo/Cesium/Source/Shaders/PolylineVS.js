//This file is automatically rebuilt by the Cesium build process.
/*global define*/
define(function() {
    'use strict';
    return "attribute vec3 position3DHigh;\n\
attribute vec3 position3DLow;\n\
attribute vec3 position2DHigh;\n\
attribute vec3 position2DLow;\n\
attribute vec3 prevPosition3DHigh;\n\
attribute vec3 prevPosition3DLow;\n\
attribute vec3 prevPosition2DHigh;\n\
attribute vec3 prevPosition2DLow;\n\
attribute vec3 nextPosition3DHigh;\n\
attribute vec3 nextPosition3DLow;\n\
attribute vec3 nextPosition2DHigh;\n\
attribute vec3 nextPosition2DLow;\n\
attribute vec4 texCoordExpandAndBatchIndex;\n\
\n\
varying vec2  v_st;\n\
varying float v_width;\n\
varying vec4  czm_pickColor;\n\
\n\
void main() \n\
{\n\
    float texCoord = texCoordExpandAndBatchIndex.x;\n\
    float expandDir = texCoordExpandAndBatchIndex.y;\n\
    bool usePrev = texCoordExpandAndBatchIndex.z < 0.0;\n\
    float batchTableIndex = texCoordExpandAndBatchIndex.w;\n\
\n\
    vec2 widthAndShow = batchTable_getWidthAndShow(batchTableIndex);\n\
    float width = widthAndShow.x + 0.5;\n\
    float show = widthAndShow.y;\n\
\n\
    if (width < 1.0)\n\
    {\n\
        show = 0.0;\n\
    }\n\
\n\
    vec4 pickColor = batchTable_getPickColor(batchTableIndex);\n\
    \n\
    vec4 p, prev, next;\n\
    if (czm_morphTime == 1.0)\n\
    {\n\
        p = czm_translateRelativeToEye(position3DHigh.xyz, position3DLow.xyz);\n\
        prev = czm_translateRelativeToEye(prevPosition3DHigh.xyz, prevPosition3DLow.xyz);\n\
        next = czm_translateRelativeToEye(nextPosition3DHigh.xyz, nextPosition3DLow.xyz);\n\
    }\n\
    else if (czm_morphTime == 0.0)\n\
    {\n\
        p = czm_translateRelativeToEye(position2DHigh.zxy, position2DLow.zxy);\n\
        prev = czm_translateRelativeToEye(prevPosition2DHigh.zxy, prevPosition2DLow.zxy);\n\
        next = czm_translateRelativeToEye(nextPosition2DHigh.zxy, nextPosition2DLow.zxy);\n\
    }\n\
    else\n\
    {\n\
        p = czm_columbusViewMorph(\n\
                czm_translateRelativeToEye(position2DHigh.zxy, position2DLow.zxy),\n\
                czm_translateRelativeToEye(position3DHigh.xyz, position3DLow.xyz),\n\
                czm_morphTime);\n\
        prev = czm_columbusViewMorph(\n\
                czm_translateRelativeToEye(prevPosition2DHigh.zxy, prevPosition2DLow.zxy),\n\
                czm_translateRelativeToEye(prevPosition3DHigh.xyz, prevPosition3DLow.xyz),\n\
                czm_morphTime);\n\
        next = czm_columbusViewMorph(\n\
                czm_translateRelativeToEye(nextPosition2DHigh.zxy, nextPosition2DLow.zxy),\n\
                czm_translateRelativeToEye(nextPosition3DHigh.xyz, nextPosition3DLow.xyz),\n\
                czm_morphTime);\n\
    }\n\
    \n\
    vec4 positionWC = getPolylineWindowCoordinates(p, prev, next, expandDir, width, usePrev);\n\
    gl_Position = czm_viewportOrthographic * positionWC * show;\n\
    \n\
    v_st = vec2(texCoord, clamp(expandDir, 0.0, 1.0));\n\
    v_width = width;\n\
    czm_pickColor = pickColor;\n\
}\n\
";
});