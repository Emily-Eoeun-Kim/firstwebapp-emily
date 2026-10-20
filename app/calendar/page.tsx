import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import PromiseAlert from "@/components/PromiseAlert";
import { PromiseCard } from "@/components/PromiseTag";
import {
  dayToYmd,
  getPromises,
  mondayOf,
  monthStart,
  partsOf,
  shortDate,
  todayDay,
  weekdayKo,
  ymdToDay,
  type PromiseRow,
} from "@/lib/promises";

export const dynamic = "force-dynamic";

export const metadata = { title: "캘린더" };

// 약속 캘린더 — 확인 기록 메모 속 날짜로 만든 약속을 월 · 주로 본다. 오늘은 접속한 날(한국 시각).
// 보기 · 날짜는 주소(?view=month|week&d=YYYY-MM-DD)에 둔다 — 주소를 보내면 같은 화면이 보인다.
type SP = Promise<{ view?: string | string[]; d?: string | string[] }>;

const HEADS = ["월", "화", "수", "목", "금", "토", "일"];

function one(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

function href(view: "month" | "week", day: number): string {
  return `/calendar?view=${view}&d=${dayToYmd(day)}`;
}

function DayList({ rows, empty }: { rows: PromiseRow[]; empty: string }) {
  if (rows.length === 0) return <p className="text-sm text-muted">{empty}</p>;
  return (
    <ul className="space-y-2">
      {rows.map((r) => (
        <li key={r.id}>
          <PromiseCard row={r} />
        </li>
      ))}
    </ul>
  );
}

const pill = "inline-flex min-h-11 items-center rounded-md border px-4 text-sm";

export default async function Page({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const view = one(sp.view) === "week" ? "week" : "month";
  const today = todayDay();
  const picked = ymdToDay(one(sp.d) ?? "") ?? today;

  const promises = await getPromises(today);
  const byDay = new Map<number, PromiseRow[]>();
  for (const r of promises) byDay.set(r.p.day, [...(byDay.get(r.p.day) ?? []), r]);

  const todayItems = (byDay.get(today) ?? []).map((r) => ({
    key: String(r.id),
    title: `${r.buyerId} · 오늘 약속`,
    body: `${r.buyerName} — ${r.memo.slice(0, 100)}`,
  }));

  const { y, m } = partsOf(picked);
  const shiftMonth = (k: number) => monthStart(y + Math.floor((m - 1 + k) / 12), ((((m - 1 + k) % 12) + 12) % 12) + 1);
  const first = monthStart(y, m);
  const prevFirst = shiftMonth(-1);
  const nextFirst = shiftMonth(1);
  const weekStart = mondayOf(picked);

  // 다른 달 · 다른 주로 갈 때, 그 범위에 오늘이 있으면 오늘을, 없으면 첫날을 고른다
  const pickIn = (start: number, end: number) => (today >= start && today < end ? today : start);
  const prevHref =
    view === "month"
      ? href("month", pickIn(prevFirst, first))
      : href("week", pickIn(weekStart - 7, weekStart));
  const nextHref =
    view === "month"
      ? href("month", pickIn(nextFirst, shiftMonth(2)))
      : href("week", pickIn(weekStart + 7, weekStart + 14));
  const rangeLabel =
    view === "month" ? `${y}년 ${m}월` : `${shortDate(weekStart)} – ${shortDate(weekStart + 6)}`;

  const monthCells: number[] = [];
  for (let d = mondayOf(first); d <= mondayOf(nextFirst - 1) + 6; d++) monthCells.push(d);

  const missedCount = promises.filter((r) => r.p.missed).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="약속 캘린더"
        asof={`오늘 ${dayToYmd(today)}(${weekdayKo(today)}) · 한국 시각`}
        line="확인 기록 메모 속 날짜(10/27 · 10월 27일 · 내일 · 다음 주 …)로 만든 약속입니다. '내일' · '다음 주' 같은 말은 기록한 날 기준으로 날짜를 정합니다."
      />

      <PromiseAlert today={dayToYmd(today)} items={todayItems} />

      {missedCount > 0 ? (
        <p className="text-sm font-semibold text-warn">
          놓친 약속 <span className="num">{missedCount}건</span> — 날이 지났는데 아직 &apos;확인 필요&apos;입니다.
        </p>
      ) : null}

      <nav aria-label="보기 고르기" className="flex flex-wrap items-center gap-2">
        {(["month", "week"] as const).map((v) => (
          <Link
            key={v}
            href={href(v, picked)}
            aria-current={view === v ? "page" : undefined}
            className={`${pill} ${view === v ? "border-accent bg-accent text-white" : "border-line bg-bg text-ink hover:bg-surface"}`}
          >
            {v === "month" ? "월" : "주"}
          </Link>
        ))}
        <Link href={href(view, today)} className={`${pill} border-line bg-bg text-ink hover:bg-surface`}>
          오늘로
        </Link>
      </nav>

      <div className="flex items-center justify-between gap-2">
        <Link href={prevHref} className={`${pill} border-line bg-bg text-ink hover:bg-surface`} aria-label="이전">
          이전
        </Link>
        <h2 className="num text-lg font-bold text-ink">{rangeLabel}</h2>
        <Link href={nextHref} className={`${pill} border-line bg-bg text-ink hover:bg-surface`} aria-label="다음">
          다음
        </Link>
      </div>

      {view === "month" ? (
        <>
          <div aria-label={`${y}년 ${m}월 약속`} className="grid grid-cols-7 gap-1">
            {HEADS.map((h) => (
              <div key={h} aria-hidden="true" className="py-1 text-center text-sm font-semibold text-muted">
                {h}
              </div>
            ))}
            {monthCells.map((d) => {
              const rows = byDay.get(d) ?? [];
              const inMonth = d >= first && d < nextFirst;
              const missed = rows.some((r) => r.p.missed);
              const isToday = d === today;
              const isPicked = d === picked;
              return (
                <Link
                  key={d}
                  href={href("month", d)}
                  aria-label={`${partsOf(d).m}월 ${partsOf(d).d}일${isToday ? " 오늘" : ""}, 약속 ${rows.length}건`}
                  aria-current={isPicked ? "date" : undefined}
                  className={`flex min-h-14 flex-col items-center justify-start gap-1 rounded-md border py-1 ${
                    isPicked ? "bg-brand-soft" : "bg-bg"
                  } ${isToday ? "border-accent" : "border-line"} hover:bg-surface`}
                >
                  <span
                    className={`num text-sm ${isToday ? "font-bold text-accent" : inMonth ? "text-ink" : "text-muted"}`}
                  >
                    {partsOf(d).d}
                  </span>
                  {rows.length > 0 ? (
                    <span
                      className={`num rounded px-1 text-xs font-semibold text-white ${missed ? "bg-warn" : "bg-accent"}`}
                    >
                      {rows.length}건
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </div>

          <section aria-labelledby="picked-day" className="space-y-3">
            <h2 id="picked-day" className="text-lg font-bold text-ink">
              <span className="num">{shortDate(picked)}</span> 약속{picked === today ? " · 오늘" : ""}
            </h2>
            <DayList rows={byDay.get(picked) ?? []} empty="이날 약속이 없습니다." />
          </section>
        </>
      ) : (
        <ol className="space-y-4">
          {Array.from({ length: 7 }, (_, i) => weekStart + i).map((d) => (
            <li key={d} className={`space-y-2 rounded-lg border p-3 ${d === today ? "border-accent" : "border-line"}`}>
              <h3 className="flex items-center gap-2 font-bold text-ink">
                <span className="num">{shortDate(d)}</span>
                {d === today ? (
                  <span className="rounded bg-accent px-1.5 text-sm font-semibold text-white">오늘</span>
                ) : null}
              </h3>
              <DayList rows={byDay.get(d) ?? []} empty="약속 없음" />
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
