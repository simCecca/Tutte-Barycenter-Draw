import { Shader } from './Shader.js';

/**
 * Simple shader to draw lines.
 */
export class LineShader extends Shader {

    constructor() {
        super(LineShader._VERTEX_SHADER, LineShader._FRAGMENT_SHADER);

        this.use();
        this._viewClipMatrixIndex = this.getUniformLocationFor("viewClipMatrix");
        this.stop();
    }

    updateViewClipMatrix(matrix) {
        this.setMat3Index(this._viewClipMatrixIndex, matrix);
    }
}

LineShader._VERTEX_SHADER = `#version 300 es
// vertex position
layout (location = 0) in vec2 vPosition;

// 2d coords used to read the starting position of an from the positions texture
layout (location = 1) in vec2 iStartPositionsCoords; // should be ivec2, not supported by the standard https://stackoverflow.com/questions/46553165/what-are-the-valid-types-for-a-webgl-vertex-shader-attribute

// 2d coords used to read the ending position of an from the positions texture
layout (location = 2) in vec2 iEndPositionsCoords;

uniform sampler2D positionsTexture;
uniform mat3 viewClipMatrix; // converts from canvas space to ndc

// todo become uniform
float lineWidth = .5;

void main() {
    // read the start position of the edge
    vec2 start = texelFetch(positionsTexture, ivec2(iStartPositionsCoords), 0).xy;

    // read the start position of the edge
    vec2 end = texelFetch(positionsTexture, ivec2(iEndPositionsCoords), 0).xy;

    // compute the angle between start and end
    vec2 delta = end - start;
    float angle = atan(delta.y, delta.x);

    // create the rotation matrix
    mat2 rotation = mat2(cos(angle), sin(angle),
                        -sin(angle), cos(angle));

    // create the scale matrix so that the length of the line
    // matches the distance between start and end point and its width
    // is equal to lineWidth
    mat2 scale = mat2(length(delta) / 2.0, 0.0,
                     0.0, lineWidth);

    // transform the rect (perform as many operations as possible with 2d matrix)
    vec2 transformedPosition2D = (start + end) / 2.0 + rotation * scale * vPosition;

    // convert from canvas space to ndc
    vec3 transformedPosition = viewClipMatrix * vec3(transformedPosition2D, 1.0);

    gl_Position = vec4(transformedPosition.xy, 0.0, 1.0);
}`;

LineShader._FRAGMENT_SHADER = `#version 300 es
precision mediump float;

in vec2 localPosition;

out vec4 outColor;

void main() {
    outColor = vec4(0.0, 0.0, 0.0, 1.0);
}`;