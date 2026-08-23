const DevTools = {
    init() {
        // Cria a barra flutuante de debug na tela
        const bar = document.createElement('div');
        bar.id = 'dev-debug-panel';
        bar.style.cssText = `
            position: fixed; bottom: 10px; right: 10px; z-index: 99999;
            background: rgba(10, 10, 15, 0.95); border: 2px solid #e74c3c;
            padding: 10px; border-radius: 8px; display: none; gap: 6px;
            flex-wrap: wrap; max-width: 320px; box-shadow: 0 0 15px rgba(0,0,0,0.8);
        `;
        bar.innerHTML = `
            <strong style="color:#e74c3c; width:100%; font-size:12px;">🛠️ PAINEL DEV (F2 para fechar)</strong>
            <button onclick="DevTools.fastForward(10)" style="padding:4px 8px; font-size:11px; cursor:pointer;">+10 min Líquidos</button>
            <button onclick="DevTools.killBoss()" style="padding:4px 8px; font-size:11px; cursor:pointer;">Matar Boss</button>
            <button onclick="DevTools.giveAllLoot()" style="padding:4px 8px; font-size:11px; cursor:pointer;">Dropar Todos Itens</button>
            <button onclick="DevTools.levelUp(5)" style="padding:4px 8px; font-size:11px; cursor:pointer;">+5 Níveis</button>
            <button onclick="DevTools.runAutoStressTest(50)" style="padding:4px 8px; font-size:11px; background:#e74c3c; color:#fff; cursor:pointer;">Rodar Teste de Estresse (50x)</button>
        `;
        document.body.appendChild(bar);

        // Tecla de atalho F2 para abrir/fechar o menu
        window.addEventListener('keydown', (e) => {
            if (e.key === 'F2') {
                bar.style.display = bar.style.display === 'none' ? 'flex' : 'none';
            }
        });
    },

    fastForward(minutes) {
        if (typeof CombatAnimator !== 'undefined') {
            CombatAnimator.triggerMilestoneEvent(minutes, 'questions');
        }
    },

    killBoss() {
        const state = Storage.get();
        state.boss.currentHp = 1;
        Storage.save(state);
        CombatEngine.applySession('Golpe Fatal Dev', 'questions', 10);
        UI.render();
    },

    levelUp(levels = 1) {
        const state = Storage.get();
        for (let i = 0; i < levels; i++) {
            state.player.level++;
            const attrKeys = Object.keys(state.player.baseAttributes);
            const randomAttr = attrKeys[Math.floor(Math.random() * attrKeys.length)];
            state.player.baseAttributes[randomAttr] += 1;
        }
        Storage.save(state);
        UI.render();
    },

    giveAllLoot() {
        const state = Storage.get();
        state.inventory = Object.keys(DATABASE.items);
        Storage.save(state);
        UI.render();
    },

    // 2. TESTE DE ESTRESSE AUTOMÁTICO: Roda dezenas de batalhas em 1 segundo
    runAutoStressTest(iterations = 50) {
        console.group(`Iniciando Teste Automatizado (${iterations} ciclos)...`);
        let errors = 0;

        for (let i = 1; i <= iterations; i++) {
            try {
                // Simula sessões variadas e equipa loots aleatórios
                const session = CombatEngine.applySession(`Teste Estresse #${i}`, 'questions', 50);
                const state = Storage.get();
                
                // Validações de sanidade matemática
                if (isNaN(state.player.level) || isNaN(state.boss.currentHp)) {
                    throw new Error(`NaN detectado no ciclo ${i}`);
                }
                if (state.inventory.length > 0) {
                    const randomItem = state.inventory[Math.floor(Math.random() * state.inventory.length)];
                    Storage.equipItem(randomItem);
                }
            } catch (err) {
                console.error(`❌ Falha no ciclo ${i}:`, err);
                errors++;
            }
        }

        UI.render();
        console.log(`✅ Teste concluído com ${errors} erros.`);
        console.groupEnd();
        alert(`Teste de estresse finalizado com ${errors} erros! Verifique o console (F12).`);
    }
};

window.addEventListener('DOMContentLoaded', () => DevTools.init());