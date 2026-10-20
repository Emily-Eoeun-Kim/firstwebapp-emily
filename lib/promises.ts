import { db } from "@/lib/db";
import { kst } from "@/lib/format";

// 약속 — 확인 기록 메모 속 날짜(10/27 · 10월 27일 · 내일 · 다음 주 …)를 찾아 D-day를 셈한다. 서버에서만 부른다.
// '내일' · '다음 주' 같은 말은 그 기록을 적은 날(한국 시각) 기준으로 날짜를 고정한다.
// '오늘'(D-day · 이번 주 · 캘린더의 오늘 칸)은 언제나 접속한 날(한국 시각)이다.
// 날짜는 '날 번호'(1970-01-01부터 센 날 수)로 셈한다 — 시간대 · 서머타임에 흔들리지 않게.

const DAY_MS = 86_400_000;
const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"]; // getUTCDay 순서
const FROM_MONDAY: Record<string, number> = { 월: 0, 화: 1, 수: 2, 목: 3, 금: 4, 토: 5, 일: 6 };

export type PromiseInfo = {
  day: number; // 약속 날 번호
  ymd: string; // "2026-10-27"
  diff: number; // 약속 날 − 오늘(일). 0 = 오늘, 음수 = 지남
  approx: boolean; // '다음 주'처럼 요일이 없는 말이면 그 주 월요일로 잡고 '무렵'을 붙인다
  missed: boolean; // 지났는데 아직 '확인 필요'(뒤에 '확인 완료' 기록도 없음)
};

/** "YYYY-MM-DD" → 날 번호(없는 날이면 null) */
export function ymdToDay(ymd: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const t = Date.UTC(y, mo - 1, d);
  const back = new Date(t);
  if (back.getUTCFullYear() !== y || back.getUTCMonth() !== mo - 1 || back.getUTCDate() !== d) return null;
  return t / DAY_MS;
}

export function dayToYmd(day: number): string {
  return new Date(day * DAY_MS).toISOString().slice(0, 10);
}

/** 그 시각의 한국 날짜 → 날 번호 */
export function kstDay(date: Date): number {
  return ymdToDay(kst(date).slice(0, 10)) ?? Math.floor(date.getTime() / DAY_MS);
}

/** 접속한 지금의 한국 날짜 */
export function todayDay(): number {
  return kstDay(new Date());
}

export function weekdayKo(day: number): string {
  return WEEKDAYS[new Date(day * DAY_MS).getUTCDay()];
}

/** 그 날이 든 주의 월요일 */
export function mondayOf(day: number): number {
  return day - ((new Date(day * DAY_MS).getUTCDay() + 6) % 7);
}

/** 연 · 월 · 일 숫자 */
export function partsOf(day: number): { y: number; m: number; d: number } {
  const t = new Date(day * DAY_MS);
  return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() };
}

/** 그 달 1일의 날 번호 */
export function monthStart(y: number, m: number): number {
  return Date.UTC(y, m - 1, 1) / DAY_MS;
}

/** "10/27(화)" */
export function shortDate(day: number): string {
  const { m, d } = partsOf(day);
  return `${m}/${d}(${weekdayKo(day)})`;
}

/** 월 · 일만 적힌 날짜: 적은 날의 해로 잡되, 적은 날보다 60일 넘게 앞서면 다음 해(12월에 적은 '1/5'). */
function fromMonthDay(month: number, date: number, written: number): number | null {
  const pad = (n: number) => String(n).padStart(2, "0");
  const { y } = partsOf(written);
  const same = ymdToDay(`${y}-${pad(month)}-${pad(date)}`);
  if (same === null) return null;
  return same < written - 60 ? ymdToDay(`${y + 1}-${pad(month)}-${pad(date)}`) : same;
}

type Found = { day: number; approx: boolean };
type Rule = { re: RegExp; to: (m: RegExpExecArray, written: number) => Found | null };

