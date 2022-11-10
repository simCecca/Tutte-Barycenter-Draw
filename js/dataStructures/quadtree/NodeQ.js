export class NodeQ {
  constructor(id) {
    this.id = id;
    this.subNodes = [];
    this.children = [];
    this.boundaries = {
      minHeight: 0,
      maxHeight: 300,
      minWidth: 0,
      maxWidth: 300,
    };
    this.barycenter = { x: 0, y: 0 };
  }

  addSubNode = (subNode) => {
    this.subNodes.push(subNode);
    this._updateBarycenter(subNode);
  };

  setBoundaries = (boundaries) => {
    this.boundaries = boundaries;
    this.width = boundaries.maxWidth - boundaries.minWidth;
  };

  _updateBarycenter = (subNode) => {
    const { x, y } = this.barycenter;
    const { x: xn, y: yn } = subNode;
    const mass = this.subNodes.length - 1;
    this.barycenter = {
      x: (x * mass + xn) / (mass + 1),
      y: (y * mass + yn) / (mass + 1),
    };
  };
}
