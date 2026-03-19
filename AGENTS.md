# AGENTS.md — Paty Help

Guia completo para agentes de IA (Codex, Claude, Copilot, etc.) trabalharem neste projeto com contexto total.

---

## 1. Visão geral do produto

**Paty Help** é um sistema de gestão de equipe e praças para restaurante, construído para ser usado por uma gestora com pouca familiaridade técnica. O foco é máxima clareza visual, botões grandes, linguagem em português e funcionamento tanto em desktop quanto em mobile.

### Funcionalidades principais

| Aba | O que faz |
|---|---|
| **Dashboard** | Visão do dia: cards de métricas, lista de praças, gráficos de barras e pizza, resumo de ausências |
| **Escala** | Calendário mensal estilo Excel — clique para marcar/desmarcar folga, férias por range de datas, arrastar linha para reordenar |
| **Praças** | CRUD de praças do restaurante — ícone Lucide, múltiplos responsáveis por praça, atribuir/trocar/adicionar/remover funcionários |
| **Equipe** | CRUD de funcionários — efetivo/temporário, marcar folga do dia, registrar férias com datas, editar nome/cargo/tipo |

---

## 2. Stack tecnológica

```
Frontend:   React 18 + TypeScript + Vite
UI:         CSS puro (PatyHelp.css) + inline styles em CSSProperties
Charts:     Recharts (BarChart, PieChart)
Icons:      Lucide React
Database:   Supabase (PostgreSQL 17)
Client DB:  @supabase/supabase-js v2
Fonts:      DM Sans + Instrument Serif (Google Fonts, carregado em runtime)
```

**Sem** Tailwind, **sem** shadcn/ui, **sem** React Router, **sem** estado global (Zustand/Redux). Tudo em estado local React com `useState` e `useCallback`.

---

## 3. Estrutura de arquivos

```
paty-help/
├── .env.example                  ← modelo das variáveis de ambiente
├── .env.local                    ← NÃO commitar — chaves reais do Supabase
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
└── src/
    ├── main.tsx                  ← ReactDOM.createRoot
    ├── App.tsx                   ← importa e renderiza <PatyHelp />
    ├── supabaseClient.ts         ← createClient() — lê VITE_SUPABASE_* do .env.local
    ├── types.ts                  ← todos os tipos TS (DbRole, Employee, Station, Schedule…)
    └── pages/
        ├── PatyHelp.tsx          ← componente raiz + todos os sub-componentes
        └── PatyHelp.css          ← layout de sidebar, grid responsivo, escala table
```

### Regra de organização de código

Todo o app vive em **um único arquivo** `PatyHelp.tsx`. A ordem das seções dentro dele é:

1. Imports
2. Constantes de cor (`C`) e cores de avatar (`EMP_COLORS`)
3. Mapa de ícones de praça (`STATION_ICONS`)
4. Helpers puros (datas, `buildRange`, `getStatusForDate`, etc.)
5. Constantes de navegação (`NAV_ITEMS`)
6. Componente raiz `PatyHelp` (estado, handlers, render)
7. Tabs: `HojeTab`, `EscalaTab`, `PracasTab`, `EquipeTab`
8. Componentes de card: `EmployeeCard`
9. Forms de modal: `EditEmployeeForm`, `VacationForm`, `EditStationForm`, `RolesManager`
10. Componentes UI compartilhados: `Avatar`, `MetricCard`, `TypeBadge`, `StatusBadge`, `TypeSelector`, `ActionBtn`, `GroupLabel`, `FLabel`, `BottomSheet`, `IconPicker`
11. Constantes de estilo inline (`inputSt`, `primaryBtnSt`, etc.)

---

## 4. Variáveis de ambiente

Crie `.env.local` na raiz do projeto (nunca commitar):

```env
VITE_SUPABASE_URL=https://hqarwygwxqmhnbgoxqvc.supabase.co
VITE_SUPABASE_ANON_KEY=<chave anon do painel Supabase>
```

A chave anon está em: **Supabase Dashboard → Settings → API → Project API keys → anon public**.

O `supabaseClient.ts` lança um erro descritivo se as variáveis não estiverem definidas — não deixa o app subir silenciosamente quebrado.

---

