const StudyTimer = {
    mode: 'countdown',
    durationMinutes: 50,
    startTimestamp: null,
    targetTimestamp: null,
    interval: null,
    isRunning: false,
    activeSubject: '',
    activeMethod: 'questions',
    lastMilestoneBlocks: 0,
    pendingDamage: 0,

    setMode(newMode, btn) {
        if (this.isRunning) return;
        this.mode = newMode;
        document.querySelectorAll('.mode-toggle-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const presetGroup = document.getElementById('preset-duration-group');
        if (newMode === 'stopwatch') {
            presetGroup.style.opacity = '0.35';
            presetGroup.style.pointerEvents = 'none';
        } else {
            presetGroup.style.opacity = '1';
            presetGroup.style.pointerEvents = 'auto';
        }
    },

    setPreset(min, btn) {
        if (this.isRunning || this.mode !== 'countdown') return;
        this.durationMinutes = min;
        document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    },

    start() {
        this.activeSubject = document.getElementById('input-subject').value;
        this.activeMethod = document.getElementById('select-method').value;
        const state = Storage.get();

        let rank = DATABASE.ranks[0];
        DATABASE.ranks.forEach(r => {
            if (state.player.level >= r.level) rank = r;
        });

        const charSprite = document.getElementById('arena-character-sprite');
        const bossSprite = document.getElementById('arena-boss-sprite');
        const bossTag = document.getElementById('arena-boss-tag');

        if (charSprite) charSprite.src = rank.icon;
        if (bossSprite) bossSprite.src = state.boss.icon;
        if (bossTag) bossTag.innerText = state.boss.name.toUpperCase();

        document.getElementById('focus-boss-name').innerText = state.boss.name.toUpperCase();
        document.getElementById('focus-subject-display').innerText = this.activeSubject.trim() || 'Estudo Livre Sem Restrições';
        document.getElementById('focus-boss-tier').innerText = `${state.boss.rarity.toUpperCase()} • LV. ${state.boss.level} • ${this.mode === 'stopwatch' ? 'MODO LIVRE' : 'TEMPORIZADOR'}`;
        document.getElementById('focus-hp-cur').innerText = Math.round(state.boss.currentHp);
        document.getElementById('focus-hp-max').innerText = state.boss.maxHp;
        document.getElementById('focus-hp-fill').style.width = `${(state.boss.currentHp / state.boss.maxHp) * 100}%`;

        const focusTraits = document.getElementById('focus-traits-display');
        if (focusTraits) {
            focusTraits.innerHTML = '';
            state.boss.traits.forEach(tKey => {
                const trait = DATABASE.traits[tKey];
                if (trait) {
                    focusTraits.innerHTML += `<span class="trait-pill"><i class="fa-solid ${trait.icon}"></i> ${trait.name}</span>`;
                }
            });
        }

        this.isRunning = true;
        this.startTimestamp = Date.now();
        this.lastMilestoneBlocks = 0;
        this.pendingDamage = 0;

        if (this.mode === 'countdown') {
            this.targetTimestamp = Date.now() + (this.durationMinutes * 60 * 1000);
        }

        document.getElementById('battle-overlay').classList.add('active');

        this.interval = setInterval(() => {
            const elapsedLiquidSec = Math.floor((Date.now() - this.startTimestamp) / 1000);
            const elapsedLiquidMin = Math.floor(elapsedLiquidSec / 60);
            const currentBlocks = Math.floor(elapsedLiquidMin / 10);

            if (currentBlocks > this.lastMilestoneBlocks) {
                const missedBlocks = currentBlocks - this.lastMilestoneBlocks;
                for (let i = 0; i < missedBlocks; i++) {
                    const blockNumber = (this.lastMilestoneBlocks + 1 + i) * 10;
                    this.triggerMilestoneVisual(blockNumber);
                }
                this.lastMilestoneBlocks = currentBlocks;
            }

            if (this.mode === 'countdown') {
                const remaining = Math.max(0, Math.ceil((this.targetTimestamp - Date.now()) / 1000));
                const m = Math.floor(remaining / 60).toString().padStart(2, '0');
                const s = (remaining % 60).toString().padStart(2, '0');
                document.getElementById('focus-clock').innerText = `${m}:${s}`;

                if (remaining <= 0) {
                    this.complete();
                }
            } else {
                const m = Math.floor(elapsedLiquidSec / 60).toString().padStart(2, '0');
                const s = (elapsedLiquidSec % 60).toString().padStart(2, '0');
                document.getElementById('focus-clock').innerText = `${m}:${s}`;
            }
        }, 500);
    },

    triggerMilestoneVisual(minutes) {
        const totalPlanned = this.mode === 'countdown' ? this.durationMinutes : minutes;
        const outcome = CombatEngine.calculate(10, this.activeMethod, true, totalPlanned);
        this.pendingDamage += outcome.damage;

        const state = Storage.get();
        const projectedHp = Math.max(0, state.boss.currentHp - this.pendingDamage);
        
        const fillBar = document.getElementById('focus-hp-fill');
        const curText = document.getElementById('focus-hp-cur');
        if (fillBar) fillBar.style.width = `${(projectedHp / state.boss.maxHp) * 100}%`;
        if (curText) curText.innerText = Math.round(projectedHp);

        if (typeof CombatAnimator !== 'undefined') {
            CombatAnimator.triggerMilestoneEvent(minutes, this.activeMethod, outcome);
        }
    },

    abort() {
        if (confirm('Deseja abortar a batalha? O tempo desta sessão não será computado.')) {
            clearInterval(this.interval);
            this.isRunning = false;
            this.pendingDamage = 0;
            document.getElementById('battle-overlay').classList.remove('active');
            UI.render(); // Restaura a vida real do Boss intacta
        }
    },

    complete() {
        clearInterval(this.interval);
        this.isRunning = false;
        document.getElementById('battle-overlay').classList.remove('active');

        const elapsedMs = Date.now() - this.startTimestamp;
        let actualMinutes = Math.floor(elapsedMs / 60000);

        if (this.mode === 'countdown') {
            const remaining = Math.max(0, Math.ceil((this.targetTimestamp - Date.now()) / 1000));
            if (remaining <= 0) {
                actualMinutes = this.durationMinutes;
            }
        }

        if (actualMinutes < 1) {
            alert('A sessão precisa ter pelo menos 1 minuto líquido concluído para computar dano e recompensas.');
            this.pendingDamage = 0;
            UI.render();
            return;
        }

        const session = CombatEngine.applySession(this.activeSubject, this.activeMethod, actualMinutes);
        this.pendingDamage = 0;
        UI.render();
        UI.triggerFloatingDamage(session.damage, session.isCrit);
    }
};