import raw from "@/data/buyers.json";

// 바이어 데이터 — 지금은 data/buyers.json을 그대로 돌려준다.
// 5일차에 DB로 바꿀 때는 아래 두 함수의 속만 바뀐다(그래서 async로 둔다).
export type Buyer = {
  id: string;
  name: string;
  countryCode: string;
  countryKo: string;
  region: string;
  industry: string;
  paymentMethod: string;
  termsDays: number;
  openArUsd: number;
  overdueUsd: number;
  pctAr31p: number | null; // 0–1
  oldestOpenDays: number;
  avgDaysLate12m: number | null;
  pd30d: number; // 0–1
  grade: "S" | "A" | "B" | "C";
  signals: string[];
};

const BUYERS = raw as Buyer[];

export async function getBuyers(): Promise<Buyer[]> {
  return BUYERS;
}

/** id는 대문자로 맞춰 찾는다(b048 → B048). 없으면 null. */
export async function getBuyer(id: string): Promise<Buyer | null> {
  const key = id.trim().toUpperCase();
  return BUYERS.find((b) => b.id === key) ?? null;
}
