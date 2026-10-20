import Link from "next/link";
import BriefingButton from "@/components/BriefingButton";
import DeployBadge from "@/components/DeployBadge";
import DuelBoard from "@/components/DuelBoard";
import GradeDonut from "@/components/GradeDonut";
import PromiseAlert from "@/components/PromiseAlert";
import PromiseTag, { PromiseCard } from "@/components/PromiseTag";
import { getBuyers } from "@/lib/buyers";
import { int, kst, pct, usd } from "@/lib/format";
import { GOOD_MAX_LATE_DAYS, goodTop, gradeCounts, kpis, topRisk, totalAr } from "@/lib/metrics";
import { dayToYmd, getPromises, mondayOf, todayDay } from "@/lib/promises";
import { getRecentReviews, statusClass } from "@/lib/reviews";

export const dynamic = "force-dynamic";

// 한빛정밀 CRM 첫 화면 — 숫자는 Supabase DB에서 읽은 바이어로 lib/metrics.ts가 계산한다(손으로 적은 숫자 없음).
export default async function Home() {
  const buyers = await getBuyers();
  const recent = await getRecentReviews(5);
  const today = todayDay();
  const promises = await getPromises(today);
  const promiseById = new Map(promises.map((r) => [r.id, r.p]));
  // 놓친 약속(날이 지났는데 '확인 필요') + 오늘부터 이번 주 일요일까지의 약속
  const missed = promises.filter((r) => r.p.missed);
  const thisWeek = promises.filter((r) => !r.p.missed && r.p.day >= today && r.p.day <= mondayOf(today) + 6);
  const todayItems = promises
    .filter((r) => r.p.diff === 0)
    .map((r) => ({ key: String(r.id), title: `${r.buyerId} · 오늘 약속`, body: `${r.buyerName} — ${r.memo.slice(0, 100)}` }));
  const k = kpis(buyers);
  const good = goodTop(buyers, 10);
  const risk = topRisk(buyers, 10);
  const goodAr = totalAr(good);
  const goodShare = k.arUsd > 0 ? goodAr / k.arUsd : null;

  // 읽어 주기용 글 — 서버에서 만들어 브라우저 부품에는 이 글만 넘긴다.
  const briefing = [
    "한빛정밀 CRM 브리핑입니다. 기준일은 2026년 9월 30일입니다.",
    `거래처 ${int(k.count)}곳의 전체 채권은 ${int(k.arUsd)}달러입니다.`,
    `C등급 채권은 ${int(k.cArUsd)}달러로, 전체의 ${pct(k.cShare)}입니다.`,
    good[0] ? `우량 거래처 1위는 ${good[0].name}, 채권 ${int(good[0].openArUsd)}달러입니다.` : "",
    risk[0] ? `위험 거래처 1위는 ${risk[0].name}, 위험 점수 ${pct(risk[0].pd30d)}입니다.` : "",
  ]
    .filter(Boolean)
    .join(" ");

  const stats = [
    { label: "전체 채권", tone: "text-brand", value: usd(k.arUsd), sub: `${int(k.count)}곳 · Supabase DB에서 읽음` },
    { label: `우량 ${good.length}곳 채권`, tone: "text-good", value: usd(goodAr), sub: `전체의 ${pct(goodShare)}` },
    { label: "C등급 채권", tone: "text-grade-c", value: usd(k.cArUsd), sub: `전체의 ${pct(k.cShare)} · ${int(k.cCount)}곳` },
  ];

  return (
    <div className="space-y-6">
      <section aria-labelledby="crm-title" className="rounded-lg bg-brand p-5 text-white sm:p-6">
        <p className="text-sm text-brand-soft">기준: 2026-09-30 · (가상) 합성 데이터</p>
        <h1 id="crm-title" className="mt-1 text-2xl font-bold">
          한빛정밀 CRM
        </h1>
        <p className="mt-2 text-brand-soft">
          거래처 <span className="num">{int(k.count)}곳</span>의 채권과 위험을 한 장에 모았습니다. 위험 점수는 판단을 돕는
          값이고, 결정은 사람이 합니다.
        </p>
        <dl className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {stats.map((s) => (
            <div key={s.label} className="rounded-md bg-bg p-3">
              <dt className={`text-sm font-semibold ${s.tone}`}>{s.label}</dt>
              <dd className="num mt-1 text-xl font-bold text-ink">{s.value}</dd>
              <dd className="num text-sm text-muted">{s.sub}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-5">
          <BriefingButton text={briefing} />
        </div>
      </section>

      <section aria-labelledby="promises" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="promises" className="text-lg font-bold text-ink">
            오늘 · 이번 주 약속
          </h2>
          <Link
            href="/calendar"
            className="inline-flex min-h-11 items-center text-sm font-semibold text-accent hover:underline"
          >
            캘린더에서 보기
          </Link>
        </div>
        <p className="text-sm text-muted">
          오늘 <span className="num">{dayToYmd(today)}</span> 기준 · 확인 기록 메모 속 날짜로 만든 약속입니다.
        </p>
        <PromiseAlert today={dayToYmd(today)} items={todayItems} />
        {missed.length + thisWeek.length > 0 ? (
          <ul className="space-y-2">
            {[...missed, ...thisWeek].map((r) => (
              <li key={r.id}>
                <PromiseCard row={r} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted">이번 주 약속도, 놓친 약속도 없습니다</p>
        )}
      </section>

      <DuelBoard
        good={good}
        risk={risk}
        goodLine={`연체 $0 · 최근 1년 평균 지연 ${GOOD_MAX_LATE_DAYS}일 이하 · 채권 큰 순. 줄을 누르면 펼쳐집니다.`}
        riskLine="위험 점수 높은 순(막대 = 위험 점수). 줄을 누르면 펼쳐집니다."
      />

      <section aria-labelledby="grade-mix" className="rounded-lg bg-brand-soft p-4 sm:p-5">
        <h2 id="grade-mix" className="mb-3 text-lg font-bold text-brand">
          등급 구성
        </h2>
        <GradeDonut counts={gradeCounts(buyers)} total={k.count} />
      </section>

      <section aria-labelledby="recent-reviews" className="space-y-3">
        <h2 id="recent-reviews" className="text-lg font-bold text-ink">
          최근 확인 기록
        </h2>
        {recent.length > 0 ? (
          <ul className="space-y-2">
            {recent.map((r) => (
              <li key={r.id} className="rounded-lg border border-line bg-bg p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/buyers/${r.buyerId}`}
                    className="inline-flex min-h-11 items-center font-semibold text-accent hover:underline"
                  >
                    <span className="num">{r.buyerId}</span>&nbsp;· {r.buyer.name}
                  </Link>
                  <span
                    className={`inline-flex items-center rounded border px-1.5 text-sm font-semibold ${statusClass(r.status)}`}
                  >
                    {r.status}
                  </span>
                  {promiseById.get(r.id) ? <PromiseTag p={promiseById.get(r.id)!} /> : null}
                </div>
                <p className="mt-1 whitespace-pre-line wrap-break-word text-ink">{r.memo}</p>
                <p className="mt-1 text-sm text-muted">
                  {r.reviewer} · <span className="num">{kst(r.createdAt)}</span>
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted">아직 확인 기록이 없습니다</p>
        )}
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/buyers"
          className="inline-flex min-h-11 items-center rounded-md border border-brand px-4 font-semibold text-brand hover:bg-brand-soft"
        >
          바이어 전체 목록 보기
        </Link>
        <DeployBadge />
      </div>
    </div>
  );
}
