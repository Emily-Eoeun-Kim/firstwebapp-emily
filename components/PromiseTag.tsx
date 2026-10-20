import Link from "next/link";
import { promiseClass, promiseText, type PromiseInfo, type PromiseRow } from "@/lib/promises";
import { statusClass } from "@/lib/reviews";

// 약속 꼬리표: "D-7 · 10/27(화)" — 색 + 글자(색만으로 말하지 않는다). 서버 컴포넌트.
export default function PromiseTag({ p }: { p: PromiseInfo }) {
  return (
    <span
      className={`num inline-flex items-center whitespace-nowrap rounded border px-1.5 text-sm font-semibold ${promiseClass(p)}`}
      aria-label={`약속 ${promiseText(p)}`}
    >
      {promiseText(p)}
    </span>
  );
}

/** 약속 한 줄: 꼬리표 · 바이어(상세 링크) · 상태 · 메모 · 별명과 기록 시각 */
export function PromiseCard({ row }: { row: PromiseRow }) {
  return (
    <div className="rounded-lg border border-line bg-bg p-3">
      <div className="flex flex-wrap items-center gap-2">
        <PromiseTag p={row.p} />
        <span
          className={`inline-flex items-center rounded border px-1.5 text-sm font-semibold ${statusClass(row.status)}`}
        >
          {row.status}
        </span>
      </div>
      <Link
        href={`/buyers/${row.buyerId}`}
        className="inline-flex min-h-11 items-center font-semibold text-accent hover:underline"
      >
        <span className="num">{row.buyerId}</span>&nbsp;· {row.buyerName}
      </Link>
      <p className="whitespace-pre-line wrap-break-word text-ink">{row.memo}</p>
      <p className="mt-1 text-sm text-muted">
        {row.reviewer} · 기록 <span className="num">{row.createdAtText}</span>
      </p>
    </div>
  );
}
