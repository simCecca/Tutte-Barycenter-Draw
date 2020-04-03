
/**
 * Shader util class. Used to create shaders.
 * 
 * Some parts of this code are taken from webgl2fundamentals.org
 */
class Shader {
    /**
     * Creates and compiles a shader.
     * @param {string} shaderSource The GLSL source code for the shader.
     * @param {number} shaderType The type of shader, VERTEX_SHADER or
     *     FRAGMENT_SHADER.
     * @return {!WebGLShader} The shader.
     */
    _compileShader(shaderSource, shaderType) {
        // Create the shader object
        const shader = gl.createShader(shaderType);

        // Set the shader source code.
        gl.shaderSource(shader, shaderSource);

        // Compile the shader
        gl.compileShader(shader);

        // Check if it compiled
        const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
        if (!success) {
            // Something went wrong during compilation; get the error
            throw "could not compile shader:" + gl.getShaderInfoLog(shader);
        }

        return shader;
    }

    /**
     * Creates a program from 2 shaders.
     * @param {!WebGLShader} vertexShader A vertex shader.
     * @param {!WebGLShader} fragmentShader A fragment shader.
     * @return {!WebGLProgram} A program.
     */
    _createProgram(vertexShader, fragmentShader) {
        // create a program.
        const program = gl.createProgram();
        
        // attach the shaders.
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        
        // link the program.
        gl.linkProgram(program);
        
        // Check if it linked.
        const success = gl.getProgramParameter(program, gl.LINK_STATUS);
        if (!success) {
            // something went wrong with the link
            throw ("program filed to link:" + gl.getProgramInfoLog (program));
        }
        
        return program;
    };

    /**
     * Creates a new shader.
     * @param {string} vertexShaderSource the code for the vertex shader
     * @param {string} fragmentShaderCode the code for the fragment shader
     */
    constructor(vertexShaderSource, fragmentShaderCode) {
        const vertexShader = this._compileShader(vertexShaderSource, gl.VERTEX_SHADER);
        const fragmentShader = this._compileShader(fragmentShaderCode, gl.FRAGMENT_SHADER);
        this._program = this._createProgram(vertexShader, fragmentShader);
    }

    /**
     * Sets this shader as the current one.
     */
    use() {
        gl.useProgram(this._program);
    }

    /**
     * This shader is no longer the current one.
     */
    stop() {
        gl.useProgram(null);
    }
}