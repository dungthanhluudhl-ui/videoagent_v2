/**
 * MapGraphic - a real, rendered map for scenes about a PLACE.
 *
 * Replaces the pattern that produced the worst scenes in V10: narration named
 * a location ("tại Itaewon, Hàn Quốc", "khu vực rộng 1,37 km2 ở quận
 * Yongsan") and the screen showed a floating orange dot on blank paper, with
 * the entire middle and lower frame empty. A pin with nothing to pin it to
 * isn't a map - it's a label.
 *
 * Built on MapLibre GL per .agents/skills/remotion-maps/techniques/maplibre/
 * TECHNIQUE.md, which is already installed in this project and had never been
 * used. MapLibre needs no API key and no account, so this adds no per-video
 * cost or credential setup.
 *
 * Deliberate constraints taken from that technique doc:
 *   - `interactive: false`, `fadeDuration: 0` and `preserveDrawingBuffer`
 *     keep rendering deterministic frame to frame.
 *   - delayRender/continueRender wrap loading so Remotion never captures a
 *     half-drawn map.
 *   - The camera is held STILL by default. The doc warns that a live
 *     per-frame camera shimmers on raster tiles; motion here comes from the
 *     pin, the label and the reveal ring instead, which is also the calmer
 *     documentary look this project wants. Pass `zoomTo` only after checking
 *     a real render.
 *   - No `mapInstance.remove()` cleanup - it interferes with the render
 *     lifecycle.
 */

import { useEffect, useRef, useState } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  staticFile,
  useDelayRender,
  useVideoConfig,
} from "remotion";
// NAMED import, not default. remotion-maps/techniques/maplibre/TECHNIQUE.md
// shows `import maplibregl from 'maplibre-gl'`, which was right for v4/v5 but
// throws "Cannot read properties of undefined (reading 'Map')" on the v6
// installed here - v6 ships ESM with named exports and NO default export
// (verified against node_modules/maplibre-gl/dist/maplibre-gl.mjs, which
// exports `xp as Map`). Same lesson as the @remotion/sfx doc mismatch already
// recorded in this skill: check the installed package, not the doc.
import { Map as MapLibreMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { BG, INK, ORANGE, fontFamily } from "./shared";

// Free, key-less raster style, fetched live. Prefer LOCAL_RASTER_STYLE below
// for anything that gets rendered more than once.
//
// The source is CARTO Positron, NOT tile.openstreetmap.org: that host answers
// automated requests with a "403 Access blocked" notice image served under
// HTTP 200, so a render silently fills the frame with warning graphics
// instead of a map. Positron is also already pale grayscale, which is why
// raster-saturation below only has to do a little work.
export const OSM_RASTER_STYLE = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors © CARTO",
    },
  },
  // Desaturation lives on the raster layer, NOT as a CSS filter on the
  // container: a container filter also strips the colour from the orange
  // area highlight and pin drawn on top, which is exactly what happened on
  // the first render (the 1,37 km² circle came out grey and invisible).
  layers: [{
    id: "osm",
    type: "raster",
    source: "osm",
    // Positron ("light_all") was the first choice and rendered as an almost
    // blank page: at z13-16 it draws so little that the frame was a pale
    // rectangle with a pin on it - the exact "a label, not a map" defect
    // MapGraphic exists to replace. Voyager carries streets, blocks and
    // labels, so -0.75 saturation keeps it monochrome without erasing the
    // detail that makes it read as a real place.
    // Contrast raised 0.2 -> 0.5 and the white point pulled down after a
    // second look at a full-size still: Voyager desaturated to -0.75 renders
    // as a very pale page, and on the review contact sheet three map scenes
    // read as BLANK. They were not blank - streets, blocks and the Han river
    // were all there, three shades away from the paper behind them. A map has
    // to survive being glanced at on a phone, not just being correct.
    // `raster-contrast` pushes values AWAY from mid-grey. On a style that is
    // already mostly near-white that blows the background out to pure white
    // and erases the streets - raising it from 0.2 to 0.5 made the map more
    // blank, not less (verified on a full-size still, not reasoned about).
    // What darkens a pale raster is the white point: `raster-brightness-max`.
    paint: {
      "raster-saturation": -0.72,
      "raster-contrast": 0.2,
      "raster-brightness-max": 0.78,
    },
  }],
};

