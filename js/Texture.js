/**
 * A buffer for exchanging data with the GPU.
 */
class Texture {
    /**
     * Creates a Texture that, for each pixel, contains 4 Uint8.
     * This version should be preferred to other Uint8 textures as
     * textures with less channels are usually less performant
     * (https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices)
     * @param {number} width the width of the texture
     * @param {number} height the height of the texture
     * @param {Uint8Array} data the data to store in the texture
     * @param {boolean} useForIO whether this texture will be used as an output
     */
    static createTextureUint8_4(width, height, data, useForIO) {
        if (width * height * 4 != data.length) {
            throw new Error("Wrong width and height for the supplied data");
        }

        return new Texture(width, height, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, data, useForIO);
    }

    /**
     * 
     * @param {number} width the width of the texture 
     * @param {number} height the height of the texture
     * @param {Float32Array} data the data to store in the texture
     * @param {boolean} useForIO whether this texture will be used as an output
     */
    static createTextureFloat16_4(width, height, data, useForIO) {
        if (width * height * 4 != data.length) {
            throw new Error("Wrong width and height for the supplied data");
        }

        return new Texture(width, height, gl.RGBA16F, gl.RGBA, gl.FLOAT, data, useForIO);
    }

    /**
     * 
     * @param {number} width the width of the texture 
     * @param {number} height the height of the texture
     * @param {Float32Array} data the data to store in the texture
     * @param {boolean} useForIO whether this texture will be used as an output
     */
    static createTextureFloat32_4(width, height, data, useForIO) {
        if (width * height * 4 != data.length) {
            throw new Error("Wrong width and height for the supplied data");
        }

        return new Texture(width, height, gl.RGBA32F, gl.RGBA, gl.FLOAT, data, useForIO);
    }

    /**
     * Creates a new texture.
     * @param {number} width the width of the texture
     * @param {number} height the height of the texture
     * @param {number} internalFormat the internal format of the texture, how data will be stored inside the texture
     * @param {number} dataFormat the format of the data from which the texture is created
     * @param {number} dataType the type of the data from which the texture is created
     * @param {*} data an array of data. The type of array depends on the previous types
     * @param {boolean} useForIO whether this texture will be used as an output
     */
    constructor(width, height, internalFormat, dataFormat, dataType, data, useForIO) {
        this._width = width;
        this._height = height;

        this._dataPerPixel = data.length / (this._width * this._height);

        this._internalFormat = internalFormat;
        this._dataFormat = dataFormat;
        this._dataType = dataType;
        this._useForIO = useForIO;

        this._texture = null;
        this._fbo = null;

        this._dataArrayType = data.constructor;

        this._createTexture(data);
        if (this._useForIO) {
            this._createFBO();
        }
    }

    _createTexture(data) {
        this._texture = gl.createTexture();

        gl.bindTexture(gl.TEXTURE_2D, this._texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, this._internalFormat, this._width, this._height, 0, this._dataFormat, this._dataType, data);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

        gl.bindTexture(gl.TEXTURE_2D, null);
    }

    _createFBO() {
        this._fbo = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this._fbo);
        
        // attach the texture to this buffer
        gl.framebufferTexture2D(
                gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0,
                gl.TEXTURE_2D, this._texture, 0);

        const status = (gl.checkFramebufferStatus(gl.FRAMEBUFFER) == gl.FRAMEBUFFER_COMPLETE);
        if (!status) {
            throw Error("Framebuffer cannot be completed");
        }

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    /**
     * @returns {*} the data contained in this Texture
     */
    getData() {
        const outData = new this._dataArrayType(this._width * this._height * this._dataPerPixel);
        gl.bindFramebuffer(gl.FRAMEBUFFER, this._fbo);
        gl.readBuffer(gl.COLOR_ATTACHMENT0);
        gl.readPixels(0, 0, this._width, this._height, this._dataFormat, this._dataType, outData);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        return outData;
    }

    /**
     * Updates the data contained in this texture
     * @param {*} data an array of data. Should match the type of the texture.
     */
    updateData(data) {
        gl.bindTexture(gl.TEXTURE_2D, this._texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, this._internalFormat, width, height, 0, this._dataFormat, this._dataType, data);
        gl.bindTexture(gl.TEXTURE_2D, null);
    }

    /**
     * Deletes the texture.
     */
    delete() {
        gl.deleteTexture(this._texture);
        gl.deleteFramebuffer(this._fbo);

        this._texture = null;
        this._fbo = null;
    }
}