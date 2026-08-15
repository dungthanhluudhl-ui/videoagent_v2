import { CollageScene } from "./SceneTemplates";

export const V9SCENE8B_DURATION = 172;

export const V9Scene8b = () => {
  return (
    <CollageScene
      durationInFrames={V9SCENE8B_DURATION}
      backdrop="card"
      hero={{ name: "Hero-WritingNote", src: "el9_char_confident.png", width: 560, x: "50%", y: 380, variant: "grow" }}
      supports={[
        {
          // anchor: "trả tiền cơm" @ local frame 92, bounded to this scene's
          // range (58.72-64.44) - the same phrase also appears in S4
          // earlier in the video, beat_sync.py's --scene-end kept the
          // lookup from matching that earlier occurrence
          name: "Support-NoteLabel",
          src: "el9_note_label.png",
          width: 280,
          x: 750,
          y: 990,
          delay: 92,
          idle: "sway",
        },
      ]}
      // anchor: "ghi rõ nội dung" @ local frame 64 (beat_sync.py verified) -
      // leads the note support, which lands on the concrete example after
      punchLines={["GHI RÕ NỘI DUNG!"]}
      punchFrom={68}
      punchTop={140}
    />
  );
};
