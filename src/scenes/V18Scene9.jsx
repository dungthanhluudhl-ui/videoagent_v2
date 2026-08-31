import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import {fontFamily} from "./shared";

export const V18SCENE9_DURATION = 203;

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
};

export const V18Scene9 = () => {
  const frame = useCurrentFrame();
  const coercion = interpolate(frame, [76, 142], [0, 1], {
    ...clamp,
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const panelTop = interpolate(coercion, [0, 1], [1390, 610]);
  const debtScale = interpolate(coercion, [0, 1], [1, 0.68]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#ede6d6",
        color: "#161511",
        fontFamily,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 55,
          top: 70,
          fontSize: 21,
          fontWeight: 900,
          letterSpacing: 4,
          color: "#b94825",
        }}
      >
        PHÉP THỬ PHÁP LÝ
      </div>
      <div
        style={{
          position: "absolute",
          left: 54,
          top: 116,
          fontSize: 61,
          lineHeight: 0.95,
          fontWeight: 950,
          letterSpacing: -3,
        }}
      >
        DỮ KIỆN NỢ THẬT
        <br />
        CÓ ĐỦ KHÔNG?
      </div>

      <div
        style={{
          position: "absolute",
          left: 54,
          top: 326,
          width: 970,
          height: 660,
          background: "#f8f5ec",
          overflow: "hidden",
          boxShadow: "0 28px 56px rgba(45,38,27,.24)",
          transform: `scale(${debtScale})`,
          transformOrigin: "top left",
          zIndex: 2,
        }}
      >
        <Img
          name="Real-Debt-Record"
          src={staticFile("anle64_pdf_p2_real_debt.png")}
          style={{
            position: "absolute",
            left: -362,
            top: 30,
            width: 1740,
            height: "auto",
            maxWidth: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            background: "linear-gradient(0deg, #f8f5ec 15%, rgba(248,245,236,0))",
            height: 185,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 35,
            bottom: 28,
            background: "#ff7214",
            padding: "16px 24px 12px",
            fontSize: 46,
            fontWeight: 950,
            letterSpacing: -1,
          }}
        >
          NỢ CÓ THẬT
        </div>
        <div
          style={{
            position: "absolute",
            right: 30,
            bottom: 39,
            fontSize: 18,
            fontWeight: 850,
            letterSpacing: 2,
          }}
        >
          HỒ SƠ · TRANG 2
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 285,
          top: panelTop,
          width: 855,
          height: 1280,
          background: "#13130f",
          color: "#f4eddd",
          boxShadow: "-30px 34px 0 rgba(185,72,37,.32)",
          zIndex: 5,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: 22,
            height: "100%",
            background: "#b94825",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 58,
            top: 45,
            fontSize: 19,
            fontWeight: 900,
            letterSpacing: 4,
            color: "#ff7214",
          }}
        >
          NHƯNG PHƯƠNG THỨC LÀ...
        </div>

        <div
          style={{
            position: "absolute",
            left: 42,
            top: 105,
            width: 780,
            height: 420,
            overflow: "hidden",
            background: "#f5f1e8",
          }}
        >
          <Img
            name="Official-Coercive-Methods"
            src={staticFile("anle64_pdf_p8_p7_pressure.png")}
            style={{
              position: "absolute",
              left: -405,
              top: 6,
              width: 1575,
              height: "auto",
              maxWidth: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              border: "8px solid #ff7214",
              pointerEvents: "none",
            }}
          />
        </div>

        {[
          ["BẮT GIỮ", "#ff7214", "#15130f", 574],
          ["TRÓI", "#f4eddd", "#15130f", 720],
          ["NHỐT", "#b94825", "#f4eddd", 866],
        ].map(([label, background, color, top], index) => (
          (() => {
            const barProgress = interpolate(frame, [88 + index * 10, 108 + index * 10], [0, 1], {
              ...clamp,
              easing: Easing.out(Easing.cubic),
            });
            return (
          <div
            key={label}
            style={{
              position: "absolute",
              left: 58 - index * 18 + (1 - barProgress) * 90,
              top,
              width: 695 + index * 36,
              height: 112,
              background,
              color,
              padding: "16px 30px 0",
              fontSize: 65,
              lineHeight: 1,
              fontWeight: 950,
              letterSpacing: -3,
              opacity: barProgress,
            }}
          >
            {label}
          </div>
            );
          })()
        ))}

        <div
          style={{
            position: "absolute",
            left: 61,
            top: 1035,
            width: 570,
            fontSize: 27,
            lineHeight: 1.18,
            fontWeight: 800,
          }}
        >
          HÀNH VI CƯỠNG ÉP LẤN QUA RANH GIỚI CỦA MỘT KHOẢN NỢ.
        </div>
        <Img
          name="Handcuffs-Support"
          src={staticFile("anle64_handcuffs.png")}
          style={{
            position: "absolute",
            right: -54,
            bottom: 22,
            width: 325,
            height: "auto",
            transform: "rotate(-17deg)",
            filter: "grayscale(1) contrast(1.25) drop-shadow(18px 20px 18px rgba(0,0,0,.5))",
            opacity: 0.52,
          }}
        />
      </div>

      <div
        style={{
          position: "absolute",
          left: 68,
          bottom: 65,
          zIndex: 9,
          fontSize: 20,
          fontWeight: 850,
          letterSpacing: 3,
          color: coercion > 0.78 ? "rgba(244,237,221,.72)" : "rgba(22,21,17,.58)",
        }}
      >
        NGUỒN: ÁN LỆ SỐ 64/2023/AL
      </div>
    </AbsoluteFill>
  );
};