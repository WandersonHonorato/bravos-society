# Bravo's — Sistema do Racha da Igreja ⚽🙏

Sistema simples e responsivo para organizar o racha de futebol society "Bravo's":
cadastro de jogadores e goleiros com nível de 1 a 5 estrelas, temporizador de
partida, sorteio automático e equilibrado dos 6 times, tabela de jogos com
placar e classificação final com Campeão, Vice, 3º lugar e o troféu
"Vencendo em Cristo" para o último colocado.

## Estrutura do projeto

```
bravos/
├── api/            → Backend em Express (rotas em /api/*)
│   ├── index.js       → App Express com todas as rotas
│   ├── draw.js        → Lógica de sorteio balanceado e tabela de jogos
│   ├── db.js          → Conexão com o banco SQLite (via sql.js/WASM)
│   ├── repository.js  → Funções de CRUD (players, teams, matches) em SQL
│   ├── data/          → Onde o arquivo bravos.sqlite fica salvo localmente
│   └── server.js      → Ponto de entrada para rodar localmente
├── client/         → Frontend em React (Vite)
│   └── src/
│       ├── App.jsx
│       └── components/
├── vercel.json     → Configuração de deploy (API + estático juntos)
└── package.json
```

## Como funciona

- **Jogadores**: cadastre nome, se é goleiro e o nível de 1 a 5 estrelas.
- **Sorteio**: você escolhe a **quantidade de times**, e opcionalmente
  **quantos jogadores por time** e **quantas partidas** quer jogar:
  - Se deixar "jogadores por time" em branco, todo mundo cadastrado é
    distribuído nos times automaticamente (o mais equilibrado possível).
    Se preencher, cada time é limitado a esse tamanho e quem sobrar fica
    listado como "reserva".
  - Se deixar "quantidade de partidas" em branco, o sistema entende que
    não há um número fixo — gera automaticamente todos os times contra
    todos (turno único). Se preencher um número, usa só essa quantidade de
    jogos (ou repete os confrontos formando mais rodadas, se pedir mais
    jogos do que "todos contra todos" já dá).
  - A soma de estrelas é sempre equilibrada entre os times e os goleiros
    são distribuídos um por time sempre que possível.
- **Temporizador**: cronômetro regressivo estilo placar de estádio, com
  atalhos de 6/8/10/12 minutos e um campo para digitar **qualquer outro
  tempo** (1 a 120 minutos), para controlar o tempo de cada partida.
- **Jogos**: ao sortear, a tabela de 15 jogos (todos os times entre si) é
  gerada automaticamente na ordem pedida. Basta preencher o placar e clicar
  em "Encerrar" para consolidar o resultado.
- **Classificação**: calculada automaticamente a cada resultado —
  Vitória = 3 pontos, Empate = 1 ponto, Derrota = 0 ponto. Quando todos os
  15 jogos forem encerrados, o 1º colocado vira "Campeão", o 2º
  "Vice-campeão", o 3º "3º lugar" e o último recebe o troféu simbólico
  "Vencendo em Cristo".

## Rodando localmente

Em dois terminais separados:

```bash
# Terminal 1 — API (porta 4000)
cd api
npm install
npm run dev

# Terminal 2 — Frontend (porta 5173, com proxy para a API)
cd client
npm install
npm run dev
```

Acesse `http://localhost:5173`.

## Deploy no Vercel

O projeto já está pronto para deploy, com a API Express rodando como função
serverless e o React como build estático, tudo servido no mesmo domínio.

1. Suba este repositório no GitHub.
2. No Vercel, clique em **New Project** e importe o repositório.
3. O `vercel.json` na raiz já configura tudo — não é necessário alterar o
   "Framework Preset" nem os comandos de build manualmente. Só confira,
   nas configurações do projeto:
   - **Root Directory**: deve ficar em branco / apontando para a raiz do
     repositório (não para `client` nem `api`).
   - **Framework Preset**: pode deixar como "Other" — o `vercel.json` já
     cuida do build do front e da API.
4. Clique em **Deploy**.

> Se aparecer **404: NOT_FOUND** na página inicial depois do deploy, é
> quase sempre porque as rotas do `vercel.json` não têm a fase
> `{ "handle": "filesystem" }` antes do fallback — sem ela, o Vercel para
> de servir os arquivos estáticos automaticamente e a rota `/` cai num
> caminho que não existe. Esse arquivo já vem com a correção; só
> reimplante se algum dia editar o `vercel.json` manualmente.

Ou via CLI, na raiz do projeto:

```bash
npm i -g vercel
vercel
```

### 🗄️ Banco de dados: SQLite via sql.js

Os dados (jogadores, times, jogos) agora ficam num banco **SQLite** de
verdade, com tabelas próprias (`players`, `teams`, `team_players`,
`matches`, `meta`) em vez de um arquivo JSON solto.

O banco é acessado com **[sql.js](https://github.com/sql-js/sql.js)**, uma
versão do SQLite compilada para WASM — de propósito, em vez do
`better-sqlite3`/`sqlite3` tradicionais, que exigem compilar um módulo
nativo na hora do `npm install` (é a mesma dor de cabeça de
incompatibilidade de `GLIBC` que você já resolveu no Rosa D'água trocando
para `sql.js` por lá). Com `sql.js` não tem `node-gyp`, não tem binário
nativo: funciona igual no seu computador, no Hostinger e no Vercel.

O arquivo do banco fica em:
- `api/data/bravos.sqlite` quando roda localmente (`npm run dev`);
- `/tmp/bravos.sqlite` quando roda no Vercel.

**⚠️ Importante sobre o Vercel:** funções serverless são efêmeras — depois
de um tempo sem uso, a instância pode reiniciar e o `/tmp` é limpo,
zerando o banco. Para o uso do dia a dia (cadastrar os jogadores e rodar o
racha na mesma sessão/tarde) isso não costuma ser um problema, já que a
instância fica "quente" durante o uso. Se quiser persistência permanente
entre reinícios no Vercel, as opções mais simples são:

- **[Turso](https://turso.tech)** — SQLite hospedado na nuvem, API bem
  parecida com a que já está aqui;
- **Vercel Postgres** ou **Supabase** (Postgres gerenciado, com plano
  gratuito).

Nesses casos, só é preciso trocar as queries de `api/db.js` /
`api/repository.js` pelo client do serviço escolhido — as rotas em
`api/index.js`, a lógica de sorteio e o cálculo de classificação não
precisam mudar.

## Licença

Uso livre para a igreja e a comunidade do racha. Que vença o melhor time —
e que o último lugar vença em Cristo. 🙌
