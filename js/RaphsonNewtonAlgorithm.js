

class RaphsonNewtonAlgorithm {

    constructor(graph, width, height){
        this.graph = graph;
        this.width = width;
        this.height = height;

        this.graph.nodes.forEach(node => {node.x = width/2; node.y = height/2;});
        this._positionExternalFace();
    }

    _positionExternalFace(){
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

    computeNextPositions(){
        this.graph.nodes.forEach((node) => {
            if (node.isFixed === true) return;
            let sumX = 0;
            let sumY = 0;
            node.neighbours.forEach((neighbour) => {
                sumX += neighbour.x;
                sumY += neighbour.y;
            });

            const nextX = sumX / node.neighbours.length;
            const nextY = sumY / node.neighbours.length;
            node.x += (nextX - node.x) * 0.01;
            node.y += (nextY - node.y) * 0.01;
        });
    }




}