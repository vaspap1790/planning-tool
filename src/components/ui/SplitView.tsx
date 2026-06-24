// Vertically stacked panes with a draggable divider to resize their heights.
// Each pane scrolls its own table/timeline internally so headers can stick.
import { useCallback, useRef, useState, type ReactNode } from "react";

const MIN_RATIO = 0.15;
const MAX_RATIO = 0.85;

export function SplitView({ top, bottom }: { top: ReactNode; bottom: ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ratio, setRatio] = useState(0.5); // top pane share of height
  const [dragging, setDragging] = useState(false);

  const onMouseDown = useCallback(() => {
    setDragging(true);

    const onMove = (e: MouseEvent) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const next = (e.clientY - rect.top) / rect.height;
      setRatio(Math.min(MAX_RATIO, Math.max(MIN_RATIO, next)));
    };
    const onUp = () => {
      setDragging(false);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`split-container${dragging ? " dragging" : ""}`}
    >
      <div className="split-pane" style={{ flex: `0 0 ${ratio * 100}%` }}>
        {top}
      </div>
      <div
        className="split-divider"
        role="separator"
        aria-orientation="horizontal"
        title="Drag to resize"
        onMouseDown={onMouseDown}
      >
        <span className="split-grip" />
      </div>
      <div className="split-pane" style={{ flex: "1 1 0" }}>
        {bottom}
      </div>
    </div>
  );
}
