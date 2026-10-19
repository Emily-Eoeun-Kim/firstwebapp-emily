import Link from "next/link";
import GradeBadge from "@/components/GradeBadge";
import type { Buyer } from "@/lib/buyers";
import { pct, usd } from "@/lib/format";

// 우량 10 · 위험 10 맞대결: 넓은 화면은 좌우, 휴대폰은 위아래. 줄을 누르면(<details>) 핵심 칸이 펼쳐진다.
type Side = "good" | "risk";

const THEME = {
  good: { box: "border-good bg-good-soft", title: "text-good", bar: "bg-good md:ml-auto", rank: "bg-good" },
  risk: { box: "border-grade-c bg-risk-soft", title: "text-grade-c", bar: "bg-grade-c", rank: "bg-grade-c" },
} as const;

function Chevron() {
  return (
    <svg
      viewBox="0 0 20 20"
      className="size-5 shrink-0 stroke-muted transition-transform group-open:rotate-180"
      fill="none"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M5 8l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Column({ side, title, line, buyers }: { side: Side; title: string; line: string; buyers: Buyer[] }) {
  const t = THEME[side];
  // 우량은 막대 = 채권(가장 큰 곳 기준), 위험은 막대 = 위험 점수(0–100%)
  const max = side === "good" ? Math.max(0, ...buyers.map((b) => b.openArUsd)) : 1;

  return (
    <section aria-labelledby={`duel-${side}`} className={`rounded-lg border-t-4 p-4 ${t.box}`}>
      <h2 id={`duel-${side}`} className={`text-lg font-bold ${t.title}`}>
        {title}
      </h2>
      <p className="mt-1 text-sm text-muted">{line}</p>
      <ol className="mt-3 space-y-2">
        {buyers.map((b, i) => {
          const value = side === "good" ? b.openArUsd : b.pd30d;
          const width = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
          return (
            <li key={b.id}>
              <details className="group rounded-md border border-line bg-bg">
                <summary className="flex min-h-11 cursor-pointer items-center gap-3 px-3 py-2">
                  <span
                    className={`num inline-flex size-7 shrink-0 items-center justify-center rounded text-sm font-bold text-white ${t.rank}`}
                  >
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-ink" title={b.name}>
                      {b.name}
                    </span>
                    <span className="mt-1 flex h-2 rounded-sm bg-surface" aria-hidden="true">
                      <span className={`block h-2 rounded-sm ${t.bar}`} style={{ width: `${width}%` }} />
                    </span>
                  </span>
                  <span className="num shrink-0 text-sm font-semibold text-ink">
                    {side === "good" ? usd(b.openArUsd) : pct(b.pd30d)}
                  </span>
                  <Chevron />
                </summary>
                <div className="space-y-2 border-t border-line px-3 py-3 text-sm">
                  <dl className="grid grid-cols-2 gap-x-3 gap-y-2">
                    <div>
                      <dt className="text-muted">채권</dt>
                      <dd className="num font-semibold text-ink">{usd(b.openArUsd)}</dd>
                    </div>
                    <div>
                      <dt className="text-muted">연체</dt>
                      <dd className="num font-semibold text-ink">{usd(b.overdueUsd)}</dd>
                    </div>
                    <div>
                      <dt className="text-muted">최근 1년 평균 지연</dt>
                      <dd className="num font-semibold text-ink">
                        {b.avgDaysLate12m === null ? "—" : `${b.avgDaysLate12m.toFixed(1)}일`}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted">위험 점수</dt>
                      <dd className="num font-semibold text-ink">{pct(b.pd30d)}</dd>
                    </div>
                  </dl>
                  <p className="flex flex-wrap items-center gap-2 text-ink">
                    <GradeBadge grade={b.grade} />
                    <span>{b.countryKo}</span>
                    <span className="text-muted">·</span>
                    <span>{b.industry}</span>
                  </p>
                  <p className="text-ink">
                    <span className="text-muted">첫 신호 </span>
                    {b.signals[0] ?? "—"}
                  </p>
                  <Link href={`/buyers/${b.id}`} className="inline-flex min-h-11 items-center font-semibold text-accent hover:underline">
                    {b.id} 상세 보기
                  </Link>
                </div>
              </details>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export default function DuelBoard({
  good,
  risk,
  goodLine,
  riskLine,
}: {
  good: Buyer[];
  risk: Buyer[];
  goodLine: string;
  riskLine: string;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Column side="good" title={`우량 거래처 ${good.length}`} line={goodLine} buyers={good} />
      <Column side="risk" title={`위험 상위 ${risk.length}`} line={riskLine} buyers={risk} />
    </div>
  );
}
