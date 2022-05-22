import * as GE from './js/ThreeJSGameEngine.js'
import { TestScene } from './objects.js'

let engine = new GE.GameEngine({ height: innerHeight * 0.9, width: innerWidth * 0.9, shadowMapEnabled: true })

document.body.appendChild(engine.getDOMElement())

engine.setScene(new TestScene())

engine.start()

onresize = () => {
    engine.resize(innerWidth * 0.9, innerHeight * 0.9)
}

let g = new GE.Graph()

g.addNode(0, 1, 2)

g.addLink(
    { source: 0, target: 1 },
    // { source: 0, target: 2 }
    { source: 1, target: 2 },
    { source: 2, target: 0 }
)

console.log(g)

console.log(g.isConnected(0))
console.log(g.isConnected(1))
console.log(g.isConnected(2))
console.log(g.isFullyConnected())