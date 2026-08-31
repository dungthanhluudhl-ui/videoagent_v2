import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import {fontFamily} from "./shared";

export const V18SCENE4_DURATION = 149;

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
};

export const V18Scene4 = () => {
  const frame = useCurrentFrame();
  const focus = interpolate(frame, [28, 112], [0, 1], {
    ...clamp,
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const documentWidth = interpolate(focus, [0, 1], [1840, 2380]);
  const documentLeft = interpolate(focus, [0, 1], [-405, -720]);
  const documentTop = interpolate(focus, [0, 1], [36, -32]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#16140f",
        color: "#f4eddd",
        fontFamily,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 28,
          height: "100%",
          background: "#ff7214",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 68,
          top: 82,
          fontSize: 23,
          fontWeight: 900,
          letterSpacing: 4,
          color: "#ff7214",
        }}
      >
        CHỨNG CỨ · HỒ SƠ CHÍNH THỨC
      </div>
      <div
        style={{
          position: "absolute",
          left: 66,
          top: 136,
          width: 850,
          fontSize: 92,
          lineHeight: 0.91,
          fontWeight: 950,
          letterSpacing: -5,
        }}
      >
        YÊU CẦU
        <br />
        KHÔNG DỪNG LẠI
      </div>

      <div
        style={{
          position: "absolute",
          left: 54,
          top: 420,
          width: 976,
          height: interpolate(focus, [0, 1], [1015, 1215]),
          overflow: "hidden",
          background: "#f2eee5",
          boxShadow: "0 34px 70px rgba(0,0,0,.46)",
          transform: `rotate(${interpolate(focus, [0, 1], [-1.2, 0])}deg)`,
        }}
      >
        <Img
          name="Official-Noon-Money-Demand"
          src={staticFile("anle64_pdf_p3_noon_demand.png")}
          style={{
            position: "absolute",
            left: documentLeft,
            top: documentTop,
            width: documentWidth,
            height: "auto",
            maxWidth: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 24,
            right: 24,
            top: 503,
            height: 196,
            background: "rgba(255,114,20,.27)",
            borderTop: "5px solid #ff7214",
            borderBottom: "5px solid #ff7214",
            opacity: focus,
            mixBlendMode: "multiply",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: 24,
            top: 491,
            background: "#ff7214",
            color: "#17140f",
            padding: "10px 18px",
            fontSize: 20,
            fontWeight: 950,
            letterSpacing: 2,
            opacity: focus,
          }}
        >
          YÊU CẦU CHUYỂN TIỀN
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 82,
          top: 1518,
          width: 450,
          borderLeft: "10px solid #ff7214",
          padding: "8px 0 8px 24px",
          fontSize: 30,
          lineHeight: 1.12,
          fontWeight: 850,
          opacity: focus,
        }}
      >
        TRƯA HÔM SAU,
        <br />
        YÊU CẦU VẪN TIẾP DIỄN.
      </div>

      <div
        style={{
          position: "absolute",
          right: 52,
          bottom: 112,
          width: 370,
          padding: "18px 20px 16px",
          background: "#ff7214",
          color: "#17140f",
          fontSize: 32,
          lineHeight: 0.95,
          fontWeight: 950,
          letterSpacing: 2,
          textAlign: "center",
          transform: `rotate(-2deg) scale(${0.8 + focus * 0.2})`,
          opacity: focus,
        }}
      >
        TRƯA 16 · 01 · 2019
        <div
          style={{
            marginTop: 11,
            fontSize: 21,
            letterSpacing: 4,
            color: "#17140f",
          }}
        >
          VẪN TIẾP DIỄN
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 68,
          bottom: 62,
          fontSize: 21,
          fontWeight: 800,
          letterSpacing: 3,
          color: "rgba(244,237,221,.65)",
        }}
      >
        NGUỒN: ÁN LỆ SỐ 64/2023/AL
      </div>
    </AbsoluteFill>
  );
};