import { Kernel } from './Kernel.js';

/**
 * Kernel to compute graph layout based on the spring embedders algorithm.
 * The GPU algorithm is based on the paper https://www.labri.fr/perso/melancon/Visual_Analytics_Course/lib/exe/fetch.php?media=bordeaux20132014:auber_chiricota_2007_gpu.pdf
 */
export class SpringEmbeddersKernel extends Kernel {

    constructor() {
        super(SpringEmbeddersKernel.kernelCode);
    }

    setProperties(properties) {
        this._shader.use();

        // maybe indices are better here, but this is not a functions that is called every frame
        this._shader.setFloat("speed", properties.speed);
        this._shader.setFloat("springDampening", properties.springDampening);
        this._shader.setFloat("springRestLength", properties.springRestLength);
        this._shader.setFloat("charge2", properties.charge * properties.charge); // already to the power of 2

        this._shader.stop();
    }

    /**
     * The node matrix contains more slots than the actual number
     * of nodes in the graph. This method sets the coordinates (in the texture)
     * of the last valid node. 
     * @param {Array} coord 
     */
    setLastNodeCoord(coord) {
        this._shader.use();
        this._shader.setIntVec2("lastNodeCoord", coord);
        this._shader.stop();
    }

}


/**
 * glsl code for this kernel
 */
SpringEmbeddersKernel.kernelCode = `#version 300 es

precision highp float;
precision mediump usampler2D;
precision highp sampler2D;

out vec2 outPosition;

uniform usampler2D nodes;
uniform usampler2D adjacency;
uniform sampler2D positions;

uniform float speed;
uniform float springRestLength;
uniform float springDampening;
uniform float charge2;
uniform ivec2 lastNodeCoord;

void main() {
    // location of the node in the nodes texture
    ivec2 nodeMatrixCoord = ivec2(gl_FragCoord);

    ivec2 adjacencySize = textureSize(adjacency, 0);
    ivec2 positionsSize = textureSize(positions, 0);

    vec2 nodePosition = texelFetch(positions, nodeMatrixCoord, 0).xy;

    // check the default value in SpringEmbedderGPUAlgorithm
    if (nodePosition == vec2(-10000.0)) {
        discard;
    }

    // initial force
    vec2 force = vec2(0.0);

    // the adjacency are stored in the adjacency matrix, to access this matrix for the current node
    // we have to take the indices from the nodes matrix.
    uvec3 nodeAdjacency = texelFetch(nodes, nodeMatrixCoord, 0).xyz;
    ivec2 nodeAdjacencyCoord = ivec2(nodeAdjacency.xy);
    uint neighbours = nodeAdjacency.z;

    // loop through all the neighbours
    for (uint i = 0u; i < neighbours; i++) {
        if (nodeAdjacencyCoord.x >= adjacencySize.x) { // texture is over, go to the next line
            nodeAdjacencyCoord.x = 0;
            nodeAdjacencyCoord.y += 1;
        }

        // get the matrix coordinates of the neighbour
        uvec2 neighbourMatrixCoord = texelFetch(adjacency, nodeAdjacencyCoord, 0).xy;

        // now get the position of the neighbour
        vec2 neighbourPosition = texelFetch(positions, ivec2(neighbourMatrixCoord), 0).xy;

        // simple spring embedder algorithm
        vec2 delta = neighbourPosition - nodePosition;
        float dist = length(delta);
        float lengthDifference = dist - springRestLength;

        force += springDampening * lengthDifference * normalize(delta);

        nodeAdjacencyCoord.x += 1;
    }

    // repulsive, forces, must access all other nodes
    for (int i = 0; i < positionsSize.x; i++) {
        for (int j = 0; j < positionsSize.y; j++) {
            vec2 otherPosition = texelFetch(positions, ivec2(i, j), 0).xy;

            vec2 delta = otherPosition - nodePosition;
            float dist2 = dot(delta, delta);

            if (dist2 != 0.0) {
                float repulsion = charge2 / dist2;

                force -= repulsion * normalize(delta);
            }
        }
    }

    force = clamp(force, vec2(-200.0), vec2(200.0));

    outPosition = nodePosition + speed * force;
}
`