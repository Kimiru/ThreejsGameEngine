import * as THREE from 'three'

const gameEngineConstructorArguments = {
    width: innerWidth,
    height: innerHeight,
    physicallyCorrectLights: false,
    shadowMapEnabled: false
}

class GameEngine {

    renderer: THREE.WebGLRenderer = new THREE.WebGLRenderer()
    canvas: HTMLCanvasElement = document.createElement('canvas')
    ctx: CanvasRenderingContext2D = this.canvas.getContext('2d')
    div: HTMLDivElement = document.createElement('div')

    #width: number = 0
    #height: number = 0

    #run: boolean = false
    #lastTime: number = Date.now()
    #dt: number = 0
    #currentScene: GameScene = null
    #nextScene: GameScene = undefined

    constructor(args = gameEngineConstructorArguments) {

        args = { ...gameEngineConstructorArguments, ...args }

        this.renderer.physicallyCorrectLights = args.physicallyCorrectLights
        this.renderer.shadowMap.enabled = args.shadowMapEnabled

        this.canvas.style.position = 'absolute'
        this.canvas.style.top = '0'
        this.canvas.style.left = '0'
        this.canvas.style.zIndex = '1'
        this.canvas.style.pointerEvents = 'none'

        this.ctx.imageSmoothingEnabled = false

        this.div.style.position = 'relative'
        this.div.appendChild(this.renderer.domElement)
        this.div.appendChild(this.canvas)

        this.resize(args.width, args.height)

    }

