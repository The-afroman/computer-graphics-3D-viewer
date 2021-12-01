class light
{
    constructor(position, ambient, diffuse, specular, type) {
        this.position = position;
        this.ambient = ambient;
        this.diffuse = diffuse;
        this.specular = specular;
        this.point_lights = [];
        this.directional_lights = [];
        this.type = type;
    }
}

export default light