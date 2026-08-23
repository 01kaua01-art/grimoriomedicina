const STORAGE_KEY = 'medrpg_save_v1';

const Storage = {
    // ESTADO PADRÃO INICIAL (NÍVEL 1 REAL)
    getDefault() {
        return {
            player: {
                name: "Acadêmico",
                level: 1,
                currentXp: 0,
                totalXpEarned: 0,
                consecutiveDays: 1,
                lastStudyDate: null,
                mastery: 10,
                baseAttributes: {
                    poder: 1,
                    intelecto: 1,
                    foco: 1,
                    precisao: 1,
                    retencao: 1,
                    resistencia: 1,
                    fortuna: 1
                }
            },
            equipment: {
                weapon: null,
                grimoire: null,
                armor: null,
                relic: null,
                accessory: null,
                ring1: 'alianca_academico',
                ring2: null
            },
            inventory: ['alianca_academico'],
            boss: {
                id: 'o_devorador_de_eras',
                name: 'O Devorador de Eras',
                rarity: 'common',
                level: 1,
                maxHp: 12000,
                currentHp: 12000,
                traits: ['insatiable'],
                icon: 'https://api.iconify.design/game-icons/grim-reaper.svg?color=%23e74c3c',
                bossesDefeated: 0,
                preset: 12000
            },
            sessions: [],
            unlockedTrophies: [],
            bestiary: {},
            stats: {
                totalDamage: 0,
                maxSessionDamage: 0
            }
        };
    },

    get() {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            const fresh = this.getDefault();
            this.save(fresh);
            return fresh;
        }
        try {
            return JSON.parse(raw);
        } catch (e) {
            const fresh = this.getDefault();
            this.save(fresh);
            return fresh;
        }
    },

    save(state) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    },

    equipItem(itemId, slot) {
        const state = this.get();
        const item = DATABASE.items[itemId];
        if (!item) return;

        let targetSlot = slot || item.slot;

        // Se for um anel genérico, equipa no primeiro slot vago ou no ring1
        if (targetSlot === 'ring' || targetSlot === 'ring1' || targetSlot === 'ring2') {
            if (!state.equipment.ring1) targetSlot = 'ring1';
            else if (!state.equipment.ring2) targetSlot = 'ring2';
            else targetSlot = slot || 'ring1';
        }

        state.equipment[targetSlot] = itemId;

        // Garante que o item esteja na mochila
        if (!state.inventory.includes(itemId)) {
            state.inventory.push(itemId);
        }

        this.save(state);
    },

    unequipItem(slot) {
        const state = this.get();
        if (state.equipment[slot]) {
            state.equipment[slot] = null;
            this.save(state);
        }
    },

    addSession(session) {
        const state = this.get();
        state.sessions.unshift(session);
        this.save(state);
    },

    resetAllData() {
        if (confirm('Tem certeza que deseja resetar todo o seu progresso? Essa ação é irreversível.')) {
            localStorage.removeItem(STORAGE_KEY);
            location.reload();
        }
    }
};