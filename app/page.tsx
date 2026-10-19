import Link from "next/link";
import BriefingButton from "@/components/BriefingButton";
import DeployBadge from "@/components/DeployBadge";
import DuelBoard from "@/components/DuelBoard";
import GradeDonut from "@/components/GradeDonut";
import { getBuyers } from "@/lib/buyers";
import { int, pct, usd } from "@/lib/format";
import { GOOD_MAX_LATE_DAYS, goodTop, gradeCounts, kpis, topRisk, totalAr } from "@/lib/metrics";

// 한빛정밀 CRM 첫 화면 — 숫자는 data/buyers.json에서 lib/metrics.ts가 계산한다(손으로 적은 숫자 없음).
export default async function Home() {
  const buyers = await getBuyers();
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
    risk[0] ? `위험 상위 1위는 ${risk[0].name}, 위험 점수 ${pct(risk[0].pd30d)}입니다.` : "",
  ]
    .filter(Boolean)
    .join(" ");

  const stats = [
    { label: "전체 채권", tone: "text-brand", value: usd(k.arUsd), sub: `${int(k.count)}곳` },
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
