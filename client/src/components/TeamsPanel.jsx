import { useState } from 'react';
import { StarsDisplay } from './Stars.jsx';

function teamStarTotal(team, playersById) {
  return team.playerIds.reduce((sum, id) => sum + (playersById[id]?.stars || 0), 0);
}

export default function TeamsPanel({ teams, players, reserves, onDraw, drawing, error }) {
  const [teamCount, setTeamCount] = useState(6);
  const [playersPerTeam, setPlayersPerTeam] = useState('');
  const [matchCount, setMatchCount] = useState('');

  const playersById = Object.fromEntries(players.map((p) => [p.id, p]));
  const parsedTeamCount = Number(teamCount) || 0;
  const canDraw = parsedTeamCount >= 2 && players.length >= parsedTeamCount;

  const handleDraw = () => {
    onDraw({
      teamCount: parsedTeamCount,
      playersPerTeam: playersPerTeam === '' ? null : Number(playersPerTeam),
      matchCount: matchCount === '' ? null : Number(matchCount),
    });
  };

  return (
    <div className="card">
      <div className="card-header-row">
        <h3 className="card-title">Sorteio dos times</h3>
      </div>

      <div className="draw-config">
        <label className="field draw-config-field">
          <span>Quantidade de times</span>
          <input
            type="number"
            min="2"
            max="20"
            value={teamCount}
            onChange={(e) => setTeamCount(e.target.value)}
          />
        </label>

        <label className="field draw-config-field">
          <span>Jogadores por time</span>
          <input
            type="number"
            min="1"
            value={playersPerTeam}
            onChange={(e) => setPlayersPerTeam(e.target.value)}
            placeholder="Automático"
          />
        </label>

        <label className="field draw-config-field">
          <span>Quantidade de partidas</span>
          <input
            type="number"
            min="1"
            value={matchCount}
            onChange={(e) => setMatchCount(e.target.value)}
            placeholder="Todos x todos"
          />
        </label>
      </div>

      <p className="hint">
        Deixe "Jogadores por time" em branco para distribuir todo mundo automaticamente, e
        "Quantidade de partidas" em branco para jogar todos os times contra todos (sem número
        fixo de jogos).
      </p>

      {!canDraw && (
        <p className="hint">
          Cadastre pelo menos {parsedTeamCount || 2} jogadores para sortear {parsedTeamCount || 2}{' '}
          times.
        </p>
      )}

      {error && <p className="error-text">{error}</p>}

      <button className="btn btn-primary" onClick={handleDraw} disabled={!canDraw || drawing}>
        {drawing ? 'Sorteando…' : teams.length ? 'Sortear novamente' : 'Sortear times'}
      </button>

      {teams.length === 0 ? (
        <p className="empty-state" style={{ marginTop: 14 }}>
          Os times ainda não foram sorteados. O sorteio distribui as estrelas de forma
          equilibrada entre os times automaticamente.
        </p>
      ) : (
        <>
          <div className="teams-grid" style={{ marginTop: 16 }}>
            {teams.map((team) => (
              <div key={team.id} className="team-tile">
                <div className="team-tile-header">
                  <span className="team-tile-name">{team.name}</span>
                  <span className="team-tile-stars">⭐ {teamStarTotal(team, playersById)}</span>
                </div>
                <ul className="team-tile-players">
                  {team.playerIds.map((id) => {
                    const p = playersById[id];
                    if (!p) return null;
                    return (
                      <li key={id}>
                        <span>
                          {p.name} {p.isGoalkeeper && <em className="gk-tag">GOL</em>}
                        </span>
                        <StarsDisplay value={p.stars} />
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>

          {reserves.length > 0 && (
            <div className="reserves-box">
              <h4 className="subheading">Reservas ({reserves.length})</h4>
              <ul className="team-tile-players">
                {reserves.map((id) => {
                  const p = playersById[id];
                  if (!p) return null;
                  return (
                    <li key={id}>
                      <span>
                        {p.name} {p.isGoalkeeper && <em className="gk-tag">GOL</em>}
                      </span>
                      <StarsDisplay value={p.stars} />
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
