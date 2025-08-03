export class RealTimeRenderer {
    #zero = 0;
    #renderActive = false;

    #renderFrame;

    #requestFrameId;

    /**
     * @param {(delta: number) => void} renderFrame 
     */
    constructor(renderFrame) {
        this.#renderFrame = renderFrame;
    }
    
    #render(timestamp) {
        if (!this.#renderActive) {
            cancelAnimationFrame(this.#requestFrameId);
            return;
        }
        this.#renderFrame(timestamp - this.#zero);
        this.#requestFrameId = requestAnimationFrame((t) => this.#render(t));
    }

    /**
     * @type {boolean}
     */
    get renderActive() {
        return this.renderActive;
    }

    set renderActive(renderActive) {
        this.#renderActive = renderActive;
        if (renderActive) {
            this.#zero = document.timeline.currentTime;
            requestAnimationFrame((t) => this.#render(t));
        } else {
            this.#zero = 0;
            cancelAnimationFrame(this.#requestFrameId);
        }
    }
}