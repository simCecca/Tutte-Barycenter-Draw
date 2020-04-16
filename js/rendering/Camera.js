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
        this._cameraPosition = vec3.fromValues(0, 0, 1.0); // local space position of the mouse

        // clip matrix, used to compute canvas space position of the mouse
        this._clipMatrix = mat3.create();

        this._mouseIsDown = false;

        /** position of the camera when the use starts moving it */
        this._startDragCameraPosition = vec3.fromValues(0.0, 0.0, 1.0);

        /** position of the mouse (canvas space) when the user starts moving the camera */
        this._startDragMousePosition = vec3.fromValues(0.0, 0.0, 1.0);
        
        /** the inverse view clip matrix  */
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
        // canvas space position of the mouse before zooming
        const preZoomMousePositionViewSpace = vec3.create();
        vec3.transformMat3(preZoomMousePositionViewSpace, this._mousePosition, this._getInverseViewClipMatrix());

        if (event.deltaY < 0) {
            this._zoom /= Camera._ZOOM_FACTOR;
        }
        else {
            this._zoom *= Camera._ZOOM_FACTOR;
        }

        // canvas space position of the mouse after zooming
        const postZoomMousePositionViewSpace = vec3.create();
        vec3.transformMat3(postZoomMousePositionViewSpace, this._mousePosition, this._getInverseViewClipMatrix());

        // compute how much the mouse "moved" after zooming
        const difference = vec3.create();
        vec3.sub(difference, preZoomMousePositionViewSpace, postZoomMousePositionViewSpace);

        // compensate for the mouse movement so that the zoom is actually performed 
        // towards the mouse position
        vec3.add(this._cameraPosition, this._cameraPosition, difference);

        this._cameraPosition[2] = 1; // make sure camera position is still in valid homogeneous coords
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

        /* convert the mouse from local space to clip space.
         * Once in clip space we can retrieve the actual canvas space coords using the inverse view clip space matrix
         * by using the inverse transform we can get the exact canvas space position of the mouse */
        this._mousePosition = vec3.fromValues(-1 + 2 * x / this._canvas.width, 1 - 2 * y / this._canvas.height, 1.0);

        // perform the 
        const transformedMouse = vec3.create();
        vec3.transformMat3(transformedMouse, this._mousePosition, this._startDragInverseViewClipMatrix);

        // translate the camera
        if (this._mouseIsDown === true) {
            /* compute the difference between the canvas space of the mouse before dragging
             * and the current canvas space position of the mosue */
            const transformedMouse = vec3.create();
            vec3.transformMat3(transformedMouse, this._mousePosition, this._startDragInverseViewClipMatrix);

            this._cameraPosition = vec3.clone(this._startDragCameraPosition);
            vec3.add(this._cameraPosition, this._cameraPosition, this._startDragMousePosition);
            vec3.sub(this._cameraPosition, this._cameraPosition, transformedMouse);

            this._cameraPosition[2] = 1.0; // make sure camera position is still in valid homogeneous coords
        }
    }

    _onMouseDown(event) {
        this._mouseIsDown = true;

        // save the inverse view clip matrix and camera position and canvas space position of the mouse
        // when dragging starts
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
     * updates the clip matrix.
     * To be called when the dimensions of the canvas change
     * @param {mat3} clipMatrix the new clip matrix
     */
    updateClipMatrix(clipMatrix) {
        this._clipMatrix = clipMatrix;
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
