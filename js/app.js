/* =========================================================================
 * App — inicialização: carrega o save, processa os dias passados, retoma
 * batalhas em andamento e liga os ouvintes globais.
 * ========================================================================= */
(function (MR) {
  'use strict';
    const U = MR.UI, E = MR.Engine, St = MR.Store;

  function announce(events) {
    for (const ev of events) {
      if (ev.type === 'regen') U.toast(`<b>${U.esc(ev.boss)}</b> é Insaciável e regenerou <b>${U.fmt(ev.amount)} HP</b> nos dias sem estudo.`, { icon: 'drop', color: 'var(--crimson)', ms: 7000 });
      if (ev.type === 'freeze') U.toast(`❄ Uma proteção salvou sua sequência no dia ${U.fmtDate(ev.day)}.`, { icon: 'checked-shield', color: '#7dd3fc', ms: 7000 });
      if (ev.type === 'streak_lost') U.toast(`Sua sequência de <b>${ev.count} dia(s)</b> foi quebrada. Recomece hoje!`, { icon: 'flame', color: 'var(--flame)', ms: 7000 });
    }
  }

  function dailyCheck() {
    const s = St.get();
    if (s.lastRollover !== St.dayKey() || !s.quests || s.quests.day !== St.dayKey()) {
      const ev = E.rollover(s); St.save(); announce(ev);
    }
  }

  /** Primeira visita (ou depois de sair da conta sem save de visitante). */
  function onboarding() {
    const s = St.get();
    if (s.onboarded || St.owner()) return;
    MR.Account.welcome();
  }

  function boot() {
    // Abre direto no save da conta lembrada neste aparelho (sem esperar a rede).
    const uid = MR.Cloud.peekUserId();
    St.use(uid);
    const s = St.load();
    if (uid) s.onboarded = true;
    E.ensureBoss(s);
    const events = E.rollover(s);
    const stale = s.active ? E.recoverStale(s) : false;
    const newTrophies = E.checkTrophies(s);
    St.save();
    document.body.classList.toggle('reduce-motion', !!s.settings.reducedMotion);

    MR.FX.init();
    MR.Cloud.init(); // antes do 1º render: telas como o Ranking já usam a nuvem
    St.subscribe(() => U.render());
    const hash = location.hash.replace('#', '');
    U.current = MR.Views[hash] ? hash : 'battle';
    U.render();

    if (s.migratedFrom && !s.migrationAnnounced) {
      s.migrationAnnounced = true; St.save();
      U.toast('Seu progresso do MedRPG antigo foi importado para a nova versão!', { icon: 'chest', ms: 8000 });
    }
    announce(events);
    for (const id of newTrophies) { const t = MR.TROPHIES.find((x) => x.id === id); U.toast(`Troféu conquistado: <b>${t.name}</b>`, { icon: t.icon }); }
    if (s.active) {
      MR.Focus.open();
      if (stale) U.toast('A batalha ficou sem registro enquanto o navegador esteve fechado e foi <b>pausada</b> no último momento salvo. Retome quando quiser.', { icon: 'pause', uiIcon: true, ms: 9000 });
    }
    // Voltando do login com Google, a sessão chega em instantes: não mostra a tela de boas-vindas.
    if (!MR.Cloud.returningFromOAuth()) onboarding();

    setInterval(dailyCheck, 60000);
    addEventListener('hashchange', () => { const h = location.hash.replace('#', ''); if (h !== U.current && MR.Views[h]) U.go(h); });
    addEventListener('pointerdown', () => MR.Audio.unlock(), { once: true });
    addEventListener('storage', (e) => {
      if (e.key !== St.key()) return;
      // Outra aba alterou o save: recarrega para não sobrescrever o progresso dela.
      St.load(); U.closeAllModals(); U.render();
      if (St.get().active) MR.Focus.open(); else MR.Focus.close(true);
    });
    if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
  }

  MR.App = { boot, onboarding, announce };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})(window.MR = window.MR || {});
