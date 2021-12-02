'use strict'

import Input from "./input.js"
import {PerspectiveCamera, OrthographicCamera} from "./camera.js"
import {OrbitMovement, RaycastMovement} from './movement.js'
import {rgb2hex, hex2rgb} from "./utils.js"

class AppState
{

    constructor( app )
    {

        this.app = app
        this.is_selecting = false
        this.light_index = 0
        this.selected_light = app.lights[0]
        this.ambient_light = app.ambient_light
        // get list of ui indicators
        this.ui_categories = {

            "camera_mode":
            {

                "fps": document.getElementById( "fpsCamMode" ),
                "stationary": document.getElementById( "statCamMode" )

            },
            "projection_mode":
            {

                "perspective": document.getElementById( "perspProjMode" ),
                "orthographic": document.getElementById( "orthoProjMode" )

            },
            "selection":
            {

                "raycasting": document.getElementById( "selectionRaycasting" ),
                "target": document.getElementById( "selectionTarget" )

            },
            "shading":
            {

                "wireframe": document.getElementById( "wireframeShading" ),
                "flat": document.getElementById( "flatShading" ),
                "phong": document.getElementById( "phongShading" ),
                "gouraud": document.getElementById( "gouraudShading" )
            }

        }

        // update ui with default values
        this.updateUI( "camera_mode", "stationary" )
        this.updateUI( "shading", "phong" )
        this.updateUI( "projection_mode", "perspective" )
        this.updateUI( "selection", "target" )
        // light picker elements
        this.ia_pick = document.getElementById("ambient")
        this.id_pick = document.getElementById("diffuse")
        this.is_pick = document.getElementById("specular")
        this.lpos_pickx = document.getElementById("pos_x")
        this.lpos_picky = document.getElementById("pos_y")
        this.lpos_pickz = document.getElementById("pos_z")
        this.light_elem = document.getElementById("active_light")
        this.light_elem.innerHTML = `light type: ${this.selected_light.type} light id: ${this.light_index+1}`

        // handle events
        let _self = this
        function changeIa(event) {
            if(_self.app.ambient_light != null) {
                let color_ = hex2rgb(this.value)
                _self.app.ambient_light = vec3.fromValues(color_[0], color_[1], color_[2])
                console.log(_self.app.ambient_light)
            }
        }
        function changeId(event) {
            if(_self.selected_light != null) {
                let color_ = hex2rgb(this.value)
                _self.selected_light.diffuse = vec3.fromValues(color_[0], color_[1], color_[2])
            }
        }
        function changeIs(event) {
            if(_self.selected_light != null) {
                let color_ = hex2rgb(this.value)
                _self.selected_light.specular = vec3.fromValues(color_[0], color_[1], color_[2])
            }
        }
        function changePosDirX(event) {
            if(_self.selected_light != null) {
                _self.selected_light.position[0] = parseInt(this.value)
            }
        }
        function changePosDirY(event) {
            if(_self.selected_light != null) {
                _self.selected_light.position[1] = parseInt(this.value)
            }
        }
        function changePosDirZ(event) {
            if(_self.selected_light != null) {
                _self.selected_light.position[2] = parseInt(this.value)
            }
        }
        this.textflag = 0
        this.lpos_pickx.onkeydown = function(e){
            if ( e.target.nodeName == 'INPUT' ) {
                _self.textflag = 1
            }
        }
        this.lpos_pickx.onkeyup = function(e){
            if ( e.target.nodeName == 'INPUT' ) {
                _self.textflag = 0
            }
        }
        this.lpos_picky.onkeydown = function(e){
            if ( e.target.nodeName == 'INPUT' ) {
                _self.textflag = 1
            }
        }
        this.lpos_picky.onkeyup = function(e){
            if ( e.target.nodeName == 'INPUT' ) {
                _self.textflag = 0
            }
        }
        this.lpos_pickz.onkeydown = function(e){
            if ( e.target.nodeName == 'INPUT' ) {
                _self.textflag = 1
            }
        }
        this.lpos_pickz.onkeyup = function(e){
            if ( e.target.nodeName == 'INPUT' ) {
                _self.textflag = 0
            }
        }
        
        // handle events
        this.ia_pick.addEventListener('input', changeIa)
        this.id_pick.addEventListener('input', changeId)
        this.is_pick.addEventListener('input', changeIs)
        this.lpos_pickx.addEventListener('change', changePosDirX)
        this.lpos_picky.addEventListener('change', changePosDirY)
        this.lpos_pickz.addEventListener('change', changePosDirZ)

        // INIT set color picker to current light values
        let Ia = rgb2hex(Math.floor(this.ambient_light[0]*255), Math.floor(this.ambient_light[1]*255), Math.floor(this.ambient_light[2]*255))
        let Id = rgb2hex(Math.floor(this.selected_light.diffuse[0]*255), Math.floor(this.selected_light.diffuse[1]*255), Math.floor(this.selected_light.diffuse[2]*255))
        let Is = rgb2hex(Math.floor(this.selected_light.specular[0]*255), Math.floor(this.selected_light.specular[1]*255), Math.floor(this.selected_light.specular[2]*255))
        this.ia_pick.value = Ia
        this.id_pick.value = Id
        this.is_pick.value = Is
        // INIT set coords to current value
        this.lpos_pickx.value = this.selected_light.position[0]
        this.lpos_picky.value = this.selected_light.position[1]
        this.lpos_pickz.value = this.selected_light.position[2]

    }

