import * as GE from './js/ThreeJSGameEngine.js'
import * as THREE from './three.js'
import { Direction, CollapseMethods, DirectionOffset, Prototype, WaveFunctionCollapse } from './WaveFunctionCollapse.js'

const leftTrail = new THREE.Shape()

leftTrail.moveTo(-.5, 0)
leftTrail.lineTo(-.45, .1)
leftTrail.lineTo(-.4, .1)
leftTrail.lineTo(-.4, 0)
leftTrail.lineTo(-.5, 0)

const rightTrail = new THREE.Shape()

rightTrail.moveTo(.4, 0)
rightTrail.lineTo(.4, .1)
rightTrail.lineTo(.45, .1)
rightTrail.lineTo(.5, 0)
rightTrail.lineTo(.4, 0)


const railMaterial = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(.8, .8, .8),
    metalness: .8,
    roughness: .1,
    clearcoat: 1.0,
    clearcoatRoughness: 1.0,
    reflectivity: 1.0,
});

const grassMaterial = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(0, .1, 0),
    metalness: 0,
    roughness: 1,
    clearcoat: 0,
    clearcoatRoughness: 0,
    reflectivity: 0,
});

function generateMap(mapWidth, mapHeight) {

    let wfc = new WaveFunctionCollapse(mapWidth, mapHeight)

    wfc.addPrototype(
        new Prototype('grass', { left: '0s', right: '0s', top: '0s', bottom: '0s' }, 10),
        new Prototype('track_station', { left: '1s', right: '1s', top: 'towns', bottom: '0s' }, 1, { left: '1s', right: '1s', top: '', bottom: '' }),
        // new Prototype('track_cross', { left: '1s', right: '1s', top: '1s', bottom: '1s' }),
        ...new Prototype('track_tri_cross', { left: '1s', right: '1s', top: '1s', bottom: '0s' }, 1, { left: '2s', right: '2s', top: '2s', bottom: '2s' }).rotate360(),
        ...new Prototype('track_straight', { left: '1s', right: '1s', top: '0s', bottom: '0s' }, 1).rotateRight(),
        ...new Prototype('track_end', { left: '0s', right: '0s', top: '1s', bottom: '-1' }).rotate360(),
        ...new Prototype('track_corner', { left: '1s', right: '0s', top: '1s', bottom: '0s' }, 1, { left: '3s', right: '3s', top: '3s', bottom: '3s' }).rotate360(),
        new Prototype('town', { left: '0s', right: '0s', top: '0s', bottom: 'towns' })
    )
    wfc.collapseMethod = CollapseMethods.servWeightedRandom

    // console.log(wfc.prototypes.get('track_corner').antineighbours)

    let maxTry = 50

    do {

        wfc.reset()

        wfc.set(Math.floor(mapWidth / 2), 0, ['track_end'])
        wfc.set(Math.floor(mapWidth / 2), mapHeight - 1, ['track_end_2'])
        wfc.set(0, Math.floor(mapHeight / 2), ['track_end_1'])
        wfc.set(mapWidth - 1, Math.floor(mapHeight / 2), ['track_end_3'])
        wfc.ring(['grass'])
        maxTry--

    } while (!wfc.runTocompletion() && maxTry > 0)

    return wfc.results()

}

class Tile extends GE.GameObject {

    static tileSize = 10

    constructor() {

        super()

        let geometry = new THREE.BufferGeometry()

        let i = Tile.tileSize / 2

        geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array([
            -i, 0, -i,
            i, 0, i,
            i, 0, -i,
            -i, 0, -i,
            -i, 0, i,
            i, 0, i,
        ]), 3))

        geometry.computeVertexNormals()

        this.add(new THREE.Mesh(geometry, grassMaterial))

    }

}

class EndRail extends GE.GameObject {

