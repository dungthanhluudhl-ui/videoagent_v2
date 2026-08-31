import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import {fontFamily} from "./shared";

export const V18SCENE3_DURATION = 236;

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
};

export const V18Scene3 = () => {
  const frame = useCurrentFrame();
  const priceLocks = interpolate(frame, [66, 104], [0, 1], {
    ...clamp,
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const subjectScale = interpolate(priceLocks, [0, 1], [1.08, 0.94]);
  const subjectX = interpolate(priceLocks, [0, 1], [-108, -188]);

  return (
    <AbsoluteFill
      data-visual-treatment="diagram"
      style={{
        backgroundColor: "#0c0d0b",
        color: "#f5eedf",
        fontFamily,
        overflow: "hidden",
      }}
    >
      <Img
        name="Warehouse-Context"
        src={staticFile("anle64_warehouse_vertical.png")}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          filter: "grayscale(1) contrast(1.15) brightness(0.31)",
          transform: "scale(1.05)",
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(8,9,8,.28) 0%, rgba(8,9,8,.08) 36%, rgba(8,9,8,.94) 100%), linear-gradient(90deg, rgba(8,9,8,.18), rgba(8,9,8,.84))",
        }}
      />

      <div
        style={{
          position: "absolute",
          left: 62,
          top: 72,
          display: "flex",
          alignItems: "center",
          gap: 18,
          fontSize: 22,
          fontWeight: 800,
          letterSpacing: 4,
        }}
      >
        <span style={{width: 68, height: 7, background: "#ff7214"}} />
        TÁI DỰNG ẨN DANH
      </div>

      <div
        style={{
          position: "absolute",
          right: 56,
          top: 165,
          width: 440,
          textAlign: "right",
          opacity: 1 - priceLocks * 0.72,
        }}
      >
        <div style={{fontSize: 32, fontWeight: 700, letterSpacing: 3}}>
          CUỘC GỌI
        </div>
        <div
          style={{
            marginTop: 8,
            fontSize: 82,
            lineHeight: 0.88,
            fontWeight: 950,
            letterSpacing: -4,
            color: "#ff7214",
          }}
        >
          BỊ ÉP
          <br />
          BUỘC
        </div>
        <div
          style={{
            marginTop: 24,
            marginLeft: "auto",
            width: 310,
            borderTop: "2px solid rgba(245,238,223,.42)",
            paddingTop: 15,
            fontSize: 24,
            lineHeight: 1.3,
            color: "rgba(245,238,223,.72)",
          }}
        >
          Áp lực rời khỏi căn kho và đi thẳng tới gia đình.
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          right: 58,
          top: 393,
          width: 450,
          height: 590,
          background: "#ff7214",
          color: "#11110f",
          boxShadow: "-28px 30px 0 rgba(0,0,0,.28)",
          transform: `translateX(${(1 - priceLocks) * 520}px)`,
          opacity: priceLocks,
          zIndex: 5,
        }}
      >
        <div
          style={{
            padding: "34px 38px 0",
            fontSize: 20,
            fontWeight: 900,
            letterSpacing: 4,
          }}
        >
          GIÁ CỦA TỰ DO
        </div>
        <div
          style={{
            padding: "25px 30px 0",
            fontSize: 192,
            lineHeight: 0.72,
            fontWeight: 950,
            letterSpacing: -14,
          }}
        >
          150
        </div>
        <div
          style={{
            padding: "18px 38px 0",
            fontSize: 77,
            lineHeight: 0.9,
            fontWeight: 950,
            letterSpacing: -4,
          }}
        >
          TRIỆU
        </div>
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            background: "#11110f",
            color: "#f5eedf",
            padding: "25px 38px 28px",
            fontSize: 36,
            lineHeight: 1.05,
            fontWeight: 900,
          }}
        >
          THÌ MỚI
          <br />
          ĐƯỢC THẢ
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          right: 266,
          top: 978,
          height: 495,
          borderLeft: "5px solid #ff7214",
          opacity: priceLocks,
          zIndex: 4,
        }}
      />
      <div
        style={{
          position: "absolute",
          right: 239,
          top: 1445,
          width: 58,
          height: 58,
          border: "7px solid #ff7214",
          borderRadius: "50%",
          opacity: priceLocks,
          zIndex: 8,
        }}
      />

      <Img
        name="Coerced-Caller"
        src={staticFile("anle64_victim_phone_under_duress.png")}
        style={{
          position: "absolute",
          left: subjectX,
          bottom: -20,
          width: 940,
          height: "auto",
          transform: `scale(${subjectScale})`,
          transformOrigin: "bottom left",
          filter: "drop-shadow(34px 26px 28px rgba(0,0,0,.55))",
          zIndex: 7,
        }}
      />

      <div
        style={{
          position: "absolute",
          left: 58,
          bottom: 64,
          zIndex: 10,
          fontSize: 22,
          fontWeight: 800,
          letterSpacing: 3,
          color: "rgba(245,238,223,.74)",
        }}
      >
        ÁN LỆ 64 · CƠ CHẾ GÂY ÁP LỰC
      </div>
    </AbsoluteFill>
  );
};