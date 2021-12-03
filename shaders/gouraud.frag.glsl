#version 300 es
precision mediump float;

// Passed in from the vertex shader
in vec3 v_color;
in vec3 ambient_out;
in vec3 lighting;
in vec2 vTextureCoord;

uniform int has_tex;
uniform sampler2D uSampler;

// Final color
out vec4 out_color;

void main() {
    vec3 res;
    if(has_tex == 1) {
        vec3 texcolor = texture(uSampler, vTextureCoord).xyz;
        res = texcolor*(ambient_out + lighting);
    } else {
        res =  v_color*(ambient_out + lighting);
    }
    out_color = vec4(res,1.0);
}