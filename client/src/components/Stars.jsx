export function StarsDisplay({ value }) {
  return (
    <span className="stars" aria-label={`${value} de 5 estrelas`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= value ? 'star filled' : 'star'}>
          ★
        </span>
      ))}
    </span>
  );
}

export function StarsPicker({ value, onChange }) {
  return (
    <div className="stars-picker" role="radiogroup" aria-label="Nível de estrelas">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          type="button"
          key={n}
          role="radio"
          aria-checked={value === n}
          className={n <= value ? 'star-btn filled' : 'star-btn'}
          onClick={() => onChange(n)}
        >
          ★
        </button>
      ))}
    </div>
  );
}
