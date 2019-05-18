
class TakeMePhoto {

    constructor({
        containerId,
        width=400,
        height=400,
        defaultVideoPath,
        captureMsg='Capturer'
    }) {

        this.config = {
            started: false,
            capturing: false,
        }

        this.container = document.querySelector(`#${containerId}`);
        if(!this.container) {
            throw new Error('container must be a valid Html element');
        }

        const video = document.createElement('video');
        video.width = width;
        video.height = height;
        video.autoplay = true;
        video.loop = true;
        video.className = 'stream-video';
        this.video = video;

        const timerSpan = document.createElement('span');
        timerSpan.textContent = '';
        timerSpan.style.display = 'none';
        timerSpan.className = 'timer-span';
        this.timerSpan = timerSpan;

        const capture = document.createElement('div');
        this.capture = capture;

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.className = 'main-canvas';
        this.canvas = canvas;
        this.capture.appendChild(this.canvas);

        const captureButton = document.createElement('button');
        captureButton.textContent = captureMsg;
        captureButton.className = 'capture-button';
        this.captureButton = captureButton;

        this.constraints = {
            audio: false,
            video: { width, height }
        }

        this.stream = null;

        this.defaultVideoPath = defaultVideoPath;
    }

    start() {

        const { started } = this.config;
        
        if(!started) {
            this.config.started = true;

            this.container.appendChild(this.video);
            this.container.appendChild(this.captureButton);
            this.container.appendChild(this.timerSpan);
            this.container.appendChild(this.capture);

            this.initStream();
            this.initFilters();
        }
    }

