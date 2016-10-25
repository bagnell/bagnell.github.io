//This file is automatically rebuilt by the Cesium build process.
/*global define*/
define(function() {
    'use strict';
    return "#ifdef VECTOR_TILE\n\
attribute vec3 position;\n\
attribute float a_batchId;\n\
\n\
uniform mat4 u_modifiedModelViewProjection;\n\
#else\n\
attribute vec3 position3DHigh;\n\
attribute vec3 position3DLow;\n\
attribute vec4 color;\n\
attribute float batchId;\n\
#endif\n\
\n\
// emulated noperspective\n\
varying float v_WindowZ;\n\
\n\
#ifndef VECTOR_TILE\n\
varying vec4 v_color;\n\
#endif\n\
\n\
vec4 depthClampFarPlane(vec4 vertexInClipCoordinates)\n\
{\n\
    v_WindowZ = (0.5 * (vertexInClipCoordinates.z / vertexInClipCoordinates.w) + 0.5) * vertexInClipCoordinates.w;\n\
    vertexInClipCoordinates.z = min(vertexInClipCoordinates.z, vertexInClipCoordinates.w);\n\
    return vertexInClipCoordinates;\n\
}\n\
\n\
void main()\n\
{\n\
#ifdef VECTOR_TILE\n\
    gl_Position = depthClampFarPlane(u_modifiedModelViewProjection * vec4(position, 1.0));\n\
#else\n\
    v_color = color;\n\
\n\
    vec4 position = czm_computePosition();\n\
    gl_Position = depthClampFarPlane(czm_modelViewProjectionRelativeToEye * position);\n\
#endif\n\
}\n\
";
});