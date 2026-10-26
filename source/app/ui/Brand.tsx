import { DIFFICULTIES, rub, type DifficultyId } from '@/lib/game';
import { Banknote, Flag, GraduationCap, House, PiggyBank, Wallet } from 'lucide-react';
import { bankLogo } from './bank-brand';

export function PartnerMark({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={'partner-lockup ' + (compact ? 'compact' : '')}
      aria-label="Совместно с Газпромбанком"
    >
      <span>Совместно с</span>
      <img src={bankLogo} alt="Газпромбанк" width="3840" height="811" />
    </div>
  );
}

export function LaunchArt({ difficulty = 'balance' }: { difficulty?: DifficultyId }) {
  const d = DIFFICULTIES[difficulty];
  return (
    <div className="launch-art">
      <div className="launch-sheet">
        <div className="art-grid" />
        <div className="launch-sheet-top">
          <span className="launch-symbol">
            <Wallet size={21} />
          </span>
          <div>
            <small>Сентябрь</small>
            <span>Стартовый бюджет</span>
          </div>
          <b>01 / 12</b>
        </div>
        <div className="launch-balance">
          {rub(d.cash + d.savings).replace(' ₽', '')} <span>₽</span>
        </div>
        <p className="launch-available">Доступно для распределения</p>
        <div className="launch-split">
          <div>
            <span>
              <Banknote size={17} />
              На руках
            </span>
            <b>{rub(d.cash)}</b>
          </div>
          <div>
            <span>
              <PiggyBank size={17} />
              Сбережения
            </span>
            <b>{rub(d.savings)}</b>
          </div>
        </div>
        <div className="launch-decisions">
          <span>
            <House size={14} />
            Жильё
          </span>
          <span>
            <GraduationCap size={15} />
            Учёба
          </span>
          <span>
            <Flag size={14} />
            Цель
          </span>
        </div>
      </div>
      <div className="launch-caption">
        <span className="status-dot" />
        Твой план определяет результат
      </div>
    </div>
  );
}
