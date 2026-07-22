import { useEffect, useRef, useState } from 'react';

const PRESETS = [6, 8, 10, 12];
const RADIUS = 54;
const CIRC = 2 * Math.PI * RADIUS;

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const s = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, '0');
  return `${m}:${s}`;
}

export default function Timer() {
  const [minutes, setMinutes] = useState(8);
  const [secondsLeft, setSecondsLeft] = useState(8 * 60);
  const [running, setRunning] = useState(false);
  const [customMinutes, setCustomMinutes] = useState('');
  const intervalRef = useRef(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const total = minutes * 60;
  const progress = total === 0 ? 0 : secondsLeft / total;
  const offset = CIRC * (1 - progress);
  const finished = secondsLeft === 0;

  const choosePreset = (m) => {
    setRunning(false);
    setMinutes(m);
    setSecondsLeft(m * 60);
    setCustomMinutes('');
  };

  const applyCustom = () => {
    const m = Math.round(Number(customMinutes));
    if (!Number.isFinite(m) || m < 1 || m > 120) return;
    setRunning(false);
    setMinutes(m);
    setSecondsLeft(m * 60);
  };

  const reset = () => {
    setRunning(false);
    setSecondsLeft(minutes * 60);
  };

  return (
    <div className="card timer-card">
      <h3 className="card-title">Tempo de jogo</h3>

      <div className={`timer-ring ${finished ? 'finished' : ''}`}>
        <svg viewBox="0 0 120 120">
          <circle className="timer-track" cx="60" cy="60" r={RADIUS} />
          <circle
            className="timer-progress"
            cx="60"
            cy="60"
            r={RADIUS}
            strokeDasharray={CIRC}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="timer-readout">
          <span className="timer-time">{formatTime(secondsLeft)}</span>
          <span className="timer-label">{finished ? 'Fim!' : running ? 'jogando' : 'pausado'}</span>
        </div>
      </div>

      <div className="timer-presets">
        {PRESETS.map((m) => (
          <button
            key={m}
            className={`chip ${minutes === m && customMinutes === '' ? 'chip-active' : ''}`}
            onClick={() => choosePreset(m)}
          >
            {m} min
          </button>
        ))}
      </div>

      <div className="timer-custom">
        <input
          type="number"
          min="1"
          max="120"
          placeholder="Outro tempo (min)"
          value={customMinutes}
          onChange={(e) => setCustomMinutes(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && applyCustom()}
        />
        <button className="btn btn-ghost btn-small" onClick={applyCustom}>
          Definir
        </button>
      </div>

      <div className="timer-controls">
        <button
          className="btn btn-primary"
          onClick={() => {
            if (secondsLeft === 0) {
              setSecondsLeft(minutes * 60);
              setRunning(true);
            } else {
              setRunning((r) => !r);
            }
          }}
        >
          {running ? 'Pausar' : secondsLeft === 0 ? 'Reiniciar' : 'Começar'}
        </button>
        <button className="btn btn-ghost" onClick={reset}>
          Zerar
        </button>
      </div>
    </div>
  );
}
