export class Graph {
  constructor() {
    this.nodes = [];
    this.nodesMap = {};
    this.edges = [];
  }

  addNode(node) {
    this.nodes.push(node);
    this.nodesMap[node.id] = node;
  }

  addEdge(edge) {
    this.edges.push(edge);
  }

  getNode(id) {
    return this.nodesMap[id];
  }

  /**
   * Computes and returns an array of nodes which should
   * represent the external convex face.
   * Should this not be possible, an arbitrary set of nodes is
   * returned.
   * @param startRandom : true if the starting node should be chosen randomly, false
   *        means that the first node of the graph is chosen
   * @returns {Array} a sequence of nodes composing the external face
   */
  computeExternalFace(startRandom = true) {
    let indexFirst =
      startRandom === false ? 0 : Math.floor(Math.random() * this.nodes.length);
    let node = this.nodes[indexFirst];
    if (node === undefined) return []; // empty graph -> empty external face
    const firstNode = node;
    let prevEdge = node.rotationScheme[node.rotationScheme.length - 1];

    const alreadyVisitedIds = new Set();

    const externalFace = [];

    do {
      if (alreadyVisitedIds.has(node.id)) {
        console.error("This is not a planar triconnected graph");
        return externalFace;
      }
      alreadyVisitedIds.add(node.id);
      externalFace.push(node);

      let i = 0;
      for (i = 0; i < node.rotationScheme.length; i++)
        if (node.rotationScheme[i] === prevEdge) break;

      prevEdge = node.rotationScheme[(i + 1) % node.rotationScheme.length];
      node = node.neighbours[(i + 1) % node.rotationScheme.length];
    } while (node !== firstNode);

    return externalFace;
  }
}
