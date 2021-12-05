'use strict'

import SceneNode from "./scenenode.js";
import {loadTexture} from "./utils.js"

class ObjectNode extends SceneNode
{

    constructor( vbo_data, name, parent, translation = vec3.create( ), rotation = vec3.create( ), scale = vec3.fromValues( 1, 1, 1 ), materials = [[1.0, 1.0, 1.0],[0.6, 0.6, 0.6],[0.5, 0.5, 0.5],32], texture = null, normal = null)
    {
        super( name, parent, translation, rotation, scale )

        this.type = "object"
        this.vbo_data = new Float32Array( vbo_data )
        this.vbo = null
        this.Ka = vec3.fromValues(materials[0][0], materials[0][1], materials[0][2])
        this.Kd = vec3.fromValues(materials[1][0], materials[1][1], materials[1][2])
        this.Ks = vec3.fromValues(materials[2][0], materials[2][1], materials[2][2])
        this.Ns = parseFloat(materials[3])
        this.texture_file = texture
        this.texture = null
        this.normal_file = normal
        this.normal_map = null
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

    loadText( gl )
    {
        if(this.texture_file != null)
            this.texture = loadTexture(gl, this.texture_file)
    }

    loadNorm( gl )
    {
        if(this.normal_file != null)
            this.normal_map = loadTexture(gl, this.normal_file)
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
        
        if ( this.texture == null )
            this.loadText( gl )
        
        if ( this.normal_map == null )
            this.loadNorm( gl )
        
        // let stride = (3*3 + 2 + 6) * 4,
        let stride = (3*3 + 2 + 6) * 4,
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

        offset = 3 * 3 * 4
        attrib_loc = shader.getAttributeLocation( "aTextureCoord" )
        if (attrib_loc >= 0) {
            gl.vertexAttribPointer( shader.getAttributeLocation( "aTextureCoord" ), 2, gl.FLOAT, false, stride, offset )
            gl.enableVertexAttribArray( shader.getAttributeLocation( "aTextureCoord" ) )
        }

        offset = (9 + 2) * 4
        attrib_loc = shader.getAttributeLocation( "aVertexTangent" )
        if (attrib_loc >= 0) {
            gl.vertexAttribPointer( shader.getAttributeLocation( "aVertexTangent" ), 3, gl.FLOAT, false, stride, offset )
            gl.enableVertexAttribArray( shader.getAttributeLocation( "aVertexTangent" ) )
        }

        offset = (9 + 2 + 3) * 4
        attrib_loc = shader.getAttributeLocation( "aVertexBiTangent" )
        if (attrib_loc >= 0) {
            gl.vertexAttribPointer( shader.getAttributeLocation( "aVertexBiTangent" ), 3, gl.FLOAT, false, stride, offset )
            gl.enableVertexAttribArray( shader.getAttributeLocation( "aVertexBiTangent" ) )
        }
        
        // use the texture unit specified by texId
        gl.activeTexture(gl.TEXTURE0);
        // bind the texture to the texture unit
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        //console.log(this.texture_file)
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, this.normal_map);

        gl.drawArrays( gl.TRIANGLES, 0, this.vbo_data.length / 17 )

    }
}

export default ObjectNode
