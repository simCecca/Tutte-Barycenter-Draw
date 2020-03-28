
class SpringEmbeddersGPUAlgorithm {

    constructor(graph, width, height){
        this._graph = null;
        this._width = width;
        this._height = height;

        this._gpu = SpringEmbeddersGPUAlgorithm._getGpuInstance();

        this._speed = 0.01;

        // Spring Embedders data
        this._springRestLength = 10
        this._springDampening = 1 / 10;
        this._charge = 150 * 150

        // GPU Data
        this._positionsTexture = null
        this._adjacencyTexture = null
        this._adjacencySize = 0;

        this._nodesTexture = null
        this._nodesSize = 0

        this._kernel = null;

        this.setGraph(graph);
    }

    setProperties(properties) {
        this._speed = properties.speed || this._speed;
        this._springDampening = properties.springDampening || this._springDampening;
        this._springRestLength = properties.springRestLength || this._springRestLength;
        this._charge = properties.charge || this._charge;
    }

    _createTexture(matrix) {
        const gpu = SpringEmbeddersGPUAlgorithm._getGpuInstance();

        let numberOfContainedElements = 1;
        
        // TODO check whether is actually an array
        numberOfContainedElements = matrix[0][0].length;
        

        const kernel = gpu.createKernel(function(matrix) {
            const row = this.thread.y;
            const col = this.thread.x;

            return matrix[row][col];
        });
        kernel.setOutput([matrix.length, matrix.length])
        kernel.setArgumentTypes({ matrix: `Array2D(${numberOfContainedElements})` })
        kernel.setPipeline(true);

        return kernel(matrix);
    }

    _createKernel() {
        const gpu = SpringEmbeddersGPUAlgorithm._getGpuInstance();
        this._kernel = gpu.createKernel(function(positionsMatrix, nodesMatrix, adjacencyMatrix, speed, restLength, dampening, charge2) {
            const row = this.thread.y;
            const col = this.thread.x;

            // position of the current node
            const pos = positionsMatrix[row][col];

           return pos;
        });
        
        this._kernel.setOutput([this._nodesSize, this._nodesSize])
        this._kernel.setConstants({
            nodesSize: this._nodesSize,
            adjacencySize: this._adjacencySize
        });
        this._kernel.setPipeline(true);
        this._kernel.setImmutable(true);
    }

    _create3dMatrix(rows, columns, depth, defaultValue) {
        const matrix = [];
        for (let row = 0; row < rows; row++) {
            const currentRow = [];
            matrix.push(currentRow);
            for (let col = 0; col < columns; col++) {
                if (depth == 1) {
                    currentRow.push(defaultValue);
                }
                else if (depth > 1) {
                    currentRow.push(Array(depth).fill(defaultValue));
                }
            }
        }

        return matrix;
    }

    _indexToMatrixCoordinates(index, rows, columns) {
        const row = Math.floor(index / rows);
        const col = index % columns;
        return [row, col];
    }

