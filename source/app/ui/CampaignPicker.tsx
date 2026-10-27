import { type CampaignYears } from '@/lib/game';

export function CampaignPicker({
  value,
  onChange,
}: {
  value: CampaignYears;
  onChange: (years: CampaignYears) => void;
}) {
  return (
    <fieldset className="campaign-picker">
      <legend>Длительность</legend>
      <div className="campaign-lengths">
        {([1, 2, 3] as const).map((years) => (
          <label key={years} className={value === years ? 'selected' : ''}>
            <input
              type="radio"
              name="years"
              value={years}
              checked={value === years}
              onChange={() => onChange(years)}
            />
            <b>
              {years} {years === 1 ? 'год' : 'года'}
            </b>
            <span>{years * 12} месяцев</span>
          </label>
        ))}
      </div>
      <p>
        {value === 1
          ? 'Первый самостоятельный год: учёба, работа и расходы.'
          : 'Со второго года: работа по специальности, своё дело, машина и срочные вклады. Поддержка семьи уменьшается, цены продолжают расти.'}
      </p>
    </fieldset>
  );
}
