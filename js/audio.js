const AudioEngine = {
    playCombatSound(type) {
        this.init();
        const now = this.ctx.currentTime;

        if (type === 'slash') {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(380, now);
            osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);
            gain.gain.setValueAtTime(0.25, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.15);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.15);
        } else if (type === 'heavy') {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(140, now);
            osc.frequency.exponentialRampToValueAtTime(25, now + 0.35);
            gain.gain.setValueAtTime(0.35, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.35);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.35);
        } else if (type === 'magic') {
            [440, 554.37, 659.25].forEach((freq, i) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now + (i * 0.06));
                gain.gain.setValueAtTime(0.18, now + (i * 0.06));
                gain.gain.linearRampToValueAtTime(0.01, now + (i * 0.06) + 0.25);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now + (i * 0.06));
                osc.stop(now + (i * 0.06) + 0.25);
            });
        } else if (type === 'block') {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(400, now);
            osc.frequency.exponentialRampToValueAtTime(120, now + 0.12);
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.12);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.12);
        } else if (type === 'crit' || type === 'execute') {
            [150, 300, 600].forEach((freq, idx) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(freq, now + (idx * 0.08));
                osc.frequency.exponentialRampToValueAtTime(40, now + (idx * 0.08) + 0.3);
                gain.gain.setValueAtTime(0.3, now + (idx * 0.08));
                gain.gain.linearRampToValueAtTime(0.01, now + (idx * 0.08) + 0.3);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now + (idx * 0.08));
                osc.stop(now + (idx * 0.08) + 0.3);
            });
        }
    },
    ctx: null,
    isBgmPlaying: false,
    bgmGain: null,
    bgmInterval: null,
    bgmOscillators: [],

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    },

    // --- EFEITOS SONOROS (SFX) ---
    playHit(isCrit = false) {
        this.init();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = isCrit ? 'sawtooth' : 'triangle';
        osc.frequency.setValueAtTime(isCrit ? 220 : 130, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.18);
        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.18);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.18);
    },

    playLoot(rarity = 'common') {
        this.init();
        const frequencies = {
            common: [261.63, 329.63],
            uncommon: [261.63, 329.63, 392.00],
            rare: [329.63, 392.00, 523.25],
            epic: [392.00, 523.25, 659.25, 783.99],
            legendary: [523.25, 659.25, 783.99, 1046.50, 1318.51]
        }[rarity] || [261.63, 329.63];

        frequencies.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = rarity === 'legendary' ? 'sawtooth' : 'sine';
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime + (idx * 0.09));
            gain.gain.setValueAtTime(0.2, this.ctx.currentTime + (idx * 0.09));
            gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + (idx * 0.09) + 0.25);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(this.ctx.currentTime + (idx * 0.09));
            osc.stop(this.ctx.currentTime + (idx * 0.09) + 0.25);
        });
    },

    playLevelUp() {
        this.init();
        [261.63, 329.63, 392.00, 523.25].forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime + (i * 0.08));
            gain.gain.setValueAtTime(0.2, this.ctx.currentTime + (i * 0.08));
            gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + (i * 0.08) + 0.2);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(this.ctx.currentTime + (i * 0.08));
            osc.stop(this.ctx.currentTime + (i * 0.08) + 0.2);
        });
    },

    // --- MÚSICA DE AMBIENTE PROCEDURAL (DARK FANTASY LO-FI PAD) ---
    toggleBGM() {
        this.init();
        const btn = document.getElementById('btn-bgm-toggle');

        if (this.isBgmPlaying) {
            this.stopBGM();
            if (btn) {
                btn.innerHTML = '<i class="fa-solid fa-volume-xmark"></i> BGM: OFF';
                btn.classList.remove('playing');
            }
        } else {
            this.startBGM();
            if (btn) {
                btn.innerHTML = '<i class="fa-solid fa-music"></i> BGM: ON';
                btn.classList.add('playing');
            }
        }
    },

    startBGM() {
        this.isBgmPlaying = true;
        this.bgmGain = this.ctx.createGain();
        this.bgmGain.gain.setValueAtTime(0.06, this.ctx.currentTime); // Volume ambiente suave
        this.bgmGain.connect(this.ctx.destination);

        // Progressão harmônica em Dó menor / Ré menor (Atmosfera Grimório)
        const chords = [
            [146.83, 220.00, 261.63, 349.23], // Dm7
            [130.81, 196.00, 246.94, 329.63], // Cmaj7
            [116.54, 174.61, 220.00, 293.66], // Bbmaj7
            [110.00, 164.81, 220.00, 261.63]  // Am7
        ];

        let chordIdx = 0;

        const playPad = () => {
            if (!this.isBgmPlaying) return;

            const now = this.ctx.currentTime;
            const currentChord = chords[chordIdx];
            chordIdx = (chordIdx + 1) % chords.length;

            currentChord.forEach(freq => {
                const osc = this.ctx.createOscillator();
                const noteGain = this.ctx.createGain();

                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now);

                // Envelope suave de transição (Pad aveludado)
                noteGain.gain.setValueAtTime(0, now);
                noteGain.gain.linearRampToValueAtTime(0.025, now + 1.5);
                noteGain.gain.linearRampToValueAtTime(0, now + 4.8);

                osc.connect(noteGain);
                noteGain.connect(this.bgmGain);

                osc.start(now);
                osc.stop(now + 5.0);
            });
        };

        playPad();
        this.bgmInterval = setInterval(playPad, 4500);
    },

    stopBGM() {
        this.isBgmPlaying = false;
        if (this.bgmInterval) {
            clearInterval(this.bgmInterval);
            this.bgmInterval = null;
        }
        if (this.bgmGain) {
            this.bgmGain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);
            setTimeout(() => {
                if (this.bgmGain) this.bgmGain.disconnect();
            }, 600);
        }
    }
};