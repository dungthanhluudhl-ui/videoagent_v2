# **SKILL VOX-STYLE VIDEO**

*Mà mình dùng trong video*  
\---  
name: vox-collage-video  
description: Build a Vox-style paper-collage documentary short in this Remotion project from just an audio file \+ script — no further style questions needed. Use this whenever the user hands over a voiceover/narration audio file (mp3/wav) plus its script and asks for a video, or says things like "make me a video from this audio", "dựng video từ audio này", "same style as before", "another Vox-style clip", or references a prior collage/cutout/paper-texture video in this project. Covers the full pipeline end to end: Whisper transcription, scene segmentation, sourcing and background-removing stock photos from Pexels, generating a varied SFX set, building the Remotion scene with a wide, non-repeating palette of entrance animations, registering it in Root.jsx, and previewing it live in Remotion Studio (no MP4 render needed unless the user asks for one).  
\---  
   
\# Vox-collage video pipeline  
   
This skill captures a full working pipeline, refined over several rounds of  
feedback while building \`src/NokiaCollapse.jsx\` in this project (a hook clip  
about Nokia's 2007-2013 collapse). That file is a complete worked example —  
open it any time you want to see every technique below actually applied.  
\`references/example-scene.jsx\` is the same thing genericized into a  
copy-and-rename template.  
   
The visual target is the "Vox explainer" collage look: real stock photos  
with backgrounds removed, a thin white paper-sticker edge around each  
cutout, several of them layered on a graph-paper/kraft background, bold  
highlighter-yellow text chips, and everything animated with a handmade,  
slightly-off-kilter energy rather than smooth corporate motion graphics.  
   
Work through the steps below in order. Nothing here requires asking the  
user about visual style — that's already decided. The only things worth  
asking about are per-video specifics: is the target 16:9 or 9:16, and (if  
Pexels genuinely has nothing usable) what image to use for a subject that  
has no obvious stock-photo equivalent.  
   
\#\# 0\. Before you start  
   
Confirm you're in a Remotion project with the conventions this pipeline  
assumes: JSX scene files under \`src/\`, each exporting a component plus  
\`SOMETHING\_CANVAS\` and \`SOMETHING\_TOTAL\_FRAMES\`, registered in \`src/Root.jsx\`  
via \`\<Composition\>\`. If the project doesn't look like this, check  
\`src/Root.jsx\` and an existing scene file to learn its actual conventions  
before deviating from what's described here.  
   
Check whether \`rembg\`, \`scipy\`, and \`whisper\` are already installed  
(\`python3 \-c "import rembg, scipy, whisper"\`) — if any are missing,  
\`pip3 install rembg onnxruntime scipy openai-whisper\`. All of this runs  
locally; nothing here needs an API key or a paid service.  
   
\#\# 1\. Transcribe the audio  
   
Copy the provided audio file into \`public/\` under a short name (e.g.  
\`audio.mp3\`). Then transcribe it with Whisper for word-level timestamps —  
these timestamps are what everything else in this pipeline (scene cuts,  
punch-phrase timing, SFX cues) gets synced to, so get this right first:  
   
\`\`\`python  
import whisper, json  
model \= whisper.load\_model("base")  
result \= model.transcribe("public/audio.mp3", word\_timestamps=True, language="en")  
\`\`\`  
   
Print each segment's \`start\`/\`end\`/\`text\` and the flattened word list. Merge  
any standalone \`"%"\` token into the word before it (Whisper often splits  
"40%" into "40" \+ "%").  
   
\#\# 2\. Segment the script into scenes  
   
Use Whisper's own segment boundaries as scene boundaries — they already  
follow natural breath/sentence groups, which reads far better than  
mechanically splitting by a fixed duration. A \~15s hook typically wants  
around 4 scenes; longer scripts want proportionally more, but don't force a  
minimum or maximum — let the sentences decide.  
   
For each scene, decide:  
\- \*\*tag\*\* — one short persistent word or number (a year, a stat, a "?")  
  shown the whole scene as a highlighter chip.  
\- \*\*punch phrase\*\* — ONE short catchy highlight tied to a specific word in  
  that sentence, not a running caption. Pick the word it should appear on,  
  and compute \`appearAt\` as the LOCAL frame (relative to that scene's own  
  start): \`round(word.start \* 30\) \- sceneStartFrame\`. This is the single  
  biggest style decision earlier drafts got wrong before user feedback: a  
  word-by-word subtitle bar across the bottom reads as "basic" — the Vox  
  look uses isolated, perfectly-timed pull-quotes instead.  
\- \*\*hero image\*\* — the single most visually central subject of the  
  sentence (a phone, a handshake, a shocked face).  
\- \*\*2-4 support elements\*\* — smaller cutouts that reinforce the sentence's  
  specific content, not generic decoration. "Global market share" earns a  
  globe \+ a bar chart; "what analysts missed" earns a magnifying glass \+ a  
  report page. Think about what a human editor would actually reach for.  
\- \*\*variant\*\* — see step 6; make sure no two consecutive scenes reuse the  
  same one.  
\#\# 3\. Source the photos  
   
For every hero and support element, search Pexels through the browser  
rather than its API (no key needed): navigate to  
\`https://www.pexels.com/search/\<url-encoded query\>/\`, then \`read\_page\` on  
the results — the direct \`images.pexels.com/.../pexels-photo-....jpeg?...\`  
download URLs are right there in the page's link hrefs. \`curl\` them  
straight into \`public/\`.  
   
\*\*Picking which result to use matters more than it looks.\*\* rembg (the  
background remover in the next step) works by guessing what's foreground vs  
background — it does great on a subject shot against a plain color backdrop  
or an outdoor scene, and does \*badly\* on a subject sitting on white paper or  
among other white objects, because it can't tell where the subject ends and  
the "background" paper begins. In one pass, a magnifying-glass-on-documents  
photo lost almost everything except a random scrap, while a nearly-identical  
magnifying-glass-on-a-plain-blue-background photo cut out perfectly. When a  
query returns both kinds, prefer the plain-backdrop or clearly-separated-  
subject version even if the paper/document one looks more "on theme" —  
you can always re-crop it tight afterward and it'll read fine.  
   
Also grab one paper-texture photo for the background (search something like  
"white paper texture subtle background") — a real photo here, tinted, reads  
far more tactile than a flat CSS color, and only needs fetching once per  
video since the same file underlies every scene.  
   
If a search genuinely turns up nothing usable, generate an image via Google  
Flow in the browser instead of stopping to ask. Only ask the user to supply  
an image themselves as a last resort, when neither source works.  
   
\#\# 4\. Turn photos into cutouts  
   
Run every downloaded photo through the bundled script:  
   
\`\`\`bash  
python3 .claude/skills/vox-collage-video/scripts/process\_cutout.py \\  
  public/raw\_phone.jpg public/el\_phone.png \\  
  public/raw\_globe.jpg public/el\_globe.png \\  
  ...  
\`\`\`  
   
This removes the background, drops any stray disconnected mask fragments  
rembg left behind (a shadow, a reflection it misjudged as foreground), adds  
the thin white paper-sticker edge, and — the step that matters most —  
crops tightly to the actual content with a small margin. Skip that crop and  
a subject with 80% empty transparent padding around it (extremely common  
straight out of rembg) will look small no matter how big you make its  
layout box later; the script prints a warning if a result still looks  
sparse after cropping so you can sanity-check it.  
   
\*\*Look at a few of the outputs before moving on\*\* — composite one or two  
over a solid color (e.g. with PIL: \`Image.new("RGBA", im.size, (40,60,90,255))\`  
then \`alpha\_composite\`) and view the result. Catching a bad cutout here is  
much cheaper than discovering it after the whole scene is wired up.  
   
\#\# 5\. Generate SFX  
   
\`\`\`bash  
python3 .claude/skills/vox-collage-video/scripts/generate\_sfx.py public/sfx  
\`\`\`  
   
This synthesizes eleven short one-shots locally — whoosh, pop, coin, thud,  
boing, swipe, click, riser, drop, shatter, paper — see the script's  
docstring for what each is for and which animation variant it pairs with  
naturally. Wire them in via the \`Sfx\` helper in the reference scene, placed  
at the actual beat each sound belongs to (a scene's hero entrance frame,  
its title-tag pop at frame 6, its punch-phrase's \`appearAt\`, each support  
element's \`delay\`) rather than bunching everything at frame 0\. Keep the  
volumes quiet (0.3-0.55) — they're texture under the narration, not  
competing with it.  
   
Treat the pairings as a starting point, not a rule: a video where every  
scene plays the same 2-3 sounds feels as flat as one that reuses the same  
animation everywhere. Deliberately spread the set across a video's scenes,  
and if a scene's content calls for something none of these eleven evoke,  
extend the script with another small numpy-synthesized one-shot rather  
than reaching for an external sample library.  
   
\#\# 6\. Build the scene  
   
Copy \`references/example-scene.jsx\` to \`src/\<VideoName\>.jsx\`, rename the  
component and the two exported constants, and fill in \`SEGMENTS\` with the  
real content from steps 2-5. The file's comments explain what each piece is  
for; the short version:  
   
\- \*\*GridBackground\*\* — real paper photo \+ tint \+ SVG grid \+ two soft color  
  splash blobs (color varies per scene) \+ halftone dot clusters. Reused  
  identically across scenes.  
\- \*\*TitleTag\*\* — the persistent highlighter chip, entrance keyed to  
  \`variant\` so it lands in step with the hero image.  
\- \*\*PunchPhrase\*\* — the one highlight per scene (see step 2 — do not turn  
  this back into a caption bar).  
\- \*\*Cutout\*\* — the hero image, box roughly 1300-1350px wide in the  
  1920x1080 canvas. Give each scene a genuinely different entrance and never  
  let two consecutive scenes share one. \`rise\`/\`grow\`/\`punch\`/\`flip\` are  
  coded in the example scene; \`references/animation-variants.md\` has several  
  more (shatter, peel, unfold, spiral, wobble-drop, zoom-through) with  
  implementation notes and their natural SFX pairing — read it before  
  defaulting back to the same four every time, especially on a video with  
  more than 4 scenes. Inventing a new one that fits the sentence's specific  
  verb beats picking from any fixed menu. After the entrance settles, a  
  small continuous idle bob/sway/breathe keeps it from reading as a frozen  
  photo for the rest of the scene.  
\- \*\*SupportElement\*\* — the 2-4 secondary cutouts, staggered \`delay\` so they  
  visibly pop in one after another, each with its own idle-motion phase  
  offset so multiple pieces never bob in sync.  
Keep the whole thing at 1920x1080/30fps unless the user specifies a  
different aspect ratio.  
   
\#\# 7\. Register and preview  
   
Add the import \+ \`\<Composition\>\` block to \`src/Root.jsx\`, matching the  
exact pattern the other scenes there already use.  
   
Verify the scene by opening it in Remotion Studio (\`preview\_start\` with the  
project's \`remotion\` launch config, then navigate to  
\`http://localhost:\<port\>/\<CompositionId\>\`) and scrubbing through each  
scene's timeline with screenshots. There's no need to render an MP4 — the  
Studio preview plays the composition (including audio and every \`\<Sequence\>\`  
of SFX) directly, and that live view is the deliverable unless the user  
specifically asks for an exported file.  
   
If the Studio browser tab ever gets stuck or stops responding to  
scrub/click input — this has been observed to happen after a hot-reload  
error repaints a stale error state — a full restart (\`preview\_stop\` then  
\`preview\_start\` again, followed by re-navigating to the composition URL) is  
the reliable fix; refreshing the tab alone isn't always enough. Only fall  
back to \`npx remotion render \<CompositionId\> out/\<name\>.mp4 \--overwrite\` \+  
pulling a frame with \`ffmpeg \-ss \<seconds\> \-i out/\<name\>.mp4 \-frames:v 1  
\-update 1 /tmp/check.jpg\` as a last-resort sanity check if Studio truly  
won't cooperate after a restart, or if the user asks for a rendered file.  
   
\#\# Things earlier attempts got wrong (so you don't repeat them)  
   
\- A rectangular torn-paper-edge "photo card" is NOT the Vox look — the  
  background has to actually be removed so the subject's own silhouette  
  shows, not a rectangle containing the subject.  
\- A word-by-word caption bar across the bottom reads as generic/basic.  
  Use the persistent tag \+ single timed punch-phrase pattern instead.  
\- Reusing one entrance animation for every scene reads as flat. Vary it  
  scene to scene on purpose.  
\- A cutout that's static after its entrance finishes looks frozen/dead —  
  always layer continuous low-amplitude idle motion under whatever the  
  scene's specific animation is doing.  
\- Elements can look small even in a generously-sized layout box if the  
  source PNG itself has a lot of empty transparent padding — always crop to  
  content bounds (step 4 handles this automatically, but double-check on  
  anything that looks off).  
\- rembg does badly on subjects photographed against white paper/documents —  
  route around this at the sourcing stage (step 3\) rather than fighting it  
  after the fact.  
\- A video where every scene uses the same 1-2 SFX sounds as flat as one  
  that reuses the same entrance animation everywhere — spread the full SFX  
  set across a video's scenes the same way you vary the animation variants.  
\- Don't reach for a full MP4 render as the default way to check a scene —  
  the Remotion Studio preview already plays audio \+ SFX \+ every animation  
  live, and rendering is slower per iteration. Only render when Studio is  
  genuinely stuck after a restart, or the user wants an exported file.  
