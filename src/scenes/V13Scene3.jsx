/**
 * S3 - Xong phần dẫn, vào ca đầu tiên chưa?
 *
 * toàn bộ ảnh và nhãn của phần dẫn biến mất trong một khung, chỉ còn mặt
 * giấy kẻ trống và một chữ đập vào giữa khung.
 *
 * comprehensionLoad: simple - 45 frames (1.5s)
 * Dựng từ input/scene_plan13.json; kiểm bằng build_gate.py.
 *
 * Cảnh 1,5s này CỐ Ý không có ảnh: cue "Ok, bắt đầu thôi" không mang thông
 * tin mới, và chèn ảnh minh hoạ vào đây chỉ để lấp chỗ là đúng loại filler
 * mà shotlist ghi rõ là cấm. Đổi lại, hai đầu cảnh đều cắt cứng
 * (transitionIn: "none" ở S3 và S4) - fade 15 khung sẽ ăn mất 2/3 cảnh.
 */

import { AbsoluteFill, Sequence } from "remotion";
import { BottomBar, CameraGroup, ImpactFlash, PunchPhrase, SceneBackground } from "./shared";

export const V13SCENE3_DURATION = 45;

export const V13Scene3 = () => (
  <AbsoluteFill name="V13Scene3">
    <SceneBackground variant="grid" />

    <CameraGroup
      zoom={{ from: 0.94, to: 1.0 }}
      shake={{ at: 0, len: 12, mag: 9 }}
      durationInFrames={V13SCENE3_DURATION}
    >
      <ImpactFlash x={540} y={800} delay={0} size={260} />
    </CameraGroup>

    <Sequence from={0} layout="none">
      <PunchPhrase lines={["BẮT ĐẦU"]} top={760} fontSize={128} />
    </Sequence>

    <BottomBar />
  </AbsoluteFill>
);
