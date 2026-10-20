import Link from "next/link";
import BarRow from "@/components/BarRow";
import DataTable, { type Column } from "@/components/DataTable";
import GradeBadge from "@/components/GradeBadge";
import KpiCard from "@/components/KpiCard";
import PageHeader from "@/components/PageHeader";
import { getBuyers, type Buyer } from "@/lib/buyers";
import { int, pct, usd } from "@/lib/format";
import { byRegion, filterByGrade, gradeCounts, isGrade, kpis, type Grade } from "@/lib/metrics";

export const dynamic = "force-dynamic";

export const metadata = { title: "바이어" };

const LIST_COLUMNS: Column[] = [
  { key: "buyer", label: "바이어" },
  { key: "country", label: "나라" },
  { key: "grade", label: "등급" },
  { key: "pd", label: "위험 점수", align: "right" },
  { key: "ar", label: "채권", align: "right" },
  { key: "overdue", label: "연체", align: "right" },
];

type SearchBy = "name" | "country";

function buyerRow(b: Buyer) {
  return {
    buyer: (
      <div>
        <Link href={`/buyers/${b.id}`} className="inline-flex min-h-11 items-center text-accent hover:underline">
          {b.name}
        </Link>
        <span className="num block text-xs text-muted">{b.id}</span>
      </div>
    ),
    country: b.countryKo,
    grade: <GradeBadge grade={b.grade} />,
    pd: pct(b.pd30d),
    ar: usd(b.openArUsd),
    overdue: usd(b.overdueUsd),
  };
}

/** 이름: 일부만 맞아도(대소문자 무시). 국가: 한글 이름(독일)이나 코드(DEU)의 일부. 빈 검색어면 그대로. */
function search(buyers: Buyer[], q: string, by: SearchBy): Buyer[] {
  const needle = q.toLowerCase();
  if (!needle) return buyers;
  return buyers.filter((b) =>
    by === "name"
      ? b.name.toLowerCase().includes(needle)
      : b.countryKo.toLowerCase().includes(needle) || b.countryCode.toLowerCase().includes(needle),
  );
}

/** 전체 목록 주소 — 검색어 · 기준 · 등급을 함께 남긴다(주소를 보내면 같은 목록이 보인다). */
function listHref(q: string, by: SearchBy, grade: Grade | null): string {
  const p = new URLSearchParams();
  if (q) {
    p.set("by", by);
    p.set("q", q);
  }
  if (grade) p.set("grade", grade);
  const s = p.toString();
  return `/buyers${s ? `?${s}` : ""}#list`;
}

type SP = Promise<{ grade?: string | string[]; q?: string | string[]; by?: string | string[] }>;

export default async function Page({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const rawGrade = one(sp.grade);
  const selected = isGrade(rawGrade) ? rawGrade : null;
  const q = (one(sp.q) ?? "").trim().slice(0, 50);
  const by: SearchBy = one(sp.by) === "country" ? "country" : "name";

  // 제목 · 요약 칸 · 지역별은 언제나 DB의 바이어 전체 기준(바이어가 늘거나 줄면 그대로 따라간다).
  // 검색 · 등급 칩은 전체 목록만 거른다.
  const buyers = await getBuyers();
  const k = kpis(buyers);
  const grades = new Map(gradeCounts(buyers).map((g) => [g.grade, g.count]));
  const share = (n: number) => `전체의 ${pct(k.count > 0 ? n / k.count : null)}`;
  const sCount = grades.get("S") ?? 0;
  const abCount = (grades.get("A") ?? 0) + (grades.get("B") ?? 0);
  const cCount = grades.get("C") ?? 0;

  const regions = byRegion(buyers);
  const regionMax = regions[0]?.arUsd ?? 0;
  const strongRegion = regions.reduce<(typeof regions)[number] | null>(
    (best, r) => (r.cShare !== null && (best === null || r.cShare > (best.cShare ?? -1)) ? r : best),
    null,
  )?.region;

  const found = search(buyers, q, by);
  const listed = filterByGrade(found, selected);

  const chips = [
    { key: "all", label: "전체", count: found.length, href: listHref(q, by, null), active: selected === null },
    ...gradeCounts(found).map((g) => ({
      key: g.grade,
      label: g.grade,
      count: g.count,
      href: listHref(q, by, g.grade),
      active: selected === g.grade,
    })),
  ];

  const field = "min-h-11 rounded-md border border-line bg-bg px-3 text-ink";

  return (
    <div className="space-y-8">
      <PageHeader
        title={`총 바이어 ${int(k.count)}`}
        asof="2026-09-30 · (가상) 합성 데이터"
        line="위험 점수는 AI 기준으로 환산되었으며, 최종 검토가 필요합니다."
      />

      <section aria-label="요약 숫자" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard label="우량 바이어(S등급)" value={`${int(sCount)}곳`} sub={share(sCount)} />
        <KpiCard label="일반 바이어(A · B등급)" value={`${int(abCount)}곳`} sub={share(abCount)} />
        <KpiCard label="위험 바이어(C등급)" value={`${int(cCount)}곳`} sub={share(cCount)} />
        <KpiCard label="C등급 채권" value={usd(k.cArUsd)} sub={`전체의 ${pct(k.cShare)}`} />
        <KpiCard label="전체 채권" value={usd(k.arUsd)} sub={`${int(k.count)}곳`} />
        <KpiCard label="연체 금액" value={usd(k.overdueUsd)} sub={`${int(k.overdueCount)}곳`} />
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

      <section id="list" aria-labelledby="all-buyers" className="scroll-mt-4 space-y-3">
        <h2 id="all-buyers" className="text-lg font-bold text-ink">
          전체 목록
        </h2>

        <form method="get" action="/buyers#list" role="search" aria-label="바이어 찾기" className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <label htmlFor="search-by" className="sr-only">
              찾을 기준
            </label>
            <select id="search-by" name="by" defaultValue={by} className={field}>
              <option value="name">이름</option>
              <option value="country">국가</option>
            </select>
            <label htmlFor="search-q" className="sr-only">
              찾을 글
            </label>
            <input
              id="search-q"
              name="q"
              type="search"
              defaultValue={q}
              placeholder="이름 일부 · 국가(예: Hefei · 독일 · DEU)"
              className={`${field} min-w-0 flex-1 basis-48`}
            />
            {selected ? <input type="hidden" name="grade" value={selected} /> : null}
            <button
              type="submit"
              className="inline-flex min-h-11 items-center rounded-md bg-accent px-4 font-semibold text-white"
            >
              검색
            </button>
          </div>
          {q ? (
            <p className="flex flex-wrap items-center gap-x-3 text-sm text-muted">
              <span>
                {by === "name" ? "이름" : "국가"}에 &lsquo;{q}&rsquo;가 든 바이어{" "}
                <span className="num">{int(found.length)}곳</span>
              </span>
              <Link
                href={listHref("", by, selected)}
                className="inline-flex min-h-11 items-center font-semibold text-accent hover:underline"
              >
                검색 지우기
              </Link>
            </p>
          ) : null}
        </form>

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
          {selected ? `${selected}등급` : "전체"} <span className="num">{int(listed.length)}곳</span> · 위험 점수 높은 순
        </p>
        <DataTable
          columns={LIST_COLUMNS}
          rows={listed.map(buyerRow)}
          empty="찾는 바이어가 없습니다 — 다른 이름이나 국가로 찾아 보세요."
        />
      </section>
    </div>
  );
}
