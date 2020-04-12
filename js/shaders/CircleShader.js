/**
 * Simple shader to draw circles.
 */
class CircleShader extends Shader {

    constructor() {
        super(CircleShader._VERTEX_SHADER, CircleShader._FRAGMENT_SHADER);
    }

}

CircleShader._VERTEX_SHADER = `#version 300 es
// vertex position
layout (location = 0) in vec2 vPosition;

// 2d coords used to read the position of a node from the positions texture
layout (location = 1) in vec2 iPositionsCoords; // should be ivec2, not supported by the standard https://stackoverflow.com/questions/46553165/what-are-the-valid-types-for-a-webgl-vertex-shader-attribute

out vec2 localPosition;

uniform sampler2D positionsTexture;
uniform mat3 clipMatrix; // converts from canvas space to ndc

// todo become uniform
float radius = 5.0;

void main() {
    localPosition = vPosition;

    // read the position of the node from the texture
    vec2 center = texelFetch(positionsTexture, ivec2(iPositionsCoords), 0).xy;

    // transform from canvas space to ndc coordinates
    vec3 transformedPosition = clipMatrix * vec3(center + radius * vPosition, 1.0);

    gl_Position = vec4(transformedPosition.xy, 0.0, 1.0);
}`;

CircleShader._FRAGMENT_SHADER = `#version 300 es
precision mediump float;

in vec2 localPosition;

out vec4 outColor;

void main() {
    float p = 1.0 - smoothstep(0.7,
                               1.0,
                               dot(localPosition, localPosition));

    outColor = vec4(vec3(p, 0.0, 0.0), 1.0);
}`;