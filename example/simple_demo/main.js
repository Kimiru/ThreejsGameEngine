import * as GE from './js/ThreeJSGameEngine.js'
import { TestScene } from './objects.js'

let engine = new GE.GameEngine({ height: innerHeight * 0.9, width: innerWidth * 0.9, shadowMapEnabled: true })

document.body.appendChild(engine.getDOMElement())

engine.setScene(new TestScene())

engine.start()

onresize = () => {
    engine.resize(innerWidth * 0.9, innerHeight * 0.9)
}
