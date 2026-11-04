/* =========================================================================
 * Account — boas-vindas, login (Google / e-mail), cadastro, visitante,
 * recuperação de senha e a escolha de progresso ao entrar.
 * ========================================================================= */
(function (MR) {
  'use strict';
  const { gi, ui } = MR;
  const U = MR.UI;
  const C = () => MR.Cloud;
  let welcomeEntry = null;

  const GOOGLE_G = '<svg viewBox="0 0 48 48" width="18" height="18" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>';

  function summary(s) {
    const hours = s.sessions.reduce((a, x) => a + x.minutes, 0) / 60;
    const rank = MR.Engine.rankFor(s.player.level);
    const last = s.sessions[0] ? U.fmtDate(s.sessions[0].date, { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
    return `<div class="mini-stats" style="grid-template-columns:1fr 1fr;margin-top:10px">
      <div class="mini"><span>Nível</span><b>${s.player.level}</b></div>
      <div class="mini"><span>Horas</span><b>${hours.toFixed(1)}</b></div>
      <div class="mini"><span>Bosses</span><b>${s.stats.bossesDefeated}</b></div>
      <div class="mini"><span>Última sessão</span><b style="font-size:15px">${last}</b></div>
    </div><div class="muted" style="font-size:12px;margin-top:8px">${U.esc(s.player.name)} · ${rank.title}</div>`;
  }

  function cloudButtons() {
    if (!C().enabled) return '';
    return `
      <button class="btn block google-btn" data-act="acc-google">${GOOGLE_G} Continuar com Google</button>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px">
        <button class="btn" data-act="acc-login">${ui('mail')} Entrar com e-mail</button>
        <button class="btn" data-act="acc-signup">${ui('user-plus')} Criar conta</button>
      </div>`;
  }

  const Account = {
    /** Primeira tela para quem nunca jogou neste aparelho. */
    welcome() {
      if (welcomeEntry) return;
      welcomeEntry = U.modal(`
        <div style="text-align:center">
          <div style="font-size:64px;color:var(--gold);filter:drop-shadow(0 0 20px rgba(226,184,87,.4))">${gi('caduceus')}</div>
          <h2 style="font-size:26px">Bem-vindo ao Grimório Clínico</h2>
          <p class="sub">O <b>Esquecimento</b> ganhou forma. Seu único poder contra ele é o tempo de estudo de verdade.</p>
        </div>
        <div class="effects-list" style="margin:0 0 18px">
          <div class="effect" style="--rc:var(--crimson)">${gi('crossed-swords')}<div><b>Estude para atacar.</b> A cada 5 min de foco você golpeia o Guardião. Questões e simulados batem mais forte.</div></div>
          <div class="effect" style="--rc:var(--gold)">${gi('laurel-crown')}<div><b>Dispute com os amigos.</b> Com uma conta você entra no ranking semanal e leva o progresso para qualquer aparelho.</div></div>
        </div>
        ${cloudButtons()}
        ${C().enabled ? '<div class="divider"><span>ou</span></div>' : ''}
        <div class="field"><label for="ob-name">Jogar como visitante</label>
          <div style="display:flex;gap:10px">
            <input id="ob-name" class="input" maxlength="24" placeholder="Seu nome de herói">
            <button class="btn ${C().enabled ? '' : 'primary'}" id="ob-go">${gi('crossed-swords')} Jogar</button>
          </div>
          <span class="muted" style="font-size:12px;text-transform:none;letter-spacing:0">O progresso fica só neste aparelho. Dá para criar uma conta depois e levar tudo junto.</span>
        </div>
        <p class="muted" style="font-size:12px;text-align:center;margin:16px 0 0">Ao criar uma conta você concorda com os <a href="termos.html" target="_blank" style="color:var(--gold)">Termos de Uso</a> e a <a href="privacidade.html" target="_blank" style="color:var(--gold)">Política de Privacidade</a>.</p>`, { dismissable: false, onClose: () => { welcomeEntry = null; } });
      const go = () => {
        const s = MR.Store.get();
        const v = welcomeEntry.el.querySelector('#ob-name').value.trim();
        if (v) s.player.name = v;
        s.onboarded = true; MR.Store.save();
        Account.closeWelcome();
        MR.Audio.unlock(); MR.Audio.play('start');
      };
      welcomeEntry.el.querySelector('#ob-go').addEventListener('click', go);
      welcomeEntry.el.querySelector('#ob-name').addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
    },
    closeWelcome() {
      if (welcomeEntry) { const w = welcomeEntry; welcomeEntry = null; w.close(true); }
      U.closeModal('acc-open'); U.closeModal('auth');
    },

    /** mode: login | signup | reset */
    authModal(mode = 'login') {
      if (!C().enabled) { U.toast('A nuvem não está configurada nesta versão.', { icon: 'cloud-off', uiIcon: true }); return; }
      const titles = { login: 'Entrar', signup: 'Criar conta', reset: 'Recuperar senha' };
      const m = U.modal(`
        <h2>${ui(mode === 'signup' ? 'user-plus' : mode === 'reset' ? 'key-round' : 'log-in')} ${titles[mode]}</h2>
        <p class="sub">${mode === 'reset' ? 'Enviaremos um link para você criar uma nova senha.' : mode === 'signup' ? 'Seu progresso atual deste aparelho poderá ir junto para a conta.' : 'Bem-vindo de volta, herói.'}</p>
        <form id="auth-form" class="grid" style="gap:12px" novalidate>
          ${mode === 'signup' ? '<div class="field"><label for="a-name">Nome de herói</label><input id="a-name" class="input" maxlength="24" autocomplete="nickname" placeholder="Como aparece no ranking"></div>' : ''}
          <div class="field"><label for="a-email">E-mail</label><input id="a-email" class="input" type="email" autocomplete="email" required></div>
          ${mode !== 'reset' ? `<div class="field"><label for="a-pass">Senha</label><input id="a-pass" class="input" type="password" minlength="6" autocomplete="${mode === 'signup' ? 'new-password' : 'current-password'}" required placeholder="${mode === 'signup' ? 'Mínimo de 6 caracteres' : ''}"></div>` : ''}
          <div class="form-error" id="a-err" role="alert"></div>
          <button class="btn primary block" type="submit" id="a-submit">${titles[mode]}</button>
        </form>
        <div class="auth-links">
          ${mode === 'login' ? '<button class="btn ghost sm" data-act="acc-reset">Esqueci minha senha</button><button class="btn ghost sm" data-act="acc-signup">Não tenho conta</button>' : ''}
          ${mode === 'signup' ? '<button class="btn ghost sm" data-act="acc-login">Já tenho conta</button>' : ''}
          ${mode === 'reset' ? '<button class="btn ghost sm" data-act="acc-login">Voltar ao login</button>' : ''}
        </div>
        ${mode !== 'reset' ? `<div class="divider"><span>ou</span></div><button class="btn block google-btn" data-act="acc-google">${GOOGLE_G} Continuar com Google</button>` : ''}`, { key: 'auth' });
      const $ = (id) => m.el.querySelector(id);
      const err = (t) => { $('#a-err').textContent = t || ''; };
      $('#auth-form').addEventListener('submit', async (e) => {
        e.preventDefault(); err('');
        const email = $('#a-email').value.trim();
        const pass = $('#a-pass') ? $('#a-pass').value : '';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return err('Digite um e-mail válido.');
        if (mode !== 'reset' && pass.length < 6) return err('A senha precisa ter pelo menos 6 caracteres.');
        const btn = $('#a-submit'); btn.disabled = true; const label = btn.innerHTML; btn.innerHTML = `${ui('loader-circle', 'spin')} Aguarde…`;
        try {
          if (mode === 'login') {
            await C().signInEmail(email, pass);
            m.close(true); U.toast('Entrando e sincronizando…', { icon: 'cloud', uiIcon: true, color: 'var(--teal)' });
          } else if (mode === 'signup') {
            const name = $('#a-name').value.trim();
            if (name) { const s = MR.Store.get(); s.player.name = name; MR.Store.persistQuiet(); }
            const r = await C().signUp(email, pass, name);
            if (r.needsConfirm) {
              m.set(`<h2>${ui('mail')} Confirme seu e-mail</h2><p class="sub">Enviamos um link para <b>${U.esc(email)}</b>. Abra o link para ativar a conta e depois entre com seu e-mail e senha. Olhe também a caixa de spam.</p>
                <div class="modal-actions"><button class="btn primary" data-act="acc-login">Ir para o login</button></div>`);
            } else { m.close(true); U.toast('Conta criada! Sincronizando seu progresso…', { icon: 'cloud-check', uiIcon: true, color: 'var(--teal)' }); }
          } else {
            await C().resetPassword(email);
            m.set(`<h2>${ui('mail')} Verifique seu e-mail</h2><p class="sub">Se existir uma conta com <b>${U.esc(email)}</b>, você vai receber um link para criar uma nova senha.</p>
              <div class="modal-actions"><button class="btn primary" data-act="modal-close">Ok</button></div>`);
          }
        } catch (ex) { err(ex.message); btn.disabled = false; btn.innerHTML = label; }
      });
    },

    newPasswordModal() {
      const m = U.modal(`<h2>${ui('key-round')} Nova senha</h2><p class="sub">Escolha uma nova senha para sua conta.</p>
        <form id="np-form" class="grid" style="gap:12px"><div class="field"><label for="np">Nova senha</label><input id="np" class="input" type="password" minlength="6" autocomplete="new-password"></div>
        <div class="form-error" id="np-err" role="alert"></div><button class="btn primary block" type="submit">Salvar senha</button></form>`, { key: 'auth' });
      m.el.querySelector('#np-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const v = m.el.querySelector('#np').value;
        if (v.length < 6) { m.el.querySelector('#np-err').textContent = 'A senha precisa ter pelo menos 6 caracteres.'; return; }
        try { await C().updatePassword(v); m.close(true); U.toast('Senha alterada!', { icon: 'check', uiIcon: true, color: 'var(--green)' }); }
        catch (ex) { m.el.querySelector('#np-err').textContent = ex.message; }
      });
    },

    /** Conta já tem progresso E o aparelho tem progresso de visitante: qual fica? */
    askMerge(accountState, guestState) {
      return new Promise((resolve) => {
        const m = U.modal(`
          <h2>${ui('users')} Qual progresso manter na conta?</h2>
          <p class="sub">Sua conta já tem progresso, e este aparelho também tem um progresso de visitante.</p>
          <div class="merge-grid">
            <div class="card" style="padding:16px"><h3 class="card-title">${ui('cloud')} Da conta</h3>${summary(accountState)}
              <button class="btn primary block" style="margin-top:14px" data-m="account">Manter o da conta</button>
              <p class="muted" style="font-size:12px;margin:8px 0 0">O progresso de visitante continua salvo neste aparelho.</p></div>
            <div class="card" style="padding:16px"><h3 class="card-title">${gi('hood')} Deste aparelho</h3>${summary(guestState)}
              <button class="btn block" style="margin-top:14px" data-m="guest">Usar o deste aparelho</button>
              <p class="muted" style="font-size:12px;margin:8px 0 0"><b style="color:#fca5a5">Substitui</b> o progresso que estava na conta.</p></div>
          </div>`, { wide: true, dismissable: false });
        m.el.addEventListener('click', (e) => { const b = e.target.closest('[data-m]'); if (b) { m.close(true); resolve(b.dataset.m); } });
      });
    },

    /** Cartão de conta na tela de Ajustes. */
    card() {
      const c = C();
      if (!c.enabled) return `<section class="card"><h2 class="card-title">${ui('cloud-off')} Conta</h2><p class="muted" style="margin:0">A nuvem não está configurada nesta versão. Seu progresso fica salvo neste navegador.</p></section>`;
      if (!c.user) {
        return `<section class="card"><h2 class="card-title">${ui('user')} Conta</h2>
          <p class="muted" style="font-size:13px;margin-top:0">Você está jogando como <b>visitante</b>: o progresso fica só neste aparelho e você não aparece no ranking. Crie uma conta para salvar na nuvem e levar tudo junto.</p>
          ${cloudButtons()}</section>`;
      }
      const u = c.user;
      const provider = (u.app_metadata && u.app_metadata.provider) || 'email';
      const st = { synced: [ui('cloud-check'), 'Sincronizado', 'var(--green)'], syncing: [ui('loader-circle', 'spin'), 'Sincronizando…', 'var(--teal)'],
        error: [ui('cloud-off'), 'Sem conexão — salvo neste aparelho', 'var(--flame)'], idle: [ui('cloud'), 'Conectado', 'var(--muted)'] }[c.status] || [ui('cloud'), '', 'var(--muted)'];
      return `<section class="card"><h2 class="card-title">${ui('cloud')} Conta</h2>
        <div class="set-row"><div><b>${U.esc(u.email || 'Conta')}</b><span>${provider === 'google' ? 'Entrou com Google' : 'Entrou com e-mail e senha'}</span></div></div>
        <div class="set-row"><div><b style="color:${st[2]}">${st[0]} ${st[1]}</b><span>${c.lastSync ? 'Último envio às ' + c.lastSync.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'O progresso é enviado alguns segundos depois de cada mudança.'}</span></div>
          <button class="btn sm" data-act="acc-sync">${ui('refresh-cw')} Sincronizar</button></div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:12px">
          ${provider === 'email' ? `<button class="btn sm" data-act="acc-newpass">${ui('key-round')} Trocar senha</button>` : ''}
          <button class="btn sm danger" data-act="acc-logout">${ui('log-out')} Sair da conta</button>
        </div>
        <div class="set-row" style="margin-top:8px"><div><b>Excluir minha conta</b><span>Apaga para sempre a conta, o progresso na nuvem e sua posição no ranking.</span></div>
          <button class="btn sm danger" data-act="acc-delete">${ui('trash-2')} Excluir</button></div></section>`;
    },

    /** Botão da conta no HUD. */
    hudChip() {
      const c = C();
      if (!c.enabled) return '';
      if (!c.user) return `<button class="pill acct" data-act="acc-open" data-tip="Visitante: progresso só neste aparelho. Clique para criar conta ou entrar.">${ui('user')} <span>Visitante</span></button>`;
      const ic = { synced: 'cloud-check', syncing: 'loader-circle', error: 'cloud-off' }[c.status] || 'cloud';
      const color = { synced: 'var(--green)', syncing: 'var(--teal)', error: 'var(--flame)' }[c.status] || 'var(--muted)';
      const tip = { synced: 'Progresso salvo na nuvem', syncing: 'Sincronizando…', error: 'Sem conexão: salvo neste aparelho, sincroniza depois' }[c.status] || 'Conta conectada';
      return `<button class="icon-btn" data-act="go" data-view="settings" style="color:${color}" data-tip="${tip}" aria-label="${tip}">${ui(ic, c.status === 'syncing' ? 'spin' : '')}</button>`;
    },
  };

  const guardOnline = (fn) => async () => {
    if (!C().enabled) return;
    try { await fn(); } catch (e) { U.toast(U.esc(e.message), { icon: 'x', uiIcon: true, color: 'var(--crimson)', ms: 6000 }); }
  };
  U.on('acc-google', guardOnline(() => C().signInGoogle()));
  U.on('acc-login', () => Account.authModal('login'));
  U.on('acc-signup', () => Account.authModal('signup'));
  U.on('acc-reset', () => Account.authModal('reset'));
  U.on('acc-newpass', () => Account.newPasswordModal());
  U.on('acc-open', () => {
    U.modal(`<h2>${ui('user')} Você está como visitante</h2>
      <p class="sub">Crie uma conta para salvar seu progresso na nuvem, jogar em vários aparelhos e entrar no ranking. Seu progresso atual vai junto.</p>
      ${cloudButtons()}`, { key: 'acc-open' });
  });
  U.on('acc-sync', guardOnline(async () => { await C().syncNow(); U.render(); }));
  U.on('acc-delete', () => {
    const m = U.modal(`<h2>${ui('trash-2')} Excluir conta para sempre?</h2>
      <p class="sub">Isso apaga <b>imediatamente</b> sua conta, todo o progresso salvo na nuvem e sua posição no ranking. <b>Não há como desfazer.</b> Se quiser guardar uma cópia, use antes <b>Backup → Exportar save</b>.</p>
      <div class="field"><label for="del-ok">Digite EXCLUIR para confirmar</label><input id="del-ok" class="input" autocomplete="off"></div>
      <div class="form-error" id="del-err" role="alert"></div>
      <div class="modal-actions"><button class="btn ghost" data-act="modal-close">Cancelar</button><button class="btn danger" id="del-go" disabled>${ui('trash-2')} Excluir conta</button></div>`, { key: 'acc-delete' });
    const inp = m.el.querySelector('#del-ok'); const go = m.el.querySelector('#del-go');
    inp.addEventListener('input', () => { go.disabled = inp.value.trim().toUpperCase() !== 'EXCLUIR'; });
    go.addEventListener('click', async () => {
      go.disabled = true; go.innerHTML = `${ui('loader-circle', 'spin')} Excluindo…`;
      try { await C().deleteAccount(); m.close(true); U.toast('Sua conta e seus dados foram excluídos.', { icon: 'check', uiIcon: true, color: 'var(--green)', ms: 6000 }); }
      catch (e) { m.el.querySelector('#del-err').textContent = e.message; go.disabled = false; go.innerHTML = `${ui('trash-2')} Excluir conta`; }
    });
  });
  U.on('acc-logout', async () => {
    const ok = await U.confirm({ title: 'Sair da conta?', icon: 'hood', ok: 'Sair',
      text: 'Seu progresso continua salvo na nuvem. Neste aparelho você volta a jogar como visitante.' });
    if (ok) guardOnline(() => C().signOut())();
  });

  MR.Account = Account;
})(window.MR = window.MR || {});
