// Fixed schedule for 6 teams, exactly as requested: 15 games, every team
// plays every other team once, with rest spread out evenly. Numbers are
// 1-indexed team numbers (Time 1 .. Time 6).
const FIXED_SCHEDULE_6 = [
  [1, 6], [2, 5], [3, 4],
  [1, 5], [6, 4], [2, 3],
  [1, 4], [5, 3], [6, 2],
  [1, 3], [4, 2], [5, 6],
  [1, 2], [3, 6], [4, 5],
];

const CHAMPION_LABELS = {
  1: 'Campeão',
  2: 'Vice-campeão',
  3: '3º lugar',
};
const LAST_PLACE_LABEL = "Vencendo em Cristo";

function roundRobinSchedule(teamCount) {
  if (teamCount === 6) return FIXED_SCHEDULE_6.map((p) => [...p]);

  // Generic circle method fallback for any other team count.
  const teams = Array.from({ length: teamCount }, (_, i) => i + 1);
  if (teams.length % 2 !== 0) teams.push(null); // bye
  const n = teams.length;
  const rounds = n - 1;
  const half = n / 2;
  const games = [];
  let arr = [...teams];
  for (let r = 0; r < rounds; r++) {
    for (let i = 0; i < half; i++) {
      const a = arr[i];
      const b = arr[n - 1 - i];
      if (a !== null && b !== null) games.push([a, b]);
    }
    arr = [arr[0], ...[arr[n - 1], ...arr.slice(1, n - 1)]];
  }
  return games;
}

/**
 * Builds the final list of fixtures. When `matchCount` is not given (or is
 * <= 0), every team plays every other team exactly once (a full
 * round-robin) — i.e. there's no fixed number of matches, the schedule is
 * whatever a complete tournament needs. When `matchCount` is given, the
 * full round-robin is truncated to that many games, or — if more games
 * than a single round-robin were requested — the fixtures repeat (a second
 * leg, third leg, etc.) until the count is reached.
 */
function buildSchedule(teamCount, matchCount) {
  const full = roundRobinSchedule(teamCount);
  if (!matchCount || matchCount <= 0) return full;
  if (matchCount <= full.length) return full.slice(0, matchCount);

  const games = [];
  for (let i = 0; i < matchCount; i++) {
    games.push(full[i % full.length]);
  }
  return games;
}

/**
 * Distributes players into `teamCount` teams so total stars per team stay
 * as close as possible, while keeping squad sizes even. Goalkeepers are
 * distributed the same way, separately, so each team gets one whenever
 * possible.
 *
 * If `playersPerTeam` is given, each team is capped at that size — any
 * players left over once every team is full are returned as `reserves`
 * instead of being forced onto a team. If it's omitted, every registered
 * player is distributed across the teams.
 */
function drawTeams(players, { teamCount = 6, playersPerTeam = null, matchCount = null } = {}) {
  const teams = Array.from({ length: teamCount }, (_, i) => ({
    id: `t${i + 1}`,
    name: `Time ${i + 1}`,
    playerIds: [],
  }));

  const teamStats = teams.map(() => ({ starSum: 0, count: 0, gkCount: 0 }));
  const reserves = [];

  const isFull = (idx) => playersPerTeam != null && teamStats[idx].count >= playersPerTeam;

  const assign = (player, { onlyGk } = {}) => {
    const candidates = teams
      .map((_, idx) => idx)
      .filter((idx) => !isFull(idx))
      .sort((a, b) => {
        const sa = teamStats[a];
        const sb = teamStats[b];
        if (onlyGk && sa.gkCount !== sb.gkCount) return sa.gkCount - sb.gkCount;
        if (sa.count !== sb.count) return sa.count - sb.count;
        return sa.starSum - sb.starSum;
      });

    if (candidates.length === 0) {
      reserves.push(player.id);
      return;
    }
    const idx = candidates[0];
    teams[idx].playerIds.push(player.id);
    teamStats[idx].starSum += player.stars;
    teamStats[idx].count += 1;
    if (player.isGoalkeeper) teamStats[idx].gkCount += 1;
  };

  const goalkeepers = players
    .filter((p) => p.isGoalkeeper)
    .sort((a, b) => b.stars - a.stars);
  const outfield = players
    .filter((p) => !p.isGoalkeeper)
    .sort((a, b) => b.stars - a.stars);

  goalkeepers.forEach((gk) => assign(gk, { onlyGk: true }));
  outfield.forEach((p) => assign(p));

  const schedulePairs = buildSchedule(teamCount, matchCount);
  const matches = schedulePairs.map(([a, b], idx) => ({
    id: `m${idx + 1}`,
    order: idx + 1,
    teamAId: `t${a}`,
    teamBId: `t${b}`,
    golsA: null,
    golsB: null,
    finished: false,
  }));

  return { teams, matches, reserves };
}

function computeStandings(teams, matches) {
  const table = {};
  teams.forEach((t) => {
    table[t.id] = {
      teamId: t.id,
      name: t.name,
      jogos: 0,
      vitorias: 0,
      empates: 0,
      derrotas: 0,
      golsPro: 0,
      golsContra: 0,
      saldo: 0,
      pontos: 0,
    };
  });

  matches
    .filter((m) => m.finished && m.golsA !== null && m.golsB !== null)
    .forEach((m) => {
      const a = table[m.teamAId];
      const b = table[m.teamBId];
      if (!a || !b) return;
      a.jogos += 1;
      b.jogos += 1;
      a.golsPro += m.golsA;
      a.golsContra += m.golsB;
      b.golsPro += m.golsB;
      b.golsContra += m.golsA;

      if (m.golsA > m.golsB) {
        a.vitorias += 1;
        a.pontos += 3;
        b.derrotas += 1;
      } else if (m.golsB > m.golsA) {
        b.vitorias += 1;
        b.pontos += 3;
        a.derrotas += 1;
      } else {
        a.empates += 1;
        b.empates += 1;
        a.pontos += 1;
        b.pontos += 1;
      }
    });

  Object.values(table).forEach((row) => {
    row.saldo = row.golsPro - row.golsContra;
  });

  const sorted = Object.values(table).sort((x, y) => {
    if (y.pontos !== x.pontos) return y.pontos - x.pontos;
    if (y.saldo !== x.saldo) return y.saldo - x.saldo;
    if (y.golsPro !== x.golsPro) return y.golsPro - x.golsPro;
    return x.name.localeCompare(y.name);
  });

  const allFinished = matches.length > 0 && matches.every((m) => m.finished);

  return sorted.map((row, idx) => ({
    ...row,
    posicao: idx + 1,
    destaque:
      allFinished && CHAMPION_LABELS[idx + 1]
        ? CHAMPION_LABELS[idx + 1]
        : allFinished && idx === sorted.length - 1
        ? LAST_PLACE_LABEL
        : null,
  }));
}

module.exports = { drawTeams, computeStandings, roundRobinSchedule, buildSchedule, LAST_PLACE_LABEL };
