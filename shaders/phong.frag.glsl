#version 300 es
precision mediump float;

uniform mat4 u_modelInverseTranspose;
uniform vec3 u_cameraPosition;
uniform vec3 Ia;
uniform vec3 Ka;
uniform vec3 Kd;
uniform vec3 Ks;
uniform float Ns;
uniform int num_lights;
uniform int has_tex;
uniform int has_norm;
uniform int movelights;
uniform mat4 u_transform;

uniform sampler2D uTexture;
uniform sampler2D uNormalMap;

struct lightSource
{
    int type;
    vec3 pos_or_direction;
    vec3 Id;
    vec3 Is;
};

uniform lightSource lights[10];
in vec3 v_color;
in vec3 v_normal;
in highp vec2 vTextureCoord;
in vec3 model_pos;
in mat3 vTBN;
// Final color
out vec4 out_color;

void main() {
    vec3 lightDir;
    vec3 pos;
    vec3 texcolor;
    vec3 normal;
    if(has_norm == 1) {
        normal = texture(uNormalMap, vTextureCoord).xyz;
        normal = normal * 2.0 - 1.0;
        normal = normalize(vTBN * normal);
        // normal = -normal;
        // normal = normalize(vec3(u_modelInverseTranspose*vec4(normal,1.0)));
    } else {
        normal = normalize(vec3(u_modelInverseTranspose*vec4(v_normal,1.0)));
    }
    // vec3 normal = normalize(vec3(u_modelInverseTranspose*vec4(v_normal,1.0)));
    vec3 cameraDir = normalize(u_cameraPosition - model_pos);

    vec3 ambient = Ka * Ia;
    vec3 res = ambient;
    
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
    if(has_tex == 1) {
        texcolor = texture(uTexture, vTextureCoord).xyz;
        res = res * texcolor;
    } else {
        res = res * v_color;
    }

    out_color = vec4(res, 1.0);
}