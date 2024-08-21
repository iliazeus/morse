(function(){document.body.onclick = function() {

    var BUFFER_SIZE = 256,
        THRESHOLD   = null,
        RELATIVE_THRESHOLD = 12.0,
        MAX_DIT_MILLIS = 100,
        MAX_DAH_MILLIS = 300,
        MAX_BLANK_MILLIS = 1000,
        MAX_WORD_BLANK_MILLIS = 3000;

    var context = new AudioContext();

    var gainNode = null,
        micNode  = null,
        procNode = null;

    var buffer = new Float32Array(BUFFER_SIZE).fill(0);

    var currentLetter = [],
        lastPulse     = 0,
        isPeak        = false,
        isLetter      = false,
        isWord        = false;

    var morseTable = {
        '.-':   'A',
        '-...': 'B',
        '-.-.': 'C',
        '-..':  'D',
        '.':    'E',
        '..-.': 'F',
        '--.':  'G',
        '....': 'H',
        '..':   'I',
        '.---': 'J',
        '-.-':  'K',
        '.-..': 'L',
        '--':   'M',
        '-.':   'N',
        '---':  'O',
        '.--.': 'P',
        '--.-': 'Q',
        '.-.':  'R',
        '...':  'S',
        '-':    'T',
        '..-':  'U',
        '...-': 'V',
        '.--':  'W',
        '-..-': 'X',
        '-.--': 'Y',
        '--..': 'Z',

        '.----': '1',
        '..---': '2',
        '...--': '3',
        '....-': '4',
        '.....': '5',
        '-....': '6',
        '--...': '7',
        '---..': '8',
        '----.': '9',
        '-----': '0',

        '': ' '
    };

    var currentLetterDiv = document.getElementById('current-letter');
    var wholeTextDiv = document.getElementById('whole-text');

    var displayCurrentLetter = function (currentLetter) {
        currentLetterDiv.innerText = currentLetter.join('') || ' ';
    };

    var showedWord = false;

    var showLetter = function (currentLetter) {
        if (!currentLetter) showedWord = true;
        else {
            var letter = morseTable[currentLetter.join('')] || '?';
            wholeTextDiv.innerText += (showedWord ? ' ' : '') + letter;
            showedWord = false;
        }
    };

    var processAudio = function (event) {
        requestAnimationFrame(processAudio);

        procNode.getFloatTimeDomainData(buffer);
        
        var sumAbs = 0;
        for (i = 0; i < buffer.length; i++) {
            sumAbs += Math.abs(buffer[i]);
        }

        if (! THRESHOLD) THRESHOLD = sumAbs * RELATIVE_THRESHOLD;

        if (sumAbs >= THRESHOLD && !isPeak) {
            /* rise */
            isPeak = true;
            isLetter = true;
            isWord = true;
        } else if (sumAbs < THRESHOLD && isPeak) {
            /* fall */
            isPeak = false;

            var time = Date.now();
            var delta = time - lastPulse;

            if (delta <= MAX_DIT_MILLIS) {
                /* no-op */
            } else if (delta <= MAX_DAH_MILLIS) {
                currentLetter[currentLetter.length - 1] = '-';
                displayCurrentLetter(currentLetter);
            } else if (delta <= MAX_BLANK_MILLIS) {
                currentLetter.push('.');
                displayCurrentLetter(currentLetter);
            } else {
                currentLetter = ['.'];
                displayCurrentLetter(currentLetter);
            }

            lastPulse = time;

        } else if (!isPeak && isLetter) {
            /* letter break */
            var time = Date.now();
            var delta = time - lastPulse;

            if (delta > MAX_BLANK_MILLIS) {
                showLetter(currentLetter);
                isLetter = false;
                currentLetter = [];
                displayCurrentLetter(currentLetter);
            }
            
        } else if (!isPeak && isWord) {
            /* word break */
            var time = Date.now();
            var delta = time - lastPulse;

            if (delta > MAX_WORD_BLANK_MILLIS) {
                isWord = false;
                showLetter(false);
                console.log("word");
            }
        }
    };

    var startMic = function (stream) {
        micNode  = context.createMediaStreamSource(stream);
        procNode = context.createAnalyser();

        micNode.connect(procNode);

        requestAnimationFrame(processAudio);
    };

    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(startMic)
        .catch(console.log);

}})()
