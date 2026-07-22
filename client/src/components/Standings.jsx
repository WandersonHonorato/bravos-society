const BADGE_CLASS = {
  'Campeão': 'badge-gold',
  'Vice-campeão': 'badge-silver',
  '3º lugar': 'badge-bronze',
  "Vencendo em Cristo": 'badge-faith',
};

export default function Standings({ standings }) {
  if (standings.length === 0) {
    return (
      <div className="card">
        <h3 className="card-title">Classificação</h3>
        <p className="empty-state">Sorteie os times para ver a tabela de classificação.</p>
      </div>
    );
  }

  const champion = standings.find((r) => r.destaque === 'Campeão');

  return (
    <div className="card">
      <h3 className="card-title">Classificação</h3>

      {champion && (
        <div className="champion-banner">
          🏆 <strong>{champion.name}</strong> é o grande campeão do racha Bravo's!
        </div>
      )}

      <div className="table-scroll">
        <table className="standings-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Time</th>
              <th>P</th>
              <th>J</th>
              <th>V</th>
              <th>E</th>
              <th>D</th>
              <th>GP</th>
              <th>GC</th>
              <th>SG</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((row) => (
              <tr key={row.teamId} className={row.destaque ? 'highlight-row' : ''}>
                <td>{row.posicao}</td>
                <td>
                  <span className="team-cell">
                    {row.name}
                    {row.destaque && (
                      <span className={`badge ${BADGE_CLASS[row.destaque] || ''}`}>{row.destaque}</span>
                    )}
                  </span>
                </td>
                <td className="pontos-cell">{row.pontos}</td>
                <td>{row.jogos}</td>
                <td>{row.vitorias}</td>
                <td>{row.empates}</td>
                <td>{row.derrotas}</td>
                <td>{row.golsPro}</td>
                <td>{row.golsContra}</td>
                <td>{row.saldo}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="hint small">
        Vitória = 3 pontos · Empate = 1 ponto · Derrota = 0 ponto. O último colocado recebe
        carinhosamente o troféu "Vencendo em Cristo" 🙏
      </p>
    </div>
  );
}
