// export interface MultiThProps {
//   adjMatrix?: ArrayBufferLike;
//   positionsMatrix?: ArrayBufferLike;
//   coordinatesMatrix: ArrayBufferLike;
//   from: number;
//   to: number;
//   charge: number;
//   springStiffness: number;
//   springNaturalLength: number;
//   threadId: number;
// }

// interface Positions {
//   x: number;
//   y: number;
// }

// interface MultiThReturnProps {
//   threadId: number;
//   from: number;
//   to: number;
//   coordinates: ArrayBufferLike;
// }

/**
 * coordinatesMatrix: array grande 2 volte il numero di nodi; per ogni nodo ci sono due valori;
 *     il primo è la coordinata x, il secondo la y; la coordinata x del nodo i si trova in i * 2,
 *     la y in i * 2 + 1.
 * positionMatrix: array grande 2 volte il numero dei nodi; per ogni nodo ci sono due valori;
 *     rappresenta le posizioni di dove sono salvati i vicini di un nodo, all'interno dell'adjMatrix;
 *     per trovare i vicini di un nodo i => i * 2 è l'inizio dei vicini nella adjMatrix, i * 2 + 1
 *     è la fine dei vicini di i nella adjMatrix.
 * adjMatrix: indici dei vicini dei nodi, tramite la positionMatrix si possono reperire i vicini di un
 *     nodo.
 */

let positionMatrixArr;
let adjMatrixA;

self.onmessage = (e) => {
  const {
    from,
    to,
    adjMatrix,
    positionsMatrix,
    charge,
    coordinatesMatrix,
    springNaturalLength,
    springStiffness,
    threadId,
  } = e.data; // MultiThProps

  const coordinatesMatrixArr = [...new Float32Array(coordinatesMatrix)];
  if (!positionMatrixArr) {
    positionMatrixArr = new Uint16Array(positionsMatrix);
  }
  if (!adjMatrixA) {
    adjMatrixA = new Uint16Array(adjMatrix);
  }

  const returnCoordinates = new Float32Array((to - from) * 2);

  let indexCoordinates = 0;

  for (let i = from; i < to; i++) {
    const nodeId = i;
    let forceX = 0;
    let forceY = 0;
    const index = i * 2;
    const posNode = {
      // Positions
      x: coordinatesMatrixArr[index],
      y: coordinatesMatrixArr[index + 1],
    };

    const neigOffset = {
      start: positionMatrixArr[index],
      end: positionMatrixArr[index + 1],
    };

    for (
      let neigIndex = neigOffset.start;
      neigIndex < neigOffset.end;
      neigIndex++
    ) {
      const targetId = adjMatrixA[neigIndex];
      if (targetId === nodeId) {
        continue;
      }
      const posTarget = {
        // Positions
        x: coordinatesMatrixArr[targetId * 2],
        y: coordinatesMatrixArr[targetId * 2 + 1],
      };

      const distance = getDistanceBetweenNodes(posNode, posTarget);
      const lengthDifference = distance - springNaturalLength;
      forceX +=
        springStiffness *
          lengthDifference *
          ((posTarget.x - posNode.x) / distance) || 0;

      forceY +=
        springStiffness *
          lengthDifference *
          ((posTarget.y - posNode.y) / distance) || 0;
    }
    for (
      let forceNodesIndex = 0;
      forceNodesIndex < coordinatesMatrixArr.length;
      forceNodesIndex = forceNodesIndex + 2
    ) {
      const forceNodeId = forceNodesIndex / 2;
      if (forceNodeId === nodeId) {
        continue;
      }
      const forcePos = {
        // Positions
        x: coordinatesMatrixArr[forceNodesIndex],
        y: coordinatesMatrixArr[forceNodesIndex + 1],
      };
      const distance = getDistanceBetweenNodes(posNode, forcePos);
      const repulsion = charge / (distance * distance);
      const distanceX = repulsion === Infinity ? 0.001 : forcePos.x - posNode.x;
      const distanceY = repulsion === Infinity ? 0.001 : forcePos.y - posNode.y;

      forceX -= repulsion * (distanceX / distance);
      forceY -= repulsion * (distanceY / distance);
    }
    forceX = clamp(forceX, -200, 200);
    forceY = clamp(forceY, -200, 200);
    const newX = posNode.x + forceX;
    const newY = posNode.y + forceY;
    returnCoordinates[indexCoordinates] = newX;
    returnCoordinates[indexCoordinates + 1] = newY;
    indexCoordinates += 2;
  }
  const coordinates = returnCoordinates.buffer; // ArrayBufferLike
  const values = { from, to, threadId, coordinates }; // MultiThReturnProps

  self.postMessage(values, [coordinates]);
};

const getDistanceBetweenNodes = (pos1, pos2) => {
  // (Positions, Positions)
  const deltaX = pos1.x - pos2.x;
  const deltaY = pos1.y - pos2.y;

  return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
};

const clamp = (val, min, max) => {
  return val < min ? min : val > max ? max : val;
};
