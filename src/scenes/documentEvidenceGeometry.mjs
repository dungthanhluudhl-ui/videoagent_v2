/** Pure safe-fit geometry for authentic cited evidence. No React or Remotion. */
export const fitDocumentEvidence = ({
  viewportWidth,
  viewportHeight,
  sourceAspect,
  region,
  requestedZoom = 1,
  safetyMargin = 18,
  allowCrop = false,
}) => {
  const pageWidth = Math.min(viewportWidth, viewportHeight * sourceAspect);
  const pageHeight = pageWidth / sourceAspect;
  const rx = region.x;
  const ry = region.y;
  const rw = region.width;
  const rh = region.height;
  const usableWidth = Math.max(1, viewportWidth - safetyMargin * 2);
  const usableHeight = Math.max(1, viewportHeight - safetyMargin * 2);
  const safeScale = Math.min(
    usableWidth / Math.max(rw * pageWidth, 0.001),
    usableHeight / Math.max(rh * pageHeight, 0.001)
  );
  const scale = allowCrop ? safeScale * requestedZoom : safeScale * Math.min(requestedZoom, 1);
  const shownWidth = pageWidth * scale;
  const shownHeight = pageHeight * scale;
  const focusWidth = rw * shownWidth;
  const focusHeight = rh * shownHeight;
  const focusLeft = allowCrop
    ? viewportWidth / 2 - focusWidth / 2
    : Math.min(viewportWidth - safetyMargin - focusWidth,
        Math.max(safetyMargin, viewportWidth / 2 - focusWidth / 2));
  const focusTop = allowCrop
    ? viewportHeight / 2 - focusHeight / 2
    : Math.min(viewportHeight - safetyMargin - focusHeight,
        Math.max(safetyMargin, viewportHeight / 2 - focusHeight / 2));
  const pageLeft = focusLeft - rx * shownWidth;
  const pageTop = focusTop - ry * shownHeight;
  return {pageWidth, pageHeight, scale, shownWidth, shownHeight, pageLeft, pageTop,
    focusLeft, focusTop, focusWidth, focusHeight, safetyMargin};
};