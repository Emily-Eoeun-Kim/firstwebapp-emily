import Link from "next/link";
import NavLinks from "@/components/NavLinks";

// 위쪽 메뉴. 쪽을 더하면 여기에 한 줄을 더한다(예: { href: "/buyers", label: "바이어" }).
export const NAV_ITEMS: { href: string; label: string }[] = [
  { href: "/", label: "홈" },
  { href: "/buyers", label: "바이어" },
  { href: "/calendar", label: "캘린더" },
];

export default function SiteNav() {
  return (
    <header className="border-b border-line bg-bg">
      <nav
        aria-label="주 메뉴"
        className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2 sm:px-6"
      >
        <Link href="/" className="mr-2 flex min-h-11 items-center font-semibold text-ink">
          한빛정밀 CRM
        </Link>
        <NavLinks items={NAV_ITEMS} />
      </nav>
    </header>
  );
}
