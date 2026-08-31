import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import {fontFamily} from "./shared";

export const V18SCENE8_DURATION = 178;

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
};

export const V18Scene8 = () => {
  const frame = useCurrentFrame();
  const authority = interpolate(frame, [36, 124], [0, 1], {
    ...clamp,
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const authorityProof = interpolate(frame, [100, 124], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  const titleWidth = interpolate(authority, [0, 1], [1740, 2350]);
  const titleLeft = interpolate(authority, [0, 1], [-355, -670]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#11110f",
        color: "#f3ecdc",
        fontFamily,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: -58,
          top: 60,
          fontSize: 620,
          lineHeight: 0.8,
          fontWeight: 950,
          letterSpacing: -52,
          color: "#ff7214",
          opacity: 0.96,
        }}
      >
        64
      </div>
      <div
        style={{
          position: "absolute",
          right: 65,
          top: 94,
          width: 350,
          textAlign: "right",
        }}
      >
        <div style={{fontSize: 22, fontWeight: 900, letterSpacing: 4}}>
          NGUỒN KIỂM SOÁT
        </div>
        <div
          style={{
            marginTop: 18,
            fontSize: 47,
            lineHeight: 1,
            fontWeight: 950,
          }}
        >
          ÁN LỆ
          <br />
          CHÍNH THỨC
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 62,
          top: 662,
          width: 956,
          height: 735,
          background: "#f2eee5",
          overflow: "hidden",
          boxShadow: "24px 32px 0 rgba(255,114,20,.42), 0 48px 90px rgba(0,0,0,.5)",
          transform: `rotate(${interpolate(authority, [0, 1], [-3.2, 0])}deg)`,
        }}
      >
        <Img
          name="Official-Precedent-Title"
          src={staticFile("anle64_pdf_p1_title_focus.png")}
          style={{
            position: "absolute",
            left: titleLeft,
            top: interpolate(authority, [0, 1], [98, 16]),
            width: titleWidth,
            height: "auto",
            maxWidth: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 35,
            right: 35,
            top: 106,
            height: 123,
            border: "8px solid #ff7214",
            opacity: authorityProof,
            boxShadow: "0 0 0 999px rgba(242,238,229,.16)",
          }}
        />
      </div>

      <div
        style={{
          position: "absolute",
          left: 64,
          top: 1480,
          width: 620,
          fontSize: 29,
          lineHeight: 1.28,
          color: "rgba(243,236,220,.78)",
        }}
      >
        Thẩm quyền đến từ văn bản thật — không phải từ một nhãn đồ họa.
      </div>
      <div
        style={{
          position: "absolute",
          right: 58,
          top: 1438,
          width: 265,
          padding: "20px 18px",
          background: "#ff7214",
          color: "#11110f",
          textAlign: "center",
          fontSize: 21,
          lineHeight: 1.2,
          fontWeight: 950,
          letterSpacing: 2,
          opacity: authorityProof,
        }}
      >
        HỘI ĐỒNG
        <br />
        THẨM PHÁN
        <div style={{marginTop: 7, fontSize: 16, letterSpacing: 1}}>
          TAND TỐI CAO
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 65,
          bottom: 73,
          right: 65,
          borderTop: "2px solid rgba(243,236,220,.3)",
          paddingTop: 18,
          display: "flex",
          justifyContent: "space-between",
          fontSize: 20,
          fontWeight: 850,
          letterSpacing: 3,
          color: "rgba(243,236,220,.65)",
        }}
      >
        <span>ĐIỂM PHÁP LÝ</span>
        <span>64 / 2023 / AL</span>
      </div>
    </AbsoluteFill>
  );
};