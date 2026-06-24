// Vertically stacked panes with a draggable divider to resize their heights.
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

const MIN_RATIO = 0.15;
const MAX_RATIO = 0.85;

// Scroll a pane so the given child's top aligns with the pane's top.
function scrollPaneToChild(pane: HTMLElement | null, selector: string) {
  if (!pane) return;
  const target = pane.querySelector(selector) as HTMLElement | null;
  if (!target) return;
  pane.scrollTop += target.getBoundingClientRect().top - pane.getBoundingClientRect().top;
}

export function SplitView({ top, bottom }: { top: ReactNode; bottom: ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const topPaneRef = useRef<HTMLDivElement>(null);
  const bottomPaneRef = useRef<HTMLDivElement>(null);
  const [ratio, setRatio] = useState(0.5); // top pane share of height
  const [dragging, setDragging] = useState(false);

  // On entering Split view, frame each pane on the start of its data:
  // the Initiatives panel incl. its title (top) and the Timeline grid (bottom).
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      scrollPaneToChild(topPaneRef.current, ".initiatives-panel");
      scrollPaneToChild(bottomPaneRef.current, ".timeline-scroll");
    });
    return () => cancelAnimationFrame(id);
  }, []);

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
      <div
        ref={topPaneRef}
        className="split-pane"
        style={{ flex: `0 0 ${ratio * 100}%` }}
      >
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
      <div ref={bottomPaneRef} className="split-pane" style={{ flex: "1 1 0" }}>
        {bottom}
      </div>
    </div>
  );
}
