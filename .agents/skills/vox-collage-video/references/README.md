# References

`animation-variants.md` — entrance-animation catalogue, still accurate.

There used to be an `example-scene.jsx` template here (single file per
video). It was removed: this project moved to a multi-file pattern
(`src/scenes/shared.jsx` + one file per scene + a `TransitionSeries`
master timeline, per SKILL.md steps 6-7), and a separate synthetic
example drifted out of sync with that real, working code more than once.

**For the next video, copy patterns straight from the current project's
`src/scenes/shared.jsx` and `src/scenes/Scene*.jsx`** — they're proven
and always up to date, since they're the actual shipped code, not a
parallel doc that has to be remembered and kept in sync by hand.
