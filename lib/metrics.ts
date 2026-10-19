import type { Buyer } from "@/lib/buyers";

// 화면 숫자 계산 — 순수 함수만(화면 글자는 만들지 않는다). 등급은 grade 칸 그대로 쓴다.
export const GRADES = ["S", "A", "B", "C"] as const;
export type Grade = (typeof GRADES)[number];

export function isGrade(v: unknown): v is Grade {
  return typeof v === "string" && (GRADES as readonly string[]).includes(v);
}

function sum(list: Buyer[], pick: (b: Buyer) => number): number {
  return list.reduce((s, b) => s + pick(b), 0);
}

function byId(a: Buyer, b: Buyer): number {
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

/** 위험 순서: pd30d 큰 순, 같으면 id 순 */
function byRisk(a: Buyer, b: Buyer): number {
  if (b.pd30d !== a.pd30d) return b.pd30d - a.pd30d;
  return byId(a, b);
}

export function totalAr(buyers: Buyer[]): number {
  return sum(buyers, (b) => b.openArUsd);
}

/** 우량 거래처의 '늦지 않게 회수' 기준: 최근 1년 평균 지연이 이 일수 이하 */
export const GOOD_MAX_LATE_DAYS = 10;

/** 우량 거래처: 지금 연체 $0 · 최근 1년 평균 지연 10일 이하(기록 없으면 뺌) · 채권 큰 순(같으면 id 순) */
export function goodTop(buyers: Buyer[], n = 10): Buyer[] {
  return buyers
    .filter((b) => b.overdueUsd === 0 && b.avgDaysLate12m !== null && b.avgDaysLate12m <= GOOD_MAX_LATE_DAYS)
    .sort((a, b) => b.openArUsd - a.openArUsd || byId(a, b))
    .slice(0, n);
}

export function kpis(buyers: Buyer[]) {
  const gradeC = buyers.filter((b) => b.grade === "C");
  const arUsd = sum(buyers, (b) => b.openArUsd);
  const cArUsd = sum(gradeC, (b) => b.openArUsd);
  return {
    cCount: gradeC.length,
    cArUsd,
    cShare: arUsd > 0 ? cArUsd / arUsd : null,
    arUsd,
    count: buyers.length,
    overdueUsd: sum(buyers, (b) => b.overdueUsd),
    overdueCount: buyers.filter((b) => b.overdueUsd > 0).length,
  };
}

/** S · A · B · C 곳 수(이 순서) */
export function gradeCounts(buyers: Buyer[]): { grade: Grade; count: number }[] {
  return GRADES.map((grade) => ({ grade, count: buyers.filter((b) => b.grade === grade).length }));
}

export function topRisk(buyers: Buyer[], n = 10): Buyer[] {
  return [...buyers].sort(byRisk).slice(0, n);
}

/** 지역마다 곳 수 · 채권 합 · C등급 채권 합 · C 몫(그 지역 안에서), 합이 큰 순 */
export function byRegion(buyers: Buyer[]) {
  const map = new Map<string, Buyer[]>();
  for (const b of buyers) map.set(b.region, [...(map.get(b.region) ?? []), b]);
  return [...map.entries()]
    .map(([region, list]) => {
      const arUsd = sum(list, (b) => b.openArUsd);
      const cArUsd = sum(
        list.filter((b) => b.grade === "C"),
        (b) => b.openArUsd,
      );
      return { region, count: list.length, arUsd, cArUsd, cShare: arUsd > 0 ? cArUsd / arUsd : null };
    })
    .sort((a, b) => b.arUsd - a.arUsd);
}

/** grade가 S · A · B · C면 그 등급만, 아니면 전부. 순서는 topRisk와 같다. */
export function filterByGrade(buyers: Buyer[], grade: unknown): Buyer[] {
  const list = isGrade(grade) ? buyers.filter((b) => b.grade === grade) : buyers;
  return [...list].sort(byRisk);
}
