//This file is automatically rebuilt by the Cesium build process.
/*global define*/
define(function() {
    'use strict';
    return "attribute vec3 currentPosition;\n\
attribute vec3 previousPosition;\n\
attribute vec3 nextPosition;\n\
attribute vec2 expandAndWidth;\n\
attribute float a_batchId;\n\
\n\
uniform mat4 u_modifiedModelView;\n\
\n\
void main()\n\
{\n\
    float expandDir = expandAndWidth.x;\n\
    float width = abs(expandAndWidth.y) + 0.5;\n\
    bool usePrev = expandAndWidth.y < 0.0;\n\
\n\
    vec4 p = u_modifiedModelView * vec4(currentPosition, 1.0);\n\
    vec4 prev = u_modifiedModelView * vec4(previousPosition, 1.0);\n\
    vec4 next = u_modifiedModelView * vec4(nextPosition, 1.0);\n\
\n\
    vec4 positionWC = getPolylineWindowCoordinatesEC(p, prev, next, expandDir, width, usePrev);\n\
    gl_Position = czm_viewportOrthographic * positionWC;\n\
}\n\
";
});