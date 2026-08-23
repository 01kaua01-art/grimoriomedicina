const CombatEngine = {
    getLocalDateString(date = new Date()) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },

    getDaysDifference(fromDateStr, toDateStr) {
        if (!fromDateStr || !toDateStr) return 0;
        const [y1, m1, d1] = fromDateStr.split('-').map(Number);
        const [y2, m2, d2] = toDateStr.split('-').map(Number);
        const utc1 = Date.UTC(y1, m1 - 1, d1);
        const utc2 = Date.UTC(y2, m2 - 1, d2);
        return Math.floor((utc2 - utc1) / (1000 * 60 * 60 * 24));
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
        return Math.round(150 + (Math.pow(level, 1.6) * 100));
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

        const shuffle = (arr) => {
            const a = [...arr];
            for (let i = a.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [a[i], a[j]] = [a[j], a[i]];
            }
            return a;
        };

        const traitKeys = Object.keys(DATABASE.traits);
        const shuffledTraits = shuffle(traitKeys);
        const traitCount = (rarity === 'legendary' || rarity === 'epic') ? 2 : 1;
        const selectedTraits = shuffledTraits.slice(0, traitCount);

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

    calculate(minutes, methodKey, isPartial = false, totalSessionMinutes = minutes) {
        const method = DATABASE.methods[methodKey] || DATABASE.methods.questions;
        const attrs = this.getTotalAttributes();
        const state = Storage.get();
        const equippedIds = Object.values(state.equipment).filter(Boolean);

        let baseDamage = (minutes / 60) * method.damage_per_hour;
        baseDamage *= (1 + (attrs.poder / 100));

        if (methodKey === 'questions' || methodKey === 'mock_exam') {
            baseDamage *= (1 + (attrs.precisao / 100));
            if (equippedIds.includes('estetoscopio_clinico')) baseDamage *= 1.12;
        }

        if (methodKey === 'flashcards' || methodKey === 'active_combo') {
            baseDamage *= (1 + (attrs.retencao / 100));
            if (equippedIds.includes('atlas_netter')) baseDamage *= 1.15;
        }

        if (totalSessionMinutes >= 50) {
            baseDamage *= (1 + (attrs.foco / 100));
            if (equippedIds.includes('bisturi_anatomista')) baseDamage *= 1.10;
            if (equippedIds.includes('ampulheta_foco')) baseDamage *= 1.15;
            if (equippedIds.includes('tesoura_mayo')) baseDamage *= 1.12;
        }

        const bossHpPct = state.boss.currentHp / state.boss.maxHp;
        if (bossHpPct < 0.20 && equippedIds.includes('lamina_ultimo_corte')) {
            baseDamage *= 1.50;
        }

        if (state.boss.traits && state.boss.traits.includes('relentless')) {
            baseDamage *= 0.85;
        }

        let streakBonus = 1.0 + ((state.player.consecutiveDays || 1) * 0.05);
        if (equippedIds.includes('marcapasso_ancestral')) streakBonus += 0.05;
        const combo = Math.min(1.35, streakBonus);

        let isCrit = (!isPartial && totalSessionMinutes >= 50);
        if (isPartial) isCrit = Math.random() < 0.20;
        if (equippedIds.includes('olho_hipocrates') && (methodKey === 'questions' || methodKey === 'mock_exam')) {
            isCrit = true;
        }

        let critMultiplier = 1.5 + (attrs.foco / 100);
        let totalDamage = baseDamage * combo;
        if (isCrit) totalDamage *= critMultiplier;

        let totalXp = (minutes / 60) * method.xp_per_hour;
        totalXp *= (1 + (attrs.intelecto / 100));

        if (equippedIds.includes('anel_sinapse')) totalXp *= 1.08;
        if (equippedIds.includes('codex_katzung') && methodKey === 'questions') totalXp *= 1.15;
        if (equippedIds.includes('estetoscopio_laennec') && totalSessionMinutes >= 60) totalXp *= 1.25;
        if (isCrit) totalXp *= 1.20;

        return {
            damage: Math.round(totalDamage),
            xp: Math.round(totalXp),
            isCrit: isCrit
        };
    },

    rollLoot(bossRarity) {
        const attrs = this.getTotalAttributes();
        const fortuna = attrs.fortuna || 1;
        const state = Storage.get();

        const roll = Math.random() * 100;
        let rarity = 'common';
        const baseBonus = bossRarity === 'legendary' ? 20 : bossRarity === 'epic' ? 10 : bossRarity === 'rare' ? 5 : 0;

        if (roll < (1 + (fortuna * 0.3) + baseBonus)) rarity = 'legendary';
        else if (roll < (6 + (fortuna * 0.5) + baseBonus)) rarity = 'epic';
        else if (roll < (22 + (fortuna * 0.8) + baseBonus)) rarity = 'rare';
        else if (roll < 60) rarity = 'uncommon';

        // 1. Tenta pegar itens da raridade sorteada que o jogador ainda não tem
        let matchingItems = Object.values(DATABASE.items).filter(i => i.rarity === rarity);
        let unobtained = matchingItems.filter(i => !state.inventory.includes(i.id));

        // 2. Se já tem todos dessa raridade, tenta qualquer item ainda não descoberto no jogo
        if (unobtained.length === 0) {
            const allUnobtained = Object.values(DATABASE.items).filter(i => !state.inventory.includes(i.id));
            if (allUnobtained.length > 0) {
                return allUnobtained[Math.floor(Math.random() * allUnobtained.length)];
            }
        }

        const pool = unobtained.length > 0 ? unobtained : (matchingItems.length > 0 ? matchingItems : Object.values(DATABASE.items));
        return pool[Math.floor(Math.random() * pool.length)];
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
        const outcome = this.calculate(minutes, methodKey, false, minutes);
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
            
            // Só adiciona ao inventário se ainda não possuir
            if (!state.inventory.includes(droppedItem.id)) {
                state.inventory.push(droppedItem.id);
            }

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

            const nextBoss = this.generateProceduralBoss(state.boss.bossesDefeated, state.boss.preset || 12000);
            state.boss = { ...nextBoss, bossesDefeated: state.boss.bossesDefeated, preset: state.boss.preset };
        }

        let xpGained = outcome.xp;
        if (bossDefeated && currentBossCopy.traits && currentBossCopy.traits.includes('colossal')) {
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
            state.player.attributePoints = (state.player.attributePoints || 0) + 2;
        }

        const todayStr = this.getLocalDateString();

        if (state.player.lastStudyDate) {
            const diffDays = this.getDaysDifference(state.player.lastStudyDate, todayStr);

            if (diffDays === 1) {
                state.player.consecutiveDays = (state.player.consecutiveDays || 0) + 1;
            } else if (diffDays > 1) {
                state.player.consecutiveDays = 1;
            }
        } else {
            state.player.consecutiveDays = 1;
        }
        state.player.lastStudyDate = todayStr;

        const sessionRecord = {
            id: Date.now().toString(),
            date: todayStr,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            durationMinutes: minutes,
            subject: (subject && subject.trim()) || 'Estudo Geral',
            bossName: currentBossCopy.name,
            methodKey: methodKey,
            methodName: (DATABASE.methods[methodKey] && DATABASE.methods[methodKey].name) || 'Estudo',
            damage: outcome.damage,
            xp: xpGained,
            isCrit: outcome.isCrit
        };

        state.sessions.unshift(sessionRecord);
        this.checkTrophies(state);
        Storage.save(state);

        if (typeof AudioEngine !== 'undefined' && AudioEngine.playHit) {
            AudioEngine.playHit(outcome.isCrit);
        }

        if (typeof UI !== 'undefined') {
            if (bossDefeated && droppedItem) {
                if (typeof AudioEngine !== 'undefined' && AudioEngine.playLoot) AudioEngine.playLoot(droppedItem.rarity);
                UI.showVictoryLootModal(currentBossCopy, droppedItem);
            } else if (levelUps > 0) {
                if (typeof AudioEngine !== 'undefined' && AudioEngine.playLevelUp) AudioEngine.playLevelUp();
                UI.showLevelUpModal(oldLevel, state.player.level, levelUps * 2);
            }
        }

        return sessionRecord;
    }
};