## 5. Como rodar

```bash
npm install        # instala dependências (inclui @supabase/supabase-js)
npm run dev        # dev server em http://localhost:5173
npm run build      # build de produção em /dist
npm run preview    # preview do build
```

---

## 6. Arquitetura de estado

Não há estado global. O componente raiz `PatyHelp` carrega **todos os dados** do Supabase no mount via `loadAll()` e distribui para as tabs via props.

### Tipos principais

```ts
interface Employee {
  id: number; name: string; role: string; initials: string
  type: 'efetivo' | 'temporario'; sort_order: number
}

interface Station {
  id: number; name: string; iconKey: string
  sort_order: number; assignedIds: number[]  // múltiplos funcionários
}

// schedule: empId → { 'YYYY-MM-DD' → 'folga' | 'vacation' }
type Schedule = Record<number, Record<string, 'folga' | 'vacation'>>
```

### Status derivado

O status de cada funcionário (`active | dayoff | vacation`) é **sempre derivado** do `schedule` para uma data específica. Nunca é armazenado como campo direto.

```ts
const getStatusForDate = (empId, schedule, dateISO): Status => {
  const mark = schedule[empId]?.[dateISO]
  if (mark === 'folga')    return 'dayoff'
  if (mark === 'vacation') return 'vacation'
  return 'active'
}
```

### Padrão de atualização otimista

Todos os handlers de escrita seguem o padrão: **atualizar estado local primeiro → fazer chamada Supabase depois**. Isso garante UI sem latência.

```ts
// Exemplo em toggleEscalaCell:
setSchedule(prev => { /* atualização local */ })
await supabase.from('schedule').upsert({ ... })
```

---

## 7. Banco de dados — Supabase

**Projeto:** `patyhelper`
**Project ID:** `hqarwygwxqmhnbgoxqvc`
**Região:** `us-west-2`
**URL:** `https://hqarwygwxqmhnbgoxqvc.supabase.co`
**PostgreSQL:** 17.6

---

### 7.1 Diagrama de relacionamentos

```
roles (1) ──────────────────────── (N) employees
                                         │
                                    ┌────┴────┐
                                    │         │
                               (N) schedule  (N) station_employees (N)
                                                      │
                                              stations (1) ──────────┘
```

Leitura:
- Um `role` tem muitos `employees`
- Um `employee` tem muitas entradas em `schedule` (uma por dia marcado)
- Um `employee` pode estar em muitas `stations` via `station_employees`
- Uma `station` pode ter muitos `employees` via `station_employees`

---

### 7.2 Schema completo

#### `roles` — Cargos

```sql
create table roles (
  id         serial primary key,
  name       text not null unique,          -- ex: 'Cozinheira', 'Garçom'
  sort_order integer not null default 0,    -- ordem de exibição na Escala e dropdowns
  created_at timestamptz default now()
);
```

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | serial PK | auto-increment |
| `name` | text UNIQUE | nome do cargo, exibido em todo lugar |
| `sort_order` | integer | define ordem na Escala (agrupamento por cargo) |
| `created_at` | timestamptz | nullable |

**Índices:** `roles_pkey` (btree id), `roles_name_key` (btree name — enforça UNIQUE)

---

#### `employees` — Funcionários

```sql
create table employees (
  id         serial primary key,
  name       text not null,
  role_id    integer references roles(id) on delete set null,
  initials   text not null,                 -- ex: 'MS' para Maria Silva
  type       text not null default 'efetivo'
             check (type in ('efetivo', 'temporario')),
  sort_order integer not null default 0,    -- ordem de exibição na Escala (arrastável)
  created_at timestamptz default now()
);
```

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | serial PK | |
| `name` | text | nome completo |
| `role_id` | integer FK → roles.id | `SET NULL` se o cargo for deletado |
| `initials` | text | 1-2 letras para o avatar |
| `type` | text CHECK | `'efetivo'` ou `'temporario'` |
| `sort_order` | integer | atualizado ao arrastar na aba Escala |
| `created_at` | timestamptz | nullable |

**Índices:** `employees_pkey` (btree id)

**Nota:** `role_id` pode ser NULL se o cargo for deletado (SET NULL). O frontend exibe a string do nome do cargo via join, não o ID.

