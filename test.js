(function(){

    var BUFFER_SIZE = 256,
        THRESHOLD   = 25,
        MAX_DIT_MILLIS = 100,
        MAX_DAH_MILLIS = 300,
        MAX_BLANK_MILLIS = 1000;

    var context = new AudioContext();

    var gainNode = null,
        micNode  = null,
        procNode = null;

    var buffer = new Float32Array(BUFFER_SIZE);

    var currentLetter = [],
        lastPulse     = 0,
        isPeak        = false;
    
    var processAudio = function (event) {
        requestAnimationFrame(processAudio);

        procNode.getFloatTimeDomainData(buffer);
        
        var sumAbs = 0;
        for (i = 0; i < buffer.length; i++) {
            sumAbs += Math.abs(buffer[i]);
        }

        if (sumAbs >= THRESHOLD && !isPeak) {
            /* rise */
            isPeak = true;
        } else if (sumAbs < THRESHOLD && isPeak) {
            /* fall */
            isPeak = false;

            var time = Date.now();
            var delta = time - lastPulse;

            if (delta <= MAX_DIT_MILLIS) {
                /* no-op */
            } else if (delta <= MAX_DAH_MILLIS) {
                currentLetter[currentLetter.length - 1] = 'dah';
            } else if (delta <= MAX_BLANK_MILLIS) {
                currentLetter.push('dit')
            } else {
                currentLetter = ['dit'];
            }

            lastPulse = time;

            console.log(currentLetter);
        }
    };

    var startMic = function (stream) {
        //gainNode = context.createGain();
        micNode  = context.createMediaStreamSource(stream);
        procNode = context.createAnalyser();

        micNode.connect(procNode);
        //micNode.connect(gainNode);
        //gainNode.connect(context.destination);

        requestAnimationFrame(processAudio);
    };

    navigator.getUserMedia(
        { audio: true },
        startMic,
        console.log
    );

})()
