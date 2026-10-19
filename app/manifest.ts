import type { MetadataRoute } from "next";

// 홈 화면 설치(웹 앱 매니페스트). 색은 globals.css의 brand 토큰 값.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "한빛정밀 CRM",
    short_name: "한빛 CRM",
    description: "(가상) 한빛정밀(주)의 합성 데이터로 만든 거래처 CRM",
    lang: "ko",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#14325a",
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
