// 앱 아이콘 그림(app/icon.tsx · app/apple-icon.tsx가 ImageResponse로 PNG를 만든다).
// ImageResponse는 Tailwind를 읽지 않아 globals.css 토큰 값(brand · good · grade-c)을 그대로 적는다.
const BRAND = "#14325a";
const GOOD = "#0b7a5e";
const RISK = "#b42318";

export default function AppMark({ size }: { size: number }) {
  const u = size / 16;
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: BRAND,
      }}
    >
      <div style={{ display: "flex", color: "#ffffff", fontSize: u * 6.5, fontWeight: 700, lineHeight: 1 }}>HB</div>
      <div
        style={{
          display: "flex",
          marginTop: u * 1.2,
          padding: u * 0.5,
          background: "#ffffff",
          borderRadius: u * 0.4,
        }}
      >
        <div style={{ width: u * 4.2, height: u * 1.2, background: GOOD, borderRadius: u * 0.2 }} />
        <div style={{ width: u * 0.5 }} />
        <div style={{ width: u * 2.4, height: u * 1.2, background: RISK, borderRadius: u * 0.2 }} />
      </div>
    </div>
  );
}
