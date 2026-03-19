# 🍽️ Paty Help

Sistema de gestão de equipe e praças para restaurante.

---

## 📋 Estrutura do projeto

```
paty-help/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
└── src/
    ├── main.tsx
    ├── App.tsx
    └── pages/
        └── PatyHelp.tsx   ← componente principal
```

---

## 🚀 Como rodar (passo a passo)

### 1. Instale o Node.js (se ainda não tiver)
Acesse https://nodejs.org e baixe a versão **LTS** (recomendada).

### 2. Abra o terminal na pasta do projeto
- No Windows: clique com botão direito na pasta → "Abrir no Terminal"
- No Mac: clique com botão direito na pasta → "Novo Terminal na Pasta"

### 3. Instale as dependências
```bash
npm install
```
> Isso vai baixar tudo que o projeto precisa. Pode demorar 1-2 minutos na primeira vez.

### 4. Rode o projeto
```bash
npm run dev
```

### 5. Abra no navegador
Acesse: **http://localhost:5173**

Para ver no celular (na mesma rede Wi-Fi):
O terminal vai mostrar um endereço parecido com `http://192.168.x.x:5173` — acesse esse endereço no celular.

---

## 📦 Gerar versão final (para publicar)
```bash
npm run build
```
Os arquivos finais ficam na pasta `dist/`.

---

## 🛠️ Dependências utilizadas

| Pacote | Para quê serve |
|---|---|
| `react` + `react-dom` | Base do projeto |
| `recharts` | Gráficos (pizza e barras) |
| `vite` | Servidor de desenvolvimento rápido |
| `typescript` | Tipagem do código |

---

## ✏️ Como personalizar

### Trocar os funcionários iniciais
Abra `src/pages/PatyHelp.tsx` e edite o array `INITIAL_EMPLOYEES`:
```ts
const INITIAL_EMPLOYEES = [
  { id: 1, name: 'Nome da Pessoa', role: 'Cargo', initials: 'NP', onDayOff: false },
  // ...
]
```

### Trocar as praças iniciais
Edite o array `INITIAL_STATIONS` no mesmo arquivo:
```ts
const INITIAL_STATIONS = [
  { id: 1, name: 'Nome da Praça', emoji: '🔥', assignedId: null },
  // ...
]
```

### Trocar as cores
Edite o objeto `COLORS` no topo do arquivo `PatyHelp.tsx`.
