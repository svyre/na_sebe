import gameLogo from '@/assets/game-logo.svg';
import { type CharacterId, type PlayerSolo } from '@/lib/character';
import {
  GOALS,
  campaignMonths,
  campaignYears,
  campaignGoal,
  monthLabel,
  rub,
  createStorySchedule,
  ensureStorySchedule,
  initialState,
  planSituationIds,
  settle,
  type CampaignYears,
  type DifficultyId,
  type GoalId,
  type Plan,
  type Report,
} from '@/lib/game';
import { chooseStory, recordChapter, type StoryChoiceId } from '@/lib/narrative';
import { firstTutorial, type TutorialProgress } from '@/lib/tutorial';
import { loadGame, saveGame } from '@/lib/storage';
import {
  ArrowRight,
  BookOpen,
  Check,
  Flag,
  GraduationCap,
  LayoutDashboard,
  Menu,
  Plus,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { PartnerMark } from './Brand';
import { CharacterPicker } from './Character';
import { CampaignPicker } from './CampaignPicker';
import { DifficultyPicker } from './DifficultyPicker';
import { Game } from './Game';
import { ReportView } from './History';
import { Home } from './Home';
import { Glossary, Guide } from './Info';
import { Modal } from './Modal';
import { Results } from './Results';

type Page = 'home' | 'play' | 'glossary' | 'guide' | 'results';
export default function App() {
  const [page, setPage] = useState<Page>('home');
  const [game, setGame] = useState<PlayerSolo | null>(null);
  const [gameVersion, setGameVersion] = useState(0);
  const [modal, setModal] = useState<'setup' | 'restart' | 'character' | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hasLoadedSave, setHasLoadedSave] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [strategyName, setStrategyName] = useState('');
  const [years, setYears] = useState<CampaignYears>(1);
  const [goal, setGoal] = useState<GoalId>('capital');
  const [difficulty, setDifficulty] = useState<DifficultyId>('balance');
  const [character, setCharacter] = useState<CharacterId>('boy');
  const sidebar = useRef<HTMLElement>(null);

  useEffect(() => {
    const savedGame = loadGame();
    if (savedGame) {
      setGame(savedGame);
      saveGame(savedGame);
      setCharacter(savedGame.character);
    }
    setHasLoadedSave(true);
  }, []);
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(''), 5000);
    return () => clearTimeout(id);
  }, [toast]);
  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const before = document.activeElement as HTMLElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const items = () =>
      Array.from(
        sidebar.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]),a[href],[tabindex="0"]',
        ) || [],
      ).filter((e) => e.offsetParent !== null);
    items()[0]?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
      if (e.key === 'Tab') {
        const list = items();
        const first = list[0];
        const last = list.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener('keydown', key);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener('keydown', key);
      if (before?.isConnected) before.focus();
    };
  }, [isMobileMenuOpen]);

  const navigate = (next: Page) => {
    setPage(next);
    setMobileMenuOpen(false);
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const openSetup = (level?: DifficultyId) => {
    if (level) setDifficulty(level);
    if (game) {
      setCharacter(game.character);
      setYears(campaignYears(game.state));
    }
    setStrategyName('');
    setError('');
    setMobileMenuOpen(false);
    setModal('setup');
  };
  const resumeGame = () => {
    if (game) navigate(game.month >= campaignMonths(game.state) ? 'results' : 'play');
    else openSetup();
  };
  const startGame = (e: React.FormEvent) => {
    e.preventDefault();
    const storySeed = crypto.getRandomValues(new Uint32Array(1))[0];
    const data: PlayerSolo = {
      character,
      storySeed,
      storySchedule: createStorySchedule(storySeed),
      name: strategyName.trim() || 'Моя игра',
      goal,
      difficulty,
      month: 0,
      state: initialState(difficulty, years),
      reports: [],
      plans: [],
      narrative: { choices: {}, journal: [] },
      tutorial: firstTutorial(),
    };
    data.storySchedule = ensureStorySchedule(data);
    setGame(data);
    setGameVersion((value) => value + 1);
    if (!saveGame(data)) setToast('Браузер не разрешил сохранение. Оставь эту вкладку открытой.');
    setReport(null);
    setModal(null);
    navigate('play');
  };
  const commitMonth = (plan: Plan) => {
    if (!game) return;
    try {
      const expected = ensureStorySchedule(game)[game.month];
      if (JSON.stringify(planSituationIds(plan, game.month)) !== JSON.stringify(expected))
        throw new Error('Список ситуаций изменился. Открой текущий месяц заново.');
      const result = settle(game.state, plan, game.month, game.goal, true, game.difficulty);
      const data = {
        ...game,
        month: game.month + 1,
        state: result.after,
        narrative: recordChapter(game),
        ...(game.tutorial?.status === 'active'
          ? { tutorial: { ...game.tutorial, status: 'completed' as const } }
          : {}),
        reports: [...game.reports, result],
        plans: [...game.plans, plan],
      };
      data.storySchedule = ensureStorySchedule(data);
      setGame(data);
      setError('');
      if (!saveGame(data)) setToast('Не удалось сохранить прогресс на устройстве.');
      setReport(result);
      if (data.month === campaignMonths(data.state)) navigate('results');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Проверь план.');
    }
  };
  const chooseDialogue = (choice: StoryChoiceId) => {
    if (!game) return;
    const data = { ...game, narrative: chooseStory(game, choice) };
    setGame(data);
    if (!saveGame(data)) setToast('Ответ выбран, но браузер не разрешил сохранить его.');
  };
  const updateTutorial = (tutorial: TutorialProgress) => {
    if (!game) return;
    const data = { ...game, tutorial };
    setGame(data);
    if (!saveGame(data)) setToast('Не удалось сохранить шаг обучения.');
  };
  const openCharacter = () => {
    if (!game) return;
    setCharacter(game.character);
    setModal('character');
  };
  const saveCharacter = () => {
    if (!game) return;
    const updated = { ...game, character };
    setGame(updated);
    setModal(null);
    if (saveGame(updated)) setToast('Персонаж сохранён');
    else setToast('Персонаж изменён, но браузер не разрешил сохранить выбор.');
  };

  return (
    <div className="app-shell">
      <aside
        id="app-navigation"
        ref={sidebar}
        role={isMobileMenuOpen ? 'dialog' : undefined}
        aria-modal={isMobileMenuOpen ? true : undefined}
        aria-label="Основная навигация"
        className={'sidebar ' + (isMobileMenuOpen ? 'sidebar-open' : '')}
      >
        <button className="brand" onClick={() => navigate('home')} aria-label="на себе — главная">
          <img className="brand-mark" src={gameLogo} alt="" width="40" height="40" />
          <span>на себе</span>
        </button>
        <button
          className="sidebar-close icon-button"
          onClick={() => setMobileMenuOpen(false)}
          aria-label="Закрыть меню"
        >
          <X size={22} />
        </button>
        <span className="nav-caption">МЕНЮ</span>
        <nav className="primary-nav">
          {[
            { id: 'home' as Page, label: 'Обзор', icon: LayoutDashboard },
            { id: 'play' as Page, label: 'Моя игра', icon: Flag },
            { id: 'glossary' as Page, label: 'Словарь', icon: BookOpen },
            { id: 'guide' as Page, label: 'Как играть', icon: GraduationCap },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              aria-current={
                page === id || (id === 'play' && page === 'results') ? 'page' : undefined
              }
              className={page === id || (id === 'play' && page === 'results') ? 'active' : ''}
              onClick={() => (id === 'play' ? resumeGame() : navigate(id))}
            >
              <Icon size={19} />
              <span>{label}</span>
              {id === 'play' && game && (
                <span className="nav-count">
                  {Math.min(game.month + 1, campaignMonths(game.state))}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-class">
          <div className="sidebar-class-icon">
            <Flag size={22} />
          </div>
          <b>Самостоятельная жизнь</b>
          <p>Учёба, работа и собственные планы.</p>
          <button onClick={resumeGame}>
            {game ? 'Продолжить игру' : 'Начать игру'}
            <ArrowRight size={16} />
          </button>
        </div>
        <button className="sidebar-new-game button secondary" onClick={() => openSetup()}>
          <Plus size={17} />
          Новая игра
        </button>
      </aside>
      {isMobileMenuOpen && (
        <button
          className="sidebar-overlay"
          aria-label="Закрыть меню"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      <div className="workspace">
        <header className="topbar">
          <button
            className="mobile-brand"
            onClick={() => navigate('home')}
            aria-label="на себе — главная"
          >
            <img src={gameLogo} alt="" width="32" height="32" />
            <span>на себе</span>
          </button>
          <nav className="desktop-nav" aria-label="Навигация сайта">
            {[
              { id: 'home' as Page, label: 'Главная' },
              { id: 'play' as Page, label: 'Моя игра' },
              { id: 'guide' as Page, label: 'Как играть' },
              { id: 'glossary' as Page, label: 'Словарь' },
            ].map(({ id, label }) => (
              <button
                key={id}
                aria-current={
                  page === id || (id === 'play' && page === 'results') ? 'page' : undefined
                }
                onClick={() => (id === 'play' ? resumeGame() : navigate(id))}
              >
                {label}
              </button>
            ))}
          </nav>
          <div className="topbar-right">
            <span className="simulation-tag">
              <span className="status-dot" />
              Прогресс на устройстве
            </span>
            <span className="grade-badge">10—11 класс</span>
            <button
              className="header-new-game"
              onClick={() => openSetup()}
              aria-label="Настроить новую игру"
            >
              <Plus size={17} />
              <span>Новая игра</span>
            </button>
          </div>
          <button
            className="mobile-menu icon-button"
            aria-label="Открыть меню"
            aria-expanded={isMobileMenuOpen}
            aria-controls="app-navigation"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu size={24} />
          </button>
        </header>
        <main>
          {error && (
            <div className="alert error" role="alert">
              <span>{error}</span>
              <button
                className="icon-button"
                onClick={() => setError('')}
                aria-label="Закрыть ошибку"
              >
                <X size={16} />
              </button>
            </div>
          )}
          {page === 'home' && (
            <Home
              solo={game}
              onDifficulty={openSetup}
              onSolo={resumeGame}
              onGuide={() => navigate('guide')}
              onResults={() => navigate('results')}
            />
          )}
          {page === 'glossary' && <Glossary />}
          {page === 'guide' && <Guide />}
          {page === 'play' && game && game.month < campaignMonths(game.state) && (
            <Game
              key={'solo-' + gameVersion + '-' + game.month + '-' + game.difficulty}
              data={game}
              situationIds={ensureStorySchedule(game)[game.month]}
              character={game.character}
              onCharacter={openCharacter}
              onStoryChoice={chooseDialogue}
              onTutorial={updateTutorial}
              onCommit={commitMonth}
              onHistory={() => navigate('results')}
            />
          )}
          {(page === 'results' ||
            (page === 'play' && game && game.month === campaignMonths(game.state))) &&
            game && (
              <Results
                data={game}
                onBack={() => navigate('play')}
                onRestart={() => setModal('restart')}
              />
            )}
          {page === 'results' && !game && (
            <div className="empty-state">
              <Flag size={40} />
              <h2>Начни игру</h2>
              <p>Здесь появятся отчёты после завершения первого месяца.</p>
              <button className="button primary" onClick={() => openSetup()}>
                Настроить игру
                <ArrowRight size={18} />
              </button>
            </div>
          )}
          <footer className="app-footer">
            <PartnerMark compact />
          </footer>
        </main>
      </div>
      {modal && (
        <Modal
          wide={modal === 'setup' || modal === 'character'}
          title={
            modal === 'character'
              ? 'Твой персонаж'
              : modal === 'setup'
                ? 'Новая игра'
                : 'Начать новую игру?'
          }
          onClose={() => {
            setModal(null);
            setError('');
          }}
        >
          {modal === 'character' ? (
            <div className="change-character">
              <CharacterPicker value={character} onChange={setCharacter} />
              <button type="button" className="button primary full" onClick={saveCharacter}>
                Сохранить персонажа
                <Check size={17} />
              </button>
            </div>
          ) : modal === 'restart' ? (
            <>
              <p className="muted">
                Новая история заменит текущую игру в этом браузере. Перед началом можно скачать
                отчёт.
              </p>
              <div className="modal-actions">
                <button className="button secondary" onClick={() => setModal(null)}>
                  Остаться
                </button>
                <button className="button primary" onClick={() => openSetup()}>
                  Новая игра
                  <ArrowRight size={17} />
                </button>
              </div>
            </>
          ) : (
            <form onSubmit={startGame}>
              <p className="modal-intro">Выбери персонажа, длительность, цель и сложность.</p>
              {game && <div className="alert">Новая игра заменит текущее сохранение.</div>}
              <CharacterPicker value={character} onChange={setCharacter} />
              <CampaignPicker value={years} onChange={setYears} />
              <label className="field">
                Название игры
                <input
                  value={strategyName}
                  onChange={(e) => setStrategyName(e.target.value)}
                  maxLength={32}
                  placeholder="Например, На первую машину"
                />
              </label>
              <label className="field">
                Цель прохождения
                <select value={goal} onChange={(e) => setGoal(e.target.value as GoalId)}>
                  {Object.entries(GOALS).map(([id, g]) => (
                    <option key={id} value={id}>
                      {g.name}
                    </option>
                  ))}
                </select>
                <small>
                  {rub(campaignGoal(goal, years).target)} капитала
                  {goal === 'career' ? ` и ${campaignGoal(goal, years).skills} навыков` : ''} к
                  концу прохождения.{' '}
                  {difficulty === 'hardcore'
                    ? 'Дополнительные условия победы указаны ниже.'
                    : 'В финале нужны учёба от 60, ресурс от 35 и отсутствие дефицита.'}
                </small>
              </label>
              <DifficultyPicker value={difficulty} onChange={setDifficulty} />
              <button className="button primary full" disabled={!hasLoadedSave} type="submit">
                Поехали
                <ArrowRight size={18} />
              </button>
            </form>
          )}
        </Modal>
      )}
      {report && (
        <Modal
          title={monthLabel(report.month, campaignYears(report.before) > 1) + ': месяц закрыт'}
          wide
          onClose={() => setReport(null)}
        >
          <ReportView
            report={report}
            story={game?.narrative?.journal.find((item) => item.month === report.month)}
          />
          <button
            className="button primary full"
            onClick={() => {
              setReport(null);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            {report.month === campaignMonths(report.before) - 1
              ? 'Посмотреть итоги'
              : 'К следующему месяцу'}
            <ArrowRight size={18} />
          </button>
        </Modal>
      )}
      {toast && (
        <div className="toast" role="status">
          <Check size={18} />
          {toast}
        </div>
      )}
    </div>
  );
}
