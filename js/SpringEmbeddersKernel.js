


class SpringEmbeddersKernel extends Kernel {

    constructor() {
        super(SpringEmbeddersKernel.kernelCode);
    }


    setProperties(properties) {
        this._shader.use();

        // maybe indices are better here, but this is not a functions that is called every frame
        this._shader.setFloat("speed", properties.speed);
        this._shader.setFloat("springDampening", properties.springDampening);
        this._shader.setFloat("springRestLength", properties.springRestLength);
        this._shader.setFloat("charge2", properties.charge * properties.charge); // already multiplied by 2

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
//uniform ivec2 lastNodeCoord;

void main() {
    // location of the node in the nodes texture
    ivec2 nodeMatrixCoord = ivec2(gl_FragCoord);

    ivec2 adjacencySize = textureSize(adjacency, 0);
    ivec2 positionsSize = textureSize(positions, 0);

    vec2 force = vec2(0.0);

    vec2 nodePosition = texelFetch(positions, nodeMatrixCoord, 0).xy;

    if (nodePosition == vec2(0.0)) {
        discard;
    }

    uvec3 nodeAdjacency = texelFetch(nodes, nodeMatrixCoord, 0).xyz;
    ivec2 nodeAdjacencyCoord = ivec2(nodeAdjacency.xy);
    uint neighbours = nodeAdjacency.z;

    uvec2 neighbourMatrixCoord;

    for (uint i = 0u; i < neighbours; i++) {
        if (nodeAdjacencyCoord.x >= adjacencySize.x) {
            nodeAdjacencyCoord.x = 0;
            nodeAdjacencyCoord.y += 1;
        }

        neighbourMatrixCoord = texelFetch(adjacency, nodeAdjacencyCoord, 0).xy;
        vec2 neighbourPosition = texelFetch(positions, ivec2(neighbourMatrixCoord), 0).xy;

        vec2 delta = neighbourPosition - nodePosition;
        float dist = length(delta);

        float lengthDifference = dist - springRestLength;

        force += springDampening * lengthDifference * normalize(delta);

        nodeAdjacencyCoord.x += 1;
    }

    for (int i = 0; i < 30; i++) {
        for (int j = 0; j < 30; j++) {
            
            if (i == nodeMatrixCoord.x && j == nodeMatrixCoord.y) {
                continue;
            }

            vec2 otherPosition = texelFetch(positions, ivec2(i, j), 0).xy;

            if (otherPosition == vec2(0.0)) {
                break;
            }

            vec2 delta = otherPosition - nodePosition;
            float dist2 = dot(delta, delta);

            float repulsion = charge2 / dist2;

            force -= repulsion * normalize(delta);
        }
    }

    force = clamp(force, vec2(-200.0), vec2(200.0));

    outPosition = nodePosition + speed * force;
}
`