/**
 * Simple shader to draw circles
 */
class CircleShader extends Shader {

    constructor() {
        super(CircleShader._VERTEX_SHADER, CircleShader._FRAGMENT_SHADER);
    }

}

CircleShader._VERTEX_SHADER = `#version 300 es
layout (location = 0) in vec2 vPosition;
//layout (location = 1) in vec2 iPositionsCoords;

out vec2 localPosition;

//uniform sampler2D positionsTexture;
//uniform mat3 clipMatrix; // converts from canvas space to ndc

// todo become uniform
float radius = 5.0;

void main() {
    localPosition = vPosition;

    //vec2 center = texelFetch(positionsTexture, ivec2(iPositionsCoords), 0).xy;

    //vec3 transformedPosition = clipMatrix * vec3(radius * vPosition, 1.0);

    gl_Position = vec4(/*vec2(transformedPosition * 0.0) +*/ vPosition, 0.0, 1.0);
}`;

CircleShader._FRAGMENT_SHADER = `#version 300 es
precision mediump float;

in vec2 localPosition;

out vec4 outColor;

void main() {
    float p = 1.0 - smoothstep(0.7,
                               1.0,
                               dot(localPosition, localPosition));

    outColor = vec4(vec3(localPosition.y, 0.0, 0.0), 1.0);
}`;