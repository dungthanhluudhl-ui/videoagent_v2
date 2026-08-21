# Gates — what each one checks, and how to fix a failure

Gates exist because prose rules in this skill demonstrably do not hold. During
the V10 build, three rules already written plainly in SKILL.md were ignored:
no universal-symbol imagery, place the headline against the real hero cluster,
never silently drop a planned asset. One of the violations was even explained
in a code comment (*"keeps sourcing cost down"*). Nothing caught any of it,
because nothing could.

The gates below can. Two of them run automatically via hooks, so they are not
optional.

## Enforcement layers, strongest first

| Layer | Can the model skip it? |
|---|---|
| Hooks (`.claude/settings.json` → `hook_gate.py`) | **No** — the harness runs them |
| Gate scripts (non-zero exit) | Only by not running them; the Stop hook runs them anyway |
| `scene_plan.json` as a contract | Drift is detectable by `build_gate.py` |
| Prose in SKILL.md | Yes — which is why the rules that matter became gates |

### Hook behaviour

- `PostToolUse` on Write/Edit → if the edited file is a scene of the **active**
  plan, runs `build_gate.py` for that scene. Blocks on drift.
- `Stop` → runs `plan_gate.py`, `build_gate.py`, `review_gate.py`. Blocks the
  turn from ending while any fail.

Both are **scoped** (nothing happens unless a plan has `"status": "active"`)
and **fail-open** (any internal error warns and exits 0, so a bug in the gate
can never brick the repo). Set the plan's status to `"shipped"` when the video
is finished and the gates go quiet.

---

## plan_gate.py — is the plan good?

```bash
py -3 .claude/skills/vox-collage-video/scripts/plan_gate.py input/scene_plan10.json
```

| Failure | What it means | Fix |
|---|---|---|
| `field '<x>' is empty` | A 2a/2b field was left blank | Fill it. An empty `visualTransformation` reliably produces a background+text scene |
| `đó là lời khen, không phải một quyết định` | Ô đầy chữ nhưng rỗng nghĩa ("phù hợp", "sinh động", "trực quan") | Viết cái gì đổi thành cái gì, cạnh cái gì. Danh sách cụm sáo rỗng bắn 0 lần trên 53 cảnh đã ship — thêm cụm nào phải đo lại |
| `quá ngắn để tả một quan hệ` | `visualTransformation` dưới 25 ký tự | Cảnh ngắn nhất đã ship là 31 ký tự. Dưới ngưỡng này là chưa quyết định gì |
| `no illustrative asset` | Scene declares a visual language but has nothing to show | Add the asset, or declare `text-only` (capped) |
| `text-only scenes = N (x%) > 15%` | Too much of the video is a blank page | Give those scenes a `background-photo`, `diagram`, or `map` |
| `<field> repeats on consecutive scenes` | Two neighbours look the same | Change one — see `visual-language.md` |
| `<x> on N/M scenes (>50%)` | One formula dominates the video | Diversify the languages |
| `N/M scenes use a stock template (>60% cap)` | The plan was assembled off the menu | Compose bespoke arrangements from the primitives for the scenes none of the seven actually fits |
| `'bespoke' must describe the arrangement` | `bespoke:TitleStamp` is a label, not a decision | Say what is being built: `bespoke: alley cross-section over a night background photo` |
| `dead air Xs` | Nothing new appears while narration continues | Add a beat, or split the scene |
| `only X% of runtime has a visual tied to what is being said` | The viewer hears claims with nothing on screen showing them | Add assets with `describes`, anchored near when the phrase is spoken |
| `declares no describes` | An asset can't say what it illustrates | Either name the phrase it illustrates, or remove it — it's filler |
| `visualEvent … is not backed by anything in the plan` | An event was typed with no asset entrance/exit or punch behind it | Add the beat it describes, or drop the event. `visualEvents` is authored by the same model the pacing gate constrains, so it is only worth anything cross-checked |
| `describes '<p>', which is never spoken in this scene` | Anchor points at the wrong scene | Re-check with `beat_sync.py frame --scene-start --scene-end` |
| `N scenes in a row carrying more than 2 beats` | Nowhere for the viewer to rest | Thin one scene in the run to 2 beats |
| `declared density "low" but carries N beats` | The label says calm, the scene behaves densely | Thin the scene, or stop calling it low — the label is not the escape |
| `visibleFor=N frames … below the 1.5s a viewer needs` | An element flashes and is gone | Raise `visibleFor`; the floor covers both fades, not just the readable stretch |
| `last beat at frame X … leaves only Ys before the cut` | The beat lands as the scene ends | Move it earlier — the legal window is 75 frames wide |

**Coverage is measured in seconds of runtime, not keyword hits.** A second
counts as covered when a visual is on screen AND declares a phrase spoken
within ±2s. Keyword stuffing earns nothing, because credit is only granted
near the moment the phrase is actually said.

### The pacing gate — does each scene get the time its content needs?

Cutting more often does not make a video better. It gets better when screen
time **matches how hard a scene is to take in**. Measured on the first rebuild
of V10, before this gate existed:

