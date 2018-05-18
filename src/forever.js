// @ts-check
'use strict';

(function () {
    class HustleMonitor {
        /**
         * @param {AudioContext} audioCtx
         */
        constructor(audioCtx) {
            this.audioCtx = audioCtx;
            this.inited = false;

            this.buffer = this.loadSong();

            this.beginHustle();
            setInterval(() => this.beginHustle(), 10 * 1000)
        }

        beginHustle() {
            this.playHustle();
        }

        playHustle() {
            this.buffer.then(buffer => {
                const gainNode = this.audioCtx.createGain();
                gainNode.gain.setValueAtTime(0.7, this.audioCtx.currentTime);
                gainNode.connect(this.audioCtx.destination);
                gainNode.gain.setValueAtTime(0.7, this.audioCtx.currentTime + 1);
                gainNode.gain.exponentialRampToValueAtTime(0.5, this.audioCtx.currentTime + 1.2);
                gainNode.gain.exponentialRampToValueAtTime(1.0, this.audioCtx.currentTime + 6);
                const source = this.audioCtx.createBufferSource();
                source.buffer = buffer;
                source.connect(gainNode);
                source.start();

                if (!this.inited) {
                    this.inited = true;
                    document.body.classList.add('on-hustle');

                    const speakers = /** @type {HTMLElement} */(document.querySelector('.speakers'))
                    speakers.style.visibility = 'visible';
                }
            });
        }

        /**
         * @return {Promise<AudioBuffer>}
         */
        async loadSong() {
            const request = await fetch('./keep-on-hustlin.mp3');
            const data = await request.arrayBuffer();

            return new Promise((resolve, reject) =>
                this.audioCtx.decodeAudioData(data, buffer => {
                    resolve(buffer);
                }, () => {
                    reject("Error with decoding audio data");
                }));
        }
    }


    const button = /** @type {HTMLButtonElement} */(document.querySelector('.activate-hustle-button'));
    button.addEventListener('click', () => {
        button.style.display = 'none';
        
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        // Play nothing to init on iOS
        const buffer = audioCtx.createBuffer(1, 1, 22050);
        const source = audioCtx.createBufferSource();
        source.buffer = buffer;
        source.connect(audioCtx.destination);
        source.start(0);

        new HustleMonitor(audioCtx);
    });
}()); 