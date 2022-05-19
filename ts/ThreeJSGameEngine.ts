import * as THREE from 'three'

const gameEngineConstructorArguments = {
    width: innerWidth,
    height: innerHeight,
    physicallyCorrectLights: false
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

        //TODO Scene's Camera aspect ratio
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

        this.#currentScene = scene

    }

    #switchScene(): void {

        if (this.#nextScene !== undefined) {

            this.#currentScene = this.#nextScene
            this.#nextScene = undefined

            this.resize(this.#width, this.#height)

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
    children: GameObject[] = []

    constructor() {

        super()

    }

    update(dt: number) {

        for (let child of this.children) {
            child.update(dt)
        }

    }

    render(renderer: THREE.WebGLRenderer, ctx: CanvasRenderingContext2D) {

        if (this.camera !== null) {

            renderer.render(this, this.camera)

            for (let child of this.children) {
                child.render(ctx)
            }

        }



    }

    add(...object: GameObject[]): this {

        super.add(...object)

        return this
    }

    remove(...object: GameObject[]): this {

        super.add(...object)

        return this

    }

}

class GameObject extends THREE.Object3D {

    children: GameObject[] = []

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
            for (let child of this.children) {
                child.update(dt)
            }

    }

    /**
     * 
     * @param {CanvasRenderingContext2D} ctx 
     */
    render(ctx: CanvasRenderingContext2D) {

        if (this.onDraw(ctx))
            for (let child of this.children) {
                child.render(ctx)
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
    onDraw(ctx: CanvasRenderingContext2D): boolean {

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

export { GameEngine, GameScene, GameObject, Timer }