// Tiles served from `public/map_tiles`, pre-fetched by
// `scripts/cache_map_tiles.py`. Prefer this for anything that will be
// rendered more than once: OSM_RASTER_STYLE hits the network on every single
// render, and because MapGraphic deliberately releases its delayRender handle
// on a deadline rather than hanging, a dropped tile produces a SUCCESSFUL
// render with a grey hole in the map - a failure no gate can see.
//
// The value below is a sentinel prefix. It never reaches the network:
// `transformRequest` rewrites it through staticFile() once MapLibre has
// substituted z/x/y.
//
// A plain root-relative "/map_tiles/{z}/{x}/{y}.png" does NOT work - verified,
// every tile 404'd during a render - because Remotion does not mount `public/`
// at the site root. And staticFile() cannot be used in the `tiles` template
// directly either, since it percent-encodes the `{z}/{x}/{y}` placeholders
// MapLibre still has to fill in. Rewriting per-request is what satisfies both.
const LOCAL_TILE_PREFIX = "local-tiles://";

export const LOCAL_RASTER_STYLE = {
  ...OSM_RASTER_STYLE,
  sources: {
    osm: {
      ...OSM_RASTER_STYLE.sources.osm,
      tiles: [`${LOCAL_TILE_PREFIX}{z}/{x}/{y}.png`],
    },
  },
};

const transformRequest = (url, resourceType) => {
  if (url.startsWith(LOCAL_TILE_PREFIX)) {
    return { url: staticFile(`map_tiles/${url.slice(LOCAL_TILE_PREFIX.length)}`) };
  }
  return { url, resourceType };
};

// Ground resolution at a given zoom/latitude, in metres per CSS pixel. With a
// deliberately STATIC camera this is exact, which is why the area footprint is
// drawn as an SVG overlay rather than a MapLibre GeoJSON layer: the layer
// version depended on the `load`/`idle` event ordering and silently never
// painted (tiles and pin rendered fine, the circle was simply absent from
// every frame). An overlay has no event dependency at all.
const metresPerPixel = (lat, zoom) =>
  (156543.03392 * Math.cos((lat * Math.PI) / 180)) / Math.pow(2, zoom);

/**
 * @param center  [longitude, latitude] - MapLibre order, NOT lat/lng
 * @param label   place name shown in the pin badge
 * @param areaKm2 optional footprint circle, in km², drawn around `center`
 */
