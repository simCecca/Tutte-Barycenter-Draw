
export class RaphsonNewtonAlgorithm {

    constructor(graph, width, height){
        this._graph = null;
        this._width = width;
        this._height = height;

        this._speed = 1.0;

        this.setGraph(graph);
    }

    setProperties(properties) {
        this._speed = properties.speed || this._speed;
    }

    setGraph(graph) {
        this._graph = graph;
        this._graph.nodes.forEach(node => {
            node.x = this._width/2;
            node.y = this._height/2;
            node.isFixed = false;
        });
        this._positionExternalFace();
    }

    _positionExternalFace() {
        // remove unlock fixed nodes
        this._graph.nodes.forEach(node => { node.isFixed = false; });

        const externalFace = this._graph.computeExternalFace(false);

        const numberOfNodes = externalFace.length;
        const slice = (2 * Math.PI) / numberOfNodes;
        const halfWidth = this._width / 2;
        const halfHeight = this._height / 2;
        const offset = 20;

        const angleAdder = externalFace.length % 2 === 0 ? slice/2 : Math.PI/2;

        externalFace.forEach((node, i) => {
            node.isFixed = true;
            node.x = halfWidth + Math.cos(slice * i + angleAdder) * (halfWidth - offset);
            node.y = halfHeight - Math.sin(slice * i + angleAdder) * (halfHeight - offset);
        });
    }

    onCanvasSizeChanged(width, height) {
        this._width = width;
        this._height = height;
        this._positionExternalFace();
    }

    computeNextPositions() {
        this._graph.nodes.forEach((node) => {
            if (node.isFixed === true) return;
            let sumX = 0;
            let sumY = 0;
            node.neighbours.forEach((neighbour) => {
                sumX += neighbour.x;
                sumY += neighbour.y;
            });

            const nextX = sumX / node.neighbours.length;
            const nextY = sumY / node.neighbours.length;
            node.x += (nextX - node.x) * this._speed;
            node.y += (nextY - node.y) * this._speed;
        });
    }

    onRemove() {}
}