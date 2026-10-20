import { db } from "@/lib/db";

// 확인 기록 읽기 — 서버에서만 부른다(서버 컴포넌트 · 서버 액션). 최신이 위.
export const REVIEW_STATUSES = ["확인 필요", "확인 완료", "보류"] as const;

const ORDER = [{ createdAt: "desc" as const }, { id: "desc" as const }];

/** 그 바이어의 확인 기록(최신 take개) */
export async function getReviews(buyerId: string, take = 20) {
  return db().review.findMany({ where: { buyerId }, orderBy: ORDER, take });
}

/** 모든 바이어의 최신 확인 기록 — 바이어 이름 포함 */
export async function getRecentReviews(take = 5) {
  return db().review.findMany({
    orderBy: ORDER,
    take,
    include: { buyer: { select: { name: true } } },
  });
}

/** 상태 배지 색(테두리 + 글자 — 색만으로 말하지 않는다) */
export function statusClass(status: string): string {
  if (status === "확인 필요") return "border-warn text-warn";
  if (status === "확인 완료") return "border-accent text-accent";
  return "border-muted text-muted";
}
