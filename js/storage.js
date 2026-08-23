const STORAGE_KEY = 'medrpg_universal_save';

const DEFAULT_STATE = {
    player: {
        level: 1,
        currentXp: 0,
        totalXpEarned: 0,
        mastery: 50,
        consecutiveDays: 1,
        lastStudyDate: null,
        baseAttributes: {
            poder: 10,
            intelecto: 10,
            precisao: 10,
            resistencia: 10,
            foco: 10,
            retencao: 10,
            fortuna: 5
        }
    },
    boss: {
        id: 'devorador_eras',
        name: 'O Devorador de Eras',
        rarity: 'common',
        level: 1,
        maxHp: 12000,
        currentHp: 12000,
        traits: ['insatiable'],
        icon: 'https://api.iconify.design/game-icons/grim-reaper.svg?color=%23e74c3c',
        bossesDefeated: 0,
        preset: 12000,
        spawnDate: new Date().toISOString()
    },
    equipment: {
        weapon: 'bisturi_anatomista',
        grimoire: 'grimorio_guyton',
        armor: null,
        relic: 'ampulheta_foco',
        accessory: 'estetoscopio_clinico',
        ring1: 'alianca_academico',
        ring2: null
    },
    inventory: ['codex_katzung', 'coracao_ferro', 'lupa_investigador'],
    bestiary: {
        devorador_eras: {
            name: 'O Devorador de Eras',
            rarity: 'common',
            defeatedCount: 0,
            firstEncounter: new Date().toISOString(),
            firstDefeatDate: null,
            traits: ['insatiable'],
            icon: 'https://api.iconify.design/game-icons/grim-reaper.svg?color=%23e74c3c'
        }
    },
    unlockedTrophies: [],
    sessions: [],
    stats: {
        totalDamage: 0,
        maxSessionDamage: 0
    }
};

const Storage = {
    get() {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            this.save(DEFAULT_STATE);
            return DEFAULT_STATE;
        }
        try {
            const data = JSON.parse(raw);

            // Blindagem total contra saves antigos ou campos nulos
            data.equipment = data.equipment || DEFAULT_STATE.equipment;
            data.inventory = data.inventory || DEFAULT_STATE.inventory;
            data.bestiary = data.bestiary || DEFAULT_STATE.bestiary;
            data.unlockedTrophies = data.unlockedTrophies || [];
            data.stats = data.stats || DEFAULT_STATE.stats;
            data.player = data.player || DEFAULT_STATE.player;
            data.player.baseAttributes = data.player.baseAttributes || DEFAULT_STATE.player.baseAttributes;

            // Corrige monstros antigos do bestiário que não possuíam traits
            Object.keys(data.bestiary).forEach(k => {
                if (!data.bestiary[k].traits) data.bestiary[k].traits = ['insatiable'];
                if (!data.bestiary[k].rarity) data.bestiary[k].rarity = 'common';
                if (!data.bestiary[k].icon) data.bestiary[k].icon = 'https://api.iconify.design/game-icons/grim-reaper.svg?color=%23e74c3c';
            });

            // Remove itens inválidos que não existem mais no catálogo
            Object.keys(data.equipment).forEach(slot => {
                const id = data.equipment[slot];
                if (id && !DATABASE.items[id]) data.equipment[slot] = null;
            });
            data.inventory = data.inventory.filter(id => DATABASE.items[id]);

            if (!data.boss || !data.boss.level || !data.boss.icon || data.boss.icon.includes('undefined')) {
                data.boss = DEFAULT_STATE.boss;
            }

            return data;
        } catch (e) {
            return DEFAULT_STATE;
        }
    },

    save(state) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    },

    equipItem(itemId) {
        const state = this.get();
        const item = DATABASE.items[itemId];
        if (!item) return;

        let targetSlot = item.slot;
        if (targetSlot === 'ring1' || targetSlot === 'ring2') {
            if (!state.equipment.ring1) targetSlot = 'ring1';
            else if (!state.equipment.ring2) targetSlot = 'ring2';
            else targetSlot = 'ring1';
        }

        const currentlyEquipped = state.equipment[targetSlot];
        const itemIdx = state.inventory.indexOf(itemId);
        if (itemIdx > -1) state.inventory.splice(itemIdx, 1);

        if (currentlyEquipped) {
            state.inventory.push(currentlyEquipped);
        }

        state.equipment[targetSlot] = itemId;
        this.save(state);
    },

    unequipItem(slotKey) {
        const state = this.get();
        const item = state.equipment[slotKey];
        if (!item) return;

        state.equipment[slotKey] = null;
        state.inventory.push(item);
        this.save(state);
    },

    discardItem(itemId) {
        const state = this.get();
        const idx = state.inventory.indexOf(itemId);
        if (idx > -1) {
            state.inventory.splice(idx, 1);
            this.save(state);
        }
    },

    addSession(session) {
        const state = this.get();
        state.sessions.unshift(session);
        this.save(state);
    },

    resetAllData() {
        if (confirm('Atenção: Isso apagará todo o progresso, itens e bestiário. Deseja continuar?')) {
            localStorage.removeItem(STORAGE_KEY);
            location.reload();
        }
    }
};