//This file is automatically rebuilt by the Cesium build process.
/*global define*/
define(function() {
    'use strict';
    return "#extension GL_EXT_frag_depth : enable\n\
\n\
// emulated noperspective\n\
varying float v_WindowZ;\n\
\n\
#ifdef VECTOR_TILE\n\
uniform vec4 u_highlightColor;\n\
#else\n\
varying vec4 v_color;\n\
#endif\n\
\n\
void writeDepthClampedToFarPlane()\n\
{\n\
    gl_FragDepthEXT = min(v_WindowZ * gl_FragCoord.w, 1.0);\n\
}\n\
\n\
void main(void)\n\
{\n\
#ifdef VECTOR_TILE\n\
    gl_FragColor = u_highlightColor;\n\
#else\n\
    gl_FragColor = v_color;\n\
#endif\n\
    writeDepthClampedToFarPlane();\n\
}";
});