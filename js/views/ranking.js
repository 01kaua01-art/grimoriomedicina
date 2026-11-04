/* =========================================================================
 * Tela: Ranking — disputa entre jogadores com conta.
 * Métrica principal: minutos líquidos estudados na semana (seg → dom).
 * É justa para quem começou agora, zera toda semana e premia constância,
 * não quem "farmou" há meses.
 * ========================================================================= */
(function (MR) {
  'use strict';
  const { gi, ui } = MR;
  const U = MR.UI;
  const C = () => MR.Cloud;

  const METRICS = {
    week:   { name: 'Semana',    icon: 'sands-of-time',       desc: 'Minutos líquidos estudados nesta semana (segunda a domingo). Zera toda segunda.', fmt: (v) => U.fmtMin(v) },
    total:  { name: 'Total',     icon: 'hourglass',           desc: 'Tempo líquido total de estudo desde o início.', fmt: (v) => U.fmtMin(v) },
    streak: { name: 'Sequência', icon: 'flame',               desc: 'Dias seguidos estudando (só sequências ativas).', fmt: (v) => `${v} dia${v === 1 ? '' : 's'}` },
    bosses: { name: 'Bosses',    icon: 'skull-crossed-bones', desc: 'Guardiões derrotados.', fmt: (v) => U.fmt(v) },
    level:  { name: 'Nível',     icon: 'laurel-crown',        desc: 'Nível do herói.', fmt: (v) => `Nv. ${v}` },
  };
  const state = { metric: 'week', cache: {}, loading: false, error: null };
  const STALE_MS = 30000;

  async function load(force = false) {
    const key = state.metric;
    const hit = state.cache[key];
    if (state.loading || (!force && hit && Date.now() - hit.at < STALE_MS)) return;
    if (!force && state.error) return; // não fica tentando em loop; o botão Atualizar força
    state.loading = true; state.error = null;
    try {
      const r = await C().fetchLeaderboard(key);
      state.cache[key] = { ...r, at: Date.now() };
    } catch (e) { state.error = e.message; }
    state.loading = false;
    if (U.current === 'ranking') U.render();
  }

  function row(r, i, col, meId) {
    const pos = r.position || i + 1;
    const medal = pos <= 3 ? `<span class="medal m${pos}">${pos}</span>` : `<span class="pos">${pos}</span>`;
    const rank = MR.RANKS.find((x) => x.title === r.rank_title) || MR.Engine.rankFor(r.level);
    return `<div class="rank-row ${r.user_id === meId ? 'me' : ''} ${pos <= 3 ? 'top' : ''}">
      ${medal}
      <div class="rank-av" style="--rank:${rank.color}">${gi(MR.hasGi(r.rank_icon) ? r.rank_icon : rank.icon)}</div>
      <div style="min-width:0"><div class="rank-name">${U.esc(r.display_name)}${r.user_id === meId ? ' <span class="chip" style="padding:1px 8px">você</span>' : ''}</div>
        <div class="rank-sub">${U.esc(r.rank_title || rank.title)} · Nv. ${r.level}${r.streak ? ` · <span style="color:var(--flame)">${gi('flame')} ${r.streak}</span>` : ''}</div></div>
      <div class="rank-val num">${METRICS[state.metric].fmt(r[col])}</div>
    </div>`;
  }

  function weekLabel() {
    const mon = C().weekKey();
    const sun = MR.Store.addDays(mon, 6);
    return `${U.fmtDate(mon)} – ${U.fmtDate(sun)}`;
  }

  MR.Views.ranking = {
    title: 'Ranking', icon: 'laurel-crown',
    render(s) {
      const c = C();
      const tabs = `<div class="filters">${Object.entries(METRICS).map(([k, m]) => `<button class="chip ${state.metric === k ? 'on' : ''}" data-act="rank-metric" data-v="${k}">${gi(m.icon)} ${m.name}</button>`).join('')}
        <span style="flex:1"></span><button class="btn sm ghost" data-act="rank-refresh">${ui('refresh-cw', state.loading ? 'spin' : '')} Atualizar</button></div>`;
      const head = `<div class="page-head"><div><h1>Ranking</h1><p>${METRICS[state.metric].desc}${state.metric === 'week' ? ` <b style="color:var(--gold)">${weekLabel()}</b>` : ''}</p></div></div>`;
      if (!c.enabled) return head + `<div class="card empty">${ui('cloud-off')} O ranking precisa da nuvem configurada.</div>`;

      const guest = !c.user ? `<div class="banner" style="--bc:var(--gold);margin:0 0 16px">${gi('laurel-crown')}<div class="grow"><b>Você está como visitante</b><span>Crie uma conta para aparecer no ranking. Seu progresso atual vai junto.</span></div>
        <button class="btn primary sm" data-act="acc-signup">Criar conta</button><button class="btn sm" data-act="acc-login">Entrar</button></div>` : '';

      const hit = state.cache[state.metric];
      let body;
      if (state.error && !hit) body = `<div class="empty">${ui('cloud-off')}<br>Não foi possível carregar o ranking.<br><span style="font-size:12px">${U.esc(state.error)}</span></div>`;
      else if (!hit) body = `<div class="empty">${ui('loader-circle', 'spin')} Carregando…</div>`;
      else if (!hit.rows.length) body = `<div class="empty">${gi('laurel-crown')}Ninguém pontuou aqui ainda${state.metric === 'week' ? ' nesta semana' : ''}.<br>Seja o primeiro: inicie uma batalha!</div>`;
      else {
        const meId = c.user && c.user.id;
        body = hit.rows.map((r, i) => row(r, i, hit.col, meId)).join('');
        if (hit.me) body += `<div class="rank-gap">⋯</div>` + row({ ...hit.me, rank_title: MR.Engine.rankFor(hit.me.level).title }, 0, hit.col, meId);
        if (c.user && !hit.rows.some((r) => r.user_id === meId) && !hit.me) body += `<div class="muted" style="text-align:center;font-size:13px;margin-top:12px">Você ainda não pontuou aqui${state.metric === 'week' ? ' nesta semana' : ''}.</div>`;
      }
      const mine = c.user ? C().leaderboardRow(s, c.user.id) : null;
      const side = mine ? `<section class="card"><h2 class="card-title">${gi('swords-emblem')} Seus números</h2>
        <div class="mini-stats">
          <div class="mini"><span>Semana</span><b>${U.fmtMin(mine.week_minutes)}</b></div>
          <div class="mini"><span>Total</span><b>${U.fmtMin(mine.total_minutes)}</b></div>
          <div class="mini"><span>Sequência</span><b>${mine.streak}d</b></div>
          <div class="mini"><span>Bosses</span><b>${mine.bosses}</b></div>
        </div>
        <p class="muted" style="font-size:12.5px;margin:12px 0 0">Aparece como <b>${U.esc(mine.display_name)}</b>. Mude o nome na ficha do Herói. Os números sobem alguns segundos depois de cada sessão.</p></section>` : '';
      return head + guest + tabs + `<div class="rank-layout"><section class="card rank-list">${body}</section>${side}</div>`;
    },
    after() { if (C().enabled) load(); },
  };

  U.on('rank-metric', (el) => { state.metric = el.dataset.v; state.error = null; U.render(); });
  U.on('rank-refresh', () => load(true));
})(window.MR = window.MR || {});
