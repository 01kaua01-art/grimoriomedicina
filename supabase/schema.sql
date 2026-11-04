-- =========================================================================
-- MedRPG · Grimório Clínico — esquema do Supabase
-- Rode este arquivo inteiro uma vez no SQL Editor do painel do Supabase.
-- Pode rodar de novo sem problema (é idempotente).
-- =========================================================================

-- -------------------------------------------------------------------------
-- 1. Saves: um save por usuário, guardado como JSON.
--    Cada pessoa só lê e grava o próprio save.
-- -------------------------------------------------------------------------
create table if not exists public.saves (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  data       jsonb not null,
  updated_at timestamptz not null default now(),
  constraint saves_size check (pg_column_size(data) < 2000000)
);

alter table public.saves enable row level security;

drop policy if exists "saves: dono lê"      on public.saves;
drop policy if exists "saves: dono cria"    on public.saves;
drop policy if exists "saves: dono altera"  on public.saves;
drop policy if exists "saves: dono apaga"   on public.saves;
create policy "saves: dono lê"     on public.saves for select to authenticated using ((select auth.uid()) = user_id);
create policy "saves: dono cria"   on public.saves for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "saves: dono altera" on public.saves for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "saves: dono apaga"  on public.saves for delete to authenticated using ((select auth.uid()) = user_id);

revoke all on public.saves from anon, authenticated; -- o Supabase dá permissões amplas por padrão
grant select, insert, update, delete on public.saves to authenticated;

-- -------------------------------------------------------------------------
-- 2. Ranking: uma linha pública por jogador com conta.
--    Só tem nome de exibição e números de estudo (nunca e-mail).
-- -------------------------------------------------------------------------
create table if not exists public.leaderboard (
  user_id        uuid primary key references auth.users (id) on delete cascade,
  display_name   text not null,
  level          int  not null default 1,
  rank_title     text not null default '',
  rank_icon      text not null default 'hood',
  total_minutes  int  not null default 0,
  week_key       date not null default current_date,
  week_minutes   int  not null default 0,
  streak         int  not null default 0,
  best_streak    int  not null default 0,
  bosses         int  not null default 0,
  updated_at     timestamptz not null default now(),
  constraint lb_name   check (char_length(display_name) between 1 and 24),
  constraint lb_level  check (level between 1 and 1000),
  constraint lb_total  check (total_minutes between 0 and 525600),       -- até 1 ano de estudo
  constraint lb_week   check (week_minutes between 0 and 10080 and week_minutes <= total_minutes),
  constraint lb_streak check (streak between 0 and 100000 and best_streak between 0 and 100000),
  constraint lb_bosses check (bosses between 0 and 1000000)
);

create index if not exists leaderboard_week_idx  on public.leaderboard (week_key, week_minutes desc);
create index if not exists leaderboard_total_idx on public.leaderboard (total_minutes desc);

alter table public.leaderboard enable row level security;

drop policy if exists "ranking: todos leem"  on public.leaderboard;
drop policy if exists "ranking: dono cria"   on public.leaderboard;
drop policy if exists "ranking: dono altera" on public.leaderboard;
create policy "ranking: todos leem"  on public.leaderboard for select to anon, authenticated using (true);
create policy "ranking: dono cria"   on public.leaderboard for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "ranking: dono altera" on public.leaderboard for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
-- Sem política de delete: ninguém apaga a própria linha para recomeçar "do zero" no ranking.

revoke all on public.leaderboard from anon, authenticated;
grant select on public.leaderboard to anon, authenticated;
grant insert, update on public.leaderboard to authenticated;

-- -------------------------------------------------------------------------
-- 3. Proteção contra trapaça no ranking.
--    O jogo roda no navegador, então o cliente poderia mandar qualquer número.
--    Esta trava impede que os minutos cresçam mais rápido que o tempo real
--    (com 5 min de folga). Não é à prova de tudo, mas barra o óbvio.
-- -------------------------------------------------------------------------
create or replace function public.leaderboard_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  elapsed_min numeric;
begin
  new.updated_at := now();
  if tg_op = 'UPDATE' then
    new.user_id := old.user_id;
    elapsed_min := extract(epoch from (now() - old.updated_at)) / 60.0;
    if new.total_minutes > old.total_minutes + elapsed_min + 5 then
      raise exception 'Minutos totais cresceram mais rápido que o tempo real.' using errcode = 'check_violation';
    end if;
    if new.week_key = old.week_key and new.week_minutes > old.week_minutes + elapsed_min + 5 then
      raise exception 'Minutos da semana cresceram mais rápido que o tempo real.' using errcode = 'check_violation';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists leaderboard_guard on public.leaderboard;
create trigger leaderboard_guard
  before insert or update on public.leaderboard
  for each row execute function public.leaderboard_guard();

-- Mantém updated_at dos saves sempre no horário do servidor.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists saves_touch on public.saves;
create trigger saves_touch
  before insert or update on public.saves
  for each row execute function public.touch_updated_at();

-- -------------------------------------------------------------------------
-- 4. Exclusão de conta pelo próprio usuário (LGPD / políticas do Google).
--    Apaga só a conta de quem chama; saves e ranking caem junto (cascade).
--    SECURITY DEFINER é intencional: o usuário comum não pode apagar de auth.users.
-- -------------------------------------------------------------------------
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'É preciso estar logado para excluir a conta.' using errcode = '42501';
  end if;
  delete from auth.users where id = uid;
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
