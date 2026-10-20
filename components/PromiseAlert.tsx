"use client";

import { useEffect, useState } from "react";
import Notice from "@/components/Notice";

// 오늘 약속 알림: 브라우저 내장 알림(Notification · 키 없음). PC Chrome · Edge 기준.
// 권한은 '알림 켜기'를 눌렀을 때만 묻는다. 허용된 브라우저는 그날 처음 열 때 약속마다 한 번 알린다.
// 알림을 띄울 수 없으면 같은 내용을 화면 안 Notice로 보인다. 글은 서버에서 만들어 props로 받는다.
type Item = { key: string; title: string; body: string };
type Mode = "checking" | "unsupported" | "default" | "denied" | "granted" | "failed";

function seen(key: string): boolean {
  try {
    return window.localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function markSeen(key: string) {
  try {
    window.localStorage.setItem(key, "1");
  } catch {
    // 저장이 막힌 브라우저 — 다음에 열면 한 번 더 알릴 뿐이다
  }
}

export default function PromiseAlert({ today, items }: { today: string; items: Item[] }) {
  const [mode, setMode] = useState<Mode>("checking");

  /** 알림을 띄운다. force가 아니면 오늘 이미 알린 약속은 건너뛴다. 실패하면 false. */
  function notify(force: boolean): boolean {
    try {
      for (const it of items) {
        const key = `promise-alert:${today}:${it.key}`;
        if (!force && seen(key)) continue;
        new Notification(it.title, { body: it.body, tag: key });
        markSeen(key);
      }
      return true;
    } catch {
      // Android Chrome은 'Notification' in window가 참이어도 여기서 오류가 난다
      return false;
    }
  }

  useEffect(() => {
    if (!("Notification" in window)) {
      setMode("unsupported");
      return;
    }
    const perm = Notification.permission;
    if (perm === "granted") setMode(notify(false) ? "granted" : "failed");
    else setMode(perm === "denied" ? "denied" : "default");
  }, []); // 쪽을 열 때 한 번만

  async function onEnable() {
    try {
      const perm = await Notification.requestPermission();
      if (perm === "granted") setMode(notify(true) ? "granted" : "failed");
      else setMode(perm === "denied" ? "denied" : "default");
    } catch {
      setMode("failed");
    }
  }

  if (mode === "checking") return null;

  const fallback =
    mode === "unsupported"
      ? "이 브라우저는 알림을 지원하지 않습니다 — PC Chrome · Edge에서 열어 주세요."
      : mode === "denied"
        ? "알림이 꺼져 있습니다 — 주소창 왼쪽의 사이트 설정에서 알림을 허용해 주세요."
        : mode === "failed"
          ? "이 브라우저에서는 알림을 띄울 수 없어 여기에 보여 드립니다."
          : null;

  return (
    <div className="space-y-2">
      {mode === "default" ? (
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onEnable}
            className="inline-flex min-h-11 items-center rounded-md border border-accent px-4 font-semibold text-accent hover:bg-surface"
          >
            알림 켜기
          </button>
          <p className="text-sm text-muted">약속 날에 이 PC 브라우저(Chrome · Edge)로 알려 드립니다.</p>
        </div>
      ) : null}

      {mode === "granted" ? (
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm text-muted">
            알림 켜짐 · 오늘 약속 <span className="num">{items.length}건</span>
          </p>
          {items.length > 0 ? (
            <button
              type="button"
              onClick={() => setMode(notify(true) ? "granted" : "failed")}
              className="inline-flex min-h-11 items-center rounded-md border border-line px-4 text-sm text-ink hover:bg-surface"
            >
              다시 알리기
            </button>
          ) : null}
        </div>
      ) : null}

      {fallback && items.length > 0 ? (
        <Notice tone="warn" title={`오늘 약속 ${items.length}건`}>
          <p className="text-muted">{fallback}</p>
          <ul className="mt-1 list-disc pl-5">
            {items.map((it) => (
              <li key={it.key}>
                {it.title} — {it.body}
              </li>
            ))}
          </ul>
        </Notice>
      ) : fallback && mode !== "unsupported" ? (
        <p className="text-sm text-muted">{fallback}</p>
      ) : null}
    </div>
  );
}
