import { int, pct } from "@/lib/format";

// 등급 도넛: 곳 수 비율을 원 둘레로. 색 옆에 언제나 등급 글자와 곳 수를 함께 적는다.
const STROKE: Record<string, string> = {
  S: "stroke-grade-s",
  A: "stroke-grade-a",
  B: "stroke-grade-b",
  C: "stroke-grade-c",
};
const FILL: Record<string, string> = {
  S: "bg-grade-s",
  A: "bg-grade-a",
  B: "bg-grade-b",
  C: "bg-grade-c",
};

const R = 48;
const C = 2 * Math.PI * R;

export default function GradeDonut({ counts, total }: { counts: { grade: string; count: number }[]; total: number }) {
  let offset = 0;
  const arcs = counts.map((g) => {
    const len = total > 0 ? (g.count / total) * C : 0;
    const arc = { grade: g.grade, len, offset };
    offset += len;
    return arc;
  });
  const label = counts.map((g) => `${g.grade}등급 ${g.count}곳`).join(", ");

  return (
    <div className="flex flex-wrap items-center gap-6">
      <svg viewBox="0 0 120 120" className="size-36 shrink-0" role="img" aria-label={`등급 구성: ${label}`}>
        <circle cx="60" cy="60" r={R} fill="none" strokeWidth="16" className="stroke-bg" />
        <g transform="rotate(-90 60 60)">
          {arcs.map((a) => (
            <circle
              key={a.grade}
              cx="60"
              cy="60"
              r={R}
              fill="none"
              strokeWidth="16"
              strokeDasharray={`${a.len} ${C - a.len}`}
              strokeDashoffset={-a.offset}
              className={STROKE[a.grade] ?? "stroke-line"}
            />
          ))}
        </g>
        <text x="60" y="58" textAnchor="middle" className="num fill-ink text-2xl font-bold">
          {int(total)}
        </text>
        <text x="60" y="76" textAnchor="middle" className="fill-muted text-xs">
          곳
        </text>
      </svg>
      <ul className="grid flex-1 grid-cols-2 gap-x-4 gap-y-2 text-sm">
        {counts.map((g) => (
          <li key={g.grade} className="flex items-center gap-2">
            <span className={`size-3 shrink-0 rounded-sm ${FILL[g.grade] ?? "bg-line"}`} aria-hidden="true" />
            <span className="font-semibold text-ink">{g.grade}</span>
            <span className="num text-ink">{int(g.count)}곳</span>
            <span className="num text-muted">{pct(total > 0 ? g.count / total : null)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