    constructor() {

        super()

        const cbc = new GE.CubicBezierCurve(new THREE.Vector3(0, 0, 5), new THREE.Vector3(0, 0, 2), new THREE.Vector3(0, 3, -2), new THREE.Vector3(0, 0, -5))

        let leftTrailGeometry = GE.Utils.extrude(leftTrail, cbc.generator(16), new THREE.Vector3(0, 1, 0))
        let rightTrailGeometry = GE.Utils.extrude(rightTrail, cbc.generator(16), new THREE.Vector3(0, 1, 0))

        let leftTrailMesh = new THREE.Mesh(leftTrailGeometry, railMaterial)
        let rightTrailMesh = new THREE.Mesh(rightTrailGeometry, railMaterial)

        this.add(leftTrailMesh, rightTrailMesh)


    }

}

class EndRailTile extends Tile {

    constructor() {

        super()

        this.add(new EndRail())

    }

}

class StraightRail extends GE.GameObject {

    constructor() {

        super()

        const cbc = new GE.CubicBezierCurve(new THREE.Vector3(0, 0, 5), new THREE.Vector3(0, 0, 2), new THREE.Vector3(0, 0, -2), new THREE.Vector3(0, 0, -5))

        let leftTrailGeometry = GE.Utils.extrude(leftTrail, cbc.generator(4), new THREE.Vector3(0, 1, 0))
        let rightTrailGeometry = GE.Utils.extrude(rightTrail, cbc.generator(4), new THREE.Vector3(0, 1, 0))

        let leftTrailMesh = new THREE.Mesh(leftTrailGeometry, railMaterial)
        let rightTrailMesh = new THREE.Mesh(rightTrailGeometry, railMaterial)

        this.add(leftTrailMesh, rightTrailMesh)

    }

}

class StraightRailTile extends Tile {

    constructor() {

        super()

        this.add(new StraightRail())

    }

}

class CornerRail extends GE.GameObject {

    constructor() {

        super()

        let generator = () => { return GE.Utils.arcGenerator(8, Math.PI / 2, new THREE.Vector3(-5, 0, -5), 5) }

        const cbc = new GE.CubicBezierCurve(new THREE.Vector3(0, 0, 2), new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, -1), new THREE.Vector3(0, 0, -2))

        let leftTrailGeometry = GE.Utils.extrude(leftTrail, generator(), new THREE.Vector3(0, 1, 0))
        let rightTrailGeometry = GE.Utils.extrude(rightTrail, generator(), new THREE.Vector3(0, 1, 0))

        let leftTrailMesh = new THREE.Mesh(leftTrailGeometry, railMaterial)
        let rightTrailMesh = new THREE.Mesh(rightTrailGeometry, railMaterial)

        this.add(leftTrailMesh, rightTrailMesh)

    }

}

class CornerRailTile extends Tile {

    constructor() {

        super()

        this.add(new CornerRail())

    }

}

class TRailTile extends Tile {

    constructor() {

        super()

        let s = new StraightRail()
        s.rotateY(Math.PI / 2)
        let c_1 = new CornerRail()
        // c_1.rotateY(Math.PI / 2)
        let c_2 = new CornerRail()
        c_2.rotateY(-Math.PI / 2)

        this.add(s, c_1, c_2)

    }

}

class SkySphere extends GE.GameObject {

    mesh = new THREE.Mesh()

    constructor() {

        super()

        let geo = new THREE.SphereBufferGeometry(15, 16, 16)
        let mat = new THREE.MeshPhysicalMaterial({
            color: '#77f',
            metalness: 0,
            roughness: 1,
            clearcoat: 0,
            clearcoatRoughness: 0,
            reflectivity: 0,
        })
        mat.side = THREE.BackSide

        this.mesh = new THREE.Mesh(geo, mat)

        this.add(this.mesh)

    }

}

class PlanetFace extends GE.GameObject {

