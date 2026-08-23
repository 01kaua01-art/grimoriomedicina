const CombatEngine = {
    calculatePartial(minutes, methodKey) {
        return this.calculate(minutes, methodKey, true);
    },

    applyPartialDamage(damage) {
        const state = Storage.get();
        state.boss.currentHp = Math.max(0, state.boss.currentHp - damage);
        Storage.save(state);

        const fillBar = document.getElementById('focus-hp-fill');
        const curText = document.getElementById('focus-hp-cur');
        if (fillBar) fillBar.style.width = `${(state.boss.currentHp / state.boss.maxHp) * 100}%`;
        if (curText) curText.innerText = Math.round(state.boss.currentHp);
    },
    getTotalAttributes() {
        const state = Storage.get();
        const total = { ...state.player.baseAttributes };

        Object.values(state.equipment).forEach(itemId => {
            if (itemId && DATABASE.items[itemId]) {
                const item = DATABASE.items[itemId];
                Object.entries(item.stats).forEach(([stat, val]) => {
                    total[stat] = (total[stat] || 0) + val;
                });
            }
        });

        return total;
    },

    getXpRequiredForLevel(level) {
        return level * 50 + 50;
    },

    generateProceduralBoss(defeatedCount = 0, basePresetHp = 12000) {
        const roll = Math.random() * 100;
        let rarity = 'common';
        if (roll < 5) rarity = 'legendary';
        else if (roll < 20) rarity = 'epic';
        else if (roll < 50) rarity = 'rare';

        const namePool = DATABASE.bossPool[rarity];
        const bossName = namePool[Math.floor(Math.random() * namePool.length)];
        const bossId = bossName.toLowerCase().replace(/[^a-z0-9]/g, '_');

        const traitKeys = Object.keys(DATABASE.traits);
        const shuffled = traitKeys.sort(() => 0.5 - Math.random());
        const traitCount = (rarity === 'legendary' || rarity === 'epic') ? 2 : 1;
        const selectedTraits = shuffled.slice(0, traitCount);

        const bossLevel = Math.max(1, Math.floor(defeatedCount * 1.5) + Math.floor(Math.random() * 3));
        
        let hpMultiplier = DATABASE.rarities[rarity].hpMult;
        selectedTraits.forEach(tKey => {
            if (DATABASE.traits[tKey].hpBonus) hpMultiplier *= DATABASE.traits[tKey].hpBonus;
        });

        const maxHp = Math.round(basePresetHp * hpMultiplier * (1 + (bossLevel * 0.05)));
        const icon = DATABASE.bossIcons[Math.floor(Math.random() * DATABASE.bossIcons.length)];

        return {
            id: bossId,
            name: bossName,
            rarity: rarity,
            level: bossLevel,
            maxHp: maxHp,
            currentHp: maxHp,
            traits: selectedTraits,
            icon: icon,
            spawnDate: new Date().toISOString()
        };
    },

    // MOTOR COMPORTAMENTAL: Aplica bônus estritamente baseados em postura, duração e atributos
    calculate(minutes, methodKey) {
        const method = DATABASE.methods[methodKey] || DATABASE.methods.questions;
        const attrs = this.getTotalAttributes();
        const state = Storage.get();
        const equippedIds = Object.values(state.equipment).filter(Boolean);

        // 1. Dano Base por Poder
        let baseDamage = (minutes / 60) * method.damage_per_hour;
        baseDamage *= (1 + (attrs.poder / 100));

        // 2. Modificadores por Método de Estudo
        if (methodKey === 'questions' || methodKey === 'mock_exam') {
            baseDamage *= (1 + (attrs.precisao / 100));
            if (equippedIds.includes('estetoscopio_clinico')) baseDamage *= 1.12;
            if (equippedIds.includes('master_scalpel')) baseDamage *= 1.15;
        }

        if (methodKey === 'flashcards' || methodKey === 'active_combo') {
            baseDamage *= (1 + (attrs.retencao / 100));
            if (equippedIds.includes('recall_tome')) baseDamage *= 1.15;
            if (equippedIds.includes('atlas_netter')) baseDamage *= 1.15;
        }

        // 3. Modificadores por Duração & Foco Contínuo
        if (minutes >= 50) {
            baseDamage *= (1 + (attrs.foco / 100));
            if (equippedIds.includes('bisturi_anatomista')) baseDamage *= 1.10;
            if (equippedIds.includes('ampulheta_foco')) baseDamage *= 1.15;
            if (equippedIds.includes('tesoura_mayo')) baseDamage *= 1.12;
        }

        // 4. Modificador de Execução (Boss < 20% HP)
        const bossHpPct = state.boss.currentHp / state.boss.maxHp;
        if (bossHpPct < 0.20 && equippedIds.includes('lamina_ultimo_corte')) {
            baseDamage *= 1.50; // +50% de dano de execução
        }

        // 5. Primeiro Estudo do Dia (Bisturi de Cooper)
        const todayStr = new Date().toISOString().split('T')[0];
        const sessionsToday = state.sessions.filter(s => s.date === todayStr);
        if (sessionsToday.length === 0 && equippedIds.includes('bisturi_cooper')) {
            baseDamage *= 1.20;
        }

        // 6. Penalidades de Trait do Boss
        if (state.boss.traits && state.boss.traits.includes('relentless')) {
            baseDamage *= 0.85;
        }

        // 7. Multiplicador de Combo e Crítico
        let streakBonus = 1.0 + ((state.player.consecutiveDays || 1) * 0.05);
        if (equippedIds.includes('marcapasso_ancestral')) streakBonus += 0.05;
        const combo = Math.min(1.35, streakBonus);

        let isCrit = minutes >= 50;
        if (equippedIds.includes('olho_hipocrates') && (methodKey === 'questions' || methodKey === 'mock_exam')) {
            isCrit = true; // Crítico garantido pelo Olho de Hipócrates
        }

        let critMultiplier = 1.5 + (attrs.foco / 100);
        let totalDamage = baseDamage * combo;
        if (isCrit) totalDamage *= critMultiplier;

        // 8. Cálculo de XP Permanente
        let totalXp = (minutes / 60) * method.xp_per_hour;
        totalXp *= (1 + (attrs.intelecto / 100));

        if (equippedIds.includes('scholars_grimoire')) totalXp *= 1.10;
        if (equippedIds.includes('anel_sinapse')) totalXp *= 1.08;
        if (equippedIds.includes('caduceus_staff')) totalXp *= 1.15;
        if (equippedIds.includes('codex_katzung') && methodKey === 'questions') totalXp *= 1.15;
        if (equippedIds.includes('estetoscopio_laennec') && minutes >= 60) totalXp *= 1.25;
        if (isCrit) totalXp *= 1.20;

        return {
            damage: Math.round(totalDamage),
            xp: Math.round(totalXp),
            isCrit: isCrit
        };
    },

    rollLoot(bossRarity) {
        const attrs = this.getTotalAttributes();
        const fortuna = attrs.fortuna || 5;

        const roll = Math.random() * 100;
        let rarity = 'common';
        const baseBonus = bossRarity === 'legendary' ? 20 : bossRarity === 'epic' ? 10 : bossRarity === 'rare' ? 5 : 0;

        if (roll < (1 + (fortuna * 0.3) + baseBonus)) rarity = 'legendary';
        else if (roll < (6 + (fortuna * 0.5) + baseBonus)) rarity = 'epic';
        else if (roll < (20 + (fortuna * 0.8) + baseBonus)) rarity = 'rare';
        else if (roll < 55) rarity = 'uncommon';

        const matchingItems = Object.values(DATABASE.items).filter(i => i.rarity === rarity);
        const selected = matchingItems[Math.floor(Math.random() * matchingItems.length)] || DATABASE.items.alianca_academico;

        return selected;
    },

    checkTrophies(state) {
        let anyUnlocked = false;
        DATABASE.trophies.forEach(t => {
            if (!state.unlockedTrophies.includes(t.id)) {
                if (t.check(state)) {
                    state.unlockedTrophies.push(t.id);
                    anyUnlocked = true;
                }
            }
        });
        return anyUnlocked;
    },

    applySession(subject, methodKey, minutes) {
        const state = Storage.get();
        const outcome = this.calculate(minutes, methodKey);
        const currentBossCopy = { ...state.boss };

        state.boss.currentHp = Math.max(0, state.boss.currentHp - outcome.damage);
        state.stats.totalDamage = (state.stats.totalDamage || 0) + outcome.damage;
        state.stats.maxSessionDamage = Math.max(state.stats.maxSessionDamage || 0, outcome.damage);

        let bossDefeated = false;
        let droppedItem = null;

        if (state.boss.currentHp <= 0) {
            bossDefeated = true;
            state.boss.bossesDefeated = (state.boss.bossesDefeated || 0) + 1;

            droppedItem = this.rollLoot(state.boss.rarity);
            state.inventory.push(droppedItem.id);

            state.bestiary[state.boss.id] = state.bestiary[state.boss.id] || {
                name: state.boss.name,
                rarity: state.boss.rarity,
                defeatedCount: 0,
                firstEncounter: state.boss.spawnDate,
                firstDefeatDate: new Date().toISOString(),
                traits: state.boss.traits,
                icon: state.boss.icon
            };
            state.bestiary[state.boss.id].defeatedCount++;
            state.bestiary[state.boss.id].firstDefeatDate = state.bestiary[state.boss.id].firstDefeatDate || new Date().toISOString();

            const nextBoss = this.generateProceduralBoss(state.boss.bossesDefeated, state.boss.preset || 12000);
            state.boss = { ...nextBoss, bossesDefeated: state.boss.bossesDefeated, preset: state.boss.preset };
        }

        let xpGained = outcome.xp;
        if (bossDefeated && currentBossCopy.traits.includes('colossal')) {
            xpGained = Math.round(xpGained * 1.4);
        }

        state.player.currentXp = (state.player.currentXp || 0) + xpGained;
        state.player.totalXpEarned = (state.player.totalXpEarned || 0) + xpGained;

        let levelUps = 0;
        let oldLevel = state.player.level || 1;

        while (state.player.currentXp >= this.getXpRequiredForLevel(state.player.level)) {
            state.player.currentXp -= this.getXpRequiredForLevel(state.player.level);
            state.player.level++;
            levelUps++;

            Object.keys(state.player.baseAttributes).forEach(k => {
                state.player.baseAttributes[k] += 1;
            });
        }

        const masteryGain = methodKey === 'passive_reading' ? 1 : methodKey === 'flashcards' ? 2 : 3;
        state.player.mastery = Math.min(100, (state.player.mastery || 50) + masteryGain);

        const todayStr = new Date().toISOString().split('T')[0];
        if (state.player.lastStudyDate !== todayStr) {
            state.player.consecutiveDays = (state.player.consecutiveDays || 0) + 1;
            state.player.lastStudyDate = todayStr;
        }

        // Registro da Sessão (A matéria livre é salva apenas para histórico de consulta)
        const sessionRecord = {
            id: Date.now().toString(),
            date: todayStr,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            durationMinutes: minutes,
            subject: subject.trim() || 'Estudo Geral',
            bossName: currentBossCopy.name,
            methodKey: methodKey,
            methodName: DATABASE.methods[methodKey].name,
            damage: outcome.damage,
            xp: xpGained,
            isCrit: outcome.isCrit
        };

        this.checkTrophies(state);

        Storage.save(state);
        Storage.addSession(sessionRecord);

        AudioEngine.playHit(outcome.isCrit);

        if (bossDefeated && droppedItem) {
            AudioEngine.playLoot(droppedItem.rarity);
            UI.showVictoryLootModal(currentBossCopy, droppedItem);
        } else if (levelUps > 0) {
            AudioEngine.playLevelUp();
            UI.showLevelUpModal(oldLevel, state.player.level);
        }

        return sessionRecord;
    }
};