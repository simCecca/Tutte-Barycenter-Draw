
class Renderer {

    constructor() {
        this.svgElement = d3.select("#svgCanvas");
        this.graph = null;
        this.algorithm = new RaphsonNewtonAlgorithm(new Graph(), window.innerWidth, window.innerHeight); // Dummy graph
        this.algorithm.renderSpeed = 0.01;
    }

    setGraph(graph) {
        this.emptyCanvas();
        this.graph = graph;
        this.algorithm.setGraph(graph);
    }

    setSize(width, height) {
        this.algorithm.width = width;
        this.algorithm.height = height;
        this.algorithm.positionExternalFace();
    }

    setRenderSpeed(speed) {
        this.algorithm.renderSpeed = speed;
    }


    emptyCanvas() {
        this.svgElement.html("");
    }

    renderNodes(nodes) {
        const svgNodes = this.svgElement.selectAll("circle")
            .data(nodes);

        svgNodes.enter()
            .append("circle")
            .attr("r", 7)
            .on("mouseover", (_, i, nodes) => {d3.select(nodes[i]).transition().duration(100).attr("r", 10)})
            .on("mouseout", (_, i, nodes) => {d3.select(nodes[i]).transition().duration(100).attr("r", 7);})
            .call(d3.drag()
                .on("start", node => {node.wasFixed = node.isFixed; node.isFixed = true;})
                .on("end", node => {node.isFixed = node.wasFixed;})
                .on("drag", node => {node.x = d3.event.x; node.y = d3.event.y;}))
            .merge(svgNodes)
            .attr("cx", node => node.x)
            .attr("cy", node => node.y);

    }

    renderEdges(edges) {
        const svgEdges = this.svgElement.selectAll("line")
            .data(edges); // edges aren't going to change...

        svgEdges.enter()
            .append("line")
            .merge(svgEdges)
            .attr("x1", edge => edge.source.x)
            .attr("y1", edge => edge.source.y)
            .attr("x2", edge => edge.target.x)
            .attr("y2", edge => edge.target.y);
    }

    render() {
        this.algorithm.computeNextPositions();
        this.renderEdges(this.graph.edges);
        this.renderNodes(this.graph.nodes)
    }

}