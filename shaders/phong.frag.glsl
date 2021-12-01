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
uniform mat4 u_transform;

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
in vec3 model_pos;
// Final color
out vec4 out_color;

void main() {
    
    vec3 normal = normalize(vec3(u_modelInverseTranspose*vec4(v_normal,1.0)));
    vec3 cameraDir = normalize(u_cameraPosition - model_pos);
    

    vec3 ambient = Ka * Ia;
    vec3 res = ambient * v_color;
    vec3 lightDir;
    vec3 pos;
    for(int index = 0; index < num_lights; index<index++)
    {
        // point vs directional light
        pos = vec3(u_transform * vec4(lights[index].pos_or_direction,1));
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

    out_color = vec4(res, 1.0);
}