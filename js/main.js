const Tabs = {
    open(tabId) {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
        event.currentTarget.classList.add('active');
        document.getElementById(`tab-${tabId}`).classList.add('active');

        if (tabId === 'character') CharacterHub.render();
        if (tabId === 'calendar') CalendarView.render();
        if (tabId === 'history') HistoryView.render();
        if (tabId === 'stats') StatsView.render();
    }
};

const CharacterHub = {
    currentCategory: 'all',

    openSubTab(subTabId) {
        document.querySelectorAll('.char-sub-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.char-sub-panel').forEach(p => p.classList.remove('active'));
        event.currentTarget.classList.add('active');
        document.getElementById(`char-sub-${subTabId}`).classList.add('active');

        if (subTabId === 'overview') this.renderOverview();
        if (subTabId === 'equipment') this.renderEquipment();
        if (subTabId === 'inventory') this.renderInventory();
        if (subTabId === 'collection') this.renderCollection();
    },

    render() {
        this.renderOverview();
        this.renderEquipment();
        this.renderInventory();
        this.renderCollection();
    },

    renderOverview() {
        const state = Storage.get();
        const attrs = CombatEngine.getTotalAttributes();

        let rank = DATABASE.ranks[0];
        DATABASE.ranks.forEach(r => {
            if (state.player.level >= r.level) rank = r;
        });

        document.getElementById('char-overview-title').innerText = rank.title.toUpperCase();
        document.getElementById('char-overview-elo').innerText = rank.elo;
        document.getElementById('char-overview-lvl').innerText = state.player.level;

        const currentLvl = state.player.level || 1;
        const currentXp = state.player.currentXp || 0;
        const neededXp = CombatEngine.getXpRequiredForLevel(currentLvl);
        const xpLeft = Math.max(0, neededXp - currentXp);

        document.getElementById('char-overview-xp-detail').innerText = `${currentXp} / ${neededXp} XP`;
        document.getElementById('char-overview-xp-left').innerText = `Faltam ${xpLeft} XP para Level Up`;
        const xpPercent = Math.min(100, Math.round((currentXp / neededXp) * 100));
        document.getElementById('char-overview-xp-fill').style.width = `${xpPercent}%`;

        const totalMins = state.sessions.reduce((acc, s) => acc + s.durationMinutes, 0);
        document.getElementById('char-hl-bosses').innerText = state.boss.bossesDefeated || 0;
        document.getElementById('char-hl-hours').innerText = `${Math.floor(totalMins / 60)}h ${totalMins % 60}m`;
        document.getElementById('char-hl-streak').innerText = `${state.player.consecutiveDays || 1}d`;
        document.getElementById('char-hl-loot').innerText = state.inventory.length + Object.values(state.equipment).filter(Boolean).length;

        const barsContainer = document.getElementById('attributes-bars-list');
        barsContainer.innerHTML = '';

        Object.entries(DATABASE.attributesMeta).forEach(([attrKey, meta]) => {
            const val = attrs[attrKey] || 10;
            const barWidth = Math.min(100, Math.round((val / 40) * 100));

            const row = document.createElement('div');
            row.className = 'attr-row-bar';
            row.innerHTML = `
                <div class="attr-bar-header">
                    <span>${meta.icon} ${meta.name.toUpperCase()}</span>
                    <strong style="color:var(--gold);">${val}</strong>
                </div>
                <div class="attr-bar-track">
                    <div class="attr-bar-fill" style="width:${barWidth}%;"></div>
                </div>
                <div class="attr-desc-tooltip">${meta.desc}</div>
            `;
            barsContainer.appendChild(row);
        });

        document.getElementById('j-dmg').innerText = `${state.stats.totalDamage || 0} HP`;
        document.getElementById('j-max-dmg').innerText = `${state.stats.maxSessionDamage || 0} HP`;
        document.getElementById('j-sessions').innerText = state.sessions.length;
        document.getElementById('j-xp').innerText = state.player.totalXpEarned || 0;

        const allItems = [...state.inventory, ...Object.values(state.equipment).filter(Boolean)];
        const legCount = allItems.filter(id => DATABASE.items[id] && DATABASE.items[id].rarity === 'legendary').length;
        document.getElementById('j-legendary-count').innerText = legCount;

        const avg = state.sessions.length ? Math.round(totalMins / state.sessions.length) : 0;
        document.getElementById('j-avg-time').innerText = `${avg} min`;
    },

    renderEquipment() {
        const state = Storage.get();

        let rank = DATABASE.ranks[0];
        DATABASE.ranks.forEach(r => {
            if (state.player.level >= r.level) rank = r;
        });

        document.getElementById('avatar-portrait-img').src = rank.icon;
        document.getElementById('avatar-rank-pill').innerText = rank.title;

        Object.entries(DATABASE.slots).forEach(([slotKey, slotMeta]) => {
            const el = document.getElementById(`slot-${slotKey}`);
            if (!el) return;

            const itemId = state.equipment[slotKey];
            const item = itemId ? DATABASE.items[itemId] : null;

            if (item) {
                const rarity = DATABASE.rarities[item.rarity];
                el.className = `slot-frame ${item.rarity}`;
                el.innerHTML = `
                    <img src="${item.icon}" alt="${item.name}">
                    <div style="flex:1;">
                        <span style="font-size:0.68rem; color:var(--text-muted); text-transform:uppercase;">${slotMeta.name}</span>
                        <div style="color:${rarity.color}; font-weight:bold; font-size:0.82rem;">${item.name}</div>
                    </div>
                `;
            } else {
                el.className = 'slot-frame empty';
                el.innerHTML = `
                    <i class="fa-solid ${slotMeta.icon}" style="font-size:1.4rem; color:#444; width:42px; text-align:center;"></i>
                    <div>
                        <span style="font-size:0.68rem; color:var(--text-muted); text-transform:uppercase;">${slotMeta.name}</span>
                        <div style="color:#7c879d; font-size:0.82rem;">Vazio</div>
                    </div>
                `;
            }
        });
    },

    clickSlot(slotKey) {
        const state = Storage.get();
        const itemId = state.equipment[slotKey];
        if (itemId) {
            this.inspectItem(itemId, true, slotKey);
        } else {
            alert(`O slot ${DATABASE.slots[slotKey].name} está vazio. Abra a subaba Inventário para equipar itens.`);
        }
    },

    filterBag(category, btn) {
        this.currentCategory = category;
        document.querySelectorAll('.cat-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.renderInventory();
    },

    renderInventory() {
        const state = Storage.get();
        const bagContainer = document.getElementById('inventory-bag-full');
        bagContainer.innerHTML = '';

        let itemsToShow = state.inventory.map(id => DATABASE.items[id]).filter(Boolean);

        if (this.currentCategory !== 'all') {
            if (this.currentCategory === 'ring') {
                itemsToShow = itemsToShow.filter(i => i.slot === 'ring1' || i.slot === 'ring2');
            } else {
                itemsToShow = itemsToShow.filter(i => i.slot === this.currentCategory);
            }
        }

        if (itemsToShow.length === 0) {
            bagContainer.innerHTML = '<p style="color:#7c879d; font-size:0.85rem; grid-column:1/-1;">Nenhum item nesta categoria.</p>';
            return;
        }

        itemsToShow.forEach(item => {
            const rarity = DATABASE.rarities[item.rarity];
            const card = document.createElement('div');
            card.className = `bag-card-item ${item.rarity}`;
            card.innerHTML = `
                <img src="${item.icon}" alt="${item.name}">
                <strong style="color:${rarity.color}; font-size:0.82rem;">${item.name}</strong>
                <span style="font-size:0.7rem; color:var(--text-muted); margin-top:2px;">${DATABASE.slots[item.slot].name}</span>
            `;
            card.onclick = () => this.inspectItem(item.id, false);
            bagContainer.appendChild(card);
        });
    },

    inspectItem(itemId, isEquipped, slotKey = null) {
        const item = DATABASE.items[itemId];
        if (!item) return;

        const state = Storage.get();
        const rarity = DATABASE.rarities[item.rarity];
        const modal = document.getElementById('item-inspect-modal');

        document.getElementById('inspect-item-name').innerText = item.name;
        document.getElementById('inspect-item-name').style.color = rarity.color;
        document.getElementById('inspect-item-type').innerText = `[${rarity.name.toUpperCase()}] • ${DATABASE.slots[item.slot].name}`;
        document.getElementById('inspect-item-type').style.color = rarity.color;
        document.getElementById('inspect-item-img').src = item.icon;
        document.getElementById('inspect-item-desc').innerText = item.effect;
        document.getElementById('inspect-item-origin').innerText = item.origin || 'Origem desconhecida.';

        const targetSlot = slotKey || (item.slot === 'ring2' ? 'ring1' : item.slot);
        const currentEquippedId = state.equipment[targetSlot];
        const currentEquippedItem = currentEquippedId ? DATABASE.items[currentEquippedId] : null;

        const compCurName = document.getElementById('comp-current-name');
        const compCurStats = document.getElementById('comp-current-stats');
        const compNewName = document.getElementById('comp-new-name');
        const compNewStats = document.getElementById('comp-new-stats');
        const compDiff = document.getElementById('comp-diff-summary');

        compCurStats.innerHTML = '';
        compNewStats.innerHTML = '';
        compDiff.innerHTML = '';

        compNewName.innerText = item.name;
        compNewName.style.color = rarity.color;
        Object.entries(item.stats).forEach(([k, v]) => {
            compNewStats.innerHTML += `<div>+${v} ${k.toUpperCase()}</div>`;
        });

        if (currentEquippedItem) {
            const curRarity = DATABASE.rarities[currentEquippedItem.rarity];
            compCurName.innerText = currentEquippedItem.name;
            compCurName.style.color = curRarity.color;

            Object.entries(currentEquippedItem.stats).forEach(([k, v]) => {
                compCurStats.innerHTML += `<div>+${v} ${k.toUpperCase()}</div>`;
            });

            let diffHtml = '<strong>Diferença: </strong>';
            const allKeys = new Set([...Object.keys(item.stats), ...Object.keys(currentEquippedItem.stats)]);
            allKeys.forEach(k => {
                const diff = (item.stats[k] || 0) - (currentEquippedItem.stats[k] || 0);
                if (diff > 0) diffHtml += `<span style="color:#2ecc71; margin-right:8px;">+${diff} ${k.toUpperCase()}</span>`;
                else if (diff < 0) diffHtml += `<span style="color:#ff4757; margin-right:8px;">${diff} ${k.toUpperCase()}</span>`;
            });
            compDiff.innerHTML = diffHtml;
        } else {
            compCurName.innerText = 'Vazio';
            compCurName.style.color = '#7c879d';
            compCurStats.innerHTML = '<div>Sem atributos</div>';
            compDiff.innerHTML = '<strong>Ganho Total Líquido</strong>';
        }

        const actionsBox = document.getElementById('inspect-actions-box');
        actionsBox.innerHTML = '';

        if (isEquipped) {
            const btnUnequip = document.createElement('button');
            btnUnequip.className = 'btn-secondary';
            btnUnequip.innerText = 'Desequipar';
            btnUnequip.onclick = () => {
                Storage.unequipItem(slotKey);
                modal.classList.remove('active');
                CharacterHub.render();
                UI.render();
            };
            actionsBox.appendChild(btnUnequip);
        } else {
            const btnEquip = document.createElement('button');
            btnEquip.className = 'btn-primary';
            btnEquip.innerText = 'Equipar Item';
            btnEquip.onclick = () => {
                Storage.equipItem(item.id);
                modal.classList.remove('active');
                CharacterHub.render();
                UI.render();
            };
            actionsBox.appendChild(btnEquip);

            const btnDiscard = document.createElement('button');
            btnDiscard.className = 'btn-danger';
            btnDiscard.innerText = 'Descartar';
            btnDiscard.onclick = () => {
                if (confirm('Deseja descartar este item permanentemente?')) {
                    Storage.discardItem(item.id);
                    modal.classList.remove('active');
                    CharacterHub.renderInventory();
                }
            };
            actionsBox.appendChild(btnDiscard);
        }

        modal.classList.add('active');
    },

    closeInspectModal() {
        document.getElementById('item-inspect-modal').classList.remove('active');
    },

    // 4. COLEÇÃO & TROFÉUS (BLINDADO CONTRA CAMPOS NULOS)
    renderCollection() {
        const state = Storage.get();

        const totalPool = DATABASE.bossPool.common.length + DATABASE.bossPool.rare.length + DATABASE.bossPool.epic.length + DATABASE.bossPool.legendary.length;
        const discoveredBossCount = Object.values(state.bestiary || {}).filter(b => b.defeatedCount > 0).length;
        document.getElementById('col-boss-ratio').innerText = `${discoveredBossCount} / ${totalPool}`;

        const allDiscoveredItems = new Set([...state.inventory, ...Object.values(state.equipment).filter(Boolean)]);
        document.getElementById('col-item-ratio').innerText = `${allDiscoveredItems.size} / ${Object.keys(DATABASE.items).length}`;

        CombatEngine.checkTrophies(state);
        document.getElementById('col-trophy-ratio').innerText = `${(state.unlockedTrophies || []).length} / ${DATABASE.trophies.length}`;

        // Bestiário
        const bestiaryGrid = document.getElementById('bestiary-grid-collection');
        bestiaryGrid.innerHTML = '';

        Object.values(state.bestiary || {}).forEach(boss => {
            const card = document.createElement('div');
            const rarity = DATABASE.rarities[boss.rarity] || DATABASE.rarities.common;
            const isDiscovered = (boss.defeatedCount || 0) > 0;
            card.className = `bestiary-card-item ${isDiscovered ? 'discovered' : 'locked'}`;
            card.style.borderColor = isDiscovered ? rarity.color : '#232a3d';

            const traitsList = boss.traits || [];

            if (isDiscovered) {
                card.innerHTML = `
                    <img src="${boss.icon || 'https://api.iconify.design/game-icons/grim-reaper.svg'}" alt="${boss.name}">
                    <div style="flex:1;">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <h4 style="color:#fff; font-family:'Cinzel'; font-size:0.9rem;">${boss.name}</h4>
                            <span style="font-size:0.7rem; color:${rarity.color}; font-weight:bold;">[${rarity.name.toUpperCase()}]</span>
                        </div>
                        <p style="font-size:0.75rem; color:#7c879d;">Vitórias acumuladas: <strong style="color:var(--gold);">${boss.defeatedCount}x</strong></p>
                        <div class="bestiary-loot-tags">
                            ${traitsList.map(tKey => {
                                const trait = DATABASE.traits[tKey];
                                return trait ? `<span class="loot-tag" style="color:#ff7675;">${trait.name}</span>` : '';
                            }).join('')}
                        </div>
                    </div>
                `;
            } else {
                card.innerHTML = `
                    <div class="fog-icon"><i class="fa-solid fa-question"></i></div>
                    <div style="flex:1;">
                        <h4 style="color:#7c879d; font-family:'Cinzel';">??? ??? ???</h4>
                        <p style="font-size:0.75rem; color:#555;">Guardião Desconhecido</p>
                    </div>
                `;
            }
            bestiaryGrid.appendChild(card);
        });

        // Troféus
        const trophiesGrid = document.getElementById('trophies-grid-collection');
        trophiesGrid.innerHTML = '';

        DATABASE.trophies.forEach(trophy => {
            const isUnlocked = (state.unlockedTrophies || []).includes(trophy.id);
            const card = document.createElement('div');
            card.className = `trophy-card ${isUnlocked ? 'unlocked' : 'locked'}`;
            card.innerHTML = `
                <i class="fa-solid ${trophy.icon} trophy-icon"></i>
                <div>
                    <h4 style="color:#fff; font-family:'Cinzel'; font-size:0.9rem;">${trophy.name}</h4>
                    <p style="font-size:0.75rem; color:var(--text-muted);">${trophy.desc}</p>
                    <span style="font-size:0.7rem; color:${isUnlocked ? '#2ecc71' : '#555'}; font-weight:bold;">
                        ${isUnlocked ? '🏆 CONQUISTADO' : '🔒 BLOQUEADO'}
                    </span>
                </div>
            `;
            trophiesGrid.appendChild(card);
        });
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
        document.getElementById('p-elo').innerText = rank.elo;
        document.getElementById('p-lvl').innerText = state.player.level;

        const currentLvl = state.player.level || 1;
        const currentXp = state.player.currentXp || 0;
        const neededXp = CombatEngine.getXpRequiredForLevel(currentLvl);

        const xpPercent = Math.min(100, Math.round((currentXp / neededXp) * 100));
        document.getElementById('xp-text').innerText = `${currentXp} / ${neededXp} XP`;
        document.getElementById('xp-bar').style.width = `${xpPercent}%`;

        // Boss
        const bossRarity = DATABASE.rarities[state.boss.rarity] || DATABASE.rarities.common;
        document.getElementById('boss-name').innerText = state.boss.name;
        document.getElementById('boss-img').src = state.boss.icon;
        document.getElementById('boss-img').style.filter = `drop-shadow(0 0 20px ${bossRarity.color})`;
        document.getElementById('boss-main-card').style.borderColor = bossRarity.color;

        const rarityBadge = document.getElementById('boss-rarity-label');
        rarityBadge.innerText = bossRarity.name.toUpperCase();
        rarityBadge.style.color = bossRarity.color;

        document.getElementById('boss-level-label').innerText = `Lv. ${state.boss.level}`;
        document.getElementById('boss-hp-cur').innerText = Math.round(state.boss.currentHp);
        document.getElementById('boss-hp-max').innerText = state.boss.maxHp;
        document.getElementById('boss-hp-fill').style.width = `${(state.boss.currentHp / state.boss.maxHp) * 100}%`;

        const traitsContainer = document.getElementById('boss-traits-list');
        traitsContainer.innerHTML = '';
        (state.boss.traits || []).forEach(tKey => {
            const trait = DATABASE.traits[tKey];
            if (trait) {
                traitsContainer.innerHTML += `
                    <div class="trait-pill" title="${trait.desc}">
                        <i class="fa-solid ${trait.icon}"></i>
                        <strong>${trait.name}:</strong> ${trait.desc}
                    </div>
                `;
            }
        });

        // Resumo de Hoje
        const todayStr = new Date().toISOString().split('T')[0];
        const todaySessions = state.sessions.filter(s => s.date === todayStr);

        let todayMinutes = 0, todayDmg = 0, todayXp = 0;
        todaySessions.forEach(s => {
            todayMinutes += s.durationMinutes;
            todayDmg += s.damage;
            todayXp += s.xp;
        });

        document.getElementById('dash-today-time').innerText = `${todayMinutes} min`;
        document.getElementById('dash-today-dmg').innerText = `${todayDmg} HP`;
        document.getElementById('dash-today-xp').innerText = todayXp;
        document.getElementById('dash-today-count').innerText = todaySessions.length;

        // Últimas Sessões
        const recentContainer = document.getElementById('recent-sessions-container');
        recentContainer.innerHTML = '';
        state.sessions.slice(0, 5).forEach(s => {
            const el = document.createElement('div');
            el.className = 'recent-item';
            el.innerHTML = `
                <div><strong>${s.subject}</strong><br><span style="color:#7c879d;">vs ${s.bossName || 'Boss'} • ${s.time}</span></div>
                <div style="text-align:right;"><span style="color:#ff4757; font-weight:bold;">-${s.damage} HP</span><br><span style="color:#3498db;">+${s.xp} XP</span></div>
            `;
            recentContainer.appendChild(el);
        });

        CharacterHub.render();
    },

    showVictoryLootModal(bossMeta, item) {
        const modal = document.getElementById('victory-loot-modal');
        const rarity = DATABASE.rarities[item.rarity];

        document.getElementById('loot-boss-name').innerText = bossMeta.name.toUpperCase();
        document.getElementById('loot-item-name').innerText = item.name;
        document.getElementById('loot-item-name').style.color = rarity.color;
        document.getElementById('loot-item-rarity').innerText = `[${rarity.name.toUpperCase()}] • ${DATABASE.slots[item.slot].name}`;
        document.getElementById('loot-item-rarity').style.color = rarity.color;
        document.getElementById('loot-item-img').src = item.icon;
        document.getElementById('loot-item-effect').innerText = item.effect;
        document.getElementById('loot-item-origin').innerText = item.origin || `Obtido ao derrotar ${bossMeta.name}.`;

        const statsWrap = document.getElementById('loot-item-stats');
        statsWrap.innerHTML = '';
        Object.entries(item.stats).forEach(([k, v]) => {
            statsWrap.innerHTML += `<span class="stat-pill">+${v} ${k.toUpperCase()}</span>`;
        });

        const btnEquip = document.getElementById('btn-equip-loot');
        btnEquip.onclick = () => {
            Storage.equipItem(item.id);
            modal.classList.remove('active');
            UI.render();
        };

        modal.classList.add('active');
    },

    closeVictoryLootModal() {
        document.getElementById('victory-loot-modal').classList.remove('active');
        UI.render();
    },

    showLevelUpModal(oldLvl, newLvl) {
        let rank = DATABASE.ranks[0];
        DATABASE.ranks.forEach(r => {
            if (newLvl >= r.level) rank = r;
        });

        document.getElementById('levelup-badge-text').innerText = `NÍVEL ${oldLvl} → NÍVEL ${newLvl}`;
        document.getElementById('levelup-rank-text').innerText = `Título Atual: ${rank.title} (${rank.elo})`;
        document.getElementById('levelup-modal').classList.add('active');
    },

    closeLevelUpModal() {
        document.getElementById('levelup-modal').classList.remove('active');
        this.render();
    },

    triggerFloatingDamage(amount, isCrit) {
        const anchor = document.getElementById('damage-anchor');
        const pop = document.createElement('div');
        pop.className = `floating-damage ${isCrit ? 'crit' : ''}`;
        pop.innerText = `${isCrit ? 'CRÍTICO! ' : ''}-${amount} HP`;
        anchor.appendChild(pop);
        setTimeout(() => pop.remove(), 800);
    },

    openDayModal(dateStr) {
        const state = Storage.get();
        const daySessions = state.sessions.filter(s => s.date === dateStr);
        const dateObj = new Date(dateStr + 'T00:00:00');
        document.getElementById('modal-day-title').innerText = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

        let totalTime = 0, totalDmg = 0, totalXp = 0;
        const container = document.getElementById('modal-sessions-container');
        container.innerHTML = '';

        if (daySessions.length === 0) {
            container.innerHTML = '<p style="color:#7c879d; font-size:0.85rem;">Nenhuma batalha registrada nesta data.</p>';
        } else {
            daySessions.forEach(s => {
                totalTime += s.durationMinutes;
                totalDmg += s.damage;
                totalXp += s.xp;

                const row = document.createElement('div');
                row.className = 'session-item';
                row.innerHTML = `
                    <div><strong>${s.subject}</strong> (${s.durationMinutes}m)<br><span style="color:#7c879d;">vs ${s.bossName || 'Boss'} • ${s.time} • ${s.methodName}</span></div>
                    <div style="text-align:right; color:#ff4757; font-weight:bold;">-${s.damage} HP</div>
                `;
                container.appendChild(row);
            });
        }

        document.getElementById('modal-day-time').innerText = `${totalTime} min`;
        document.getElementById('modal-day-dmg').innerText = `${totalDmg} HP`;
        document.getElementById('modal-day-xp').innerText = totalXp;
        document.getElementById('modal-day-sessions').innerText = daySessions.length;

        document.getElementById('day-modal').classList.add('active');
    },

    closeDayModal() {
        document.getElementById('day-modal').classList.remove('active');
    }
};

const CalendarView = {
    currentYear: 2026,
    currentMonth: 7,

    prevMonth() {
        this.currentMonth--;
        if (this.currentMonth < 0) { this.currentMonth = 11; this.currentYear--; }
        this.render();
    },
    nextMonth() {
        this.currentMonth++;
        if (this.currentMonth > 11) { this.currentMonth = 0; this.currentYear++; }
        this.render();
    },
    render() {
        const state = Storage.get();
        const grid = document.getElementById('cal-grid');
        grid.innerHTML = '';

        const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        document.getElementById('cal-month-title').innerText = `${monthNames[this.currentMonth]} de ${this.currentYear}`;

        ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].forEach(d => {
            const el = document.createElement('div');
            el.className = 'cal-day-label';
            el.innerText = d;
            grid.appendChild(el);
        });

        const firstDay = new Date(this.currentYear, this.currentMonth, 1).getDay();
        const totalDays = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();

        for (let i = 0; i < firstDay; i++) grid.appendChild(document.createElement('div'));

        const todayStr = new Date().toISOString().split('T')[0];

        for (let d = 1; d <= totalDays; d++) {
            const dateStr = `${this.currentYear}-${String(this.currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const daySessions = state.sessions.filter(s => s.date === dateStr);

            let dayMinutes = 0, dayDmg = 0;
            daySessions.forEach(s => {
                dayMinutes += s.durationMinutes;
                dayDmg += s.damage;
            });

            const cell = document.createElement('div');
            cell.className = 'cal-cell';
            if (dateStr === todayStr) cell.classList.add('today');

            if (dayMinutes > 0 && dayMinutes <= 30) cell.classList.add('heat-1');
            else if (dayMinutes > 30 && dayMinutes <= 75) cell.classList.add('heat-2');
            else if (dayMinutes > 75 && dayMinutes <= 150) cell.classList.add('heat-3');
            else if (dayMinutes > 150) cell.classList.add('heat-4');

            cell.innerHTML = `<span>${d}</span>${dayDmg > 0 ? `<span class="cal-dmg">-${dayDmg}</span>` : ''}`;
            cell.onclick = () => UI.openDayModal(dateStr);
            grid.appendChild(cell);
        }
    }
};

const HistoryView = {
    render() {
        const state = Storage.get();
        const query = document.getElementById('history-filter-text').value.toLowerCase();
        const methodFilter = document.getElementById('history-filter-method').value;

        const container = document.getElementById('history-list-container');
        container.innerHTML = '';

        const filtered = state.sessions.filter(s => {
            const matchQuery = s.subject.toLowerCase().includes(query);
            const matchMethod = (methodFilter === 'all') || (s.methodKey === methodFilter);
            return matchQuery && matchMethod;
        });

        if (filtered.length === 0) {
            container.innerHTML = '<p style="color:#7c879d; font-size:0.9rem;">Nenhuma sessão encontrada.</p>';
            return;
        }

        filtered.forEach(s => {
            const el = document.createElement('div');
            el.className = 'session-item';
            el.innerHTML = `
                <div>
                    <strong>${s.subject}</strong> <span style="color:#7c879d;">(${s.durationMinutes} min)</span>
                    <br><span style="font-size:0.75rem; color:#7c879d;">vs ${s.bossName || 'Boss'} • ${s.date} às ${s.time} • ${s.methodName}</span>
                </div>
                <div style="text-align:right;">
                    <span style="color:#ff4757; font-weight:bold;">-${s.damage} HP</span>
                    <br><span style="color:#3498db; font-size:0.75rem;">+${s.xp} XP</span>
                </div>
            `;
            container.appendChild(el);
        });
    }
};

const StatsView = {
    render() {
        const state = Storage.get();
        let totalMinutes = 0, totalDmg = 0, totalXp = 0;
        const subjectMap = {};
        const datesSet = new Set();

        state.sessions.forEach(s => {
            totalMinutes += s.durationMinutes;
            totalDmg += s.damage;
            totalXp += s.xp;
            datesSet.add(s.date);

            const subj = s.subject.trim() || 'Estudo Geral';
            if (!subjectMap[subj]) subjectMap[subj] = { minutes: 0, dmg: 0, sessions: 0 };
            subjectMap[subj].minutes += s.durationMinutes;
            subjectMap[subj].dmg += s.damage;
            subjectMap[subj].sessions++;
        });

        const totalHours = Math.floor(totalMinutes / 60);
        const remMinutes = totalMinutes % 60;
        document.getElementById('stat-total-time').innerText = `${totalHours}h ${remMinutes}m`;
        document.getElementById('stat-total-dmg').innerText = `${totalDmg} HP`;
        document.getElementById('stat-total-xp').innerText = totalXp;
        document.getElementById('stat-total-sessions').innerText = state.sessions.length;
        document.getElementById('stat-bosses-killed').innerText = state.boss.bossesDefeated || 0;

        const uniqueDays = Math.max(1, datesSet.size);
        document.getElementById('stat-daily-avg').innerText = `${Math.round(totalMinutes / uniqueDays)} min/dia`;

        const breakdownContainer = document.getElementById('subject-breakdown-container');
        breakdownContainer.innerHTML = '';
        Object.keys(subjectMap).sort((a,b) => subjectMap[b].minutes - subjectMap[a].minutes).forEach(key => {
            const data = subjectMap[key];
            const row = document.createElement('div');
            row.className = 'subject-row';
            row.innerHTML = `
                <div><strong>${key}</strong> <span style="color:#7c879d;">(${data.sessions} sessões)</span></div>
                <div style="text-align:right;"><strong>${data.minutes} min</strong> • <span style="color:#ff4757;">-${data.dmg} HP</span></div>
            `;
            breakdownContainer.appendChild(row);
        });
    }
};

const SettingsView = {
    changeBossCycle(hpValue) {
        const state = Storage.get();
        state.boss.preset = parseInt(hpValue);
        state.boss.maxHp = parseInt(hpValue);
        state.boss.currentHp = Math.min(state.boss.currentHp, state.boss.maxHp);
        Storage.save(state);
        UI.render();
        alert(`Configuração atualizada! Ciclo base ajustado para ${hpValue} HP.`);
    }
};

window.onload = () => {
    UI.render();
};