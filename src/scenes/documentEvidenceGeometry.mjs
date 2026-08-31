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
  const regionSafeScale = Math.min(
    usableWidth / Math.max(rw * pageWidth, 0.001),
    usableHeight / Math.max(rh * pageHeight, 0.001)
  );
  const pageSafeScale = Math.min(usableWidth / pageWidth, usableHeight / pageHeight);
  // requestedZoom may crop the surrounding page, never the cited region itself.
  const desiredScale = pageSafeScale * Math.max(0.001, requestedZoom);
  const scale = allowCrop
    ? Math.min(desiredScale, regionSafeScale)
    : pageSafeScale * Math.min(Math.max(0.001, requestedZoom), 1);
  const shownWidth = pageWidth * scale;
  const shownHeight = pageHeight * scale;
  const focusWidth = rw * shownWidth;
  const focusHeight = rh * shownHeight;
  const centeredFocusLeft = Math.min(viewportWidth - safetyMargin - focusWidth,
    Math.max(safetyMargin, viewportWidth / 2 - focusWidth / 2));
  const centeredFocusTop = Math.min(viewportHeight - safetyMargin - focusHeight,
    Math.max(safetyMargin, viewportHeight / 2 - focusHeight / 2));
  const pageLeft = allowCrop ? centeredFocusLeft - rx * shownWidth : (viewportWidth - shownWidth) / 2;
  const pageTop = allowCrop ? centeredFocusTop - ry * shownHeight : (viewportHeight - shownHeight) / 2;
  const focusLeft = allowCrop ? centeredFocusLeft : pageLeft + rx * shownWidth;
  const focusTop = allowCrop ? centeredFocusTop : pageTop + ry * shownHeight;
  return {pageWidth, pageHeight, scale, shownWidth, shownHeight, pageLeft, pageTop,
    focusLeft, focusTop, focusWidth, focusHeight, safetyMargin};
};