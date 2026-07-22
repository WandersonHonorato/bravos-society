const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.error || 'Erro inesperado ao falar com o servidor.');
  }
  return data;
}

export const api = {
  getState: () => request('/state'),
  getPlayers: () => request('/players'),
  addPlayer: (payload) => request('/players', { method: 'POST', body: JSON.stringify(payload) }),
  updatePlayer: (id, payload) =>
    request(`/players/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deletePlayer: (id) => request(`/players/${id}`, { method: 'DELETE' }),
  draw: (config) => request('/draw', { method: 'POST', body: JSON.stringify(config) }),
  getStandings: () => request('/standings'),
  updateMatch: (id, payload) =>
    request(`/matches/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  reset: (scope) => request('/reset', { method: 'POST', body: JSON.stringify({ scope }) }),
};
