function resultClass(match) {
  if (!match.finished || match.golsA === null || match.golsB === null) return '';
  if (match.golsA === match.golsB) return 'draw';
  return 'decided';
}

export default function Schedule({ matches, teamsById, onUpdate }) {
  if (matches.length === 0) {
    return (
      <div className="card">
        <h3 className="card-title">Jogos</h3>
        <p className="empty-state">Sorteie os times primeiro para gerar a tabela de jogos.</p>
      </div>
    );
  }

  const setScore = (match, side, value) => {
    const clean = value === '' ? null : Math.max(0, Number(value));
    onUpdate(match.id, { [side]: clean });
  };

  const toggleFinished = (match) => {
    if (match.golsA === null || match.golsB === null) return;
    onUpdate(match.id, { finished: !match.finished });
  };

  return (
    <div className="card">
      <h3 className="card-title">Jogos ({matches.length})</h3>
      <div className="match-list">
        {matches.map((match) => {
          const teamA = teamsById[match.teamAId];
          const teamB = teamsById[match.teamBId];
          return (
            <div key={match.id} className={`match-row ${resultClass(match)} ${match.finished ? 'finished' : ''}`}>
              <span className="match-order">#{match.order}</span>

              <div className="match-teams">
                <span className="match-team-name">{teamA?.name}</span>
                <div className="score-inputs">
                  <input
                    type="number"
                    min="0"
                    inputMode="numeric"
                    value={match.golsA ?? ''}
                    onChange={(e) => setScore(match, 'golsA', e.target.value)}
                    placeholder="-"
                  />
                  <span className="score-x">×</span>
                  <input
                    type="number"
                    min="0"
                    inputMode="numeric"
                    value={match.golsB ?? ''}
                    onChange={(e) => setScore(match, 'golsB', e.target.value)}
                    placeholder="-"
                  />
                </div>
                <span className="match-team-name">{teamB?.name}</span>
              </div>

              <button
                className={`btn btn-small ${match.finished ? 'btn-ghost' : 'btn-primary'}`}
                onClick={() => toggleFinished(match)}
                disabled={match.golsA === null || match.golsB === null}
                title={match.golsA === null || match.golsB === null ? 'Preencha o placar' : ''}
              >
                {match.finished ? 'Reabrir' : 'Encerrar'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
