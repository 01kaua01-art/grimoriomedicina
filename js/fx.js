const CanvasFX = {
    canvas: null,
    ctx: null,
    ambientParticles: [],
    burstParticles: [],
    animationId: null,

    init() {
        this.canvas = document.getElementById('fx-canvas');
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.initAmbient();
        this.loop();

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                if (this.animationId) cancelAnimationFrame(this.animationId);
            } else {
                this.loop();
            }
        });
    },

    resize() {
        if (!this.canvas) return;
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    },

    initAmbient(count = 40) {
        this.ambientParticles = [];
        for (let i = 0; i < count; i++) {
            this.ambientParticles.push({
                x: Math.random() * (this.canvas ? this.canvas.width : window.innerWidth),
                y: Math.random() * (this.canvas ? this.canvas.height : window.innerHeight),
                size: Math.random() * 2 + 1,
                speedY: Math.random() * 0.4 + 0.1,
                opacity: Math.random() * 0.4 + 0.1
            });
        }
    },

    explode(x, y, color = '#d4af37', count = 25) {
        for (let i = 0; i < count; i++) {
            this.burstParticles.push({
                x: x || window.innerWidth / 2,
                y: y || window.innerHeight / 2,
                vx: (Math.random() - 0.5) * 14,
                vy: (Math.random() - 0.5) * 14,
                radius: Math.random() * 4 + 1.5,
                color: color,
                alpha: 1,
                decay: Math.random() * 0.03 + 0.015
            });
        }
    },

    loop() {
        if (!this.ctx || !this.canvas) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 1. Renderiza Poeira Ambiente
        this.ambientParticles.forEach(p => {
            this.ctx.fillStyle = `rgba(212, 175, 55, ${p.opacity})`;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();

            p.y -= p.speedY;
            if (p.y < 0) {
                p.y = this.canvas.height;
                p.x = Math.random() * this.canvas.width;
            }
        });

        // 2. Renderiza Efeitos de Explosão
        for (let i = this.burstParticles.length - 1; i >= 0; i--) {
            const p = this.burstParticles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.alpha -= p.decay;

            if (p.alpha <= 0) {
                this.burstParticles.splice(i, 1);
                continue;
            }

            this.ctx.save();
            this.ctx.globalAlpha = Math.max(0, p.alpha);
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        }

        this.animationId = requestAnimationFrame(() => this.loop());
    }
};

window.addEventListener('DOMContentLoaded', () => CanvasFX.init());