    async initStream() {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia(this.constraints);
            this.showStream(this.stream);
        } catch (e) {
            this.userMediaError(e);
            throw e;
        }
    }

    userMediaError(e) {
        if(this.defaultVideoPath) {
            this.video.src = this.defaultVideoPath;
        }
        this.timerSpan.style.display = 'inline-block';
        this.timerSpan.textContent = e;

        this.captureButton.remove();
        this.canvas.remove();
    }

    showStream(stream) {
        window.stream = stream;
        this.video.srcObject = stream;
        this.captureListener();
    }

    takePicture() {

        const { filter: { initialized } } = this.config;

        if(!initialized) this.setupFilters();

        const context = this.canvas.getContext('2d');
        context.drawImage(this.video, 0, 0);

        this.config.capturing = false;
    }

    captureListener() {
        this.captureButton.addEventListener("click", () => {

            this.timerSpan.style.display = 'inline-block';

            const { capturing } = this.config;
            const timer = (i, callback) => {
                if( i>0 ){
                    this.timerSpan.innerHTML = `Be Ready! ${i}`;
                    setTimeout(timer, 1000, --i, callback.bind(this));
                    return;
                }
                this.timerSpan.textContent = 'done';
                callback();
            }

            if(!capturing) {
                this.config.capturing = true;
                timer(3, this.takePicture);
            }
        });
    }

    /**
     * Configure filters buttons and append them to the dom
     * setup the click listeners
    */
    setupFilters() {
        this.config.filter.initialized = true;
        
        const { filter: {filterNames, filterFuncs} } = this.config;

        const filterWrapper = document.createElement('div');
        filterWrapper.className = 'filter-wrapper';

        const controlWrapper = document.createElement('div');
        controlWrapper.className = 'control-wrapper';

        filterNames.map((filter, i) => {
            const button = document.createElement('button');
            button.textContent = filter;
            button.className = 'takemephoto-btn'; // to give the users the ability to style the buttons
            button.addEventListener('click', () => this.setupFilter(filterFuncs[i]) );
            
            filterWrapper.appendChild(button);
        });
        this.capture.appendChild(filterWrapper);

        const cropButton = document.createElement('button');
        cropButton.textContent = 'Crop';
        cropButton.className = 'takemephoto-btn'; // to give the users the ability to style the buttons
        cropButton.addEventListener('click', () => this.setupCrop() );
        
        controlWrapper.appendChild(cropButton);

        const downloadButton = document.createElement('button');
        downloadButton.textContent = 'Download';
        downloadButton.className = 'takemephoto-btn'; // to give the users the ability to style the buttons
        downloadButton.addEventListener('click', () => {

            this.generateDownloadLink().then(link => {
                link.click();
            });
        } );

        controlWrapper.appendChild(downloadButton);

        this.capture.appendChild(controlWrapper);
    }

    async generateDownloadLink() {
        const imgdata = await this.canvas.toDataURL('image/png');
        const adjustedData = imgdata.replace(/^data:image\/png/,'data:application/octet-stream');

        const a = document.createElement('a');
        a.download = this.generateRandomName();
        a.href = adjustedData;
        return a;
    }

    generateRandomName() {
        let name = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5);
        name += '.png';
        return name;
    }

    /** 
     * Setup a the crop each time the user clicks the crop button
    */
    setupCrop() {

        const cropContainer = document.createElement('div');
        cropContainer.style = 'display: flex; flex-direction: row; justify-content: center; position: fixed; background-color: rgba(0, 0, 0, 0.5); height: 100%; width: 100%; top: 0; left: 0;';

        const wrapper = document.createElement('div');
        wrapper.id = 'takemephoto-wrapper'; // this will help the user style takeme-photo elements
        wrapper.style = 'width: 400px; align-self: center; display: grid; grid-template-columns: 1fr 1fr; grid-gap: 4px;';
        cropContainer.appendChild(wrapper);

        const cancel = document.createElement('button');
        cancel.id = 'takemephoto-cancel'; // gives the user the ability to style the cancel button
        cancel.textContent = 'Cancel';
        wrapper.appendChild(cancel);

        const apply = document.createElement('button');
        apply.id = 'takemephoto-apply'; // gives the user the ability to style the apply button
        apply.textContent = 'Apply';
        wrapper.appendChild(apply);


        // Resizable Setup
        const resizableContainer = document.createElement('div');
        resizableContainer.classList.add('resizable-container');
        resizableContainer.style.position = 'relative';
        resizableContainer.style.gridColumn = '1/ span 2';
        wrapper.appendChild(resizableContainer);


        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 400;
        canvas.getContext('2d').drawImage(this.canvas, 0, 0);
        resizableContainer.appendChild(canvas);

        const resizable = document.createElement('div');
        resizable.classList.add('resizable');
        resizable.style = `position: absolute; top: 0; left: 0; width: ${canvas.width}px; height: ${canvas.height}px; border: 2px dashed #000; box-sizing: border-box; cursor: move;z-index: 9999;`;
        resizableContainer.appendChild(resizable);

        // Resize Wrists Start
        const resizeWristSize = 5;
        // resize-wrists params
        const resizeWristsParams = [
            {
                className: 'no',
                style: 'top: -5px; left: -5px; cursor: nwse-resize;',
            },
            {
                className: 'nn',
                style: `top: -5px; left: ${canvas.width/2 - resizeWristSize}px; cursor: ns-resize;`,
            },
            {
                className: 'ne',
                style: 'top: -5px; right: -5px; cursor: nesw-resize;',
            },
            {
                className: 'oo',
                style: `top: ${canvas.height/2 - resizeWristSize}px; left: -5px; cursor: ew-resize;`,
            },
            {
                className: 'ee',
                style: `top: ${canvas.height/2 - resizeWristSize}px; right: -5px; cursor: ew-resize;`,
            },
            {
                className: 'so',
                style: 'bottom: -5px; left: -5px; cursor: nesw-resize;',
            },
            {
                className: 'ss',
                style: `bottom: -5px; left: ${canvas.width/2 - resizeWristSize}px; cursor: ns-resize;`,
            },
            {
                className: 'se',
                style: 'bottom: -5px; right: -5px; cursor: nwse-resize;',
            },
        ];

        const resizeWrists = resizeWristsParams.map(resizeWristsParam => {
            const resizeWrist = document.createElement('span');
            resizeWrist.classList.add('resize-wrist', resizeWristsParam.className);
            resizeWrist.style = `display:block; position: absolute; background-color: black; width: ${resizeWristSize * 2}px; height: ${resizeWristSize * 2}px;${resizeWristsParam.style}`;
            resizable.appendChild(resizeWrist);

            return resizeWrist;
        });

        // ****************** Listeners Setup *******************

        // create drag and drop behaviour for the resizable element
        resizable.onmousedown = (e) => {

            if(e.target != resizable) return false;

            const original_x = resizable.getBoundingClientRect().left - canvas.getBoundingClientRect().left;
            const original_y = resizable.getBoundingClientRect().top - canvas.getBoundingClientRect().top;
            const { width, height } = resizable.getBoundingClientRect();

            const original_mouse_x = e.pageX;
            const original_mouse_y = e.pageY;

            const { left:leftLimit, right:rightLimit, top:topLimit, bottom:bottomLimit } = canvas.getBoundingClientRect();

            function startMoving(e) {

                const left = original_x + (e.pageX - original_mouse_x);
                const top = original_y + (e.pageY - original_mouse_y);

                if( (leftLimit+left+width) <= rightLimit ) {
                    if(left >= 0) {
                        resizable.style.left = `${left}px`;
                    }else {
                        resizable.style.left = '0';
                    }
                }else {
                    resizable.style.left = `${rightLimit-leftLimit-width}px`;
                }
                
                if( (topLimit+top+height) <= bottomLimit ) {
                    if(top >= 0) {
                        resizable.style.top = `${top}px`;
                    }else {
                        resizable.style.top = `0`;
                    }
                }else {
                    resizable.style.top = `${bottomLimit-topLimit-height}px`;
                }
            }

            function stopMoving() {
                window.removeEventListener('mousemove', startMoving);
                window.removeEventListener('mouseup', stopMoving);
            }

            window.addEventListener('mousemove', startMoving);
            window.addEventListener('mouseup', stopMoving);

        }

        // create the controls for the reisze wrists
        resizeWrists.forEach(resizeWrist => {

            resizeWrist.onmousedown = (e) => {

                const MIN_SIZE = 20;

                const { width:original_width, height:original_height } = resizable.getBoundingClientRect();


                const original_x = resizable.getBoundingClientRect().left - canvas.getBoundingClientRect().left;
                const original_y = resizable.getBoundingClientRect().top - canvas.getBoundingClientRect().top;

                const original_mouse_x = e.pageX;
                const original_mouse_y = e.pageY;

                const { left:leftLimit, right:rightLimit, top:topLimit, bottom:bottomLimit } = canvas.getBoundingClientRect();

                function updateCenterWrists() {
                    resizeWrists.forEach(resizeWrist => {

                        const classList = resizeWrist.classList;
                        const { width, height } = resizable.getBoundingClientRect();

                        if(classList.contains('nn') || classList.contains('ss')) {
                            resizeWrist.style.left = `${width/2 - resizeWristSize}px`;
                            return ;
                        }

                        if(classList.contains('oo') || classList.contains('ee')) {
                            resizeWrist.style.top = `${height/2 - resizeWristSize}px`;
                            return ;
                        }

                    });
                }
            
                function startResizing(e) {

                    const classList = resizeWrist.classList;

                    if(classList.contains('no')) {

                        const width = original_width - (e.pageX - original_mouse_x);
                        const height = original_height - (e.pageY - original_mouse_y);
                        const left = original_x + (e.pageX - original_mouse_x);
                        const top = original_y + (e.pageY - original_mouse_y);

                        if(width >= MIN_SIZE && left >= 0) {
                            resizable.style.width = `${width}px`;
                            resizable.style.left = `${left}px`;
                        }

                        if(height >= MIN_SIZE && top >= 0) {
                            resizable.style.height = `${height}px`;
                            resizable.style.top = `${top}px`;
                        }

                        updateCenterWrists();
                        
                        return ;
                    }
                    if(classList.contains('nn')) {

                        const height = original_height - (e.pageY - original_mouse_y);
                        const top = original_y + (e.pageY - original_mouse_y);

                        if(height >= MIN_SIZE && top >= 0) {
                            resizable.style.height = `${height}px`;
                            resizable.style.top = `${top}px`;
                        }

                        updateCenterWrists();
                        
                        return ;
                    }
                    if(classList.contains('ne')) {

                        const width = original_width + (e.pageX - original_mouse_x);
                        const height = original_height - (e.pageY - original_mouse_y);
                        const top = original_y + (e.pageY - original_mouse_y);

                        if(width >= MIN_SIZE && (leftLimit+original_x+width <= rightLimit) ) {
                            resizable.style.width = `${width}px`;
                        }

                        if(height >= MIN_SIZE && top >= 0) {
                            resizable.style.height = `${height}px`;
                            resizable.style.top = `${top}px`;
                        }

                        updateCenterWrists();
                        
                        return ;
                    }

                    if(classList.contains('oo')) {

                        const width = original_width - (e.pageX - original_mouse_x);
                        const left = original_x + (e.pageX - original_mouse_x);

                        if(width >= MIN_SIZE && left >= 0) {
                            resizable.style.width = `${width}px`;
                            resizable.style.left = `${left}px`;
                        }

                        updateCenterWrists();
                        
                        return ;
                    }
                    if(classList.contains('ee')) {

                        const width = original_width + (e.pageX - original_mouse_x);

                        if(width >= MIN_SIZE && (leftLimit+original_x+width <= rightLimit)) {
                            resizable.style.width = `${width}px`;
                        }

                        updateCenterWrists();
                        
                        return ;
                    }

                    if(classList.contains('so')) {

                        const width = original_width - (e.pageX - original_mouse_x);
                        const height = original_height + (e.pageY - original_mouse_y);
                        const left = original_x + (e.pageX - original_mouse_x);

                        if(width >= MIN_SIZE && left >= 0) {
                            resizable.style.width = `${width}px`;
                            resizable.style.left = `${left}px`;
                        }

                        if(height >= MIN_SIZE && (topLimit+original_y+height <= bottomLimit) ) {
                            resizable.style.height = `${height}px`;
                        }

                        updateCenterWrists();
                        
                        return ;
                    }
                    if(classList.contains('ss')) {

                        const height = original_height + (e.pageY - original_mouse_y);

                        if(height >= MIN_SIZE && (topLimit+original_y+height <= bottomLimit) ) {
                            resizable.style.height = `${height}px`;
                        }

                        updateCenterWrists();
                        
                        return ;
                    }
                    if(classList.contains('se')) {

                        const width = original_width + (e.pageX - original_mouse_x);
                        const height = original_height + (e.pageY - original_mouse_y);

                        if(width >= MIN_SIZE && (leftLimit+original_x+width <= rightLimit) ) {
                            resizable.style.width = `${width}px`;
                        }

                        if(height >= MIN_SIZE && (topLimit+original_y+height <= bottomLimit) ) {
                            resizable.style.height = `${height}px`;
                        }

                        updateCenterWrists();
                        
                        return ;
                    }

                }
            
                function stopResizing() {
                    window.removeEventListener('mousemove', startResizing);
                    window.removeEventListener('mouseup', stopResizing);
                }
            
                window.addEventListener('mousemove', startResizing);
                window.addEventListener('mouseup', stopResizing);
            }

        });

        cancel.addEventListener('click', () => {
            cropContainer.remove();
        });

        apply.addEventListener('click', () => {

            const { left, top, width, height } = resizable.getBoundingClientRect();
            const { left:canvasLeft, top:canvasTop } = canvas.getBoundingClientRect();
            
            const o_left = left - canvasLeft;
            const o_top = top - canvasTop;

            const context = this.canvas.getContext('2d');
            context.clearRect(0, 0, this.canvas.width, this.canvas.height);
            context.drawImage(canvas, o_left, o_top, width, height, 0, 0, this.canvas.width, this.canvas.height);
            cropContainer.remove();
        });

        cropContainer.addEventListener('click', (e) => {
            if(e.target === cropContainer) {
                cropContainer.remove();
            }
        });

        this.container.appendChild(cropContainer);
    }

    /** 
     * Setup a single filter each time the user clicks a filter button
    */
    setupFilter(filter) {
        const filterContainer = document.createElement('div');
        filterContainer.style = 'display: flex; flex-direction: row; justify-content: center; position: fixed; background-color: rgba(0, 0, 0, 0.5); height: 100%; width: 100%; top: 0; left: 0;';

        const wrapper = document.createElement('div');
        wrapper.id = 'takemephoto-wrapper'; // this will help the user style takeme-photo elements
        wrapper.style = 'width: 400px; align-self: center; display: grid; grid-template-columns: 1fr 1fr; grid-gap: 4px;';

        const cancel = document.createElement('button');
        cancel.id = 'takemephoto-cancel'; // gives the user the ability to style the cancel button
        cancel.textContent = 'Cancel';
        wrapper.appendChild(cancel);

        const apply = document.createElement('button');
        apply.id = 'takemephoto-apply'; // gives the user the ability to style the apply button
        apply.textContent = 'Apply';
        wrapper.appendChild(apply);

        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 400;
        canvas.style = 'grid-column: 1/ span 2;';
        canvas.getContext('2d').drawImage(this.canvas, 0, 0);
        wrapper.appendChild(canvas);

        // slider starts
        const sliderWrapper = document.createElement('div');
        sliderWrapper.style = 'grid-column: 1/ span 2;display: grid;grid-template-columns: 9fr 1fr;';

        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = filter.min;
        slider.max = filter.max;
        slider.value = filter.default;

        sliderWrapper.appendChild(slider);

        const span = document.createElement('span');
        span.textContent = `${filter.default}${filter.unit}`;
        span.style = 'color: white; font-weight: bold;';
        sliderWrapper.appendChild(span);

        wrapper.appendChild(sliderWrapper);

        // listeners setup
        slider.addEventListener('input', (e) => {
            span.textContent = `${e.target.value}${filter.unit}`;
            this.applyFilter(canvas, e.target.value, filter);
        });

        cancel.addEventListener('click', () => {
            filterContainer.remove();
        });

        apply.addEventListener('click', () => {
            const context = this.canvas.getContext('2d');
            context.clearRect(0, 0, this.canvas.width, this.canvas.height);
            context.drawImage(canvas, 0, 0);
            filterContainer.remove();
        });

        filterContainer.addEventListener('click', (e) => {
            if(e.target === filterContainer) {
                filterContainer.remove();
            }
        });

        filterContainer.appendChild(wrapper);
        this.container.appendChild(filterContainer);
    }

    /** 
     * this function applies the given filter to the given canvas
    */
   applyFilter(canvas, value, filter) {

        const { name, unit } = filter;

        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.filter = `${name}(${value}${unit})`;
        ctx.drawImage(this.canvas, 0, 0);
   }

    /**
     * Initialize filters configuration from functions names to filters properties...  
    */
    initFilters() {
        this.config.filter = {
            initialized: false,
            filterNames: ['Blur', 'Brightness', 'Contrast', 'Grayscale', 'Hue rotate', 'Opacity', 'Saturate', 'Sepia'],
            filterFuncs: [
                {
                    name: 'blur',
                    unit: 'px',
                    default: 0,
                    min: 0,
                    max: 50,
                },
                {
                    name: 'brightness',
                    unit: '%',
                    default: 100,
                    min: 0,
                    max: 200,
                },
                {
                    name: 'contrast',
                    unit: '%',
                    default: 100,
                    min: 0,
                    max: 100,
                },
                {
                    name: 'grayscale',
                    unit: '%',
                    default: 0,
                    min: 0,
                    max: 100,
                },
                {
                    name: 'hue-rotate',
                    unit: 'deg',
                    default: 0,
                    min: 0,
                    max: 360,
                },
                {
                    name: 'opacity',
                    unit: '%',
                    default: 100,
                    min: 0,
                    max: 100,
                },
                {
                    name: 'saturate',
                    unit: '%',
                    default: 100,
                    min: 0,
                    max: 100,
                },
                {
                    name: 'sepia',
                    unit: '%',
                    default: 0,
                    min: 0,
                    max: 100,
                }
            ],

        }
    }
}