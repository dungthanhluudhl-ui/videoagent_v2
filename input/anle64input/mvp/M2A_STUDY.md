# VIDEOAGENT 2 — ÁN LỆ 64 MVP M2A STUDY

## Scope and authority

- Corrected script authority: `D:\VideoAgent 2\input\anle64input\scriptfull.txt`
- Current narration: `D:\VideoAgent 2\input\anle64input\Audiofull.mp3`
- Official factual/legal authority: `D:\VideoAgent 2\input\anle64input\Án lệ 64.pdf`
- V3 MVP composition number: `V14`
- V3 plan: `D:\VideoAgent 2\input\scene_plan14.json`
- This is an asset-ready plan, not a quality claim. No Án lệ MP4 or scene JSX exists yet.

## Script/audio factual and pairing preflight

The corrected script contains the customer corrections and is consistent with the official case narrative:

- The group does **not** arrest T at Nội Bài; the two taxis travel about 15 km before the stop and approach.
- T is **not** attacked immediately on leaving the terminal.
- The detention described in the selected slice is at a scrap-material warehouse, not a motel near the airport.
- No police raid is narrated. The script later records surrender to the authorities consistently with the PDF.
- The old trial/appellate sentences are not presented as the final procedural result; the script records cassation, partial annulment, and remand for retrial.

Full-pair V3 evidence from the current source:

- Full narration measured independently: 416.640s, MP3, 24,000 Hz, mono.
- Stored full alignment evidence: 1,845 script words / 1,831 Whisper words, 0.8% count drift, 99 Whisper segments, 416.42s transcript end.
- `init_video.py --check` rebuilt the full alignment word-for-word.
- Whisper contains expected Vietnamese proper-name/number recognition errors; none replaced the script. Script remains **WHAT**, Whisper remains **WHEN**.
- A repeated full Whisper run varied slightly (1,822 then 1,831 words). Segment/phrase anchors were therefore manually reviewed; this is a timing risk to recheck during M2B, not a reason to edit the transcript.

## Selected diagnostic slice

- Source start: **134.000s**
- Source end: **194.020s**
- Exact trimmed duration: **60.020s**
- First sentence: **“Nhưng câu chuyện chưa dừng ở đó.”**
- Last sentence: **“Thứ nhất, Dù giữa hai bên có một khoản nợ thật. nhưng nếu bạn bắt giữ, trói, nhốt hoặc dùng bạo lực đối với con nợ để gây áp lực. rồi buộc chính họ, gia đình hoặc người thân phải giao tiền thì mới thả người. thì việc \"đòi nợ\" đó không còn đơn giản là một tranh chấp tiền bạc nữa.”**

The initial trim at 134.340s clipped the audible first word even though it matched a Whisper segment boundary. Adding 0.340s pre-roll preserved the complete sentence. The resulting 60.020s is only 0.020s over target and is preferred over a clipped thought.

Why this is diagnostic:

1. It starts with physical detention, restraint, confinement, and a compelled call in the warehouse.
2. It escalates the 150m debt into a condition for release.
3. It creates the viewer’s plausible counterargument: the debt was real, so why this offense?
4. It reaches the first complete legal rule: real debt does not legalize hostage-style detention, violence, or money-for-release coercion.
5. It tests full-bleed reconstruction, consistent anonymous character poses, cutout collage, authentic-document hierarchy, beat timing, typography restraint, and a document-led conclusion.
6. It does not need a map, icon, or diagram; adding any would explain less than the imagery and source document.

MVP pair:

- Audio: `D:\VideoAgent 2\input\anle64input\mvp\Audio_mvp.mp3`
- Script: `D:\VideoAgent 2\input\anle64input\mvp\script_mvp.txt`
- V3 trimmed alignment: 261 script words / 261 Whisper words, 0.0% count drift, 11 Whisper segments, 60.00s transcript end.
- Manual risk: Whisper mishears names and some legal words, but all planned phrase anchors were checked against `input/words14_aligned.json` and remain script-authoritative.

## Golden V10/V11 study

Product-authority MP4s:

- V10: `D:\VideoAgent 2\input\MP4 V10 V11\ItaewonRemDapV10.mp4` — 101.290667s, 1080×1920, 30fps.
- V11: `D:\VideoAgent 2\input\MP4 V10 V11\ItaewonHemNhoV11.mp4` — 124.053333s, 1080×1920, 30fps.

