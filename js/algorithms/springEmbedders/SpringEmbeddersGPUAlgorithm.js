import { SpringEmbeddersKernel } from "../../kernels/SpringEmbeddersKernel.js";
import { Texture } from "../../kernels/Texture.js";

export class SpringEmbeddersGPUAlgorithm {
  constructor(graph, width, height) {
    this._graph = null;
    this._width = width;
    this._height = height;

    this._properties = {
      speed: 0.01,
      springRestLength: 10,
      springDampening: 0.15,
      charge: 150 * 150,
    };

    // GPU Data
    this._positionsTexture = null;
    this._outputTexture = null;
    this._adjacencyTexture = null;
    this._nodesTexture = null;

    this._kernel = new SpringEmbeddersKernel();
    this._kernel.setProperties(this._properties);

    this.setGraph(graph);
  }

  /**
   * Sets the properties of this spring embedder algorithm.
   * @param {object} properties an object that can contain the following optional fields:
   *        speed: the speed of the algorithm, springDampening: k in Hook's law,
   *        springRestLength: the length of the spring in a state of equilibrium,
   *        charge: Ke * Q1 in Coulomb's law (Q2 = Q1).
   */
  setProperties(properties) {
    this._properties.speed = properties.speed || this._properties.speed;
    this._properties.springDampening =
      properties.springDampening || this._properties.springDampening;
    this._properties.springRestLength =
      properties.springRestLength || this._properties.springRestLength;
    this._properties.charge = properties.charge || this._properties.charge;

    this._kernel.setProperties(this._properties);
  }

  _indexToMatrixCoordinates(index, rows, columns) {
    const row = Math.floor(index / rows);
    const col = index % columns;
    return [col, row];
  }

  /**
   * Creates the position, node and adjacency matrices.
   * The position matrix contains the position of the nodes.
   * The node matrix contains, for each node, the coordinates of the adjacency matrix in which
   * the list of its neighbours are stored. Each element of the node matrix also contains the number
   * of neighbours for that node.
   * The adjacency matrix contains, for each node, the list of its neigbours.
   * Given the node with index i, we can access its position using the respective matrix
   * coordinates: [i % columns, i / rows]. The same coordinates can be used to access the node matrix.
   * nodes and positions matrices have size sqrt(n) x sqrt(n) where n is the number of nodes.
   * The adjacency matrix has size sqrt(m) x sqrt(m) where m is the number of edges.
   */
  _createGraphTextures() {
    const graph = this._graph;

    // We encode N nodes in a matrix whose size is sqrt(n) x sqrt(n)
    const nodesMatrixSize = Math.ceil(Math.sqrt(graph.nodes.length));

    // for edges we should still check whther they are directed (if so multiply by 2)
    // using the number of neighbours is probably safer
    const totalNumberOfEdges = graph.nodes
      .map((node) => node.neighbours.length)
      .reduce((total, current) => total + current, 0);
    const adjacencyMatrixSize = Math.ceil(Math.sqrt(totalNumberOfEdges));

    // nodesMatrixSize * nodesMatrixSize * 4 for each node we store the x and y coords of the
    // adj matrix and the number of nodes (the extra value is useless but 4 values textures are usually faster
    // than 3 values counterparts: https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices).
    const nodesMatrix = new Uint16Array(nodesMatrixSize * nodesMatrixSize * 4);

    // adjacencyMatrixSize x adjacencyMatrixSize x 2: we store the coordinates of nodes
    const adjacencyMatrix = new Uint8Array(
      adjacencyMatrixSize * adjacencyMatrixSize * 2
    );

    // the position matrix nodesMatrixSize x nodesMatrixSize x 2: just store x and y
    const positionsMatrix = new Float32Array(
      nodesMatrixSize * nodesMatrixSize * 2
    );
    positionsMatrix.fill(-10000.0); // a default value that should not interfere with valid nodes

    let adjMatrixNextFreeSpotIndex = 0;
    let adjacencyMatrixInsertIndex = 0;

    for (let i = 0; i < graph.nodes.length; i++) {
      const currentNode = graph.nodes[i];
      const currentNodeIndex = i * 4;
      const currentNodePositionIndex = i * 2;

      // find the matrix coordinates of the next available spot in the adjacency matrix
      const [adjX, adjY] = this._indexToMatrixCoordinates(
        adjMatrixNextFreeSpotIndex,
        adjacencyMatrixSize,
        adjacencyMatrixSize
      );

      // the nodes matrix stores the first position of the adjacency matrix where the
      // neighbours can be found as well as the number of neighbours
      nodesMatrix.set(
        [adjX, adjY, currentNode.neighbours.length, 0],
        currentNodeIndex
      );

      // store the initial positions
      positionsMatrix.set(
        [currentNode.x, currentNode.y],
        currentNodePositionIndex
      );

      // for each neighbour, store its node matrix position in the adjacency list
      currentNode.neighbours.forEach((neighbour) => {
        const neighbourIndex = graph.nodes.indexOf(neighbour);
        const neighbourCoords = this._indexToMatrixCoordinates(
          neighbourIndex,
          nodesMatrixSize,
          nodesMatrixSize
        );

        adjacencyMatrix.set(neighbourCoords, adjacencyMatrixInsertIndex);

        adjMatrixNextFreeSpotIndex += 1;
        adjacencyMatrixInsertIndex += 2;
      });
    }

    this._positionsTexture = Texture.createTextureFloat32_2(
      nodesMatrixSize,
      nodesMatrixSize,
      positionsMatrix,
      true
    );
    this._outputTexture = Texture.createTextureFloat32_2(
      nodesMatrixSize,
      nodesMatrixSize,
      positionsMatrix,
      true
    );
    this._adjacencyTexture = Texture.createTextureUint8_2(
      adjacencyMatrixSize,
      adjacencyMatrixSize,
      adjacencyMatrix,
      false
    );
    this._nodesTexture = Texture.createTextureUint16_4(
      nodesMatrixSize,
      nodesMatrixSize,
      nodesMatrix,
      false
    );

    this._kernel.setInputTexture("nodes", this._nodesTexture);
    this._kernel.setInputTexture("adjacency", this._adjacencyTexture);
  }

