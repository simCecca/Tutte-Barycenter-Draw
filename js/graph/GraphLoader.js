
import { GraphFileLoader } from './GraphFileLoader.js';
import { GraphGLMFromServerLoader } from './GraphGLMFromServerLoader.js';
import { Graph } from './Graph.js';
import { Node } from './Node.js';
import { Edge } from './Edge.js';

export class GraphLoader {

    async loadEncodedFromServer(path) {
        const response = await fetch(path);
        const jsonGraph = await response.json();
        return this.loadGraph(jsonGraph);
    }

    async loadFromFile(file) {
        const jsonGraph = await new GraphFileLoader().load(file);
        return this.loadGraph(jsonGraph);
    }

    async loadGLMFromServer(path) {
        const jsonGraph = await new GraphGLMFromServerLoader().loadGML(path);
        return this.loadGraph(jsonGraph);
    }

    loadGraph(jsonEncodedGraph) {

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
            const currentEdge = new Edge(id2node.get(edge.u), id2node.get(edge.v),
                edge.label, edge.directed || jsonEncodedGraph.directed);

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