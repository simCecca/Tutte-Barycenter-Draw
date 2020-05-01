/**
 * This class handles a simple camera.
 * The camera can be moved around by dragging the mouse on the canvas
 * and zooming can be performed using the mouse wheel.
 * 
 * Most of the code used for pan and zoom is taken from here https://stackoverflow.com/questions/57892652/webgl-2d-camera-zoom-to-mouse-point,
 * thanks gman
 */
export class Camera {

    static _ZOOM_FACTOR = 0.006;

    /**
     * Creates a new camera.
     * @param {Canvas} canvas used to detect mouse move and mouse wheel events.
     */
    constructor(canvas) {
        this._canvas = canvas;

        this._zoom = 1.0;
        this._cameraPosition = vec3.fromValues(0, 0, 1.0); // local space position of the mouse

        // clip matrix, used to compute canvas space position of the mouse
        this._clipMatrix = mat3.create();

        this._mouseIsDown = false;

        this._previousFingerDistance = null;

        /** position of the camera when the use starts moving it */
        this._startDragCameraPosition = vec3.fromValues(0.0, 0.0, 1.0);

        /** position of the mouse (canvas space) when the user starts moving the camera */
        this._startDragMousePosition = vec3.fromValues(0.0, 0.0, 1.0);
        
        /** the inverse view clip matrix  */
        this._startDragInverseViewClipMatrix = mat3.create();

        this._panningDisabled = false;

        this._setupEvents();
    }

    disablePanning() {
        this._panningDisabled = true;
    }

    enablePanning() {
        this._panningEnabled = false;
    }

    _getInverseViewClipMatrix() {
        const viewClip = mat3.create();
        mat3.mul(viewClip, this._clipMatrix, this.getViewMatrix());

        const inverse = mat3.create();
        mat3.invert(inverse, viewClip);

        return inverse;
    }

    _getClipSpaceMousePosition(event) {
        // update mouse position
        const rect = this._canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        /* convert the mouse from local space to clip space.
         * Once in clip space we can retrieve the actual canvas space coords using the inverse view clip space matrix
         * by using the inverse transform we can get the exact canvas space position of the mouse */
        return vec3.fromValues(-1 + window.devicePixelRatio * 2 * x / this._canvas.width, 1 - window.devicePixelRatio * 2 * y / this._canvas.height, 1.0);
    }

    _startPanning(event) {
        // save the inverse view clip matrix and camera position and canvas space position of the mouse
        // when dragging starts
        this._startDragInverseViewClipMatrix = mat3.clone(this._getInverseViewClipMatrix());
        this._startDragCameraPosition = vec3.clone(this._cameraPosition);

        vec3.transformMat3(this._startDragMousePosition, this._getClipSpaceMousePosition(event), this._getInverseViewClipMatrix());
    }

    _onZoom(event) {
        // canvas space position of the mouse before zooming
        const preZoomMousePositionViewSpace = vec3.create();
        vec3.transformMat3(preZoomMousePositionViewSpace, this._getClipSpaceMousePosition(event), this._getInverseViewClipMatrix());

        this._zoom *= Math.pow(2, event.deltaY * Camera._ZOOM_FACTOR);

        // canvas space position of the mouse after zooming
        const postZoomMousePositionViewSpace = vec3.create();
        vec3.transformMat3(postZoomMousePositionViewSpace, this._getClipSpaceMousePosition(event), this._getInverseViewClipMatrix());

        // compute how much the mouse "moved" after zooming
        const difference = vec3.create();
        vec3.sub(difference, preZoomMousePositionViewSpace, postZoomMousePositionViewSpace);

        // compensate for the mouse movement so that the zoom is actually performed 
        // towards the mouse position
        vec3.add(this._cameraPosition, this._cameraPosition, difference);

        this._cameraPosition[2] = 1; // make sure camera position is still in valid homogeneous coords

        // need to reset the panning parameters as zooming changes the canvas space coordinates
        // every time zooming occurs we reset the panning information, this allows zooming and panning together
        this._startPanning(event);
    }

