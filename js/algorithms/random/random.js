class Random {
  constructor() {
    this.boundaries = {
      minHeight: 0,
      maxHeight: 300,
      minWidth: 0,
      maxWidth: 300,
    };
  }

  getABSSize = (boundaries) => {
    return {
      width: boundaries.maxWidth - boundaries.minWidth,
      height: boundaries.maxHeight - boundaries.minHeight,
    };
  };

  draw2d = (graph, boundaries) => {
    const { nodes } = graph;
    const cBoundaries = boundaries || this.boundaries;
    const { width, height } = this.getABSSize(cBoundaries);
    nodes.forEach((node) => {
      node.x = Math.random() * width + cBoundaries.minWidth;
      node.y = Math.random() * height + cBoundaries.minHeight;
    });
  };
}

export const random = new Random();

export default Random;
