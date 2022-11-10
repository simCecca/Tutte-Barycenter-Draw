
export class Edge {

    constructor(source, target, label="", directed = false){
        this.source = source;
        this.target = target;
        this.label = label;
        this.directed = directed;
    }
}
