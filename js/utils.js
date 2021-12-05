'use strict'

import SceneNode from "./scenenode.js"
import ObjectNode from "./object.js"
import {PerspectiveCamera, OrthographicCamera} from "./camera.js"
import light from "./light.js"

var numTextures = 0

// function borrowed from https://observablehq.com/@davidbauer/normal-mapping?collection=@davidbauer/ecs175
function calculateTangentSpace(vertices, uvs, vertex_ids, tex_ids)
{

    let tangents = new Array(vertices.length)
    let bitangents = new Array(vertices.length)
    
    for (let i = 0; i < vertex_ids.length; i+=3) {
        const vid = ( vertex_ids[ i ] * 3 )
        const vid1 = ( vertex_ids[ i+1 ] * 3 )
        const vid2 = ( vertex_ids[ i+2 ] * 3 )
        const tid = ( tex_ids[ i ] * 2 )
        const tid1 = ( tex_ids[ i+1 ] * 2 )
        const tid2 = ( tex_ids[ i+2 ] * 2 )
        // let idxv = i*3
        // let idxuv = i*2
        
        let v0 = vec3.fromValues(vertices[vid], vertices[vid+1], vertices[vid+2])
        let v1 = vec3.fromValues(vertices[vid1], vertices[vid1+1], vertices[vid1+2])
        let v2 = vec3.fromValues(vertices[vid2], vertices[vid2+1], vertices[vid2+2])
        //console.log("V", v0, v1, v2)

        let uv0 = vec2.fromValues(uvs[tid], uvs[tid+1])
        let uv1 = vec2.fromValues(uvs[tid1], uvs[tid1+1])
        let uv2 = vec2.fromValues(uvs[tid2], uvs[tid2+1])
        //console.log("UV", uv0, uv1, uv2)

        let dv1 = vec3.sub(vec3.create(), v1, v0);
        let dv2 = vec3.sub(vec3.create(), v2, v0);
        //console.log("DV", dv1, dv2)

        let duv1 = vec2.sub(vec3.create(), uv1, uv0);
        let duv2 = vec2.sub(vec3.create(), uv2, uv0);
        //console.log("DUV", duv1, duv2)

        let r = 1.0 / (duv1[0] * duv2[1] - duv1[1] * duv2[0])
        //console.log("R", r)
        let tangent = vec3.scale(vec3.create(), 
                                    vec3.sub(vec3.create(), 
                                        vec3.scale(vec3.create(), dv1, duv2[1]),
                                        vec3.scale(vec3.create(), dv2, duv1[1]), 
                                    ), r)
        //console.log("TAN", tangent)
        
        let bitangent = vec3.scale(vec3.create(), 
                                    vec3.sub(vec3.create(), 
                                        vec3.scale(vec3.create(), dv2, duv1[0]),
                                        vec3.scale(vec3.create(), dv1, duv2[0]), 
                                    ), r)

        //console.log("BITAN", bitangent)
        tangents[vid] = tangent[0]
        tangents[vid+1] = tangent[1]
        tangents[vid+2] = tangent[2]
        bitangents[vid] = bitangent[0]
        bitangents[vid+1] = bitangent[1]
        bitangents[vid+2] = bitangent[2]

        tangents[vid1] = tangent[0]
        tangents[vid1+1] = tangent[1]
        tangents[vid1+2] = tangent[2]
        bitangents[vid1] = bitangent[0]
        bitangents[vid1+1] = bitangent[1]
        bitangents[vid1+2] = bitangent[2]

        tangents[vid2] = tangent[0]
        tangents[vid2+1] = tangent[1]
        tangents[vid2+2] = tangent[2]
        bitangents[vid2] = bitangent[0]
        bitangents[vid2+1] = bitangent[1]
        bitangents[vid2+2] = bitangent[2]
    }
  
    return [tangents, bitangents]
  }


// Function borrowed from: https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Using_textures_in_WebGL
function isPowerOf2(value){
    return (value & (value - 1)) == 0;
}

