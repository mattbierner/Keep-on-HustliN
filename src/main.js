// @ts-check
'use strict';

(function () {
    const latestDataUrl = 'https://keeponhustlin.blob.core.windows.net/data-v0/latest'
    const checkInterval = 15 * 1000;

    const latestTime = Date.now() - 5000 - 10000000;

    class HustleMonitor {
        /**
         * @param {AudioContext} audioCtx
         */
        constructor(audioCtx) {
            this.audioCtx = audioCtx;
            this.currentHustle = 0;

            this.buffer = this.loadSong();

            this.checkHustle();
            setInterval(() => this.checkHustle, checkInterval);
        }

        beginHustle() {
            ++this.currentHustle;

            document.body.classList.remove('on-hustle');
            document.body.classList.add('on-hustle');

            const speakers = /** @type {HTMLElement} */(document.querySelector('.speakers'))
            speakers.style.visibility = 'visible';

            this.playHustle();
        }

        playHustle() {
            const currentHustle = this.currentHustle;
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

                source.addEventListener('onended', () => {
                    if (this.currentHustle === currentHustle) {
                        document.body.classList.remove('on-hustle');
                    }
                });
                setTimeout(() => source.start(), 500);
            });
        }

        async checkHustle() {
            const response = await fetch(`${latestDataUrl}?time=${Date.now()}`);
            const data = await response.json();

            const element = document.getElementById('latest-hustle-time');
            element.textContent = new Date(data.time * 1000).toTimeString();
            element.setAttribute('href', `https://news.ycombinator.com/item?id=${data.id}`);

            if (data.time * 1000 > latestTime) {
                this.beginHustle();
            }
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
        document.querySelector('.activated-hustle-info').style.display = 'block';

        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        new HustleMonitor(audioCtx);
    });
}()); 