import { Shader } from './Shader.js';

/**
 * Simple shader to draw circles.
 */
export class CircleShader extends Shader {

    constructor() {
        super(CircleShader._VERTEX_SHADER, CircleShader._FRAGMENT_SHADER);
        
        this.use();
        this._viewClipMatrixIndex = this.getUniformLocationFor("viewClipMatrix");
        this.stop();
    }

    updateViewClipMatrix(matrix) {
        this.setMat3Index(this._viewClipMatrixIndex, matrix);
    }
}

CircleShader._VERTEX_SHADER = `#version 300 es
// vertex position
layout (location = 0) in vec2 vPosition;

// 2d coords used to read the position of a node from the positions texture
layout (location = 1) in vec2 iPositionsCoords; // should be ivec2, not supported by the standard https://stackoverflow.com/questions/46553165/what-are-the-valid-types-for-a-webgl-vertex-shader-attribute

out vec2 localPosition;

uniform sampler2D positionsTexture;
uniform mat3 viewClipMatrix; // converts from canvas space to ndc

// todo become uniform
float radius = 3.0;

void main() {
    localPosition = radius * vPosition;

    // read the position of the node from the texture
    vec2 center = texelFetch(positionsTexture, ivec2(iPositionsCoords), 0).xy;

    // transform from canvas space to ndc coordinates
    vec3 transformedPosition = viewClipMatrix * vec3(center + radius * vPosition, 1.0);

    gl_Position = vec4(transformedPosition.xy, 0.0, 1.0);
}`;

CircleShader._FRAGMENT_SHADER = `#version 300 es
precision mediump float;

const vec3 NODE_COLOR = vec3(0.678, 1.0, 0.184); // yellowgreen
const vec3 STROKE_COLOR = vec3(0.0); 

in vec2 localPosition;

out vec4 outColor;

float radius = 3.0;
float strokeWidth = 1.0;

void main() {
    float radius2 = radius * radius;
    float strokeRadius2 = (radius - strokeWidth) * (radius - strokeWidth);

    float dist2 = dot(localPosition, localPosition);

    float alpha = 1.0 - smoothstep(radius2 * 0.99, radius2, dist2);
    float stroke = smoothstep(strokeRadius2 * 0.99, strokeRadius2, dist2);

    outColor = vec4(mix(NODE_COLOR, STROKE_COLOR, stroke), alpha);
}`;