import { ImageResponse } from "next/og";
import AppMark from "@/components/AppMark";

// iPhone '홈 화면에 추가' 아이콘
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(<AppMark size={size.width} />, size);
}
