import React, { useMemo } from "react";

type Props = {
  label: string;
  value: number | null;
  icon?: string;   // e.g. "fas fa-code"
  max?: number;    // default 1
};

function clamp01(x: number) {
  if (Number.isNaN(x) || !Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

function formatValue(v: number | null, max: number): string {
  if (v === null || v === undefined) return "—";
  // If max ≤ 1 we assume 0..1 metrics, show 3 dp
  if (max <= 1) return v.toFixed(3);
  // If max looks like 100, show 2 dp
  if (max <= 100) return v.toFixed(2);
  // Fallback
  return v.toFixed(3);
}

export default function ScoreCard({ label, value, icon, max = 1 }: Props) {
  const pct = useMemo(() => {
    if (value === null || value === undefined || !Number.isFinite(value)) return 0;
    const denom = max || 1;
    return clamp01(value / denom);
  }, [value, max]);

  const display = formatValue(value ?? null, max);
  const aria = value == null ? "No score yet" : `${label} ${display} of ${max}`;

  return (
    <div className="score-card" role="group" aria-label={aria}>
      <div className="score-card__head">
        <div className="score-card__label">
          {icon ? <i className={`${icon} me-2`} aria-hidden="true" /> : null}
          <span>{label}</span>
        </div>
        <div className="score-card__value" aria-live="polite">
          {display}
          {max > 1 ? <span className="score-card__unit"> / {max}</span> : null}
        </div>
      </div>

      <div className="score-card__bar" aria-hidden="true">
        <div
          className="score-card__bar-fill"
          style={{ width: `${pct * 100}%` }}
        />
      </div>

      {/* hint text for empty state */}
      {value == null ? (
        <div className="score-card__hint">Run evaluation to populate</div>
      ) : null}
    </div>
  );
}