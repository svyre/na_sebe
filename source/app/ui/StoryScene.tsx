import { CHARACTERS, type CharacterId } from '@/lib/character';
import { monthLabel, SCENARIOS, type Scenario } from '@/lib/game';
import { storyLocation, type LocationId } from '@/lib/locations';
import { STORY_SCENES, type Story } from '@/lib/story-scenes';
import {
  Check,
  ChevronDown,
  FileText,
  Heart,
  MousePointer2,
  Pause,
  Play,
  ShieldCheck,
  Sparkles,
  Smartphone,
} from 'lucide-react';
import { memo, useState } from 'react';
import { bankLogo } from './bank-brand';
import { CharacterFigure, type CharacterEmotion } from './Character';
import { SceneEnvironment, SceneSurface } from './SceneEnvironment';
import { StoryObject } from './StoryObjects';
import { useSceneMotion } from './useSceneMotion';

const World = memo(function World({
  month,
  choice,
  character,
  scene,
  emotion,
  location,
  reaction,
  rain,
  night,
}: {
  month: number;
  choice: number;
  character: CharacterId;
  scene: Story;
  emotion: CharacterEmotion;
  location: LocationId;
  reaction: number;
  rain: boolean;
  night: boolean;
}) {
  return (
    <svg
      className="story-world"
      data-location={location}
      viewBox="0 0 900 420"
      role="img"
      aria-label={`Иллюстрированная сцена: ${scene.place}. Персонаж: ${CHARACTERS[character].label.toLowerCase()}`}
    >
      <SceneEnvironment location={location} month={month % 12} rain={rain} night={night} />
      <SceneSurface location={location} />
      <g className="scene-actor" transform="translate(507 110) scale(.76)">
        <ellipse cx="110" cy="318" rx="67" ry="8" fill="#4c6372" opacity=".12" />
        <CharacterFigure character={character} emotion={emotion} reaction={reaction} />
      </g>
      {[0, 1, 2].map((i) => (
        <g
          key={i}
          transform={`translate(${151 + i * 242} 199)`}
          opacity={choice < 0 || choice === i ? 1 : 0.54}
        >
          <ellipse
            cx="80"
            cy="106"
            rx="87"
            ry="13"
            fill={choice === i ? '#f4e5ae' : '#344652'}
            opacity={choice === i ? 0.75 : 0.08}
          />
          <g
            key={choice === i ? `picked-${reaction}` : 'rest'}
            className={choice === i ? 'scene-object-picked' : 'scene-object-rest'}
          >
            <svg x="-5" y="-19" width="170" height="126" viewBox="0 0 180 130">
              <StoryObject kind={scene.props[i]} />
            </svg>
          </g>
        </g>
      ))}
      {reaction > 0 && (
        <g
          className="scene-reaction-glints"
          key={reaction}
          stroke="#f3e2a6"
          strokeWidth="4"
          strokeLinecap="round"
        >
          <path d="m546 120-8-9m76 7 9-9m-51-6v-12m67 55 12-2" />
          <circle cx="527" cy="141" r="3" fill="#f3e2a6" stroke="none" />
        </g>
      )}
    </svg>
  );
});

