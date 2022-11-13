// interface ThreadData {
//     coordinatesMatrix: Float32Array;
//     positionsMatrix: Uint16Array;
//     adjMatrix: Uint16Array;
//     charge: number;
//     springStiffness: number;
//     springNaturalLength: number;
//   }

import { QuadThree } from "../../dataStructures/quadtree/QuadThree.js";
import { random } from "../random/random.js";

export class BarnesHut {
  constructor(graph, width, height) {
    this.width = width;
    this.height = height;
    this.quadTree = new QuadThree();
    this.speed = 0.01;

    this.springRestLength = 10;
    this.springDampening = 0.15;
    this.charge = 150 * 150;
    this.theta = 0.5;

    this.setGraph(graph);
  }

  setProperties(properties) {
    this.speed = properties.speed || this.speed;
    this.springDampening = properties.springDampening || this.springDampening;
    this.springRestLength =
      properties.springRestLength || this.springRestLength;
    this.charge = properties.charge * properties.charge;
    this.theta = properties.theta || this.theta;
  }

  setGraph(graph) {
    this.graph = graph;
    if (this.graph.nodes.length > 0) {
      const boundaries = {
        minHeight: 0,
        maxHeight: this.height,
        minWidth: 0,
        maxWidth: this.width,
      };
      this.boundaries = boundaries;
      random.draw2d(this.graph, boundaries);
    }
  }

  onCanvasSizeChanged(width, height) {
    this.width = width;
    this.height = height;
  }

  _calculateElectrostaticForce = (treeNode, node) => {
    const width = treeNode.width;
    const distance = this._getDistance(node, treeNode.barycenter);
    if (width / distance < this.theta) {
      const repulsion = this.charge / (distance * distance);

      node.forceX -= repulsion * ((treeNode.barycenter.x - node.x) / distance);
      node.forceY -= repulsion * ((treeNode.barycenter.y - node.y) / distance);
    } else {
      treeNode.children.forEach((child) => {
        if (child.id !== node.treeNode.id) {
          this._calculateElectrostaticForce(child, node);
        }
      });
    }
  };

  computeNextPositions = () => {
    if (!(this.graph && this.boundaries)) {
      return;
    }
    let minX = this.boundaries.minWidth;
    let maxX = this.boundaries.maxWidth;
    let maxY = this.boundaries.maxHeight;
    let minY = this.boundaries.minHeight;
    this.quadTree.setSubNodes(this.graph.nodes, this.boundaries);
    const treeRoot = this.quadTree.root;
    this.graph.nodes.forEach((node) => {
      node.forceX = 0;
      node.forceY = 0;
      this._calculateElectrostaticForce(treeRoot, node);

      //   springs
      node.neighbours.forEach((neighbour) => {
        const distance = this._getDistance(node, neighbour);

        const lengthDifference = distance - this.springRestLength;

        node.forceX +=
          this.springDampening *
          lengthDifference *
          ((neighbour.x - node.x) / distance);
        node.forceY +=
          this.springDampening *
          lengthDifference *
          ((neighbour.y - node.y) / distance);
      });

      node.forceX = this._clamp(node.forceX, -200, 200);
      node.forceY = this._clamp(node.forceY, -200, 200);

      // finally update the position
      node.x += node.forceX * this.speed;
      node.y += node.forceY * this.speed;
      if (node.x < minX) {
        minX = node.x;
      }
      if (node.x > maxX) {
        maxX = node.x;
      }
      if (node.y < minY) {
        minY = node.y;
      }
      if (node.y > maxY) {
        maxY = node.y;
      }
    });
    this.boundaries = {
      minHeight: minY,
      maxHeight: maxY,
      minWidth: minX,
      maxWidth: maxX,
    };
  };

  onRemove = () => {};

  _getDistance(node, node2) {
    const deltaX = node.x - node2.x;
    const deltaY = node.y - node2.y;
    return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  }

  _clamp(val, min, max) {
    return val < min ? min : val > max ? max : val;
  }
}
