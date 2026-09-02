import {Children, cloneElement, isValidElement, useEffect, useRef, useState} from "react";
import {continueRender, delayRender} from "remotion";
import {CAPTION_TOP} from "./Captions";

export const LAYOUT_SAFETY_VERSION = "rendered-dom-geometry-v1";

const visible = (element) => {
  const style = getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  return style.display !== "none" && style.visibility !== "hidden" && Number(style.opacity) > 0.02 && rect.width > 0 && rect.height > 0;
};

const intersects = (a, b) => Math.min(a.right, b.right) - Math.max(a.left, b.left) > 4 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 4;

export const inspectRenderedLayout = (root, captionTop = CAPTION_TOP) => {
  let canvas = root.getBoundingClientRect();
  let ancestor = root.parentElement;
  while ((canvas.width <= 0 || canvas.height <= 0) && ancestor) {
    canvas = ancestor.getBoundingClientRect();
    ancestor = ancestor.parentElement;
  }
  if (canvas.width <= 0 || canvas.height <= 0) return ["rendered composition canvas has no measurable geometry"];
  const captionBoundary = canvas.top + captionTop * (canvas.height / 1920);
  const text = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    const value = String(node.nodeValue || "").trim();
    const parent = node.parentElement;
    if (!value || !parent || parent.closest("[data-videoagent-caption='true']") || !visible(parent)) continue;
    const range = document.createRange();
    range.selectNodeContents(node);
    const rect = range.getBoundingClientRect();
    const style = getComputedStyle(parent);
    if (rect.width <= 0 || rect.height <= 0 || Number.parseFloat(style.fontSize) < 24) continue;
    text.push({node: parent, value, rect, important: Number.parseFloat(style.fontSize) >= 32 || Number.parseInt(style.fontWeight, 10) >= 700 || style.fontWeight === "bold"});
  }
  const problems = [];
  for (const item of text) {
    const rect = item.rect;
    if (rect.left < canvas.left - 0.5 || rect.top < canvas.top - 0.5 || rect.right > canvas.right + 0.5 || rect.bottom > canvas.bottom + 0.5) problems.push(`visible text outside canvas: ${item.value}`);
    if (rect.bottom > captionBoundary) problems.push(`visible text enters caption exclusion region: ${item.value}`);
  }
  for (let i = 0; i < text.length; i++) for (let j = i + 1; j < text.length; j++) {
    const a = text[i], b = text[j];
    if (!a.important || !b.important || a.node === b.node || a.node.contains(b.node) || b.node.contains(a.node)) continue;
    if (intersects(a.rect, b.rect)) problems.push(`important text collision: ${a.value} <> ${b.value}`);
  }
  for (const block of root.querySelectorAll("[data-videoagent-content-block='true']")) {
    if (visible(block) && block.getBoundingClientRect().bottom > captionBoundary) problems.push("canonical content block enters caption exclusion region");
  }
  return [...new Set(problems)];
};

export const LayoutSafety = ({children, captionTop = CAPTION_TOP}) => {
  const [handle] = useState(() => delayRender("rendered layout safety"));
  const rootRef = useRef(null);
  useEffect(() => {
    const request = requestAnimationFrame(() => {
      const root = rootRef.current;
      const problems = root ? inspectRenderedLayout(root, captionTop) : ["layout root missing"];
      continueRender(handle);
      if (problems.length) throw new Error(`VIDEOAGENT_LAYOUT: ${problems.join(" | ")}`);
    });
    return () => cancelAnimationFrame(request);
  }, [captionTop, handle]);
  return <div ref={rootRef} data-videoagent-layout-root="true" style={{position: "absolute", inset: 0}}>{Children.map(children, (child) => isValidElement(child) ? cloneElement(child) : child)}</div>;
};