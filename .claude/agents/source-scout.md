---
name: source-scout
description: Compatibility pointer to the external Gemini/Pexels ASSET LOCK worker.
---

# SOURCE SCOUT

This retained compatibility descriptor is not an executable Claude/Codex child-agent
requirement. Source Scout means the **external Gemini API worker**. Follow the complete
canonical contract at
`.claude/skills/vox-collage-video/references/pexels-source-worker.md`.

Accept exactly one compact need packet at most 2,048 bytes. Reject a whole transcript/PLAN,
unrelated context, history, or a secret. Use only Pexels PHOTO through
`fetch_pexels.py scout`: at most eight previews per search, one optional refinement,
and zero to three shortlist originals. Gemini receives each thumbnail directly from
disk and returns only compact semantic judgments.

Write only below `input/.videoagent/V<N>/candidates/<needId>/`.
Never write `src/`, `input/V<N>/`, or `public/V<N>/`; never plan, change treatment, implement JSX, select
or lock the final asset, accept an asset, run PREVIS/review, or clean up. The main agent
owns final selection and all later video-quality decisions.