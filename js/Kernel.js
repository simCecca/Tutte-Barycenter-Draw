/**
 * A function that is executed on the GPU.
 */
class Kernel {

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

        // TEMP
        this._inputTexture = null;
    }

    setInputNumber(name, value) {

    }

    setInputTexture(name, texture) {
        this._inputTexture = texture;
    }

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
        
        gl.bindTexture(gl.TEXTURE_2D, this._inputTexture.getTextureId());

        this._shader.use();

        gl.bindVertexArray(Kernel._getVAO());
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        gl.bindVertexArray(null);

        this._shader.stop();
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
}