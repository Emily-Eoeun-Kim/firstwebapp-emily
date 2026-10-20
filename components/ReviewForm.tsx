"use client";

import { startTransition, useActionState, useState, type FormEvent } from "react";
import { addReview } from "@/app/buyers/[id]/actions";
import Notice from "@/components/Notice";

// 확인 기록 입력 칸 — 화면 움직임만. 검사 · 저장은 서버 액션(addReview)이 한다(그래서 maxLength · required 없음).
export type ReviewState = { ok: boolean; message: string };

const STATUSES = ["확인 필요", "확인 완료", "보류"] as const;
const MEMO_MAX = 200;
const INITIAL: ReviewState = { ok: false, message: "" };

export default function ReviewForm({ buyerId }: { buyerId: string }) {
  const [state, formAction, pending] = useActionState(addReview, INITIAL);
  const [memo, setMemo] = useState("");
  const [seen, setSeen] = useState(state);

  // 새 결과가 오면 한 번만 본다 — 저장되면 메모만 비운다(상태 · 별명은 남긴다).
  if (state !== seen) {
    setSeen(state);
    if (state.ok) setMemo("");
  }

  // <form action>으로 보내면 React가 폼을 처음 값으로 되돌리므로, 직접 보낸다.
  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(() => formAction(data));
  }

  const over = memo.length > MEMO_MAX;

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-lg border border-line bg-surface p-4">
      <input type="hidden" name="buyerId" value={buyerId} />

      <fieldset>
        <legend className="text-sm font-semibold text-ink">상태</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <label
              key={s}
              className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-line bg-bg px-3 text-ink has-checked:border-accent"
            >
              <input type="radio" name="status" value={s} defaultChecked={s === "확인 필요"} />
              {s}
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="review-memo" className="text-sm font-semibold text-ink">
          메모
        </label>
        <textarea
          id="review-memo"
          name="memo"
          rows={3}
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="예: 다음 주 입금 약속 — 전화로 확인"
          className="mt-2 block w-full rounded-md border border-line bg-bg p-3 text-ink"
        />
        <p className={`num mt-1 text-right text-sm ${over ? "font-semibold text-warn" : "text-muted"}`}>
          {memo.length}/{MEMO_MAX}
        </p>
      </div>

      <div>
        <label htmlFor="review-reviewer" className="text-sm font-semibold text-ink">
          확인한 사람(별명)
        </label>
        <input
          id="review-reviewer"
          name="reviewer"
          type="text"
          placeholder="실명 대신 별명"
          className="mt-2 block min-h-11 w-full rounded-md border border-line bg-bg px-3 text-ink"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-11 items-center rounded-md bg-accent px-4 font-semibold text-white disabled:opacity-60"
      >
        {pending ? "저장 중…" : "기록 남기기"}
      </button>

      {state.message ? <Notice tone={state.ok ? "ok" : "warn"} title={state.message} /> : null}
    </form>
  );
}
