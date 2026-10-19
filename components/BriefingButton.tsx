"use client";

import { useEffect, useState } from "react";

// 브리핑 듣기: 브라우저 내장 읽어 주기(speechSynthesis · ko-KR). 단추를 눌렀을 때만 읽고, 아무 데도 저장 · 전송하지 않는다.
// 읽을 글은 서버에서 만들어 props로 받는다.
export default function BriefingButton({ text }: { text: string }) {
  const [state, setState] = useState<"idle" | "speaking" | "unsupported">("idle");

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, []);

  function onClick() {
    if (!("speechSynthesis" in window) || typeof SpeechSynthesisUtterance === "undefined") {
      setState("unsupported");
      return;
    }
    const synth = window.speechSynthesis;
    if (state === "speaking") {
      synth.cancel();
      setState("idle");
      return;
    }
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ko-KR";
    const ko = synth.getVoices().find((v) => v.lang.toLowerCase().startsWith("ko"));
    if (ko) u.voice = ko;
    u.onend = () => setState("idle");
    u.onerror = () => setState("idle");
    synth.cancel();
    synth.speak(u);
    setState("speaking");
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={onClick}
        aria-pressed={state === "speaking"}
        className="inline-flex min-h-11 items-center gap-2 rounded-md bg-bg px-4 text-sm font-semibold text-brand hover:bg-brand-soft"
      >
        <svg viewBox="0 0 20 20" className="size-5 stroke-brand" fill="none" strokeWidth="1.8" aria-hidden="true">
          {state === "speaking" ? (
            <path d="M6 5v10M14 5v10" strokeLinecap="round" />
          ) : (
            <path d="M3 8v4h3l4 3V5L6 8H3zM13.5 7.5a3.5 3.5 0 010 5M15.5 5.5a6.5 6.5 0 010 9" strokeLinecap="round" strokeLinejoin="round" />
          )}
        </svg>
        {state === "speaking" ? "멈추기" : "브리핑 듣기"}
      </button>
      {state === "unsupported" ? (
        <p className="text-sm text-brand-soft">
          이 브라우저는 읽어 주기를 지원하지 않습니다 — Chrome · Edge · Safari에서 열어 주세요.
        </p>
      ) : null}
    </div>
  );
}
