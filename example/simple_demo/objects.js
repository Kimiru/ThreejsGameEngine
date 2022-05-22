import * as GE from './js/ThreeJSGameEngine.js'
import * as THREE from './three.js'

let leftTrail = new THREE.Shape()

leftTrail.moveTo(-.5, 0)
leftTrail.lineTo(-.45, .1)
leftTrail.lineTo(-.4, .1)
leftTrail.lineTo(-.4, 0)
leftTrail.lineTo(-.5, 0)

let rightTrail = new THREE.Shape()

rightTrail.moveTo(.4, 0)
rightTrail.lineTo(.4, .1)
rightTrail.lineTo(.45, .1)
rightTrail.lineTo(.5, 0)
rightTrail.lineTo(.4, 0)

class StraightRail extends GE.GameObject {

    constructor() {

        super()

        const cbc = new GE.CubicBezierCurve(new THREE.Vector3(0, 0, 2), new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, -1), new THREE.Vector3(0, 0, -2))

        let leftTrailGeometry = GE.Utils.extrude(leftTrail, cbc.generator(4), new THREE.Vector3(0, 1, 0))
        let rightTrailGeometry = GE.Utils.extrude(rightTrail, cbc.generator(4), new THREE.Vector3(0, 1, 0))

        console.log(leftTrailGeometry, rightTrailGeometry)

        const material = new THREE.MeshPhysicalMaterial({
            color: new THREE.Color(.8, .8, .8),
            metalness: .8,
            roughness: .1,
            clearcoat: 1.0,
            clearcoatRoughness: 1.0,
            reflectivity: 1.0,
        });

        let leftTrailMesh = new THREE.Mesh(leftTrailGeometry, material)
        let rightTrailMesh = new THREE.Mesh(rightTrailGeometry, material)

        this.add(leftTrailMesh, rightTrailMesh)

    }

}

class CornerRail extends GE.GameObject {

    constructor() {

        super()

        let generator = () => { return GE.Utils.arcGenerator(4, Math.PI / 2, new THREE.Vector3(0, 0, 0), 2) }

        for (let entry of generator())
            console.log(entry)

        const cbc = new GE.CubicBezierCurve(new THREE.Vector3(0, 0, 2), new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, -1), new THREE.Vector3(0, 0, -2))

        let leftTrailGeometry = GE.Utils.extrude(leftTrail, generator(), new THREE.Vector3(0, 1, 0))
        let rightTrailGeometry = GE.Utils.extrude(rightTrail, generator(), new THREE.Vector3(0, 1, 0))

        console.log(leftTrailGeometry, rightTrailGeometry)

        const material = new THREE.MeshPhysicalMaterial({
            color: new THREE.Color(.8, .8, .8),
            metalness: .8,
            roughness: .1,
            clearcoat: 1.0,
            clearcoatRoughness: 1.0,
            reflectivity: 1.0,
        });

        let leftTrailMesh = new THREE.Mesh(leftTrailGeometry, material)
        let rightTrailMesh = new THREE.Mesh(rightTrailGeometry, material)

        this.add(leftTrailMesh, rightTrailMesh)

    }

}

class Cube extends GE.GameObject {

    mesh = new THREE.Mesh()

    constructor() {

        super()

        const shape = new THREE.Shape()
        shape.moveTo(-.5, 0)
        shape.lineTo(-.45, .1)
        shape.lineTo(-.4, .1)
        shape.lineTo(-.4, 0)
        shape.lineTo(.4, 0)
        shape.lineTo(.4, .1)
        shape.lineTo(.45, .1)
        shape.lineTo(.5, 0)

        const cbc = new GE.CubicBezierCurve(new THREE.Vector3(-2, 0, -2), new THREE.Vector3(-2, 0, 1), new THREE.Vector3(2, 0, -1), new THREE.Vector3(2, 0, 2))

        this.add(...cbc.meshs(.2))

        let geometry = GE.Utils.extrude(shape, cbc.generator(32), new THREE.Vector3(0, 1, 0))


        // const geometry = new THREE.ExtrudeBufferGeometry(shape, {
        //     curveSegments: 5,
        //     extrudePath: path,
        //     steps: 6
        // })
        const material = new THREE.MeshPhysicalMaterial({
            color: new THREE.Color(1, 1, 0),
            metalness: 0.5,
            roughness: 0,
            clearcoat: 1.0,
            clearcoatRoughness: 1.0,
            reflectivity: 1.0,
            // envMap: (index % 2) == 1 ? texture : null
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.receiveShadow = true
        this.mesh.castShadow = true

        this.add(this.mesh)

    }

    onUpdate(dt) {

        this.mesh.rotation.y = Math.PI

        return true

    }

    /**
     * 
     * @param {CanvasRenderingContext2D} ctx 
     */
    onRender(ctx) {

        return true
    }

}

class SuperCube extends GE.GameObject {

    mesh = new THREE.Mesh()
    rotation = 0
    dist = 1

    constructor(dist = 2, size = 1) {

        super()

        this.dist = dist

        const geometry = new THREE.BoxGeometry(size, size, size);
        const material = new THREE.MeshPhysicalMaterial({
            color: new THREE.Color(1, 1, 0),
            metalness: 0.5,
            roughness: 0,
            clearcoat: 1.0,
            clearcoatRoughness: 1.0,
            reflectivity: 1.0,
            // envMap: (index % 2) == 1 ? texture : null
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true
        this.mesh.receiveShadow = true

        this.add(this.mesh)

    }

    onUpdate(dt) {

        dt = dt / 4

        // this.rotation = (this.rotation + dt) % (Math.PI * 2)
        this.rotation = Math.PI

        this.mesh.position.x = Math.sin(-this.rotation) * this.dist
        this.mesh.position.z = Math.cos(-this.rotation) * this.dist

        this.mesh.rotation.y = 1

        return true



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

class TestScene extends GE.GameScene {

    constructor() {

        super()

        this.add(new StraightRail())
        this.add(new CornerRail())
        this.add(new GE.FPSCounter())
        this.add(new SkySphere())

        this.camera = new THREE.PerspectiveCamera(75, 1, 0.5, 1000)
        this.camera.position.x = 0
        this.camera.position.y = 4
        this.camera.position.z = 0

        this.camera.lookAt(0, 0, 0)

        let light = new THREE.PointLight(new THREE.Color(1, 1, 1), 2, 40, 2)
        light.position.y = 2
        light.castShadow = true
        this.add(light)

        let light2 = new THREE.PointLight(new THREE.Color(1, 1, 1), 2, 40, 2)
        light2.position.x = 2
        light2.position.y = 2
        light2.position.z = 0
        light2.castShadow = true
        this.add(light2)


        let ambiant = new THREE.AmbientLight('#fff', 0.05)
        this.add(ambiant)

    }

    onSet() {

    }

}

export { Cube, TestScene }