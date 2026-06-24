// JIRA-style priority glyphs. Double chevrons for the extremes, a single arrow
// for the middle, a hollow circle for trivial. Color comes from PRIORITY_META.
import type { Priority } from "../../types";
import { PRIORITY_META } from "../../lib/priority";

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2.2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function Glyph({ priority }: { priority: Priority }) {
  switch (priority) {
    case "blocker":
      // Filled octagon with a minus — a hard stop.
      return (
        <>
          <path
            fill="currentColor"
            d="M8.2 3h7.6L21 8.2v7.6L15.8 21H8.2L3 15.8V8.2L8.2 3Z"
          />
          <line x1="8" y1="12" x2="16" y2="12" stroke="#fff" strokeWidth="2.2" />
        </>
      );
    case "critical":
      return (
        <>
          <polyline {...stroke} points="6 13 12 8 18 13" />
          <polyline {...stroke} points="6 17 12 12 18 17" />
        </>
      );
    case "major":
      return <polyline {...stroke} points="6 15 12 9 18 15" />;
    case "minor":
      return (
        <>
          <polyline {...stroke} points="6 9 12 14 18 9" />
          <polyline {...stroke} points="6 13 12 18 18 13" />
        </>
      );
    case "trivial":
      return <circle {...stroke} cx="12" cy="12" r="5" />;
  }
}

export function PriorityIcon({
  priority,
  size = 16,
}: {
  priority: Priority;
  size?: number;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      style={{ color: PRIORITY_META[priority].color, display: "block" }}
      aria-hidden="true"
    >
      <Glyph priority={priority} />
    </svg>
  );
}