```
alley cross-section    2.8s   1.38s/beat   \  the three things the viewer has
density grid           2.6s   0.88s/beat    >  never seen before were the
force diagram          2.9s   0.97s/beat   /   three SHORTEST scenes
neon nightlife photo   5.3s   2.66s/beat   <- nothing to decode, most time
```

The whole mechanical explanation got 8.3 seconds; two mood shots got 9.6. The
plan passed every other gate. Root cause: scene boundaries were allowed to
follow the narration's segments mechanically. **Screen time does not have to
equal speaking time** — a drawing may hold past the sentence that introduced
it, and an easy mood shot may be cut short to pay for it.

`comprehensionLoad` (`simple` / `moderate` / `complex`) is a required field,
but it is **derived, not trusted**. `derive_load()` computes a floor from
three signals and the planner may raise a load, never lower it:

| Signal | Floor |
|---|---|
| A number spoken inside the window (`158`, `1,37 km2`, `2014`, `cấp 3`) | complex |
| `visualLanguage` ∈ diagram / data / timeline / flow | complex |
| `visualLanguage` ∈ map / annotated / split / mockup / document | moderate |
| `narrativeFunction` ∈ mechanism / causal-chain | complex |
| `narrativeFunction` ∈ cause / paradox / definition / list / evidence | moderate |

The spoken digits are the anchor that cannot be gamed — you cannot delete
"158" from what the voice actually says.

| Failure | Fix |
|---|---|
| `declared X but the content derives Y` | Raise the load, then give the scene the time that load requires |
| `Xs per visual beat, under the Ys floor` | Fewer beats in the scene, or a longer scene — move a beat into a neighbour |
| `Xs is under the Ys minimum for a 'complex' scene` | Borrow seconds from an adjacent easy scene |
| `a complex scene is SHORTER than the median scene` | The video is spending time on what is easy to look at instead of what is hard to understand |
| `N consecutive scenes within ±15% of the same length` | Cutting on a metronome. Rhythm has to come from the content |
| `N consecutive high-density scenes` | Give the viewer a breath |
| `N consecutive scenes with no low-density beat` | The video never pauses for thought |

Two elements landing on the **same frame** are one moment, not two — the plan
generator merges them before counting beats, otherwise the dwell floor demands
padding that changes nothing on screen.

## build_gate.py — is the build the plan?

```bash
py -3 .claude/skills/vox-collage-video/scripts/build_gate.py input/scene_plan10.json
py -3 .claude/skills/vox-collage-video/scripts/build_gate.py input/scene_plan10.json --scene S13
```

| Failure | Fix |
|---|---|
| `plan promises N illustration(s) … but renders NO image at all` | The "scene silently simplified" defect. Source the asset, or change the plan deliberately |
| `planned asset … is MISSING` | Same, for one element |
| `uses <src> which is NOT in the plan` | Add it to the plan with a `describes`, or remove it |
| `entrance frame X in the build vs Y in the plan` | Re-derive with `beat_sync.py`, or update the plan |
| `punch text differs` | Plan and build disagree on the headline |
| `parser could not read it` | **Do not assume the scene is fine** — build_gate needs fixing |

