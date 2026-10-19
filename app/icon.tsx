import { ImageResponse } from "next/og";
import AppMark from "@/components/AppMark";

// 홈 화면 · 탭 아이콘(코드로 만든 PNG)
export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(<AppMark size={size.width} />, size);
}
