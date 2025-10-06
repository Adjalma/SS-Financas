-- SS-Finanças - Esquema básico Supabase Postgres
-- Execute no SQL Editor do Supabase

create table if not exists public.months (
  id bigserial primary key,
  year_month text unique not null check (year_month ~ '^[0-9]{4}-[0-9]{2}$')
);

create table if not exists public.fixed_costs (
  id bigserial primary key,
  month_id bigint not null references public.months(id) on delete cascade,
  category text not null,
  amount numeric(14,2) not null default 0,
  paid boolean not null default false
);

create table if not exists public.variable_expenses (
  id bigserial primary key,
  month_id bigint not null references public.months(id) on delete cascade,
  description text not null default '',
  date date null,
  aguiar_amount numeric(14,2) not null default 0,
  bardela_amount numeric(14,2) not null default 0
);

create table if not exists public.cards (
  id bigserial primary key,
  month_id bigint not null references public.months(id) on delete cascade,
  owner text not null check (owner in ('Aguiar','Bardela')),
  amount numeric(14,2) not null default 0
);

-- Empresa (Sistema Sentinela)
create table if not exists public.cost_centers (
  id bigserial primary key,
  name text not null unique
);

create table if not exists public.categories (
  id bigserial primary key,
  name text not null unique
);

create table if not exists public.company_entries (
  id bigserial primary key,
  month_id bigint not null references public.months(id) on delete cascade,
  type text not null check (type in ('revenue','expense')),
  category_id bigint null references public.categories(id) on delete set null,
  cost_center_id bigint null references public.cost_centers(id) on delete set null,
  description text not null default '',
  date date not null default now(),
  amount numeric(14,2) not null,
  payment_method text null,
  paid boolean not null default false
);

-- Tabelas para Holerite
create table if not exists public.salaries (
  id bigserial primary key,
  month_id bigint not null references public.months(id) on delete cascade,
  employee_name text not null check (employee_name in ('Adjalma','Eliete','Eliete (INSS)')),
  gross_salary numeric(14,2) not null default 0,
  inss_deduction numeric(14,2) not null default 0,
  irrf_deduction numeric(14,2) not null default 0,
  other_deductions numeric(14,2) not null default 0,
  net_salary numeric(14,2) not null default 0,
  paid boolean not null default false
);

create table if not exists public.company_receivables (
  id bigserial primary key,
  month_id bigint not null references public.months(id) on delete cascade,
  description text not null default '',
  amount numeric(14,2) not null default 0,
  due_date date null,
  received boolean not null default false
);

create table if not exists public.company_taxes (
  id bigserial primary key,
  month_id bigint not null references public.months(id) on delete cascade,
  tax_type text not null check (tax_type in ('inss','irrf','pis','cofins','csll')),
  amount numeric(14,2) not null default 0,
  due_date date null,
  paid boolean not null default false
);

-- Indexes úteis
create index if not exists idx_fixed_costs_month on public.fixed_costs(month_id);
create index if not exists idx_variable_expenses_month on public.variable_expenses(month_id);
create index if not exists idx_cards_month on public.cards(month_id);
create index if not exists idx_company_entries_month on public.company_entries(month_id);
create index if not exists idx_salaries_month on public.salaries(month_id);
create index if not exists idx_company_receivables_month on public.company_receivables(month_id);
create index if not exists idx_company_taxes_month on public.company_taxes(month_id);

-- RLS + Políticas (abertas)
alter table public.months enable row level security;
create policy months_select_all on public.months for select using (true);
create policy months_insert_all on public.months for insert with check (true);
create policy months_update_all on public.months for update using (true) with check (true);

alter table public.fixed_costs enable row level security;
create policy fixed_costs_select_all on public.fixed_costs for select using (true);
create policy fixed_costs_insert_all on public.fixed_costs for insert with check (true);
create policy fixed_costs_update_all on public.fixed_costs for update using (true) with check (true);

alter table public.variable_expenses enable row level security;
create policy variable_expenses_select_all on public.variable_expenses for select using (true);
create policy variable_expenses_insert_all on public.variable_expenses for insert with check (true);
create policy variable_expenses_update_all on public.variable_expenses for update using (true) with check (true);

alter table public.cards enable row level security;
create policy cards_select_all on public.cards for select using (true);
create policy cards_insert_all on public.cards for insert with check (true);
create policy cards_update_all on public.cards for update using (true) with check (true);

alter table public.categories enable row level security;
create policy categories_select_all on public.categories for select using (true);
create policy categories_insert_all on public.categories for insert with check (true);
create policy categories_update_all on public.categories for update using (true) with check (true);

alter table public.cost_centers enable row level security;
create policy cost_centers_select_all on public.cost_centers for select using (true);
create policy cost_centers_insert_all on public.cost_centers for insert with check (true);
create policy cost_centers_update_all on public.cost_centers for update using (true) with check (true);

alter table public.company_entries enable row level security;
create policy company_entries_select_all on public.company_entries for select using (true);
create policy company_entries_insert_all on public.company_entries for insert with check (true);
create policy company_entries_update_all on public.company_entries for update using (true) with check (true);

alter table public.salaries enable row level security;
create policy salaries_select_all on public.salaries for select using (true);
create policy salaries_insert_all on public.salaries for insert with check (true);
create policy salaries_update_all on public.salaries for update using (true) with check (true);

alter table public.company_receivables enable row level security;
create policy company_receivables_select_all on public.company_receivables for select using (true);
create policy company_receivables_insert_all on public.company_receivables for insert with check (true);
create policy company_receivables_update_all on public.company_receivables for update using (true) with check (true);

alter table public.company_taxes enable row level security;
create policy company_taxes_select_all on public.company_taxes for select using (true);
create policy company_taxes_insert_all on public.company_taxes for insert with check (true);
create policy company_taxes_update_all on public.company_taxes for update using (true) with check (true);
