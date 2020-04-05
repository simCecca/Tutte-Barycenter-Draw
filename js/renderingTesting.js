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
gl.bindVertexArray(null);

const circleVertexShader = `#version 300 es
layout (location = 0) in vec2 vPosition;

out vec2 pos;

uniform vec2 mousePosition;

const float w = 100.;
const float h = 100.;

mat3 t = mat3(2.0 / w, 0.0, 0.0,
             0.0, 2.0 / -h, 0.0,
             -1.0, 1.0, 1.0);

float radius = 50.0;

void main() {
    pos = vPosition;

    vec3 v = t * vec3(radius * vPosition + mousePosition, 1.0);

    gl_Position = vec4(vec2(v), 0.0, 1.0);
}`;

const circleFragmentShader = `#version 300 es
precision mediump float;

in vec2 pos;

out vec4 outData;

void main() {
    vec2 scaledPos = pos / vec2(100.0 / 100.0, 1);
    vec2 dist = scaledPos-vec2(0.0);
    float p = 1.-smoothstep(0.95,
                 1.0,
                 dot(dist,dist));

    outData = vec4(vec3(p, 0.0, 0.0), 1.0);
}`;


const lineVertexShader = `#version 300 es
layout (location = 0) in vec2 vPosition;

out vec2 pos;

uniform vec2 mousePosition;

vec2 map(vec2 value, vec2 min1, vec2 max1, vec2 min2, vec2 max2) {
    return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
}

void main() {
    vec2 pt1 = vec2(0);
    vec2 pt2 = map(mousePosition, vec2(0.0), vec2(700.0, 400.0), vec2(-1.0, 1.0), vec2(1.0, -1.0));

    float lineWidth = 0.005;

    vec2 diff = pt2 - pt1;
    float angle = atan(diff.y, diff.x);

    mat2 rotation = mat2(cos(angle), sin(angle),
                        -sin(angle), cos(angle));

    mat2 scale = mat2(distance(pt1, pt2) / 2.0, 0,
    0, lineWidth);

    pos = (pt1 + pt2) / 2.0 + rotation * scale * vPosition;
    gl_Position = vec4(pos, 0.0, 1.0);
}`;

const lineFragmentShader = `#version 300 es
precision mediump float;

in vec2 pos;

out vec4 outData;

void main() {
    outData = vec4(vec3(1.0, 0.0, 0.0), 1.0);
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

    if (mouseEvent.event) {
        shader.setVec2("mousePosition", [mouseEvent.event.x, mouseEvent.event.y]);
    }

    gl.bindVertexArray(vao);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.bindVertexArray(null);

    shader.stop();

    requestAnimationFrame(renderFunction);
};

requestAnimationFrame(renderFunction);