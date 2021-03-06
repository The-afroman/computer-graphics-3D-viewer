#version 300 es

in vec3 a_position;
in vec3 a_color;
in vec3 a_normal;
in vec2 aTextureCoord;

uniform mat4 u_mvp_matrix;
uniform mat4 u_model;
uniform mat4 u_modelInverseTranspose;
uniform vec3 u_lightPosition;
uniform vec3 u_cameraPosition;
uniform int num_lights;
uniform int movelights;
uniform vec3 Ia;
uniform mat4 u_transform;

struct lightSource
{
    int type;
    vec3 pos_or_direction;
    vec3 Id;
    vec3 Is;
};
uniform lightSource lights[10];

uniform vec3 Ka;
uniform vec3 Kd;
uniform vec3 Ks;
uniform float Ns;

out vec3 v_color;
out vec3 lighting;
out highp vec2 vTextureCoord;
out vec3 ambient_out;

void main() {
    vec3 res;
    vec3 lightDir;
    vec3 texcolor;
    vTextureCoord = aTextureCoord;
    // Multiply the position by the matrix.
    vec3 model_pos = vec3(u_model*vec4(a_position, 1.0));
    gl_Position = u_mvp_matrix * vec4(a_position, 1.0);

    vec3 normal = normalize(vec3(u_modelInverseTranspose*vec4(a_normal,1.0)));
    vec3 cameraDir = normalize(u_cameraPosition - model_pos);

    vec3 ambient = Ka * Ia;

    for(int index = 0; index < num_lights; index<index++)
    {
         // point vs directional light
        vec3 pos;
        if(movelights == 1) {
            pos = vec3(u_transform * vec4(lights[index].pos_or_direction,1));
        } else {
            pos = lights[index].pos_or_direction;
        }
        if(lights[index].type == 1) {
            lightDir = normalize(pos - model_pos);
        } else {
            lightDir = normalize(-pos);
        }
        vec3 reflectDir = reflect(-lightDir, normal);
        float diffuse_ = max(dot(normal, lightDir), 0.0);
        vec3 diffuse = Kd * diffuse_ * lights[index].Id;
        float specular_ = pow( max(dot(cameraDir, reflectDir), 0.0), Ns );
        vec3 specular = Ks * specular_ * lights[index].Is;

        res = res + diffuse + specular;
    }
    lighting = res;
    v_color = a_color;
    ambient_out = ambient;
}