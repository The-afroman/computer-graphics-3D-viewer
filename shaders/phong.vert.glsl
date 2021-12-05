#version 300 es

in vec3 a_position;
in vec3 a_color;
in vec3 a_normal;
in vec2 aTextureCoord;
in vec3 aVertexTangent;
in vec3 aVertexBiTangent;

uniform mat4 u_mvp_matrix;
uniform mat4 u_model;

out vec3 v_color;
out highp vec2 vTextureCoord;
out vec3 v_normal;
out vec3 model_pos;
out mat3 vTBN;

void main() {

    // Multiply the position by the matrix.
    vTextureCoord = aTextureCoord;
    v_color = a_color;
    v_normal = a_normal;
    model_pos = vec3(u_model*vec4(a_position, 1.0));
    vec3 T = normalize(vec3(u_model * vec4(aVertexTangent,   0.0)));
    vec3 B = normalize(vec3(u_model * vec4(aVertexBiTangent, 0.0)));
    vec3 N = normalize(vec3(u_model * vec4(a_normal,    0.0)));
    vTBN = mat3(T,B,N);
    gl_Position = u_mvp_matrix * vec4(a_position, 1.0);
}