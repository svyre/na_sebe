import {
  TUTORIAL_STEPS,
  nextTutorial,
  type TutorialProgress,
  type TutorialStepId,
} from '@/lib/tutorial';
import { ChevronDown, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export function TutorialCoach({
  progress,
  hasDecision,
  month,
  onChange,
  onShowStep,
  onEnd,
}: {
  progress: TutorialProgress;
  hasDecision: boolean;
  month: number;
  onChange: (progress: TutorialProgress) => void;
  onShowStep: (step: TutorialStepId) => void;
  onEnd: () => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [locate, setLocate] = useState(0);
  const coach = useRef<HTMLElement>(null);
  const index = TUTORIAL_STEPS.findIndex((step) => step.id === progress.step);
  const step = TUTORIAL_STEPS[index];
  const isLast = index === TUTORIAL_STEPS.length - 1;
  const targetSelector = step.id === 'future' && month >= 12 ? '.projects-panel' : step.target;
  useEffect(() => {
    setCollapsed(false);
    onShowStep(step.id);
    let element: HTMLElement | null = null;
    let frame = 0,
      attempts = 0;
    const show = () => {
      element = document.querySelector<HTMLElement>(targetSelector);
      if (!element) {
        if (attempts++ < 5) frame = requestAnimationFrame(show);
        return;
      }
      element.setAttribute('data-tutorial-highlight', 'true');
      element.scrollIntoView({
        block: 'start',
        behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      });
    };
    frame = requestAnimationFrame(show);
    return () => {
      cancelAnimationFrame(frame);
      if (element) element.removeAttribute('data-tutorial-highlight');
    };
  }, [step.id, targetSelector, onShowStep, locate]);
  useEffect(() => {
    const reduce = (event: PointerEvent) => {
      if (
        event.target instanceof HTMLInputElement &&
        event.target.type === 'number' &&
        !coach.current?.contains(event.target)
      )
        setCollapsed(true);
    };
    document.addEventListener('pointerdown', reduce);
    return () => document.removeEventListener('pointerdown', reduce);
  }, []);
  const stop = (status: 'completed' | 'skipped') => {
    onChange({ ...progress, status });
    onEnd();
  };
  const forward = () => {
    const next = nextTutorial(progress, hasDecision);
    if (next.status === 'completed') stop('completed');
    else onChange(next);
  };
  return (
    <aside
      ref={coach}
      className={`tutorial-coach ${collapsed ? 'tutorial-collapsed' : ''}`}
      aria-label="Обучение"
    >
      <header>
        <div>
          <span>
            Обучение · {index + 1} из {TUTORIAL_STEPS.length}
          </span>
          <h2>{step.title}</h2>
        </div>
        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          aria-label={collapsed ? 'Развернуть подсказку' : 'Свернуть подсказку'}
          aria-expanded={!collapsed}
        >
          <ChevronDown size={18} className={collapsed ? 'rotated' : ''} />
        </button>
        <button type="button" onClick={() => stop('skipped')} aria-label="Пропустить обучение">
          <X size={18} />
        </button>
      </header>
      {!collapsed && (
        <div className="tutorial-copy" aria-live="polite">
          <p>
            {step.id === 'future' && month >= 12
              ? 'Здесь можно проверить идею, открыть своё дело и выбрать машину. Бизнес требует времени и расходов, машина — содержания. Срочные вклады находятся в банке. Ни одно действие не обязательно для продолжения.'
              : step.text}
          </p>
          <button
            type="button"
            className="tutorial-locate"
            onClick={() => setLocate((value) => value + 1)}
          >
            Показать раздел
          </button>
          {step.id === 'decisions' && !hasDecision && (
            <p className="tutorial-task">Сначала выбери один вариант в первой ситуации.</p>
          )}
        </div>
      )}
      <footer>
        <button
          type="button"
          disabled={index === 0}
          onClick={() => onChange({ ...progress, step: TUTORIAL_STEPS[index - 1].id })}
        >
          Назад
        </button>
        <button
          type="button"
          className="tutorial-next"
          disabled={step.id === 'decisions' && !hasDecision}
          onClick={forward}
        >
          {isLast ? 'Закончить обучение' : 'Дальше'}
        </button>
      </footer>
    </aside>
  );
}
