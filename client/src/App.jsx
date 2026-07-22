import { useEffect, useState } from 'react';
import { api } from './api.js';
import PlayerForm from './components/PlayerForm.jsx';
import PlayerList from './components/PlayerList.jsx';
import Timer from './components/Timer.jsx';
import TeamsPanel from './components/TeamsPanel.jsx';
import Schedule from './components/Schedule.jsx';
import Standings from './components/Standings.jsx';

const TABS = [
  { id: 'jogadores', label: 'Jogadores' },
  { id: 'times', label: 'Sorteio & Times' },
  { id: 'jogos', label: 'Jogos' },
  { id: 'classificacao', label: 'Classificação' },
];

export default function App() {
  const [tab, setTab] = useState('jogadores');
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [matches, setMatches] = useState([]);
  const [reserves, setReserves] = useState([]);
  const [standings, setStandings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawing, setDrawing] = useState(false);
  const [error, setError] = useState('');

  const loadState = async () => {
    const state = await api.getState();
    setPlayers(state.players);
    setTeams(state.teams);
    setMatches(state.matches);
    setReserves(state.reserves || []);
    setStandings(state.standings);
  };

  useEffect(() => {
    loadState()
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleAddPlayer = async (payload) => {
    const player = await api.addPlayer(payload);
    setPlayers((prev) => [...prev, player]);
  };

  const handleDeletePlayer = async (id) => {
    await api.deletePlayer(id);
    setPlayers((prev) => prev.filter((p) => p.id !== id));
  };

  const handleDraw = async (config) => {
    setDrawing(true);
    setError('');
    try {
      const { teams: newTeams, matches: newMatches, reserves: newReserves } = await api.draw(config);
      setTeams(newTeams);
      setMatches(newMatches);
      setReserves(newReserves || []);
      setStandings(await api.getStandings());
      setTab('times');
    } catch (err) {
      setError(err.message);
    } finally {
      setDrawing(false);
    }
  };

  const handleUpdateMatch = async (id, payload) => {
    const updated = await api.updateMatch(id, payload);
    setMatches((prev) => prev.map((m) => (m.id === id ? updated : m)));
    setStandings(await api.getStandings());
  };

  const teamsById = Object.fromEntries(teams.map((t) => [t.id, t]));

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <span className="brand-mark">⚽</span>
          <div>
            <h1>
              Bravo's <span className="brand-sub">Racha da Igreja</span>
            </h1>
          </div>
        </div>
        <nav className="tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`tab-btn ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      {error && (
        <div className="alert-error">
          {error}
          <button onClick={() => setError('')}>✕</button>
        </div>
      )}

      <main className="app-main">
        {loading ? (
          <p className="loading-state">Carregando…</p>
        ) : (
          <>
            {tab === 'jogadores' && (
              <div className="grid-two">
                <PlayerForm onAdd={handleAddPlayer} />
                <PlayerList players={players} onDelete={handleDeletePlayer} />
              </div>
            )}

            {tab === 'times' && (
              <div className="grid-two reverse-on-mobile">
                <TeamsPanel
                  teams={teams}
                  players={players}
                  reserves={reserves}
                  onDraw={handleDraw}
                  drawing={drawing}
                  error={error}
                />
                <Timer />
              </div>
            )}

            {tab === 'jogos' && (
              <div className="grid-two">
                <Schedule matches={matches} teamsById={teamsById} onUpdate={handleUpdateMatch} />
                <Timer />
              </div>
            )}

            {tab === 'classificacao' && <Standings standings={standings} />}
          </>
        )}
      </main>

      <footer className="app-footer">Bravo's · Racha de futebol society ⚽🙏</footer>
    </div>
  );
}
