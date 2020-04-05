gl.pixelStorei(gl.PACK_ALIGNMENT, 1);
        gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);

        const data = new Uint8Array(1600 * 2)
        const t = Texture.createTextureUint8_2(40, 40, data, true);
        console.log(t.getData());

        const t2 = Texture.createTextureUint8_2(40, 40, data, false);

        const frag = `#version 300 es
        precision mediump float;
        precision mediump usampler2D;
        
        out uvec2 outData;

        uniform usampler2D inData;

        void main() {
            int i = 0;

            for (int i = 0; i < 400; i++) {
                for (int j = 0; j < 400; j++) {
                    i += int(texelFetch(inData, ivec2(i, j) ,0).r);
                }
            }

            outData = uvec2(i, 1);
        }`;

        const kernel = new Kernel(frag);
        kernel.setInputTexture("aaa", t2);
        kernel.setOutputTexture(t);

        const a = performance.now();
        kernel.execute();

        
        console.log(t.getData());
        console.log(performance.now() - a);