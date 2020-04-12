/**
 * This class handles a simple camera.
 * The camera can be moved around by dragging the mouse on the canvas
 * and zooming can be performed using the mouse wheel.
 */
class Camera {

    static _ZOOM_FACTOR = 1.125;

    /**
     * Creates a new camera.
     * @param {Canvas} canvas used to detect mouse move and mouse wheel events.
     */
    constructor(canvas) {
        this._canvas = canvas;

        this._zoom = 1;
        this._mousePosition = {x: 0, y: 0};

        this._viewMatrix = mat3.create();

        this._setupEvents();
    }

    _onZoom(event) {
        if (event.deltaY < 0) {
            this._zoom *= Camera._ZOOM_FACTOR;
        }
        else {
            this._zoom /= Camera._ZOOM_FACTOR;
        }

        mat3.fromTranslation(this._viewMatrix, [this._mousePosition.x, this._mousePosition.y]);
        mat3.scale(this._viewMatrix, this._viewMatrix, [this._zoom, this._zoom]);
        mat3.translate(this._viewMatrix, this._viewMatrix, [-this._mousePosition.x, -this._mousePosition.y]);
    }

    _onMouseMove(event) {
        const rect = canvas.getBoundingClientRect();
        this._mousePosition =  {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };
    }

    _setupEvents() {
        this._canvas.onwheel = (event) => this._onZoom(event);
        this._canvas.onmousemove = (event) => this._onMouseMove(event);
    }

    /**
     * Returns the view matrix for this camera.
     * @returns {mat3} the view matrix
     */
    getViewMatrix() {
        return this._viewMatrix;
    }
}