import type { SceneId } from "@/types";
import { scatter } from "./window-view";

/*
 * Per-theme light effects inside the room (not the view outside). Each slot
 * is drawn at a different depth in StudyScene, and each cross-fades on its
 * own when the theme changes.
 */

const SHADOW_STREAKS = scatter(26, 17);

/** Shared gradients for the effects below (rendered once in StudyScene's <defs>). */
export function SceneFxDefs() {
  return (
    <>
      <linearGradient id="sunbeam" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#FFF1C9" stopOpacity="0.32" />
        <stop offset="0.7" stopColor="#FFE7AE" stopOpacity="0.12" />
        <stop offset="1" stopColor="#FFE7AE" stopOpacity="0.04" />
      </linearGradient>
      <radialGradient id="fire-glow" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#FF9445" stopOpacity="0.36" />
        <stop offset="0.45" stopColor="#FF8A3D" stopOpacity="0.14" />
        <stop offset="1" stopColor="#FF8A3D" stopOpacity="0" />
      </radialGradient>
    </>
  );
}

/** On the wall, in front of the window but behind the curtains and desk. */
export function WallFx({ scene }: { scene: SceneId }) {
  if (scene === "rainy") {
    // Street light through the rainy window: cool patch with drifting rain shadows
    return (
      <g clipPath="url(#under-sill)">
        <rect x="186" y="322" width="348" height="62" fill="#B8C8E6" opacity="0.1" />
        {SHADOW_STREAKS.map(([a, b, c], i) => (
          <line
            key={i}
            x1={Math.round(190 + a * 340)}
            y1={Math.round(300 + b * 30)}
            x2={Math.round(188 + a * 340)}
            y2={Math.round(312 + b * 30 + c * 10)}
            stroke="#1D1916"
            strokeOpacity={0.1 + c * 0.08}
            strokeWidth={1.5 + c}
            strokeLinecap="round"
            className="anim-shadow-rain"
            style={{ animationDuration: `${2.4 + c * 1.6}s`, animationDelay: `${-b * 3}s` }}
          />
        ))}
      </g>
    );
  }
  if (scene === "sunny") {
    // Afternoon sun from the upper right: soft shafts slanting down to the desk
    return (
      <g style={{ mixBlendMode: "screen" }}>
        {[
          [262, 40, 150, 38],
          [330, 26, 226, 26],
          [392, 52, 290, 50],
          [458, 22, 362, 22],
        ].map(([top, tw, bottom, bw], i) => (
          <path
            key={i}
            d={`M${top} 62 L${top + tw} 62 L${bottom + bw} 384 L${bottom} 384 Z`}
            fill="url(#sunbeam)"
            className="anim-beam"
            style={{ animationDuration: `${7 + i * 1.7}s`, animationDelay: `${-i * 2.3}s` }}
          />
        ))}
      </g>
    );
  }
  return null;
}

/** On the desk top, under the things standing on it. */
export function DeskFx({ scene }: { scene: SceneId }) {
  if (scene !== "sunny") return null;
  // The window's two columns of panes, stretched across the desk by the low sun
  return (
    <g fill="#FFF0C4" opacity="0.38" style={{ mixBlendMode: "screen" }}>
      <path d="M156 385 L296 385 L286 404 L142 404 Z" />
      <path d="M306 385 L446 385 L438 404 L296 404 Z" />
    </g>
  );
}

/** Over the whole room (but under the vignette). */
export function RoomFx({ scene }: { scene: SceneId }) {
  if (scene !== "snowy") return null;
  // A fireplace just out of frame on the left: warm light dancing on the walls
  return (
    <g>
      <ellipse cx="-30" cy="360" rx="380" ry="320" fill="url(#fire-glow)" className="anim-fire" />
      <ellipse
        cx="-10"
        cy="420"
        rx="240"
        ry="200"
        fill="url(#fire-glow)"
        className="anim-fire"
        style={{ animationDuration: "1.7s", animationDelay: "-0.6s" }}
      />
    </g>
  );
}
