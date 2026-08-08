// Word-level caption data: TIMESTAMPS come from the Whisper transcript
// (.claude/skills/vox-collage-video/data/transcript.json), but the WORD
// TEXT is taken from the user-provided ground-truth script
// (input/Scipttest2.txt) matched positionally — Whisper's Vietnamese
// transcription has small text errors (homophones, missing diacritics)
// but its timing is accurate. Verified 1:1 word-count match per segment
// before pairing them up.
const FPS = 30;
const toFrame = (sec) => Math.round(sec * FPS);

// [text, startSec, endSec], grouped by the transcript's own clause
// segments (a real pause separates each group).
const SEGMENTS = [
  [
    ["Ở", 0.0, 0.32], ["Việt", 0.32, 0.46], ["Nam,", 0.46, 0.74], ["hệ", 1.06, 1.1],
    ["thống", 1.1, 1.28], ["pháp", 1.28, 1.46], ["luật", 1.46, 1.68], ["thuộc", 1.68, 2.08],
    ["nhóm", 2.08, 2.26], ["Civil", 2.26, 2.52], ["Law", 2.52, 2.8], ["(Dân", 2.8, 3.04], ["luật),", 3.04, 3.26],
  ],
  [
    ["vai", 3.74, 3.84], ["trò", 3.84, 4.02], ["của", 4.02, 4.16], ["Tòa", 4.16, 4.42],
    ["án", 4.42, 4.64], ["và", 4.64, 4.9], ["Viện", 4.9, 5.12], ["kiểm", 5.12, 5.32],
    ["sát", 5.32, 5.5], ["rất", 5.5, 5.64], ["lớn.", 5.64, 6.0],
  ],
  [
    ["Dù", 6.64, 6.92], ["luật", 6.92, 7.1], ["sư", 7.1, 7.26], ["có", 7.26, 7.42],
    ["cãi", 7.42, 7.7], ["hay", 7.7, 7.84], ["đến", 7.84, 7.92], ["đâu,", 7.92, 8.16],
    ["bằng", 8.6, 8.72], ["chứng", 8.72, 8.96], ["đưa", 8.96, 9.12], ["ra", 9.12, 9.28],
    ["sắc", 9.28, 9.52], ["bén", 9.52, 9.68], ["thế", 9.68, 9.84], ["nào,", 9.84, 10.1],
  ],
  [
    ["thì", 10.66, 10.72], ["đôi", 10.72, 10.86], ["khi", 10.86, 11.0], ["bản", 11.0, 11.22],
    ["án", 11.22, 11.46], ["vẫn", 11.46, 11.58], ["chịu", 11.58, 11.84], ["ảnh", 11.84, 12.0],
    ["hưởng", 12.0, 12.2], ["bởi", 12.2, 12.5], ["nhiều", 12.5, 12.7], ["yếu", 12.7, 12.86],
    ["tố", 12.86, 13.04], ["khác.", 13.04, 13.26],
  ],
  [
    ["Rất", 13.98, 14.22], ["nhiều", 14.22, 14.38], ["khách", 14.38, 14.6], ["hàng", 14.6, 14.84],
    ["tìm", 14.84, 15.22], ["đến", 15.22, 15.28], ["luật", 15.28, 15.52], ["sư", 15.52, 15.76],
    ["không", 15.76, 16.0], ["phải", 16.0, 16.2], ["để", 16.2, 16.34], ["hỏi", 16.34, 16.56],
    ["\"luật", 16.56, 16.84], ["quy", 16.84, 17.0], ["định", 17.0, 17.22], ["thế", 17.22, 17.32], ["nào\",", 17.32, 17.58],
  ],
  [
    ["mà", 18.22, 18.5], ["lại", 18.5, 18.62], ["hỏi", 18.62, 18.92], ["thẳng:", 18.92, 19.16],
    ["\"Thân", 19.16, 19.38], ["chủ", 19.38, 19.56], ["của", 19.56, 19.74], ["tôi", 19.74, 20.02],
    ["có", 20.02, 20.28], ["trắng", 20.28, 20.44], ["án", 20.44, 20.6], ["được", 20.6, 20.66], ["không?", 20.66, 20.88],
  ],
  [
    ["Bác", 21.84, 22.12], ["có", 22.12, 22.26], ["'quen'", 22.26, 22.44], ["ai", 22.44, 22.62],
    ["bên", 22.62, 22.74], ["Tòa", 22.74, 23.26], ["hay", 23.26, 23.38], ["Công", 23.38, 23.54],
    ["an", 23.54, 23.78], ["không", 23.78, 24.12], ["để", 24.12, 24.24], ["'chạy'", 24.24, 24.5], ["giúp?\"", 24.5, 24.7],
  ],
  [
    ["Cái", 25.4, 25.56], ["áp", 25.56, 25.76], ["lực", 25.76, 25.96], ["bị", 25.96, 26.08],
    ["biến", 26.08, 26.34], ["thành", 26.34, 26.54], ["\"cò", 26.54, 26.84], ["án\"", 26.84, 27.24],
    ["hoặc", 27.24, 27.66], ["môi", 27.66, 27.84], ["chuyển", 27.84, 28.14], ["tiền", 28.14, 28.34],
    ["hối", 28.34, 28.58], ["lộ", 28.58, 28.68], ["này", 28.68, 28.96],
  ],
  [
    ["chính", 28.96, 29.68], ["là", 29.68, 29.88], ["cái", 29.88, 30.0], ["bẫy", 30.0, 30.24],
    ["đạo", 30.24, 30.42], ["đức", 30.42, 30.62], ["lớn", 30.62, 30.86], ["nhất,", 30.86, 31.04],
  ],
  [
    ["đẩy", 31.54, 31.62], ["nhiều", 31.62, 31.88], ["luật", 31.88, 32.14], ["sư", 32.14, 32.4],
    ["vào", 32.4, 32.52], ["con", 32.52, 32.68], ["đường", 32.68, 32.88], ["vi", 32.88, 33.14],
    ["phạm", 33.14, 33.36], ["pháp", 33.36, 33.5], ["luật.", 33.5, 33.68],
  ],
];

const toWordObjs = (seg) => seg.map(([text, s, e]) => ({ text, startFrame: toFrame(s), endFrame: toFrame(e) }));

// Chunk each segment into ~4-word on-screen lines; a trailing remainder
// of fewer than 2 words gets folded into the previous line instead of
// flashing on screen alone for a fraction of a second.
const chunkSegment = (words, size = 4, minLast = 2) => {
  const out = [];
  for (let i = 0; i < words.length; i += size) out.push(words.slice(i, i + size));
  if (out.length > 1 && out[out.length - 1].length < minLast) {
    const last = out.pop();
    out[out.length - 1] = out[out.length - 1].concat(last);
  }
  return out;
};

export const CAPTION_LINES = SEGMENTS.flatMap((seg) => chunkSegment(toWordObjs(seg)));