Method: eight representative frames per MP4 (opening, early-middle, middle, late-middle, ending, and visual-language changes) were sampled into ignored scratch contact sheets. `Root.jsx`, the two master files, and representative shipped scene JSX were used only as implementation evidence. No golden file or scene was edited.

Qualitative guidance carried into V14:

- **Scale and hierarchy:** one large visual claim dominates; cutouts are large enough to share or take over the usable band rather than float as centered stickers.
- **Photo/collage balance:** full-bleed or large photographic fields establish place and mood; cutouts, document crops, and short typography form foreground/midground/background relationships.
- **Typography density:** short editorial headings only when they change the reading; running captions already carry narration. Avoid paragraphs of duplicated overlay text.
- **Orange usage:** selective emphasis/highlight, not decorative linework or a mandatory border system.
- **Rhythm and breathing:** neighboring scenes change visual grammar and usually allow a visual state to read before the next one lands. V11’s repeated pale-paper + dense-overlay tendency is treated as anti-pattern evidence, not a quota.
- **Camera movement:** restrained drift/push on photographs and source-preserving focus changes; motion supports an editorial reveal rather than making a static still busy.
- **Authenticity:** real photography and recognizable documents lead; generated imagery is raw reconstruction material, never presented as actual case photography.

## Official PDF mapping used by this MVP

Only the following source regions are planned:

| PDF page | Paragraph/region | Legal/factual purpose | Scene(s) | Planned crop filename(s) |
|---|---|---|---|---|
| 1 | Upper title/source block | Identify Án lệ 64/2023/AL, the official source decision, and the offense title without fabricating a judgment page | S5 | `anle64_pdf_p1_authority.png`, `anle64_pdf_p1_title_focus.png` |
| 2 | Opening `NỘI DUNG VỤ ÁN` paragraph; late-page warehouse-arrival/restraint narrative | Establish that the 150,000,000 VND debt was real and unpaid; factually support the anonymous warehouse reconstruction and restraint | S1, S4 | `anle64_pdf_p2_real_debt.png` (S4 crop; S1 uses the page only as factual authority) |
| 3 | Continuation of warehouse restraint; upper factual narrative, especially noon 16/01/2019 demand | Confirm continued confinement, compelled calls, the 150m demand, and release being conditioned on payment | S1–S3 | `anle64_pdf_p3_noon_demand.png`, `anle64_pdf_p3_pressure_continues.png` |
| 8 | `NỘI DUNG ÁN LỆ`, paragraph **[7]** | Official legal bridge: detention/tying/confinement/violence pressured T’s family to transfer 150m so T would be released; this is the exact rule reached by the narration | S6–S7 | `anle64_pdf_p8_p7_actions.png`, `anle64_pdf_p8_p7_pressure.png`, `anle64_pdf_p8_p7_release_condition.png`, `anle64_pdf_p8_p7_conclusion.png` |

M2B must create these crops locally from the actual PDF, preserve recognizable page typography/context, and use source-preserving focus/highlight. Do not retype a fake page or alter meaning.

## Seven-scene editorial outline

1. **S1 — Warehouse confinement:** full-bleed anonymous reconstruction; restrained person, handcuffs/rope, then compelled-call pose.
2. **S2 — Money for release:** same environment and consistent subject; authentic page-3 paragraph takes visual priority.
3. **S3 — Continued pressure to legal question:** page 3 expands; restrained figure returns at the edge; a short “CÂU HỎI PHÁP LÝ” beat creates the pivot.
4. **S4 — Real debt / unlawful means paradox:** page-2 real-debt evidence holds against handcuffs and the restrained person.
5. **S5 — Source authority:** authentic page 1 replaces reconstruction and tightens to the precedent identifier/offense title.
6. **S6 — Paragraph [7], actions:** page 8 leads; anonymous reconstruction sits beneath the actual legal text and does not obscure it.
7. **S7 — Paragraph [7], condition and conclusion:** cutouts leave; the authentic money-for-release clause and legal conclusion hold alone.

The plan intentionally contains zero diagram assets, zero map assets, zero icons, zero blocks, and zero code-drawn requirement. That is an editorial result, not a quota.