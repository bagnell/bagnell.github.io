/*global define*/
define([
        '../Core/defined',
        '../Core/destroyObject',
        '../Core/Color',
        '../Core/Event',
        '../Renderer/createShaderSource',
        '../Renderer/BlendFunction',
        '../Renderer/ClearCommand',
        '../Renderer/PixelDatatype',
        '../Renderer/PixelFormat',
        '../Shaders/AdjustTranslucentFS',
        '../Shaders/CompositeOITFS'
    ], function(
        defined,
        destroyObject,
        Color,
        Event,
        createShaderSource,
        BlendFunction,
        ClearCommand,
        PixelDatatype,
        PixelFormat,
        AdjustTranslucentFS,
        CompositeOITFS) {
    "use strict";
    /*global WebGLRenderingContext*/

    /**
     * @private
     */
    var OITResources = function(context) {
        var extensionsSupported = context.getFloatingPointTexture() && context.getDepthTexture();
        this._translucentMRTSupport = context.getDrawBuffers() && extensionsSupported;

        // We support multipass for the Chrome D3D9 backend and ES 2.0 on mobile.
        this._translucentMultipassSupport = !this._translucentMRTSupport && extensionsSupported;

        this._translucentMRTShadow = this._translucentMRTSupport;
        this._translucentMultipassShadow = this._translucentMultipassSupport;

        this._opaqueTexture = undefined;
        this._accumulationTexture = undefined;
        this._depthTexture = undefined;

        this._opaqueFBO = undefined;
        this._translucentFBO = undefined;
        this._alphaFBO = undefined;

        this._adjustTranslucentFBO = undefined;
        this._adjustAlphaFBO = undefined;

        var opaqueClearCommand = new ClearCommand();
        opaqueClearCommand.color = new Color(0.0, 0.0, 0.0, 0.0);
        opaqueClearCommand.owner = this;
        this._opaqueClearCommand = opaqueClearCommand;

        var translucentMRTClearCommand = new ClearCommand();
        translucentMRTClearCommand.color = new Color(0.0, 0.0, 0.0, 1.0);
        translucentMRTClearCommand.owner = this;
        this._translucentMRTClearCommand = translucentMRTClearCommand;

        var translucentMultipassClearCommand = new ClearCommand();
        translucentMultipassClearCommand.color = new Color(0.0, 0.0, 0.0, 0.0);
        translucentMultipassClearCommand.owner = this;
        this._translucentMultipassClearCommand = translucentMultipassClearCommand;

        var alphaClearCommand= new ClearCommand();
        alphaClearCommand.color = new Color(1.0, 1.0, 1.0, 1.0);
        alphaClearCommand.owner = this;
        this._alphaClearCommand = alphaClearCommand;

        this._translucentRenderStateCache = {};
        this._alphaRenderStateCache = {};
        this._translucentShaderCache = {};
        this._alphaShaderCache = {};

        this._compositeCommand = undefined;
        this._adjustTranslucentCommand = undefined;
        this._adjustAlphaCommand = undefined;

        this.weightFunction = 'pow(a + 0.01, 4.0) + max(1e-2, min(3.0 * 1e3, 100.0 / (1e-5 + pow(abs(z) / 10.0, 3.0) + pow(abs(z) / 200.0, 6.0))))';
        this._weightFunction = this.weightFunction;

        this.onError = new Event();
        this._errorMessage = undefined;
    };

    function destroyTextures(that) {
        that._opaqueTexture = that._opaqueTexture && that._opaqueTexture.destroy();
        that._accumulationTexture = that._accumulationTexture && that._accumulationTexture.destroy();
        that._revealageTexture = that._revealageTexture && that._revealageTexture.destroy();
        that._depthTexture = that._depthTexture && that._depthTexture.destroy();

        that._opaqueTexture = undefined;
        that._accumulationTexture = undefined;
        that._revealageTexture = undefined;
        that._depthTexture = undefined;
    }

    function destroyFramebuffers(that) {
        that._opaqueFBO = that._opaqueFBO && that._opaqueFBO.destroy();
        that._translucentFBO = that._translucentFBO && that._translucentFBO.destroy();
        that._alphaFBO = that._alphaFBO && that._alphaFBO.destroy();
        that._adjustTranslucentFBO = that._adjustTranslucentFBO && that._adjustTranslucentFBO.destroy();
        that._adjustAlphaFBO = that._adjustAlphaFBO && that._adjustAlphaFBO.destroy();

        that._opaqueFBO = undefined;
        that._translucentFBO = undefined;
        that._alphaFBO = undefined;
        that._adjustTranslucentFBO = undefined;
        that._adjustAlphaFBO = undefined;
    }

    function destroyResources(that) {
        destroyTextures(that);
        destroyFramebuffers(that);
    }

    function updateTextures(that, context, width, height) {
        destroyTextures(that);

        that._opaqueTexture = context.createTexture2D({
            width : width,
            height : height,
            pixelFormat : PixelFormat.RGB,
            pixelDatatype : PixelDatatype.UNSIGNED_BYTE
        });
        that._accumulationTexture = context.createTexture2D({
            width : width,
            height : height,
            pixelFormat : PixelFormat.RGBA,
            pixelDatatype : PixelDatatype.FLOAT
        });
        that._revealageTexture = context.createTexture2D({
            width : width,
            height : height,
            pixelFormat : PixelFormat.RGBA,
            pixelDatatype : PixelDatatype.FLOAT
        });
        that._depthTexture = context.createTexture2D({
            width : width,
            height : height,
            pixelFormat : PixelFormat.DEPTH_COMPONENT,
            pixelDatatype : PixelDatatype.UNSIGNED_SHORT
        });
    }

    function updateFramebuffers(that, context) {
        destroyFramebuffers(that);

        that._opaqueFBO = context.createFramebuffer({
            colorTextures : [that._opaqueTexture],
            depthTexture : that._depthTexture,
            destroyAttachments : false
        });

        var completeFBO = WebGLRenderingContext.FRAMEBUFFER_COMPLETE;

        // if MRT is supported, attempt to make an FBO with multiple color attachments
        if (that._translucentMRTSupport) {
            that._translucentFBO = context.createFramebuffer({
                colorTextures : [that._accumulationTexture, that._revealageTexture],
                depthTexture : that._depthTexture,
                destroyAttachments : false
            });
            that._adjustTranslucentFBO = context.createFramebuffer({
                colorTextures : [that._accumulationTexture, that._revealageTexture],
                destroyAttachments : false
            });

            if (that._translucentFBO.getStatus() !== completeFBO || that._adjustTranslucentFBO.getStatus() !== completeFBO) {
                destroyFramebuffers(that);
                that._translucentMRTSupport = false;
            }
        }

        // either MRT isn't supported or FBO creation failed, attempt multipass
        if (!that._translucentMRTSupport) {
            that._translucentFBO = context.createFramebuffer({
                colorTextures : [that._accumulationTexture],
                depthTexture : that._depthTexture,
                destroyAttachments : false
            });
            that._alphaFBO = context.createFramebuffer({
                colorTextures : [that._revealageTexture],
                depthTexture : that._depthTexture,
                destroyAttachments : false
            });
            that._adjustTranslucentFBO = context.createFramebuffer({
                colorTextures : [that._accumulationTexture],
                destroyAttachments : false
            });
            that._adjustAlphaFBO = context.createFramebuffer({
                colorTextures : [that._revealageTexture],
                destroyAttachments : false
            });

            var translucentComplete = that._translucentFBO.getStatus() === completeFBO;
            var alphaComplete = that._alphaFBO.getStatus() === completeFBO;
            var adjustTranslucentComplete = that._adjustTranslucentFBO.getStatus() === completeFBO;
            var adjustAlphaComplete = that._adjustAlphaFBO.getStatus() === completeFBO;
            if (!translucentComplete || !alphaComplete || !adjustTranslucentComplete || !adjustAlphaComplete) {
                destroyResources(that);
                that._translucentMultipassSupport = false;
            }
        }
    }

    OITResources.prototype.update = function(context) {
        if (!this.isSupported()) {
            return;
        }

        var methodChanged = this._methodChanged = this._translucentMRTSupport !== this._translucentMRTShadow || this._translucentMultipassSupport !== this._translucentMultipassShadow;
        this._translucentMRTShadow = this._translucentMRTSupport;
        this._translucentMultipassShadow = this._translucentMultipassSupport;

        var width = context.getDrawingBufferWidth();
        var height = context.getDrawingBufferHeight();

        var opaqueTexture = this._opaqueTexture;
        var textureChanged = !defined(opaqueTexture) || opaqueTexture.getWidth() !== width || opaqueTexture.getHeight() !== height;
        if (textureChanged) {
            updateTextures(this, context, width, height);
        }

        if (!defined(this._opaqueFBO) || textureChanged || methodChanged) {
            updateFramebuffers(this, context);

            // framebuffer creation failed
            if (!this.isSupported()) {
                return;
            }
        }

        var that = this;
        var fs;
        var uniformMap;

        if (!defined(this._compositeCommand) || methodChanged) {
            fs = createShaderSource({
                defines : [this._translucentMRTSupport ? 'MRT' : ''],
                sources : [CompositeOITFS]
            });

            uniformMap = {
                u_opaque : function() {
                    return that._opaqueTexture;
                },
                u_accumulation : function() {
                    return that._accumulationTexture;
                },
                u_revealage : function() {
                    return that._revealageTexture;
                }
            };
            this._compositeCommand = context.createViewportQuadCommand(fs, context.createRenderState(), uniformMap);
        }

        if (!defined(this._adjustTranslucentCommand) || methodChanged) {
            if (this._translucentMRTSupport) {
                fs = createShaderSource({
                    defines : ['MRT'],
                    sources : [AdjustTranslucentFS]
                });

                uniformMap = {
                    u_bgColor : function() {
                        return that._translucentMRTClearCommand.color;
                    },
                    u_depthTexture : function() {
                        return that._depthTexture;
                    }
                };

                this._adjustTranslucentCommand = context.createViewportQuadCommand(fs, context.createRenderState(), uniformMap);
            } else if (this._translucentMultipassSupport) {
                fs = createShaderSource({
                    sources : [AdjustTranslucentFS]
                });

                uniformMap = {
                    u_bgColor : function() {
                        return that._translucentMultipassClearCommand.color;
                    },
                    u_depthTexture : function() {
                        return that._depthTexture;
                    }
                };

                this._adjustTranslucentCommand = context.createViewportQuadCommand(fs, context.createRenderState(), uniformMap);

                uniformMap = {
                    u_bgColor : function() {
                        return that._alphaClearCommand.color;
                    },
                    u_depthTexture : function() {
                        return that._depthTexture;
                    }
                };

                this._adjustAlphaCommand = context.createViewportQuadCommand(fs, context.createRenderState(), uniformMap);
            }
        }
    };

    var translucentMRTBlend = {
        enabled : true,
        functionSourceRgb : BlendFunction.ONE,
        functionDestinationRgb : BlendFunction.ONE,
        functionSourceAlpha : BlendFunction.ZERO,
        functionDestinationAlpha : BlendFunction.ONE_MINUS_SOURCE_ALPHA
    };

    var translucentColorBlend = {
        enabled : true,
        functionSourceRgb : BlendFunction.ONE,
        functionDestinationRgb : BlendFunction.ONE,
        functionSourceAlpha : BlendFunction.ONE,
        functionDestinationAlpha : BlendFunction.ONE
    };

    var translucentAlphaBlend = {
        enabled : true,
        functionSourceRgb : BlendFunction.ZERO,
        functionDestinationRgb : BlendFunction.ONE_MINUS_SOURCE_ALPHA,
        functionSourceAlpha : BlendFunction.ZERO,
        functionDestinationAlpha : BlendFunction.ONE_MINUS_SOURCE_ALPHA
    };

    function getTranslucentRenderState(context, translucentBlending, cache, renderState, forceUpdate) {
        var translucentState = cache[renderState.id];
        if (!defined(translucentState) || forceUpdate) {
            var depthMask = renderState.depthMask;
            var blending = renderState.blending;

            renderState.depthMask = false;
            renderState.blending = translucentBlending;

            translucentState = context.createRenderState(renderState);
            cache[renderState.id] = translucentState;

            renderState.depthMask = depthMask;
            renderState.blending = blending;
        }

        return translucentState;
    }

    function getTranslucentMRTRenderState(that, context, renderState, forceUpdate) {
        return getTranslucentRenderState(context, translucentMRTBlend, that._translucentRenderStateCache, renderState, forceUpdate);
    }

    function getTranslucentColorRenderState(that, context, renderState, forceUpdate) {
        return getTranslucentRenderState(context, translucentColorBlend, that._translucentRenderStateCache, renderState, forceUpdate);
    }

    function getTranslucentAlphaRenderState(that, context, renderState, forceUpdate) {
        return getTranslucentRenderState(context, translucentAlphaBlend, that._alphaRenderStateCache, renderState, forceUpdate);
    }

    var mrtShaderSource =
        '    vec3 Ci = czm_gl_FragColor.rgb * czm_gl_FragColor.a;\n' +
        '    float ai = czm_gl_FragColor.a;\n' +
        '    float wzi = czm_alphaWeight(ai);\n' +
        '    gl_FragData[0] = vec4(Ci * wzi, ai);\n' +
        '    gl_FragData[1] = vec4(ai * wzi);\n';

    var colorShaderSource =
        '    vec3 Ci = czm_gl_FragColor.rgb * czm_gl_FragColor.a;\n' +
        '    float ai = czm_gl_FragColor.a;\n' +
        '    float wzi = czm_alphaWeight(ai);\n' +
        '    gl_FragColor = vec4(Ci, ai) * wzi;\n';

    var alphaShaderSource =
        '    float ai = czm_gl_FragColor.a;\n' +
        '    gl_FragColor = vec4(ai);\n';

    function getTranslucentShaderProgram(that, context, shaderProgram, cache, source, forceUpdate) {
        var id = shaderProgram.id;
        var shader = cache[id];
        if (!defined(shader) || forceUpdate) {
            var attributeLocations = shaderProgram._attributeLocations;
            var vs = shaderProgram.vertexShaderSource;
            var fs = shaderProgram.fragmentShaderSource;

            var weightFunction = '';
            if (defined(that.weightFunction) && that.weightFunction.length > 0) {
                weightFunction =
                    'float oit_alphaWeight(float a)\n' +
                    '{\n' +
                    '    float z;\n' +
                    '    if (czm_sceneMode != czm_sceneMode2D)\n' +
                    '    {\n' +
                    '        float x = 2.0 * (gl_FragCoord.x - czm_viewport.x) / czm_viewport.z - 1.0;\n' +
                    '        float y = 2.0 * (gl_FragCoord.y - czm_viewport.y) / czm_viewport.w - 1.0;\n' +
                    '        float z = (gl_FragCoord.z - czm_viewportTransformation[3][2]) / czm_viewportTransformation[2][2];\n' +
                    '        vec4 q = vec4(x, y, z, 1.0);\n' +
                    '        q /= gl_FragCoord.w;\n' +
                    '        z = (czm_inverseProjectionOIT * q).z;\n' +
                    '    }\n' +
                    '    else\n' +
                    '    {\n' +
                    '        z = gl_FragCoord.z * (czm_currentFrustum.y - czm_currentFrustum.x) + czm_currentFrustum.x;\n' +
                    '    }\n' +
                    '    return ' + that.weightFunction + ';\n' +
                    '}\n';
            }

            var renamedFS = fs.replace(/void\s+main\s*\(\s*(?:void)?\s*\)/g, 'void czm_translucent_main()');
            renamedFS = renamedFS.replace(/gl_FragColor/g, 'czm_gl_FragColor');
            renamedFS = renamedFS.replace(/\bdiscard\b/g, 'czm_discard = true');
            renamedFS = renamedFS.replace(/czm_phong/g, 'czm_translucentPhong');

            // Discarding the fragment in main is a workaround for ANGLE D3D9
            // shader compilation errors.
            var newSourceFS =
                (source.indexOf('gl_FragData') !== -1 ? '#extension GL_EXT_draw_buffers : enable \n' : '') +
                'vec4 czm_gl_FragColor;\n' +
                'bool czm_discard = false;\n' +
                weightFunction + '\n\n' +
                renamedFS + '\n\n' +
                'void main()\n' +
                '{\n' +
                '    czm_translucent_main();\n' +
                '    if (czm_discard)\n' +
                '    {\n' +
                '        discard;\n' +
                '    }\n' +
                source +
                '}\n';

            if (defined(that.weightFunction) && that.weightFunction.length > 0) {
                newSourceFS = newSourceFS.replace(/czm_alphaWeight/g, 'oit_alphaWeight');
            }

            shader = context.getShaderCache().getShaderProgram(vs, newSourceFS, attributeLocations);

            var valid = true;
            try {
                // force compile and link
                shader.getVertexAttributes();
            } catch (e) {
                that._errorMessage = e.message;
                valid = false;
            }

            if (!valid) {
                // try again with default weight function.
                renamedFS = fs.replace(/void\s+main\s*\(\s*(?:void)?\s*\)/g, 'void czm_translucent_main()');
                renamedFS = renamedFS.replace(/gl_FragColor/g, 'czm_gl_FragColor');
                renamedFS = renamedFS.replace(/discard/g, 'czm_discard = true');
                renamedFS = renamedFS.replace(/czm_phong/g, 'czm_translucentPhong');

                newSourceFS =
                    (source.indexOf('gl_FragData') !== -1 ? '#extension GL_EXT_draw_buffers : enable \n' : '') +
                    'vec4 czm_gl_FragColor;\n' +
                    'bool czm_discard = false;\n' +
                    'varying float v_z;\n\n' +
                    renamedFS + '\n\n' +
                    'void main()\n' +
                    '{\n' +
                    '    czm_translucent_main();\n' +
                    '    if (czm_discard)\n' +
                    '    {\n' +
                    '        discard;\n' +
                    '    }\n' +
                    source +
                    '}\n';

                shader = context.getShaderCache().getShaderProgram(vs, newSourceFS, attributeLocations);
            }
            cache[id] = shader;
        }

        return shader;
    }

    function getTranslucentMRTShaderProgram(that, context, shaderProgram, forceUpdate) {
        return getTranslucentShaderProgram(that, context, shaderProgram, that._translucentShaderCache, mrtShaderSource, forceUpdate);
    }

    function getTranslucentColorShaderProgram(that, context, shaderProgram, forceUpdate) {
        return getTranslucentShaderProgram(that, context, shaderProgram, that._translucentShaderCache, colorShaderSource, forceUpdate);
    }

    function getTranslucentAlphaShaderProgram(that, context, shaderProgram, forceUpdate) {
        return getTranslucentShaderProgram(that, context, shaderProgram, that._alphaShaderCache, alphaShaderSource, forceUpdate);
    }

    function executeTranslucentCommandsSortedMultipass(that, scene, executeFunction, passState, commands, forceUpdate) {
        var command;
        var renderState;
        var shaderProgram;
        var j;

        var context = scene._context;
        var framebuffer = passState.framebuffer;
        var length = commands.length;

        passState.framebuffer = that._adjustTranslucentFBO;
        that._adjustTranslucentCommand.execute(context, passState);
        passState.framebuffer = that._adjustAlphaFBO;
        that._adjustAlphaCommand.execute(context, passState);

        passState.framebuffer = that._translucentFBO;

        for (j = 0; j < length; ++j) {
            command = commands[j];
            renderState = getTranslucentColorRenderState(that, context, command.renderState, forceUpdate);
            shaderProgram = getTranslucentColorShaderProgram(that, context, command.shaderProgram, forceUpdate);
            executeFunction(command, scene, context, passState, renderState, shaderProgram, true);
        }


        passState.framebuffer = that._alphaFBO;

        for (j = 0; j < length; ++j) {
            command = commands[j];
            renderState = getTranslucentAlphaRenderState(that, context, command.renderState, forceUpdate);
            shaderProgram = getTranslucentAlphaShaderProgram(that, context, command.shaderProgram, forceUpdate);
            executeFunction(command, scene, context, passState, renderState, shaderProgram, true);
        }

        passState.framebuffer = framebuffer;
    }

    function executeTranslucentCommandsSortedMRT(that, scene, executeFunction, passState, commands, forceUpdate) {
        var context = scene._context;
        var framebuffer = passState.framebuffer;
        var length = commands.length;

        passState.framebuffer = that._adjustTranslucentFBO;
        that._adjustTranslucentCommand.execute(context, passState);

        passState.framebuffer = that._translucentFBO;

        for (var j = 0; j < length; ++j) {
            var command = commands[j];
            var renderState = getTranslucentMRTRenderState(that, context, command.renderState, forceUpdate);
            var shaderProgram = getTranslucentMRTShaderProgram(that, context, command.shaderProgram, forceUpdate);
            executeFunction(command, scene, context, passState, renderState, shaderProgram, true);
        }

        passState.framebuffer = framebuffer;
    }

    OITResources.prototype.executeCommands = function(scene, executeFunction, passState, commands) {
        if (!this.isSupported()) {
            return;
        }

        var forceUpdate = this._weightFunction !== this.weightFunction || this._methodChanged;
        this._weightFunction = this.weightFunction;
        this._methodChanged = false;

        if (this._translucentMRTSupport) {
            executeTranslucentCommandsSortedMRT(this, scene, executeFunction, passState, commands, forceUpdate);
            return;
        }

        executeTranslucentCommandsSortedMultipass(this, scene, executeFunction, passState, commands, forceUpdate);
    };

    OITResources.prototype.execute = function(context, passState) {
        if (!this.isSupported()) {
            return;
        }

        this._compositeCommand.execute(context, passState);
    };

    OITResources.prototype.clear = function(context, passState, clearColor) {
        if(!this.isSupported()) {
            return;
        }

        var framebuffer = passState.framebuffer;

        passState.framebuffer = this._opaqueFBO;
        Color.clone(clearColor, this._opaqueClearCommand.color);
        this._opaqueClearCommand.execute(context, passState);

        passState.framebuffer = this._translucentFBO;
        var translucentClearCommand = this._translucentMRTSupport ? this._translucentMRTClearCommand : this._translucentMultipassClearCommand;
        translucentClearCommand.execute(context, passState);

        if (this._translucentMultipassSupport) {
            passState.framebuffer = this._alphaFBO;
            this._alphaClearCommand.execute(context, passState);
        }

        passState.framebuffer = framebuffer;
    };

    OITResources.prototype.getColorFBO = function() {
        if (!this.isSupported()) {
            return undefined;
        }

        return this._opaqueFBO;
    };

    OITResources.prototype.isSupported = function() {
        return this._translucentMRTSupport || this._translucentMultipassSupport;
    };

    OITResources.prototype.isDestroyed = function() {
        return false;
    };

    OITResources.prototype.destroy = function() {
        destroyResources(this);
        if (defined(this._compositeCommand)) {
            this._compositeCommand.shaderProgram = this._compositeCommand.shaderProgram && this._compositeCommand.shaderProgram.release();
        }

        var name;
        var cache = this._translucentShaderCache;
        for (name in cache) {
            if (cache.hasOwnProperty(name) && defined(cache[name])) {
                cache[name].release();
            }
        }

        cache = this._alphaShaderCache;
        for (name in cache) {
            if (cache.hasOwnProperty(name) && defined(cache[name])) {
                cache[name].release();
            }
        }

        return destroyObject(this);
    };

    return OITResources;
});
