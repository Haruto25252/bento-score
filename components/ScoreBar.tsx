interface Props {
  label: string
  value: number
}

export default function ScoreBar({ label, value }: Props) {
  const pct = ((value + 10) / 20) * 100

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-[var(--text-muted)] w-20 shrink-0">{label}</span>
      <div className="score-bar-track flex-1">
        <div
          className={`score-bar-fill ${value < 0 ? 'score-bar-fill-neg' : ''}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-mono w-6 text-right">{value > 0 ? `+${value}` : value}</span>
    </div>
  )
}
