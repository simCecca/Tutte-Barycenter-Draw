
export class D3Renderer {

    constructor() {
        this._svgGroup = d3.select("#svgCanvas")
        .attr("class", "fullscreenCanvas")
        .attr("style", "display: block")
        .call(d3.zoom().on("zoom", () => {
            this._svgGroup.attr("transform", d3.event.transform)
        }))
        .append("g");

        this._graph = null;

        this._renderNodeLabels = false;
        this._renderEdgeLabels = false;

        this._svgNodes = null;
        this._svgEdges = null;
    }

    onRemove() {
        this._svgGroup.remove();
        
        d3.select("#svgCanvas")
        .attr("style", "display: none");
    }

    setRenderNodeLabels(value) {
        if (value === false)
            this._svgGroup.selectAll("text.nodes").remove();

        this._renderNodeLabels = value;
    }
    setRenderEdgeLabels(value) {
        if (value === false)
            this._svgGroup.selectAll("text.edges").remove();

        this._renderEdgeLabels = value;
    }

    setGraph(graph) {
        this._emptyCanvas();
        this._graph = graph;

        this._svgEdges = this._svgGroup.selectAll("line")
        .data(this._graph.edges)
        .enter()
        .append("line")
        .attr("x1", edge => edge.source.x)
        .attr("y1", edge => edge.source.y)
        .attr("x2", edge => edge.target.x)
        .attr("y2", edge => edge.target.y);

        this._svgNodes = this._svgGroup.selectAll("circle")
            .data(this._graph.nodes)
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
    }

    setSize(width, height) {
        // d3 renderer doesn't do anything here
    }

    _emptyCanvas() {
        this._svgGroup.html("");
    }

    _renderNodes() {
        this._svgNodes
            .attr("cx", node => { return node.x })
            .attr("cy", node => { return node.y });
    }

    _renderEdges() {
        this._svgEdges
            .attr("x1", edge => edge.source.x)
            .attr("y1", edge => edge.source.y)
            .attr("x2", edge => edge.target.x)
            .attr("y2", edge => edge.target.y);
    }

    _renderLabels(elements, kind, position = d => [d.x, d.y]) {
        const svgTexts = this._svgGroup.selectAll(`text.${kind}`)
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
        this._renderEdges();
        this._renderNodes();

        if (this._renderNodeLabels === true)
            this._renderLabels(this._graph.nodes, "nodes", n => [n.x + 10, n.y]);

        if (this._renderEdgeLabels === true)
            this._renderLabels(this._graph.edges, "edges", e => [(e.source.x + e.target.x)/2,
                (e.source.y + e.target.y)/2 - 10]);
    }

    /**
     * Direct rendering means that this algorithm can render nodes and edges 
     * by reading their positions direcly from a texture.
     * If this method returns true, GPU based algorithm do not need to transfer data
     * from the GPU to the CPU to update the graph before rendering
     * @returns whether this renderer supports direct rendering.
     */
    supportsDirectRendering() {
        return false;
    }
}
