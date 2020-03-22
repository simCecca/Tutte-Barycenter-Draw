
class Renderer {

    constructor() {
        this.svgElement = d3.select("#svgCanvas")
        .call(d3.zoom().on("zoom", () => {
            this.svgElement.attr("transform", d3.event.transform)
        }))
        .append("g")

        this.graph = null;

        this.renderNodeLabels = false;
        this.renderEdgeLabels = false;

        this.svgNodes = null;
        this.svgEdges = null;
    }

    setRenderNodeLabels(value) {
        if (value === false)
            this.svgElement.selectAll("text.nodes").remove();

        this.renderNodeLabels = value;
    }
    setRenderEdgeLabels(value) {
        if (value === false)
            this.svgElement.selectAll("text.edges").remove();

        this.renderEdgeLabels = value;
    }

    createArrowDef() {
        this.svgElement.append("svg:defs").append("svg:marker")
            .attr("id", "triangle")
            .attr("refX", 20)
            .attr("refY", 6)
            .attr("markerWidth", 30)
            .attr("markerHeight", 30)
            .attr("orient", "auto")
            .append("path")
            .attr("d", "M 0 0 12 6 0 12 3 6")
            .style("fill", "black");
    }

    setGraph(graph) {
        this.emptyCanvas();
        this.createArrowDef();
        this.graph = graph;

        this.svgNodes = this.svgElement.selectAll("circle")
            .data(this.graph.nodes)
            .enter()
            .append("circle")
            .attr("r", 3)
            .on("mouseover", (_, i, nodes) => {d3.select(nodes[i]).transition().duration(100).attr("r", 5)})
            .on("mouseout", (_, i, nodes) => {d3.select(nodes[i]).transition().duration(100).attr("r", 3);})
            .call(d3.drag()
                .on("start", node => {node.wasFixed = node.isFixed; node.isFixed = true;})
                .on("end", node => {node.isFixed = node.wasFixed;})
                .on("drag", node => {node.x = d3.event.x; node.y = d3.event.y;}))
            .attr("cx", node => node.x)
            .attr("cy", node => node.y);

        this.svgEdges = this.svgElement.selectAll("line")
            .data(this.graph.edges)
            .enter()
            .append("line")
            .attr("x1", edge => edge.source.x)
            .attr("y1", edge => edge.source.y)
            .attr("x2", edge => edge.target.x)
            .attr("y2", edge => edge.target.y);
            /*.each((edge, i, node) => {
                if (edge.directed === true)
                    d3.select(node[i]).attr("marker-end", "url(#triangle)");
            });*/
    }

    setSize(width, height) {
        // d3 renderer doesn't do anything here
    }

    emptyCanvas() {
        this.svgElement.html("");
    }

    renderNodes() {
        this.svgNodes
            .attr("cx", node => { return node.x })
            .attr("cy", node => { return node.y });
    }

    renderEdges() {
        this.svgEdges
            .attr("x1", edge => edge.source.x)
            .attr("y1", edge => edge.source.y)
            .attr("x2", edge => edge.target.x)
            .attr("y2", edge => edge.target.y);
    }

    renderLabels(elements, kind, position = d => [d.x, d.y]) {
        const svgTexts = this.svgElement.selectAll(`text.${kind}`)
            .data(elements);

        svgTexts.enter()
            .append(`text`)
            .classed(kind, true)
            .on("mouseover", (_, i, nodes) => d3.select(nodes[i]).transition().duration(100).style("font-size", "18px"))
            .on("mouseout", (_, i, nodes) => d3.select(nodes[i]).transition().duration(100).style("font-size", "10px"))
            .merge(svgTexts)
            .attr("x", d => position(d)[0])
            .attr("y", d => position(d)[1])
            .text(d => d.label);
    }

    render() {
        this.renderEdges();
        this.renderNodes();

        if (this.renderNodeLabels === true)
            this.renderLabels(this.graph.nodes, "nodes", n => [n.x + 10, n.y]);

        if (this.renderEdgeLabels === true)
            this.renderLabels(this.graph.edges, "edges", e => [(e.source.x + e.target.x)/2,
                (e.source.y + e.target.y)/2 - 10]);
    }

}