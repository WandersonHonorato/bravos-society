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

O projeto já está pronto para deploy, com a API Express rodando como
**Vercel Function** (detectada automaticamente a partir do arquivo
`api/index.js`) e o React buildado como site estático — usando a
configuração moderna e recomendada pela própria Vercel para esse tipo de
monorepo (mais simples e confiável do que a antiga `builds`/`routes`).

O `vercel.json` da raiz faz o seguinte:

```json
{
  "version": 2,
  "installCommand": "npm install --prefix client && npm install --prefix api",
  "buildCommand": "npm run build --prefix client",
  "outputDirectory": "client/dist",
  "functions": {
    "api/index.js": {
      "includeFiles": "api/node_modules/sql.js/dist/sql-wasm.wasm"
    }
  },
  "rewrites": [{ "source": "/api/:path*", "destination": "/api" }]
}
```

- `installCommand` instala as dependências da API e do frontend.
- `buildCommand` / `outputDirectory` fazem só o build do React (a API não
  precisa de build — o Vercel detecta e empacota `api/index.js`
  automaticamente como função, por estar dentro da pasta `api/`).
- `rewrites` manda todo `/api/*` para essa função, preservando a URL
  original — é assim que o Express, por dentro, continua enxergando cada
  rota (`/api/players`, `/api/draw`, etc.) normalmente.
- `functions.includeFiles` garante que o binário `.wasm` do `sql.js`
  (usado pelo SQLite) vá junto no pacote da função.

1. Suba este repositório no GitHub.
2. No Vercel, clique em **New Project** e importe o repositório.
3. Nas configurações do projeto:
   - **Root Directory**: em branco / raiz do repositório.
   - **Framework Preset**: pode deixar "Other" — o `vercel.json` cuida de
     tudo.
   - **Build and Output Settings**: pode deixar os campos em branco (o
     texto cinza ali é só um exemplo/placeholder) — o `vercel.json` na
     raiz sobrescreve esses campos automaticamente.
4. Clique em **Deploy**.

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
