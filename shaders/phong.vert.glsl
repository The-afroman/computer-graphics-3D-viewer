#version 300 es

in vec3 a_position;
in vec3 a_color;
in vec3 a_normal;

uniform mat4 u_mvp_matrix;
uniform mat4 u_model;

out vec3 v_color;
out vec3 v_normal;
out vec3 model_pos;

void main() {

    // Multiply the position by the matrix.
    v_color = a_color;
    v_normal = a_normal;
    model_pos = vec3(u_model*vec4(a_position, 1.0));
    gl_Position = u_mvp_matrix * vec4(a_position, 1.0);
}