// Function borrowed from: https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Using_textures_in_WebGL
function loadTexture(gl, url) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
  
    // Because images have to be downloaded over the internet
    // they might take a moment until they are ready.
    // Until then put a single pixel in the texture so we can
    // use it immediately. When the image has finished downloading
    // we'll update the texture with the contents of the image.
    const level = 0;
    const internalFormat = gl.RGBA;
    const width = 1;
    const height = 1;
    const border = 0;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;
    const pixel = new Uint8Array([255, 0, 0, 255]);  // opaque red
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                  width, height, border, srcFormat, srcType,
                  pixel);
  
    const image = new Image();
    image.onload = function() {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                    srcFormat, srcType, image);
  
      // WebGL1 has different requirements for power of 2 images
      // vs non power of 2 images so check if the image is a
      // power of 2 in both dimensions.
      if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
         // Yes, it's a power of 2. Generate mips.
         gl.generateMipmap(gl.TEXTURE_2D);
      } else {
         // No, it's not a power of 2. Turn off mips and set
         // wrapping to clamp to edge
         gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
         gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
         gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      }
    };
    image.src = url;
  
    return texture;
  }


/**
 * Clamps a number between two numbers
 * @param { Number } number The number to clamp
 * @param { Number } min The minimum used for clamping
 * @param { Number } max The maximum used for clamping
 * @returns { Number } The clamped number
 */
function clamp( number, min, max )
{

    return Math.max( min, Math.min( number, max ) )

}

/**
 * Converts degrees to radians
 * @param { Number } deg The number in degrees
 * @returns { Number }The angle in radians
 */
function deg2rad( deg )
{

    return ( deg * Math.PI ) / 180

}

function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

/**
 * Converts an rgb color array to a hex string
 * @param { int } r r component of color
 * @param { int } g g component of color
 * @param { int } b b component of color
 * @returns { Array<number> } The color as normalized values
 */
function rgb2hex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

/**
 * Converts a hex color string to a normalized rgba array
 * @param { String } hex The hex color as a string
 * @returns { Array<number> } The color as normalized values
 */
function hex2rgb( hex )
{

    let rgb = hex.match( /\w\w/g )
        .map( x => parseInt( x, 16 ) / 255 )
    return vec3.fromValues( rgb[ 0 ], rgb[ 1 ], rgb[ 2 ] )

}

/**
 * Returns the mouse coordinates relative to a clicking target, in our case the canvas
 * @param event The mouse click event
 * @returns { { x: number, y: number } } The x and y coordinates relative to the canvas
 */
 function getRelativeMousePosition( event )
 {
 
     let target = event.target
 
     // if the mouse is not over the canvas, return invalid values
     if ( target.id != 'canvas' )
     {
 
         return {
 
             x: -Infinity,
             y: +Infinity,
 
         }
 
     }
 
     target = target || event.target;
     let rect = target.getBoundingClientRect( );
 
     return {
 
         x: event.clientX - rect.left,
         y: event.clientY - rect.top,
 
     }
 
 }

/**
 * Loads a given URL; this is used to load the shaders from file
 * @param { String } url The relative url to the file to be loaded
 * @returns { String | null } The external file as text
 */
function loadExternalFile( url )
{

    let req = new XMLHttpRequest( )
    req.open( "GET", url, false )
    req.send( null )
    return ( req.status == 200 ) ? req.responseText : null

}

function parseMTL( entry, material ) {
    const elements = entry.split( ' ' )
    console.log(elements)
    let raw = loadExternalFile("../objects/"+elements[1])
    let Ka, Kd, Ks, Ns
    for ( let line of raw.split( '\n' ) ) {
        switch(line.split( ' ' )[ 0 ]) {
            case 'Ka':
                Ka = [parseFloat(line.split( ' ' )[1]), parseFloat(line.split( ' ' )[2]), parseFloat(line.split( ' ' )[3])]
                console.log(Ka)
                break
            case 'Kd':
                Kd = [parseFloat(line.split( ' ' )[1]), parseFloat(line.split( ' ' )[2]), parseFloat(line.split( ' ' )[3])]
                break
            case 'Ks':
                Ks = [parseFloat(line.split( ' ' )[1]), parseFloat(line.split( ' ' )[2]), parseFloat(line.split( ' ' )[3])]
                break
            case 'Ns':
                Ns = parseFloat(line.split( ' ' )[1])
                break
        }
    }
    material.push(Ka, Kd, Ks, Ns)
    console.log(material)
}