Template defaults are resolved from `SceneTemplates.jsx`, so a punch frame
that lives inside a template (e.g. `MapLocationScene`'s hardcoded `from={45}`)
is compared correctly rather than raising a false alarm.

## check_overlap.py — does it look right on screen?

```bash
py -3 .claude/skills/vox-collage-video/scripts/check_overlap.py \
  --elem "Hero-X=public/el10_x.png,x=50%,y=420,width=700,from=0,visibleFor=200" \
  --elem "Support-Y=public/el10_y.png,x=140,y=1020,width=300,from=50,visibleFor=120"
```

Five checks: pairwise alpha overlap, safe zone, support/hero proportion,
**frame coverage**, and **balance**.

Pass anything that occupies space but has no PNG — a headline block, a
diagram, a map panel — as `box:WxH`:

```bash
--elem "Punch=box:900x260,x=50%,y=200,width=900,from=45,visibleFor=200"
```

Without it the balance check sees only cutouts and judges the frame on part of
its mass.

Coverage floor `0.12` is calibrated, not guessed — against scenes the user had
already judged:

```
flagged as too empty:  S13 6.8%   S17 3.8%   S5 11.2%
not flagged:           S4 13.6%   S8 15.0%
```

Below 12% reads as a bug; 25% is the advisory target. Fix by sizing the hero
from its **rendered height** (a landscape-crop asset at `width=560` can be
only ~310px tall), adding a `BackgroundPhoto`, or adding a real second beat.

**Balance** is a separate question from coverage: not how much is filled, but
*where* it sits. It takes the centroid of the real opaque mass inside the
usable band and fails when it drifts past `--balance-dx` (0.16 × width) or
`--balance-dy` (0.18 × band height) — the user's "lệch lên mép trên / lệch
sang bên phải" complaint. A top-heavy frame and a centred frame score
identical coverage and neither trips the safe-zone check, so nothing else
catches it.

These two tolerances are geometric, **not** calibrated against judged scenes
(unlike the coverage floor) — the V10 plan was reconstructed without
per-asset coordinates. Re-calibrate them the first time a batch of real scenes
is judged by eye. Fix a failure by moving the cluster toward the band centre
or adding a counterweight beat on the empty side — not by nudging the headline
alone.

## review_gate.py — has anyone looked at it?

```bash
py -3 .claude/skills/vox-collage-video/scripts/render_review_sheet.py input/scene_plan10.json
# look at the contact sheet, fill in input/review10.json
py -3 .claude/skills/vox-collage-video/scripts/review_gate.py input/scene_plan10.json
```

Every scene needs a verdict (`pass` / `fail` / `n/a`) on the user's four
criteria, with a frame path as evidence:

- **illustrated** — narration is shown, not left to the viewer's imagination
- **composed** — balanced, everything inside the frame and legible
- **varied** — not the same visual formula as its neighbours
- **purposeful** — every element is there for a reason, not filler

A `fail` blocks until fixed, or until `"resolved": true` is set with a note
saying why it is acceptable. This gate cannot judge quality — it makes
*skipping the look* impossible, which is the failure that actually happened:
V10 passed every automated check and the first person to watch it found four
defects in the first minute.

## text_gate.py / icon_gate.py — what the drawn text does

```bash
py -3 .claude/skills/vox-collage-video/scripts/text_gate.py input/scene_plan11.json
py -3 .claude/skills/vox-collage-video/scripts/icon_gate.py input/scene_plan11.json
```

These read the built `.jsx`, not the plan, because a label's real problem —
where it lands, what it covers, how much of it there is — exists only in the
markup. `review_gate` cannot see any of it: it measures how much of the band
carries ink, and text laid *on top of* an image produces ink just as well as
text laid beside it. That is not hypothetical; it is how "fill the empty
band" got satisfied by writing over the pictures on ten scenes while the
metric went green.

| Failure | Fix |
|---|---|
| `label … is N words` | Cut to ≤4 words, or replace it with a symbol. The caption bar is already running the narration underneath |
| `label … restates what the narration says` | Delete it. Three channels, one message, none of them a picture |
| `label … overlaps image X while both are on screen` | Move it. Filling a gap by writing over the picture is not filling the gap |
| `label … reaches y=N, inside the caption strip` | Move it up; the strip starts at y=1420 |
| `label … spells out 'X', which the vocabulary already draws` | Render the named icon and cut the word |
| `symbol floor: N/M scenes carry a drawn symbol` | Use the vocabulary. This floor exists because the word rule alone is satisfiable by never typing a trigger word |
| `iconVocabulary.jsx: X is exported but missing from VOX_ICONS` | Register it. An unregistered icon is invisible to the word rule |

`overlayOn="AssetName"` declares an overlay that is *meant* to be there — an
exit number written across a deliberately blank sign. It names its target, so
an overlay on anything else still fails: a declaration, not an escape hatch.

## cutout_gate.py — is the cutout clean?

```bash
py -3 .claude/skills/vox-collage-video/scripts/cutout_gate.py public/ --video 11 --plan input/scene_plan11.json
```

Cutting an image costs seconds and almost no tokens. **Judging** it was the
expensive part: with no measurement, every PNG had to be opened and squinted
at, and eyes are unreliable enough that it had to be done twice. Two V10
assets still shipped with defects a contact sheet had already "passed" — this
gate finds exactly those two.

It measures five things, and the first one is the reason it works at all:
chroma spill is detected as an **edge-versus-core difference**, not as a green
pixel count. A plant is green all the way through; spill is green only at the
rim. Counting green alone would convict every green object in the project.

| Failure | Fix |
|---|---|
| `viền còn ám màu phông` | The screen colour is bleeding onto the subject. Re-cut with a different `--bg-mode`, or regenerate the source with a flat screen and no cast shadow |
| `alpha lưng chừng` | A haze/ghost band, not antialiasing. Try `--model birefnet-general` |
| `viền ảnh vẫn đặc` | The subject runs off the frame edge. **No removal model can fix this** — measured: birefnet-general-lite gave the same border figures as isnet-general-use. Regenerate the source with the subject fully in frame |
| `gần như không khử được gì` | Check the `removal:` line — the method was auto-picked wrong |

Only `hero` and `support` assets are judged. A `background` photo is
full-bleed on purpose and has no alpha channel; the first version of this gate
reported 12 of them as broken, which was the rule being wrong, not the images.

## block_gate.py — kho block có bị dùng thành công thức không?

```bash
py -3 .claude/skills/vox-collage-video/scripts/block_gate.py input/scene_plan14.json
```

Dự án này **đã có một kho template và đã bỏ nó.** `src/scenes/SceneTemplates.jsx`
có 7 template, V3–V9 dùng 4–7 cảnh mỗi video, V10–V13 dùng **zero** lần.

Đọc lại 7 template đó thì thấy chúng không phải 7 template — chúng là **một
cảnh với 7 cách xếp ảnh**: cả 7 đều `CameraGroup zoom 1 → 1.0x`, đều
`Hero variant rise/grow/dropSpin`, đều `Support idle="sway"`, đều
`visibleFor={durationInFrames}`. Và chúng được đặt tên theo **bố cục**
(`Split`, `Collage`, `Map`), nên agent buộc phải chọn theo bố cục.

Kho block mới sửa cả hai: tra cứu theo `narrativeFunction × visualLanguage`
(hai trường plan đã bắt buộc khai), và mỗi block mang bộ chuyển động riêng.
Nhưng **không có gì trong mã nguồn ngăn một agent dùng một block cho cả video** —
gate này là thứ ngăn điều đó, bằng số chứ không bằng lời dặn.

### Ngưỡng lấy từ đâu

Đo trên V10 sau khi ánh xạ 14/26 cảnh của nó vào 5 block:

| block | số cảnh | tỉ lệ |
|---|---|---|
| PhotoClaim | 6/26 | **23%** |
| MapPlace | 3/26 | 12% |
| TimelineSpan | 2/26 | 8% |
| DocFocus | 2/26 | 8% |
| ChannelOutro | 1/26 | 4% |

Trần đặt ở **25%**, ngay trên mức đo được.

> Đề xuất ban đầu là **"≤2 cảnh/video"** và nó **sai** — nó đánh trượt chính
> V10 ở PhotoClaim (6 lần). Đây là lý do ngưỡng phải đo trước khi viết, không
> phải đặt rồi sửa sau.

### Các phép kiểm

| kiểm | mức | căn cứ |
|---|---|---|
| block chiếm >25% số cảnh | **FAIL** | cao nhất đo được trên V10 là 23% |
| block dùng ≥3 lần mà chỉ ở 1 thế | **FAIL** | V10 dùng PhotoClaim 6 lần ở **3 thế** — đó là lý do nó không đọc ra là lặp |
| khai block không có trong registry | **FAIL** | bắt đúng trường hợp gõ tên template thế hệ cũ |
| cảnh không khai `block` cũng không khai `bespoke` | **FAIL** | không phân biệt được lựa chọn với sự quên |
| `bespoke: true` mà không có `bespokeReason` | **FAIL** | bespoke được phép; bespoke không giải thích thì không |
| hai cảnh liên tiếp cùng block | WARN | V10 có đúng một lần (S21→S22) và không ai phàn nàn |
| `nf × vl` không nằm trong `fits` của block | WARN | bắt đúng V10/S22: plan khai `split` trong khi bản dựng không hề chia đôi khung |
| punch giữ dưới 48f | WARN | block sẽ tự kẹp, nhưng sửa mốc neo thì đúng hơn |
| bespoke >60% số cảnh | WARN | V10 ở 46%; gần hết bespoke nghĩa là kho không được dùng |

### Bespoke không bị cấm

Khoảng **một nửa V10 là bespoke và đó là đúng**. Một kho block cấm bespoke sẽ
tạo ra đúng thứ đơn điệu mà nó sinh ra để chặn. Cái bị chặn là bespoke **không
khai** — vì khi đó không ai biết đấy là quyết định hay là bỏ sót.

## asset_gate.py — có vừa cái hộp không?

```bash
py -3 .claude/skills/vox-collage-video/scripts/asset_gate.py input/scene_plan13.json
```

`cutout_gate` hỏi *viền có sạch không*. Gate này hỏi câu khác hẳn, mà trước
nay chưa có gate nào hỏi: **ảnh này có vừa cái hộp mà plan đặt nó vào không.**

Lý do nó tồn tại nằm trong chính `shared.jsx`: `Hero`/`Support` nhận một
`width` và không nhận gì khác, còn `<Img>` bên trong đặt `width: "100%"` —
nên **chiều cao là hệ quả của tỉ lệ file PNG**, không ai đặt được. Mà
`crop_to_content` trong `process_cutout.py` cắt sát chủ thể, nên tỉ lệ đó
gần như ngẫu nhiên theo dáng từng ảnh. Đo thật: cùng `width=680`, ảnh 16:9
cao 383px, ảnh 3:4 cao 907px — **chênh 2,4 lần diện tích từ một con số bố
cục y hệt nhau**.

Đó là lý do "đặt ảnh vào một khung cố định" tự nó không bao giờ chặn được
lỗi tràn / đè / quá nhỏ. Thiếu mảnh còn lại: chưa có chỗ nào **khai** ảnh
được phép mang hình dạng gì.

### Hai lỗi nó bắt

**1. Phóng to.** Ảnh render rộng hơn số điểm ảnh của chính nó thì bị kéo lên
và đọc ra mờ. Ngưỡng **không phải đoán** — hiệu chỉnh theo phán quyết bằng mắt
của chính người xem trên 33 asset thật của V10–V13:

| tỉ lệ | asset | người xem nói gì |
|---|---|---|
| 1,68 | V10/S13 Doc-Trace | (chưa soi kỹ) |
| 1,57 | V11/S10 Hero-Passports | V11 = video họ thấy đuối |
| 1,23 | V10/S9 Sup-CrowdBehind | |
| **1,22** | **V10/S25 Sup-Gate** | **BÁO LỖI BẰNG MẮT** |
| 1,09 | V12/S2 Hero-Mother | không phàn nàn |
| 1,05 | V10/S23 Doc-Name | không phàn nàn |

Trung vị cả 33 asset: 0,69. Phàn nàn bắt đầu ở 1,22 và tắt ở 1,09, nên
**FAIL đặt ở 1,15** — nằm đúng trong khe. Trên 1,00 thì cảnh báo.

Lỗi này **cắt lại không cứu được**. Ảnh nhỏ là nhỏ; phải sinh lại chủ đề trên
một board một ô riêng (SKILL.md bước 3).

**2. Sai hình dạng so với slot.** Khi asset khai `slot.aspect`, file phải
đúng là hình đó — tức phải được sinh ra bởi `process_cutout.py --fit W:H`.
Gate đọc dấu `voxFitAspect` / `voxContentPx` mà `--fit` đóng thẳng vào PNG.

Chọn dấu trong PNG thay vì file JSON kèm bên là có chủ ý: file kèm bên lệch
ngay lần cắt lại đầu tiên mà không ai biết, và một file kèm bên đã lệch còn
tệ hơn không có. Dấu trong PNG đi theo file và không thể lệch khỏi nó.

Vì vậy gate **vẫn fail** khi tỉ lệ đúng nhưng file không mang dấu: đúng tỉ lệ
một cách tình cờ thì lần cắt lại sau sẽ lệch, và khi đó không ai truy ra lý do.

### Khai một slot

```json
{ "role": "support", "name": "Sup-Gate", "src": "el10_gate.png",
  "width": 760,
  "slot": { "aspect": "3:4" } }
```

`aspect` hiện là tuỳ chọn — không khai thì chỉ chạy phép kiểm phóng to, nên
gate chạy an toàn trên mọi plan cũ. Khai rồi thì cả hai phép kiểm đều buộc.
`--strict-slots` bắt mọi asset có file phải khai.

Ảnh `background` được miễn cả hai: `BackgroundPhoto` là full-bleed
`object-fit: cover`, không có slot để tràn và không có tỉ lệ phải giữ.

### Vì sao không có ca "V10 phải PASS"

Giống `cutout_gate`: **V10 thật sự đã ship với ba asset vượt trần** (S9, S13,
S25). Ca "phải PASS" trong `selftest.py` chạy trên bản đã hạ `width` của
đúng ba asset đó. Đừng nới ngưỡng để V10 xanh — video đã ship, ngưỡng thì
không nên đổi theo nó.

## pixel_gate.py — does the render match what the code claims?

```bash
py -3 .claude/skills/vox-collage-video/scripts/pixel_gate.py input/scene_plan11.json
```

Every other text gate reconstructs geometry from source. This one takes the
box `text_gate` predicts and looks at the **rendered frame** at that spot. The
gap is real: the `CĂN CỨ YONGSAN` label sliced by a panel on S6 passed every
text gate and only appeared when a still was rendered.

| Failure | Fix |
|---|---|
| `chỉ có N% mực ở đó` | The label is clipped, covered, or never appears. Open the named frame and look at that exact spot — the double-subtracted `delay` trap in SKILL.md §6 produces this |
| `chỉ chênh N/255 so với nền` | Dark ink sinking into a dark photo. Add `plate`, use a light `fill`, or `wash="paper"` |

It only judges labels that should have **fully appeared** by the captured
frame — enclosing `<Sequence from={N}>` offsets plus `DrawnText`'s 10-frame
fade-in. Skipping that is not optional: without it the gate convicted four
perfectly correct V10 labels whose `<Sequence>` had not started yet.

## assemble.py --check — phần cơ khí có khớp hợp đồng không?

```bash
py -3 .claude/skills/vox-collage-video/scripts/assemble.py input/scene_plan10.json --check
```

Không phải gate chấm chất lượng — nó canh ba file MÁY SINH (captionData,
`V<N>Master.jsx`, khối `ASSEMBLE:V<N>` trong Root.jsx) không bị sửa tay lệch
khỏi plan. Stop hook chạy nó, và `guard_premature_shipped` chạy nó trước khi
cho ship.

| Failure | Fix |
|---|---|
| `captionData<M>.js LỆCH bản sinh` | Chạy lại `assemble.py` — đừng sửa caption bằng tay; nguồn sự thật là words file |
| `V<N>Master.jsx LỆCH bản sinh từ plan` | Rail/cảnh trong master bị sửa tay. Sinh lại; nếu cần transition đặc biệt, khai `transitionIn` trong plan hoặc viết master TÊN KHÁC bằng tay |
| `chưa được sinh dù mọi cảnh đã dựng` | Chạy `assemble.py` — video đủ cảnh mà thiếu master là bước 7 chưa làm |
| `là file viết tay, không đè` | Đúng hành vi: file không mang dấu AUTO-GENERATED thì script không đụng. `--force` chỉ khi chắc chắn |

Còn thiếu cảnh thì mọi bước tự "bỏ qua (chưa tới lúc)" — video đang dựng dở
không bao giờ bị chặn vì chưa xong.

## init_video.py — KHÔNG phải gate, và vì sao

`init_video.py` dựng `words<N>_aligned.json` từ audio + kịch bản. Nó **không**
nằm trong Stop hook và **không** ở `REQUIRED_GATES`, khác với `assemble.py`.

Lý do đo được: caption là hàm thuần của words file, nên sai một khung là sai.
Còn bản ghép chữ-với-thời-gian thì không: whisper đôi khi nghe ĐÚNG hơn kịch
bản ("bà" → "bar", "mặt độ" → "mật độ"), và hai video đã ship đều được sửa tay
đúng những chỗ đó. Bắt file phải khớp máy từng từ là bắt phiên sau xoá đi phần
sửa đúng.

Cái nó tự chặn được là thứ máy biết chắc: ghép nhầm cặp audio/kịch bản
(>15% lệch số từ so với whisper, hoặc số từ/giây ngoài khoảng tiếng nói).
`--check` báo tỉ lệ giống và chỉ fail dưới 90% — đo thật: V10 99.3%,
V11 96.5%, cặp sai 23.8% → chặn.

## Adjusting a threshold

Thresholds are CLI flags, deliberately. If one is genuinely wrong for a
video, change it explicitly and say why. What must not happen is thinning the
plan until a gate goes quiet — that is the failure mode the gates exist to
prevent, and it will look identical to progress.

## baseline_gate.py — không được tệ hơn video trước

Mọi gate khác đo **SÀN**. `plan_gate` nhận 70% độ phủ nội dung; V10 đạt 95,9%.
Nó nhận 1,60 s/nhịp ở cảnh complex; V10 đạt 2,10. Nghĩa là video sau có thể
đạt 71% và 1,61, **pass sạch mọi gate, và xem thì tệ hơn hẳn**. Đó chính là
kiểu hỏng "chất lượng chênh lệch, không đồng nhất" mà trước file này không có
gì đo được.

`baseline_gate` so video mới với **hồ sơ đã đóng băng** của một video từng
được duyệt là đạt (`references/baseline.json`), không so với mức tối thiểu.

```bash
py -3 baseline_gate.py profile input/scene_plan11.json   # xem số của video này
py -3 baseline_gate.py check   input/scene_plan11.json   # gate
py -3 baseline_gate.py freeze  input/scene_plan11.json   # đặt mốc chuẩn MỚI
```

Mốc chuẩn hiện tại: **V10 Itaewon** (commit `ebf39b8`, tag `v10-restore-point`).

| Chỉ số | V10 | Cho phép tụt |
|---|---|---|
| độ phủ nội dung | 95,9% | 8 điểm |
| giây/nhịp cảnh complex | 2,10 | 0,25 |
| giây/nhịp cảnh moderate | 1,80 | 0,20 |
| số ngôn ngữ hình ảnh | 11 | 2 |
| tỉ lệ ngôn ngữ nhiều nhất | 26,9% | +8 điểm |
| cảnh xếp chồng ≥2 vai trò | 42,3% | 12 điểm |
| cảnh có hình vẽ bằng code | 65,4% | 12 điểm |
| cảnh chỉ có ảnh nền | 23,1% | +10 điểm |
| tài nguyên/cảnh | 1,62 | 0,35 |
| khoảng cách sự kiện lớn nhất | 3,55s | +1,0s |

**Một ngưỡng KHÔNG lấy từ V10:** `photo_only_last_third_pct` ≤ toàn video + 12
điểm. Đóng băng hồ sơ cũng đóng băng cả điểm yếu của nó, và V10 hơi nghiêng về
ảnh không khí ở đoạn cuối (25% ở 1/3 cuối so với 23% toàn video). Ngưỡng này
đặt tuyệt đối để video sau không được nhạt dần về cuối.

### Khi gate này FAIL

Sửa kế hoạch. **Đừng `freeze` lại bằng video kém hơn để gate im lặng** — làm
vậy là xoá đúng thứ file này tồn tại để bảo vệ. Chỉ `freeze` lại khi video mới
thực sự tốt hơn ở mọi chỉ số.

### Giới hạn phải nói rõ

Gate này đọc **kế hoạch**, không đọc pixel (nó chạy trong hook nên phải nhanh
và không render). Lỗi bố cục — hình nhỏ lơ lửng giữa khoảng trắng — là việc của
`review_gate` và của mắt người. Truyền `--frames input/review_frames` để bổ
sung số đo độ lấp khung khi frame đã render xong.

Và: **cấu trúc không phải chất lượng.** Một kế hoạch có thể đạt mọi con số ở
đây mà vẫn nhàm. Gate này làm cho việc "trượt lùi âm thầm" trở nên bất khả thi;
nó không làm cho bất cứ thứ gì hay lên. Phần đó là `worked-examples.md`.

## Chặn cảnh chưa duyệt shot list (hook_gate)

`"shotlistApproved"` trong plan là chốt duyệt của user, học từ vox-director
(`aspect_approx_confirmed`): sự chấp thuận của con người là một FIELD DỮ LIỆU,
không phải một câu văn. `post_edit` chặn mọi file cảnh của video active khi cờ
chưa `true`; `guard_premature_shipped` chặn ship khi cờ bị gỡ. Scaffold của
`new_video.py` đặt sẵn `false`.

Giới hạn nói thẳng: field vẫn do model gõ (nguyên tắc ANCHOR — không có mỏ neo
ngoài nào ghim nó), nên chốt này KHÔNG chứng minh được user đã duyệt. Cái nó
mua được là loại bỏ đường "im lặng bỏ qua checkpoint": muốn vượt phải chủ động
khai man, và hai ca selftest khoá cả hai chiều (chưa duyệt → chặn; duyệt rồi →
không chặn oan).

## Chặn cảnh chưa có kế hoạch (hook_gate)

Trước đây `hook_gate` trả về 0 ngay khi không tìm thấy plan nào `active` —
nghĩa là **toàn bộ hệ thống cưỡng chế vắng mặt đúng lúc quan trọng nhất**: đầu
một video mới, trước khi có plan. Có thể viết thẳng `V11Scene1.jsx` từ shot
list trong chat, đúng cái lỗi gốc mà skill này ra đời để ngăn.

Nay: file cảnh của một video **mới hơn mọi video đã có plan** bị chặn thẳng
(exit 2). Video cũ (V3–V9) có trước quy ước nên được để yên — chặn sửa việc đã
ship là bug, không phải cưỡng chế.

Dựng khung plan bằng `new_video.py <N> --words input/words<N>_aligned.json`.
Khung này để rỗng mọi trường biên tập **có chủ ý** — `plan_gate` fail 423 lỗi
trên khung trắng, nên không thể nhầm khung với kế hoạch.

## selftest.py — test cho chính bộ gate

Mọi script khác canh video. Không có gì canh **chúng nó**. Điều đó nghiêm
trọng hơn nghe thấy, vì `hook_gate.py` cố ý fail-open: một gate âm thầm ngừng
hoạt động trông y hệt một gate không có gì để báo.

```bash
py -3 selftest.py        # 12 trường hợp
py -3 selftest.py -v     # xem output từng gate
```

Mỗi trường hợp dựng một input hỏng có chủ ý trong thư mục tạm, chạy gate thật,
và khẳng định gate **phải FAIL**. Sau đó chạy plan V10 thật qua cả 4 gate và
khẳng định **phải PASS**. Gate không thể fail thì không phải gate; gate không
thể pass thì là bức tường, và tường sẽ bị dỡ.

Các mutation đều là lỗi dự án **đã từng ship hoặc suýt ship**, không phải tình
huống bịa: cảnh không minh hoạ, một ngôn ngữ cho cả video, cảnh khó bị bóp
thời lượng, khoảng chết hình, nhịp khai khống, trường biên tập rỗng, tụt so
với mốc chuẩn, chấm "pass" cho khung đo được là trống.

**Chạy sau mỗi lần sửa bất kỳ gate nào.** Đã nối vào Stop hook.

> Lần chạy đầu tiên, selftest báo FAIL một trường hợp — và lỗi nằm ở **test**,
> không ở gate: nhịp khống cắm ở frame 60 của S1 lại rơi trong dung sai 8
> frame của punch tại 62, nên gate im lặng là đúng. Câu chuyện đó được giữ lại
> trong docstring của `unbacked_event` thay vì dọn đi, vì đó chính là kiểu
> nhầm lẫn mà selftest sinh ra để phơi bày.

## Bốn đường im lặng đã bịt

`hook_gate` fail-open có chủ ý — gate hỏng mà khoá cứng dự án thì tệ hơn không
có gate. Nhưng bốn thứ sau từng đi nhờ ngoại lệ đó dù chẳng liên quan gì, đo
được trên chính checkout V10:

| Tình huống | Trước | Nay |
|---|---|---|
| Một gate script bị xoá/đổi tên | exit 0 | **CHẶN** (`REQUIRED_GATES`) |
| Plan JSON hỏng cú pháp | exit 0 | **CHẶN** (`find_active_plan` trả `broken`) |
| `status: "shipped"` đặt sớm | exit 0 | **CHẶN** (`guard_premature_shipped`) |
| Gate bị sửa thành luôn PASS | exit 0 | **CHẶN** (`selftest.py`) |

Không cái nào là lỗi môi trường; mỗi cái đều là đúng loại sai sót hệ thống này
sinh ra để bắt, và mỗi cái đều âm thầm tắt cả hệ thống.

Riêng `shipped`: gate canh **thời điểm chuyển trạng thái**, không canh trạng
thái. Ngay khi plan được ghi với `shipped`, cả 4 gate chạy, và lệnh ghi bị
chặn nếu có gate nào fail. Video xong thật thì trạng thái đúng và mọi thứ im
lặng — đó mới là công dụng của trường status.

## review_gate — đòi số đo, không đòi lời khai

Nửa "chấm điểm" của gate này **đã hỏng trên thực tế**, hai lần trong một phiên,
trên cùng một video: sau khi sửa 11 cảnh thưa, tôi ghi `composed: "pass"` cho
cả 26 cảnh, và người xem vẫn tìm ra cảnh trống; lượt sau S19 (headline chìm)
và S20 (trống dải dưới) cũng đã được ghi `"pass"` vài phút trước đó.

Gate hỏi "đã xem chưa?" và chấp nhận "rồi" làm bằng chứng. Gate mà đầu vào là
sự trung thực của người chấm thì không phải gate, đó là cái biểu mẫu.

Nay gate **tự đo khung hình** rồi đối chất với lời khai:

* Dải khả dụng y=300→1250 (dưới đó là chỗ của caption, vốn KHÔNG có trong scene
  still — đo cả khung sẽ báo trống thừa ~20 điểm).
* Cảnh bị đánh dấu khi <55% số hàng có nội dung, hoặc có khoảng trống liền mạch
  >300px.
* Cảnh bị đánh dấu mà ghi `"pass"` trơn sẽ **bị từ chối**, trừ khi có
  `"resolved": true` hoặc một `note` ≥25 ký tự nói rõ *vì sao* — ảnh full-bleed
  và bản đồ đo thấp một cách chính đáng, nói một câu là xong; không nhận ra mới
  là cái đắt.
* Frame **cũ hơn** file .jsx của cảnh = bằng chứng ôi. Verdict trên bằng chứng
  ôi là verdict về một bản dựng không còn tồn tại. (Đã xảy ra: frame S8 cũ hơn
  bản dựng lại của nó.)

---

## Lớp nhìn bằng model rẻ — `vision_check.py`, `asset_vision.py`

**Không phải gate. Không chặn.** `hook_gate` chạy chúng ở cuối lượt và in ra
danh sách chỗ đáng nhìn; router tắt thì chúng im lặng.

Vì sao không làm gate chặn, hai lý do đều đo được:

1. Chúng gọi một dịch vụ ngoài (`localhost:20128`). Một gate chặn phụ thuộc
   dịch vụ ngoài sẽ khoá cả repo mỗi lần dịch vụ đó tắt.
2. Thứ chúng trả về là *"chỗ này cần nhìn"*, không phải *"chỗ này sai"*. Trên
   bộ nhãn 26 ca: 25/26 đúng, 0 dương tính giả — nhưng cùng một lỗi lúc gọi
   `text_overlap` lúc gọi `collision`, và một ca bắt được ở lần chạy này, trượt
   ở lần sau, dù `temperature = 0`.

Chúng lấp chỗ mù của các gate hiện có, không chồng lấn:

| | đo gì |
|---|---|
| `cutout_gate` | hình học của việc tách nền — chroma, quầng alpha, mảnh vụn, chạm mép |
| `asset_gate` | độ phân giải so với ô slot — phóng to bao nhiêu lần |
| `text_gate` | cỡ chữ và số từ, dựng lại từ **mã nguồn** |
| **`asset_vision`** | **nghĩa** — đúng vật không, minh hoạ đúng lời thoại không |
| **`vision_check`** | **điểm ảnh** — chữ bị đồ hoạ đè, khung trống, chữ khó đọc |

Ca chứng minh: V10/S7 có chữ tiêu đề bị các chấm tròn đè. `text_gate` mù vì
chấm tròn là đồ hoạ component tự vẽ, không phải nhãn khai trong plan. Người xem
bắt được; sáu gate cho qua; `vision_check` bắt được và mô tả đúng.

### `vision_regress.py` — bộ hồi quy, và nó bắt buộc

Chạy sau **mọi** thay đổi prompt, model, hay `encode()`:

```bash
py -3 .claude/skills/vox-collage-video/scripts/vision_regress.py
```

Nó tồn tại vì trong chính phiên xây hai script trên, một bản vá cho `encode()`
đã **làm mất một dương tính đúng** đã được người xem xác nhận (V10/S25, cutout
cổng chùa bị xoá nham nhở). Không có bộ này thì không ai biết.

Mọi nhãn trong `vision_labels.json` phải ghi **nguồn sự thật**: phán quyết của
người xem, `text_gate` (đọc mã nguồn, độc lập với ảnh), hoặc một phép đo số học.
Nhãn đặt bằng cảm tính của agent chính là thứ hai script này sinh ra để thay thế.

Mục `khong-dua-vao-bo-nay` trong file nhãn ghi những ca **đã thử và không dùng
được**, kèm lý do — để không ai thêm lại rồi tưởng script hỏng.