    constructor(faceSize = 5) {

        super()

        let size = faceSize * Tile.tileSize
        let halfSize = size / 2
        let offset = -size * .5 + Tile.tileSize / 2

        let map = generateMap(faceSize, faceSize)

        for (let index = 0; index < faceSize ** 2; index++) {
            let x = Math.floor(index / faceSize)
            let y = index % faceSize


            let tile

            if (map[index] == 'track_straight' || map[index] == 'track_station') {
                tile = new StraightRailTile()
                tile.rotateY(Math.PI / 2)
            } else if (map[index] == 'track_straight_1')
                tile = new StraightRailTile()
            else if (map[index] == 'track_corner') {
                tile = new CornerRailTile()
                tile.rotateY(Math.PI / 2)
            } else if (map[index] == 'track_corner_1') {
                tile = new CornerRailTile()
                tile.rotateY(Math.PI)
            } else if (map[index] == 'track_corner_2') {
                tile = new CornerRailTile()
                tile.rotateY(-Math.PI / 2)
            } else if (map[index] == 'track_corner_3') {
                tile = new CornerRailTile()
            } else if (map[index] == 'track_tri_cross') {
                tile = new TRailTile()
                tile.rotateY(Math.PI)
            } else if (map[index] == 'track_tri_cross_1') {
                tile = new TRailTile()
                tile.rotateY(-Math.PI / 2)
            } else if (map[index] == 'track_tri_cross_2') {
                tile = new TRailTile()
            } else if (map[index] == 'track_tri_cross_3') {
                tile = new TRailTile()
                tile.rotateY(Math.PI / 2)
            } else if (map[index] == 'track_end') {
                tile = new EndRailTile()
            } else if (map[index] == 'track_end_1') {
                tile = new EndRailTile()
                tile.rotateY(Math.PI / 2)
            } else if (map[index] == 'track_end_2') {
                tile = new EndRailTile()
                tile.rotateY(Math.PI)
            } else if (map[index] == 'track_end_3') {
                tile = new EndRailTile()
                tile.rotateY(-Math.PI / 2)
            }

            else tile = new Tile()


            tile.position.x = offset + x * Tile.tileSize
            tile.position.y = halfSize
            tile.position.z = offset + y * Tile.tileSize

            this.add(tile)

        }

        this.light = new THREE.PointLight(new THREE.Color(1, 1, 1), 3, 200, 2)
        this.light.position.y = size
        this.light.castShadow = true
        this.add(this.light)

    }

    onUpdate(dt) {

        return true
    }

}

class Planet extends GE.GameObject {

    constructor(planetSize = 5) {

        super()

        planetSize = Math.max(planetSize, 5)

        let front_face = new PlanetFace(planetSize)
        front_face.rotateX(Math.PI / 2)
        let left_face = new PlanetFace(planetSize)
        left_face.rotateZ(Math.PI / 2)
        let right_face = new PlanetFace(planetSize)
        right_face.rotateZ(-Math.PI / 2)
        let top_face = new PlanetFace(planetSize)
        let bottom_face = new PlanetFace(planetSize)
        bottom_face.rotateX(Math.PI)
        let back_face = new PlanetFace(planetSize)
        back_face.rotateX(-Math.PI / 2)

        this.add(front_face, left_face, right_face, top_face, bottom_face, back_face)

    }

    onUpdate(dt) {

        this.rotateY(dt / 2)

        return true
    }

}

class TestScene extends GE.GameScene {

    constructor() {

        super()
        // this.add(new StraightRail())

        let planetSize = 11

        this.add(new Planet(planetSize))
        // this.add(new PlanetFace(planetSize))
        this.add(new GE.FPSCounter())

        this.camera = new THREE.PerspectiveCamera(75, 1, 0.5, 1000)
        this.camera.position.x = planetSize * Tile.tileSize
        this.camera.position.y = planetSize * 1.2 * Tile.tileSize * .8
        this.camera.position.z = planetSize * 1.2 * Tile.tileSize * .8

        // this.camera.lookAt(0, planetSize * Tile.tileSize / 2, planetSize * Tile.tileSize / 2)
        this.camera.lookAt(0, 0, 0)

        let ambiant = new THREE.AmbientLight('#fff', .9)
        this.add(ambiant)

        // this.light = new THREE.PointLight(new THREE.Color(1, 1, 1), 2, 200, 2)
        // this.light.position.y = 0
        // this.light.position.x = 15
        // this.light.castShadow = true
        // this.add(this.light)

    }

    onSet() {

    }

}

export { TestScene }