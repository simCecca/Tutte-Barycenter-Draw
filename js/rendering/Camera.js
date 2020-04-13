/**
 * This class handles a simple camera.
 * The camera can be moved around by dragging the mouse on the canvas
 * and zooming can be performed using the mouse wheel.
 * 
 * Most of the code used for pan and zoom is taken from here https://stackoverflow.com/questions/57892652/webgl-2d-camera-zoom-to-mouse-point,
 * thanks gman
 */
class Camera {

    static _ZOOM_FACTOR = 1.125;

    /**
     * Creates a new camera.
     * @param {Canvas} canvas used to detect mouse move and mouse wheel events.
     */
    constructor(canvas) {
        this._canvas = canvas;

        this._mousePosition = vec3.fromValues(0.0, 0.0, 1.0);

        this._zoom = 1.0;
        this._cameraPosition = vec3.fromValues(0, 0, 1.0);

        this._clipMatrix = mat3.fromValues(2.0 / canvas.width, 0.0, 0.0,
            0.0, 2.0 / -canvas.height, 0.0,
            -1.0, 1.0, 1.0);

        this._mouseIsDown = false;
        this._startDragCameraPosition = vec3.fromValues(0.0, 0.0, 1.0);
        this._startDragMousePosition = vec3.fromValues(0.0, 0.0, 1.0);
        this._startDragInverseViewClipMatrix = mat3.create();

        this._setupEvents();
    }

    _getInverseViewClipMatrix() {
        const viewClip = mat3.create();
        mat3.mul(viewClip, this._clipMatrix, this.getViewMatrix());

        const inverse = mat3.create();
        mat3.invert(inverse, viewClip);

        return inverse;
    }

    _onZoom(event) {
        const preZoomMousePositionViewSpace = vec3.create();
        vec3.transformMat3(preZoomMousePositionViewSpace, this._mousePosition, this._getInverseViewClipMatrix());

        if (event.deltaY < 0) {
            this._zoom /= Camera._ZOOM_FACTOR;
        }
        else {
            this._zoom *= Camera._ZOOM_FACTOR;
        }

        const postZoomMousePositionViewSpace = vec3.create();
        vec3.transformMat3(postZoomMousePositionViewSpace, this._mousePosition, this._getInverseViewClipMatrix());

        const difference = vec3.create();
        vec3.sub(difference, preZoomMousePositionViewSpace, postZoomMousePositionViewSpace);

        vec3.add(this._cameraPosition, this._cameraPosition, difference);

        this._cameraPosition[2] = 1;
    }

    _onMouseMove(event) {
        // todo do not update me here, do it just when the size of the canvas changes
        this._clipMatrix = mat3.fromValues(2.0 / this._canvas.width, 0.0, 0.0,
            0.0, 2.0 / -this._canvas.height, 0.0,
            -1.0, 1.0, 1.0);

        // update mouse position
        const rect = this._canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        this._mousePosition = vec3.fromValues(-1 + 2 * x / this._canvas.width, +1 - 2 * y / this._canvas.height, 1.0);

        const transformedMouse = vec3.create();
        vec3.transformMat3(transformedMouse, this._mousePosition, this._startDragInverseViewClipMatrix);

        console.log(mat3.str(this._startDragInverseViewClipMatrix));
        console.log(transformedMouse);

        // translate the camera
        if (this._mouseIsDown === true) {
            const transformedMouse = vec3.create();
            vec3.transformMat3(transformedMouse, this._mousePosition, this._startDragInverseViewClipMatrix);

            this._cameraPosition = vec3.clone(this._startDragCameraPosition);
            vec3.add(this._cameraPosition, this._cameraPosition, this._startDragMousePosition);
            vec3.sub(this._cameraPosition, this._cameraPosition, transformedMouse);

            this._cameraPosition[2] = 1.0;
        }
    }

    _onMouseDown(event) {
        this._mouseIsDown = true;

        this._startDragInverseViewClipMatrix = mat3.clone(this._getInverseViewClipMatrix());
        this._startDragCameraPosition = vec3.clone(this._cameraPosition);

        vec3.transformMat3(this._startDragMousePosition, this._mousePosition, this._getInverseViewClipMatrix());
    }

    _onMouseUp() {
        this._mouseIsDown = false;
    }

    _setupEvents() {
        this._canvas.onwheel = (event) => this._onZoom(event);
        this._canvas.onmousemove = (event) => this._onMouseMove(event);
        this._canvas.onmousedown = (event) => this._onMouseDown(event);
        this._canvas.onmouseup = (event) => this._onMouseUp(event);
    }

    /**
     * Returns the view matrix for this camera.
     * @returns {mat3} the view matrix
     */
    getViewMatrix() {
        const cameraMatrix = mat3.create();
        mat3.fromTranslation(cameraMatrix, this._cameraPosition);
        mat3.scale(cameraMatrix, cameraMatrix, [this._zoom, this._zoom]);

        const viewMatrix = mat3.create();
        mat3.invert(viewMatrix, cameraMatrix);

        return viewMatrix;
    }
}