/**
 * Loads a given .obj file and builds an object from it with vertices, colors and normals
 * @param { String } url The url to the file
 * @param { Array.<Number> } fallback_color A default color to use if the OBJ does not define vertex colors
 * @returns { Array.<Number> } The complete, interleaved vertex buffer object containing vertices, colors and normals
 */
function loadObjFile( url, fallback_color, material )
{

    let raw = loadExternalFile( url )

    let vertices = [ ]
    let colors = [ ]
    let normals = [ ]
    let texcoords = [ ]
    let vertex_ids = [ ]
    let texcoord_ids = [ ]
    let normal_ids = [ ]
    let normal_map = new Map()

    for ( let line of raw.split( '\n' ) )
    {

        switch ( line.split( ' ' )[ 0 ] )
        {
            case "mtllib":
                console.log("mtl")
                parseMTL( line, material )
                break
            case 'v':
                parseObjVertex( line, vertices )
                parseObjColor( line, colors, fallback_color )
                break
            case 'vn':
                parseObjNormal( line, normals )
                break
            case 'vt':
                // parse texcoords
                parseTexCoords( line, texcoords )
                break
            case 'f':
                parseObjIds( line, vertex_ids, normal_ids, normal_map, texcoord_ids )
                break
        }
    }
    let [tangents, bitangents] = calculateTangentSpace(vertices, texcoords, vertex_ids, texcoord_ids)
    let normals_ = new Array(vertices.length)
    // find average normals per vertex
    function averageNormals(value, key, map) {
        let avgx = 0
        let avgy = 0
        let avgz = 0

        for(let id = 0; id < value.length; id++) {
            const nid = (value[id] * 3)
            avgx += normals[nid]
            avgy += normals[nid+1]
            avgz += normals[nid+2]
        }
        avgx /= value.length
        avgy /= value.length
        avgz /= value.length
        let vid = key*3
        normals_[vid] = avgx
        normals_[vid+1] = avgy
        normals_[vid+2] = avgz
        
    }

    // find average normals of all verticies
    normal_map.forEach(averageNormals)
    console.log(tangents,bitangents,vertices)
    let data = [ ]
    for ( let i = 0; i < vertex_ids.length; i++ )
    {

        const vid = ( vertex_ids[ i ] * 3 )
        const nid = ( normal_ids[ i ] * 3 )
        const tid = ( texcoord_ids[ i ] * 2 )

        data.push( vertices[ vid ], vertices[ vid + 1 ], vertices[ vid + 2 ] )
        data.push( colors[ vid ], colors[ vid + 1 ], colors[ vid + 2 ] )
        data.push( normals_[ vid ], normals_[ vid + 1 ], normals_[ vid + 2 ] )
        // data.push( normals[ nid ], normals[ nid + 1 ], normals[ nid + 2 ] )
        data.push( texcoords[ tid ], texcoords[ tid + 1 ] )
        data.push( tangents[ vid ], tangents[ vid + 1 ], tangents[ vid + 2 ] )
        data.push( bitangents[ vid ], bitangents[ vid + 1 ], bitangents[ vid + 2 ] )

    }

    return data

}

/**
 * Parses a given object vertex entry line
 * @param { String } entry A line of an object vertex entry
 * @param { Array.<Number> } list The list to write the parsed vertex coordinates to
 */
function parseObjVertex( entry, list )
{

    const elements = entry.split( ' ' )
    if ( elements.length < 4 )
        alert( "Unknown vertex entry " + entry )

    list.push( parseFloat( elements[ 1 ] ), parseFloat( elements[ 2 ] ), parseFloat( elements[ 3 ] ) )

}

/**
 * Parses a given object color entry line
 * @param { String } entry A line of an object color entry
 * @param { Array.<Number> } list The list to write the parsed vertex colors to
 * @param { Array.<Number> } fallback_color A fallback color in case the OBJ does not define vertex colors
 */
