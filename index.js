
class TakeMePhoto {

    constructor({
        containerId,
        width=400,
        height=400,
        defaultVideoPath,
        captureMsg='Capturer'
    }) {

        this.container = document.querySelector(`#${containerId}`);
        if(!this.container) {
            throw new Error('container must be a valid Html element');
        }

        const video = document.createElement('video');
        video.width = width;
        video.height = height;
        video.autoplay = true;
        video.loop = true;
        this.video = video;

        const timerSpan = document.createElement('span');
        timerSpan.textContent = '';
        timerSpan.style.fontSize = '50px';
        timerSpan.style.fontWeight = 'bold';
        timerSpan.style.color = 'red';
        timerSpan.style.display = 'block';
        this.timerSpan = timerSpan;

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        this.canvas = canvas;

        const captureButton = document.createElement('button');
        captureButton.textContent = captureMsg;
        this.captureButton = captureButton;

        this.constraints = {
            audio: false,
            video: { width, height }
        }

        this.stream = null;

        this.defaultVideoPath = defaultVideoPath;
    }

    start() {
        this.container.appendChild(this.video);
        this.container.appendChild(this.captureButton);
        this.container.appendChild(this.timerSpan);
        this.container.appendChild(this.canvas);

        this.initStream();
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
        const context = this.canvas.getContext('2d');
        context.drawImage(this.video, 0, 0);
    }

    captureListener() {
        this.captureButton.addEventListener("click", () => {
            const timer = (i, callback) => {
                if( i>0 ){
                    this.timerSpan.innerHTML = `Be Ready! ${i}`;
                    setTimeout(timer, 1000, --i, callback.bind(this));
                    return;
                }
                this.timerSpan.textContent = 'done';
                callback();
            }
            timer(3, this.takePicture);
        });
    }
}