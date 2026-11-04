/* Testes da sincronização com a nuvem, usando um Supabase falso em memória.
 * Rode com: node tests/cloud.test.js */
const fs = require('fs'); const path = require('path'); const vm = require('vm'); const assert = require('assert');

function makeEnv() {
  const ls = new Map();
  const localStorage = { getItem: (k) => (ls.has(k) ? ls.get(k) : null), setItem: (k, v) => ls.set(k, String(v)), removeItem: (k) => ls.delete(k) };
  const db = { saves: new Map(), leaderboard: new Map() };
  let authCb = null;
  const fakeClient = {
    auth: {
      onAuthStateChange: (cb) => { authCb = cb; },
      signInWithPassword: async ({ email }) => { const user = { id: 'u-' + email, email, user_metadata: {} }; localStorage.setItem('sb-test-auth-token', JSON.stringify({ user })); authCb('SIGNED_IN', { user }); return { error: null }; },
      signOut: async () => { localStorage.removeItem('sb-test-auth-token'); authCb('SIGNED_OUT', null); return { error: null }; },
    },
    from(table) {
      const t = db[table]; const q = { filters: {} };
      const api = {
        select: () => api, eq: (c, v) => { q.filters[c] = v; return api; },
        maybeSingle: async () => ({ data: t.has(q.filters.user_id) ? { data: JSON.parse(JSON.stringify(t.get(q.filters.user_id).data)) } : null, error: null }),
        upsert: async (row) => { t.set(row.user_id, JSON.parse(JSON.stringify(table === 'saves' ? { data: row.data } : row))); return { error: null }; },
      };
      return api;
    },
  };
  const ctx = {
    console, Math, Date, JSON, Object, Array, Set, Map, String, Number, Promise, URL, URLSearchParams,
    setTimeout: (fn) => { fn(); return 0; }, clearTimeout: () => {},
    addEventListener: () => {}, localStorage,
    location: { search: '', origin: 'http://localhost', pathname: '/', hash: '' }, history: { replaceState() {} },
  };
  ctx.window = ctx; ctx.globalThis = ctx;
  ctx.supabase = { createClient: () => fakeClient };
  vm.createContext(ctx);
  ctx.MR = { CONFIG: { supabaseUrl: 'https://test.supabase.co', supabaseAnonKey: 'anon' } };
  for (const f of ['data.js', 'store.js', 'engine.js', 'cloud.js']) vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8'), ctx, { filename: f });
  const MR = ctx.MR;
  const log = { merges: 0, welcomes: 0, mergeAnswer: 'account' };
  MR.UI = { render() {}, renderHud() {}, toast() {}, closeModal() {}, esc: (x) => x };
  MR.Account = { closeWelcome() {}, askMerge: async () => { log.merges++; return log.mergeAnswer; } };
  MR.Focus = { open() {}, close() {}, isOpen: () => false };
  MR.App = { announce() {}, onboarding() { log.welcomes++; } };
  MR.Store.load(); MR.Engine.ensureBoss(MR.Store.get()); MR.Store.save();
  MR.Cloud.init();
  return { MR, db, log, ls, client: fakeClient };
}
const flush = () => new Promise((r) => setImmediate(r));
const settle = async () => { for (let i = 0; i < 10; i++) await flush(); };
const play = (MR, minutes) => {
  const s = MR.Store.get(); const t = Date.now() - minutes * 60000;
  MR.Engine.startSession(s, { method: 'questions', mode: 'countdown', goal: minutes }, t);
  MR.Engine.finishSession(s, {}, t + minutes * 60000); MR.Store.save();
};
let passed = 0;
const test = async (name, fn) => { await fn(); passed++; console.log('  ok -', name); };