---

#### `stations` — Praças do restaurante

```sql
create table stations (
  id         serial primary key,
  name       text not null,                 -- ex: 'Cozinha Quente'
  icon_key   text not null default 'flame', -- chave do mapa STATION_ICONS no frontend
  sort_order integer not null default 0,
  created_at timestamptz default now()
);
```

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | serial PK | |
| `name` | text | nome exibido |
| `icon_key` | text | referencia `STATION_ICONS` no frontend (ex: `'flame'`, `'snowflake'`, `'bell'`) |
| `sort_order` | integer | ordem de exibição |
| `created_at` | timestamptz | nullable |

**Índices:** `stations_pkey` (btree id)

**Ícones disponíveis:** `flame`, `snowflake`, `chefhat`, `coffee`, `wine`, `package`, `bell`, `utensils`, `pizza`, `store`, `truck`, `warehouse`, `creditcard`, `shopping`, `clipboard`, `wrench`, `star`, `home`, `users`, `utensils2`

---

#### `station_employees` — Relação N:N praças ↔ funcionários

```sql
create table station_employees (
  station_id  integer not null references stations(id)  on delete cascade,
  employee_id integer not null references employees(id) on delete cascade,
  sort_order  integer not null default 0,
  created_at  timestamptz default now(),
  primary key (station_id, employee_id)
);
```

| Coluna | Tipo | Notas |
|---|---|---|
| `station_id` | integer FK → stations.id | CASCADE delete |
| `employee_id` | integer FK → employees.id | CASCADE delete |
| `sort_order` | integer | ordem de exibição dentro da praça |
| `created_at` | timestamptz | nullable |

**Chave primária composta:** `(station_id, employee_id)` — garante que um funcionário não seja atribuído duas vezes à mesma praça.

**Índices:** `station_employees_pkey` (btree station_id, employee_id)

**Cascade:** se uma station ou employee for deletado, as linhas desta tabela são removidas automaticamente.

---

#### `schedule` — Marcações de folga e férias

```sql
create table schedule (
  id          serial primary key,
  employee_id integer not null references employees(id) on delete cascade,
  date        date not null,
  mark        text not null check (mark in ('folga', 'vacation')),
  created_at  timestamptz default now(),
  constraint schedule_employee_date_unique unique (employee_id, date)
);
```

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | serial PK | |
| `employee_id` | integer FK → employees.id | CASCADE delete |
| `date` | date | formato `YYYY-MM-DD` |
| `mark` | text CHECK | `'folga'` (um dia) ou `'vacation'` (range) |
| `created_at` | timestamptz | nullable |

**Constraint UNIQUE:** `(employee_id, date)` — um funcionário só pode ter uma marcação por dia. Upsert seguro.

**Índices:**
- `schedule_pkey` (btree id)
- `schedule_employee_date_unique` (btree employee_id, date)
- `schedule_employee_id_date_key` (btree employee_id, date) — índice duplicado criado automaticamente pela constraint UNIQUE, inofensivo

**Nota de férias:** férias são armazenadas como múltiplas linhas `mark='vacation'`, uma por dia do range. O frontend usa `buildRange(start, end, 'vacation')` para gerar e fazer upsert de todas as linhas de uma vez.

---

### 7.3 Row Level Security (RLS)

RLS está **habilitado** em todas as tabelas. As políticas atuais são **abertas** (sem autenticação) — preparadas para receber auth no futuro.

| Tabela | Política | Tipo | Roles | Comando | USING | WITH CHECK |
|---|---|---|---|---|---|---|
| `roles` | `allow_all_roles` | PERMISSIVE | public | ALL | `true` | `true` |
| `employees` | `allow_all_employees` | PERMISSIVE | public | ALL | `true` | `true` |
| `stations` | `allow_all_stations` | PERMISSIVE | public | ALL | `true` | `true` |
| `station_employees` | `allow_all_station_employees` | PERMISSIVE | public | ALL | `true` | `true` |
| `schedule` | `allow_all_schedule` | PERMISSIVE | public | ALL | `true` | `true` |

**Quando adicionar autenticação:** trocar `true` por `auth.uid() is not null` (ou lógica de ownership) em cada política. Nenhuma outra mudança estrutural necessária.