    get dt() { return this.#dt }

    /**
     * update the size of both canvas
     * if a scene is curently used, update it's camera
     * 
     * @param {number} width 
     * @param {number} height 
     */
    resize(width: number, height: number): void {

        this.#width = width
        this.#height = height

        this.renderer.setSize(width, height)
        this.canvas.width = width * devicePixelRatio
        this.canvas.height = height * devicePixelRatio
        this.ctx.scale(devicePixelRatio, devicePixelRatio)
        this.ctx.imageSmoothingEnabled = false
        this.canvas.style.width = width + 'px'
        this.canvas.style.height = height + 'px'

        if (this.#currentScene) {

            this.#currentScene.rendererWidth = width
            this.#currentScene.rendererHeight = height

            this.#currentScene.onResize(width, height)
            this.#currentScene.updateCameraAspect()

        }

    }

    /**
     * Return the div containing the redering canvas for threejs and the overlay
     * 
     * @returns {HTMLDivElement}
     */
    getDOMElement(): HTMLDivElement {

        return this.div

    }

    setScene(scene: GameScene): void {

        this.#nextScene = scene

    }

    #switchScene(): void {

        if (this.#nextScene !== undefined) {

            if (this.#currentScene)
                this.#currentScene.onUnSet()

            this.#currentScene = this.#nextScene
            this.#nextScene = undefined

            this.resize(this.#width, this.#height)

            if (this.#currentScene)
                this.#currentScene.onSet()

        }

    }

    start() {

        this.#run = true
        this.#loop()

    }

    stop() {

        this.#run = false

    }

    #loop() {

        if (!this.#run) return;

        let time: number = Date.now();
        this.#dt = (time - this.#lastTime) / 1000;
        this.#lastTime = time;
        this.#dt = Math.min(this.#dt, 0.2)

        if (this.#currentScene) {

            this.ctx.clearRect(0, 0, innerWidth, innerHeight)
            this.#currentScene.update(this.#dt)
            this.#currentScene.render(this.renderer, this.ctx)

        }

        this.#switchScene()

        requestAnimationFrame(this.#loop.bind(this));

    }

}

class GameScene extends THREE.Scene {

    camera: THREE.Camera = null
    rendererWidth: number = 0
    rendererHeight: number = 0
    tags: Map<string, GameObject[]> = new Map()

    constructor() {

        super()

    }

    update(dt: number) {

        if (this.onUpdate(dt))
            for (let child of reverseIterator(this.children))
                if (child instanceof GameObject)
                    child.update(dt)

    }

    render(renderer: THREE.WebGLRenderer, ctx: CanvasRenderingContext2D) {

        if (this.camera !== null)
            if (this.onRender(ctx)) {

                renderer.render(this, this.camera)

                for (let child of this.children)
                    if (child instanceof GameObject)
                        child.render(ctx)

            }

    }

    add(...object: GameObject[]): this {

        super.add(...object)

        for (let obj of object)
            if (obj instanceof Prefab) {
                for (let child of reverseIterator(obj.children)) {
                    obj.remove(child)
                    this.add(child)
                }
            }
            else if (obj instanceof GameObject)
                for (let tag of obj.tags) {

                    if (!this.tags.has(tag)) this.tags.set(tag, [])

                    this.tags.get(tag).push(obj)

                }

        return this
    }

    remove(...object: GameObject[]): this {

        super.add(...object)

        for (let obj of object)
            if (obj instanceof GameObject)
                for (let tag of obj.tags) {

                    let list = this.tags.get(tag)

                    list.splice(list.indexOf(obj), 1)

                }

        return this

    }

    getTags(tag: string): GameObject[] {

        return this.tags.get(tag) ?? []

    }

    onSet(): void {

    }

    onUnSet(): void {

    }

    onResize(width: number, height: number): void {

    }

    updateCameraAspect(): void {

        if (this.camera instanceof THREE.PerspectiveCamera) {

            this.camera.aspect = this.rendererWidth / this.rendererHeight
            this.camera.updateProjectionMatrix()

        }

    }

    /**
    * 
    * @param {number} dt 
    * @returns 
    */
    onUpdate(dt: number): boolean {

        return true

    }

    /**
     * 
     * @param {CanvasRenderingContext2D} ctx 
     * @returns 
     */
    onRender(ctx: CanvasRenderingContext2D): boolean {

        return true

    }

}

class GameObject extends THREE.Object3D {

    children: GameObject[] = []
    tags: string[] = []

    constructor() {

        super()

    }

    /**
     * 
     * @param {...GameObject} object 
     * @returns 
     */
    add(...object: GameObject[]): this {

        super.add(...object)

        return this
    }

    /**
     * 
     * @param {...GameObject} object 
     * @returns 
     */
    remove(...object: GameObject[]): this {

        super.add(...object)

        return this

    }

    /**
     * 
     * @param {number} dt 
     */
    update(dt: number) {

        if (this.onUpdate(dt))
            for (let child of reverseIterator(this.children))
                if (child instanceof GameObject)
                    child.update(dt)

    }

    /**
     * 
     * @param {CanvasRenderingContext2D} ctx 
     */
    render(ctx: CanvasRenderingContext2D) {

        if (this.onRender(ctx))
            for (let child of this.children)
                if (child instanceof GameObject)
                    child.render(ctx)

    }

    /**
     * 
     * @param {number} dt 
     * @returns 
     */
    onUpdate(dt: number): boolean {

        return true

    }

    /**
     * 
     * @param {CanvasRenderingContext2D} ctx 
     * @returns 
     */
    onRender(ctx: CanvasRenderingContext2D): boolean {

        return true

    }

}

class Prefab extends GameObject {

    constructor() {

        super()

    }

}

class Timer {

    begin: number

    constructor(time = Date.now()) {

        this.begin = time;

    }

    /**
     * Reset the timer
     */
    reset(): void {

        this.begin = new Date().getTime();

    }

    /**
     * Return the amount of time since the timer was last reset
     */
    getTime(): number {

        return new Date().getTime() - this.begin;

    }

    /**
     * Return if the time since the last reset is greather that the given amount
     * 
     * @param {number} amount 
     */
    greaterThan(amount: number): boolean {

        return this.getTime() > amount;

    }

    /**
     * Return if the time since the last reset is less that the given amount
     * 
     * @param {number} amount 
     */
    lessThan(amount: number): boolean {

        return this.getTime() < amount;

    }

}

class Input {

    keysDown: Set<string> = new Set()
    keysOnce: Set<string> = new Set()

    constructor() {

        window.addEventListener('keydown', (evt) => {

            this.keysDown.add(evt.code)
            this.keysOnce.add(evt.code)

        })

        window.addEventListener('keyup', (evt) => {

            this.keysDown.delete(evt.code)
            this.keysOnce.delete(evt.code)

        })

    }

    isDown(code: string): boolean { return this.keysDown.has(code) }

    isPressed(code: string): boolean {

        if (this.keysOnce.has(code)) {

            this.keysOnce.delete(code)

            return true

        }

        return false

    }

}

class FPSCounter extends GameObject {

    timer = new Timer()
    frameCount = 0
    fps = 0

    onUpdate(dt) {

        this.frameCount++

        if (this.timer.greaterThan(1000)) {

            this.fps = this.frameCount
            this.frameCount = 0
            this.timer.reset()

        }

        return true

    }

    /**
     * 
     * @param {CanvasRenderingContext2D} ctx 
     */
    onRender(ctx: CanvasRenderingContext2D) {

        ctx.save()

        ctx.scale(2, 2)

        ctx.fillStyle = 'red'
        ctx.textBaseline = 'top'
        ctx.fillText(this.fps.toString(), 5, 5)

        ctx.restore()

        return true

    }

}

function* reverseIterator(list: any[]) {

    for (let index = list.length - 1; index >= 0; index--)
        yield list[index]

}




class CubicBezierCurve<T extends THREE.Vector> {

    v1: T
    v2: T
    v3: T
    v4: T

    constructor(v1: T, v2: T, v3: T, v4: T) {

        this.v1 = v1
        this.v2 = v2
        this.v3 = v3
        this.v4 = v4

    }

    get(t: number): T {

        let tv1 = this.v1.clone().multiplyScalar((1 - t) ** 3) as T
        let tv2 = this.v2.clone().multiplyScalar(3 * (1 - t) ** 2 * t) as T
        let tv3 = this.v3.clone().multiplyScalar(3 * (1 - t) * t ** 2) as T
        let tv4 = this.v4.clone().multiplyScalar(t ** 3) as T

        return tv1.add(tv2).add(tv3).add(tv4)

    }

    getTangent(t: number): T {

        let tmp1 = this.v2.clone().sub(this.v1).multiplyScalar(3 * (1 - t) ** 2)
        let tmp2 = this.v3.clone().sub(this.v2).multiplyScalar(6 * (1 - t) * t)
        let tmp3 = this.v4.clone().sub(this.v3).multiplyScalar(3 * t ** 2)

        return tmp1.add(tmp2).add(tmp3) as T

    }

    *generator(steps: number): IterableIterator<[T, T]> {

        for (let index = 0; index <= steps; index++) {

            let t = index / steps

            yield [this.get(t), this.getTangent(t)]

        }

    }

    meshs(radius: number = 1): THREE.Mesh[] {

        let meshs: THREE.Mesh[] = []

        if (this.v1 instanceof THREE.Vector3 &&
            this.v2 instanceof THREE.Vector3 &&
            this.v3 instanceof THREE.Vector3 &&
            this.v4 instanceof THREE.Vector3) {

            let geo = new THREE.SphereBufferGeometry(radius, 8, 8)
            let mat = new THREE.MeshBasicMaterial({ color: '#f00' })

            let m1 = new THREE.Mesh(geo, mat)
            let m2 = new THREE.Mesh(geo, mat)
            let m3 = new THREE.Mesh(geo, mat)
            let m4 = new THREE.Mesh(geo, mat)

            m1.position.copy(this.v1)
            m2.position.copy(this.v2)
            m3.position.copy(this.v3)
            m4.position.copy(this.v4)

            meshs = [m1, m2, m3, m4]
        }

        return meshs

    }


}

class Utils {

    static Pivot = class Pivot {

        position: THREE.Vector3
        rotation: THREE.Quaternion

        constructor(position: THREE.Vector3, rotation: THREE.Quaternion) {

            this.position = position
            this.rotation = rotation

        }

        rotate(point: THREE.Vector3): THREE.Vector3 {

            return point.clone().applyQuaternion(this.rotation).add(this.position)

        }

    }

    static lookRotation(lookAt: THREE.Vector3, up: THREE.Vector3): THREE.Quaternion {

        let forward = lookAt.clone().normalize()
        let upward = up.clone().normalize()
        let right = upward.clone().cross(forward).normalize()

        let m00 = right.x
        let m01 = upward.x
        let m02 = forward.x
        let m10 = right.y
        let m11 = upward.y
        let m12 = forward.y
        let m20 = right.z
        let m21 = upward.z
        let m22 = forward.z

        let tr = m00 + m11 + m22
        let qw, qx, qy, qz

        if (tr > 0) {
            let S = Math.sqrt(tr + 1.0) * 2; // S=4*qw 
            qw = 0.25 * S;
            qx = (m21 - m12) / S;
            qy = (m02 - m20) / S;
            qz = (m10 - m01) / S;
        } else if ((m00 > m11) && (m00 > m22)) {
            let S = Math.sqrt(1.0 + m00 - m11 - m22) * 2; // S=4*qx 
            qw = (m21 - m12) / S;
            qx = 0.25 * S;
            qy = (m01 + m10) / S;
            qz = (m02 + m20) / S;
        } else if (m11 > m22) {
            let S = Math.sqrt(1.0 + m11 - m00 - m22) * 2; // S=4*qy
            qw = (m02 - m20) / S;
            qx = (m01 + m10) / S;
            qy = 0.25 * S;
            qz = (m12 + m21) / S;
        } else {
            let S = Math.sqrt(1.0 + m22 - m00 - m11) * 2; // S=4*qz
            qw = (m10 - m01) / S;
            qx = (m02 + m20) / S;
            qy = (m12 + m21) / S;
            qz = 0.25 * S;
        }
        let ret = new THREE.Quaternion(qx, qy, qz, qw);

        return ret

    }

    static *arcGenerator(steps: number, angle: number, position: THREE.Vector3, scale) {

        for (let index = 0; index <= steps; index++) {

            let t = index / steps
            let a = angle * t

            console.log(t, a)

            yield [
                new THREE.Vector3(
                    Math.cos(a),
                    0,
                    Math.sin(a)
                )
                    .multiplyScalar(scale)
                    .add(position),
                new THREE.Vector3(
                    -Math.sin(a),
                    0,
                    Math.cos(a)
                )
            ]

        }

    }

    static extrude<T extends THREE.Vector3>(shape: THREE.Shape, pathIterator: IterableIterator<[T, T]>, up: T) {

        let geometry = new THREE.BufferGeometry()

        let shapePoints = shape.getPoints()

        let vertices: THREE.Vector3[] = []
        let geo_vertices: number[] = []
        let index = 0

        for (let step of pathIterator) {

            let upward = step[1].clone().cross(up).cross(step[1]).normalize()
            let quaternion = Utils.lookRotation(step[1], upward)

            let pivot = new Utils.Pivot(step[0], quaternion)


            for (let point of shapePoints) {

                let vec3 = new THREE.Vector3(point.x, point.y, 0)

                vertices.push(pivot.rotate(vec3))

            }

            if (index != 0) {

                for (let shapeIndex = 0; shapeIndex < shapePoints.length - 1; shapeIndex++) {

                    let a = vertices[(index - 1) * shapePoints.length + shapeIndex]
                    let b = vertices[(index - 1) * shapePoints.length + shapeIndex + 1]
                    let c = vertices[index * shapePoints.length + shapeIndex + 1]
                    let d = vertices[index * shapePoints.length + shapeIndex]

                    geo_vertices.push(a.x, a.y, a.z)
                    geo_vertices.push(c.x, c.y, c.z)
                    geo_vertices.push(b.x, b.y, b.z)
                    geo_vertices.push(a.x, a.y, a.z)
                    geo_vertices.push(d.x, d.y, d.z)
                    geo_vertices.push(c.x, c.y, c.z)
                }

                shapePoints.length

            }

            index++

        }

        geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(geo_vertices), 3))

        geometry.computeVertexNormals()

        return geometry

    }

}

class Graph {

    nodes: Set<number> = new Set()
    links: Map<number, Map<number, any>> = new Map()

    constructor() {

    }

    /**
     * 
     * @param {...number} nodes 
     */
    addNode(...nodes: number[]) {

        for (let node of nodes) {

            if (!this.nodes.has(node)) {

                this.nodes.add(node)
                this.links.set(node, new Map())

            }

        }

    }

    /**
     * 
     * @param {...number} nodes 
     */
    removeNode(...nodes: number[]) {

        for (let node of nodes)
            if (this.hasNode(node)) {

                this.nodes.delete(node)

                this.links.delete(node)

                for (let [_, map] of this.links)
                    map.delete(node)

            }

    }

    /**
     * 
     * @param {number} node 
     * @returns {boolean}
     */
    hasNode(node: number) { return this.nodes.has(node) }

    /**
     * 
     * @param {...{source:number, target:number, data:any}} links 
     */
    addLink(...links: { source: number, target: number, data: any }[]) {

        for (let link of links) {

            this.addNode(link.source, link.target)

            this.links.get(link.source).set(link.target, link.data)

        }

    }

    /**
     * 
     * @param {...{source:number, target:number}} links 
     */
    removeLink(...links: { source: number, target: number }[]) {

        for (let link of links)
            if (this.hasLink(link.source, link.target)) {

                this.links.get(link.source).delete(link.target)

            }

    }

    hasLink(source: number, target: number) { return this.links.has(source) && this.links.get(source).has(target) }

    isConnected(node: number) {

        if (!this.hasNode(node)) return true

        let nodeSet: Set<number>
        let currentSet: Set<number> = new Set([node])

        do {

            nodeSet = currentSet
            currentSet = new Set(nodeSet)

            for (let node of nodeSet)
                for (let target of this.links.get(node).keys())
                    currentSet.add(target)

        } while (nodeSet.size != currentSet.size)

        return nodeSet.size == this.nodes.size

    }

    isFullyConnected() {

        for (let node of this.nodes)
            if (!this.isConnected(node)) return false

        return true

    }

}




export { GameEngine, GameScene, GameObject, Timer, FPSCounter, Input, CubicBezierCurve, Utils, Graph }