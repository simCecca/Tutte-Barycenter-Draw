
export class SpringEmbeddersAlgorithm {

    constructor(graph, width, height){
        this.graph = null;
        this.width = width;
        this.height = height;

        this.speed = 0.01;

        this.springRestLength = 10
        this.springDampening = 0.15;
        this.charge = 150 * 150

        this.setGraph(graph);
    }

    setProperties(properties) {
        this.speed = properties.speed || this.speed;
        this.springDampening = properties.springDampening || this.springDampening;
        this.springRestLength = properties.springRestLength || this.springRestLength;
        this.charge = properties.charge || this.charge;
    }

    setGraph(graph) {
        this.graph = graph;
        this.graph.nodes.forEach(node => {
            node.x = this.width / 2 + (100 * Math.random()) - 50;
            node.y = this.height / 2 + (100 * Math.random() - 50);
            node.isFixed = false;
        });
    }

    onCanvasSizeChanged(width, height) {
        this.width = width;
        this.height = height;
    }

    _getDistance(node, node2) {
        const deltaX = node.x - node2.x;
        const deltaY = node.y - node2.y;
        return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    }

    _clamp(val, min, max) {
        return val < min ? min : (val > max ? max : val);
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

                const lengthDifference = distance - this.springRestLength;

                forceX += this.springDampening * lengthDifference * ((neighbour.x - node.x) / distance);
                forceY += this.springDampening * lengthDifference * ((neighbour.y - node.y) / distance);
            });

            // electric charges
            const charge2 = this.charge * this.charge;
            this.graph.nodes.forEach((other) => {
                if (node === other) {
                    return;
                }
                const distance = this._getDistance(node, other);

                const repulsion = charge2 / (distance * distance);

                forceX -= repulsion * ((other.x - node.x) / distance);
                forceY -= repulsion * ((other.y - node.y) / distance);
            });

            forceX = this._clamp(forceX, -200, 200);
            forceY = this._clamp(forceY, -200, 200);

            // finally update the position
            node.x += forceX * this.speed;
            node.y += forceY * this.speed;
        });
    }

    onRemove() {}
}