export const MapGraphic = ({
  center,
  zoom = 14,
  label,
  sublabel,
  areaKm2,
  delay = 0,
  pinDelay = 12,
  tint = 0.28,
  style = OSM_RASTER_STYLE,
}) => {
  const containerRef = useRef(null);
  const { delayRender, continueRender } = useDelayRender();
  const { width, height } = useVideoConfig();
  // Tiles come off the network, so the default 28s budget is too tight for a
  // cold cache on a long render.
  const [handle] = useState(() =>
    delayRender("MapGraphic: loading tiles", { timeoutInMilliseconds: 120000 }));
  const frame = useCurrentFrame();

  useEffect(() => {
    if (!containerRef.current) return;

    // The render must never hang on a map. `idle` is the ideal signal but it
    // can fail to arrive in a headless context (a dropped tile, a WebGL
    // hiccup); without a guard that turns into a hard render failure with a
    // delayRender timeout, which is exactly what happened on the first run.
    // So: release on `idle`, on `error`, or on a deadline - whichever is
    // first - and only ever release once.
    let released = false;
    const release = () => {
      if (released) return;
      released = true;
      continueRender(handle);
    };
    const deadline = setTimeout(release, 20000);

    const map = new MapLibreMap({
      container: containerRef.current,
      style,
      center,
      zoom,
      interactive: false,
      attributionControl: false,
      transformRequest,
      fadeDuration: 0,
      canvasContextAttributes: { preserveDrawingBuffer: true },
    });

    map.on("load", () => {
      map.jumpTo({ center, zoom });
      map.once("idle", release);
    });
    map.on("error", (e) => {
      // Surface the reason but keep rendering - a map that fails to tile
      // should degrade to the tinted plate + pin, not kill the whole video.
      // eslint-disable-next-line no-console
      console.warn("[MapGraphic] maplibre error:", e?.error?.message || e);
      release();
    });

    return () => clearTimeout(deadline);
    // No map.remove() on purpose - see the header note.
  }, [continueRender, handle, center, zoom, style]);

  const local = frame - delay;
  const mapOpacity = interpolate(local, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const pinLocal = frame - delay - pinDelay;
  const pinScale = interpolate(pinLocal, [0, 14], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.spring({ damping: 10, stiffness: 170 }),
    output: "perceptual-scale",
  });
  const areaRadiusPx = areaKm2
    ? (Math.sqrt(areaKm2 / Math.PI) * 1000) / metresPerPixel(center[1], zoom)
    : 0;
  const areaReveal = interpolate(local, [8, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });
  const ring = Math.max(0, pinLocal) % 34;
  const ringScale = interpolate(ring, [0, 34], [1, 3.2], { extrapolateRight: "clamp" });
  const ringOpacity = interpolate(ring, [0, 34], [0.75, 0], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill name="MapGraphic" style={{ backgroundColor: BG, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: mapOpacity,
        }}
      >
        <div ref={containerRef} style={{ width, height, position: "absolute" }} />
      </div>

      {/* Palette tie-in so a map scene still belongs to this video. */}
      <AbsoluteFill style={{ backgroundColor: `rgba(231,227,217,${tint})`, pointerEvents: "none" }} />

      {areaKm2 && (
        <svg width={width} height={height} style={{ position: "absolute", inset: 0 }}>
          <circle
            cx={width / 2}
            cy={height / 2}
            r={areaRadiusPx * areaReveal}
            fill={ORANGE}
            fillOpacity={0.22 * areaReveal}
            stroke={ORANGE}
            strokeWidth={6}
            strokeOpacity={0.95 * areaReveal}
          />
        </svg>
      )}

      {label && (
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            translate: "-50% -100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            scale: pinScale,
          }}
        >
          <div
            style={{
              backgroundColor: INK,
              color: ORANGE,
              fontFamily,
              fontWeight: 900,
              fontSize: 34,
              padding: "10px 26px",
              borderRadius: 26,
              border: `3px solid ${ORANGE}`,
              whiteSpace: "nowrap",
              boxShadow: "0 10px 28px rgba(0,0,0,0.35)",
            }}
          >
            📍 {label}
          </div>
          {sublabel && (
            <div
              style={{
                marginTop: 8,
                backgroundColor: "rgba(20,20,20,0.82)",
                color: BG,
                fontFamily,
                fontWeight: 700,
                fontSize: 26,
                padding: "6px 18px",
                borderRadius: 16,
                whiteSpace: "nowrap",
              }}
            >
              {sublabel}
            </div>
          )}
          <div style={{ position: "relative", marginTop: 10, width: 30, height: 30,
                        display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ position: "absolute", width: 30, height: 30, borderRadius: "50%",
                          border: `3px solid ${ORANGE}`, scale: ringScale, opacity: ringOpacity }} />
            <div style={{ width: 18, height: 18, borderRadius: "50%", backgroundColor: ORANGE,
                          boxShadow: `0 0 16px ${ORANGE}` }} />
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};
