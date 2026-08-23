const STORAGE_KEY = 'medrpg_save_v2';
const SAVE_VERSION = 2;

const Storage = {
    getDefault() {
        return {
            _version: SAVE_VERSION,
            player: {
                name: "Acadêmico",
                level: 1,
                currentXp: 0,
                totalXpEarned: 0,
                consecutiveDays: 1,
                lastStudyDate: null,
                mastery: 10,
                attributePoints: 0,
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

    migrate(data) {
        if (!data) return this.getDefault();
        const version = data._version || 1;

        if (version < 2) {
            data._version = 2;
            if (data.player && data.player.attributePoints === undefined) {
                data.player.attributePoints = 0;
            }
            if (!data.player.mastery) data.player.mastery = 10;
            if (!data.stats) data.stats = { totalDamage: 0, maxSessionDamage: 0 };
        }

        // Deduplica o inventário para eliminar itens repetidos do save
        if (Array.isArray(data.inventory)) {
            data.inventory = [...new Set(data.inventory)];
        }

        this.save(data);
        return data;
    },

    get() {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            const legacyRaw = localStorage.getItem('medrpg_save_v1');
            if (legacyRaw) {
                try {
                    const legacyData = JSON.parse(legacyRaw);
                    const migrated = this.migrate(legacyData);
                    this.save(migrated);
                    localStorage.removeItem('medrpg_save_v1');
                    return structuredClone(migrated);
                } catch (e) {}
            }
            const fresh = this.getDefault();
            this.save(fresh);
            return structuredClone(fresh);
        }

        try {
            const data = JSON.parse(raw);
            const validated = this.migrate(data);
            return structuredClone(validated);
        } catch (e) {
            const fresh = this.getDefault();
            this.save(fresh);
            return structuredClone(fresh);
        }
    },

    save(state) {
        if (state && Array.isArray(state.inventory)) {
            state.inventory = [...new Set(state.inventory)];
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    },

    equipItem(itemId, explicitSlot = null) {
        const state = this.get();
        const item = DATABASE.items[itemId];
        if (!item) return;

        let targetSlot = explicitSlot || item.slot;

        if (targetSlot === 'ring' || targetSlot === 'ring1' || targetSlot === 'ring2') {
            if (explicitSlot && (explicitSlot === 'ring1' || explicitSlot === 'ring2')) {
                targetSlot = explicitSlot;
            } else if (!state.equipment.ring1) {
                targetSlot = 'ring1';
            } else if (!state.equipment.ring2) {
                targetSlot = 'ring2';
            } else {
                targetSlot = 'ring1';
            }
        }

        state.equipment[targetSlot] = itemId;

        if (!state.inventory.includes(itemId)) {
            state.inventory.push(itemId);
        }

        this.save(state);
    },

    unequipItem(slot) {
        const state = this.get();
        if (state.equipment && state.equipment[slot] !== undefined) {
            state.equipment[slot] = null;
            this.save(state);
        }
    },

    exportSave() {
        const state = this.get();
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
        const downloadAnchor = document.createElement('a');
        
        const dateTag = new Date().toISOString().split('T')[0];
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `medrpg_save_lvl${state.player.level}_${dateTag}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
    },

    importSave(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const parsed = JSON.parse(e.target.result);
                if (!parsed.player || !parsed.equipment || !parsed.boss) {
                    throw new Error('Arquivo incompatível');
                }

                if (confirm(`Restaurar save do acadêmico nível ${parsed.player.level}? O progresso local atual será substituído.`)) {
                    this.save(this.migrate(parsed));
                    location.reload();
                }
            } catch (err) {
                alert('Erro ao importar save: Formato de JSON inválido.');
            }
        };
        reader.readAsText(file);
    },

    resetAllData() {
        if (confirm('Tem certeza que deseja resetar todo o seu progresso? Essa ação é irreversível.')) {
            localStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem('medrpg_save_v1');
            location.reload();
        }
    }
};