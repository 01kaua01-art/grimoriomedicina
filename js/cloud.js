/* =========================================================================
 * Cloud — contas (Supabase Auth), sincronização do save e ranking.
 *
 * Modelo:
 *  - Visitante: joga só com o save local (slot sem dono).
 *  - Com conta: o save fica num slot local próprio + tabela `saves` na nuvem.
 *    O mais recente (savedAt) vence. Ao entrar pela 1ª vez, o progresso de
 *    visitante pode ser levado para a conta.
 *  - O jogo NUNCA depende da nuvem para funcionar: sem rede, tudo segue local.
 * ========================================================================= */
(function (MR) {
  'use strict';
  const cfg = MR.CONFIG || {};
  const ENABLED = !!(window.supabase && cfg.supabaseUrl && cfg.supabaseAnonKey);
  const REF = ENABLED ? new URL(cfg.supabaseUrl).hostname.split('.')[0] : 'off';
  const AUTH_KEY = `sb-${REF}-auth-token`;
  const St = () => MR.Store, E = () => MR.Engine, U = () => MR.UI;

  let client = null;
  let pushTimer = null;
  let reconciling = false;
  let lbWarned = false;

  const redirectUrl = () => location.origin + location.pathname;

  function weekKey(now = new Date()) {
    const today = St().dayKey(now);
    return St().addDays(today, -((now.getDay() + 6) % 7)); // segunda-feira
  }

  function nameFrom(user) {
    const m = (user && user.user_metadata) || {};
    const raw = m.full_name || m.name || (user && user.email ? user.email.split('@')[0] : '') || 'Acadêmico';
    return String(raw).trim().slice(0, 24) || 'Acadêmico';
  }

  function leaderboardRow(s, uid) {
    const total = s.sessions.reduce((a, x) => a + (x.minutes || 0), 0);
    const wk = weekKey();
    const week = s.sessions.filter((x) => x.date >= wk).reduce((a, x) => a + (x.minutes || 0), 0);
    const rank = E().rankFor(s.player.level);
    return {
      user_id: uid,
      display_name: (s.player.name || 'Acadêmico').trim().slice(0, 24) || 'Acadêmico',
      level: s.player.level, rank_title: rank.title, rank_icon: rank.icon,
      total_minutes: Math.min(525600, total), week_key: wk, week_minutes: Math.min(10080, week, total),
      streak: E().streakNow(s), best_streak: s.streak.best, bosses: s.stats.bossesDefeated,
    };
  }

  function setStatus(st) { Cloud.status = st; if (MR.UI && St().get()) U().renderHud(St().get()); }

  /** Prepara o estado recém-carregado (dias passados, sessão parada, troféus). */
  function settle(s) {
    E().ensureBoss(s);
    const ev = E().rollover(s);
    if (s.active) E().recoverStale(s);
    E().checkTrophies(s);
    return ev;
  }

  function syncFocus() {
    const s = St().get();
    if (s.active) MR.Focus.open(); else if (MR.Focus.isOpen()) MR.Focus.close(true);
  }

  /* ------------------------------------------------------------------ */
  /* Reconciliação ao entrar                                             */
  /* ------------------------------------------------------------------ */
  async function reconcile(user) {
    const uid = user.id;
    const { data: row, error } = await client.from('saves').select('data').eq('user_id', uid).maybeSingle();
    if (error) throw error;
    const remote = row ? row.data : null;
    const local = St().owner() === uid ? St().get() : St().readSlot(uid);
    const guest = St().readSlot(null);
    const guestHas = guest && St().hasProgress(guest) && !(guest.askedMerge || []).includes(uid);

    let base = null;
    if (remote && local) base = (remote.savedAt || 0) >= (local.savedAt || 0) ? remote : local;
    else base = remote || local;
    if (base && !St().hasProgress(base) && !remote) base = null; // slot local vazio: trata como conta nova

    let movedGuest = false;
    if (!base) {
      if (guestHas) { base = guest; movedGuest = true; } else { base = St().defaults(); }
    } else if (guestHas) {
      const choice = await MR.Account.askMerge(base, guest);
      if (choice === 'guest') { base = guest; movedGuest = true; } else {
        guest.askedMerge = [...(guest.askedMerge || []), uid];
        St().writeSlot(null, guest);
      }
    }
    if (movedGuest) { delete base.askedMerge; St().clearSlot(null); }
    base.onboarded = true;
    if (!base.player.name || base.player.name === 'Acadêmico') base.player.name = nameFrom(user);

    St().use(uid);
    const s = St().replace(base);
    const ev = settle(s);
    St().save();
    MR.Account.closeWelcome();
    syncFocus();
    U().render();
    MR.App.announce(ev);
    await pushNow(true);
    if (movedGuest) U().toast('Seu progresso de visitante agora está salvo na sua conta.', { icon: 'cloud-check', uiIcon: true, color: 'var(--teal)', ms: 6000 });
    else if (remote && base === remote && local && local !== remote) U().toast('Progresso sincronizado da nuvem.', { icon: 'cloud-check', uiIcon: true, color: 'var(--teal)' });
  }

  async function onSignedIn(user) {
    Cloud.user = user;
    if (reconciling) return;
    reconciling = true; setStatus('syncing');
    try { await reconcile(user); }
    catch (e) {
      console.warn('Falha ao sincronizar', e);
      // Mesmo sem rede, passa a usar o slot da conta neste aparelho.
      if (St().owner() !== user.id) {
        St().use(user.id); const s = St().load(); s.onboarded = true; settle(s); St().save(); syncFocus();
      }
      MR.Account.closeWelcome();
      setStatus('error');
      U().toast('Sem conexão com a nuvem. Seu progresso fica salvo neste aparelho e sincroniza depois.', { icon: 'cloud-off', uiIcon: true, color: 'var(--flame)', ms: 7000 });
    } finally { reconciling = false; U().render(); }
  }

  function switchToGuest() {
    Cloud.user = null; clearTimeout(pushTimer);
    St().use(null);
    const s = St().load();
    settle(s); St().save();
    syncFocus(); setStatus('idle'); U().render();
    if (!s.onboarded) MR.App.onboarding();
  }

  /* ------------------------------------------------------------------ */
  /* Envio                                                               */
  /* ------------------------------------------------------------------ */
  async function pushLeaderboard(s, uid) {
    const { error } = await client.from('leaderboard').upsert(leaderboardRow(s, uid));
    if (error) {
      console.warn('Ranking não atualizado', error);
      if (!lbWarned && /check_violation|23514|mais rápido/.test(`${error.code} ${error.message}`)) {
        lbWarned = true;
        U().toast('O ranking recusou a atualização (minutos acima do tempo real). Ele volta a atualizar com as próximas sessões.', { icon: 'medal', uiIcon: true, color: 'var(--flame)', ms: 7000 });
      }
    }
  }

  async function pushNow(force = false) {
    clearTimeout(pushTimer); pushTimer = null;
    if (!client || !Cloud.user || St().owner() !== Cloud.user.id) return;
    if (reconciling && !force) return;
    const s = St().get(); const uid = Cloud.user.id;
    setStatus('syncing');
    try {
      const { error } = await client.from('saves').upsert({ user_id: uid, data: s });
      if (error) throw error;
      await pushLeaderboard(s, uid);
      Cloud.lastSync = new Date(); setStatus('synced');
    } catch (e) { console.warn('Falha ao enviar save', e); setStatus('error'); }
  }

  function schedulePush() {
    if (!Cloud.user || reconciling) return;
    clearTimeout(pushTimer);
    pushTimer = setTimeout(pushNow, 4000);
  }

  /** Ao voltar para a aba, busca o save se outro aparelho salvou algo mais novo. */
  async function pullIfNewer() {
    if (!client || !Cloud.user || reconciling || St().owner() !== Cloud.user.id) return;
    const s = St().get();
    if (s.active || pushTimer) return; // há algo local pendente: o local manda
    try {
      const { data: row } = await client.from('saves').select('data').eq('user_id', Cloud.user.id).maybeSingle();
      if (row && row.data && (row.data.savedAt || 0) > (s.savedAt || 0) + 1000) {
        const next = St().replace(row.data); settle(next); St().save(); syncFocus();
        U().toast('Progresso atualizado com o de outro aparelho.', { icon: 'refresh-cw', uiIcon: true, color: 'var(--teal)' });
      }
    } catch (e) { /* offline */ }
  }

  /* ------------------------------------------------------------------ */
  /* API pública                                                         */
  /* ------------------------------------------------------------------ */
  const ERRORS = [
    [/invalid login credentials/i, 'E-mail ou senha incorretos.'],
    [/already registered|already been registered|user already exists/i, 'Este e-mail já tem uma conta. Tente entrar.'],
    [/email not confirmed/i, 'Confirme seu e-mail pelo link que enviamos antes de entrar.'],
    [/password should be at least|weak password|password is too short/i, 'A senha precisa ter pelo menos 6 caracteres.'],
    [/rate limit|too many requests|over_email_send_rate_limit/i, 'Muitas tentativas. Espere alguns minutos e tente de novo.'],
    [/unable to validate email|invalid email|email address .* is invalid/i, 'E-mail inválido.'],
    [/provider is not enabled|unsupported provider/i, 'Login com Google ainda não foi ativado no Supabase.'],
    [/signups not allowed|signup is disabled/i, 'Novos cadastros estão desativados no momento.'],
    [/failed to fetch|network/i, 'Sem conexão com o servidor. Verifique sua internet.'],
    [/could not find the table|relation .* does not exist|schema cache/i, 'O banco ainda não foi preparado. Rode o arquivo supabase/schema.sql no SQL Editor do Supabase.'],
  ];
  const friendly = (err) => {
    const msg = (err && (err.message || err.error_description || String(err))) || 'Erro desconhecido.';
    const hit = ERRORS.find(([re]) => re.test(msg));
    return hit ? hit[1] : msg;
  };

  const Cloud = {
    enabled: ENABLED, status: ENABLED ? 'idle' : 'off', user: null, lastSync: null, providers: null,
    weekKey, friendly, leaderboardRow,

    /** Lê o usuário salvo localmente, sem rede, para abrir já no slot certo. */
    peekUserId() {
      if (!ENABLED) return null;
      try { const j = JSON.parse(localStorage.getItem(AUTH_KEY) || 'null'); return (j && j.user && j.user.id) || null; } catch (e) { return null; }
    },
    /** Voltando de um login com Google? (código PKCE na URL) */
    returningFromOAuth: () => /[?&](code|error)=/.test(location.search),

    init() {
      if (!ENABLED) return;
      const urlErr = new URLSearchParams(location.search).get('error_description');
      client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
        auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: AUTH_KEY },
      });
      client.auth.onAuthStateChange((event, session) => {
        // Nunca chamar o Supabase direto aqui dentro (pode travar o auth): adia.
        setTimeout(() => {
          const u = session && session.user;
          if (/[?&](code|error|error_description)=/.test(location.search)) history.replaceState(null, '', location.pathname + location.hash);
          if (event === 'INITIAL_SESSION') { if (u) onSignedIn(u); else if (St().owner()) switchToGuest(); }
          else if (event === 'SIGNED_IN') { if (!Cloud.user || Cloud.user.id !== u.id) onSignedIn(u); else Cloud.user = u; }
          else if (event === 'SIGNED_OUT') { if (St().owner() || Cloud.user) switchToGuest(); }
          else if (event === 'USER_UPDATED' && u) { Cloud.user = u; U().render(); }
          else if (event === 'PASSWORD_RECOVERY') MR.Account.newPasswordModal();
        }, 0);
      });
      if (urlErr) setTimeout(() => U().toast(friendly({ message: urlErr }), { icon: 'x', uiIcon: true, color: 'var(--crimson)', ms: 7000 }), 300);
      // Quais provedores estão ativos? (evita mandar a pessoa para uma página de erro do Supabase)
      fetch(`${cfg.supabaseUrl}/auth/v1/settings`, { headers: { apikey: cfg.supabaseAnonKey } })
        .then((r) => r.json()).then((j) => { Cloud.providers = (j && j.external) || null; })
        .catch(() => { /* offline: tenta mesmo assim */ });
      St().subscribe(schedulePush);
      addEventListener('visibilitychange', () => { if (document.hidden) { if (pushTimer) pushNow(); } else pullIfNewer(); });
      addEventListener('online', () => { if (Cloud.user) pushNow(); });
    },

    async signInGoogle() {
      if (Cloud.providers && !Cloud.providers.google) throw new Error('O login com Google ainda não foi ativado. Por enquanto, entre com e-mail e senha.');
      const { error } = await client.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: redirectUrl() } });
      if (error) throw new Error(friendly(error));
    },
    async signInEmail(email, password) {
      const { error } = await client.auth.signInWithPassword({ email, password });
      if (error) throw new Error(friendly(error));
    },
    /** Retorna { needsConfirm } quando o projeto exige confirmação de e-mail. */
    async signUp(email, password, name) {
      const { data, error } = await client.auth.signUp({ email, password, options: { data: { full_name: name || undefined }, emailRedirectTo: redirectUrl() } });
      if (error) throw new Error(friendly(error));
      if (data && data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) throw new Error(friendly({ message: 'already registered' }));
      return { needsConfirm: !data.session };
    },
    async resetPassword(email) {
      const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo: redirectUrl() });
      if (error) throw new Error(friendly(error));
    },
    async updatePassword(password) {
      const { error } = await client.auth.updateUser({ password });
      if (error) throw new Error(friendly(error));
    },
    async signOut() {
      if (pushTimer || Cloud.status === 'error') { try { await pushNow(true); } catch (e) { /* segue */ } }
      await client.auth.signOut({ scope: 'local' });
      switchToGuest();
    },
    syncNow: () => pushNow(true),

    /** metric: week | total | streak | bosses | level */
    async fetchLeaderboard(metric) {
      if (!client) throw new Error('Nuvem desativada.');
      const col = { week: 'week_minutes', total: 'total_minutes', streak: 'streak', bosses: 'bosses', level: 'level' }[metric];
      const filter = (q) => {
        if (metric === 'week') q = q.eq('week_key', weekKey());
        if (metric === 'streak') q = q.gte('updated_at', new Date(Date.now() - 2 * 86400000).toISOString());
        return q.gt(col, 0);
      };
      const { data, error } = await filter(client.from('leaderboard').select('user_id,display_name,level,rank_title,rank_icon,week_minutes,total_minutes,streak,best_streak,bosses,updated_at'))
        .order(col, { ascending: false }).order('updated_at', { ascending: true }).limit(50);
      if (error) throw new Error(friendly(error));
      let me = null;
      const uid = Cloud.user && Cloud.user.id;
      if (uid && !data.some((r) => r.user_id === uid)) {
        const mine = leaderboardRow(St().get(), uid);
        if (mine[col] > 0) {
          const { count } = await filter(client.from('leaderboard').select('user_id', { count: 'exact', head: true })).gt(col, mine[col]);
          me = { ...mine, position: (count || 0) + 1 };
        }
      }
      return { rows: data, me, col };
    },
  };

  MR.Cloud = Cloud;
})(window.MR = window.MR || {});