function parseObjColor( entry, list, fallback_color )
{

    const elements = entry.split( ' ' )
    if ( elements.length < 7 )
    {

        list.push( fallback_color[ 0 ], fallback_color[ 1 ], fallback_color[ 2 ] )
        return

    }

    list.push( parseFloat( elements[ 4 ] ), parseFloat( elements[ 5 ] ), parseFloat( elements[ 6 ] ) )

}

/**
 * Parses a given object normal entry line
 * @param { String } entry A line of an object normal entry
 * @param { Array.<Number> } list The list to write the parsed vertex normals to
 */
function parseObjNormal( entry, list )
{

    const elements = entry.split( ' ' )
    if ( elements.length != 4 )
        alert( "Unknown normals entry " + entry )

    list.push( parseFloat( elements[ 1 ] ), parseFloat( elements[ 2 ] ), parseFloat( elements[ 3 ] ) )

}


/**
 * Parses a given object normal entry line
 * @param { String } entry A line of an object texcoord entry
 * @param { Array.<Number> } list The list to write the parsed texcoords to
 */
function parseTexCoords( entry, list ) 
{

    const elements = entry.split( ' ' )
    if ( elements.length != 3 )
        alert( "Unknown texcoord entry " + entry )

    list.push( parseFloat( elements[ 1 ] ), parseFloat( elements[ 2 ] ) )

}

/**
 * Parses a given object ids entry line
 * @param { String } entry A line of an object ids entry
 * @param { Array.<Number> } vertex_ids The list of vertex ids to write to
 * @param { Map.<Number> } normal_ids The list normal ids to write to
 * @param { Map.<Number> } texcoord_ids The list normal ids to write to

 */
function parseObjIds( entry, vertex_ids, normal_ids, normal_map, texcoord_ids )
{

    const elements = entry.split( ' ' )
    if ( elements.length != 4 )
        alert( "Unknown face entry " + entry )

    for ( let element of elements )
    {

        if ( element == 'f' )
            continue

        const subelements = element.split( '/' )

        vertex_ids.push( parseInt( subelements[ 0 ] ) - 1 )
        texcoord_ids.push( parseInt( subelements[ 1 ] ) - 1 )
        normal_ids.push( parseInt( subelements[ 2 ] ) - 1 )

        if(normal_map.has(parseInt( subelements[ 0 ] ) - 1)) {
            normal_map.get(parseInt( subelements[ 0 ] ) - 1).push(parseInt( subelements[ 2 ] ) - 1)
            normal_map.set(parseInt( subelements[ 0 ] ) - 1, normal_map.get(parseInt( subelements[ 0 ] ) - 1).filter(onlyUnique))
        } else {
            normal_map.set(parseInt( subelements[ 0 ] ) - 1, [parseInt( subelements[ 2 ] ) - 1] )
        }

    }
    //console.log(normal_map);

}

function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
}

/**
 * Loads a scene file and triggers the appropriate parsing functions
 * @param { String } url The url to the scene file
 * @returns An object containing information about the camera, the light and the scene
 */
function loadSceneFile( url )
{

    let raw = loadExternalFile( url )

    let scene_description = JSON.parse( raw )

    return {

        "camera": parseCamera( scene_description[ "camera" ] ),
        "lights": parseLight( scene_description[ "lights" ] ),
        "scene": parseSceneNode( scene_description[ "root" ], null )
    }
}

/**
 * Parses a given camera entry
 * @param { TODO } entry An entry containing information on a single camera
 * @returns A camera instance with the camera read from the scene file
 */
function parseCamera( entry )
{

    let camera = null

    let position = vec3.fromValues( entry.position[ 0 ], entry.position[ 1 ], entry.position[ 2 ] )
    let lookat = vec3.fromValues( entry.lookat[ 0 ], entry.lookat[ 1 ], entry.lookat[ 2 ] )
    let up = vec3.fromValues( entry.up[ 0 ], entry.up[ 1 ], entry.up[ 2 ] )
    let fov = entry.fov

    if ( entry.type == "perspective" )
    {

        camera = new PerspectiveCamera( position, lookat, up, fov )

    }
    else if ( entry.type == "orthographic" )
    {

        camera = new OrthographicCamera( position, lookat, up, fov )

    }

    return camera

}

