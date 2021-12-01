'use strict'

import SceneNode from "./scenenode.js";

class ObjectNode extends SceneNode
{

    constructor( vbo_data, name, parent, translation = vec3.create( ), rotation = vec3.create( ), scale = vec3.fromValues( 1, 1, 1 ), materials = [[1.0, 1.0, 1.0],
        [0.6, 0.6, 0.6], 
        [0.5, 0.5, 0.5], 
        32] )
    {

        super( name, parent, translation, rotation, scale )

        this.type = "object"
        this.vbo_data = new Float32Array( vbo_data )
        this.vbo = null
        this.Ka = vec3.fromValues(materials[0][0], materials[0][1], materials[0][2])
        this.Kd = vec3.fromValues(materials[1][0], materials[1][1], materials[1][2])
        this.Ks = vec3.fromValues(materials[2][0], materials[2][1], materials[2][2])
        this.Ns = parseFloat(materials[3])
        console.log(this.Ka)
    }

    update( )
    {

        super.update( )

    }

    getWorldSpaceTriangles() {
        let triangles = []

        for(let i = 0; i < this.vbo_data.length; i += 27) {
            let offset = 0
            let triangle = []
            for (let j = 0; j < 3; j++) {
                offset = j*9
                let v = vec3.fromValues(this.vbo_data[offset + i], this.vbo_data[offset + i+1], this.vbo_data[offset + i+2])
                v = vec3.transformMat4(v, v, this.getTransform())
                triangle.push(v)
            }

            triangles.push(triangle)
        }

        return triangles
    }

    createBuffers( gl )
    {
        this.vbo = gl.createBuffer( );
        gl.bindBuffer( gl.ARRAY_BUFFER, this.vbo )
        gl.bufferData( gl.ARRAY_BUFFER, this.vbo_data, gl.STATIC_DRAW )
    }

    render( gl, shader )
    {

        if ( this.vbo == null )
            this.createBuffers( gl )

        let stride = 3 * 3 * 4,
            offset = 0
        let attrib_loc;
        gl.bindBuffer( gl.ARRAY_BUFFER, this.vbo )
        attrib_loc = shader.getAttributeLocation( "a_position" )
        if (attrib_loc >= 0) {
            gl.vertexAttribPointer( shader.getAttributeLocation( "a_position" ), 3, gl.FLOAT, false, stride, offset )
            gl.enableVertexAttribArray( shader.getAttributeLocation( "a_position" ) )
        }

        offset = 3 * 4
        attrib_loc = shader.getAttributeLocation( "a_color" )
        if (attrib_loc >= 0) {
            gl.vertexAttribPointer( shader.getAttributeLocation( "a_color" ), 3, gl.FLOAT, false, stride, offset )
            gl.enableVertexAttribArray( shader.getAttributeLocation( "a_color" ) )
        }

        offset = 2 * 3 * 4
        attrib_loc = shader.getAttributeLocation( "a_normal" )
        if (attrib_loc >= 0) {
            gl.vertexAttribPointer( shader.getAttributeLocation( "a_normal" ), 3, gl.FLOAT, false, stride, offset )
            gl.enableVertexAttribArray( shader.getAttributeLocation( "a_normal" ) )
        }

        gl.drawArrays( gl.TRIANGLES, 0, this.vbo_data.length / 9 )

    }
}

export default ObjectNode
