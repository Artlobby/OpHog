( function() {

    // There's only one camera. This class handles panning/zooming, i.e. it
    // keeps track of where you're looking.
    window.game.Camera = {
        /**
         * Current zoom value. A zoom value of 1 is normal, 2 is double size,
         * etc.
         * @type {Number}
         */
        curZoom: 1,

        /**
         * Minimum zoom value. The code doesn't handle this going below 1 very
         * well.
         * @type {Number}
         */
        minZoom: 1,

        /**
         * Maximum zoom value.
         * @type {Number}
         */
        maxZoom: 10,

        /**
         * Current horizontal scroll value. 0 is always the minimum, and as the
         * number gets bigger, you scroll further to the right.
         * @type {Number}
         */
        curPanX: 0,

        /**
         * See curPanX.
         * @type {Number}
         */
        curPanY: 0,

        /**
         * The furthest you can scroll to the right. This needs to be updated
         * whenever a different map is loaded or the zoom level changes.
         * @type {Number}
         */
        maxPanX: 0,

        /**
         * See maxPanX
         * @type {Number}
         */
        maxPanY: 0,

        /**
         * When this is greater than zero, the camera will shake. It goes down
         * every update loop. It is the time in ms to shake for.
         * @type {Number}
         */
        shakeTimer: 0,

        /**
         * The amount to shake the screen horizontally.
         * @type {Number}
         */
        shakeX: 0,

        /**
         * See shakeX
         * @type {Number}
         */
        shakeY: 0,

        /**
         * This is used by the drag event handlers to keep track of where the
         * mouse was when you started dragging.
         * @type {Object}
         */
        dragStartPos: {},

        /**
         * This is used by the transform event handlers to keep track of what
         * the scale value was when you started pinching.
         * @type {Number}
         */
        pinchZoomStartingScale: 0,

        /**
         * Sets the view so that zoom and pan values are within valid ranges.
         * @return {null}
         */
        initialize: function() {
            this.zoomChanged();
        },

        /**
         * Updates the camera, handling input and shaking if necessary.
         * @param  {Object} keysDown A dictionary of number-->boolean. The
         * number is a keycode, and the boolean represents whether that key is
         * held.
         * @param  {Number} delta    The number of ms since the last time this
         * was called.
         * @return {null}
         */
        update: function(keysDown, delta) {
            this.handleInput(keysDown, delta);
            this.updateShake(delta);
        },

        /**
         * Handles some keys to pan/zoom the camera.
         *
         * See 'update' for a description of the arguments.
         */
        handleInput: function(keysDown, delta) {
            var deltaAsSec = delta / 1000;
            var panSpeed = 250 * deltaAsSec;
            if (keysDown[game.Key.DOM_VK_RIGHT] || keysDown[game.Key.DOM_VK_D]) {
                this.curPanX += panSpeed;
            }
            if (keysDown[game.Key.DOM_VK_LEFT] || keysDown[game.Key.DOM_VK_A]) {
                this.curPanX -= panSpeed;
            }
            if (keysDown[game.Key.DOM_VK_DOWN] || keysDown[game.Key.DOM_VK_S]) {
                this.curPanY += panSpeed;
            }
            if (keysDown[game.Key.DOM_VK_UP] || keysDown[game.Key.DOM_VK_W]) {
                this.curPanY -= panSpeed;
            }

            // Clamp the pan values so that we don't scroll out of bounds.
            this.clampPanValues();
        },

        /**
         * If the camera is shaking, then we update the coordinates here.
         * @param  {Number} delta - number of ms since this was last called
         * @return {null}
         */
        updateShake: function(delta) {
            if ( this.shakeTimer <= 0 ) {
                return;
            }

            var amplitude = 50;
            var offset = 10;
            this.shakeX = Math.sin(game.alphaBlink * amplitude) * offset;
            this.shakeY = -Math.cos(game.alphaBlink * amplitude) * offset;

            this.shakeTimer -= delta;
            if ( this.shakeTimer <= 0 ) {
                this.shakeX = 0;
                this.shakeY = 0;
            }
        },

        /**
         * This function clamps the zoom values between min and max, then
         * updates the scroll boundaries.
         * @return {null}
         */
        zoomChanged: function() {
            this.curZoom = Math.min(this.maxZoom, this.curZoom);
            this.curZoom = Math.max(this.minZoom, this.curZoom);

            this.computeScrollBoundaries();
        },

        /**
         * Converts a canvas coordinate (which is bound by the size of the
         * canvas) to world coordinates. This takes panning/zooming into
         * account.
         * @param  {Number} x canvas coordinate in pixels
         * @return {Number}   world coordinate
         */
        canvasXToWorldX: function(x) {
            return (x / this.curZoom) + this.curPanX + this.shakeX;
        },

        /**
         * See canvasXToWorldX.
         */
        canvasYToWorldY: function(y) {
            return y = (y / this.curZoom) + this.curPanY + this.shakeY;
        },
            
        /**
         * When you load a map or change the zoom level, you need to call this
         * function.
         *
         * It figures out the new maximum scroll values.
         * @return {null}
         */
        computeScrollBoundaries: function() {
            var mapWidthInPixels = currentMap.numCols * tileSize * this.curZoom;
            var mapHeightInPixels = currentMap.numRows * tileSize * this.curZoom;

            this.maxPanX = (mapWidthInPixels - screenWidth) / this.curZoom;
            this.maxPanY = (mapHeightInPixels - screenHeight) / this.curZoom;

            this.clampPanValues();
        },

        /**
         * This function prevents scrolling out of bounds.
         * @return {null}
         */
        clampPanValues: function() {
            this.curPanX = Math.min(Math.max(0, this.curPanX), this.maxPanX);
            this.curPanY = Math.min(Math.max(0, this.curPanY), this.maxPanY);
        },

        /**
         * Before drawing something that is influenced by the camera, you need
         * to call this.
         * @param  {Object} ctx Canvas context.
         * @return {null}
         */
        scaleAndTranslate: function(ctx) {
            ctx.scale(this.curZoom, this.curZoom);
            ctx.translate(-this.curPanX - this.shakeX, -this.curPanY - this.shakeY);
        },

        /**
         * Returns a function that will zoom in/out.
         */
        getMouseWheelEventHandler: function() {
            // Enclose this camera in the returned function.
            var camera = this;

            return function(event, delta) {
                var zoomSpeed = .5;
                if ( delta < 0 ) {
                    zoomSpeed *= -1;
                }

                camera.curZoom += zoomSpeed;
                camera.zoomChanged();

                // This is CLOSE to the final formula for zooming at where your
                // scroll wheel is, but it's not perfect, so I'm leaving it
                // commented out for now. The magic numbers are map sizes.
                // camera.curPanX = ((event.offsetX) / (800)) * (camera.maxPanX);
                // camera.curPanY = ((event.offsetY) / (605)) * (camera.maxPanY);
                event.originalEvent.preventDefault();
            };
        },

        /**
         * Returns a function that will set the drag start positions (which will
         * be used by the drag event handler).
         */
        getDragStartEventHandler: function() {
            // Enclose this camera in the returned function.
            var camera = this;

            return function(event) {
                camera.dragStartPos = {
                    origPanX: camera.curPanX,
                    origPanY: camera.curPanY
                };
            };
        },

        /**
         * Returns a function that will pan the camera.
         */
        getDragEventHandler: function() {
            // Enclose this camera in the returned function.
            var camera = this;

            return function(event) {
                camera.curPanX = camera.dragStartPos.origPanX - event.distanceX / camera.curZoom;
                camera.curPanY = camera.dragStartPos.origPanY - event.distanceY / camera.curZoom;
            };
        },

        /**
         * Returns a function that will set the initial zoom position for the
         * transform event handler.
         */
        getTransformStartEventHandler: function() {
            // Enclose this camera in the returned function.
            var camera = this;

            return function(event) {
               camera.pinchZoomStartingScale = event.scale; 
               ctxOrigZoom = camera.curZoom;
            };
        },

        /**
         * Returns a function that will zoom in/out.
         */
        getTransformEventHandler: function() {
            // Enclose this camera in the returned function.
            var camera = this;

            return function(event) {
                camera.curZoom = ctxOrigZoom + (event.scale - camera.pinchZoomStartingScale) / 2.0;
                camera.zoomChanged();
            };
        },

    };

}()); 