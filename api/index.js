const express = require('express');
const cors = require('cors');
const repo = require('./_lib/repository');
const { drawTeams, computeStandings } = require('./_lib/draw');

// Last-resort logging: if something throws or rejects outside of any
// route's promise chain, log it with full detail before the process goes
// down, so Vercel's runtime logs show the real cause instead of just
// "FUNCTION_INVOCATION_FAILED".
process.on('unhandledRejection', (reason) => {
  console.error('unhandledRejection:', reason && reason.stack ? reason.stack : reason);
});
process.on('uncaughtException', (err) => {
  console.error('uncaughtException:', err && err.stack ? err.stack : err);
});

const app = express();
app.use(cors());

// Vercel's Node.js runtime automatically parses JSON request bodies before
// Express ever sees the request. If we also run express.json() on top of
// that, it tries to read the (already-drained) request stream a second
// time, which hangs until the function times out — this is what was
// causing "Erro inesperado ao falar com o servidor" on every POST (sortear,
// cadastrar jogador, atualizar placar) once deployed, while GETs worked
// fine. So: if Vercel already handed us a parsed object, use it as-is;
// otherwise (local `node server.js`, `vercel dev`, etc.) let Express parse
// it normally.
app.use((req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    return next();
  }
  express.json()(req, res, next);
});

// Wraps async route handlers so thrown/rejected errors reach Express's
// error handler instead of crashing the process.
const wrap = (fn) => (req, res, next) => fn(req, res, next).catch(next);

// ---------- Players ----------
app.get(
  '/api/players',
  wrap(async (req, res) => {
    res.json(await repo.listPlayers());
  })
);

app.post(
  '/api/players',
  wrap(async (req, res) => {
    const { name, isGoalkeeper, stars } = req.body || {};
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Nome do jogador é obrigatório.' });
    }
    const parsedStars = Number(stars);
    if (!Number.isInteger(parsedStars) || parsedStars < 1 || parsedStars > 5) {
      return res.status(400).json({ error: 'Estrelas deve ser um número inteiro de 1 a 5.' });
    }
    const player = await repo.addPlayer({ name, isGoalkeeper, stars: parsedStars });
    res.status(201).json(player);
  })
);

app.put(
  '/api/players/:id',
  wrap(async (req, res) => {
    const { name, isGoalkeeper, stars } = req.body || {};
    if (stars !== undefined) {
      const parsedStars = Number(stars);
      if (!Number.isInteger(parsedStars) || parsedStars < 1 || parsedStars > 5) {
        return res.status(400).json({ error: 'Estrelas deve ser um número inteiro de 1 a 5.' });
      }
    }
    const updated = await repo.updatePlayer(req.params.id, { name, isGoalkeeper, stars });
    if (!updated) return res.status(404).json({ error: 'Jogador não encontrado.' });
    res.json(updated);
  })
);

app.delete(
  '/api/players/:id',
  wrap(async (req, res) => {
    const deleted = await repo.deletePlayer(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Jogador não encontrado.' });
    res.status(204).end();
  })
);

// ---------- Draw (sorteio) ----------
app.post(
  '/api/draw',
  wrap(async (req, res) => {
    const teamCount = Number(req.body?.teamCount) || 6;
    const rawPlayersPerTeam = req.body?.playersPerTeam;
    const playersPerTeam =
      rawPlayersPerTeam === undefined || rawPlayersPerTeam === null || rawPlayersPerTeam === ''
        ? null
        : Number(rawPlayersPerTeam);
    const rawMatchCount = req.body?.matchCount;
    const matchCount =
      rawMatchCount === undefined || rawMatchCount === null || rawMatchCount === ''
        ? null
        : Number(rawMatchCount);

    if (!Number.isInteger(teamCount) || teamCount < 2) {
      return res.status(400).json({ error: 'Escolha pelo menos 2 times.' });
    }
    if (playersPerTeam !== null && (!Number.isInteger(playersPerTeam) || playersPerTeam < 1)) {
      return res.status(400).json({ error: 'Jogadores por time deve ser um número inteiro maior que zero.' });
    }
    if (matchCount !== null && (!Number.isInteger(matchCount) || matchCount < 1)) {
      return res.status(400).json({ error: 'Quantidade de partidas deve ser um número inteiro maior que zero.' });
    }

    const players = await repo.listPlayers();
    const minNeeded = playersPerTeam ? teamCount * playersPerTeam : teamCount;

    if (players.length < minNeeded) {
      return res.status(400).json({
        error: playersPerTeam
          ? `Cadastre pelo menos ${minNeeded} jogadores para formar ${teamCount} times de ${playersPerTeam}.`
          : `Cadastre pelo menos ${teamCount} jogadores para formar ${teamCount} times.`,
      });
    }

    const { teams, matches, reserves } = drawTeams(players, { teamCount, playersPerTeam, matchCount });
    await repo.saveDraw(teams, matches);
    res.json({ teams, matches, reserves });
  })
);

app.get(
  '/api/teams',
  wrap(async (req, res) => {
    res.json(await repo.listTeams());
  })
);

// ---------- Matches ----------
app.get(
  '/api/matches',
  wrap(async (req, res) => {
    res.json(await repo.listMatches());
  })
);

app.put(
  '/api/matches/:id',
  wrap(async (req, res) => {
    const { golsA, golsB, finished } = req.body || {};
    const patch = {};
    if (golsA !== undefined) patch.golsA = golsA === null ? null : Math.max(0, Number(golsA));
    if (golsB !== undefined) patch.golsB = golsB === null ? null : Math.max(0, Number(golsB));
    if (finished !== undefined) patch.finished = !!finished;

    const updated = await repo.updateMatch(req.params.id, patch);
    if (!updated) return res.status(404).json({ error: 'Partida não encontrada.' });
    res.json(updated);
  })
);

// ---------- Standings ----------
app.get(
  '/api/standings',
  wrap(async (req, res) => {
    const teams = await repo.listTeams();
    const matches = await repo.listMatches();
    res.json(computeStandings(teams, matches));
  })
);

// ---------- Full state / reset ----------
app.get(
  '/api/state',
  wrap(async (req, res) => {
    const players = await repo.listPlayers();
    const teams = await repo.listTeams();
    const matches = await repo.listMatches();
    const drawnAt = await repo.getDrawnAt();
    const assignedIds = new Set(teams.flatMap((t) => t.playerIds));
    const reserves = teams.length ? players.filter((p) => !assignedIds.has(p.id)).map((p) => p.id) : [];
    res.json({
      players,
      teams,
      matches,
      reserves,
      standings: computeStandings(teams, matches),
      drawnAt,
    });
  })
);

app.post(
  '/api/reset',
  wrap(async (req, res) => {
    const { scope } = req.body || {};
    await repo.resetAll(scope);
    res.json({ ok: true });
  })
);

app.get('/api/health', (req, res) => res.json({ ok: true }));

// Central error handler for anything thrown in the async routes above.
app.use((err, req, res, next) => {
  console.error('Erro na rota', req.method, req.path, ':', err && err.stack ? err.stack : err);
  res.status(500).json({ error: 'Erro interno no servidor.' });
});

module.exports = app;
