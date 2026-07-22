const { getDb, persist, run, all, get } = require('./db');

const uid = () => Math.random().toString(36).slice(2, 10);

function mapPlayer(row) {
  return {
    id: row.id,
    name: row.name,
    isGoalkeeper: !!row.is_goalkeeper,
    stars: row.stars,
    createdAt: row.created_at,
  };
}

function mapMatch(row) {
  return {
    id: row.id,
    order: row.order_num,
    teamAId: row.team_a_id,
    teamBId: row.team_b_id,
    golsA: row.gols_a === undefined ? null : row.gols_a,
    golsB: row.gols_b === undefined ? null : row.gols_b,
    finished: !!row.finished,
  };
}

// ---------- Players ----------
async function listPlayers() {
  const db = await getDb();
  return all(db, 'SELECT * FROM players ORDER BY created_at ASC').map(mapPlayer);
}

async function addPlayer({ name, isGoalkeeper, stars }) {
  const db = await getDb();
  const player = {
    id: uid(),
    name: name.trim(),
    isGoalkeeper: !!isGoalkeeper,
    stars,
    createdAt: new Date().toISOString(),
  };
  run(
    db,
    'INSERT INTO players (id, name, is_goalkeeper, stars, created_at) VALUES (?, ?, ?, ?, ?)',
    [player.id, player.name, player.isGoalkeeper ? 1 : 0, player.stars, player.createdAt]
  );
  persist(db);
  return player;
}

async function updatePlayer(id, patch) {
  const db = await getDb();
  const existing = get(db, 'SELECT * FROM players WHERE id = ?', [id]);
  if (!existing) return null;

  const name = patch.name !== undefined ? patch.name.trim() : existing.name;
  const isGoalkeeper =
    patch.isGoalkeeper !== undefined ? (patch.isGoalkeeper ? 1 : 0) : existing.is_goalkeeper;
  const stars = patch.stars !== undefined ? patch.stars : existing.stars;

  run(db, 'UPDATE players SET name = ?, is_goalkeeper = ?, stars = ? WHERE id = ?', [
    name,
    isGoalkeeper,
    stars,
    id,
  ]);
  persist(db);
  return mapPlayer(get(db, 'SELECT * FROM players WHERE id = ?', [id]));
}

async function deletePlayer(id) {
  const db = await getDb();
  const existing = get(db, 'SELECT id FROM players WHERE id = ?', [id]);
  if (!existing) return false;
  run(db, 'DELETE FROM players WHERE id = ?', [id]);
  persist(db);
  return true;
}

// ---------- Draw (teams + schedule) ----------
async function saveDraw(teams, matches) {
  const db = await getDb();

  try {
    db.run('BEGIN TRANSACTION');
    db.run('DELETE FROM team_players');
    db.run('DELETE FROM teams');
    db.run('DELETE FROM matches');

    const teamStmt = db.prepare('INSERT INTO teams (id, name) VALUES (?, ?)');
    teams.forEach((t) => {
      teamStmt.run([t.id, t.name]);
    });
    teamStmt.free();

    const teamPlayerStmt = db.prepare(
      'INSERT INTO team_players (team_id, player_id) VALUES (?, ?)'
    );
    teams.forEach((t) => {
      t.playerIds.forEach((pid) => {
        teamPlayerStmt.run([t.id, pid]);
      });
    });
    teamPlayerStmt.free();

    const matchStmt = db.prepare(
      'INSERT INTO matches (id, order_num, team_a_id, team_b_id, gols_a, gols_b, finished) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    matches.forEach((m) => {
      matchStmt.run([m.id, m.order, m.teamAId, m.teamBId, m.golsA, m.golsB, m.finished ? 1 : 0]);
    });
    matchStmt.free();

    db.run('INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)', [
      'drawnAt',
      new Date().toISOString(),
    ]);

    db.run('COMMIT');
  } catch (err) {
    try {
      db.run('ROLLBACK');
    } catch (rollbackErr) {
      console.error('Falha ao reverter transação do sorteio:', rollbackErr);
    }
    console.error('Falha ao salvar o sorteio:', err && err.stack ? err.stack : err);
    throw err;
  }
  persist(db);
}

async function listTeams() {
  const db = await getDb();
  const teams = all(db, 'SELECT * FROM teams ORDER BY id ASC');
  const links = all(db, 'SELECT * FROM team_players');
  return teams.map((t) => ({
    id: t.id,
    name: t.name,
    playerIds: links.filter((l) => l.team_id === t.id).map((l) => l.player_id),
  }));
}

// ---------- Matches ----------
async function listMatches() {
  const db = await getDb();
  return all(db, 'SELECT * FROM matches ORDER BY order_num ASC').map(mapMatch);
}

async function updateMatch(id, patch) {
  const db = await getDb();
  const existing = get(db, 'SELECT * FROM matches WHERE id = ?', [id]);
  if (!existing) return null;

  const golsA = patch.golsA !== undefined ? patch.golsA : existing.gols_a;
  const golsB = patch.golsB !== undefined ? patch.golsB : existing.gols_b;
  const finished =
    patch.finished !== undefined ? (patch.finished ? 1 : 0) : existing.finished;

  run(db, 'UPDATE matches SET gols_a = ?, gols_b = ?, finished = ? WHERE id = ?', [
    golsA,
    golsB,
    finished,
    id,
  ]);
  persist(db);
  return mapMatch(get(db, 'SELECT * FROM matches WHERE id = ?', [id]));
}

// ---------- Meta / reset ----------
async function getDrawnAt() {
  const db = await getDb();
  const row = get(db, "SELECT value FROM meta WHERE key = 'drawnAt'");
  return row ? row.value : null;
}

async function resetAll(scope) {
  const db = await getDb();
  if (scope === 'matches') {
    run(db, 'UPDATE matches SET gols_a = NULL, gols_b = NULL, finished = 0');
  } else if (scope === 'teams') {
    run(db, 'DELETE FROM team_players');
    run(db, 'DELETE FROM teams');
    run(db, 'DELETE FROM matches');
    run(db, "DELETE FROM meta WHERE key = 'drawnAt'");
  } else {
    run(db, 'DELETE FROM players');
    run(db, 'DELETE FROM team_players');
    run(db, 'DELETE FROM teams');
    run(db, 'DELETE FROM matches');
    run(db, "DELETE FROM meta WHERE key = 'drawnAt'");
  }
  persist(db);
}

module.exports = {
  listPlayers,
  addPlayer,
  updatePlayer,
  deletePlayer,
  saveDraw,
  listTeams,
  listMatches,
  updateMatch,
  getDrawnAt,
  resetAll,
};
