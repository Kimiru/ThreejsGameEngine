import * as GE from './js/ThreeJSGameEngine.js'
import * as THREE from './three.js'

let engine = new GE.GameEngine({ height: innerHeight / 2, width: innerWidth / 2 })

console.log(engine)
console.log(engine.getDOMElement())

document.body.appendChild(engine.getDOMElement())

let scene = new GE.GameScene()
let object = new GE.GameObject()
scene.camera = new THREE.PerspectiveCamera

scene.add(object)
engine.setScene(scene)

/**
 * 
 * @param {CanvasRenderingContext2D} ctx 
 */
object.onDraw = function (ctx) {

    ctx.fillStyle = 'black'
    ctx.fillRect(0, 0, 200, 200)

    return true

}

engine.start()