// 위에서부터 먼저 맞는 규칙 하나를 쓴다(날짜를 적은 것이 '내일' · '다음 주' 같은 말보다 앞선다).
const RULES: Rule[] = [
  {
    re: /(?<!\d)(\d{1,2})\s*\/\s*(\d{1,2})(?!\d)/g,
    to: (m, w) => at(fromMonthDay(Number(m[1]), Number(m[2]), w)),
  },
  {
    re: /(?<!\d)(\d{1,2})\s*월\s*(\d{1,2})\s*일/g,
    to: (m, w) => at(fromMonthDay(Number(m[1]), Number(m[2]), w)),
  },
  { re: /다음\s*주\s*([월화수목금토일])요일/g, to: (m, w) => at(mondayOf(w) + 7 + FROM_MONDAY[m[1]]) },
  { re: /이번\s*주\s*([월화수목금토일])요일/g, to: (m, w) => at(mondayOf(w) + FROM_MONDAY[m[1]]) },
  { re: /(?<!\d)(\d{1,2})\s*일\s*(?:뒤|후)/g, to: (m, w) => at(w + Number(m[1])) },
  { re: /모레/g, to: (_m, w) => at(w + 2) },
  { re: /내일/g, to: (_m, w) => at(w + 1) },
  { re: /다음\s*주/g, to: (_m, w) => ({ day: mondayOf(w) + 7, approx: true }) },
  { re: /오늘/g, to: (_m, w) => at(w) },
];

function at(day: number | null): Found | null {
  return day === null ? null : { day, approx: false };
}

/** 메모에서 약속 날을 찾는다. written = 기록한 날의 날 번호. 없으면 null. */
export function findPromiseDay(memo: string, written: number): Found | null {
  for (const rule of RULES) {
    rule.re.lastIndex = 0;
    for (let m = rule.re.exec(memo); m; m = rule.re.exec(memo)) {
      const found = rule.to(m, written);
      if (found) return found;
    }
  }
  return null;
}

type ReviewLike = { id: number; buyerId: string; status: string; memo: string; createdAt: Date };

/** 기록마다 약속(있는 것만). 지난 '확인 필요'라도 그 뒤에 같은 바이어의 '확인 완료' 기록이 있으면 놓친 것으로 보지 않는다. */
export function promiseMap(reviews: ReviewLike[], today: number): Map<number, PromiseInfo> {
  const lastDone = new Map<string, number>();
  for (const r of reviews) {
    if (r.status === "확인 완료") {
      lastDone.set(r.buyerId, Math.max(lastDone.get(r.buyerId) ?? 0, r.createdAt.getTime()));
    }
  }
  const out = new Map<number, PromiseInfo>();
  for (const r of reviews) {
    const found = findPromiseDay(r.memo, kstDay(r.createdAt));
    if (!found) continue;
    const diff = found.day - today;
    const settled = r.status !== "확인 필요" || (lastDone.get(r.buyerId) ?? 0) > r.createdAt.getTime();
    out.set(r.id, { day: found.day, ymd: dayToYmd(found.day), diff, approx: found.approx, missed: diff < 0 && !settled });
  }
  return out;
}

/** 꼬리표 글: "D-7 · 10/27(화)" · "D-day · …" · "D+3 · 지남 · …" */
export function promiseText(p: PromiseInfo): string {
  const dd = p.diff > 0 ? `D-${p.diff}` : p.diff === 0 ? "D-day" : `D+${-p.diff}`;
  return `${dd}${p.missed ? " · 지남" : ""} · ${shortDate(p.day)}${p.approx ? " 무렵" : ""}`;
}

/** 꼬리표 색(토큰만): 놓침 = 경고 면 · 오늘 = 강조 면 · 7일 안 = 강조 테두리 · 그 밖 = 흐림 */
export function promiseClass(p: PromiseInfo): string {
  if (p.missed) return "border-warn bg-warn text-white";
  if (p.diff === 0) return "border-accent bg-accent text-white";
  if (p.diff > 0 && p.diff <= 7) return "border-accent text-accent";
  return "border-muted text-muted";
}

export type PromiseRow = {
  id: number;
  buyerId: string;
  buyerName: string;
  status: string;
  memo: string;
  reviewer: string;
  createdAtText: string;
  p: PromiseInfo;
};

/** 약속이 든 확인 기록 전부(약속 날 순). 실습 규모라 최근 1,000건까지만 본다. */
export async function getPromises(today: number): Promise<PromiseRow[]> {
  const rows = await db().review.findMany({
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: 1000,
    include: { buyer: { select: { name: true } } },
  });
  const map = promiseMap(rows, today);
  return rows
    .flatMap((r) => {
      const p = map.get(r.id);
      if (!p) return [];
      return [
        {
          id: r.id,
          buyerId: r.buyerId,
          buyerName: r.buyer.name,
          status: r.status,
          memo: r.memo,
          reviewer: r.reviewer,
          createdAtText: kst(r.createdAt),
          p,
        },
      ];
    })
    .sort((a, b) => a.p.day - b.p.day || b.id - a.id);
}
