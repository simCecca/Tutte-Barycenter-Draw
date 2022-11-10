import { NodeQ } from "./NodeQ.js";

export class QuadThree {
  constructor() {}

  /**
   * 
   * @param {{
        minHeight: number,
        maxHeight: number,
        minWidth: number,
        maxWidth: number,
      }} boundaries 
   */
  setSubNodes = (nodes, boundaries) => {
    this._init(nodes, boundaries);
    this._generateQuadTree();
  };

  getSubNodes = () => {
    return this._subnodes;
  };

  _init = (nodes, boundaries) => {
    this._subnodes = nodes || [];
    this.root = new NodeQ("root");
    if (boundaries) {
      this.root.setBoundaries(boundaries);
    }
  };

  _containCheck = (boundaries, { x, y }) => {
    return (
      boundaries.minHeight <= y &&
      boundaries.maxHeight >= y &&
      boundaries.minWidth <= x &&
      boundaries.maxWidth >= x
    );
  };

  _getSubDomain = (treeNode, subnode) => {
    if (!treeNode) {
      return;
    }
    const { x, y } = subnode;
    if (treeNode.children.length > 0) {
      for (let child of treeNode.children) {
        if (this._containCheck(child.boundaries, { x, y })) {
          treeNode.addSubNode(subnode);
          return this._getSubDomain(child, subnode);
        }
      }
    }
    return treeNode;
  };

  _generateBoundaries = (boundaries, i) => {
    let cBoundaries = {};
    const minHeight = boundaries.minHeight;
    const maxHeight = boundaries.maxHeight;
    const halfHeight = (maxHeight - minHeight) / 2 + minHeight;
    const minWidth = boundaries.minWidth;
    const maxWidth = boundaries.maxWidth;
    const halfWidth = (maxWidth - minWidth) / 2 + minWidth;
    if (i == 0) {
      cBoundaries = {
        minHeight: minHeight,
        maxHeight: halfHeight,
        minWidth: minWidth,
        maxWidth: halfWidth,
      };
    } else if (i == 1) {
      cBoundaries = {
        minHeight: halfHeight,
        maxHeight: maxHeight,
        minWidth: minWidth,
        maxWidth: halfWidth,
      };
    } else if (i == 2) {
      cBoundaries = {
        minHeight: minHeight,
        maxHeight: halfHeight,
        minWidth: halfWidth,
        maxWidth: maxWidth,
      };
    } else if (i == 3) {
      cBoundaries = {
        minHeight: halfHeight,
        maxHeight: maxHeight,
        minWidth: halfWidth,
        maxWidth: maxWidth,
      };
    }
    return cBoundaries;
  };

  _divideTreeArea = (treeNode) => {
    const subNodes = treeNode.subNodes;
    const boundaries = treeNode.boundaries;
    for (let i = 0; i < 4; i++) {
      // subNodes = two elements 2 * 4 = 8 => O(1)
      const cTreeNode = new NodeQ("node-" + treeNode.id + "-" + i);
      cTreeNode.setBoundaries(this._generateBoundaries(boundaries, i));
      subNodes.forEach((tSubNode) => {
        const { x, y, id } = tSubNode;
        if (this._containCheck(cTreeNode.boundaries, { x, y })) {
          cTreeNode.addSubNode(tSubNode);
          tSubNode.treeNode = cTreeNode;
          if (cTreeNode.subNodes.length > 1) {
            this._divideTreeArea(cTreeNode);
          }
        }
      });
      treeNode.children.push(cTreeNode);
    }
  };

  _generateQuadTree = () => {
    // O(n * ln)
    // const init = new Date().getTime();
    this._subnodes.forEach((subnode) => {
      const treeNode = this._getSubDomain(this.root, subnode); // O(ln)
      treeNode.addSubNode(subnode);
      subnode.treeNode = treeNode;
      if (treeNode.subNodes.length > 1) {
        this._divideTreeArea(treeNode);
      }
    });
    // const end = new Date().getTime();
    // console.log("tempo", end - init);
  };
}
