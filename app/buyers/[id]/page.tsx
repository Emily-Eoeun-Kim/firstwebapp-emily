import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import GradeBadge from "@/components/GradeBadge";
import PageHeader from "@/components/PageHeader";
import PromiseTag from "@/components/PromiseTag";
import ReviewForm from "@/components/ReviewForm";
import { getBuyer } from "@/lib/buyers";
import { int, kst, pct, usd } from "@/lib/format";
import { promiseMap, todayDay } from "@/lib/promises";
import { getReviews, statusClass } from "@/lib/reviews";

export const dynamic = "force-dynamic";

// 바이어 상세 — 요청 때마다 DB에서 읽어 만든다(generateStaticParams 없음).
type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const b = await getBuyer(id);
  return { title: b ? `${b.id} · ${b.name}` : "바이어를 찾을 수 없습니다" };
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  const b = await getBuyer(id);
  if (!b) notFound();
  const reviews = await getReviews(b.id);
  const promises = promiseMap(reviews, todayDay());

  const items: { label: string; value: ReactNode; num?: boolean }[] = [
    { label: "나라", value: b.countryKo },
    { label: "지역", value: b.region },
    { label: "업종", value: b.industry },
    { label: "결제방식", value: b.paymentMethod },
    { label: "결제기간", value: `${int(b.termsDays)}일`, num: true },
    { label: "채권", value: usd(b.openArUsd), num: true },
    { label: "연체", value: usd(b.overdueUsd), num: true },
    { label: "31일 넘긴 채권 비중", value: pct(b.pctAr31p), num: true },
    { label: "가장 오래 밀린 인보이스", value: `${int(b.oldestOpenDays)}일`, num: true },
    {
      label: "최근 1년 평균 지연",
      value: b.avgDaysLate12m === null ? "—" : `${b.avgDaysLate12m.toFixed(1)}일`,
      num: true,
    },
    { label: "위험 점수", value: pct(b.pd30d), num: true },
    { label: "등급", value: <GradeBadge grade={b.grade} /> },
  ];

  return (
    <div className="space-y-8">
      <PageHeader title={b.name} asof="2026-09-30 · (가상) 합성 데이터" line={`${b.id} · ${b.countryKo} · ${b.region}`} />

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {items.map((it) => (
          <div key={it.label} className="rounded-lg border border-line bg-surface p-3">
            <dt className="text-sm text-muted">{it.label}</dt>
            <dd className={`mt-1 font-semibold text-ink ${it.num ? "num" : ""}`}>{it.value}</dd>
          </div>
        ))}
      </dl>

      <section aria-labelledby="signals" className="space-y-3">
        <h2 id="signals" className="text-lg font-bold text-ink">
          위험 신호
        </h2>
        {b.signals.length > 0 ? (
          <ul className="list-disc space-y-1 pl-5 text-ink">
            {b.signals.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        ) : (
          <p className="text-muted">기록된 신호가 없습니다.</p>
        )}
        <p className="text-sm text-muted">이 신호들은 확인해 볼 이유이지, 연체의 원인이라는 뜻은 아닙니다.</p>
      </section>

      <section aria-labelledby="reviews" className="space-y-3">
        <h2 id="reviews" className="text-lg font-bold text-ink">
          확인 기록
        </h2>
        <ReviewForm buyerId={b.id} />
        {reviews.length > 0 ? (
          <ul className="space-y-2">
            {reviews.map((r) => (
              <li key={r.id} className="rounded-lg border border-line bg-bg p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded border px-1.5 text-sm font-semibold ${statusClass(r.status)}`}
                  >
                    {r.status}
                  </span>
                  {promises.get(r.id) ? <PromiseTag p={promises.get(r.id)!} /> : null}
                </div>
                <p className="mt-2 whitespace-pre-line wrap-break-word text-ink">{r.memo}</p>
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

      <Link href="/buyers" className="inline-flex min-h-11 items-center rounded-md border border-line px-4 text-accent">
        바이어 목록으로
      </Link>
    </div>
  );
}
