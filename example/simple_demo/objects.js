import * as GE from './js/ThreeJSGameEngine.js'
import * as THREE from './three.js'

class Cube extends GE.GameObject {

    mesh = new THREE.Mesh()

    constructor() {

        super()

        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        this.mesh = new THREE.Mesh(geometry, material);

        this.add(this.mesh)

    }

    onUpdate(dt) {

        this.mesh.rotateY(dt)

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

class TestScene extends GE.GameScene {

    constructor() {

        super()

        this.add(new Cube())
        this.add(new SuperCube())
        this.add(new SuperCube(4))
        this.add(new SuperCube(7, 4))
        this.add(new GE.FPSCounter())

        this.camera = new THREE.PerspectiveCamera(75, 1, 0.5, 10)
        this.camera.position.x = 3
        this.camera.position.y = 3
        this.camera.position.z = 0

        this.camera.lookAt(0, 0, -2)

        let light = new THREE.PointLight(new THREE.Color(1, 1, 1), 2, 20, 2)
        light.position.y = 2
        light.castShadow = true
        this.add(light)

        let ambiant = new THREE.AmbientLight('#fff', 0.05)
        this.add(ambiant)

    }

    onSet() {

    }

}

export { Cube, TestScene }