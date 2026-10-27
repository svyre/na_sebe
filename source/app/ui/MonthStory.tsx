import {
  CAST,
  epilogueFor,
  type Chapter,
  type StoryChoiceId,
  type StoryMessage,
  type StoryRecord,
} from '@/lib/narrative';
import type { Solo } from '@/lib/game';
import { ChevronDown, MessageCircle } from 'lucide-react';
import { useId, useState } from 'react';

function Message({ message }: { message: StoryMessage }) {
  const person = CAST[message.from];
  return (
    <div className="chapter-message">
      <span className={`chapter-avatar cast-${message.from}`} aria-hidden="true">
        {person.initial}
      </span>
      <div>
        <b>
          {person.name}
          <small>{person.role}</small>
        </b>
        <p>{message.text}</p>
      </div>
    </div>
  );
}
export function MonthStory({
  chapter,
  selected,
  onChoose,
}: {
  chapter: Chapter;
  selected?: StoryChoiceId;
  onChoose: (choice: StoryChoiceId) => void;
}) {
  const [collapsed, setCollapsed] = useState(!!selected);
  const body = useId();
  const choice = chapter.choices.find((item) => item.id === selected);
  return (
    <section className="month-story" aria-labelledby={`${body}-title`}>
      <header>
        <div>
          <MessageCircle size={19} />
          <h2 id={`${body}-title`}>{chapter.title}</h2>
        </div>
        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          aria-expanded={!collapsed}
          aria-controls={body}
        >
          {collapsed ? 'Читать' : 'Свернуть'}
          <ChevronDown size={16} className={!collapsed ? 'rotated' : ''} />
        </button>
      </header>
      {collapsed ? (
        <p className="chapter-collapsed">{choice?.label || chapter.setting}</p>
      ) : (
        <div id={body}>
          <p className="chapter-setting">{chapter.setting}</p>
          {chapter.recall && <p className="chapter-recall">{chapter.recall}</p>}
          <div className="chapter-messages">
            {chapter.messages.map((message, index) => (
              <Message key={`${message.from}-${index}`} message={message} />
            ))}
          </div>
          <div className="chapter-options" role="group" aria-label="Ответ в разговоре">
            {chapter.choices.map((item) => (
              <button
                type="button"
                key={item.id}
                aria-pressed={item.id === selected}
                onClick={() => onChoose(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
          {choice && (
            <div className="chapter-reply" role="status">
              <Message message={{ from: chapter.messages.at(-1)!.from, text: choice.reply }} />
            </div>
          )}
        </div>
      )}
    </section>
  );
}
export function StoryRecap({ record }: { record?: StoryRecord }) {
  if (!record) return null;
  return (
    <details className="story-recap">
      <summary>
        <MessageCircle size={16} />
        <span>{record.title}</span>
        <ChevronDown size={16} />
      </summary>
      <div>
        <p className="chapter-setting">{record.setting}</p>
        {record.recall && <p className="chapter-recall">{record.recall}</p>}
        {record.messages.map((message, index) => (
          <Message key={index} message={message} />
        ))}
        {record.choice && (
          <>
            <p className="chapter-player">Ты: {record.choice.label}</p>
            <Message message={{ from: record.messages.at(-1)!.from, text: record.choice.reply }} />
          </>
        )}
      </div>
    </details>
  );
}
export function NarrativeEnding({ data, achieved }: { data: Solo; achieved: boolean }) {
  const ending = epilogueFor(data, achieved);
  if (!ending) return null;
  return (
    <section className="panel narrative-ending">
      <h2>После последнего месяца</h2>
      <p className="chapter-setting">{ending.opening}</p>
      {ending.messages.map((message, index) => (
        <Message key={index} message={message} />
      ))}
    </section>
  );
}
