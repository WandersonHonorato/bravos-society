import { useState } from 'react';
import { StarsPicker } from './Stars.jsx';

export default function PlayerForm({ onAdd }) {
  const [name, setName] = useState('');
  const [isGoalkeeper, setIsGoalkeeper] = useState(false);
  const [stars, setStars] = useState(3);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) {
      setError('Digite o nome do jogador.');
      return;
    }
    setSaving(true);
    try {
      await onAdd({ name, isGoalkeeper, stars });
      setName('');
      setIsGoalkeeper(false);
      setStars(3);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="card player-form" onSubmit={handleSubmit}>
      <h3 className="card-title">Cadastrar jogador</h3>

      <label className="field">
        <span>Nome</span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Lucas Mendes"
          maxLength={40}
        />
      </label>

      <label className="field checkbox-field">
        <input
          type="checkbox"
          checked={isGoalkeeper}
          onChange={(e) => setIsGoalkeeper(e.target.checked)}
        />
        <span>É goleiro</span>
      </label>

      <div className="field">
        <span>Nível (estrelas)</span>
        <StarsPicker value={stars} onChange={setStars} />
        {stars === 5 && <p className="hint gold">Craque do racha — 5 estrelas! ⭐</p>}
      </div>

      {error && <p className="error-text">{error}</p>}

      <button type="submit" className="btn btn-primary" disabled={saving}>
        {saving ? 'Salvando…' : 'Adicionar jogador'}
      </button>
    </form>
  );
}
