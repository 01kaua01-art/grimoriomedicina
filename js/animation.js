const CombatAnimator = {
    history: [], // Histórico anti-repetição das últimas 3 animações
    isAnimating: false,

    // Disparado a cada 10 minutos líquidos pelo timer.js
    triggerMilestoneEvent(milestoneMinutes, sessionMethod) {
        const state = Storage.get();
        const bossHpRatio = state.boss.currentHp / state.boss.maxHp;

        // 1. Calcula o resultado parcial deste bloco de 10 min
        const outcome = CombatEngine.calculatePartial(10, sessionMethod);

        // 2. Seleciona a animação adequada conforme o HP e crítico
        const anim = this.selectAnimation(bossHpRatio, outcome.isCrit);

        // 3. Executa a camada visual e sonora
        this.play(anim, outcome, state, milestoneMinutes);
    },

    selectAnimation(hpRatio, isCrit) {
        if (isCrit) return DATABASE.animationPool.critical[0];
        if (hpRatio <= 0.10 && Math.random() < 0.40) {
            return DATABASE.animationPool.rare.find(a => a.id === 'execution') || DATABASE.animationPool.special[0];
        }

        let availablePool = [...DATABASE.animationPool.common];

        if (hpRatio <= 0.75) {
            availablePool = availablePool.concat(DATABASE.animationPool.defense);
        }
        if (hpRatio <= 0.50) {
            availablePool = availablePool.concat(DATABASE.animationPool.heavy);
        }
        if (hpRatio <= 0.25) {
            availablePool = availablePool.concat(DATABASE.animationPool.special);
        }

        // Filtro anti-repetição (penaliza as últimas 3 animações)
        const filtered = availablePool.filter(a => !this.history.includes(a.id));
        const finalPool = filtered.length > 0 ? filtered : availablePool;

        // Sorteio Ponderado por peso (weight)
        const totalWeight = finalPool.reduce((acc, a) => acc + (a.weight || 10), 0);
        let randomWeight = Math.random() * totalWeight;

        let selected = finalPool[0];
        for (const anim of finalPool) {
            randomWeight -= (anim.weight || 10);
            if (randomWeight <= 0) {
                selected = anim;
                break;
            }
        }

        // Registra histórico
        this.history.push(selected.id);
        if (this.history.length > 3) this.history.shift();

        return selected;
    },

    play(anim, outcome, state, milestoneMinutes) {
        if (this.isAnimating) return;
        this.isAnimating = true;

        const charSprite = document.getElementById('arena-character-sprite');
        const bossSprite = document.getElementById('arena-boss-sprite');

        if (!charSprite || !bossSprite) return;

        // Atualiza classes de animação CSS
        charSprite.className = `combat-sprite ${anim.playerClass}`;
        bossSprite.className = `combat-sprite ${anim.bossClass}`;

        // Executa o som de combate correspondente
        if (AudioEngine && AudioEngine.playCombatSound) {
            AudioEngine.playCombatSound(anim.soundType);
        }

        // Exibe banner flutuante de combate
        this.showCombatFeedback(anim.label, outcome.damage, outcome.isCrit, milestoneMinutes);

        // Aplica o dano parcial diretamente no Boss durante a sessão
        CombatEngine.applyPartialDamage(outcome.damage);

        setTimeout(() => {
            charSprite.className = 'combat-sprite idle';
            bossSprite.className = 'combat-sprite idle';
            this.isAnimating = false;
        }, anim.durationMs || 1200);
    },

    showCombatFeedback(label, dmg, isCrit, milestoneMinutes) {
        const overlay = document.getElementById('combat-banner-anchor');
        if (!overlay) return;

        const banner = document.createElement('div');
        banner.className = `combat-feedback-banner ${isCrit ? 'crit' : ''}`;
        banner.innerHTML = `
            <div class="banner-milestone">✦ MARCO DE ${milestoneMinutes} MINUTOS ✦</div>
            <div class="banner-title">${label}</div>
            <div class="banner-damage">-${dmg} HP</div>
        `;
        overlay.appendChild(banner);

        setTimeout(() => {
            banner.classList.add('fade-out');
            setTimeout(() => banner.remove(), 400);
        }, 3200);
    }
};