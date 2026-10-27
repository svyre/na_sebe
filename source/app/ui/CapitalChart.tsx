import {
  monthLabel,
  campaignMonths,
  SHORT_MONTHS,
  capital,
  initialState,
  rub,
  type DifficultyId,
  type Report,
} from '@/lib/game';

export function CapitalChart({
  reports,
  alternative,
  difficulty,
}: {
  reports: Report[];
  alternative?: Report[];
  difficulty: DifficultyId;
}) {
  const capitalValues = [
    capital(initialState(difficulty)),
    ...reports.map((r) => capital(r.after)),
  ];
  const alternativeValues = alternative
    ? [capital(initialState(difficulty)), ...alternative.map((r) => capital(r.after))]
    : [];
  const minimum = Math.min(0, ...capitalValues, ...alternativeValues);
  const maximum = Math.max(50000, ...capitalValues, ...alternativeValues);
  const valueRange = maximum - minimum || 1;
  const xForMonth = (i: number) =>
    44 + (i / Math.max(campaignMonths(reports[0]?.before), reports.length)) * 660;
  const yForValue = (v: number) => 178 - ((v - minimum) / valueRange) * 142;
  const linePath = (values: number[]) =>
    values.map((v, i) => `${i ? 'L' : 'M'} ${xForMonth(i)} ${yForValue(v)}`).join(' ');
  return (
    <div className="capital-chart">
      <div className="chart-key">
        <span>
          <i />
          Твой капитал
        </span>
        {alternative && (
          <span>
            <i className="alternative" />
            Другой выбор
          </span>
        )}
      </div>
      <svg viewBox="0 0 740 220" role="img" aria-label="Изменение капитала по месяцам">
        <defs>
          <linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#83a7eb" stopOpacity=".35" />
            <stop offset="100%" stopColor="#83a7eb" stopOpacity="0" />
          </linearGradient>
        </defs>
        {campaignMonths(reports[0]?.before) > 12 &&
          Array.from({ length: campaignMonths(reports[0]?.before) / 12 }, (_, year) => (
            <g key={year}>
              {year > 0 && (
                <line
                  x1={xForMonth(year * 12)}
                  x2={xForMonth(year * 12)}
                  y1="22"
                  y2="182"
                  stroke="#cbd6e4"
                  strokeDasharray="3 4"
                />
              )}
              <text
                x={xForMonth(year * 12 + 6)}
                y="14"
                textAnchor="middle"
                fontSize="10"
                fill="#6b7d94"
              >
                Год {year + 1}
              </text>
            </g>
          ))}
        {[0, 0.5, 1].map((v) => (
          <g key={v}>
            <line
              x1="44"
              x2="708"
              y1={yForValue(minimum + valueRange * v)}
              y2={yForValue(minimum + valueRange * v)}
              stroke="#e6e9e3"
              strokeDasharray="4 4"
            />
            <text x="2" y={yForValue(minimum + valueRange * v) + 4} fontSize="10" fill="#7b847e">
              {Math.round((minimum + valueRange * v) / 1000)}к
            </text>
          </g>
        ))}
        <path
          d={linePath(capitalValues) + ` L ${xForMonth(capitalValues.length - 1)} 180 L 44 180 Z`}
          fill="url(#chart-fill)"
        />
        <path
          d={linePath(capitalValues)}
          fill="none"
          stroke="#275fce"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        {capitalValues.map((v, i) => (
          <circle key={i} cx={xForMonth(i)} cy={yForValue(v)} r="3" fill="#275fce">
            <title>
              {i ? monthLabel(i - 1, campaignMonths(reports[0]?.before) > 12) : 'Старт'}: {rub(v)}
            </title>
          </circle>
        ))}
        {alternativeValues.length > 0 && (
          <path
            d={linePath(alternativeValues)}
            fill="none"
            stroke="#132d50"
            strokeWidth="3"
            strokeDasharray="7 5"
          />
        )}
        {Array.from({ length: campaignMonths(reports[0]?.before) }, (_, i) => i)
          .filter((i) => campaignMonths(reports[0]?.before) === 12 || i % 3 === 2)
          .map((i) => (
            <text
              key={i}
              x={xForMonth(i + 1)}
              y="208"
              textAnchor="middle"
              fontSize="10"
              fill="#7b847e"
            >
              {SHORT_MONTHS[i % 12]}
            </text>
          ))}
      </svg>
    </div>
  );
}
