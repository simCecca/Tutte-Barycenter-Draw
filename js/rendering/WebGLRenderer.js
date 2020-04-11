
class WebGLRenderer {

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

    constructor() {
        document.getElementById("canvas").style.display = "block";
        document.getElementById("canvas").classList.add("fullscreenCanvas");

        this._graph = null;

        this._width = 0;
        this._height = 0;

        /** A texture that contains the positions of the nodes */
        this._positionsTexture = null;

        /** VAO for nodes */
        this._circleVAO = null;

        /** VAO for edges */
        this._lineVAO = null;
        
        // so that they can be easily removed
        this._VBOs = [];

        this._circleShader = new CircleShader();
    }

    /**
     * Creates a VBO
     */
    _createVBO(data, dataPerUnit, type, stride, offset, attribute, useForInstance) {
        const vbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

        gl.enableVertexAttribArray(attribute);
        gl.vertexAttribPointer(attribute, dataPerUnit, type, false, stride, offset);

        if (useForInstance === true) {
            gl.vertexAttribDivisor(1, 1);
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        return vbo;
    }

    _indexToMatrixCoordinates(index, rows, columns) {
        const row = Math.floor(index / rows);
        const col = index % columns;
        return [col, row];
    }

    _createCircleVAO() {
        const positionsMatrixSize = Math.ceil(Math.sqrt(this._graph.nodes.length));

        // build the buffer containing, for every node instance
        // the coordinates in the positions texture (see kernel)
        // from which the position of the node should be read.
        const positionsTextureNodeCoords = new Uint8Array(this._graph.nodes.length * 2); // x y for each node

        this._graph.nodes.forEach((node, i) => {
            const coords = this._indexToMatrixCoordinates(i, positionsMatrixSize, positionsMatrixSize);

            positionsTextureNodeCoords.set(coords, i * 2);
        });

        this._circleVAO = gl.createVertexArray();
        gl.bindVertexArray(this._circleVAO);

        // puts the vertex coordinates of the quad in vertex attrib 0
        const quadVBO = this._createVBO(WebGLRenderer._QUAD_VERTICES, 2, gl.FLOAT, 0, 0, 0, false);

        // puts the coordinates where the shader can retrieve the node position
        // fom the positions texture into vertex attrib 1
        //const posTextureVBO = this._createVBO(positionsTextureNodeCoords, 2, gl.UNSIGNED_BYTE, 0, 0, 1, true);

        gl.bindVertexArray(null);

        this._VBOs.push(quadVBO);
        //this._VBOs.push(posTextureVBO);
    }

    onRemove() {
        console.log("called")
        document.getElementById("canvas").classList.remove("fullscreenCanvas");
        document.getElementById("canvas").style.display = "none";
    }

    setRenderNodeLabels(value) {
        // not implemented
    }

    setRenderEdgeLabels(value) {
        // not implemented
    }

    setGraph(graph) {
        this._graph = graph;

        this._createCircleVAO();
    }

    setSize(w, g) {
        const { width, height } = document.getElementById("canvas").getBoundingClientRect();

        this._width = width;


        console.log(width, height);

        this._height = height;
        const clipMatrix = mat3.fromValues(2.0 / width, 0.0, 0.0,
                                            0.0, 2.0 / -height, 0.0,
                                            -1.0, 1.0, 1.0);

        this._circleShader.use();
        //this._circleShader.setMat3("clipMatrix", clipMatrix);
        this._circleShader.stop();
    }

    setPositionsTexture(texture) {
        this._positionsTexture = texture;
    }

    _renderNodes() {
        this._circleShader.use();
        gl.bindVertexArray(this._circleVAO);

        gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, this._graph.nodes.length);

        gl.bindVertexArray(null);
        this._circleShader.stop();
    }

    _renderEdges() {

    }

    render() {
        /*if (this._positionsTexture === null) {
            throw new Error("oh sheeet");
        }*/
        gl.viewport(0, 0,
            gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.clearColor(1.0, 1.0, 1.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        // bind position texture

        this._renderEdges();
        this._renderNodes();
    }
}
