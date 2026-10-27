import { DIFFICULTIES, percent, rub, type DifficultyId } from '@/lib/game';
import { Check, Clock3, Wallet } from 'lucide-react';

export function DifficultyBars({ level }: { level: DifficultyId }) {
  const count = level === 'first' ? 1 : level === 'balance' ? 2 : level === 'challenge' ? 3 : 4;
  return (
    <span className="difficulty-bars" aria-hidden="true">
      {[1, 2, 3, 4].map((n) => (
        <i className={n <= count ? 'filled' : ''} key={n} />
      ))}
    </span>
  );
}

export function DifficultyPicker({
  value,
  onChange,
}: {
  value: DifficultyId;
  onChange: (settings: DifficultyId) => void;
}) {
  const selected = DIFFICULTIES[value];
  return (
    <>
      <fieldset className="difficulty-picker">
        <legend>Сложность</legend>
        <p>Сложность нельзя изменить после старта.</p>
        <div className="difficulty-options">
          {(Object.entries(DIFFICULTIES) as [DifficultyId, typeof selected][]).map(([id, d]) => (
            <label className={'difficulty-option ' + (value === id ? 'selected' : '')} key={id}>
              <input
                type="radio"
                name="difficulty"
                value={id}
                checked={value === id}
                onChange={() => onChange(id)}
              />
              <span className="difficulty-option-head">
                <DifficultyBars level={id} />
                <span className="difficulty-check">{value === id && <Check size={12} />}</span>
              </span>
              <strong>{d.name}</strong>
              <span className="difficulty-label">{d.label}</span>
              <small>{rub(d.cash + d.savings)} на старте</small>
            </label>
          ))}
        </div>
      </fieldset>
      {value === 'hardcore' && (
        <div className="hardcore-rules">
          <b>Условия победы</b>
          <p>
            Ни одного месяца с дефицитом, учёбой ниже 35 или ресурсом ниже 15. В финале: учёба ≥ 65,
            ресурс ≥ 45, безопасность ≥ 8, без долгов и с резервом на месяц.
          </p>
          <p>
            Сессии в январе и июне забирают 12 часов и усиливают нагрузку на учёбу. Ошибки останутся
            в истории прохождения.
          </p>
        </div>
      )}
      <div className="starting-pack difficulty-details" aria-live="polite">
        <div className="difficulty-description">
          <b>{selected.name}</b>
          <span>{selected.description}</span>
        </div>
        <div className="difficulty-facts">
          <div>
            <Wallet size={16} />
            <span>
              Деньги на руках<b>{rub(selected.cash)}</b>
            </span>
          </div>
          <div>
            <Wallet size={16} />
            <span>
              В резерве<b>{rub(selected.savings)}</b>
            </span>
          </div>
          <div>
            <Wallet size={16} />
            <span>
              Поддержка в месяц<b>{rub(selected.support)}</b>
            </span>
          </div>
          <div>
            <Clock3 size={16} />
            <span>
              Время в месяц<b>{selected.hours} часов</b>
            </span>
          </div>
        </div>
        <p>
          Стипендия до 3 000 ₽. Рост базовых цен к августу: {percent(6 * selected.inflationFactor)}.{' '}
          {value === 'first'
            ? 'Колебания фонда мягче на 25%.'
            : value === 'challenge'
              ? 'Колебания фонда сильнее на 50%.'
              : value === 'hardcore'
                ? 'Колебания фонда вдвое сильнее. В первом году летом поддержка снижается до 10 000 ₽.'
                : 'Базовые колебания фонда.'}
        </p>
      </div>
    </>
  );
}
