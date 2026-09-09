import type { ScoreFactor } from '../../api/searchApi';

export function ScoreExplanation({
  score,
  factors,
  title,
}: {
  score: number;
  factors: ScoreFactor[];
  title: string;
}) {
  return (
    <div className="rounded-[12px] border border-cac-line bg-[#eff7f3] p-3">
      <p className="text-pequena font-bold text-cac-navy">
        {title} <span className="text-cac-green">{score}%</span>
      </p>
      <ul className="mt-2 space-y-1.5">
        {factors.slice(0, 5).map((factor) => (
          <li key={factor.label} className="flex items-center justify-between gap-2 text-mini text-cac-muted">
            <span>
              {factor.label} <span className="text-cac-ink/50">({factor.weight}%)</span>
            </span>
            <b className="text-cac-navy">{Math.round(factor.value)}%</b>
          </li>
        ))}
      </ul>
    </div>
  );
}
