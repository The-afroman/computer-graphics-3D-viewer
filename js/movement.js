'use strict'

import Input from "./input.js"
import {unproject, rayIntersectsTriangle} from "./raycaster.js"
import {deg2rad, hex2rgb, rgb2hex} from "./utils.js"

class OrbitMovement
{

    constructor( app, speed = 1.0 )
    {
        this.app = app
        this.scene = app.scene
        this.camera = app.camera
        this.speed = speed
        this.mouseover = false;
    }

    update( )
    {
        this.updateMouse( )
    }

    updateMouse( )
    {
        if(isFinite(Input.getMouseDy( ))) {
            let scale = vec3.fromValues( 1, 1, 1 )
            let rotation = vec3.create( )

            if ( Input.isMouseDown( 0 ))
            {
                rotation = vec3.fromValues( -Input.getMouseDy( ) * this.speed, Input.getMouseDx( ) * this.speed, 0 )
            }

            if ( Input.isMouseDown( 2 ) )
            {
                let s = Input.getMouseDy( ) * this.speed * 0.01
                scale = vec3.add(scale, scale, vec3.fromValues( s, s, s))
            }

            this.scene.transform = mat4.mul(this.scene.transform, this.scene.transform,  mat4.fromYRotation(mat4.create(), deg2rad(rotation[1])))
            this.scene.transform = mat4.mul(this.scene.transform, mat4.fromXRotation(mat4.create(), deg2rad(rotation[0])), this.scene.transform)
            this.scene.transform = mat4.mul(this.scene.transform, this.scene.transform, mat4.fromScaling(mat4.create(), scale))
        }

    }

}

class RaycastMovement {
    constructor( app, speed = 0.5 ) {
        this.app = app
        this.camera = app.camera
        this.scene = app.scene

        this.speed = speed

        this.selected_object = null
        this.ka_pick = document.getElementById("ka")
        this.kd_pick = document.getElementById("kd")
        this.ks_pick = document.getElementById("ks")
        let _self = this
        function changeKa(event) {
            if(_self.selected_object != null) {
                let color_ = hex2rgb(this.value)
                _self.selected_object.Ka = vec3.fromValues(color_[0], color_[1], color_[2])
            }
        }
        function changeKd(event) {
            if(_self.selected_object != null) {
                let color_ = hex2rgb(this.value)
                _self.selected_object.Kd = vec3.fromValues(color_[0], color_[1], color_[2])
            }
        }
        function changeKs(event) {
            if(_self.selected_object != null) {
                let color_ = hex2rgb(this.value)
                _self.selected_object.Ks = vec3.fromValues(color_[0], color_[1], color_[2])
            }
        }
        this.changeKa = changeKa
        this.changeKd = changeKd
        this.changeKs = changeKs
        this.ka_pick.addEventListener('input', changeKa)
        this.kd_pick.addEventListener('input', changeKd)
        this.ks_pick.addEventListener('input', changeKs)
    }

    release() {
        this.ka_pick.removeEventListener('input', this.changeKa)
        this.kd_pick.removeEventListener('input', this.changeKd)
        this.ks_pick.removeEventListener('input', this.changeKs)
    }

    update() {

        if (this.selected_object == null) {
            this.updateSelection()
        } else {
            this.updateTransformation()
        }
    }

    updateSelection()
    {
        if (Input.isMouseClicked( 0 ) ) {
            this.selected_object = this.castRay(Input.mousex, Input.mousey, this.camera.position)
            if (this.selected_object != null) {
                console.log("Selected object " + this.selected_object.name)
                let Ka = rgb2hex(Math.floor(this.selected_object.Ka[0]*255), Math.floor(this.selected_object.Ka[1]*255), Math.floor(this.selected_object.Ka[2]*255))
                let Kd = rgb2hex(Math.floor(this.selected_object.Kd[0]*255), Math.floor(this.selected_object.Kd[1]*255), Math.floor(this.selected_object.Kd[2]*255))
                let Ks = rgb2hex(Math.floor(this.selected_object.Ks[0]*255), Math.floor(this.selected_object.Ks[1]*255), Math.floor(this.selected_object.Ks[2]*255))
                this.ka_pick.value = Ka
                this.kd_pick.value = Kd
                this.ks_pick.value = Ks
            }
        }
    }

    updateTransformation()
    {
        let translation = vec3.create( )
        let rotation = mat4.create( )
        let scale = vec3.fromValues( 1, 1, 1)

        if( isFinite(Input.getMouseDy( )) ) {
            if ( Input.isMouseDown( 0 ) )
            {
                let q = quat.fromEuler( quat.create( ), -Input.getMouseDy( ) * this.speed, Input.getMouseDx( ) * this.speed, 0 )
                rotation = mat4.fromQuat( rotation, q )
            }

            if ( Input.isMouseDown( 1 ) )
            {
                let s = Input.getMouseDy( ) * this.speed * 0.01
                scale = vec3.add(scale, scale, vec3.fromValues( s, s, s ))
            }

            if ( Input.isMouseDown( 2 ) )
            {
                translation = vec3.fromValues( -Input.getMouseDx( ) * this.speed * 0.1, 0, -Input.getMouseDy( ) * this.speed * 0.1 )
            }

            this.selected_object.transform = mat4.mul(this.selected_object.transform, mat4.fromTranslation(mat4.create(), translation), this.selected_object.transform )
            this.selected_object.transform = mat4.mul(this.selected_object.transform, this.selected_object.transform, rotation)
            this.selected_object.transform = mat4.mul(this.selected_object.transform, this.selected_object.transform, mat4.fromScaling(mat4.create(), scale))
        }
    }

    castRay(x, y, eye)
    {
        let ray = unproject([x, y], [0,0,this.app.gl.canvas.width, this.app.gl.canvas.height], this.camera.invP(), this.camera.invV());

        let out = {
            'node': null,
            'dist': 0
        }

        
        if (this._intersect(eye, ray, this.scene, out))
            console.log(out['node'].name)

        return out['node']
    }

    _intersect(eye, ray, node, best) {
        if (node.type == 'object') {
            for (let triangle of node.getWorldSpaceTriangles()) {

                let hit = vec3.create()
                if (rayIntersectsTriangle(eye, ray, triangle, hit)) {

                    let dist = vec3.distance(eye, hit)

                    if (best['node'] == null || dist < best['dist']) {
                        best['node'] = node
                        best['dist'] = dist
                    }
                    break;

                }
            }
        }

        for (let child of node.children)
            this._intersect(eye, ray, child, best)

        return best['node'] != null
    }
}

export
{
    OrbitMovement,
    RaycastMovement
}