export function StoryScene({
  month,
  character = 'boy',
  selected,
  onSelect,
  energy,
  onOpenPhone,
  scenarioOverride,
  story,
  chapter = 1,
  scenarioId,
}: {
  month: number;
  character?: CharacterId;
  scenarioOverride?: Scenario;
  story?: Story;
  chapter?: number;
  scenarioId?: string;
  selected: string;
  onSelect: (choice: string) => void;
  energy: number;
  onOpenPhone?: () => void;
}) {
  const [documentOpen, setDocumentOpen] = useState(false);
  const [reaction, setReaction] = useState(0);
  const motion = useSceneMotion();
  const location = storyLocation(scenarioId || `main-${month % 12}`);
  const select = (choice: string) => {
    setReaction((n) => n + 1);
    onSelect(choice);
  };
  const scenario = scenarioOverride || SCENARIOS[month % 12];
  const meta = story || STORY_SCENES[month % 12];
  const index = scenario.options.findIndex((o) => o.id === selected);
  return (
    <article
      className="story-event event-panel"
      aria-labelledby="story-title"
      data-situation={scenarioId || `main-${month % 12}`}
    >
      <div className="story-title">
        <div>
          <span className="story-chapter">
            {monthLabel(month)} / Ситуация {chapter}
          </span>
          <h2 id="story-title">{scenario.title}</h2>
        </div>
        <span className="story-topic">{scenario.topic}</span>
      </div>
      <div
        ref={motion.sceneRef}
        className="story-stage"
        data-motion={motion.mode}
        data-location={location}
      >
        <div className="story-hud">
          <span className="story-location">{meta.place}</span>
          <div className="story-hud-actions">
            <button
              type="button"
              className="scene-motion-toggle"
              disabled={motion.reduced}
              aria-label={
                motion.reduced
                  ? 'Анимация отключена настройками устройства'
                  : motion.enabled
                    ? 'Остановить анимацию'
                    : 'Включить анимацию'
              }
              title={
                motion.reduced
                  ? 'Уменьшение движения включено на устройстве'
                  : motion.enabled
                    ? 'Остановить анимацию'
                    : 'Включить анимацию'
              }
              aria-pressed={motion.enabled}
              onClick={motion.toggle}
            >
              {motion.enabled ? <Pause size={14} /> : <Play size={14} />}
            </button>
            <span className="story-hearts" aria-label={`Личный ресурс: ${energy} из 100`}>
              {[0, 1, 2].map((i) => (
                <Heart
                  key={i}
                  size={19}
                  fill={energy > (i * 100) / 3 ? '#e89c7c' : 'transparent'}
                  stroke={energy > (i * 100) / 3 ? '#9f6555' : '#85969f'}
                />
              ))}
            </span>
          </div>
        </div>
        {onOpenPhone ? (
          <button type="button" className="scene-phone-link" onClick={onOpenPhone}>
            <Smartphone size={18} />
            <span>
              {meta.speaker} ·{' '}
              {index < 0 ? 'Открыть сообщение' : 'Ответ в плане — открыть переписку'}
            </span>
          </button>
        ) : (
          <div className="story-dialogue" aria-live="polite">
            <span>
              {index < 0
                ? meta.speaker || 'История'
                : meta.responseSpeaker || `Твой выбор: ${scenario.options[index].title}`}
            </span>
            <p>{index < 0 ? meta.line : meta.response[index]}</p>
          </div>
        )}
        <World
          month={month}
          choice={index}
          character={character}
          scene={meta}
          location={location}
          reaction={reaction}
          rain={scenarioId === 'weather'}
          night={scenarioId === 'main-5'}
          emotion={
            energy < 35
              ? 'thinking'
              : index < 0
                ? 'neutral'
                : (scenario.options[index].energy || 0) > 0
                  ? 'happy'
                  : 'thinking'
          }
        />
        <div className="scene-object-targets" role="group" aria-label="Предметы в сцене">
          {scenario.options.map((o, i) => (
            <button
              key={o.id}
              type="button"
              aria-label={`Предмет: ${o.title}`}
              aria-pressed={index === i}
              className={index === i ? 'picked' : ''}
              onClick={() => select(o.id)}
            >
              <span>{index === i ? <Check size={13} /> : i + 1}</span>
            </button>
          ))}
        </div>
        <div className="scene-hotspots" role="group" aria-label="Выбрать предмет на сцене">
          {scenario.options.map((o, i) => (
            <button
              type="button"
              key={o.id}
              className={index === i ? 'picked' : ''}
              aria-pressed={index === i}
              aria-label={`В сцене: ${o.title}`}
              onClick={() => select(o.id)}
            >
              <span>{index === i ? <Check size={16} /> : <MousePointer2 size={15} />}</span>
              <b>{o.title}</b>
            </button>
          ))}
        </div>
        <div className="story-stage-foot">
          <img src={bankLogo} alt="Газпромбанк" />
        </div>
      </div>
      <div className="story-decision-head">
        <div>
          <Sparkles size={18} />
          <b>{index < 0 ? 'Как поступишь?' : 'Решение выбрано'}</b>
        </div>
        <button
          type="button"
          className="story-document-button document-toggle"
          aria-expanded={documentOpen}
          onClick={() => setDocumentOpen((v) => !v)}
        >
          <FileText size={15} />
          {documentOpen ? 'Скрыть условия' : scenario.document.title}
          <ChevronDown size={14} />
        </button>
      </div>
      {documentOpen && (
        <div className="story-document">
          <span>
            <FileText size={17} />
            Условия на столе
          </span>
          <p>{scenario.document.text}</p>
        </div>
      )}
      <div
        className="story-choices scenario-options"
        role="radiogroup"
        aria-label="Решение для события месяца"
      >
        {scenario.options.map((o, i) => (
          <label
            className={`story-choice scenario-option ${index === i ? 'chosen' : ''}`}
            key={o.id}
          >
            <input
              type="radio"
              name="scenario"
              checked={selected === o.id}
              onChange={() => select(o.id)}
            />
            <div className="choice-illustration">
              <StoryObject kind={meta.props[i]} />
              <span className="choice-check">
                {index === i ? <Check size={14} /> : String(i + 1)}
              </span>
            </div>
            <div className="choice-content">
              <b>{o.title}</b>
              <small>{o.description}</small>
              <span className="choice-action">
                {index === i ? 'В твоём плане' : 'Выбрать'}
                {index === i ? <Check size={14} /> : <MousePointer2 size={14} />}
              </span>
            </div>
          </label>
        ))}
      </div>
      <div className="story-selection-status" role="status">
        <ShieldCheck size={15} />
        <span>
          {index < 0
            ? 'Выбери предмет в сцене или карточку под ней.'
            : 'Ход добавлен в план. Выбери действия в остальных ситуациях и проверь бюджет.'}
        </span>
      </div>
    </article>
  );
}
