
class Renderer {

    constructor(graph) {
        this.graph = graph;
        this.algorithm = new RaphsonNewtonAlgorithm(graph, 640, 480);

        this.svgElement = d3.select("#svgCanvas")
    }

    renderNodes(nodes) {

        const svgNodes = this.svgElement.selectAll("cicle")
            .data(nodes, d => d.id);

        svgNodes.enter()
            .append("circle")
            .attr("r", 10)
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
        // TODO: this.algorithm.performNextPositions();
        this.renderEdges(this.graph.edges);
        this.renderNodes(this.graph.nodes)
    }

}