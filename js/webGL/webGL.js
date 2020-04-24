export const gl = document.getElementById("canvas").getContext("webgl2");
export let compatibility = {
    webGL2: false,
    colorBufferFloatExtension: false
};

if (gl) {
    compatibility.webGL2 = true;

    gl.disable(gl.DEPTH_TEST);
    gl.pixelStorei(gl.PACK_ALIGNMENT, 1);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);

    const colorBufferFloatExtension = gl.getExtension("EXT_color_buffer_float");
    if (colorBufferFloatExtension) {
        compatibility.colorBufferFloatExtension = true;
    }
}
