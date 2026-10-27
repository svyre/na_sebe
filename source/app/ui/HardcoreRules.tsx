import { MONTHS, monthRules, type GameState } from '@/lib/game';
import { Flame } from 'lucide-react';

export function HardcoreRules({ state, month }: { state: GameState; month: number }) {
  const rules = monthRules('hardcore', month);
  return (
    <section className="hardcore-rules" aria-label="Условия хардкора">
      <div className="hardcore-status">
        <Flame size={23} />
        <div>
          <b>
            {state.hardcoreFailures?.length
              ? 'Условия прохождения нарушены'
              : 'Хардкор: каждый месяц имеет значение'}
          </b>
          <p>
            {rules.exam
              ? 'Сессия занимает 12 часов. На план остаётся 96 часов.'
              : `${rules.hours} часов на месяц. Восстановление снижено; не перегружай план.`}{' '}
            Поддержка: {rules.support.toLocaleString('ru-RU')} ₽.
          </p>
        </div>
      </div>
      <details>
        <summary>Условия победы и календарь</summary>
        <ul>
          <li>
            Ни одного месяца с дефицитом, учёбой ниже 35 или ресурсом ниже 15. Нарушение сохраняется
            до конца прохождения.
          </li>
          <li>В финале: цель по капиталу и навыкам, учёба ≥ 65, ресурс ≥ 45, безопасность ≥ 8.</li>
          <li>
            Нет кредитов и будущих платежей. Денежный резерв покрывает месяц базовых расходов.
          </li>
          <li>
            Сессии: {MONTHS[4]} и {MONTHS[9]} — на 12 часов меньше и дополнительная нагрузка на
            учёбу.
          </li>
          <li>
            С июня поддержка уменьшается ещё на 4 000 ₽. На втором году базовая поддержка составляет
            75% начальной, на третьем — 50%.
          </li>
        </ul>
        {state.hardcoreFailures?.length ? (
          <div className="hardcore-failures">
            <b>Почему победа недоступна</b>
            {state.hardcoreFailures.map((failure, index) => (
              <p key={index}>{failure}</p>
            ))}
            <p>Можно закончить прохождение и разобрать решения или начать новую игру.</p>
          </div>
        ) : null}
      </details>
    </section>
  );
}