function parseLight( entry )
{
    let light_ = null;
    if(entry.ambient != undefined) {
        let ambient = vec3.fromValues( entry.ambient[ 0 ], entry.ambient[ 1 ], entry.ambient[ 2 ] )
        light_ = new light( 0, ambient, 0, 0 , "ambient");
    } else if(entry.type == "point") {
        let position = entry.position
        let Id = vec3.fromValues( entry.Id[ 0 ], entry.Id[ 1 ], entry.Id[ 2 ] )
        let Is = vec3.fromValues( entry.Is[ 0 ], entry.Is[ 1 ], entry.Is[ 2 ] )
        light_ = new light( position, 0, Id, Is , "point");
    } else if(entry.type == "direction") {
        let direction = entry.direction
        let Id = vec3.fromValues( entry.Id[ 0 ], entry.Id[ 1 ], entry.Id[ 2 ] )
        let Is = vec3.fromValues( entry.Is[ 0 ], entry.Is[ 1 ], entry.Is[ 2 ] )
        light_ = new light( direction, 0, Id, Is , "direction");
    }
    if(entry.point_lights) {
        for(let light of entry.point_lights)
            light_.point_lights.push(parseLight(light))
    }
    if(entry.directional_lights) {
        for(let light of entry.directional_lights)
            light_.directional_lights.push(parseLight(light))
    }

    return light_
}


/**
 *  Recursively parses a SceneNode and its children
 * @param { Object } entry An entry from the JSON config representing a SceneNode
 * @param { Object | null } parent The parent node of the current SceneNode
 * @returns { SceneNode } The parsed SceneNode object
 */
function parseSceneNode( entry, parent )
{

    let node = null

    let name = entry.name
    let translation = vec3.fromValues( entry.translation[ 0 ], entry.translation[ 1 ], entry.translation[ 2 ] )
    let rotation = vec3.fromValues( entry.rotation[ 0 ], entry.rotation[ 1 ], entry.rotation[ 2 ] )
    let scale = vec3.fromValues( entry.scale[ 0 ], entry.scale[ 1 ], entry.scale[ 2 ] )
    let texture = entry.texture
    let normal_map = entry.normal_map
    console.log(texture, normal_map)
    let material = []
    let default_material = [[1.0, 1.0, 1.0],
                            [0.6, 0.6, 0.6], 
                            [0.5, 0.5, 0.5], 
                            16]
    if ( entry.type == 'node' )
    {
        node = new SceneNode( name, parent, translation, rotation, scale )

    }
    else if ( entry.type == 'object' )
    {

        const fallback_color = hex2rgb( entry.color )
        const obj_content = loadObjFile( entry.obj, fallback_color, material )
        if(material.length < 1){
            if(texture != undefined) {
                if(normal_map != undefined) {
                    node = new ObjectNode( obj_content, name, parent, translation, rotation, scale, default_material, texture, normal_map )
                } else {
                    node = new ObjectNode( obj_content, name, parent, translation, rotation, scale, default_material, texture )
                }
            } else {
                node = new ObjectNode( obj_content, name, parent, translation, rotation, scale, default_material )
            }
        } else {
            if(texture != undefined) {
                if(normal_map != undefined) {
                    node = new ObjectNode( obj_content, name, parent, translation, rotation, scale, material, texture, normal_map )
                } else {
                    node = new ObjectNode( obj_content, name, parent, translation, rotation, scale, material, texture )
                }
            } else {
                node = new ObjectNode( obj_content, name, parent, translation, rotation, scale, material )
            }
        }

    }

    for ( let child of entry.children )
        node.children.push( parseSceneNode( child, node ) )

    return node

}

export
{

    clamp,
    deg2rad,
    hex2rgb,
    rgb2hex,
    getRelativeMousePosition,
    loadExternalFile,
    loadObjFile,
    loadSceneFile,
    loadTexture,
    calculateTangentSpace

}
