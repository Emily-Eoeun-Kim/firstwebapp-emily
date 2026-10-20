import { db } from "@/lib/db";

// 바이어 데이터 — Supabase DB의 Buyer 표에서 읽는다(서버에서만 부른다).
// 함수 이름 · 인자 · 돌려주는 모양은 4일차(JSON) 때와 같다.
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

// DB의 grade 칸은 String — seed가 data/buyers.json의 S · A · B · C를 그대로 넣었으므로 형만 맞춘다.
export async function getBuyers(): Promise<Buyer[]> {
  const rows = await db().buyer.findMany({ orderBy: { id: "asc" } });
  return rows as Buyer[];
}

/** id는 대문자로 맞춰 찾는다(b048 → B048). 없으면 null. */
export async function getBuyer(id: string): Promise<Buyer | null> {
  const row = await db().buyer.findUnique({ where: { id: id.trim().toUpperCase() } });
  return row as Buyer | null;
}
