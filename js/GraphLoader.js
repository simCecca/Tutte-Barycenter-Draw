
class GraphLoader {

    async _fetchGraphJSON(path) {
        const response = await fetch(path);

        const result = await response.json();

        return new Promise(resolve => resolve(result));
    }

    async loadGraph(path) {
        const jsonEncodedGraph = await this._fetchGraphJSON(path);

        const graph = new Graph();

        const id2node = new Map();
        jsonEncodedGraph.nodes.forEach(node => {
            const id = node.id;
            const label = node.label;

            const createdNode = new Node(id, label);
            createdNode.rotationScheme = node.rotationScheme;
            id2node.set(id, createdNode);

        });

        const edgeId2edge = new Map();
        jsonEncodedGraph.edges.forEach(edge => {
            const currentEdge = new Edge(id2node.get(edge.u), id2node.get(edge.v), edge.directed);
            graph.addEdge(currentEdge);
            edgeId2edge.set(edge.id, edge);
        });

        id2node.forEach(node => {
           node.rotationScheme.forEach(edgeId => {
               const edge = edgeId2edge.get(edgeId);

               let neighbour = edge.u !== node.id ? id2node.get(edge.u) : id2node.get(edge.v);

               node.addNeighbour(neighbour);
           });

           graph.addNode(node);

        });

        return graph;

    }

}