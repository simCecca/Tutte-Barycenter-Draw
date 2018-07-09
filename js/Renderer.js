
class Renderer {

    constructor(graph) {
        this.graph = graph;
        this.algorithm = new RaphsonNewtonAlgorithm(graph, 640, 480);

        this.svgElement = d3.select("#svgCanvas")
    }

    renderNodes(nodes) {
        const svgNodes = this.svgElement.selectAll("circle")
            .data(nodes);

        svgNodes.enter()
            .append("circle")
            .attr("r", 10)
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