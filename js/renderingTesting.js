function  getMousePos(canvas, evt) {
    const rect = canvas.getBoundingClientRect(), // abs. size of element
        scaleX = canvas.width / rect.width,    // relationship bitmap vs. element for X
        scaleY = canvas.height / rect.height;  // relationship bitmap vs. element for Y

    return {
        x: (evt.clientX - rect.left) * scaleX,   // scale mouse coordinates after they have
        y: (evt.clientY - rect.top) * scaleY     // been adjusted to be relative to element
    }
}

let mouseEvent = {
    event: null
};
window.addEventListener("mousemove", (event) => {mouseEvent.event = event});

const position = new Float32Array([100.0, 100.0, 200.0, 200.0, 300.0, 300.0]);

const vao = gl.createVertexArray();
gl.bindVertexArray(vao);

// create VBO and buffer data in it
const VBO = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, VBO);
gl.bufferData(gl.ARRAY_BUFFER, Kernel._QUAD_VERTICES, gl.STATIC_DRAW);

// setup buffer data
gl.enableVertexAttribArray(0);
gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

// unbind
gl.bindBuffer(gl.ARRAY_BUFFER, null);

const ivbo = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, ivbo);
gl.bufferData(gl.ARRAY_BUFFER, position, gl.STATIC_DRAW);

gl.enableVertexAttribArray(1);
gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, 0);
gl.vertexAttribDivisor(1, 1);
gl.bindBuffer(gl.ARRAY_BUFFER, null);

gl.bindVertexArray(null);

const circleVertexShader = `#version 300 es
layout (location = 0) in vec2 vPosition;
layout (location = 1) in vec2 iCenter;

out vec2 pos;

uniform vec2 mousePosition;

const float w = 400.;
const float h = 400.;

mat3 t = mat3(2.0 / w, 0.0, 0.0,
             0.0, 2.0 / -h, 0.0,
             -1.0, 1.0, 1.0);

float radius = 5.0;

void main() {
    pos = vPosition;

    vec3 v = t * vec3(radius * vPosition + iCenter  + mousePosition * 0.0, 1.0);

    gl_Position = vec4(vec2(v), 0.0, 1.0);
}`;

const circleFragmentShader = `#version 300 es
precision mediump float;

in vec2 pos;

out vec4 outData;

void main() {
    vec2 dist = pos - vec2(0.0);
    float p = 1.0 - smoothstep(0.7,
                               1.0,
                               dot(dist, dist));

    outData = vec4(vec3(p, 0.0, 0.0), 1.0);
}`;


const lineVertexShader = `#version 300 es
layout (location = 0) in vec2 vPosition;


uniform vec2 endPosition;
uniform vec2 startPosition;

const float w = 400.;
const float h = 400.;

out float distY;

mat3 t = mat3(2.0 / w, 0.0, 0.0,
             0.0, 2.0 / -h, 0.0,
             -1.0, 1.0, 1.0);

void main() {
    float lineWidth = 15.0;

    distY = vPosition.y;

    vec2 diff = endPosition - startPosition;
    float angle = atan(diff.y, diff.x);

    mat2 rotation = mat2(cos(angle), sin(angle),
                        -sin(angle), cos(angle));

    mat2 scale = mat2(length(diff) / 2.0, 0.0,
                     0.0, lineWidth);

    vec2 pos = (startPosition + endPosition) / 2.0 + rotation * scale * vPosition;
    vec3 transformed = t * vec3(pos, 1.0);
    gl_Position = vec4(transformed.xy, 0.0, 1.0);
}`;

const lineFragmentShader = `#version 300 es
precision mediump float;

in float distY;

out vec4 outData;

void main() {
    float p = 1.0 - smoothstep(0.3,
        1.0,
        abs(distY));

    outData = vec4(vec3(p, 0.0, 0.0), 1.0);
}`;

const shader = new Shader(circleVertexShader, circleFragmentShader);

shader.use();

gl.bindVertexArray(vao);
gl.drawArrays(gl.TRIANGLES, 0, 6);
gl.bindVertexArray(null);

shader.stop();

const renderFunction = () => {
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);


    shader.use();

    //shader.setVec2("startPosition", [100, 100]);

    if (mouseEvent.event) {
        //shader.setVec2("endPosition", [mouseEvent.event.x, mouseEvent.event.y]);
    }

    gl.bindVertexArray(vao);
    gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, 3);
    gl.bindVertexArray(null);

    shader.stop();

    requestAnimationFrame(renderFunction);
};

requestAnimationFrame(renderFunction);