

class RaphsonNewtonAlgorithm {

    constructor(graph, width, height){
        this.graph = graph;
        this.width = width;
        this.height = height;
    }

    _positionExternalFace(){
        const externalFace = this.graph.computeExternalFace();

        const numberOfNodes = externalFace.length;
        const slice = (2 * Math.PI) / numberOfNodes;
        const halfWidth = this.width / 2;
        const halfHeight = this.width / 2;
        const offset = 10;

        externalFace.forEach((node, i) => {
            node.x = halfWidth + Math.cos(slice * i) * (halfWidth - offset);
            node.y = halfHeight + Math.sin(slice * i) * (halfHeight - offset);
        });


    }




}