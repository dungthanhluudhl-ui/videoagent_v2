# ÁN LỆ 64 MVP — MANUAL V3 IMAGE HANDOFF

## What to open

Open this exact prompt pack:

`D:\VideoAgent 2\input\prompts14.txt`

It contains **3 lines = 3 manual generations**. Each line is the exact output of V3 `generate_board.py` in default PLAN-ONLY mode.

Save/copy every returned file into:

`D:\VideoAgent 2\input\anle64input\mvp\generated\`

## Generation mapping

### GEN-01 — FULL-BLEED (single cell)

- Prompt: line 1
- Scene usage: S1, S2
- Purpose: anonymous warehouse atmosphere/reconstruction plate
- Return: **raw single image**
- Required filename: `anle64_warehouse_vertical.png`
- Expected full path: `D:\VideoAgent 2\input\anle64input\mvp\generated\anle64_warehouse_vertical.png`

### GEN-02 — CONSISTENT SUBJECT (2-cell BOARD)

- Prompt: line 2
- Scene usage: S1, S2, S3, S4, S6
- Purpose: one anonymous subject with consistent clothing/proportions in two supported actions
- Return: **raw whole board — DO NOT manually crop**
- Required board filename: `_board_anle64_victim_restrained_seated.png`
- Expected full path: `D:\VideoAgent 2\input\anle64input\mvp\generated\_board_anle64_victim_restrained_seated.png`
- Cells in exact V3 reading order, left to right:
  1. `anle64_victim_restrained_seated`
  2. `anle64_victim_phone_under_duress`
- M2B will use V3 `crop-file` to produce:
  - `anle64_victim_restrained_seated.png`
  - `anle64_victim_phone_under_duress.png`

### GEN-03 — BOARD (2 cells)

- Prompt: line 3
- Scene usage: S1, S4, S6
- Purpose: coordinated small evidence props batched into one generation
- Return: **raw whole board — DO NOT manually crop**
- Required board filename: `_board_anle64_handcuffs.png`
- Expected full path: `D:\VideoAgent 2\input\anle64input\mvp\generated\_board_anle64_handcuffs.png`
- Cells in exact V3 reading order, left to right:
  1. `anle64_handcuffs`
  2. `anle64_restraint_rope`
- M2B will use V3 `crop-file` to produce:
  - `anle64_handcuffs.png`
  - `anle64_restraint_rope.png`

## Return checklist

- [ ] `anle64_warehouse_vertical.png`
- [ ] `_board_anle64_victim_restrained_seated.png` — whole board, uncropped
- [ ] `_board_anle64_handcuffs.png` — whole board, uncropped

TOTAL USER GENERATIONS REQUIRED: **3**

Do not create any extra variants unless requested after M2B review. The official PDF supplies all document imagery; Remotion supplies typography and focus/highlight treatment.