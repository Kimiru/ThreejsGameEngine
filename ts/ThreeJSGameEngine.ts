import { Console } from 'console'
import * as THREE from 'three'
import { Mesh } from 'three'

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
            if (obj instanceof GameObject)
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


export { GameEngine, GameScene, GameObject, Timer, FPSCounter, Input }