  setGraph(graph) {
    this._graph = graph;

    // an empty graph requires the creation of an empty FBO, which is impossible
    if (this._graph.nodes.length === 0) {
      return;
    }

    this._graph.nodes.forEach((node) => {
      node.x = this._width / 2 + (300 * Math.random() - 150);
      node.y = this._height / 2 + (300 * Math.random() - 150);

      node.isFixed = false;
    });

    this._createGraphTextures();
  }

  onCanvasSizeChanged(width, height) {
    this.width = width;
    this.height = height;
  }

  computeNextPositions() {
    this._kernel.setInputTexture("positions", this._positionsTexture);
    this._kernel.setOutputTexture(this._outputTexture);

    this._kernel.execute();

    const renderer = ctrl.renderer;

    if (renderer.supportsDirectRendering()) {
      // algorithms support reading nodes positions from texture
      ctrl.renderer.setPositionsTexture(this._outputTexture);
    } else {
      const positions = this._outputTexture.getData();
      for (let i = 0; i < this._graph.nodes.length; i++) {
        const node = this._graph.nodes[i];
        if (!node.isFixed) {
          [node.x, node.y] = [positions[i * 2], positions[i * 2 + 1]];
        } else {
          // fixed node, its position cannot change and the texture must be updated
          [positions[i * 2], positions[i * 2 + 1]] = [node.x, node.y];
          this._outputTexture.updateData(positions);
        }
      }
    }

    // swap input and output
    [this._positionsTexture, this._outputTexture] = [
      this._outputTexture,
      this._positionsTexture,
    ];
  }

  onRemove() {
    this._kernel.delete();
    this._kernel = null;
    if (this._nodesTexture === null) {
      return; // texture not set, cannot delete
    }
    this._nodesTexture.delete();
    this._nodesTexture = null;
    this._outputTexture.delete();
    this._outputTexture = null;
    this._positionsTexture.delete();
    this._positionsTexture = null;
    this._adjacencyTexture.delete();
    this._adjacencyTexture = null;
  }
}
