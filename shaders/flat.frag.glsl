#version 300 es
precision mediump float;

// Passed in from the vertex shader
in vec3 v_color;
in highp vec2 vTextureCoord;
uniform int has_tex;
uniform sampler2D uSampler;

// Final color
out vec4 out_color;

void main() {
    if(has_tex == 1) {
        out_color = vec4(texture(uSampler, vTextureCoord).xyz, 1.0);
    } else {
        out_color = vec4(v_color, 1.0);
    }
}