    /**
     * Updates the app state by checking the input module for changes in user input
     */
    update( )
    {

        // Shading Input
        // console.log(this.textflag)
        if(!this.textflag) {
            if ( Input.isKeyDown( "1" ) ) {
                this.app.shader = this.app.wireframe_shader
                this.updateUI("shading", "wireframe")
            } else if ( Input.isKeyDown( "2" ) ) {
                this.app.shader = this.app.flat_shader
                this.updateUI("shading", "flat")
            } else if ( Input.isKeyDown( "3" ) ) {
                this.app.shader = this.app.phong_shader
                this.updateUI("shading", "phong")
            } else if ( Input.isKeyDown( "4" ) ) {
                this.app.shader = this.app.gouraud_shader
                this.updateUI("shading", "gouraud")
            }
        }
        
        // Camera Input
        if ( Input.isKeyDown( "o" ) ) {
            this.app.camera = new OrthographicCamera(this.app.camera.position, this.app.camera.look_at, this.app.camera.up, this.app.camera.fovy, this.app.camera.aspect, this.app.camera.near, this.app.camera.far)
            this.app.movement.camera = this.app.camera
            this.app.initCamera()
            this.updateUI("projection_mode", "orthographic")
        } else if ( Input.isKeyDown( "p" ) ) {
            this.app.camera = new PerspectiveCamera(this.app.camera.position, this.app.camera.look_at, this.app.camera.up, this.app.camera.fovy, this.app.camera.aspect, this.app.camera.near, this.app.camera.far)
            this.app.movement.camera = this.app.camera
            this.app.initCamera()
            this.updateUI("projection_mode", "perspective")
        }

        // Raycasting
        if ( Input.isKeyPressed( "r" ) && !this.is_selecting) {
            console.log("Raycast on")
            this.app.movement = new RaycastMovement(this.app)
            this.updateUI("selection", "raycasting")
            this.is_selecting = true
        } else if (Input.isKeyPressed( "r" ) && this.is_selecting) {
            this.app.movement.release()
            this.app.movement = new OrbitMovement(this.app)
            this.updateUI("selection", "target", "No Target Selected")
            this.is_selecting = false
        }

        if (this.is_selecting && this.app.movement.selected_object)
            this.updateUI("selection", "target", "Selected '"+this.app.movement.selected_object.name+"'")

        // Change light
        if( Input.isKeyPressed( "q" )) {
            if(this.light_index < this.app.lights.length-1){
                this.light_index++
            } else {
                this.light_index = 0
            }
            this.selected_light = this.app.lights[this.light_index]
            this.light_elem.innerHTML = `light type: ${this.selected_light.type} light id: ${this.light_index+1}`

            let Ia = rgb2hex(Math.floor(this.ambient_light[0]*255), Math.floor(this.ambient_light[1]*255), Math.floor(this.ambient_light[2]*255))
            let Id = rgb2hex(Math.floor(this.selected_light.diffuse[0]*255), Math.floor(this.selected_light.diffuse[1]*255), Math.floor(this.selected_light.diffuse[2]*255))
            let Is = rgb2hex(Math.floor(this.selected_light.specular[0]*255), Math.floor(this.selected_light.specular[1]*255), Math.floor(this.selected_light.specular[2]*255))
            this.ia_pick.value = Ia
            this.id_pick.value = Id
            this.is_pick.value = Is

            this.lpos_pickx.value = this.selected_light.position[0]
            this.lpos_picky.value = this.selected_light.position[1]
            this.lpos_pickz.value = this.selected_light.position[2]
        }
    }

    /**
     * Updates the ui to represent the current interaction
     * @param { String } category The ui category to use; see this.ui_categories for reference
     * @param { String } name The name of the item within the category
     * @param { String | null } value The value to use if the ui element is not a toggle; sets the element to given string 
     */
    updateUI( category, name, value = null )
    {

        for ( let key in this.ui_categories[ category ] )
        {

            this.updateUIElement( this.ui_categories[ category ][ key ], key == name, value )

        }

    }

    /**
     * Updates a single ui element with given state and value
     * @param { Element } el The dom element to update
     * @param { Boolean } state The state (active / inactive) to update it to
     * @param { String | null } value The value to use if the ui element is not a toggle; sets the element to given string 
     */
    updateUIElement( el, state, value )
    {

        el.classList.remove( state ? "inactive" : "active" )
        el.classList.add( state ? "active" : "inactive" )

        if ( state && value != null )
            el.innerHTML = value

    }

}

export default AppState
