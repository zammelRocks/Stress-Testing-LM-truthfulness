function trimTrailingZeros(s: string) {
  return s.replace(/0+$/g, "").replace(/\.$/, "");
}

export default function ScoreCard({
  label,
  value,
  icon,
  emphasize,
  max = 10,
}: {
  label: string;
  value?: number | null;
  icon: string;
  emphasize?: boolean;
  max?: number;
}) {
  const v = typeof value === "number" ? value : null;
  const clamped = v === null ? 0 : Math.max(0, Math.min(max, v));
  const percentage = v === null ? 0 : (clamped / max) * 100;
  const scoreColor =
    percentage >= 80 ? "success" : percentage >= 60 ? "warning" : percentage >= 40 ? "info" : "danger";
  const display = v === null ? "–" : max === 1 ? trimTrailingZeros(v.toFixed(3)) : v.toFixed(1);

  return (
    <div className={`ai-score-card ${emphasize ? "ai-score-card-emphasis" : ""}`}>
      <div className="d-flex align-items-center mb-3">
        <div className={`ai-score-icon me-2 ${emphasize ? "text-warning" : "text-light"}`}>
          <i className={icon}></i>
        </div>
        <small className="ai-score-label">{label}</small>
      </div>

      <div className="ai-score-value mb-3">
        <span className={`display-6 fw-bold ${emphasize ? "text-warning" : "text-light"}`}>{display}</span>
        <small className="text-muted ms-1">/ {max}</small>
      </div>

      <div className="ai-progress-container">
        <div className="ai-progress-bar">
          <div
            className={`ai-progress-fill ${emphasize ? "ai-progress-emphasis" : `ai-progress-${scoreColor}`}`}
            style={{ width: `${percentage}%` }}
          >
            <div className="ai-progress-glow"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
