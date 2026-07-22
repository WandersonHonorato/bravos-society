import { StarsDisplay } from './Stars.jsx';

export default function PlayerList({ players, onDelete }) {
  const goalkeepers = players.filter((p) => p.isGoalkeeper);
  const outfield = players.filter((p) => !p.isGoalkeeper);

  const renderRow = (p) => (
    <li key={p.id} className="player-row">
      <div className="player-row-main">
        <span className="player-name">{p.name}</span>
        <StarsDisplay value={p.stars} />
      </div>
      <button className="icon-btn" title="Remover jogador" onClick={() => onDelete(p.id)}>
        ✕
      </button>
    </li>
  );

  return (
    <div className="card">
      <h3 className="card-title">
        Jogadores cadastrados <span className="count-badge">{players.length}</span>
      </h3>

      {players.length === 0 ? (
        <p className="empty-state">Nenhum jogador ainda. Cadastre o primeiro ao lado.</p>
      ) : (
        <>
          <h4 className="subheading">Goleiros ({goalkeepers.length})</h4>
          {goalkeepers.length === 0 ? (
            <p className="empty-state small">Nenhum goleiro cadastrado.</p>
          ) : (
            <ul className="player-list">{goalkeepers.map(renderRow)}</ul>
          )}

          <h4 className="subheading">Jogadores de linha ({outfield.length})</h4>
          {outfield.length === 0 ? (
            <p className="empty-state small">Nenhum jogador de linha cadastrado.</p>
          ) : (
            <ul className="player-list">{outfield.map(renderRow)}</ul>
          )}
        </>
      )}
    </div>
  );
}