    /**
     * Creates the position, node and adjacency matrices.
     * The position matrix contains the position of the nodes.
     * The node matrix contains, for each node, the coordinates of the adjacency matrix in which
     * the list of its neighbours are stored. Each element of the node matrix also contains the number
     * of neighbours for that node.
     * The adjacency matrix contains, for each node, the list of its neigbours.
     * Given the node with index i, we can access its position using the respective matrix
     * coordinates: [i / rows, i % columns]. The same coordinates can be used to access the node matrix.
     * To access the adjacency matrix for a node you need adjacencyMatrix[nodesMatrix[i / rows, i % columns]].
     * nodes and positions matrices have size sqrt(n) x sqrt(n) where n is the number of nodes.
     * The adjacency matrix has size sqrt(m) x sqrt(m) where m is the number of edges.
     */
    _createGraphMatrices() {
        const graph = this._graph;

        // We encode N nodes in a matrix whose size is sqrt(n) x sqrt(n)
        const nodesMatrixSize = Math.ceil(Math.sqrt(graph.nodes.length));

        // for edges we should still check whther they are directed (if so multiply by 2)
        // using the number of neighbours is probably safer
        const totalNumberOfEdges = graph.nodes.map(node => node.neighbours.length).reduce((total, current) => total + current, 0);
        const adjacencyMatrixSize = Math.ceil(Math.sqrt(totalNumberOfEdges));

        // create the matrices that will hold the node and neighbor data
        // nodesMatrixSize x nodesMatrixSize x 3: we store the coordinates to the adjacencyMatrix and the number of neighbours
        const nodesMatrix = this._create3dMatrix(nodesMatrixSize, nodesMatrixSize, 3, -1);

        // adjacencyMatrixSize x adjacencyMatrixSize x 2: we store the coordinates of nodes
        const adjacencyMatrix = this._create3dMatrix(adjacencyMatrixSize, adjacencyMatrixSize, 2, -1);

        // the position matrix nodesMatrixSize x nodesMatrixSize x 2: just store x and y
        const positionsMatrix = this._create3dMatrix(nodesMatrixSize, nodesMatrixSize, 2, -1);

        let adjMatrixNextFreeSpotIndex = 0;

        for (let i = 0; i < graph.nodes.length; i++) {
            const currentNode = graph.nodes[i];

            // find the matrix coordinates of the next available spot in the adjacency matrix
            const [adjX, adjY] = this._indexToMatrixCoordinates(adjMatrixNextFreeSpotIndex, adjacencyMatrixSize, adjacencyMatrixSize);

            // find the coordinates of this node
            const [nodeX, nodeY] = this._indexToMatrixCoordinates(i, nodesMatrixSize, nodesMatrixSize);

            // the nodes matrix stores the first position of the adjacency matrix where the 
            // neighbours can be found as well as the number of neighbours
            nodesMatrix[nodeX][nodeY] = [adjX, adjY, currentNode.neighbours.length];

            // store the initial positions
            positionsMatrix[nodeX][nodeY] = [currentNode.x, currentNode.y];

            // for each neighbour, store its node matrix position in the adjacency list
            currentNode.neighbours.forEach(neighbour => {
                const [adjX, adjY] = this._indexToMatrixCoordinates(adjMatrixNextFreeSpotIndex, adjacencyMatrixSize, adjacencyMatrixSize);

                const neighbourIndex = graph.nodes.indexOf(neighbour);
                const neighbourCoords = this._indexToMatrixCoordinates(neighbourIndex, nodesMatrixSize, nodesMatrixSize);

                adjacencyMatrix[adjX][adjY] = neighbourCoords;

                adjMatrixNextFreeSpotIndex++;
            });
        }

        this._positionsTexture = this._createTexture(positionsMatrix, "Array2D");

        console.log(this._positionsTexture);
        this._adjacencyTexture = this._createTexture(adjacencyMatrix, "Array2D");
        
        this._adjacencySize = adjacencyMatrix.length;
        this._nodesTexture = this._createTexture(nodesMatrix, "Array2D");
        this._nodesSize = nodesMatrix.length;
    }

    /**
     * Sets up GPU data.
     * This method uses the current graph to create the textures
     * and the kernel used to carry out computation on the GPU.
     */
    _setUpGPU() {
        this._createGraphMatrices();
        this._createKernel();
    }

    setGraph(graph) {
        this._graph = graph;
        this._graph.nodes.forEach(node => {
            node.x = this._width / 2 + (100 * Math.random()) - 50;
            node.y = this._height / 2 + (100 * Math.random() - 50);
            node.isFixed = false;
        });

        this._setUpGPU();
    }

    onCanvasSizeChanged(width, height) {
        this._width = width;
        this._height = height;
    }

    computeNextPositions() {        
        this._positionsTexture = this._kernel(this._positionsTexture, this._nodesTexture, this._adjacencyTexture,
            this._speed, this._springRestLength, this._springDampening, this._charge * this._charge);

        const positionsMatrix = this._positionsTexture.toArray();

        const rows = this._nodesSize;
        const columns = this._nodesSize;

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < columns; col++) {
                const nodeIndex = row * rows + col;

                if (nodeIndex < this._graph.nodes.length) {
                    const node = this._graph.nodes[nodeIndex];
                    [node.x, node.y] = positionsMatrix[row][col];
                }
            }
        }
    }
}

SpringEmbeddersGPUAlgorithm._gpu = null;

SpringEmbeddersGPUAlgorithm._getGpuInstance = function() {
    if (SpringEmbeddersGPUAlgorithm._gpu === null) {
        SpringEmbeddersGPUAlgorithm._gpu = new GPU();
    }

    return SpringEmbeddersGPUAlgorithm._gpu;
}