import { Landmark, type LucideIcon } from 'lucide-react';

export function Meter({ value, tone = 'green' }: { value: number; tone?: string }) {
  return (
    <div className={'meter ' + tone}>
      <span style={{ width: Math.max(0, Math.min(100, value)) + '%' }} />
    </div>
  );
}
export function Numeric({
  label,
  value,
  onChange,
  max = 100000,
  step = 500,
  hint,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  max?: number;
  step?: number;
  hint?: string;
}) {
  return (
    <label className="numeric-field">
      <span>{label}</span>
      <div className="number-wrap">
        <input
          type="number"
          inputMode="numeric"
          min="0"
          max={max}
          step={step}
          value={value}
          onChange={(e) =>
            onChange(Math.max(0, Math.min(max, Math.floor(Number(e.target.value) || 0))))
          }
        />
        <span>₽</span>
      </div>
      {hint && <small>{hint}</small>}
    </label>
  );
}
export function Badge({ children, tone = '' }: { children: React.ReactNode; tone?: string }) {
  return <span className={'badge ' + tone}>{children}</span>;
}
export function Empty({
  icon: Icon = Landmark,
  title,
  children,
}: {
  icon?: LucideIcon;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="empty-state">
      <Icon size={32} />
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}
