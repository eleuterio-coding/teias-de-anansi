export type ProgressMeterProps = {
  label: string;
  value: number;
  max?: number;
  description?: string;
};

export function ProgressMeter({
  label,
  value,
  max = 100,
  description,
}: ProgressMeterProps) {
  const safeMax = Number.isFinite(max) && max > 0 ? max : 100;
  const safeValue = Number.isFinite(value) ? Math.min(Math.max(value, 0), safeMax) : 0;
  const percent = Math.round((safeValue / safeMax) * 100);

  return (
    <div className="ds-progress">
      <div className="ds-progress-heading">
        <span>{label}</span>
        <span className="ds-progress-value">{percent}%</span>
      </div>
      <progress max={safeMax} value={safeValue} aria-label={label} />
      {description && <p>{description}</p>}
    </div>
  );
}
