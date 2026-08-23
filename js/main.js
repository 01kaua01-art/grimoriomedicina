const Tabs = {
    open(tabId) {
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));

        const targetBtn = Array.from(document.querySelectorAll('.nav-btn')).find(b => b.getAttribute('onclick').includes(tabId));
        if (targetBtn) targetBtn.classList.add('active');

        const targetPanel = document.getElementById(`tab-${tabId}`);
        if (targetPanel) targetPanel.classList.add('active');

        if (tabId === 'character') CharacterHub.render();
        if (tabId === 'calendar') CalendarView.render();
        if (tabId === 'history') HistoryView.render();
        if (tabId === 'stats') StatsView.render();
    }
};

const CharacterHub = {
    currentSubTab: 'overview',
    currentBagFilter: 'all',
    inspectingItemId: null,

    openSubTab(tab) {
        this.currentSubTab = tab;
        document.querySelectorAll('.char-sub-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.char-sub-panel').forEach(p => p.classList.remove('active'));

        const btn = Array.from(document.querySelectorAll('.char-sub-btn')).find(b => b.getAttribute('onclick').includes(tab));
        if (btn) btn.classList.add('active');

        const panel = document.getElementById(`char-sub-${tab}`);
        if (panel) panel.classList.add('active');

        this.render();
    },

    render() {
        const state = Storage.get();
        if (this.currentSubTab === 'overview') this.renderOverview(state);
        if (this.currentSubTab === 'equipment') this.renderEquipment(state);
        if (this.currentSubTab === 'inventory') this.renderInventory(state);
        if (this.currentSubTab === 'collection') this.renderCollection(state);
    },

    allocatePoint(attrKey) {
        const state = Storage.get();
        if ((state.player.attributePoints || 0) > 0) {
            state.player.attributePoints -= 1;
            state.player.baseAttributes[attrKey] = (state.player.baseAttributes[attrKey] || 0) + 1;
            Storage.save(state);
            this.renderOverview(state);
            UI.render();
        }
    },

    renderOverview(state) {
        let rank = DATABASE.ranks[0];
        DATABASE.ranks.forEach(r => {
            if (state.player.level >= r.level) rank = r;
        });

        document.getElementById('char-overview-title').innerText = rank.title.toUpperCase();
        document.getElementById('char-overview-elo').innerText = rank.elo;
        document.getElementById('char-overview-lvl').innerText = state.player.level;

        const reqXp = CombatEngine.getXpRequiredForLevel(state.player.level);
        const curXp = state.player.currentXp || 0;
        document.getElementById('char-overview-xp-detail').innerText = `${curXp} / ${reqXp} XP`;
        document.getElementById('char-overview-xp-left').innerText = `Faltam ${Math.max(0, reqXp - curXp)} XP`;
        document.getElementById('char-overview-xp-fill').style.width = `${Math.min(100, (curXp / reqXp) * 100)}%`;

        document.getElementById('char-hl-bosses').innerText = state.boss.bossesDefeated || 0;
        
        const totalMinutes = state.sessions.reduce((acc, cur) => acc + (cur.durationMinutes || 0), 0);
        document.getElementById('char-hl-hours').innerText = `${Math.floor(totalMinutes / 60)}h`;
        document.getElementById('char-hl-streak').innerText = `${state.player.consecutiveDays || 1}d`;
        document.getElementById('char-hl-loot').innerText = state.inventory.length;

        const attrsList = document.getElementById('attributes-bars-list');
        const availablePoints = state.player.attributePoints || 0;
        
        attrsList.innerHTML = availablePoints > 0 
            ? `<div style="background: rgba(212, 175, 55, 0.15); border: 1px solid var(--gold); padding: 8px; border-radius: 6px; margin-bottom: 12px; text-align: center; color: var(--gold); font-weight: bold;">
                ✦ Você possui ${availablePoints} ponto(s) de atributo para distribuir!
               </div>`
            : '';

        const totalAttrs = CombatEngine.getTotalAttributes();

        Object.entries(DATABASE.attributesMeta).forEach(([key, meta]) => {
            const val = totalAttrs[key] || 1;
            const pct = Math.min(100, (val / 100) * 100);
            
            const plusBtn = availablePoints > 0 
                ? `<button onclick="CharacterHub.allocatePoint('${key}')" style="background: var(--gold); border: none; color: #000; font-weight: bold; width: 22px; height: 22px; border-radius: 4px; cursor: pointer; margin-left: 8px;">+</button>` 
                : '';

            attrsList.innerHTML += `
                <div class="attr-row">
                    <div class="attr-meta">
                        <span>${meta.icon} ${meta.name}</span>
                        <div style="display: flex; align-items: center;">
                            <strong style="color:var(--gold);">${val}</strong>
                            ${plusBtn}
                        </div>
                    </div>
                    <div class="attr-bar-bg">
                        <div class="attr-bar-fill" style="width: ${pct}%;"></div>
                    </div>
                </div>
            `;
        });

        document.getElementById('j-dmg').innerText = `${(state.stats.totalDamage || 0).toLocaleString()} HP`;
        document.getElementById('j-max-dmg').innerText = `${(state.stats.maxSessionDamage || 0).toLocaleString()} HP`;
        document.getElementById('j-sessions').innerText = state.sessions.length;
        document.getElementById('j-xp').innerText = (state.player.totalXpEarned || 0).toLocaleString();
        
        const legCount = state.inventory.filter(id => DATABASE.items[id] && DATABASE.items[id].rarity === 'legendary').length;
        document.getElementById('j-legendary-count').innerText = legCount;

        const avg = state.sessions.length > 0 ? Math.round(totalMinutes / state.sessions.length) : 0;
        document.getElementById('j-avg-time').innerText = `${avg} min`;
    },

    renderEquipment(state) {
        let rank = DATABASE.ranks[0];
        DATABASE.ranks.forEach(r => {
            if (state.player.level >= r.level) rank = r;
        });

        document.getElementById('avatar-portrait-img').src = rank.icon;
        document.getElementById('avatar-rank-pill').innerText = rank.title;

        Object.keys(DATABASE.slots).forEach(slotKey => {
            const frame = document.getElementById(`slot-${slotKey}`);
            if (!frame) return;

            const itemId = state.equipment[slotKey];
            if (itemId && DATABASE.items[itemId]) {
                const item = DATABASE.items[itemId];
                frame.innerHTML = `<img src="${item.icon}" alt="${item.name}" style="border:1px solid ${DATABASE.rarities[item.rarity].color}; border-radius:4px; padding:2px;">`;
            } else {
                frame.innerHTML = `<i class="fa-solid ${DATABASE.slots[slotKey].icon} slot-placeholder-icon"></i>`;
            }
        });
    },

    filterBag(cat, btn) {
        this.currentBagFilter = cat;
        document.querySelectorAll('.cat-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.renderInventory(Storage.get());
    },

    renderInventory(state) {
        const bag = document.getElementById('inventory-bag-full');
        bag.innerHTML = '';

        let items = state.inventory.map(id => DATABASE.items[id]).filter(Boolean);
        if (this.currentBagFilter !== 'all') {
            items = items.filter(i => {
                if (this.currentBagFilter === 'ring') return i.slot === 'ring1' || i.slot === 'ring2';
                return i.slot === this.currentBagFilter;
            });
        }

        if (items.length === 0) {
            bag.innerHTML = '<div style="grid-column:1/-1; color:var(--text-muted); font-size:0.85rem; padding:20px; text-align:center;">Nenhum item nesta categoria.</div>';
            return;
        }

        items.forEach(item => {
            const isEquipped = Object.values(state.equipment).includes(item.id);
            const slot = document.createElement('div');
            slot.className = 'slot-frame';
            slot.style.borderColor = DATABASE.rarities[item.rarity].color;
            slot.innerHTML = `
                <img src="${item.icon}" alt="${item.name}">
                ${isEquipped ? '<span style="position:absolute; bottom:2px; right:2px; background:var(--gold); color:#000; font-size:9px; font-weight:bold; padding:1px 3px; border-radius:2px;">E</span>' : ''}
            `;
            slot.onclick = () => this.inspectItem(item.id);
            bag.appendChild(slot);
        });
    },

    renderCollection(state) {
        const totalBosses = Object.values(DATABASE.bossPool).flat().length;
        const catalogedBosses = Object.keys(state.bestiary || {}).length;
        document.getElementById('col-boss-ratio').innerText = `${catalogedBosses} / ${totalBosses}`;

        const totalItems = Object.keys(DATABASE.items).length;
        const foundItems = new Set(state.inventory).size;
        document.getElementById('col-item-ratio').innerText = `${foundItems} / ${totalItems}`;

        document.getElementById('col-trophy-ratio').innerText = `${state.unlockedTrophies.length} / ${DATABASE.trophies.length}`;

        const bestiaryGrid = document.getElementById('bestiary-grid-collection');
        bestiaryGrid.innerHTML = '';
        Object.values(state.bestiary || {}).forEach(b => {
            bestiaryGrid.innerHTML += `
                <div class="bestiary-card-item">
                    <img src="${b.icon}" width="40" height="40" alt="${b.name}">
                    <div>
                        <strong style="color:var(--gold); font-size:0.85rem;">${b.name}</strong>
                        <div style="font-size:0.75rem; color:var(--text-muted);">${b.rarity.toUpperCase()} • Derrotado: ${b.defeatedCount}x</div>
                    </div>
                </div>
            `;
        });

        const trophiesGrid = document.getElementById('trophies-grid-collection');
        trophiesGrid.innerHTML = '';
        DATABASE.trophies.forEach(t => {
            const unlocked = state.unlockedTrophies.includes(t.id);
            trophiesGrid.innerHTML += `
                <div class="trophy-card-item" style="opacity: ${unlocked ? '1' : '0.35'}; border-color: ${unlocked ? 'var(--gold)' : 'var(--border-color)'};">
                    <i class="fa-solid ${t.icon}" style="font-size:1.8rem; color:${unlocked ? 'var(--gold)' : 'var(--text-muted)'};"></i>
                    <div>
                        <strong style="font-size:0.85rem; color:#fff;">${t.name}</strong>
                        <div style="font-size:0.72rem; color:var(--text-muted);">${t.desc}</div>
                    </div>
                </div>
            `;
        });
    },

    clickSlot(slotKey) {
        const state = Storage.get();
        const itemId = state.equipment[slotKey];
        if (itemId) {
            this.inspectItem(itemId, slotKey);
        }
    },

    inspectItem(itemId, equippedSlot = null) {
        this.inspectingItemId = itemId;
        const item = DATABASE.items[itemId];
        const state = Storage.get();
        if (!item) return;

        document.getElementById('inspect-item-name').innerText = item.name;
        document.getElementById('inspect-item-name').style.color = DATABASE.rarities[item.rarity].color;
        document.getElementById('inspect-item-img').src = item.icon;
        document.getElementById('inspect-item-type').innerText = `[${DATABASE.rarities[item.rarity].name.toUpperCase()}] • ${DATABASE.slots[item.slot] ? DATABASE.slots[item.slot].name : 'Item'}`;
        document.getElementById('inspect-item-desc').innerText = item.effect;
        document.getElementById('inspect-item-origin').innerText = item.origin || '';

        const targetSlot = equippedSlot || item.slot;
        const currentEquippedId = state.equipment[targetSlot];
        const currentItem = currentEquippedId ? DATABASE.items[currentEquippedId] : null;

        document.getElementById('comp-current-name').innerText = currentItem ? currentItem.name : 'Nenhum';
        
        const curStatsBox = document.getElementById('comp-current-stats');
        curStatsBox.innerHTML = '';
        if (currentItem) {
            Object.entries(currentItem.stats).forEach(([k, v]) => {
                curStatsBox.innerHTML += `<div>+${v} ${k}</div>`;
            });
        }

        const newStatsBox = document.getElementById('comp-new-stats');
        newStatsBox.innerHTML = '';
        Object.entries(item.stats).forEach(([k, v]) => {
            newStatsBox.innerHTML += `<div>+${v} ${k}</div>`;
        });

        const actionsBox = document.getElementById('inspect-actions-box');
        const isEquipped = Object.values(state.equipment).includes(item.id);

        if (isEquipped) {
            actionsBox.innerHTML = `<button class="btn-danger" style="width:100%;" onclick="CharacterHub.unequip('${targetSlot}')">Desequipar</button>`;
        } else {
            actionsBox.innerHTML = `<button class="btn-primary" style="width:100%;" onclick="CharacterHub.equip('${item.id}', '${targetSlot}')">Equipar</button>`;
        }

        document.getElementById('item-inspect-modal').classList.add('active');
    },

    equip(itemId, slot) {
        Storage.equipItem(itemId, slot);
        this.closeInspectModal();
        this.render();
        UI.render();
    },

    unequip(slot) {
        Storage.unequipItem(slot);
        this.closeInspectModal();
        this.render();
        UI.render();
    },

    closeInspectModal() {
        document.getElementById('item-inspect-modal').classList.remove('active');
    }
};

const CalendarView = {
    currentYear: new Date().getFullYear(),
    currentMonth: new Date().getMonth(),

    prevMonth() {
        this.currentMonth--;
        if (this.currentMonth < 0) {
            this.currentMonth = 11;
            this.currentYear--;
        }
        this.render();
    },

    nextMonth() {
        this.currentMonth++;
        if (this.currentMonth > 11) {
            this.currentMonth = 0;
            this.currentYear++;
        }
        this.render();
    },

    render() {
        const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        document.getElementById('cal-month-title').innerText = `${monthNames[this.currentMonth]} de ${this.currentYear}`;

        const grid = document.getElementById('cal-grid');
        grid.innerHTML = '';

        const firstDay = new Date(this.currentYear, this.currentMonth, 1).getDay();
        const totalDays = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
        const state = Storage.get();

        for (let i = 0; i < firstDay; i++) {
            grid.innerHTML += `<div class="cal-cell" style="opacity:0.2;"></div>`;
        }

        for (let day = 1; day <= totalDays; day++) {
            const mStr = (this.currentMonth + 1).toString().padStart(2, '0');
            const dStr = day.toString().padStart(2, '0');
            const dateKey = `${this.currentYear}-${mStr}-${dStr}`;

            const daySessions = state.sessions.filter(s => s.date === dateKey);
            const totalMins = daySessions.reduce((acc, cur) => acc + (cur.durationMinutes || 0), 0);
            const hasStudy = daySessions.length > 0;

            grid.innerHTML += `
                <div class="cal-cell ${hasStudy ? 'active-day' : ''}" onclick="CalendarView.openDayModal('${dateKey}')">
                    <strong>${day}</strong>
                    ${hasStudy ? `<div style="color:var(--gold); font-weight:bold; font-size:0.7rem; margin-top:2px;">${totalMins}m</div>` : ''}
                </div>
            `;
        }
    },

    openDayModal(dateKey) {
        const state = Storage.get();
        const daySessions = state.sessions.filter(s => s.date === dateKey);

        document.getElementById('modal-day-title').innerText = dateKey;
        const totalMins = daySessions.reduce((acc, cur) => acc + (cur.durationMinutes || 0), 0);
        const totalDmg = daySessions.reduce((acc, cur) => acc + (cur.damage || 0), 0);
        const totalXp = daySessions.reduce((acc, cur) => acc + (cur.xp || 0), 0);

        document.getElementById('modal-day-time').innerText = `${totalMins} min`;
        document.getElementById('modal-day-dmg').innerText = `${totalDmg.toLocaleString()} HP`;
        document.getElementById('modal-day-xp').innerText = totalXp.toLocaleString();
        document.getElementById('modal-day-sessions').innerText = daySessions.length;

        const cont = document.getElementById('modal-sessions-container');
        cont.innerHTML = '';
        if (daySessions.length === 0) {
            cont.innerHTML = '<div style="color:var(--text-muted); text-align:center; padding:10px;">Nenhuma batalha registrada nesta data.</div>';
        } else {
            daySessions.forEach(s => {
                cont.innerHTML += `
                    <div class="session-mini-item" style="margin-bottom:4px;">
                        <span>${s.time} • ${s.subject} (${s.durationMinutes}m)</span>
                        <strong style="color:var(--crimson);">${s.damage} HP</strong>
                    </div>
                `;
            });
        }

        document.getElementById('day-modal').classList.add('active');
    }
};

const HistoryView = {
    render() {
        const text = (document.getElementById('history-filter-text').value || '').toLowerCase();
        const method = document.getElementById('history-filter-method').value;
        const state = Storage.get();

        const cont = document.getElementById('history-list-container');
        cont.innerHTML = '';

        let list = state.sessions;
        if (text) list = list.filter(s => s.subject.toLowerCase().includes(text));
        if (method !== 'all') list = list.filter(s => s.methodKey === method);

        if (list.length === 0) {
            cont.innerHTML = '<div style="color:var(--text-muted); text-align:center; padding:20px;">Nenhum registro correspondente.</div>';
            return;
        }

        list.forEach(s => {
            cont.innerHTML += `
                <div class="session-mini-item" style="padding:10px; margin-bottom:6px;">
                    <div>
                        <strong style="color:#fff; font-size:0.9rem;">${s.subject}</strong>
                        <div style="font-size:0.75rem; color:var(--text-muted);">${s.date} ${s.time} • ${s.methodName} • ${s.durationMinutes} min</div>
                    </div>
                    <div style="text-align:right;">
                        <div style="color:var(--crimson); font-weight:bold;">-${s.damage} HP</div>
                        <div style="color:var(--mana); font-size:0.75rem;">+${s.xp} XP</div>
                    </div>
                </div>
            `;
        });
    }
};

const StatsView = {
    render() {
        const state = Storage.get();
        const totalMinutes = state.sessions.reduce((acc, cur) => acc + (cur.durationMinutes || 0), 0);
        const hours = Math.floor(totalMinutes / 60);
        const mins = totalMinutes % 60;

        document.getElementById('stat-total-time').innerText = `${hours}h ${mins}m`;
        document.getElementById('stat-total-dmg').innerText = `${(state.stats.totalDamage || 0).toLocaleString()} HP`;
        document.getElementById('stat-total-xp').innerText = (state.player.totalXpEarned || 0).toLocaleString();
        document.getElementById('stat-total-sessions').innerText = state.sessions.length;
        document.getElementById('stat-bosses-killed').innerText = state.boss.bossesDefeated || 0;

        const uniqueDays = new Set(state.sessions.map(s => s.date)).size || 1;
        document.getElementById('stat-daily-avg').innerText = `${Math.round(totalMinutes / uniqueDays)} min`;

        const breakdown = {};
        state.sessions.forEach(s => {
            const sub = s.subject.trim() || 'Estudo Geral';
            breakdown[sub] = (breakdown[sub] || 0) + s.durationMinutes;
        });

        const cont = document.getElementById('subject-breakdown-container');
        cont.innerHTML = '<h3 style="color:var(--gold); margin:14px 0 8px 0; font-size:0.9rem;">DISTRIBUIÇÃO DE CONTEÚDO</h3>';
        Object.entries(breakdown).forEach(([sub, m]) => {
            const pct = Math.min(100, Math.round((m / totalMinutes) * 100)) || 0;
            cont.innerHTML += `
                <div style="margin-bottom:6px;">
                    <div style="display:flex; justify-content:space-between; font-size:0.8rem;">
                        <span>${sub}</span>
                        <strong>${m}m (${pct}%)</strong>
                    </div>
                    <div style="background:#0b0c11; height:6px; border-radius:3px; overflow:hidden;">
                        <div style="background:var(--gold); width:${pct}%; height:100%;"></div>
                    </div>
                </div>
            `;
        });
    }
};

const SettingsView = {
    changeBossCycle(presetVal) {
        const state = Storage.get();
        state.boss.preset = parseInt(presetVal);
        state.boss.maxHp = state.boss.preset;
        state.boss.currentHp = state.boss.preset;
        Storage.save(state);
        UI.render();
    }
};

const UI = {
    render() {
        const state = Storage.get();

        let rank = DATABASE.ranks[0];
        DATABASE.ranks.forEach(r => {
            if (state.player.level >= r.level) rank = r;
        });

        document.getElementById('p-title').innerText = rank.title;
        document.getElementById('p-lvl').innerText = state.player.level;
        document.getElementById('p-elo').innerText = rank.elo;

        const reqXp = CombatEngine.getXpRequiredForLevel(state.player.level);
        const curXp = state.player.currentXp || 0;
        document.getElementById('xp-text').innerText = `${curXp} / ${reqXp} XP`;
        document.getElementById('xp-bar').style.width = `${Math.min(100, (curXp / reqXp) * 100)}%`;

        const streak = state.player.consecutiveDays || 1;
        document.getElementById('combo-text').innerText = `x${(1.0 + (streak * 0.05)).toFixed(2)} (${streak} Dias)`;
        document.getElementById('combo-bar').style.width = `${Math.min(100, streak * 10)}%`;

        document.getElementById('boss-name').innerText = state.boss.name.toUpperCase();
        document.getElementById('boss-img').src = state.boss.icon;
        document.getElementById('boss-rarity-label').innerText = DATABASE.rarities[state.boss.rarity].name.toUpperCase();
        document.getElementById('boss-rarity-label').style.background = DATABASE.rarities[state.boss.rarity].color;
        document.getElementById('boss-level-label').innerText = `Lv. ${state.boss.level}`;
        document.getElementById('boss-hp-cur').innerText = Math.round(state.boss.currentHp);
        document.getElementById('boss-hp-max').innerText = state.boss.maxHp;
        document.getElementById('boss-hp-fill').style.width = `${(state.boss.currentHp / state.boss.maxHp) * 100}%`;

        const traitsList = document.getElementById('boss-traits-list');
        traitsList.innerHTML = '';
        state.boss.traits.forEach(tKey => {
            const trait = DATABASE.traits[tKey];
            if (trait) {
                traitsList.innerHTML += `<span class="trait-pill"><i class="fa-solid ${trait.icon}"></i> ${trait.name}</span>`;
            }
        });

        const todayStr = new Date().toISOString().split('T')[0];
        const todaySessions = state.sessions.filter(s => s.date === todayStr);
        const todayMinutes = todaySessions.reduce((acc, cur) => acc + (cur.durationMinutes || 0), 0);
        const todayDmg = todaySessions.reduce((acc, cur) => acc + (cur.damage || 0), 0);
        const todayXp = todaySessions.reduce((acc, cur) => acc + (cur.xp || 0), 0);

        document.getElementById('dash-today-time').innerText = `${todayMinutes} min`;
        document.getElementById('dash-today-dmg').innerText = `${todayDmg.toLocaleString()} HP`;
        document.getElementById('dash-today-xp').innerText = todayXp.toLocaleString();
        document.getElementById('dash-today-count').innerText = todaySessions.length;

        const recentCont = document.getElementById('recent-sessions-container');
        recentCont.innerHTML = '';
        state.sessions.slice(0, 4).forEach(s => {
            recentCont.innerHTML += `
                <div class="session-mini-item">
                    <span>${s.subject} (${s.durationMinutes}m)</span>
                    <strong style="color:var(--crimson);">-${s.damage} HP</strong>
                </div>
            `;
        });
    },

    triggerFloatingDamage(dmg, isCrit) {
        const anchor = document.getElementById('damage-anchor');
        if (!anchor) return;

        const floatEl = document.createElement('div');
        floatEl.style.cssText = `
            position: absolute; top: -20px; left: 50%; transform: translateX(-50%);
            font-size: ${isCrit ? '2rem' : '1.3rem'}; font-weight: 900;
            color: ${isCrit ? '#f1c40f' : '#ff4757'};
            text-shadow: 0 0 10px rgba(0,0,0,0.8);
            animation: floatUp 1.2s ease-out forwards;
            pointer-events: none; z-index: 10;
        `;
        floatEl.innerText = `${isCrit ? '✦ CRITICAL! ' : ''}-${dmg} HP`;
        anchor.appendChild(floatEl);

        setTimeout(() => floatEl.remove(), 1200);
    },

    showVictoryLootModal(boss, item) {
        document.getElementById('loot-boss-name').innerText = boss.name.toUpperCase();
        document.getElementById('loot-item-name').innerText = item.name;
        document.getElementById('loot-item-name').style.color = DATABASE.rarities[item.rarity].color;
        document.getElementById('loot-item-img').src = item.icon;
        document.getElementById('loot-item-rarity').innerText = `[${DATABASE.rarities[item.rarity].name.toUpperCase()}] • ${DATABASE.slots[item.slot] ? DATABASE.slots[item.slot].name : 'Item'}`;
        document.getElementById('loot-item-effect').innerText = item.effect;
        document.getElementById('loot-item-origin').innerText = item.origin || '';

        const statsBox = document.getElementById('loot-item-stats');
        statsBox.innerHTML = '';
        Object.entries(item.stats).forEach(([k, v]) => {
            statsBox.innerHTML += `<span style="background:#0b0c11; border:1px solid var(--border-color); padding:2px 6px; border-radius:4px; font-size:0.75rem; color:var(--gold);">+${v} ${k}</span>`;
        });

        document.getElementById('btn-equip-loot').onclick = () => {
            Storage.equipItem(item.id);
            this.closeVictoryLootModal();
            this.render();
        };

        document.getElementById('victory-loot-modal').classList.add('active');
    },

    closeVictoryLootModal() {
        document.getElementById('victory-loot-modal').classList.remove('active');
    },

    showLevelUpModal(oldLvl, newLvl, pointsGained = 2) {
        let rank = DATABASE.ranks[0];
        DATABASE.ranks.forEach(r => {
            if (newLvl >= r.level) rank = r;
        });

        document.getElementById('levelup-badge-text').innerText = `NÍVEL ${oldLvl} → NÍVEL ${newLvl}`;
        document.getElementById('levelup-rank-text').innerText = `Título Atual: ${rank.title}`;
        
        const bonusText = document.querySelector('.levelup-bonus');
        if (bonusText) {
            bonusText.innerText = `+${pointsGained} Pontos de Atributo disponíveis na aba Personagem!`;
        }

        document.getElementById('levelup-modal').classList.add('active');
    },

    closeLevelUpModal() {
        document.getElementById('levelup-modal').classList.remove('active');
    },

    closeDayModal() {
        document.getElementById('day-modal').classList.remove('active');
    }
};

(function initCanvasFX() {
    const canvas = document.getElementById('fx-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let particles = [];
    let animationId = null;

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    for (let i = 0; i < 40; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 2 + 1,
            speedY: Math.random() * 0.4 + 0.1,
            opacity: Math.random() * 0.4 + 0.1
        });
    }

    function renderParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
            ctx.fillStyle = `rgba(212, 175, 55, ${p.opacity})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();

            p.y -= p.speedY;
            if (p.y < 0) {
                p.y = canvas.height;
                p.x = Math.random() * canvas.width;
            }
        });
        animationId = requestAnimationFrame(renderParticles);
    }
    renderParticles();

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            cancelAnimationFrame(animationId);
        } else {
            renderParticles();
        }
    });
})();

window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal-backdrop.active').forEach(m => m.classList.remove('active'));
    }
});

window.addEventListener('DOMContentLoaded', () => {
    UI.render();
});