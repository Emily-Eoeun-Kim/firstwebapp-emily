"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// 위쪽 메뉴 링크 — 지금 보고 있는 탭에 둥근 네모 음영 + 굵은 글자(색만으로 말하지 않는다).
// 홈은 "/"일 때만, 나머지는 그 아래 쪽(/buyers/B048 등)까지 같은 탭으로 본다.
export default function NavLinks({ items }: { items: { href: string; label: string }[] }) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`));

  return (
    <ul className="flex flex-wrap items-center gap-x-1">
      {items.map((item) => {
        const active = isActive(item.href);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-11 items-center rounded-md px-3 text-sm ${
                active ? "bg-brand-soft font-semibold text-brand" : "text-muted hover:bg-surface hover:text-ink"
              }`}
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
