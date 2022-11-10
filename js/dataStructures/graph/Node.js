
/**
 * This class represent a node of the Graph and its information
 */
export class Node {
    constructor(id, label) {
        this.x = 0;
        this.y = 0;

        this.id = id;
        this.label = label;

        this.rotationScheme = [];
        this.neighbours = [];

        this.isFixed = false;
    }

    addNeighbour(neighbour) {
        this.neighbours.push(neighbour);
    }
}
