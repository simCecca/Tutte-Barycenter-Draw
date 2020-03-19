
class SpringEmbeddersAlgorithm {

    constructor(graph, width, height){
        this.graph = null;
        this.width = width;
        this.height = height;

        this.renderSpeed = 1.0;

        // TODO other spring embedder params
        this.springRestLength = 10
        this.springDampening = 1 / 10;
        this.repulsiveConstant = 15

        this.setGraph(graph);
    }

    setGraph(graph) {
        this.graph = graph;
        this.graph.nodes.forEach(node => {node.x = this.width * Math.random(); node.y = this.height * Math.random()});
        //this.positionExternalFace();
    }

    positionExternalFace() {
        const externalFace = this.graph.computeExternalFace();

        const numberOfNodes = externalFace.length;
        const slice = (2 * Math.PI) / numberOfNodes;
        const halfWidth = this.width / 2;
        const halfHeight = this.height / 2;
        const offset = 20;

        const angleAdder = externalFace.length % 2 === 0 ? slice/2 : Math.PI/2;

        externalFace.forEach((node, i) => {
            node.x = halfWidth + Math.cos(slice * i + angleAdder) * (halfWidth - offset);
            node.y = halfHeight - Math.sin(slice * i + angleAdder) * (halfHeight - offset);
        });
    }

    onCanvasSizeChanged(width, height) {
        this.width = width;
        this.height = height;
        //this.positionExternalFace();
    }

    _getDistance(node, node2) {
        const deltaX = node.x - node2.x;
        const deltaY = node.y - node2.y;
        return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    }

    computeNextPositions() {
        this.graph.nodes.forEach((node) => {
            if (node.isFixed === true) {
                return;
            }
            let forceX = 0;
            let forceY = 0;

            // springs
            node.neighbours.forEach((neighbour) => {
                const distance = this._getDistance(node, neighbour);

                if (Math.abs(distance) < 0.01) return;

                const lengthDifference = distance - this.springRestLength;

                forceX += this.springDampening * lengthDifference * ((neighbour.x - node.x) / distance);
                forceY += this.springDampening * lengthDifference * ((neighbour.y - node.y) / distance);
            });

            // electric charges
            this.graph.nodes.forEach((other) => {
                if (node === other) {
                    return;
                }
                const distance = this._getDistance(node, other);

                if (Math.abs(distance) < 0.01) return;

                const repulsion = this.repulsiveConstant / (distance);

                forceX -= repulsion * ((other.x - node.x) / distance);
                forceY -= repulsion * ((other.y - node.y) / distance);
            });

            // finally update the position
            node.x += forceX;
            node.y += forceY;
        });
    }
}