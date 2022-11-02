class Square {
  constructor() {}

  draw2d = (graph) => {
    const nodes = graph.nodes;
    const square = Math.ceil(Math.sqrt(nodes.length));
    let offset = 50;
    nodes.forEach((node, index) => {
      node.x = (index % square) * offset;
      node.y = Math.floor(index / square) * offset;
    });
  };
}

export const square = new Square();

export default Square;
