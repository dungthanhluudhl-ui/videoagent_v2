import assert from "node:assert/strict";
import {fitDocumentEvidence} from "./documentEvidenceGeometry.mjs";

const inside = (g, width, height, margin) =>
  g.focusLeft >= margin - 1e-6 &&
  g.focusTop >= margin - 1e-6 &&
  g.focusLeft + g.focusWidth <= width - margin + 1e-6 &&
  g.focusTop + g.focusHeight <= height - margin + 1e-6;

// Exact V17 S4 call: the surrounding wide page may bleed, but its cited band may not.
const v17s4 = fitDocumentEvidence({
  viewportWidth: 1000,
  viewportHeight: 650,
  sourceAspect: 2118 / 966,
  region: {x: 0.04, y: 0.2, width: 0.92, height: 0.58},
  requestedZoom: 1.72,
  safetyMargin: 18,
  allowCrop: true,
});
assert.ok(inside(v17s4, 1000, 650, 18), "V17 S4 cited lines must fit the readable area");
assert.ok(v17s4.shownWidth > 1000, "V17 S4 may still bleed the surrounding page");

// A tall page with an edge citation exercises the non-crop path and real raster aspect.
const tallEdge = fitDocumentEvidence({
  viewportWidth: 920,
  viewportHeight: 1080,
  sourceAspect: 1412 / 1328,
  region: {x: 0.62, y: 0.04, width: 0.36, height: 0.42},
  requestedZoom: 2.4,
  safetyMargin: 24,
  allowCrop: false,
});
assert.ok(inside(tallEdge, 920, 1080, 24), "edge citation must fit the readable area");
assert.ok(tallEdge.pageLeft >= 24 - 1e-6 && tallEdge.pageTop >= 24 - 1e-6,
  "non-crop documents keep the surrounding page inside the safe area");

console.log("DocumentEvidence geometry PASS");