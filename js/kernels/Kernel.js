import { Shader } from '../shaders/Shader.js';
import { gl } from '../webGL/webGL.js';

/**
 * A function that is executed on the GPU.
 */
export class Kernel {

    /**
     * Simple vertex shader used by all kernels.
     */
    static _VERTEX_SHADER = `#version 300 es

    layout (location = 0) in vec2 vPosition;
    
    void main() {
        gl_Position = vec4(vPosition, 0.0, 1.0);
    }`;

    /**
     * Vertices of a quad, used as the only mesh for rendering
     */
    static _QUAD_VERTICES = new Float32Array([
        -1.0, -1.0,
        1.0, -1.0, 
        1.0,  1.0,
        1.0,  1.0,
        -1.0,  1.0,
        -1.0, -1.0
    ]);

    /**
     * The VAO representing the rect through which rendering is performed.
     */
    static _VAO = null;

    static _getVAO() {
        if (Kernel._VAO === null) {
            // create VAO
            Kernel._VAO = gl.createVertexArray();
            gl.bindVertexArray(Kernel._VAO);

            // create VBO and buffer data in it
            const VBO = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, VBO);
            gl.bufferData(gl.ARRAY_BUFFER, Kernel._QUAD_VERTICES, gl.STATIC_DRAW);

            // setup buffer data
            gl.enableVertexAttribArray(0);
            gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

            // unbind
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
            gl.bindVertexArray(null);
        }

        return Kernel._VAO
    }

    /**
     * Creates a new kernel
     * @param {string} source glsl source code for the kernel. 
     */
    constructor(source) {
        this._outputTexture = null;
        this._shader = new Shader(Kernel._VERTEX_SHADER, source);

        this._usedTextures = new Set();
        this._uniformNameToLocation = new Map();
        this._textureNameToTextureInfo = new Map();

        this._nextFreeInputTextureSlot = 0;
    }

    _getUniformLocation(name) {
        let location = this._uniformNameToLocation.get(name);
        if (location === undefined) {
            location = this._shader.getUniformLocationFor(name);
            this._uniformNameToLocation.set(name, location);
        }

        return location;
    }

    /**
     * Sets an input numeric value.
     * @param {string} name the name of the unifrom in the shader 
     * @param {number} value the value to set
     * @param {boolean} isInteger whether this value is an integer, optional: by default this is false.
     */
    setInputNumber(name, value, isInteger) {
        isInteger = isInteger || false;
        this._shader.use();
        if (isInteger) {
            this._shader.setIntIndex(this._getUniformLocation(name), value);
        }
        else {
            this._shader.setFloatIndex(this._getUniformLocation(name), value);
        }
        this._shader.stop();
    }

    /**
     * Sets an input texture.
     * @param {string} name the name of the sampler in the the shader
     * @param {Texture} texture the texture that will be used for that sampler
     */
    setInputTexture(name, texture) {
        const textureInfo = this._textureNameToTextureInfo.get(name);
        if (textureInfo) {
            textureInfo.texture = texture;
            return;
        }

        const textureIndex = this._nextFreeInputTextureSlot;
        this._nextFreeInputTextureSlot++;

        this.setInputNumber(name, textureIndex, true);

        this._textureNameToTextureInfo.set(name, {
            index: textureIndex,
            texture: texture
        });
    }

    /**
     * Sets the texture used as the output by this kernel.
     * This texture must have useForIO set to true.
     * @param {Texture} texture 
     */
    setOutputTexture(texture) {
        this._outputTexture = texture;
    }

    /**
     * Runs this kernel.
     */
    execute() {
        if (this._outputTexture === null) {
            throw new Error("no ouput texture for this kernel");
        }

        gl.viewport(0, 0, this._outputTexture.getWidth(), this._outputTexture.getHeight());
        gl.bindFramebuffer(gl.FRAMEBUFFER, this._outputTexture.getFboId());
        
        // binds texture to their relative index
        for (let [_, {index, texture}] of this._textureNameToTextureInfo) {
            gl.activeTexture(gl.TEXTURE0 + index);
            gl.bindTexture(gl.TEXTURE_2D, texture.getTextureId());
        }

        this._shader.use();

        gl.bindVertexArray(Kernel._getVAO());
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        gl.bindVertexArray(null);

        // unbind
        this._shader.stop();
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        for (let [_, {index, texture}] of this._textureNameToTextureInfo) {
            gl.activeTexture(gl.TEXTURE0 + index);
            gl.bindTexture(gl.TEXTURE_2D, null);
        }
    }

    /**
     * Deletes this Kernel
     */
    delete() {
        this._shader.delete();
        this._shader = null;
    }
}