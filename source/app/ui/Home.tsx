import {
  DIFFICULTIES,
  campaignMonths,
  difficultyId,
  rub,
  type DifficultyId,
  type Solo,
} from '@/lib/game';
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CheckCheck,
  ChevronDown,
  Clock3,
  Flag,
  GitBranch,
  House,
  Play,
  ShieldCheck,
  Wallet,
} from 'lucide-react';
import { useState, type CSSProperties } from 'react';

type HomeProps = {
  solo: Solo | null;
  onSolo: () => void;
  onDifficulty: (d: DifficultyId) => void;
  onGuide: () => void;
  onResults: () => void;
};
const levelNames: Record<DifficultyId, string> = {
  first: 'Больше денег и времени',
  balance: 'Обычные условия',
  challenge: 'Меньше поддержки',
  hardcore: 'Ошибки лишают победы',
};

export function Home({ solo, onSolo, onDifficulty, onGuide, onResults }: HomeProps) {
  const [preview, setPreview] = useState<DifficultyId>(difficultyId(solo?.difficulty));
  const level = DIFFICULTIES[preview];
  const total = level.cash + level.savings;
  const [reserve, setReserve] = useState(level.savings);
  const choosePreview = (id: DifficultyId) => {
    setPreview(id);
    setReserve(DIFFICULTIES[id].savings);
  };
  const begin = () => (solo ? onSolo() : onDifficulty(preview));
  const startLabel = solo
    ? solo.month >= campaignMonths(solo.state)
      ? 'Посмотреть результат'
      : 'Продолжить игру'
    : 'Начать игру';

  return (
    <div className="new-home">
      <section className="intro" aria-labelledby="intro-title">
        <div className="intro-copy">
          <span className="intro-tag">
            <span className="intro-tag-dot" />
            Игра о самостоятельной жизни
          </span>
          <h1 id="intro-title">
            На что хватит
            <br />
            твоей зарплаты?
          </h1>
          <p className="intro-description">
            Ты переезжаешь в общежитие. Нужно платить за жильё, подрабатывать и готовиться к сессии.
            Выбери срок от одного до трёх лет и попробуй выполнить свою цель.
          </p>
          <div className="intro-actions">
            <button className="button primary" onClick={begin}>
              {startLabel}
              <ArrowUpRight size={20} />
            </button>
            <button className="intro-guide" onClick={onGuide}>
              <span>
                <Play size={13} fill="currentColor" />
              </span>
              Как играть
            </button>
          </div>
          <div className="intro-facts">
            <span>
              <Clock3 size={16} />В своём темпе
            </span>
            <span>
              <Flag size={16} />
              1–3 года · 144 ситуации
            </span>
          </div>
          {solo && (
            <button className="resume-strip" onClick={onSolo}>
              <CheckCheck size={19} />
              <span>
                Игра сохранена
                <small>
                  {solo.month >= campaignMonths(solo.state)
                    ? 'Прохождение завершено.'
                    : `Пройдено ${solo.month} из ${campaignMonths(solo.state)} месяцев.`}
                </small>
              </span>
              <ArrowRight size={18} />
            </button>
          )}
        </div>
        <div className="budget-playground">
          <div className="playground-head">
            <span>Бюджет на старте</span>
            <span className="demo-pill">Попробуй</span>
          </div>
          <div className="preview-tabs" role="group" aria-label="Сложность пробного бюджета">
            {(Object.keys(DIFFICULTIES) as DifficultyId[]).map((id) => (
              <button key={id} aria-pressed={id === preview} onClick={() => choosePreview(id)}>
                {DIFFICULTIES[id].name}
              </button>
            ))}
          </div>
          <div className="budget-receipt">
            <div className="receipt-head">
              <span className="receipt-symbol">
                <Wallet size={23} />
              </span>
              <div>
                <b>До первого дохода</b>
                <span>Сентябрь. Первый месяц</span>
              </div>
              <span className="receipt-index">1 / 12</span>
            </div>
            <span className="receipt-label">Деньги на старте</span>
            <div className="receipt-amount" aria-live="polite">
              {rub(total)}
            </div>
            <div className="allocation-bar" aria-hidden="true">
              <span style={{ width: `${((total - reserve) / total) * 100}%` }} />
              <span style={{ width: `${(reserve / total) * 100}%` }} />
            </div>
            <dl className="allocation-values">
              <div>
                <dt>
                  <i />
                  На жизнь
                </dt>
                <dd>{rub(total - reserve)}</dd>
              </div>
              <div>
                <dt>
                  <i />В резерв
                </dt>
                <dd>{rub(reserve)}</dd>
              </div>
            </dl>
            <div className="reserve-control">
              <div>
                <label htmlFor="demo-reserve">Сколько отложишь?</label>
              </div>
              <input
                id="demo-reserve"
                type="range"
                min="0"
                max={total}
                step="1000"
                value={reserve}
                onChange={(e) => setReserve(Number(e.target.value))}
                aria-valuetext={`${rub(reserve)} в резерве`}
                style={{ '--range-progress': `${(reserve / total) * 100}%` } as CSSProperties}
              />
              <div className="range-labels">
                <span>Всё на жизнь</span>
                <span>Всё в резерв</span>
              </div>
            </div>
            <div className="receipt-message" aria-live="polite">
              <ShieldCheck size={17} />
              <span>
                {reserve === 0
                  ? 'На непредвиденные расходы ничего не отложено.'
                  : reserve === total
                    ? 'На текущие расходы ничего не осталось.'
                    : `${rub(total - reserve)} на расходы, ${rub(reserve)} в запасе.`}
              </span>
            </div>
          </div>
          <p className="playground-caption">
            Ползунок показывает, сколько останется после перевода в резерв.
          </p>
        </div>
      </section>
      <div className="learning-strip">
        <span className="strip-intro">
          Что предстоит
          <br />
          <b>решать</b>
        </span>
        {[
          { icon: Wallet, title: 'Планировать расходы', text: 'Расходы, накопления и кредиты' },
          {
            icon: ShieldCheck,
            title: 'Проверять предложения',
            text: 'Договоры, предложения и риски',
          },
          { icon: GitBranch, title: 'Сравнивать решения', text: 'Другой выбор и его результат' },
        ].map(({ icon: Icon, title, text }) => (
          <div className="learning-item" key={title}>
            <Icon size={23} />
            <div>
              <b>{title}</b>
              <span>{text}</span>
            </div>
          </div>
        ))}
      </div>
      <section className="levels-section" aria-labelledby="levels-title">
        <div className="new-section-head">
          <div>
            <span className="section-caption">Условия на старте</span>
            <h2 id="levels-title">Выбери сложность</h2>
          </div>
          <p>
            Чем сложнее режим, тем меньше денег и свободного времени. В хардкоре нужно ещё пройти
            год без критических ошибок.
          </p>
        </div>
        <div className="new-level-grid">
          {(Object.entries(DIFFICULTIES) as [DifficultyId, typeof level][]).map(
            ([id, settings]) => (
              <article className={`new-level level-${id}`} key={id}>
                <div className="new-level-top">
                  <span className="level-symbol" aria-hidden="true">
                    {id === 'first' ? (
                      <House size={25} />
                    ) : id === 'balance' ? (
                      <Wallet size={25} />
                    ) : (
                      <Flag size={25} />
                    )}
                  </span>
                  <span className="level-character">{levelNames[id]}</span>
                </div>
                <h3>{settings.name}</h3>
                <p>{settings.description}</p>
                <div className="level-start">
                  <span>На старте</span>
                  <b>{rub(settings.cash + settings.savings)}</b>
                </div>
                <dl>
                  <div>
                    <dt>Поддержка в месяц</dt>
                    <dd>{rub(settings.support)}</dd>
                  </div>
                  <div>
                    <dt>Время в месяц</dt>
                    <dd>{settings.hours} ч</dd>
                  </div>
                </dl>
                <button className="level-start-button" onClick={() => onDifficulty(id)}>
                  Выбрать «{settings.name}»<ArrowUpRight size={18} />
                </button>
              </article>
            ),
          )}
        </div>
      </section>
      <section className="how-section" aria-labelledby="how-title">
        <div className="how-intro">
          <span className="section-caption">Как проходит месяц</span>
          <h2 id="how-title">
            Составь план,
            <br />
            проверь расходы,
            <br />
            заверши месяц.
          </h2>
          <p>После каждого месяца получишь отчёт о расходах, учёбе и самочувствии.</p>
          <button className="text-button" onClick={solo && solo.month > 0 ? onResults : onGuide}>
            Открыть правила
            <ArrowUpRight size={17} />
          </button>
          <div className="month-ribbon" aria-label="12 месяцев игры">
            {[
              'Сен',
              'Окт',
              'Ноя',
              'Дек',
              'Янв',
              'Фев',
              'Мар',
              'Апр',
              'Май',
              'Июн',
              'Июл',
              'Авг',
            ].map((month, i) => (
              <span key={month} className={i === 0 ? 'month-start' : ''}>
                {month}
              </span>
            ))}
          </div>
        </div>
        <div className="how-steps">
          {[
            {
              title: 'Открой ситуации месяца',
              text: 'На доске в комнате появляются новые события. Прочитай условия и выбери, как поступить. Деньги и время на эти решения входят в месячный план.',
              icon: BookOpen,
            },
            {
              title: 'Распредели деньги и время',
              text: 'Распредели деньги и время между работой, учёбой и отдыхом. Бюджет покажет, сколько останется на руках до принятия решения.',
              icon: Wallet,
            },
            {
              title: 'Посмотри отчёт',
              text: 'В отчёте видно, сколько ты потратил и заработал, как изменились учёба и ресурс. В конце года можно заменить одно решение и сравнить результаты.',
              icon: GitBranch,
            },
          ].map(({ title, text, icon: Icon }, i) => (
            <details className="how-step" key={title} open={i === 0 ? true : undefined}>
              <summary>
                <span className="step-number">{i + 1}</span>
                <h3>{title}</h3>
                <ChevronDown size={20} />
              </summary>
              <div className="step-body">
                <p>{text}</p>
                <Icon size={28} />
              </div>
            </details>
          ))}
        </div>
      </section>
      <section className="closing-start">
        <div>
          <h2>Выбери срок и цель</h2>
          <p>
            Один год — освоиться. Два или три — накопить больше, попробовать своё дело и крупные
            покупки.
          </p>
        </div>
        <button className="button" onClick={begin}>
          {startLabel}
          <ArrowUpRight size={21} />
        </button>
      </section>
      <div className="home-footnote">
        <ShieldCheck size={15} />
        <span>Прогресс сохраняется в этом браузере.</span>
      </div>
    </div>
  );
}