---

### 7.4 Permissões PostgreSQL (GRANT)

Ambos os roles `anon` e `authenticated` têm acesso completo a todas as tabelas e sequences:

```sql
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to anon, authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;
```

**Por que ambas as camadas importam:**
- **GRANT** = permissão do PostgreSQL no nível de tabela (sem isso, nem chega ao RLS)
- **RLS policy** = filtro de linha aplicado após o GRANT passar

---

### 7.5 Triggers

Nenhum trigger definido atualmente. Possíveis adições futuras:
- Trigger para limpar `station_employees` quando funcionário entra de férias
- Trigger para recalcular `sort_order` ao deletar uma linha

---

### 7.6 Migrações aplicadas (em ordem)

| Nome | O que fez |
|---|---|
| `initial_schema` | Criou todas as tabelas, RLS, políticas abertas, seed de dados demo |
| `multi_assign_stations_and_cleanup` | Criou `station_employees`, migrou `assigned_id` para a junction table, removeu `assigned_id` de `stations`, limpou dados seed, adicionou UNIQUE constraint em `schedule` |
| `grant_anon_access` | Concedeu GRANT de SELECT/INSERT/UPDATE/DELETE para `anon` e `authenticated` em todas as tabelas e sequences |

---

## 8. Padrões de código importantes

### Chamadas ao Supabase

Sempre use o padrão desestruturado com verificação de erro:

```ts
const { data, error } = await supabase.from('tabela').select('...')
if (error) throw error
```

Para joins, use a sintaxe de embed do Supabase:

```ts
// Busca employee com nome do cargo via join
supabase.from('employees').select('id, name, role_id, roles(name)')
```

### Upsert de schedule

Sempre use `upsert` (não `insert`) para evitar conflito na constraint `(employee_id, date)`:

```ts
await supabase.from('schedule').upsert(
  { employee_id: empId, date: dateISO, mark: 'folga' },
  // onConflict padrão funciona pela constraint UNIQUE
)
```

### Sort order de employees na Escala

Ao arrastar para reordenar, o frontend recalcula todos os `sort_order` e persiste via Promise.all:

```ts
arr.forEach((e, i) => { e.sort_order = i })
await Promise.all(arr.map(e =>
  supabase.from('employees').update({ sort_order: e.sort_order }).eq('id', e.id)
))
```

### Cores de avatar

Determinísticas pelo `id` do funcionário, nunca por posição na lista:

```ts
const getEmpColor = (id: number) => EMP_COLORS[(id - 1) % EMP_COLORS.length]
```

---

## 9. CSS e responsividade

O arquivo `PatyHelp.css` define o layout principal. Pontos de quebra:

| Breakpoint | Comportamento |
|---|---|
| `> 960px` | Layout completo: sidebar fixa + grid 4 colunas de métricas |
| `≤ 960px` | Métricas em 2 colunas, rows de 2:1:1 viram 1:1 |
| `≤ 768px` | Grid de praças e equipe vira 1 coluna |
| `≤ 640px` | Sidebar some, aparece nav mobile no rodapé, padding reduzido |
| `≤ 480px` | Coluna de nome na Escala reduz para 110px, row-211 vira coluna única |

A tabela da Escala usa `position: sticky` na primeira coluna para manter o nome do funcionário visível no scroll horizontal — classe `.ph-escala-name-col-td`.

---

## 10. Funcionalidades a desenvolver (backlog sugerido)

- [ ] **Autenticação** — Supabase Auth (email/password), trocar políticas RLS de `true` para `auth.uid() is not null`
- [ ] **Persistência de sort_order de praças** — arrastar praças na aba Praças
- [ ] **Notificações** — alertar quando praça fica sem cobertura
- [ ] **Exportar escala** — gerar PDF/Excel da escala do mês
- [ ] **Múltiplos restaurantes** — tabela `restaurants`, FK em todas as entidades
- [ ] **Histórico de ausências** — relatório de folgas e férias por período
- [ ] **Horários por funcionário** — adicionar campo `horario` em `employees` (ex: "15H20 às 23H45")
- [ ] **Matrícula** — campo `matricula` em `employees` para espelhar o Excel atual