(async () => {
  await test('visitante com progresso cria conta: progresso vai para a conta e para a nuvem', async () => {
    const { MR, db, ls } = makeEnv();
    play(MR, 50);
    assert.strictEqual(MR.Store.owner(), null);
    await MR.Cloud.signInEmail('ana@x.com', 'secret1'); await settle();
    assert.strictEqual(MR.Store.owner(), 'u-ana@x.com');
    assert.strictEqual(MR.Store.get().sessions.length, 1);
    assert(db.saves.has('u-ana@x.com'), 'save enviado');
    assert.strictEqual(db.leaderboard.get('u-ana@x.com').total_minutes, 50);
    assert.strictEqual(db.leaderboard.get('u-ana@x.com').week_minutes, 50);
    assert(!ls.has('medrpg_save_v3'), 'slot de visitante foi esvaziado (progresso movido)');
  });

  await test('sair da conta volta para visitante zerado e mostra boas-vindas', async () => {
    const { MR, log } = makeEnv();
    play(MR, 25);
    await MR.Cloud.signInEmail('bia@x.com', 'secret1'); await settle();
    await MR.Cloud.signOut(); await settle();
    assert.strictEqual(MR.Store.owner(), null);
    assert.strictEqual(MR.Store.get().sessions.length, 0);
    assert(log.welcomes >= 1);
  });

  await test('outro aparelho: entrar baixa o progresso da nuvem', async () => {
    const a = makeEnv();
    play(a.MR, 50);
    await a.MR.Cloud.signInEmail('caio@x.com', 'secret1'); await settle();
    const b = makeEnv();
    // aponta o cliente do aparelho B para o mesmo banco do aparelho A
    const shared = a.db;
    b.client.from = (table) => { const t = shared[table]; const q = { f: {} }; const api = { select: () => api, eq: (c, v) => { q.f[c] = v; return api; },
      maybeSingle: async () => ({ data: t.has(q.f.user_id) ? { data: JSON.parse(JSON.stringify(t.get(q.f.user_id).data)) } : null, error: null }),
      upsert: async (row) => { t.set(row.user_id, JSON.parse(JSON.stringify(table === 'saves' ? { data: row.data } : row))); return { error: null }; } }; return api; };
    await b.MR.Cloud.signInEmail('caio@x.com', 'secret1'); await settle();
    assert.strictEqual(b.MR.Store.get().sessions.length, 1);
    assert.strictEqual(b.log.merges, 0, 'aparelho novo sem progresso não pergunta nada');
  });

  await test('conta e visitante com progresso: pergunta qual manter (mantém a conta)', async () => {
    const env = makeEnv();
    play(env.MR, 50);
    await env.MR.Cloud.signInEmail('duda@x.com', 'secret1'); await settle();
    await env.MR.Cloud.signOut(); await settle();
    env.MR.Store.get().onboarded = true; play(env.MR, 25); // joga como visitante
    env.log.mergeAnswer = 'account';
    await env.MR.Cloud.signInEmail('duda@x.com', 'secret1'); await settle();
    assert.strictEqual(env.log.merges, 1);
    assert.strictEqual(env.MR.Store.get().sessions[0].minutes, 50, 'ficou o da conta');
    const guest = env.MR.Store.readSlot(null);
    assert.strictEqual(guest.sessions.length, 1, 'visitante preservado no aparelho');
    // entrar de novo não pergunta outra vez
    await env.MR.Cloud.signOut(); await settle();
    await env.MR.Cloud.signInEmail('duda@x.com', 'secret1'); await settle();
    assert.strictEqual(env.log.merges, 1);
  });

  await test('conta e visitante com progresso: escolher o do aparelho substitui o da conta', async () => {
    const env = makeEnv();
    play(env.MR, 50);
    await env.MR.Cloud.signInEmail('edu@x.com', 'secret1'); await settle();
    await env.MR.Cloud.signOut(); await settle();
    env.MR.Store.get().onboarded = true; play(env.MR, 30);
    env.log.mergeAnswer = 'guest';
    await env.MR.Cloud.signInEmail('edu@x.com', 'secret1'); await settle();
    assert.strictEqual(env.MR.Store.get().sessions[0].minutes, 30);
    assert.strictEqual(env.db.saves.get('u-edu@x.com').data.sessions[0].minutes, 30);
    assert.strictEqual(env.MR.Store.readSlot(null), null, 'slot de visitante esvaziado');
  });

  await test('linha do ranking: semana conta só a partir de segunda', () => {
    const { MR } = makeEnv();
    const s = MR.Store.get();
    const wk = MR.Cloud.weekKey();
    s.sessions.push({ date: MR.Store.addDays(wk, -1), minutes: 100 }, { date: wk, minutes: 40 });
    const row = MR.Cloud.leaderboardRow(s, 'x');
    assert.strictEqual(row.total_minutes, 140); assert.strictEqual(row.week_minutes, 40); assert.strictEqual(row.week_key, wk);
  });

  console.log(`\n${passed} testes passaram.`);
})().catch((e) => { console.error(e); process.exit(1); });
