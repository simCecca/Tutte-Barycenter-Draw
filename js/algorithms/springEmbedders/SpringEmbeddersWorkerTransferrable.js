// interface ThreadData {
//     coordinatesMatrix: Float32Array;
//     positionsMatrix: Uint16Array;
//     adjMatrix: Uint16Array;
//     charge: number;
//     springStiffness: number;
//     springNaturalLength: number;
//   }

import { promiseAllOneFirst, sleep } from "../../util.js";
import { random } from "../random/random.js";
import { square } from "../square/square.js";

export class SpringEmbeddersTransferrable {
  constructor(graph, width, height, threadsNumber) {
    this.vaitUntilStructureReady = true;
    this.continuous = false;
    this.threads = []; // Array<Worker>
    this.maxIterations = null;
    this.maxExecutionTime = null;
    this.threadData = []; // Array<ThreadData>
    this.width = width;
    this.height = height;
    const threads = navigator.hardwareConcurrency - 1;
    this.threadsNumber = threadsNumber || threads;
    this.speed = 0.01;

    this.springRestLength = 10;
    this.springDampening = 0.15;
    this.charge = 150 * 150;

    this.setGraph(graph);
  }

  setProperties(properties) {
    this.speed = properties.speed || this.speed;
    this.springDampening = properties.springDampening || this.springDampening;
    this.springRestLength =
      properties.springRestLength || this.springRestLength;
    this.charge = properties.charge * properties.charge;
  }

  setGraph(graph) {
    this.graph = graph;
    if (this.graph.nodes.length > 0) {
      const boundaries = {
        minHeight: 0,
        maxHeight: this.height,
        minWidth: 0,
        maxWidth: this.width,
      };
      random.draw2d(this.graph, boundaries);

      this._createThreads();
      this._initMultiThreadStructure();
      this.vaitUntilStructureReady = false;
    }
  }

  onCanvasSizeChanged(width, height) {
    this.width = width;
    this.height = height;
  }

  computeNextPositions = async () => {
    if (this.vaitUntilStructureReady && this.threadData.length > 0) {
      return;
    }
    const nNodes = this.graph.nodes.length;
    const nNodesForEachT = Math.floor(nNodes / this.threads.length);
    let init = 0;
    const results = [];
    this.threads.forEach((thread, index) => {
      let to = (index + 1) * nNodesForEachT;
      if (index === this.threads.length - 1) {
        to = nNodes;
      }
      const {
        adjMatrix,
        positionsMatrix,
        coordinatesMatrix,
        charge,
        springNaturalLength,
        springStiffness,
      } = this.threadData[index];
      const adjMatrixB = adjMatrix.buffer,
        positionsMatrixB = positionsMatrix.buffer,
        coordinatesMatrixB = coordinatesMatrix.buffer;

      const message = {
        // MultiThProps
        charge,
        springNaturalLength,
        springStiffness,
        coordinatesMatrix: coordinatesMatrixB,
        from: init,
        to,
        threadId: index,
      };
      let buffers = [coordinatesMatrixB];
      if (positionsMatrix.length > 0 && adjMatrix.length > 0) {
        message.adjMatrix = adjMatrixB;
        message.positionsMatrix = positionsMatrixB;
        buffers = [...buffers, adjMatrixB, positionsMatrixB];
      }
      init = to;
      thread.postMessage(message, buffers);
      results.push(
        new Promise((resolve) => {
          thread.onmessage = (r) => {
            resolve(r);
          };
        })
      );
    });

    const coordinates = new Float32Array(nNodes * 2);
    // (await Promise.all(results)).forEach((result) => {
    await promiseAllOneFirst(results, (result) => {
      const { threadId, from, to, coordinates: cCoordinates } = result.data; // MultiThReturnProps
      let pos = { x: 0, y: 0 };
      new Float32Array(cCoordinates).forEach((coord, index) => {
        const nodeId = from + Math.floor(index / 2) + "";
        const coordIndex = from * 2 + index;
        coordinates[coordIndex] = coord;
        if (index % 2 != 0) {
          pos.y = coordinates[coordIndex];
          const cNode = this.graph.getNode(nodeId);

          cNode.x = pos.x;
          cNode.y = pos.y;
        } else {
          pos.x = coordinates[coordIndex];
        }
      });
    });
    this.threadData.forEach((thread) => {
      thread.coordinatesMatrix = structuredClone(coordinates);
    });
  };

  reset = () => {
    this.vaitUntilStructureReady = true;
    this.threads.forEach((thread) => {
      thread.terminate();
    });
    this.threads = []; // Array<Worker>
    this.threadData = []; // Array<ThreadData>
  };

  onRemove = () => {};

  _createThreads = () => {
    for (let i = 0; i < this.threadsNumber; i++) {
      this.threads.push(
        new Worker(
          new URL("./multithread/multiThreadTransferrable.js", import.meta.url)
        )
      );
    }
  };

  _initMultiThreadStructure = () => {
    const nodes = this.graph.nodes;
    const edges = this.graph.edges;
    // 2 for x and y and 2 for init and end position in the adjMatrix
    const coordinatesMatrix = new Float32Array(nodes.length * 2);
    const positionsMatrix = new Uint16Array(nodes.length * 2);
    const adjMatrix = new Uint16Array(edges.length * 2);
    let adjCursor = 0;
    nodes.forEach((node) => {
      const { x, y, neighbours, id } = node;
      const positions = { x, y };
      const init = Number(id) * 2;
      coordinatesMatrix[init] = positions.x;
      coordinatesMatrix[init + 1] = positions.y;
      let neigSize = 0;
      const initNeig = adjCursor;
      neighbours.forEach((neigNode) => {
        if (node.id === neigNode.id) {
          return;
        }
        adjMatrix[adjCursor] = Number(neigNode.id);
        adjCursor++;
        neigSize++;
      });
      if (neigSize === 0) {
        return;
      }
      positionsMatrix[init] = initNeig;
      positionsMatrix[init + 1] = initNeig + neigSize;
    });
    this.threads.forEach((_) => {
      this.threadData.push({
        ...structuredClone({ coordinatesMatrix, positionsMatrix, adjMatrix }),
        charge: this.charge,
        springNaturalLength: this.springRestLength,
        springStiffness: this.springDampening,
      });
    });
  };
}
