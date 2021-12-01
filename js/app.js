'use strict'

import Input from "./input.js"
import AppState from "./appstate.js"
import Shader from "./shader.js"
import { OrbitMovement } from "./movement.js"

class App
{

    constructor( scene )
    {

        console.log( "Initializing App" )

        // canvas & gl
        this.canvas = document.getElementById( "canvas" )
        this.canvas.addEventListener( "contextmenu", event => event.preventDefault( ) );
        this.canvas.width = this.canvas.clientWidth
        this.canvas.height = this.canvas.clientHeight
        this.gl = this.initGl( )

        // save the scene
        this.scene = scene.scene

        // shaders
        console.log( "Loading Shaders" )
        this.flat_shader = new Shader( this.gl, "../shaders/flat.vert.glsl", "../shaders/flat.frag.glsl" )
        this.wireframe_shader = new Shader( this.gl, "../shaders/wireframe.vert.glsl", "../shaders/wireframe.frag.glsl" )
        this.phong_shader = new Shader( this.gl, "../shaders/phong.vert.glsl", "../shaders/phong.frag.glsl" )
        this.gouraud_shader = new Shader( this.gl, "../shaders/gouraud.vert.glsl", "../shaders/gouraud.frag.glsl" )
        this.shader = this.phong_shader

        // camera
        this.camera = scene.camera
        this.lights = []
        this.ambient_light = scene.lights.ambient
        for(let light of scene.lights.point_lights) {
            this.lights.push(light)
        }
        for(let light of scene.lights.directional_lights) {
            this.lights.push(light)
        }
        this.initCamera()

        // movement
        this.movement = new OrbitMovement( this, 1 )

        // resize handling
        this.resizeToDisplay( )
        window.onresize = this.resizeToDisplay.bind( this )

        // app state
        this.app_state = new AppState( this )
    }

    /**
     * Initialize the camera and update settings
     */
    initCamera( )
    {
        this.camera.aspect = this.canvas.width / this.canvas.height
        this.camera.canvas_height = this.canvas.height
        this.camera.canvas_width = this.canvas.width
        this.camera.update( )
    }

    /** 
     * Resizes camera and canvas to pixel-size-corrected display size
     */
    resizeToDisplay( )
    {

        this.canvas.width = this.canvas.clientWidth
        this.canvas.height = this.canvas.clientHeight
        this.camera.canvas_height = this.canvas.height
        this.camera.canvas_width = this.canvas.width
        this.camera.aspect = this.canvas.width / this.canvas.height
        this.camera.update( )

    }

    /**
     * Initializes webgl2 with settings
     * @returns { WebGL2RenderingContext | null }
     */
    initGl( )
    {

        let gl = this.canvas.getContext( "webgl2" )

        if ( !gl )
        {
            alert( "Could not initialize WebGL2." )
            return null
        }

        gl.enable( gl.CULL_FACE ); // Turn on culling. By default backfacing triangles will be culled.
        gl.enable( gl.DEPTH_TEST ); // Enable the depth buffer
        gl.clearDepth( 1.0 );
        gl.clearColor( 1, 1, 1, 1 );
        gl.depthFunc( gl.LEQUAL ); // Near things obscure far things

        return gl
    }

    /**
     * Starts render loop
     */
    start( )
    {

        requestAnimationFrame( ( ) =>
        {

            this.update( )

        } )

    }

    /**
     * Called every frame, triggers input and app state update and renders a frame
     */
    update( )
    {

        this.app_state.update( )
        this.movement.update( )
        Input.update( )
        this.render( )
        requestAnimationFrame( ( ) =>
        {

            this.update( )

        } )

    }

    /**
     * Main render loop
     */
    render( )
    {

        // clear the screen
        this.gl.viewport( 0, 0, this.canvas.width, this.canvas.height )
        this.gl.clear( this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT )

        this._render( this.scene )

    }

    /**
     * Recursively renders the SceneNode hierarchy
     * 
     * @param {SceneNode} node node to render and process
     */
    _render( node )
    {
        this.shader.use( )

        // Projection
        const mvp = mat4.mul(
            mat4.create( ),
            this.camera.vp( ),
            node.getTransform( ) )
        let invTransposeModel = mat4.invert(mat4.create(),mat4.transpose(mat4.create, node.getTransform( )));
        this.shader.setUniform4x4f( "u_model", node.getTransform( ) );
        this.shader.setUniform4x4f( "u_modelInverseTranspose", invTransposeModel );
        this.shader.setUniform4x4f( "u_mvp_matrix", mvp );
        this.shader.setUniform3f("u_cameraPosition", this.camera.position);
        let num_lights = this.lights.length
        this.shader.setUniform1i("num_lights", num_lights)
        this.shader.setUniform3f("Ia", vec3.fromValues(this.ambient_light[0],this.ambient_light[1],this.ambient_light[2]))
        this.shader.setUniform4x4f( "u_transform",this.scene.transform);
        //console.log(this.ambient_light[0])
        for(let index = 0; index < this.lights.length; index++) {
            this.shader.setUniform3f(`lights[${index}].pos_or_direction`, vec3.fromValues(this.lights[index].position[0],this.lights[index].position[1],this.lights[index].position[2]));
            this.shader.setUniform3f(`lights[${index}].Id`, vec3.fromValues(this.lights[index].diffuse[0],this.lights[index].diffuse[1],this.lights[index].diffuse[2]));
            this.shader.setUniform3f(`lights[${index}].Is`, vec3.fromValues(this.lights[index].specular[0],this.lights[index].specular[1],this.lights[index].specular[2]));
            if(this.lights[index].type === "point") {
                this.shader.setUniform1i(`lights[${index}].type`, 1);
            } else {
                this.shader.setUniform1i(`lights[${index}].type`, 0);
            }
        }
        if(node.type == "object") {
            this.shader.setUniform1f("Ns", node.Ns)
            this.shader.setUniform3f("Ka", node.Ka)
            this.shader.setUniform3f("Kd", node.Kd)
            this.shader.setUniform3f("Ks", node.Ks)
            node.render( this.gl, this.shader )
        }

        for ( let child of node.children )
            this._render( child )
    }

}

export default App
