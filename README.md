# Take Me Photo

This is a small library, easy to integrate with any application in order to take a user's picture using the webcam.

## 1. How to use

First of all you should download or clone this repo. the main script exist in index.js.

```html
<script>
    const takemephoto = new TakeMePhoto({
        containerId: 'the container element id',
        width?: 400,
        height?: 400,
        defaultVideoPath?: 'path to the default video in case your browser doesn\' support getUserMedia',
        captureMsg?: 'capture button text content',
    });

    // Then you can invoke the start method let the library start its work 😊.
    takemephoto.start();
</script>
```

`Notice:` the container element is required in order to run the script.

## 2. Demo

Check [example](./example/index.html) to see a demo of working application.