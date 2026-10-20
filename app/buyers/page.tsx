import Link from "next/link";
import BarRow from "@/components/BarRow";
import DataTable, { type Column } from "@/components/DataTable";
import GradeBadge from "@/components/GradeBadge";
import KpiCard from "@/components/KpiCard";
import PageHeader from "@/components/PageHeader";
import { getBuyers, type Buyer } from "@/lib/buyers";
import { int, pct, usd } from "@/lib/format";
import { byRegion, filterByGrade, gradeCounts, isGrade, kpis, topRisk } from "@/lib/metrics";

export const dynamic = "force-dynamic";

export const metadata = { title: "바이어" };

const TOP_COLUMNS: Column[] = [
  { key: "buyer", label: "바이어" },
  { key: "country", label: "나라" },
  { key: "grade", label: "등급" },
  { key: "pd", label: "위험 점수", align: "right" },
  { key: "ar", label: "채권", align: "right" },
  { key: "overdue", label: "연체", align: "right" },
  { key: "signal", label: "첫 신호" },
];

const LIST_COLUMNS: Column[] = TOP_COLUMNS.filter((c) => c.key !== "signal");

function buyerRow(b: Buyer, title: string) {
  return {
    buyer: (
      <div>
        <Link href={`/buyers/${b.id}`} className="inline-flex min-h-11 items-center text-accent hover:underline">
          {title}
        </Link>
        <span className="num block text-xs text-muted">{b.id}</span>
      </div>
    ),
    country: b.countryKo,
    grade: <GradeBadge grade={b.grade} />,
    pd: pct(b.pd30d),
    ar: usd(b.openArUsd),
    overdue: usd(b.overdueUsd),
    signal: b.signals[0] ?? "—",
  };
}

export default async function Page({ searchParams }: { searchParams: Promise<{ grade?: string | string[] }> }) {
  const sp = await searchParams;
  const raw = Array.isArray(sp.grade) ? sp.grade[0] : sp.grade;
  const selected = isGrade(raw) ? raw : null;

  // KPI · 위험 상위 10 · 지역별은 언제나 150곳 전체 기준 — 등급 칩은 전체 목록만 거른다.
  const buyers = await getBuyers();
  const k = kpis(buyers);
  const top = topRisk(buyers, 10);
  const regions = byRegion(buyers);
  const regionMax = regions[0]?.arUsd ?? 0;
  const strongRegion = regions.reduce<(typeof regions)[number] | null>(
    (best, r) => (r.cShare !== null && (best === null || r.cShare > (best.cShare ?? -1)) ? r : best),
    null,
  )?.region;
  const listed = filterByGrade(buyers, selected);

  const chips = [
    { key: "all", label: "전체", count: k.count, href: "/buyers", active: selected === null },
    ...gradeCounts(buyers).map((g) => ({
      key: g.grade,
      label: g.grade,
      count: g.count,
      href: `/buyers?grade=${g.grade}`,
      active: selected === g.grade,
    })),
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title={`바이어 ${int(k.count)}곳`}
        asof="2026-09-30 · (가상) 합성 데이터"
        line="위험 점수는 판단을 돕는 값이고, 결정은 사람이 합니다."
      />

      <section aria-label="요약 숫자" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="위험 바이어(C등급)" value={`${int(k.cCount)}곳`} />
        <KpiCard label="C등급 채권" value={usd(k.cArUsd)} sub={`전체의 ${pct(k.cShare)}`} />
        <KpiCard label="전체 채권" value={usd(k.arUsd)} sub={`${int(k.count)}곳`} />
        <KpiCard label="연체 금액" value={usd(k.overdueUsd)} sub={`${int(k.overdueCount)}곳`} />
      </section>

      <section aria-labelledby="top-risk" className="space-y-3">
        <h2 id="top-risk" className="text-lg font-bold text-ink">
          위험 상위 10
        </h2>
        <DataTable
          caption="위험 점수가 높은 순(같으면 바이어 번호 순)"
          columns={TOP_COLUMNS}
          rows={top.map((b, i) => buyerRow(b, `${i + 1}. ${b.name}`))}
        />
      </section>

      <section aria-labelledby="by-region" className="space-y-3">
        <h2 id="by-region" className="text-lg font-bold text-ink">
          지역별 채권
        </h2>
        <ul className="space-y-2">
          {regions.map((r) => (
            <li key={r.region}>
              <BarRow
                label={r.region}
                value={r.arUsd}
                max={regionMax}
                display={usd(r.arUsd)}
                strong={r.region === strongRegion}
              />
              <p className="text-xs text-muted">
                C등급 <span className="num">{usd(r.cArUsd)}</span> · <span className="num">{pct(r.cShare)}</span>
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="all-buyers" className="space-y-3">
        <h2 id="all-buyers" className="text-lg font-bold text-ink">
          전체 목록
        </h2>
        <nav aria-label="등급으로 거르기">
          <ul className="flex flex-wrap gap-2">
            {chips.map((c) => (
              <li key={c.key}>
                <Link
                  href={c.href}
                  aria-current={c.active ? "page" : undefined}
                  className={`inline-flex min-h-11 items-center rounded-md border px-4 text-sm ${
                    c.active ? "border-accent bg-accent text-white" : "border-line bg-bg text-ink hover:bg-surface"
                  }`}
                >
                  {c.label} <span className="num ml-1">{int(c.count)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <p className="text-sm text-muted">
          {selected ? `${selected}등급` : "전체"} <span className="num">{int(listed.length)}곳</span>
        </p>
        <DataTable columns={LIST_COLUMNS} rows={listed.map((b) => buyerRow(b, b.name))} />
      </section>
    </div>
  );
}