    _onMouseMove(event) {
        // perform the inverse of the mouse position
        const transformedMouse = vec3.create();
        vec3.transformMat3(transformedMouse, this._getClipSpaceMousePosition(event), this._startDragInverseViewClipMatrix);

        // translate the camera
        if (this._mouseIsDown === true) {
            /* compute the difference between the canvas space of the mouse before dragging
             * and the current canvas space position of the mosue */
            const transformedMouse = vec3.create();
            vec3.transformMat3(transformedMouse, this._getClipSpaceMousePosition(event), this._startDragInverseViewClipMatrix);

            this._cameraPosition = vec3.clone(this._startDragCameraPosition);
            vec3.add(this._cameraPosition, this._cameraPosition, this._startDragMousePosition);
            vec3.sub(this._cameraPosition, this._cameraPosition, transformedMouse);

            this._cameraPosition[2] = 1.0; // make sure camera position is still in valid homogeneous coords
        }
    }

    _onMouseDown(event) {
        this._mouseIsDown = true;

        this._startPanning(event);
    }

    _onMouseUp() {
        this._mouseIsDown = false;
    }

    _onTouchStart(event) {
        // if only one finger then it is the same as mouse down
        if (event.touches.length === 1) {
            this._onMouseDown({
                clientX: event.touches[0].clientX,
                clientY: event.touches[0].clientY
            });
        }

        // if using two fingers we must store the distance between the fingers so that a 
        // variation thereof can be used to know how much to zoom
        else if (event.touches.length === 2) {
            // call mouse down as we can even perform panning using two fingers
            // position of the mouse is the average of the fingers' positions
            const mouseDownEvent = {
                clientX: (event.touches[0].clientX + event.touches[1].clientX) / 2,
                clientY: (event.touches[0].clientY + event.touches[1].clientY) / 2,
            };

            this._onMouseDown(mouseDownEvent);

            // compute the initial distance between fingers
            const dist = Math.hypot(
                event.touches[0].clientX - event.touches[1].clientX,
                event.touches[0].clientY - event.touches[1].clientY);

            this._previousFingerDistance = dist;
        }
    }

    _onTouchMove(event) {
        event.preventDefault();

        // one finger, just like mouse move
        if (event.touches.length === 1) {
            this._onMouseMove({
                clientX: event.touches[0].clientX,
                clientY: event.touches[0].clientY
            });
        }

        // two fingers, compute the variation between the previous and the current distance between
        // fingers to zoom
        else if (event.touches.length === 2) {
            const dist = Math.hypot(
                event.touches[0].clientX - event.touches[1].clientX,
                event.touches[0].clientY - event.touches[1].clientY);
            
            const mouseMoveEvent = {
                clientX: (event.touches[0].clientX + event.touches[1].clientX) / 2,
                clientY: (event.touches[0].clientY + event.touches[1].clientY) / 2,
                deltaY: -(dist - this._previousFingerDistance) * 1.25
            };

            this._previousFingerDistance = dist;

            this._onMouseMove(mouseMoveEvent);
            this._onZoom(mouseMoveEvent);
        }
    }

    _onTouchEnd(event) {
        if (event.touches.length === 0) {
            this._onMouseUp(event);
        }
        else { // there are still fingers on the screen, restart panning using that finger

            // convert finger to mouse event
            const mouseEvent = {
                clientX: event.touches[0].clientX,
                clientY: event.touches[0].clientY
            };

            this._startPanning(mouseEvent);
        }
    }

    _setupEvents() {
        this._canvas.onwheel = (event) => this._onZoom(event);
        this._canvas.onmousemove = (event) => this._onMouseMove(event);
        this._canvas.onmousedown = (event) => this._onMouseDown(event);
        this._canvas.onmouseup = (event) => this._onMouseUp(event);
        this._canvas.ontouchstart = (event) => this._onTouchStart(event);
        this._canvas.ontouchend = (event) => this._onTouchEnd(event);
        this._canvas.ontouchmove = (event) => this._onTouchMove(event);
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
